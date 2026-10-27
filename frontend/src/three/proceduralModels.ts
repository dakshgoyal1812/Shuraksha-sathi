import * as THREE from 'three';
import { AgentMobilityClass } from '../simulation/engine';

/**
 * Generates a soft radial contact shadow CanvasTexture to ground 3D structures and vehicles
 */
export function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(64, 64, 8, 64, 64, 60);
  grad.addColorStop(0, 'rgba(15, 23, 42, 0.55)');
  grad.addColorStop(0.55, 'rgba(15, 23, 42, 0.22)');
  grad.addColorStop(1, 'rgba(15, 23, 42, 0.0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Generates a realistic tileable micro-relief bump/roughness map for terrain, rock, and concrete
 */
export function createMicroReliefTexture(maxAnisotropy = 4): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 256, 256);

  let seed = 1337;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  // Multi-scale organic stone & soil grain
  for (let i = 0; i < 3200; i++) {
    const x = Math.floor(rand() * 256);
    const y = Math.floor(rand() * 256);
    const v = Math.floor(95 + rand() * 65);
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.fillRect(x, y, 2 + (i % 2), 2 + (i % 2));
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(24, 24);
  tex.colorSpace = THREE.NoColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

/**
 * Generates a realistic architectural building facade texture with glass window mullions and stories
 */
export function createBuildingFacadeTexture(
  baseColor: string,
  windowColor: string,
  litWindowColor: string,
  maxAnisotropy = 4,
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, 256, 256);

  // Horizontal concrete floor slabs
  ctx.fillStyle = 'rgba(15, 23, 42, 0.18)';
  for (let y = 0; y < 256; y += 32) {
    ctx.fillRect(0, y, 256, 4);
  }

  // Window panes with mullions
  let seed = 4242;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const wx = col * 32 + 5;
      const wy = row * 32 + 7;
      ctx.fillStyle = rand() > 0.35 ? windowColor : litWindowColor;
      ctx.fillRect(wx, wy, 22, 20);
      // Window frame reflection highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
      ctx.fillRect(wx + 2, wy + 2, 6, 16);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

/**
 * Generates a realistic multi-lane asphalt highway texture with shoulder lines and dashed center dividers
 */
export function createRoadAsphaltTexture(maxAnisotropy = 4): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Dark weathered asphalt base
  ctx.fillStyle = '#262f3d';
  ctx.fillRect(0, 0, 256, 512);

  // Granular asphalt aggregate noise
  let seed = 777;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  for (let i = 0; i < 2400; i++) {
    const x = Math.floor(rand() * 256);
    const y = Math.floor(rand() * 512);
    const v = Math.floor(32 + rand() * 28);
    ctx.fillStyle = `rgb(${v},${v + 4},${v + 10})`;
    ctx.fillRect(x, y, 2, 2);
  }

  // Concrete outer curbs
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(0, 0, 14, 512);
  ctx.fillRect(242, 0, 14, 512);

  // Crisp white outer shoulder lines
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(22, 0, 6, 512);
  ctx.fillRect(228, 0, 6, 512);

  // Double yellow center median lines
  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(122, 0, 4, 512);
  ctx.fillRect(130, 0, 4, 512);

  // Dashed white lane dividers (4-lane highway look)
  ctx.strokeStyle = 'rgba(248, 250, 252, 0.85)';
  ctx.lineWidth = 4;
  ctx.setLineDash([28, 24]);
  ctx.beginPath();
  ctx.moveTo(74, 0);
  ctx.lineTo(74, 512);
  ctx.moveTo(182, 0);
  ctx.lineTo(182, 512);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 4);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

/**
 * Generates a realistic river & flood hazard water surface texture with currents and foam ripples
 */
export function createHazardWaterTexture(maxAnisotropy = 4): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 256, 0);
  grad.addColorStop(0, '#38bdf8');
  grad.addColorStop(0.2, '#0284c7');
  grad.addColorStop(0.5, '#0369a1');
  grad.addColorStop(0.8, '#0284c7');
  grad.addColorStop(1, '#38bdf8');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  // Water wave crests
  ctx.strokeStyle = 'rgba(224, 242, 254, 0.42)';
  ctx.lineWidth = 2;
  for (let y = 12; y < 256; y += 24) {
    ctx.beginPath();
    for (let x = 0; x <= 256; x += 16) {
      const wy = y + Math.sin((x / 256) * Math.PI * 2) * 4;
      if (x === 0) ctx.moveTo(x, wy);
      else ctx.lineTo(x, wy);
    }
    ctx.stroke();
  }

  // Center navigation / flood channel dashed line
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
  ctx.setLineDash([14, 10]);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(128, 0);
  ctx.lineTo(128, 256);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 6);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

