export type NodeCategory = 'residential' | 'junction' | 'shelter';
export type AgentMobilityClass = 'standard' | 'slow' | 'fast';

export interface GraphNode {
  id: string;
  label: string;
  shortCode: string;
  category: NodeCategory;
  /** World coordinates in 3D scene space (X: East/West, Z: North/South, Y: Elevation) */
  x: number;
  y: number;
  z: number;
  /** Initial population or shelter bed capacity */
  capacity?: number;
  occupied?: number;
  initialAgents?: number;
  inHazardZone?: boolean;
}

export interface GraphEdge {
  id: string;
  from: string;
  to: string;
  name: string;
  /** Road length in meters */
  length: number;
  /** Design capacity (vehicles per cycle) */
  capacity: number;
  /** Base speed limit (km/h) */
  baseSpeed: number;
  /** Hazard exposure factor (0.0 to 1.0) */
  hazardExposure: number;
  /** Whether this road/bridge is physically blocked (e.g., Central River Bridge N6-N10) */
  isBlocked: boolean;
  /** Whether Contra-Flow lane reversal is active (boosts capacity by 1.85x) */
  isContraFlow: boolean;
  /** Baseline traffic volume from background urban flow */
  baselineLoad: number;
  /** Live count of active simulated agents currently on this edge */
  agentCount: number;
  /** Total load = baselineLoad + agentCount */
  currentLoad: number;
  /** Load ratio = currentLoad / effectiveCapacity */
  loadRatio: number;
  /** Whether this edge is a river bridge */
  isBridge?: boolean;
}

export interface Agent {
  id: string;
  originNodeId: string;
  currentNodeId: string;
  nextNodeId: string;
  targetShelterId: string;
  currentEdgeId: string | null;
  /** Progress along current edge [0..1] */
  edgeProgress: number;
  /** Direction along edge: 1 for from->to, -1 for to->from */
  edgeDirection: 1 | -1;
  mobilityClass: AgentMobilityClass;
  speedMultiplier: number;
  /** Current effective speed in km/h */
  currentSpeedKmh: number;
  status: 'evacuating' | 'sheltered' | 'rerouting';
  rerouteCount: number;
  distanceTraveledMeters: number;
}

export interface BPRCostBreakdown {
  freeFlowTimeSec: number;
  congestionPenaltySec: number;
  hazardPenaltySec: number;
  totalTravelCostSec: number;
  effectiveSpeedKmh: number;
  loadPercentage: number;
  effectiveCapacity: number;
}

export interface SimulationSnapshot {
  step: number;
  elapsedMinutes: number;
  nodes: GraphNode[];
  edges: GraphEdge[];
  agents: Agent[];
  activeAgentCount: number;
  shelteredAgentCount: number;
  totalEvacuees: number;
  rerouteEventsCount: number;
  averageSpeedKmh: number;
  estimatedClearanceMinutes: number;
  criticalBottlenecks: { edgeId: string; name: string; loadPct: number }[];
}

/**
 * BPR-Inspired Dynamic Congestion & Cost Function:
 * T_base = Length / SpeedLimit (converted to seconds: length_m / (speed_kmh / 3.6))
 * Congestion Penalty = T_base * (2.2 * (CurrentLoad / EffectiveCapacity)^2)
 * Hazard Penalty = T_base * (HazardExposure * 1.5)
 * Travel Cost = T_base + Congestion Penalty + Hazard Penalty
 */
