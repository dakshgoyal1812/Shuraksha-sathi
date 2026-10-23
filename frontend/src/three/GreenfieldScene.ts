import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  Agent,
  GraphEdge,
  GraphNode,
  SimulationSnapshot,
} from '../simulation/engine';
import {
  createBridgeTrussAndBarricade,
  createBuildingFacadeTexture,
  createContactShadowTexture,
  createHazardWaterTexture,
  createJunctionNodeModel,
  createMicroReliefTexture,
  createPerimeterFoliageInstanced,
  createResidentialZoneModel,
  createRoadAsphaltTexture,
  createShelterComplexModel,
  VehicleModelFactory,
} from './proceduralModels';

export type CameraPresetId =
  | 'isometric'
  | 'topdown'
  | 'chokepoint'
  | 'north_corridor'
  | 'west_arena';

export interface LayerVisibility {
  agents: boolean;
  hazard: boolean;
  shelters: boolean;
  labels: boolean;
}

export interface SelectionTarget {
  type: 'node' | 'edge';
  id: string;
}

// Pre-allocated scratch math objects at module scope (Zero GC in render loop)
const _vecA = new THREE.Vector3();
const _vecB = new THREE.Vector3();
const _vecMid = new THREE.Vector3();
const _vecDir = new THREE.Vector3();
const _camTargetPos = new THREE.Vector3();
const _camTargetLook = new THREE.Vector3();

/**
 * Software WebGL Detection (SwiftShader, llvmpipe, software rasterizers)
 */
export function detectSoftwareWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

/**
 * Generates a high-DPI CanvasTexture sprite for 3D telemetry badges
 */
function createBadgeSprite(
  drawFn: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
  width: number,
  height: number,
  worldScaleX: number,
  worldScaleY: number,
  maxAnisotropy: number,
): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  drawFn(ctx, width, height);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;

  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(worldScaleX, worldScaleY, 1);
  sprite.renderOrder = 25;
  return sprite;
}

/**
 * Computes the centerline X coordinate of the Greenfield River at any Z coordinate
 */
function getRiverCenterX(z: number): number {
  const t = (z + 44) / 88;
  return -6 + t * 16 + Math.sin(t * Math.PI * 1.6) * 2.2;
}

export class GreenfieldSceneManager {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  public readonly isSoftwareGl: boolean;
  private maxAnisotropy: number;

  private hazardGroup = new THREE.Group();
  private edgesGroup = new THREE.Group();
  private nodesGroup = new THREE.Group();
  private sheltersGroup = new THREE.Group();
  private agentsGroup = new THREE.Group();
  private labelsGroup = new THREE.Group();

  private nodeMap = new Map<string, GraphNode>();
  private edgeMeshes = new Map<
    string,
    {
      roadMesh: THREE.Mesh;
      leftRailMat: THREE.MeshStandardMaterial;
      rightRailMat: THREE.MeshStandardMaterial;
      contraStripeMesh: THREE.Mesh;
      bridgeGroup: THREE.Group | null;
      badgeSprite: THREE.Sprite | null;
      blockedXSprite: THREE.Sprite | null;
      lastBadgeStateKey: string;
    }
  >();
  private shelterSprites = new Map<
    string,
    { sprite: THREE.Sprite; lastKey: string }
  >();
  private vehiclePool = new Map<string, THREE.Group>();
  private vehicleFactory: VehicleModelFactory;
  private shadowTex: THREE.CanvasTexture;
  private waterTex: THREE.CanvasTexture;
  private asphaltTex: THREE.CanvasTexture;

  private interactables: THREE.Object3D[] = [];
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private onSelectCallback: (target: SelectionTarget | null) => void;

  private isCameraTransitioning = false;
  private desiredCamPos = new THREE.Vector3(0, 68, 56);
  private desiredCamLook = new THREE.Vector3(0, 0, 1);

  private frameId = 0;
  private isDisposed = false;
  private clock = new THREE.Clock();
  private latestSnapshot: SimulationSnapshot;
  private isPlaying = true;
  private simSpeedMultiplier = 1.0;
  private onSimTickCallback: (dtSimSec: number) => SimulationSnapshot;
  private simAccumulatorSec = 0;

  constructor(
    container: HTMLElement,
    initialSnapshot: SimulationSnapshot,
    onSimTick: (dtSimSec: number) => SimulationSnapshot,
    onSelect: (target: SelectionTarget | null) => void,
  ) {
    this.container = container;
    this.latestSnapshot = initialSnapshot;
    this.onSimTickCallback = onSimTick;
    this.onSelectCallback = onSelect;
    this.isSoftwareGl = detectSoftwareWebGL();

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.setPixelRatio(
      this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2),
    );
    this.renderer.setSize(width, height);
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(this.renderer.domElement);
    this.maxAnisotropy = this.renderer.capabilities.getMaxAnisotropy();

    // Realistic Daylight Sky & Atmospheric Horizon Fog
    this.scene = new THREE.Scene();
    const horizonHex = 0xdbeafe;
    this.scene.background = new THREE.Color(horizonHex);
    this.scene.fog = new THREE.FogExp2(horizonHex, 0.0042);

    // Studio Environment Reflection (RoomEnvironment + PMREMGenerator)
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(
      new RoomEnvironment(),
      0.04,
    ).texture;
    pmremGenerator.dispose();