/**
 * Generates a realistic helipad roof decal texture
 */
function createHelipadTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#334155';
  ctx.fillRect(0, 0, 128, 128);

  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(64, 64, 48, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#f8fafc';
  ctx.font = '700 54px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('H', 64, 66);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

let _cachedFacadeTex: THREE.CanvasTexture | null = null;
let _cachedShelterFacadeTex: THREE.CanvasTexture | null = null;
let _cachedHelipadTex: THREE.CanvasTexture | null = null;

/**
 * Composite 11-Part Realistic Emergency Safe Shelter Complex (Arena / Hospital / High School Refuge)
 * Pivoted at bottom-center (y = 0).
 */
export function createShelterComplexModel(
  shadowTex: THREE.CanvasTexture,
  maxAnisotropy = 4,
): THREE.Group {
  const group = new THREE.Group();
  if (!_cachedShelterFacadeTex) {
    _cachedShelterFacadeTex = createBuildingFacadeTexture(
      '#e2e8f0',
      '#0284c7',
      '#7dd3fc',
      maxAnisotropy,
    );
  }
  if (!_cachedHelipadTex) {
    _cachedHelipadTex = createHelipadTexture();
  }

  // 1. Soft radial contact shadow disc
  const shadowGeo = new THREE.CircleGeometry(4.2, 24);
  shadowGeo.rotateX(-Math.PI / 2);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: shadowTex,
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
  });
  const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
  shadowMesh.position.y = 0.015;
  group.add(shadowMesh);

  // 2. Stepped Reinforced Concrete Plaza Base + Parking Apron
  const apronGeo = new THREE.BoxGeometry(6.2, 0.24, 5.2);
  const apronMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    roughness: 0.85,
    metalness: 0.08,
  });
  const apron = new THREE.Mesh(apronGeo, apronMat);
  apron.position.y = 0.12;
  apron.receiveShadow = true;
  group.add(apron);

  // 3. Inner Paved Refuge Courtyard
  const courtGeo = new THREE.BoxGeometry(5.6, 0.08, 4.6);
  const courtMat = new THREE.MeshStandardMaterial({
    color: 0xcbd5e1,
    roughness: 0.75,
    metalness: 0.1,
  });
  const court = new THREE.Mesh(courtGeo, courtMat);
  court.position.y = 0.26;
  court.receiveShadow = true;
  group.add(court);

  // 4. Primary Architectural Arena / Refuge Hall (ExtrudeGeometry with bevels + window facade texture)
  const hallShape = new THREE.Shape();
  const w = 1.65;
  const d = 1.3;
  hallShape.moveTo(-w, -d);
  hallShape.lineTo(w, -d);
  hallShape.lineTo(w, d);
  hallShape.lineTo(-w, d);
  hallShape.closePath();

  const hallGeo = new THREE.ExtrudeGeometry(hallShape, {
    depth: 1.65,
    bevelEnabled: true,
    bevelThickness: 0.14,
    bevelSize: 0.12,
    bevelSegments: 3,
  });
  hallGeo.rotateX(-Math.PI / 2);
  const hallMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: _cachedShelterFacadeTex,
    roughness: 0.45,
    metalness: 0.2,
  });
  const hall = new THREE.Mesh(hallGeo, hallMat);
  hall.position.set(-0.35, 0.28, -0.15);
  hall.castShadow = true;
  hall.receiveShadow = true;
  group.add(hall);

  // 5. Ribbed Metallic Emerald Stadium Dome Roof (LatheGeometry)
  const domePoints = [
    new THREE.Vector2(0.0, 0.95),
    new THREE.Vector2(0.85, 0.82),
    new THREE.Vector2(1.42, 0.42),
    new THREE.Vector2(1.62, 0.0),
  ];
  const domeGeo = new THREE.LatheGeometry(domePoints, 20);
  const domeMat = new THREE.MeshStandardMaterial({
    color: 0x059669,
    roughness: 0.28,
    metalness: 0.55,
  });
  const dome = new THREE.Mesh(domeGeo, domeMat);
  dome.position.set(-0.35, 1.95, -0.15);
  dome.castShadow = true;
  group.add(dome);

  // 6. Emergency Medical Triage Annex Wing with Helipad Roof
  const wingGeo = new THREE.BoxGeometry(1.65, 1.25, 1.85);
  const wing = new THREE.Mesh(wingGeo, hallMat);
  wing.position.set(1.55, 0.9, 0.25);
  wing.castShadow = true;
  wing.receiveShadow = true;
  group.add(wing);

  // 7. Rooftop Helipad Landing Pad on Medical Wing
  const heliGeo = new THREE.PlaneGeometry(1.35, 1.35);
  heliGeo.rotateX(-Math.PI / 2);
  const heliMat = new THREE.MeshStandardMaterial({
    map: _cachedHelipadTex,
    roughness: 0.6,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const heliPad = new THREE.Mesh(heliGeo, heliMat);
  heliPad.position.set(1.55, 1.54, 0.25);
  group.add(heliPad);

  // 8 & 9. Two White Emergency Field Triage Tents in Courtyard
  const tentMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.65,
  });
  for (const tz of [-1.45, 1.55]) {
    const tentGeo = new THREE.ConeGeometry(0.52, 0.55, 4);
    tentGeo.rotateY(Math.PI / 4);
    const tent = new THREE.Mesh(tentGeo, tentMat);
    tent.position.set(1.65, 0.56, tz);
    tent.castShadow = true;
    group.add(tent);
  }

  // 10. Glowing Emerald Safe-Zone Perimeter Ring
  const ringGeo = new THREE.TorusGeometry(2.75, 0.08, 8, 32);
  ringGeo.rotateX(Math.PI / 2);
  const ringMat = new THREE.MeshStandardMaterial({
    color: 0x10b981,
    emissive: 0x059669,
    emissiveIntensity: 0.4,
    roughness: 0.25,
    metalness: 0.5,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.position.y = 0.34;
  group.add(ring);

  // 11. Communications & Siren Tower Mast on Roof
  const mastGeo = new THREE.CylinderGeometry(0.05, 0.09, 1.1, 8);
  const mastMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    metalness: 0.8,
    roughness: 0.2,
  });
  const mast = new THREE.Mesh(mastGeo, mastMat);
  mast.position.set(-0.35, 3.1, -0.15);
  group.add(mast);

  return group;
}