export function calculateBPRMetrics(
  edge: Pick<
    GraphEdge,
    | 'length'
    | 'baseSpeed'
    | 'capacity'
    | 'currentLoad'
    | 'hazardExposure'
    | 'isBlocked'
    | 'isContraFlow'
  >,
): BPRCostBreakdown {
  const effectiveCapacity = Math.max(
    1,
    edge.isContraFlow ? edge.capacity * 1.85 : edge.capacity,
  );
  const loadRatio = Math.max(0, edge.currentLoad / effectiveCapacity);
  const loadPercentage = Math.round(loadRatio * 100);

  const speedMetersPerSec = Math.max(1, (edge.baseSpeed * 1000) / 3600);
  const freeFlowTimeSec = edge.length / speedMetersPerSec;

  if (edge.isBlocked) {
    return {
      freeFlowTimeSec,
      congestionPenaltySec: Number.POSITIVE_INFINITY,
      hazardPenaltySec: Number.POSITIVE_INFINITY,
      totalTravelCostSec: Number.POSITIVE_INFINITY,
      effectiveSpeedKmh: 0,
      loadPercentage: 0,
      effectiveCapacity,
    };
  }

  const congestionPenaltySec =
    freeFlowTimeSec * (2.2 * Math.pow(loadRatio, 2));
  const hazardPenaltySec = freeFlowTimeSec * (edge.hazardExposure * 1.5);
  const totalTravelCostSec =
    freeFlowTimeSec + congestionPenaltySec + hazardPenaltySec;

  const effectiveSpeedKmh = calculateEffectiveSpeed(
    edge.baseSpeed,
    edge.currentLoad,
    effectiveCapacity,
  );

  return {
    freeFlowTimeSec,
    congestionPenaltySec,
    hazardPenaltySec,
    totalTravelCostSec,
    effectiveSpeedKmh,
    loadPercentage,
    effectiveCapacity,
  };
}

/**
 * Speed Degradation Formula:
 * Effective Speed = Base Speed * max(0.18, 1.0 - 0.70 * min(2.0, Load / Capacity))
 */
export function calculateEffectiveSpeed(
  baseSpeedKmh: number,
  currentLoad: number,
  effectiveCapacity: number,
): number {
  const cap = Math.max(1, effectiveCapacity);
  const ratio = Math.max(0, currentLoad / cap);
  const degradationFactor = Math.max(
    0.18,
    1.0 - 0.7 * Math.min(2.0, ratio),
  );
  return baseSpeedKmh * degradationFactor;
}

/**
 * Mobility Class Multiplier:
 * Standard (70%): 1.0x
 * Slow / Elderly / Vulnerable (20%): 0.65x
 * Fast / Emergency Vehicles (10%): 1.35x
 */
export function getMobilityMultiplier(mobilityClass: AgentMobilityClass): number {
  switch (mobilityClass) {
    case 'slow':
      return 0.65;
    case 'fast':
      return 1.35;
    case 'standard':
    default:
      return 1.0;
  }
}

/**
 * Dijkstra's Shortest-Path Algorithm over undirected road corridors (using BPR travel cost).
 * Returns the shortest node sequence from `startNodeId` to the lowest-cost available shelter.
 */
export function findOptimalShelterRoute(
  startNodeId: string,
  nodes: GraphNode[],
  edges: GraphEdge[],
  excludeShelterIds: Set<string> = new Set(),
): { shelterId: string | null; path: string[]; totalCost: number } {
  const dist = new Map<string, number>();
  const prev = new Map<string, string | null>();
  const visited = new Set<string>();

  for (const node of nodes) {
    dist.set(node.id, Number.POSITIVE_INFINITY);
    prev.set(node.id, null);
  }
  dist.set(startNodeId, 0);

  // Build adjacency list
  const adj = new Map<string, { neighborId: string; cost: number }[]>();
  for (const node of nodes) {
    adj.set(node.id, []);
  }
  for (const edge of edges) {
    if (edge.isBlocked) continue;
    const metrics = calculateBPRMetrics(edge);
    if (!Number.isFinite(metrics.totalTravelCostSec)) continue;
    adj.get(edge.from)?.push({
      neighborId: edge.to,
      cost: metrics.totalTravelCostSec,
    });
    adj.get(edge.to)?.push({
      neighborId: edge.from,
      cost: metrics.totalTravelCostSec,
    });
  }

  while (visited.size < nodes.length) {
    let u: string | null = null;
    let bestDist = Number.POSITIVE_INFINITY;
    for (const [nodeId, d] of dist.entries()) {
      if (!visited.has(nodeId) && d < bestDist) {
        bestDist = d;
        u = nodeId;
      }
    }
    if (u === null || !Number.isFinite(bestDist)) break;
    visited.add(u);

    const neighbors = adj.get(u) || [];
    for (const { neighborId, cost } of neighbors) {
      if (visited.has(neighborId)) continue;
      const alt = bestDist + cost;
      if (alt < (dist.get(neighborId) ?? Number.POSITIVE_INFINITY)) {
        dist.set(neighborId, alt);
        prev.set(neighborId, u);
      }
    }
  }

  // Pick the open shelter with lowest travel cost
  const candidateShelters = nodes.filter(
    (n) =>
      n.category === 'shelter' &&
      !excludeShelterIds.has(n.id) &&
      (n.occupied ?? 0) < (n.capacity ?? 999),
  );

  // Fallback to any shelter if all are full
  const pool =
    candidateShelters.length > 0
      ? candidateShelters
      : nodes.filter((n) => n.category === 'shelter');

  let bestShelterId: string | null = null;
  let minShelterCost = Number.POSITIVE_INFINITY;

  for (const shelter of pool) {
    const c = dist.get(shelter.id) ?? Number.POSITIVE_INFINITY;
    if (c < minShelterCost) {
      minShelterCost = c;
      bestShelterId = shelter.id;
    }
  }

  if (!bestShelterId || !Number.isFinite(minShelterCost)) {
    return { shelterId: null, path: [startNodeId], totalCost: Number.POSITIVE_INFINITY };
  }

  const path: string[] = [];
  let curr: string | null = bestShelterId;
  while (curr !== null) {
    path.unshift(curr);
    curr = prev.get(curr) ?? null;
  }

  return {
    shelterId: bestShelterId,
    path,
    totalCost: minShelterCost,
  };
}