    // Camera & OrbitControls
    this.camera = new THREE.PerspectiveCamera(44, width / height, 0.5, 360);
    this.camera.position.set(0, 68, 56);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(0, 0, 1);
    this.controls.enableDamping = !this.isSoftwareGl;
    this.controls.dampingFactor = 0.06;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.06;
    this.controls.minDistance = 16;
    this.controls.maxDistance = 145;
    this.controls.update();

    this.controls.addEventListener('start', () => {
      this.isCameraTransitioning = false;
    });

    // Natural Sun + Sky Hemisphere Lighting Rig
    this.setupLighting();

    // Shared Procedural Textures
    this.shadowTex = createContactShadowTexture();
    this.waterTex = createHazardWaterTexture(this.maxAnisotropy);
    this.asphaltTex = createRoadAsphaltTexture(this.maxAnisotropy);
    this.vehicleFactory = new VehicleModelFactory(this.shadowTex);

    // Assemble Sculpted 3D World Layers
    this.buildSculptedTopographicalWorld(initialSnapshot);
    this.buildHazardInundationZone();

    this.scene.add(this.hazardGroup);
    this.scene.add(this.edgesGroup);
    this.scene.add(this.nodesGroup);
    this.scene.add(this.sheltersGroup);
    this.scene.add(this.agentsGroup);
    this.scene.add(this.labelsGroup);