/**
 * Composite 10-Part Realistic Residential Neighborhood Block (THREE.Group)
 * Includes mid-rise apartment tower with glass facade, secondary condo building,
 * suburban pitched-roof homes, courtyard trees, and concrete sidewalks.
 */
export function createResidentialZoneModel(
  shadowTex: THREE.CanvasTexture,
  inHazardZone = false,
  maxAnisotropy = 4,
): THREE.Group {
  const group = new THREE.Group();
  if (!_cachedFacadeTex) {
    _cachedFacadeTex = createBuildingFacadeTexture(
      '#f1f5f9',
      '#1e3a5f',
      '#bae6fd',
      maxAnisotropy,
    );
  }

  // 1. Contact shadow
  const shadowGeo = new THREE.CircleGeometry(3.6, 20);
  shadowGeo.rotateX(-Math.PI / 2);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: shadowTex,
    transparent: true,
    opacity: 0.45,
    depthWrite: false,
  });
  const shadow = new THREE.Mesh(shadowGeo, shadowMat);
  shadow.position.y = 0.015;
  group.add(shadow);

  // 2. Urban City Block Sidewalk Plinth
  const padGeo = new THREE.BoxGeometry(5.0, 0.22, 4.4);
  const padMat = new THREE.MeshStandardMaterial({
    color: inHazardZone ? 0x93c5fd : 0xcbd5e1,
    roughness: 0.82,
    metalness: 0.08,
  });
  const pad = new THREE.Mesh(padGeo, padMat);
  pad.position.y = 0.11;
  pad.receiveShadow = true;
  group.add(pad);

  // 3. Green Courtyard Lawn Patch
  const lawnGeo = new THREE.BoxGeometry(4.4, 0.06, 3.8);
  const lawnMat = new THREE.MeshStandardMaterial({
    color: 0x65a30d,
    roughness: 0.9,
  });
  const lawn = new THREE.Mesh(lawnGeo, lawnMat);
  lawn.position.y = 0.23;
  lawn.receiveShadow = true;
  group.add(lawn);

  // 4. Primary Mid-Rise Apartment Tower (ExtrudeGeometry + Window Facade Texture)
  const towerShape = new THREE.Shape();
  towerShape.moveTo(-0.85, -0.75);
  towerShape.lineTo(0.85, -0.75);
  towerShape.lineTo(0.85, 0.75);
  towerShape.lineTo(-0.85, 0.75);
  towerShape.closePath();

  const towerGeo = new THREE.ExtrudeGeometry(towerShape, {
    depth: 2.35,
    bevelEnabled: true,
    bevelThickness: 0.08,
    bevelSize: 0.08,
    bevelSegments: 2,
  });
  towerGeo.rotateX(-Math.PI / 2);
  const towerMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: _cachedFacadeTex,
    roughness: 0.45,
    metalness: 0.2,
  });
  const tower = new THREE.Mesh(towerGeo, towerMat);
  tower.position.set(-0.75, 0.24, -0.45);
  tower.castShadow = true;
  tower.receiveShadow = true;
  group.add(tower);

  // 5. Rooftop Mechanical Penthouse & HVAC Unit on Primary Tower
  const hvacGeo = new THREE.BoxGeometry(0.95, 0.38, 0.85);
  const hvacMat = new THREE.MeshStandardMaterial({
    color: 0x64748b,
    roughness: 0.6,
    metalness: 0.4,
  });
  const hvac = new THREE.Mesh(hvacGeo, hvacMat);
  hvac.position.set(-0.75, 2.78, -0.45);
  hvac.castShadow = true;
  group.add(hvac);

  // 6. Secondary Terraced Condo Building
  const wingGeo = new THREE.BoxGeometry(1.35, 1.55, 1.25);
  const wing = new THREE.Mesh(wingGeo, towerMat);
  wing.position.set(1.05, 1.02, -0.55);
  wing.castShadow = true;
  wing.receiveShadow = true;
  group.add(wing);

  // 7 & 8. Two Suburban Houses with Terracotta Pitched Roofs in Foreground
  const houseBodyMat = new THREE.MeshStandardMaterial({
    color: 0xfef3c7,
    roughness: 0.75,
  });
  const terracottaRoofMat = new THREE.MeshStandardMaterial({
    color: 0xc2410c,
    roughness: 0.55,
  });
  for (const hx of [-0.95, 0.65]) {
    const hBody = new THREE.Mesh(
      new THREE.BoxGeometry(1.05, 0.68, 0.88),
      houseBodyMat,
    );
    hBody.position.set(hx, 0.58, 1.05);
    hBody.castShadow = true;
    group.add(hBody);

    const hRoofGeo = new THREE.ConeGeometry(0.82, 0.52, 4);
    hRoofGeo.rotateY(Math.PI / 4);
    const hRoof = new THREE.Mesh(hRoofGeo, terracottaRoofMat);
    hRoof.position.set(hx, 1.18, 1.05);
    hRoof.castShadow = true;
    group.add(hRoof);
  }

  // 9 & 10. Courtyard Trees inside the Residential Block
  const treeCanopyMat = new THREE.MeshStandardMaterial({
    color: 0x15803d,
    roughness: 0.8,
  });
  const treeSphere = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.45, 1),
    treeCanopyMat,
  );
  treeSphere.position.set(1.65, 0.72, 1.15);
  treeSphere.castShadow = true;
  group.add(treeSphere);

  return group;
}