/**
 * Greenfield City Graph Definition:
 * Exactly 20 Nodes (7 Residential Zones, 9 Road Junctions/Bridges, 4 Emergency Safe Shelters)
 * and 32 Edges matching the screenshot layout and bottleneck telemetry.
 */
export function createInitialGreenfieldGraph(): {
  nodes: GraphNode[];
  edges: GraphEdge[];
} {
  const nodes: GraphNode[] = [
    // 7 Residential Zones
    {
      id: 'N1',
      label: 'West Riverside',
      shortCode: 'RES-01',
      category: 'residential',
      x: -31,
      y: 0.6,
      z: -4,
      initialAgents: 16,
    },
    {
      id: 'N2',
      label: 'Hillside Estates',
      shortCode: 'RES-02',
      category: 'residential',
      x: -12,
      y: 1.4,
      z: -19,
      initialAgents: 14,
    },
    {
      id: 'N3',
      label: 'Oak Valley',
      shortCode: 'RES-03',
      category: 'residential',
      x: 24,
      y: 1.1,
      z: -16,
      initialAgents: 12,
    },
    {
      id: 'N4',
      label: 'Sunset Heights',
      shortCode: 'RES-04',
      category: 'residential',
      x: -33,
      y: 1.2,
      z: 13,
      initialAgents: 14,
    },
    {
      id: 'N5',
      label: 'Maple Grove',
      shortCode: 'RES-05',
      category: 'residential',
      x: 38,
      y: 0.9,
      z: -10,
      initialAgents: 8,
    },
    {
      id: 'N6',
      label: 'Old River Town',
      shortCode: 'RES-06',
      category: 'residential',
      x: -2,
      y: 0.3,
      z: 2,
      initialAgents: 12,
      inHazardZone: true,
    },
    {
      id: 'N7',
      label: 'Cedar Park District',
      shortCode: 'RES-07',
      category: 'residential',
      x: 20,
      y: 0.7,
      z: 20,
      initialAgents: 10,
    },

    // 9 Road Junctions / Bridges
    {
      id: 'N8',
      label: 'West Junction',
      shortCode: 'JCT-08',
      category: 'junction',
      x: -18,
      y: 0.7,
      z: -3,
    },
    {
      id: 'N9',
      label: 'Highway 101 Interchange',
      shortCode: 'JCT-09',
      category: 'junction',
      x: -10,
      y: 0.6,
      z: 11,
    },
    {
      id: 'N10',
      label: 'Central River Bridge (East)',
      shortCode: 'BRG-10',
      category: 'junction',
      x: 7,
      y: 0.35,
      z: 3,
      inHazardZone: true,
    },
    {
      id: 'N11',
      label: 'North River Bridge',
      shortCode: 'BRG-11',
      category: 'junction',
      x: 11,
      y: 0.5,
      z: -19,
      inHazardZone: true,
    },
    {
      id: 'N12',
      label: 'Downtown Center Plaza',
      shortCode: 'JCT-12',
      category: 'junction',
      x: 3,
      y: 0.4,
      z: -9,
      inHazardZone: true,
    },
    {
      id: 'N13',
      label: 'Main Street Crossing',
      shortCode: 'JCT-13',
      category: 'junction',
      x: 16,
      y: 0.7,
      z: -4,
    },
    {
      id: 'N14',
      label: 'Industrial Access Hub',
      shortCode: 'JCT-14',
      category: 'junction',
      x: 31,
      y: 0.8,
      z: 0,
    },
    {
      id: 'N15',
      label: 'South River Crossing',
      shortCode: 'BRG-15',
      category: 'junction',
      x: 7,
      y: 0.35,
      z: 17,
      inHazardZone: true,
    },
    {
      id: 'N16',
      label: 'East Beltway Hub',
      shortCode: 'JCT-16',
      category: 'junction',
      x: 27,
      y: 0.8,
      z: 11,
    },

    // 4 Emergency Safe Shelters
    {
      id: 'N17',
      label: 'North High School Shelter',
      shortCode: 'SHL-17',
      category: 'shelter',
      x: 16,
      y: 1.5,
      z: -27,
      capacity: 220,
      occupied: 220,
    },
    {
      id: 'N18',
      label: 'East Sports Complex',
      shortCode: 'SHL-18',
      category: 'shelter',
      x: 42,
      y: 1.2,
      z: 4,
      capacity: 280,
      occupied: 164,
    },
    {
      id: 'N19',
      label: 'South Medical Evacuation Center',
      shortCode: 'SHL-19',
      category: 'shelter',
      x: 34,
      y: 1.1,
      z: 25,
      capacity: 150,
      occupied: 150,
    },
    {
      id: 'N20',
      label: 'West Valley Community Arena',
      shortCode: 'SHL-20',
      category: 'shelter',
      x: -37,
      y: 1.0,
      z: 24,
      capacity: 180,
      occupied: 118,
    },
  ];

  const rawEdges: Array<{
    id: string;
    from: string;
    to: string;
    name: string;
    length: number;
    capacity: number;
    baseSpeed: number;
    hazardExposure: number;
    isBlocked?: boolean;
    isBridge?: boolean;
    baselineLoad: number;
  }> = [
    // Greenfield City 32 Canonical Road Corridors (Synchronized 1:1 with backend & 2D map)
    { id: 'R-1', from: 'N1', to: 'N8', name: 'Riverside Parkway West', length: 420, capacity: 25, baseSpeed: 45, hazardExposure: 0.6, baselineLoad: 44 },
    { id: 'R-2', from: 'N2', to: 'N8', name: 'Hillside Boulevard', length: 550, capacity: 30, baseSpeed: 50, hazardExposure: 0.1, baselineLoad: 12 },
    { id: 'R-3', from: 'N2', to: 'N11', name: 'North Ridgeline Road', length: 720, capacity: 28, baseSpeed: 55, hazardExposure: 0.1, isBridge: true, baselineLoad: 14 },
    { id: 'R-4', from: 'N4', to: 'N15', name: 'Sunset Expressway West', length: 500, capacity: 35, baseSpeed: 60, hazardExposure: 0.2, baselineLoad: 15 },
    { id: 'R-5', from: 'N4', to: 'N20', name: 'Arena Connector', length: 380, capacity: 30, baseSpeed: 45, hazardExposure: 0.0, baselineLoad: 50 },
    { id: 'R-6', from: 'N5', to: 'N15', name: 'Pinehurst Avenue', length: 460, capacity: 25, baseSpeed: 45, hazardExposure: 0.2, baselineLoad: 12 },
    { id: 'R-7', from: 'N5', to: 'N12', name: 'Pinehurst South Link', length: 620, capacity: 28, baseSpeed: 50, hazardExposure: 0.4, baselineLoad: 14 },
    { id: 'R-8', from: 'N6', to: 'N8', name: 'Old Town Commercial Way', length: 580, capacity: 25, baseSpeed: 40, hazardExposure: 0.7, baselineLoad: 48 },
    { id: 'R-9', from: 'N8', to: 'N9', name: 'Downtown Central Link', length: 480, capacity: 40, baseSpeed: 50, hazardExposure: 0.3, baselineLoad: 16 },
    { id: 'R-10', from: 'N6', to: 'N10', name: 'Central River Bridge', length: 340, capacity: 22, baseSpeed: 40, hazardExposure: 0.85, isBlocked: true, isBridge: true, baselineLoad: 0 },
    { id: 'R-11', from: 'N9', to: 'N11', name: 'North River Bridge Way', length: 490, capacity: 35, baseSpeed: 55, hazardExposure: 0.3, isBridge: true, baselineLoad: 18 },
    { id: 'R-12', from: 'N10', to: 'N12', name: 'South River Crossing', length: 450, capacity: 30, baseSpeed: 45, hazardExposure: 0.5, isBridge: true, baselineLoad: 15 },
    { id: 'R-13', from: 'N9', to: 'N14', name: 'Plaza East Connector', length: 410, capacity: 45, baseSpeed: 50, hazardExposure: 0.1, baselineLoad: 14 },
    { id: 'R-14', from: 'N10', to: 'N14', name: 'Metro Transit Bypass', length: 430, capacity: 32, baseSpeed: 50, hazardExposure: 0.2, baselineLoad: 16 },
    { id: 'R-15', from: 'N11', to: 'N17', name: 'North Shelter Access', length: 320, capacity: 45, baseSpeed: 45, hazardExposure: 0.0, baselineLoad: 14 },
    { id: 'R-16', from: 'N3', to: 'N11', name: 'Oak Valley North Link', length: 510, capacity: 30, baseSpeed: 50, hazardExposure: 0.05, baselineLoad: 32 },
    { id: 'R-17', from: 'N3', to: 'N14', name: 'Oak Boulevard Central', length: 560, capacity: 35, baseSpeed: 55, hazardExposure: 0.1, baselineLoad: 16 },
    { id: 'R-18', from: 'N3', to: 'N18', name: 'Sports Complex Expressway', length: 460, capacity: 40, baseSpeed: 60, hazardExposure: 0.0, baselineLoad: 20 },
    { id: 'R-19', from: 'N14', to: 'N13', name: 'Industrial Avenue East', length: 490, capacity: 35, baseSpeed: 50, hazardExposure: 0.1, baselineLoad: 18 },
    { id: 'R-20', from: 'N13', to: 'N18', name: 'East Complex Access', length: 420, capacity: 40, baseSpeed: 55, hazardExposure: 0.0, baselineLoad: 15 },
    { id: 'R-21', from: 'N13', to: 'N16', name: 'Industrial Valley Corridor', length: 510, capacity: 30, baseSpeed: 50, hazardExposure: 0.2, baselineLoad: 14 },
    { id: 'R-22', from: 'N12', to: 'N7', name: 'South River Parkway', length: 480, capacity: 32, baseSpeed: 50, hazardExposure: 0.3, baselineLoad: 15 },
    { id: 'R-23', from: 'N16', to: 'N7', name: 'Valley South Link', length: 430, capacity: 30, baseSpeed: 50, hazardExposure: 0.1, baselineLoad: 20 },
    { id: 'R-24', from: 'N7', to: 'N19', name: 'Medical Base Access Road', length: 360, capacity: 40, baseSpeed: 45, hazardExposure: 0.0, baselineLoad: 35 },
    { id: 'R-25', from: 'N16', to: 'N19', name: 'East Relief Corridor', length: 530, capacity: 35, baseSpeed: 55, hazardExposure: 0.0, baselineLoad: 22 },
    { id: 'R-26', from: 'N15', to: 'N5', name: 'Highway 101 Southbound', length: 410, capacity: 40, baseSpeed: 65, hazardExposure: 0.1, baselineLoad: 15 },
    { id: 'R-27', from: 'N8', to: 'N15', name: 'Highway 101 Mid-Section', length: 520, capacity: 45, baseSpeed: 65, hazardExposure: 0.2, baselineLoad: 16 },
    { id: 'R-28', from: 'N15', to: 'N10', name: 'South Crossing Bridge Link', length: 620, capacity: 30, baseSpeed: 50, hazardExposure: 0.4, isBridge: true, baselineLoad: 18 },
    { id: 'R-29', from: 'N1', to: 'N4', name: 'West Arena Perimeter', length: 540, capacity: 25, baseSpeed: 45, hazardExposure: 0.3, baselineLoad: 63 },
    { id: 'R-30', from: 'N20', to: 'N1', name: 'Arena North Link', length: 680, capacity: 25, baseSpeed: 45, hazardExposure: 0.2, baselineLoad: 42 },
    { id: 'R-31', from: 'N14', to: 'N16', name: 'Metro South Expressway', length: 580, capacity: 40, baseSpeed: 60, hazardExposure: 0.15, baselineLoad: 24 },
    { id: 'R-32', from: 'N2', to: 'N17', name: 'Outer North Bypass', length: 690, capacity: 30, baseSpeed: 50, hazardExposure: 0.0, isBridge: true, baselineLoad: 36 },
  ];

  const edges: GraphEdge[] = rawEdges.map((e) => {
    const currentLoad = e.isBlocked ? 0 : e.baselineLoad;
    const loadRatio = e.isBlocked ? 0 : currentLoad / e.capacity;
    return {
      ...e,
      isBlocked: Boolean(e.isBlocked),
      isContraFlow: false,
      agentCount: 0,
      currentLoad,
      loadRatio,
    };
  });

  return { nodes, edges };
}