    this.buildGraphGeometry(initialSnapshot);
    this.syncSnapshot(initialSnapshot);

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    this.bindEvents();
    this.startLoop();
  }

  private setupLighting(): void {
    // Natural Daylight Sky Blue / Warm Meadow Ground HemisphereLight
    const hemiLight = new THREE.HemisphereLight(0xe0f2fe, 0x65a30d, 0.95);
    hemiLight.position.set(0, 75, 0);
    this.scene.add(hemiLight);

    // Warm Golden-Hour Sunlight Directional Key Light
    const sunLight = new THREE.DirectionalLight(0xfff7ed, 1.75);
    sunLight.position.set(45, 72, 48);
    sunLight.castShadow = !this.isSoftwareGl;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    const d = 64;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 175;
    sunLight.shadow.bias = -0.0005;
    sunLight.shadow.normalBias = 0.02;
    this.scene.add(sunLight);

    // Cool Atmospheric Skylight Bounce Fill
    const rimLight = new THREE.DirectionalLight(0xbae6fd, 0.55);
    rimLight.position.set(-48, 40, -45);
    this.scene.add(rimLight);
  }

  /**
   * Builds a sculpted 3D topographical valley with vertex-colored elevation strata
   * (carved river channel, lush green valley meadows, urban terraced blocks, and surrounding mountain ridges)
   */
  private buildSculptedTopographicalWorld(snapshot: SimulationSnapshot): void {
    const microRelief = createMicroReliefTexture(this.maxAnisotropy);

    // 1. Sculpted Multi-Biome Valley & Mountain Terrain Mesh
    const terrainGeo = new THREE.PlaneGeometry(280, 240, 96, 84);
    terrainGeo.rotateX(-Math.PI / 2);

    const posAttr = terrainGeo.attributes.position;
    const colors = new Float32Array(posAttr.count * 3);
    const col = new THREE.Color();

    for (let i = 0; i < posAttr.count; i++) {
      const vx = posAttr.getX(i);
      const vz = posAttr.getZ(i);

      const riverCenter = getRiverCenterX(vz);
      const distToRiver = Math.abs(vx - riverCenter);

      // Distance outside the playable city basin
      const dx = Math.max(0, Math.abs(vx) - 44);
      const dz = Math.max(0, Math.abs(vz) - 31);
      const rimDist = Math.hypot(dx, dz);

      let vy = 0;
      if (distToRiver < 5.2) {
        // Carved deep riverbed channel
        vy = -0.65 * Math.cos((distToRiver / 5.2) * (Math.PI / 2));
      } else if (rimDist > 0) {
        // Surrounding mountain hills and scenic ridges
        const hillWave =
          Math.sin(vx * 0.08) * Math.cos(vz * 0.08) * 2.4 +
          Math.sin(vx * 0.17 + vz * 0.13) * 1.1;
        vy =
          Math.min(14.5, Math.pow(rimDist * 0.14, 1.45) * 2.6) +
          Math.max(0, hillWave * Math.min(1, rimDist / 14));
      }

      posAttr.setY(i, vy);

      // Vertex Color Biome Stratification
      if (vy < -0.15) {
        // Riverbank stone & wet sand
        col.setHex(0x64748b);
      } else if (distToRiver < 8.5 && rimDist === 0) {
        // Lush riparian riverbank grass
        col.setHex(0x4d7c0f);
      } else if (vy < 1.2) {
        // Greenfield Valley Meadow & Urban Parkland
        const noise = (Math.sin(vx * 0.25) * Math.cos(vz * 0.25) + 1) * 0.5;
        col.setHex(noise > 0.5 ? 0x5c8d46 : 0x699b52);
      } else if (vy < 5.2) {
        // Mountain Foothills Forest Green
        col.setHex(0x3f6212);
      } else if (vy < 9.5) {
        // Exposed Granite / Limestone Mountain Slopes
        col.setHex(0x78716c);
      } else {
        // High Alpine Ridge Peaks
        col.setHex(0xd6d3d1);
      }

      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }

    terrainGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    terrainGeo.computeVertexNormals();

    const terrainMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.88,
      metalness: 0.04,
      bumpMap: microRelief,
      bumpScale: 0.12,
    });
    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    terrainMesh.receiveShadow = true;
    this.scene.add(terrainMesh);

    // 2. Concrete Riverbank Embankment Walls along the main river channel
    for (const side of [-4.6, 4.6]) {
      const bankPoints: THREE.Vector3[] = [];
      for (let z = -42; z <= 42; z += 4) {
        bankPoints.push(new THREE.Vector3(getRiverCenterX(z) + side, 0.08, z));
      }
      const bankCurve = new THREE.CatmullRomCurve3(bankPoints);
      const bankGeo = new THREE.TubeGeometry(bankCurve, 44, 0.28, 6, false);
      const bankMat = new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        roughness: 0.82,
        metalness: 0.1,
      });
      const bankWall = new THREE.Mesh(bankGeo, bankMat);
      bankWall.receiveShadow = true;
      this.scene.add(bankWall);
    }

    // 3. Instanced Multi-Tiered Forest & Riverbank Trees (260 trees)
    const foliage = createPerimeterFoliageInstanced();
    this.scene.add(foliage);

    // 4. Instanced Ambient Urban Context Buildings in City Blocks (non-overlapping with nodes/edges)
    this.buildUrbanContextBlocks(snapshot);
  }

  /**
   * Populates empty spaces between highway corridors with realistic low-rise city buildings
   * so Greenfield City looks like a dense, authentic urban environment.
   */
  private buildUrbanContextBlocks(snapshot: SimulationSnapshot): void {
    const facadeTex = createBuildingFacadeTexture(
      '#e2e8f0',
      '#334155',
      '#93c5fd',
      this.maxAnisotropy,
    );

    const bldgGeo = new THREE.BoxGeometry(1.3, 1.0, 1.1);
    bldgGeo.translate(0, 0.5, 0);
    const bldgMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: facadeTex,
      roughness: 0.55,
      metalness: 0.15,
    });

    const roofGeo = new THREE.BoxGeometry(1.38, 0.12, 1.18);
    roofGeo.translate(0, 1.04, 0);
    const roofMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.7,
    });

    const placements: { x: number; z: number; sx: number; sy: number; sz: number; rot: number; tint: number }[] = [];
    let seed = 5150;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    const nodeList = snapshot.nodes;
    const edgeList = snapshot.edges;
    const nodeLookup = new Map(nodeList.map((n) => [n.id, n]));

    const isSafeLocation = (px: number, pz: number): boolean => {
      // Keep out of river flood zone
      if (Math.abs(px - getRiverCenterX(pz)) < 8.5) return false;
      // Keep clear of all 20 nodes
      for (const n of nodeList) {
        if (Math.hypot(px - n.x, pz - n.z) < 5.2) return false;
      }
      // Keep clear of all 32 road corridors
      for (const e of edgeList) {
        const nA = nodeLookup.get(e.from);
        const nB = nodeLookup.get(e.to);
        if (!nA || !nB) continue;
        const l2 = Math.pow(nB.x - nA.x, 2) + Math.pow(nB.z - nA.z, 2);
        if (l2 === 0) continue;
        const t = Math.max(
          0,
          Math.min(
            1,
            ((px - nA.x) * (nB.x - nA.x) + (pz - nA.z) * (nB.z - nA.z)) / l2,
          ),
        );
        const projX = nA.x + t * (nB.x - nA.x);
        const projZ = nA.z + t * (nB.z - nA.z);
        if (Math.hypot(px - projX, pz - projZ) < 2.8) return false;
      }
      return true;
    };

    const palette = [0xf8fafc, 0xe2e8f0, 0xfef3c7, 0xdbeafe, 0xf1f5f9];
    for (let attempt = 0; attempt < 260 && placements.length < 75; attempt++) {
      const px = (rand() - 0.5) * 76;
      const pz = (rand() - 0.5) * 52;
      if (isSafeLocation(px, pz)) {
        placements.push({
          x: px,
          z: pz,
          sx: 0.75 + rand() * 0.7,
          sy: 0.65 + rand() * 1.15,
          sz: 0.75 + rand() * 0.7,
          rot: (Math.floor(rand() * 4) * Math.PI) / 2,
          tint: palette[Math.floor(rand() * palette.length)],
        });
      }
    }

    if (placements.length === 0) return;

    const bodyInst = new THREE.InstancedMesh(bldgGeo, bldgMat, placements.length);
    const roofInst = new THREE.InstancedMesh(roofGeo, roofMat, placements.length);
    bodyInst.castShadow = true;
    bodyInst.receiveShadow = true;

    const dummy = new THREE.Object3D();
    const c = new THREE.Color();
    for (let i = 0; i < placements.length; i++) {
      const p = placements[i];
      dummy.position.set(p.x, 0.0, p.z);
      dummy.rotation.set(0, p.rot, 0);
      dummy.scale.set(p.sx, p.sy, p.sz);
      dummy.updateMatrix();
      bodyInst.setMatrixAt(i, dummy.matrix);
      roofInst.setMatrixAt(i, dummy.matrix);
      c.setHex(p.tint);
      bodyInst.setColorAt(i, c);
    }

    bodyInst.instanceMatrix.needsUpdate = true;
    roofInst.instanceMatrix.needsUpdate = true;
    if (bodyInst.instanceColor) bodyInst.instanceColor.needsUpdate = true;
    bodyInst.computeBoundingSphere();
    roofInst.computeBoundingSphere();

    this.scene.add(bodyInst);
    this.scene.add(roofInst);
  }

  /**
   * Builds the North-to-South Winding River & Flood Hazard Inundation Polygon
   */
  private buildHazardInundationZone(): void {
    // 1. Deep Permanent River Water Channel
    const riverShape = new THREE.Shape();
    riverShape.moveTo(-10, -44);
    riverShape.quadraticCurveTo(-5, -22, -3, -8);
    riverShape.quadraticCurveTo(-2, 6, 3, 20);
    riverShape.quadraticCurveTo(6, 32, 7, 44);
    riverShape.lineTo(14, 44);
    riverShape.quadraticCurveTo(13, 30, 9, 18);
    riverShape.quadraticCurveTo(6, 4, 5, -10);
    riverShape.quadraticCurveTo(3, -24, -2, -44);
    riverShape.closePath();

    const riverGeo = new THREE.ExtrudeGeometry(riverShape, {
      depth: 0.12,
      bevelEnabled: false,
    });
    riverGeo.rotateX(Math.PI / 2);
    const riverMat = new THREE.MeshPhysicalMaterial({
      color: 0x0284c7,
      map: this.waterTex,
      roughness: 0.14,
      metalness: 0.1,
      clearcoat: 0.9,
      clearcoatRoughness: 0.1,
    });
    const riverMesh = new THREE.Mesh(riverGeo, riverMat);
    riverMesh.position.y = -0.02;
    riverMesh.receiveShadow = true;
    this.scene.add(riverMesh);

    // 2. Toggleable Flood Hazard Inundation Overflow Polygon
    const floodShape = new THREE.Shape();
    floodShape.moveTo(-14, -44);
    floodShape.quadraticCurveTo(-8, -22, -6, -8);
    floodShape.quadraticCurveTo(-5, 6, 0, 20);
    floodShape.quadraticCurveTo(4, 32, 5, 44);
    floodShape.lineTo(18, 44);
    floodShape.quadraticCurveTo(16, 30, 12, 18);
    floodShape.quadraticCurveTo(9, 4, 8, -10);
    floodShape.quadraticCurveTo(6, -24, 0, -44);
    floodShape.closePath();

    const floodGeo = new THREE.ExtrudeGeometry(floodShape, {
      depth: 0.16,
      bevelEnabled: true,
      bevelThickness: 0.04,
      bevelSize: 0.15,
      bevelSegments: 2,
    });
    floodGeo.rotateX(Math.PI / 2);

    const floodMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      map: this.waterTex,
      roughness: 0.18,
      metalness: 0.08,
      clearcoat: 0.85,
      clearcoatRoughness: 0.12,
      transparent: true,
      opacity: 0.52,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    const floodMesh = new THREE.Mesh(floodGeo, floodMat);
    floodMesh.position.y = 0.18;
    floodMesh.receiveShadow = true;
    this.hazardGroup.add(floodMesh);

    // 3. Flood Hazard Perimeter Warning Line
    const pts = floodShape.getPoints(48);
    const borderPoints3D = pts.map((p) => new THREE.Vector3(p.x, 0.24, p.y));
    borderPoints3D.push(borderPoints3D[0].clone());
    const borderGeo = new THREE.BufferGeometry().setFromPoints(borderPoints3D);
    const borderMat = new THREE.LineBasicMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.85,
    });
    const borderLine = new THREE.Line(borderGeo, borderMat);
    this.hazardGroup.add(borderLine);
  }

  private buildGraphGeometry(snapshot: SimulationSnapshot): void {
    this.nodeMap.clear();
    for (const node of snapshot.nodes) {
      this.nodeMap.set(node.id, node);
    }

    // 1. Build 20 Detailed 3D Node Structures + Labels
    for (const node of snapshot.nodes) {
      let modelGroup: THREE.Group;
      if (node.category === 'shelter') {
        modelGroup = createShelterComplexModel(
          this.shadowTex,
          this.maxAnisotropy,
        );
        modelGroup.position.set(node.x, 0.02, node.z);
        this.sheltersGroup.add(modelGroup);

        const shSprite = this.createShelterBadgeSprite(node);
        shSprite.position.set(node.x, 5.2, node.z);
        this.sheltersGroup.add(shSprite);
        this.shelterSprites.set(node.id, {
          sprite: shSprite,
          lastKey: `${node.occupied}/${node.capacity}`,
        });
      } else if (node.category === 'residential') {
        modelGroup = createResidentialZoneModel(
          this.shadowTex,
          node.inHazardZone,
          this.maxAnisotropy,
        );
        modelGroup.position.set(node.x, 0.02, node.z);
        this.nodesGroup.add(modelGroup);

        const resLabel = this.createNodeLabelSprite(node);
        resLabel.position.set(node.x, 4.1, node.z + 1.2);
        this.labelsGroup.add(resLabel);
      } else {
        const isBridge = node.shortCode.startsWith('BRG');
        modelGroup = createJunctionNodeModel(this.shadowTex, isBridge);
        modelGroup.position.set(node.x, 0.02, node.z);
        this.nodesGroup.add(modelGroup);

        const jctLabel = this.createNodeLabelSprite(node);
        jctLabel.position.set(node.x, 3.0, node.z + 1.1);
        this.labelsGroup.add(jctLabel);
      }

      // Proxy hitbox for raycast selection
      const hitGeo = new THREE.CylinderGeometry(2.8, 2.8, 3.5, 12);
      const hitMat = new THREE.MeshBasicMaterial({ visible: false });
      const hitMesh = new THREE.Mesh(hitGeo, hitMat);
      hitMesh.position.set(node.x, 1.6, node.z);
      hitMesh.userData = { selectionType: 'node', id: node.id };
      this.scene.add(hitMesh);
      this.interactables.push(hitMesh);
    }

    // 2. Build 32 Realistic Multi-Lane Asphalt Highway Corridors + BPR Status Shoulder Rails
    const embankmentMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.85,
      metalness: 0.08,
    });

    for (const edge of snapshot.edges) {
      const nA = this.nodeMap.get(edge.from);
      const nB = this.nodeMap.get(edge.to);
      if (!nA || !nB) continue;

      _vecA.set(nA.x, 0.26, nA.z);
      _vecB.set(nB.x, 0.26, nB.z);
      const dist = _vecA.distanceTo(_vecB);
      _vecMid.addVectors(_vecA, _vecB).multiplyScalar(0.5);
      const angleY = Math.atan2(nB.x - nA.x, nB.z - nA.z);

      const roadWidth = edge.isBridge ? 1.65 : 1.38;

      // Stepped Concrete Highway Embankment Base
      const embankGeo = new THREE.BoxGeometry(roadWidth + 0.42, 0.14, dist);
      const embankMesh = new THREE.Mesh(embankGeo, embankmentMat);
      embankMesh.position.set(_vecMid.x, 0.19, _vecMid.z);
      embankMesh.rotation.y = angleY;
      embankMesh.receiveShadow = true;
      this.edgesGroup.add(embankMesh);

      // Textured Multi-Lane Asphalt Road Surface
      const roadGeo = new THREE.BoxGeometry(roadWidth, 0.12, dist);
      const roadMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        map: this.asphaltTex,
        roughness: 0.72,
        metalness: 0.12,
      });
      const roadMesh = new THREE.Mesh(roadGeo, roadMat);
      roadMesh.position.copy(_vecMid);
      roadMesh.rotation.y = angleY;
      roadMesh.receiveShadow = true;
      roadMesh.userData = { selectionType: 'edge', id: edge.id };
      this.edgesGroup.add(roadMesh);
      this.interactables.push(roadMesh);

      // Left & Right Glowing BPR Traffic Telemetry Barrier Rails along the Highway Shoulders
      const railGeo = new THREE.BoxGeometry(0.18, 0.18, dist * 0.96);
      const leftRailMat = new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        emissive: 0x0284c7,
        emissiveIntensity: 0.45,
        roughness: 0.25,
      });
      const rightRailMat = leftRailMat.clone();

      const corridorGroup = new THREE.Group();
      corridorGroup.position.copy(_vecMid);
      corridorGroup.rotation.y = angleY;

      const leftRail = new THREE.Mesh(railGeo, leftRailMat);
      leftRail.position.set(-roadWidth * 0.52, 0.08, 0);
      corridorGroup.add(leftRail);

      const rightRail = new THREE.Mesh(railGeo, rightRailMat);
      rightRail.position.set(roadWidth * 0.52, 0.08, 0);
      corridorGroup.add(rightRail);

      this.edgesGroup.add(corridorGroup);

      // Centerline Contra-Flow highlight strip
      const stripeGeo = new THREE.BoxGeometry(0.32, 0.05, dist * 0.92);
      const stripeMat = new THREE.MeshBasicMaterial({
        color: 0x14b8a6,
        visible: edge.isContraFlow,
      });
      const contraStripeMesh = new THREE.Mesh(stripeGeo, stripeMat);
      contraStripeMesh.position.set(_vecMid.x, _vecMid.y + 0.09, _vecMid.z);
      contraStripeMesh.rotation.y = angleY;
      this.edgesGroup.add(contraStripeMesh);

      // Bridge Truss or Blocked Barricade Group
      let bridgeGroup: THREE.Group | null = null;
      if (edge.isBridge || edge.isBlocked) {
        bridgeGroup = createBridgeTrussAndBarricade(dist, edge.isBlocked);
        bridgeGroup.position.copy(_vecMid);
        bridgeGroup.rotation.y = angleY + Math.PI / 2;
        this.edgesGroup.add(bridgeGroup);
      }

      this.edgeMeshes.set(edge.id, {
        roadMesh,
        leftRailMat,
        rightRailMat,
        contraStripeMesh,
        bridgeGroup,
        badgeSprite: null,
        blockedXSprite: null,
        lastBadgeStateKey: '',
      });
    }
  }

  private createShelterBadgeSprite(node: GraphNode): THREE.Sprite {
    const occ = node.occupied ?? 0;
    const cap = node.capacity ?? 200;
    const isFull = occ >= cap;

    return createBadgeSprite(
      (ctx, w, h) => {
        ctx.clearRect(0, 0, w, h);

        ctx.font = '700 22px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.lineWidth = 5;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.96)';
        ctx.strokeText(node.label, w / 2, 28);
        ctx.fillStyle = '#0f172a';
        ctx.fillText(node.label, w / 2, 28);

        // Green Shield Circle
        const cx = w / 2;
        const cy = 78;
        ctx.beginPath();
        ctx.arc(cx, cy, 34, 0, Math.PI * 2);
        ctx.fillStyle = '#059669';
        ctx.fill();
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();

        // White Inner Shield Icon
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(cx, cy - 16);
        ctx.lineTo(cx + 13, cy - 10);
        ctx.lineTo(cx + 13, cy + 2);
        ctx.quadraticCurveTo(cx + 13, cy + 14, cx, cy + 20);
        ctx.quadraticCurveTo(cx - 13, cy + 14, cx - 13, cy + 2);
        ctx.lineTo(cx - 13, cy - 10);
        ctx.closePath();
        ctx.fill();

        const badgeText = isFull
          ? `[FULL] ${occ}/${cap}`
          : `${occ}/${cap} BEDS`;
        const bw = 186;
        const bh = 34;
        const bx = (w - bw) / 2;
        const by = 122;

        ctx.fillStyle = isFull ? '#065f46' : '#ffffff';
        ctx.strokeStyle = '#059669';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect(bx, by, bw, bh, 6);
        ctx.fill();
        ctx.stroke();

        ctx.font = '700 18px "JetBrains Mono", monospace';
        ctx.fillStyle = isFull ? '#ffffff' : '#065f46';
        ctx.fillText(badgeText, w / 2, by + 23);
      },
      384,
      172,
      13.5,
      6.0,
      this.maxAnisotropy,
    );
  }

  private createNodeLabelSprite(node: GraphNode): THREE.Sprite {
    const isRes = node.category === 'residential';
    return createBadgeSprite(
      (ctx, w, h) => {
        ctx.clearRect(0, 0, w, h);

        if (isRes) {
          const cx = w / 2;
          const cy = 28;
          ctx.beginPath();
          ctx.arc(cx, cy, 20, 0, Math.PI * 2);
          ctx.fillStyle = '#0284c7';
          ctx.fill();
          ctx.lineWidth = 3;
          ctx.strokeStyle = '#ffffff';
          ctx.stroke();

          ctx.font = '700 16px "JetBrains Mono", monospace';
          ctx.textAlign = 'center';
          ctx.fillStyle = '#ffffff';
          ctx.fillText('H', cx, cy + 6);
        }

        ctx.font = '700 19px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.lineWidth = 5;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.96)';
        ctx.strokeText(node.label, w / 2, isRes ? 72 : 46);
        ctx.fillStyle = '#0f172a';
        ctx.fillText(node.label, w / 2, isRes ? 72 : 46);
      },
      320,
      96,
      10.2,
      3.1,
      this.maxAnisotropy,
    );
  }

  private createBottleneckLoadSprite(
    loadPct: number,
    isContraFlow: boolean,
  ): THREE.Sprite {
    return createBadgeSprite(
      (ctx, w, h) => {
        ctx.clearRect(0, 0, w, h);
        const bw = 188;
        const bh = 44;
        const bx = (w - bw) / 2;
        const by = (h - bh) / 2;

        ctx.fillStyle = isContraFlow
          ? 'rgba(13, 148, 136, 0.96)'
          : 'rgba(220, 38, 38, 0.96)';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect(bx, by, bw, bh, 7);
        ctx.fill();
        ctx.stroke();

        ctx.font = '700 22px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`${loadPct}% LOAD`, w / 2, by + 30);
      },
      220,
      64,
      7.4,
      2.15,
      this.maxAnisotropy,
    );
  }

  private createBlockedXSprite(): THREE.Sprite {
    return createBadgeSprite(
      (ctx, w, h) => {
        ctx.clearRect(0, 0, w, h);
        const cx = w / 2;
        const cy = h / 2;
        ctx.beginPath();
        ctx.arc(cx, cy, 28, 0, Math.PI * 2);
        ctx.fillStyle = '#dc2626';
        ctx.fill();
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(cx - 11, cy - 11);
        ctx.lineTo(cx + 11, cy + 11);
        ctx.moveTo(cx + 11, cy - 11);
        ctx.lineTo(cx - 11, cy + 11);
        ctx.stroke();
      },
      80,
      80,
      3.2,
      3.2,
      this.maxAnisotropy,
    );
  }

  public syncSnapshot(snapshot: SimulationSnapshot): void {
    this.latestSnapshot = snapshot;

    for (const node of snapshot.nodes) {
      this.nodeMap.set(node.id, node);
      if (node.category === 'shelter') {
        const entry = this.shelterSprites.get(node.id);
        const key = `${node.occupied}/${node.capacity}`;
        if (entry && entry.lastKey !== key) {
          this.sheltersGroup.remove(entry.sprite);
          entry.sprite.material.map?.dispose();
          entry.sprite.material.dispose();
          const newSprite = this.createShelterBadgeSprite(node);
          newSprite.position.set(node.x, 5.2, node.z);
          this.sheltersGroup.add(newSprite);
          this.shelterSprites.set(node.id, { sprite: newSprite, lastKey: key });
        }
      }
    }

    // Update 32 Road Edges & Bottleneck Severity Badges
    for (const edge of snapshot.edges) {
      const item = this.edgeMeshes.get(edge.id);
      if (!item) continue;

      const nA = this.nodeMap.get(edge.from);
      const nB = this.nodeMap.get(edge.to);
      if (!nA || !nB) continue;

      _vecMid.set((nA.x + nB.x) * 0.5, 0.26, (nA.z + nB.z) * 0.5);
      const dist = Math.hypot(nB.x - nA.x, nB.z - nA.z);
      const angleY = Math.atan2(nB.x - nA.x, nB.z - nA.z);

      item.contraStripeMesh.visible = edge.isContraFlow && !edge.isBlocked;

      // Update highway shoulder telemetry rails while keeping realistic asphalt lane surface visible
      let railHex = 0x0284c7;
      let roadTintHex = 0xffffff;
      if (edge.isBlocked) {
        railHex = 0x991b1b;
        roadTintHex = 0xfca5a5;
      } else if (edge.loadRatio >= 1.6) {
        railHex = 0xef4444;
        roadTintHex = 0xfecaca;
      } else if (edge.isContraFlow) {
        railHex = 0x14b8a6;
        roadTintHex = 0x99f6e4;
      }

      item.leftRailMat.color.setHex(railHex);
      item.leftRailMat.emissive.setHex(railHex);
      item.rightRailMat.color.setHex(railHex);
      item.rightRailMat.emissive.setHex(railHex);
      (item.roadMesh.material as THREE.MeshStandardMaterial).color.setHex(
        roadTintHex,
      );

      const loadPct = Math.round(edge.loadRatio * 100);
      const showBottleneckBadge = !edge.isBlocked && loadPct >= 165;
      const stateKey = `${edge.isBlocked}_${showBottleneckBadge ? Math.round(loadPct / 5) * 5 : 0}_${edge.isContraFlow}`;

      if (item.lastBadgeStateKey !== stateKey) {
        item.lastBadgeStateKey = stateKey;

        if (item.bridgeGroup) {
          this.edgesGroup.remove(item.bridgeGroup);
        }
        if (edge.isBridge || edge.isBlocked) {
          item.bridgeGroup = createBridgeTrussAndBarricade(dist, edge.isBlocked);
          item.bridgeGroup.position.copy(_vecMid);
          item.bridgeGroup.rotation.y = angleY + Math.PI / 2;
          this.edgesGroup.add(item.bridgeGroup);
        } else {
          item.bridgeGroup = null;
        }

        if (item.badgeSprite) {
          this.labelsGroup.remove(item.badgeSprite);
          item.badgeSprite.material.map?.dispose();
          item.badgeSprite.material.dispose();
          item.badgeSprite = null;
        }
        if (item.blockedXSprite) {
          this.labelsGroup.remove(item.blockedXSprite);
          item.blockedXSprite.material.map?.dispose();
          item.blockedXSprite.material.dispose();
          item.blockedXSprite = null;
        }

        if (edge.isBlocked) {
          const xSprite = this.createBlockedXSprite();
          xSprite.position.set(_vecMid.x, 3.1, _vecMid.z);
          this.labelsGroup.add(xSprite);
          item.blockedXSprite = xSprite;
        } else if (showBottleneckBadge) {
          const bSprite = this.createBottleneckLoadSprite(
            loadPct,
            edge.isContraFlow,
          );
          bSprite.position.set(_vecMid.x, 2.55, _vecMid.z);
          this.labelsGroup.add(bSprite);
          item.badgeSprite = bSprite;
        }
      }
    }

    this.syncVehiclePositions(snapshot.agents);
  }

  private syncVehiclePositions(agents: Agent[]): void {
    for (const agent of agents) {
      let veh = this.vehiclePool.get(agent.id);
      if (!veh) {
        veh = this.vehicleFactory.createVehicleGroup(agent.mobilityClass);
        this.vehiclePool.set(agent.id, veh);
        this.agentsGroup.add(veh);
      }

      if (agent.status === 'sheltered') {
        veh.visible = false;
        continue;
      }

      const nA = this.nodeMap.get(agent.currentNodeId);
      const nB = this.nodeMap.get(agent.nextNodeId);
      if (!nA || !nB) {
        veh.visible = false;
        continue;
      }

      veh.visible = true;
      const t = THREE.MathUtils.clamp(agent.edgeProgress, 0, 1);
      _vecA.set(nA.x, 0.34, nA.z);
      _vecB.set(nB.x, 0.34, nB.z);

      _vecDir.subVectors(_vecB, _vecA).normalize();
      const laneOffsetX = -_vecDir.z * 0.32;
      const laneOffsetZ = _vecDir.x * 0.32;

      veh.position.set(
        THREE.MathUtils.lerp(_vecA.x, _vecB.x, t) + laneOffsetX,
        0.34,
        THREE.MathUtils.lerp(_vecA.z, _vecB.z, t) + laneOffsetZ,
      );

      const heading = Math.atan2(_vecDir.x, -_vecDir.z);
      veh.rotation.y = -heading + Math.PI / 2;
    }
  }

  public setLayerVisibility(layers: LayerVisibility): void {
    this.agentsGroup.visible = layers.agents;
    this.hazardGroup.visible = layers.hazard;
    this.sheltersGroup.visible = layers.shelters;
    this.labelsGroup.visible = layers.labels;
  }

  public setPlaying(playing: boolean): void {
    this.isPlaying = playing;
  }

  public setSimSpeed(multiplier: number): void {
    this.simSpeedMultiplier = multiplier;
  }

  public zoomCamera(factor: number): void {
    this.isCameraTransitioning = false;
    _vecDir.subVectors(this.camera.position, this.controls.target);
    const currentDist = _vecDir.length();
    const nextDist = THREE.MathUtils.clamp(currentDist * factor, 18, 135);
    _vecDir.normalize().multiplyScalar(nextDist);
    this.camera.position.copy(this.controls.target).add(_vecDir);
    this.controls.update();
  }

  public setCameraPreset(preset: CameraPresetId): void {
    switch (preset) {
      case 'topdown':
        this.desiredCamPos.set(0, 86, 3);
        this.desiredCamLook.set(0, 0, 1);
        break;
      case 'chokepoint':
        this.desiredCamPos.set(-8, 25, 22);
        this.desiredCamLook.set(2, 0, 2);
        break;
      case 'north_corridor':
        this.desiredCamPos.set(6, 26, -4);
        this.desiredCamLook.set(12, 0, -22);
        break;
      case 'west_arena':
        this.desiredCamPos.set(-14, 28, 30);
        this.desiredCamLook.set(-32, 0, 12);
        break;
      case 'isometric':
      default:
        this.desiredCamPos.set(0, 68, 56);
        this.desiredCamLook.set(0, 0, 1);
        break;
    }
    this.isCameraTransitioning = true;
  }

  public focusOnTarget(target: SelectionTarget): void {
    if (target.type === 'node') {
      const node = this.nodeMap.get(target.id);
      if (node) {
        this.desiredCamLook.set(node.x, 0, node.z);
        this.desiredCamPos.set(node.x + 8, 26, node.z + 22);
        this.isCameraTransitioning = true;
      }
    } else {
      const edge = this.latestSnapshot.edges.find((e) => e.id === target.id);
      if (edge) {
        const nA = this.nodeMap.get(edge.from);
        const nB = this.nodeMap.get(edge.to);
        if (nA && nB) {
          const mx = (nA.x + nB.x) * 0.5;
          const mz = (nA.z + nB.z) * 0.5;
          this.desiredCamLook.set(mx, 0, mz);
          this.desiredCamPos.set(mx + 6, 24, mz + 20);
          this.isCameraTransitioning = true;
        }
      }
    }
  }

  private bindEvents(): void {
    window.addEventListener('resize', this.handleResize);
    this.renderer.domElement.addEventListener(
      'pointerdown',
      this.handlePointerDown,
    );
  }

  private handleResize = (): void => {
    if (this.isDisposed) return;
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  private handlePointerDown = (ev: PointerEvent): void => {
    if (ev.button !== 0) return;
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects(this.interactables, false);
    if (hits.length > 0) {
      const ud = hits[0].object.userData;
      if (ud && ud.selectionType && ud.id) {
        this.onSelectCallback({ type: ud.selectionType, id: ud.id });
      }
    }
  };

  private afterDraw(cb: () => void): void {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    if (!gl || typeof gl.fenceSync !== 'function') {
      this.frameId = window.setTimeout(cb, 80);
      return;
    }
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.isDisposed) return;
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private startLoop(): void {
    const tick = () => {
      if (this.isDisposed) return;
      const dt = Math.min(this.clock.getDelta(), 0.1);

      this.waterTex.offset.y -= dt * 0.14;

      if (this.isPlaying) {
        this.simAccumulatorSec += dt * this.simSpeedMultiplier;
        if (this.simAccumulatorSec >= 0.18) {
          const stepSimSec = this.simAccumulatorSec * 3.8;
          this.simAccumulatorSec = 0;
          const nextSnap = this.onSimTickCallback(stepSimSec);
          this.syncSnapshot(nextSnap);
        }
      }

      if (this.isCameraTransitioning) {
        const alpha = 1 - Math.exp(-5.5 * dt);
        _camTargetPos.copy(this.camera.position).lerp(this.desiredCamPos, alpha);
        _camTargetLook
          .copy(this.controls.target)
          .lerp(this.desiredCamLook, alpha);
        this.camera.position.copy(_camTargetPos);
        this.controls.target.copy(_camTargetLook);

        if (
          this.camera.position.distanceToSquared(this.desiredCamPos) < 0.08 &&
          this.controls.target.distanceToSquared(this.desiredCamLook) < 0.08
        ) {
          this.isCameraTransitioning = false;
        }
      }

      this.controls.update();
      this.renderer.render(this.scene, this.camera);

      if (this.isSoftwareGl) {
        this.afterDraw(tick);
      } else {
        this.frameId = requestAnimationFrame(tick);
      }
    };

    tick();
  }

  public dispose(): void {
    this.isDisposed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);
    window.removeEventListener('resize', this.handleResize);
    this.renderer.domElement.removeEventListener(
      'pointerdown',
      this.handlePointerDown,
    );
    this.controls.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