/**
 * Composite 6-Part Realistic Road Junction / Highway Interchange Rotary & Signal Gantry (THREE.Group)
 */
export function createJunctionNodeModel(
  shadowTex: THREE.CanvasTexture,
  isBridgeNode = false,
): THREE.Group {
  const group = new THREE.Group();

  // 1. Contact shadow
  const shadowGeo = new THREE.CircleGeometry(2.3, 16);
  shadowGeo.rotateX(-Math.PI / 2);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: shadowTex,
    transparent: true,
    opacity: 0.4,
    depthWrite: false,
  });
  const shadow = new THREE.Mesh(shadowGeo, shadowMat);
  shadow.position.y = 0.015;
  group.add(shadow);

  // 2. Asphalt Rotary Roundabout Apron
  const plinthGeo = new THREE.CylinderGeometry(1.75, 1.9, 0.24, 24);
  const plinthMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.78,
    metalness: 0.12,
  });
  const plinth = new THREE.Mesh(plinthGeo, plinthMat);
  plinth.position.y = 0.12;
  plinth.receiveShadow = true;
  group.add(plinth);

  // 3. Landscaped Center Roundabout Island
  const islandGeo = new THREE.CylinderGeometry(0.95, 1.05, 0.14, 20);
  const islandMat = new THREE.MeshStandardMaterial({
    color: isBridgeNode ? 0x94a3b8 : 0x4d7c0f,
    roughness: 0.85,
  });
  const island = new THREE.Mesh(islandGeo, islandMat);
  island.position.y = 0.28;
  group.add(island);

  // 4. Overhead Highway Signal Gantry / Bridge Pylon
  const towerHeight = isBridgeNode ? 2.2 : 1.35;
  const pylonGeo = new THREE.CylinderGeometry(0.22, 0.34, towerHeight, 12);
  const pylonMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    roughness: 0.35,
    metalness: 0.7,
  });
  const pylon = new THREE.Mesh(pylonGeo, pylonMat);
  pylon.position.y = 0.28 + towerHeight / 2;
  pylon.castShadow = true;
  group.add(pylon);

  // 5. Cross-arm Traffic Control Gantry Beam
  const beamGeo = new THREE.BoxGeometry(1.6, 0.14, 0.18);
  const beam = new THREE.Mesh(beamGeo, pylonMat);
  beam.position.y = 0.28 + towerHeight * 0.82;
  beam.castShadow = true;
  group.add(beam);

  // 6. Beacon Sensor Dome
  const capGeo = new THREE.SphereGeometry(0.24, 12, 12);
  const capMat = new THREE.MeshStandardMaterial({
    color: isBridgeNode ? 0xf59e0b : 0x0284c7,
    emissive: isBridgeNode ? 0xd97706 : 0x0369a1,
    emissiveIntensity: 0.35,
    roughness: 0.2,
  });
  const cap = new THREE.Mesh(capGeo, capMat);
  cap.position.y = 0.28 + towerHeight + 0.12;
  group.add(cap);

  return group;
}