/**
 * Deterministic Pseudo-Random Generator for reproducible agent spawning & testing
 */
function createSeededRandom(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export class EvacuationSimulationEngine {
  private nodes: GraphNode[];
  private edges: GraphEdge[];
  private agents: Agent[];
  private stepCount = 0;
  private elapsedMinutes = 0;
  private rerouteEventsCount = 0;

  constructor() {
    const { nodes, edges } = createInitialGreenfieldGraph();
    this.nodes = nodes;
    this.edges = edges;
    this.agents = [];
    this.spawnInitialAgents();
    this.recomputeEdgeLoads();
  }

  private spawnInitialAgents(): void {
    const rand = createSeededRandom(20261023);
    this.agents = [];
    const openEdges = this.edges.filter((e) => !e.isBlocked);
    const residentialNodes = this.nodes.filter(
      (n) => n.category === 'residential',
    );

    // Spawn 86 active agents distributed across the city's evacuation corridors
    for (let i = 0; i < 86; i++) {
      const r = rand();
      const mobilityClass: AgentMobilityClass =
        r < 0.7 ? 'standard' : r < 0.9 ? 'slow' : 'fast';
      const speedMultiplier = getMobilityMultiplier(mobilityClass);

      const edge = openEdges[i % openEdges.length];
      const resOrigin = residentialNodes[i % residentialNodes.length];
      const currentNodeId = edge.from;
      const nextNodeId = edge.to;

      const route = findOptimalShelterRoute(
        nextNodeId,
        this.nodes,
        this.edges,
      );

      this.agents.push({
        id: `AGT-${String(i + 1).padStart(3, '0')}`,
        originNodeId: resOrigin.id,
        currentNodeId,
        nextNodeId,
        targetShelterId: route.shelterId ?? 'N18',
        currentEdgeId: edge.id,
        edgeProgress: ((i * 0.29) % 0.86) + 0.06,
        edgeDirection: 1,
        mobilityClass,
        speedMultiplier,
        currentSpeedKmh: 42 * speedMultiplier,
        status: 'evacuating',
        rerouteCount: 0,
        distanceTraveledMeters: 0,
      });
    }
  }

  private findEdgeBetween(
    nodeA: string,
    nodeB: string,
  ): { edge: GraphEdge; direction: 1 | -1 } | null {
    for (const edge of this.edges) {
      if (edge.from === nodeA && edge.to === nodeB) {
        return { edge, direction: 1 };
      }
      if (edge.to === nodeA && edge.from === nodeB) {
        return { edge, direction: -1 };
      }
    }
    return null;
  }

  private recomputeEdgeLoads(): void {
    const counts = new Map<string, number>();
    for (const edge of this.edges) {
      counts.set(edge.id, 0);
    }
    for (const agent of this.agents) {
      if (agent.status !== 'sheltered' && agent.currentEdgeId) {
        counts.set(
          agent.currentEdgeId,
          (counts.get(agent.currentEdgeId) ?? 0) + 1,
        );
      }
    }

    for (const edge of this.edges) {
      if (edge.isBlocked) {
        edge.agentCount = 0;
        edge.currentLoad = 0;
        edge.loadRatio = 0;
        continue;
      }
      const agCount = counts.get(edge.id) ?? 0;
      edge.agentCount = agCount;
      edge.currentLoad = edge.baselineLoad + agCount;
      const effectiveCap = edge.isContraFlow
        ? edge.capacity * 1.85
        : edge.capacity;
      edge.loadRatio = edge.currentLoad / Math.max(1, effectiveCap);
    }
  }

  public tick(deltaSimSeconds = 4.5): SimulationSnapshot {
    this.stepCount += 1;
    this.elapsedMinutes += deltaSimSeconds / 60;

    for (const agent of this.agents) {
      if (agent.status === 'sheltered') {
        // Respawn new evacuation wave from origin residential zone so the 3D traffic flow remains continuously inspectable
        const originNode =
          this.nodes.find((n) => n.id === agent.originNodeId) ?? this.nodes[0];
        const route = findOptimalShelterRoute(
          originNode.id,
          this.nodes,
          this.edges,
        );
        if (route.path.length > 1) {
          const nextId = route.path[1];
          const edgeInfo = this.findEdgeBetween(originNode.id, nextId);
          agent.currentNodeId = originNode.id;
          agent.nextNodeId = nextId;
          agent.targetShelterId = route.shelterId ?? 'N18';
          agent.currentEdgeId = edgeInfo?.edge.id ?? null;
          agent.edgeDirection = edgeInfo?.direction ?? 1;
          agent.edgeProgress = 0;
          agent.status = 'evacuating';
        }
        continue;
      }

      const currentEdge = this.edges.find(
        (e) => e.id === agent.currentEdgeId,
      );

      // If current edge became blocked mid-transit, immediately reroute from currentNodeId
      if (!currentEdge || currentEdge.isBlocked) {
        this.rerouteAgent(agent, agent.currentNodeId);
        continue;
      }

      const bpr = calculateBPRMetrics(currentEdge);
      const effectiveAgentSpeedKmh = Math.max(
        5,
        bpr.effectiveSpeedKmh * agent.speedMultiplier,
      );
      agent.currentSpeedKmh = effectiveAgentSpeedKmh;

      const speedMetersPerSec = (effectiveAgentSpeedKmh * 1000) / 3600;
      const stepMeters = speedMetersPerSec * deltaSimSeconds;
      agent.distanceTraveledMeters += stepMeters;
      agent.edgeProgress += stepMeters / Math.max(100, currentEdge.length);

      if (agent.edgeProgress >= 1.0) {
        const arrivedNodeId = agent.nextNodeId;
        const arrivedNode = this.nodes.find((n) => n.id === arrivedNodeId);

        if (arrivedNode && arrivedNode.category === 'shelter') {
          const cap = arrivedNode.capacity ?? 200;
          const occ = arrivedNode.occupied ?? 0;
          if (occ < cap) {
            arrivedNode.occupied = Math.min(cap, occ + 1);
            agent.status = 'sheltered';
            agent.currentNodeId = arrivedNodeId;
            agent.edgeProgress = 0;
            continue;
          } else {
            // Shelter is 100% FULL -> Dynamic Rerouting!
            this.rerouteAgent(agent, arrivedNodeId);
            continue;
          }
        }

        // Advance along optimal path from arrivedNodeId
        const targetShelter = this.nodes.find(
          (n) => n.id === agent.targetShelterId,
        );
        const shelterFull =
          !targetShelter ||
          (targetShelter.occupied ?? 0) >= (targetShelter.capacity ?? 200);

        const route = findOptimalShelterRoute(
          arrivedNodeId,
          this.nodes,
          this.edges,
        );

        if (shelterFull && route.shelterId && route.shelterId !== agent.targetShelterId) {
          agent.rerouteCount += 1;
          this.rerouteEventsCount += 1;
          agent.status = 'rerouting';
        } else {
          agent.status = 'evacuating';
        }

        if (route.path.length > 1) {
          const nextHop = route.path[1];
          const nextEdge = this.findEdgeBetween(arrivedNodeId, nextHop);
          agent.currentNodeId = arrivedNodeId;
          agent.nextNodeId = nextHop;
          agent.targetShelterId = route.shelterId ?? agent.targetShelterId;
          agent.currentEdgeId = nextEdge?.edge.id ?? null;
          agent.edgeDirection = nextEdge?.direction ?? 1;
          agent.edgeProgress = 0;
        } else {
          agent.edgeProgress = 0;
        }
      }
    }

    this.recomputeEdgeLoads();
    return this.getSnapshot();
  }

  private rerouteAgent(agent: Agent, fromNodeId: string): void {
    const route = findOptimalShelterRoute(fromNodeId, this.nodes, this.edges);
    agent.rerouteCount += 1;
    this.rerouteEventsCount += 1;
    agent.status = 'rerouting';

    if (route.path.length > 1) {
      const nextHop = route.path[1];
      const nextEdge = this.findEdgeBetween(fromNodeId, nextHop);
      agent.currentNodeId = fromNodeId;
      agent.nextNodeId = nextHop;
      agent.targetShelterId = route.shelterId ?? agent.targetShelterId;
      agent.currentEdgeId = nextEdge?.edge.id ?? null;
      agent.edgeDirection = nextEdge?.direction ?? 1;
      agent.edgeProgress = 0;
    }
  }

  public toggleEdgeBlockage(edgeId: string): SimulationSnapshot {
    const targetId = edgeId === 'E05' ? 'R-10' : edgeId === 'E01' ? 'R-29' : edgeId;
    const edge = this.edges.find((e) => e.id === edgeId || e.id === targetId);
    if (edge) {
      edge.isBlocked = !edge.isBlocked;
      if (edge.isBlocked) {
        for (const agent of this.agents) {
          if (agent.currentEdgeId === edge.id) {
            this.rerouteAgent(agent, agent.currentNodeId);
          }
        }
      }
      this.recomputeEdgeLoads();
    }
    return this.getSnapshot();
  }

  public toggleEdgeContraFlow(edgeId: string): SimulationSnapshot {
    const targetId = edgeId === 'E05' ? 'R-10' : edgeId === 'E01' ? 'R-29' : edgeId;
    const edge = this.edges.find((e) => e.id === edgeId || e.id === targetId);
    if (edge && !edge.isBlocked) {
      edge.isContraFlow = !edge.isContraFlow;
      this.recomputeEdgeLoads();
    }
    return this.getSnapshot();
  }

  public applyContraFlowToCriticalBottlenecks(enable: boolean): SimulationSnapshot {
    for (const edge of this.edges) {
      if (!edge.isBlocked && (edge.loadRatio >= 1.5 || edge.isContraFlow)) {
        edge.isContraFlow = enable;
      }
    }
    this.recomputeEdgeLoads();
    return this.getSnapshot();
  }

  public reset(): SimulationSnapshot {
    const { nodes, edges } = createInitialGreenfieldGraph();
    this.nodes = nodes;
    this.edges = edges;
    this.stepCount = 0;
    this.elapsedMinutes = 0;
    this.rerouteEventsCount = 0;
    this.spawnInitialAgents();
    this.recomputeEdgeLoads();
    return this.getSnapshot();
  }

  public getSnapshot(): SimulationSnapshot {
    const activeAgents = this.agents.filter((a) => a.status !== 'sheltered');
    const avgSpeed =
      activeAgents.length > 0
        ? activeAgents.reduce((acc, a) => acc + a.currentSpeedKmh, 0) /
          activeAgents.length
        : 0;

    const criticalBottlenecks = this.edges
      .filter((e) => !e.isBlocked && e.loadRatio >= 1.4)
      .map((e) => ({
        edgeId: e.id,
        name: e.name,
        loadPct: Math.round(e.loadRatio * 100),
      }))
      .sort((a, b) => b.loadPct - a.loadPct);

    const contraFlowCount = this.edges.filter((e) => e.isContraFlow).length;
    const blockedBridges = this.edges.filter((e) => e.isBlocked).length;
    const baseClearance = 48 + blockedBridges * 9 - contraFlowCount * 2.4;
    const estimatedClearanceMinutes = Math.max(
      24,
      Math.round(baseClearance * 10) / 10,
    );

    const totalSheltered = this.nodes
      .filter((n) => n.category === 'shelter')
      .reduce((acc, s) => acc + (s.occupied ?? 0), 0);

    return {
      step: this.stepCount,
      elapsedMinutes: Math.round(this.elapsedMinutes * 10) / 10,
      nodes: this.nodes.map((n) => ({ ...n })),
      edges: this.edges.map((e) => ({ ...e })),
      agents: this.agents.map((a) => ({ ...a })),
      activeAgentCount: activeAgents.length,
      shelteredAgentCount: totalSheltered,
      totalEvacuees: totalSheltered + activeAgents.length,
      rerouteEventsCount: this.rerouteEventsCount,
      averageSpeedKmh: Math.round(avgSpeed * 10) / 10,
      estimatedClearanceMinutes,
      criticalBottlenecks,
    };
  }
}