/**
 * Composite 9-Part Suspension / Steel-Truss River Bridge with Concrete Piers, Cables & Blocked Barricade
 */
export function createBridgeTrussAndBarricade(
  lengthWorld: number,
  isBlocked: boolean,
): THREE.Group {
  const group = new THREE.Group();
  const archSpan = Math.max(4.5, lengthWorld * 0.78);

  const steelMat = new THREE.MeshStandardMaterial({
    color: isBlocked ? 0xb91c1c : 0x475569,
    roughness: 0.32,
    metalness: 0.78,
  });
  const concretePierMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    roughness: 0.85,
    metalness: 0.1,
  });

  // 1 & 2. Twin Reinforced Concrete River Piers extending down into the riverbed
  // 1 & 2. Reinforced Concrete River Piers extending down into the riverbed
  const pierGeo = new THREE.BoxGeometry(0.7, 1.2, 2.4);
  for (const px of [-archSpan * 0.3, archSpan * 0.3]) {
    const pier = new THREE.Mesh(pierGeo, concretePierMat);
    pier.position.set(px, -0.4, 0);
    pier.castShadow = true;
    pier.receiveShadow = true;
    group.add(pier);
  }

  // 3 & 4. Sleek Modern Bridge Parapets & Guardrails along both sides of the bridge deck
  const railGeo = new THREE.BoxGeometry(archSpan, 0.35, 0.12);
  for (const side of [-1.05, 1.05]) {
    const rail = new THREE.Mesh(railGeo, steelMat);
    rail.position.set(0, 0.22, side);
    rail.castShadow = true;
    group.add(rail);
  }

  // 5. Blocked Bridge Road Barricades (Clean civil engineering safety barriers)
  if (isBlocked) {
    const blockGeo = new THREE.BoxGeometry(0.45, 0.5, 1.9);
    const blockMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      roughness: 0.55,
    });
    for (const bx of [-1.3, 1.3]) {
      const b = new THREE.Mesh(blockGeo, blockMat);
      b.position.set(bx, 0.32, 0);
      b.castShadow = true;
      group.add(b);
    }
  }

  return group;
}

/**
 * Shared Geometries and Materials for 7-Part Realistic 3D Evacuation Vehicles
 */
export class VehicleModelFactory {
  private hullGeo: THREE.BufferGeometry;
  private cabinGeo: THREE.BufferGeometry;
  private wheelGeo: THREE.BufferGeometry;
  private beaconGeo: THREE.BufferGeometry;
  private headlightGeo: THREE.BufferGeometry;
  private shadowGeo: THREE.BufferGeometry;

  private materials: Record<
    AgentMobilityClass,
    {
      hull: THREE.MeshStandardMaterial;
      cabin: THREE.MeshPhysicalMaterial;
      beacon: THREE.MeshStandardMaterial;
    }
  >;
  private wheelMat: THREE.MeshStandardMaterial;
  private headlightMat: THREE.MeshStandardMaterial;
  private taillightMat: THREE.MeshStandardMaterial;
  private shadowMat: THREE.MeshBasicMaterial;

  constructor(shadowTex: THREE.CanvasTexture) {
    const hullShape = new THREE.Shape();
    hullShape.moveTo(-0.62, -0.28);
    hullShape.lineTo(0.62, -0.28);
    hullShape.lineTo(0.62, 0.28);
    hullShape.lineTo(-0.62, 0.28);
    hullShape.closePath();
    this.hullGeo = new THREE.ExtrudeGeometry(hullShape, {
      depth: 0.24,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.05,
      bevelSegments: 2,
    });
    this.hullGeo.rotateX(-Math.PI / 2);

    this.cabinGeo = new THREE.BoxGeometry(0.62, 0.2, 0.48);
    this.wheelGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.66, 12);
    this.wheelGeo.rotateX(Math.PI / 2);
    this.beaconGeo = new THREE.BoxGeometry(0.24, 0.09, 0.32);
    this.headlightGeo = new THREE.BoxGeometry(0.06, 0.08, 0.44);
    this.shadowGeo = new THREE.CircleGeometry(0.82, 12);
    this.shadowGeo.rotateX(-Math.PI / 2);

    this.wheelMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.85,
      metalness: 0.2,
    });

    this.headlightMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xfacc15,
      emissiveIntensity: 0.7,
    });

    this.taillightMat = new THREE.MeshStandardMaterial({
      color: 0xf87171,
      emissive: 0xef4444,
      emissiveIntensity: 0.8,
    });

    this.shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      opacity: 0.48,
      depthWrite: false,
    });

    const glassCabin = new THREE.MeshPhysicalMaterial({
      color: 0x1e293b,
      roughness: 0.12,
      metalness: 0.65,
      clearcoat: 1.0,
    });

    this.materials = {
      standard: {
        hull: new THREE.MeshStandardMaterial({
          color: 0x0284c7,
          roughness: 0.32,
          metalness: 0.45,
        }),
        cabin: glassCabin,
        beacon: new THREE.MeshStandardMaterial({
          color: 0x38bdf8,
          emissive: 0x0284c7,
          emissiveIntensity: 0.5,
          roughness: 0.2,
        }),
      },
      slow: {
        hull: new THREE.MeshStandardMaterial({
          color: 0xf59e0b,
          roughness: 0.38,
          metalness: 0.3,
        }),
        cabin: glassCabin,
        beacon: new THREE.MeshStandardMaterial({
          color: 0xfde047,
          emissive: 0xd97706,
          emissiveIntensity: 0.6,
          roughness: 0.2,
        }),
      },
      fast: {
        hull: new THREE.MeshStandardMaterial({
          color: 0xf8fafc,
          roughness: 0.25,
          metalness: 0.5,
        }),
        cabin: glassCabin,
        beacon: new THREE.MeshStandardMaterial({
          color: 0x10b981,
          emissive: 0x059669,
          emissiveIntensity: 0.9,
          roughness: 0.15,
        }),
      },
    };
  }

  public createVehicleGroup(mobilityClass: AgentMobilityClass): THREE.Group {
    const group = new THREE.Group();
    const mats = this.materials[mobilityClass];

    const shadow = new THREE.Mesh(this.shadowGeo, this.shadowMat);
    shadow.position.y = 0.015;
    group.add(shadow);

    const hull = new THREE.Mesh(this.hullGeo, mats.hull);
    hull.position.y = 0.12;
    group.add(hull);

    const cabin = new THREE.Mesh(this.cabinGeo, mats.cabin);
    cabin.position.set(-0.04, 0.44, 0);
    group.add(cabin);

    const frontAxle = new THREE.Mesh(this.wheelGeo, this.wheelMat);
    frontAxle.position.set(0.36, 0.12, 0);
    group.add(frontAxle);

    const rearAxle = new THREE.Mesh(this.wheelGeo, this.wheelMat);
    rearAxle.position.set(-0.36, 0.12, 0);
    group.add(rearAxle);

    const headlights = new THREE.Mesh(this.headlightGeo, this.headlightMat);
    headlights.position.set(0.64, 0.24, 0);
    group.add(headlights);

    const taillights = new THREE.Mesh(this.headlightGeo, this.taillightMat);
    taillights.position.set(-0.64, 0.24, 0);
    group.add(taillights);

    const beacon = new THREE.Mesh(this.beaconGeo, mats.beacon);
    beacon.position.set(-0.04, 0.58, 0);
    group.add(beacon);

    return group;
  }
}

/**
 * Creates Rich Multi-Biome InstancedMesh Environment Details:
 * - 260 Multi-Layered Pine & Deciduous Trees across riverbanks, parks, and hillside ridges
 * - 65 Background Urban Context Buildings & Warehouses around the outer city blocks
 */
export function createPerimeterFoliageInstanced(): THREE.Group {
  const group = new THREE.Group();
  const treeCount = 260;

  const trunkGeo = new THREE.CylinderGeometry(0.14, 0.24, 1.0, 6);
  trunkGeo.translate(0, 0.5, 0);
  const trunkMat = new THREE.MeshStandardMaterial({
    color: 0x5c4033,
    roughness: 0.9,
    metalness: 0.05,
  });

  const lowerCanopyGeo = new THREE.ConeGeometry(0.95, 1.8, 7);
  lowerCanopyGeo.translate(0, 1.55, 0);
  const upperCanopyGeo = new THREE.ConeGeometry(0.7, 1.5, 7);
  upperCanopyGeo.translate(0, 2.45, 0);

  const canopyMat = new THREE.MeshStandardMaterial({
    color: 0x2e6f40,
    roughness: 0.82,
    metalness: 0.04,
  });

  const trunkInst = new THREE.InstancedMesh(trunkGeo, trunkMat, treeCount);
  const lowerCanopyInst = new THREE.InstancedMesh(
    lowerCanopyGeo,
    canopyMat,
    treeCount,
  );
  const upperCanopyInst = new THREE.InstancedMesh(
    upperCanopyGeo,
    canopyMat,
    treeCount,
  );

  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  let seed = 90210;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  for (let i = 0; i < treeCount; i++) {
    let x = 0;
    let z = 0;
    if (i < 170) {
      // Outer hillside forest ring
      const angle = (i / 170) * Math.PI * 2 + (rand() - 0.5) * 0.08;
      const radius = 50 + rand() * 34;
      x = Math.cos(angle) * radius * 1.15;
      z = Math.sin(angle) * radius * 0.85;
    } else {
      // City greenbelt & riverbank park clusters
      x = (rand() - 0.5) * 86;
      z = (rand() - 0.5) * 58;
      // Keep clear of direct river center channel
      if (Math.abs(x - 2) < 9) x += x >= 2 ? 11 : -11;
    }

    const scale = 0.75 + rand() * 0.45;
    dummy.position.set(x, 0.0, z);
    dummy.rotation.set(0, rand() * Math.PI * 2, 0);
    dummy.scale.setScalar(scale);
    dummy.updateMatrix();

    trunkInst.setMatrixAt(i, dummy.matrix);
    lowerCanopyInst.setMatrixAt(i, dummy.matrix);
    upperCanopyInst.setMatrixAt(i, dummy.matrix);

    color.setHSL(0.32 + (rand() - 0.5) * 0.08, 0.48, 0.28 + rand() * 0.14);
    lowerCanopyInst.setColorAt(i, color);
    color.offsetHSL(0.01, 0.04, 0.05);
    upperCanopyInst.setColorAt(i, color);
  }

  trunkInst.instanceMatrix.needsUpdate = true;
  lowerCanopyInst.instanceMatrix.needsUpdate = true;
  upperCanopyInst.instanceMatrix.needsUpdate = true;
  if (lowerCanopyInst.instanceColor) lowerCanopyInst.instanceColor.needsUpdate = true;
  if (upperCanopyInst.instanceColor) upperCanopyInst.instanceColor.needsUpdate = true;

  trunkInst.computeBoundingSphere();
  lowerCanopyInst.computeBoundingSphere();
  upperCanopyInst.computeBoundingSphere();

  group.add(trunkInst);
  group.add(lowerCanopyInst);
  group.add(upperCanopyInst);
  return group;
}
