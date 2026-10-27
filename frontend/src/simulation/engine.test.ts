import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateBPRMetrics,
  calculateEffectiveSpeed,
  createInitialGreenfieldGraph,
  EvacuationSimulationEngine,
  findOptimalShelterRoute,
  getMobilityMultiplier,
} from './engine';

test('Greenfield City graph has exactly 20 nodes (7 residential, 9 junctions, 4 shelters) and 32 edges', () => {
  const { nodes, edges } = createInitialGreenfieldGraph();
  assert.equal(nodes.length, 20);
  assert.equal(edges.length, 32);

  const residential = nodes.filter((n) => n.category === 'residential');
  const junctions = nodes.filter((n) => n.category === 'junction');
  const shelters = nodes.filter((n) => n.category === 'shelter');

  assert.equal(residential.length, 7);
  assert.equal(junctions.length, 9);
  assert.equal(shelters.length, 4);

  // Verify Central River Bridge (N6-N10) starts blocked ('X')
  const centralBridge = edges.find((e) => e.from === 'N6' && e.to === 'N10');
  assert.ok(centralBridge);
  assert.equal(centralBridge.isBlocked, true);
});

test('Speed Degradation Formula respects minimum 18% crawl speed and linear degradation', () => {
  const baseSpeed = 60;
  // Zero load -> 100% speed
  assert.equal(calculateEffectiveSpeed(baseSpeed, 0, 20), 60);

  // Load == Capacity (ratio = 1.0) -> 1.0 - 0.70 * 1.0 = 0.30 -> 18 km/h
  assert.ok(Math.abs(calculateEffectiveSpeed(baseSpeed, 20, 20) - 18) < 1e-6);

  // Extreme overload (ratio = 3.34 -> capped at min(2.0, ratio), max(0.18, ...)) -> 18% of 60 = 10.8 km/h
  assert.ok(Math.abs(calculateEffectiveSpeed(baseSpeed, 66.8, 20) - 10.8) < 1e-6);
});

test('BPR Congestion & Cost Function increases quadratically with load ratio and handles contra-flow', () => {
  const normalMetrics = calculateBPRMetrics({
    length: 600,
    baseSpeed: 60,
    capacity: 20,
    currentLoad: 40, // 200% load -> ratio = 2.0
    hazardExposure: 0.5,
    isBlocked: false,
    isContraFlow: false,
  });

  // T_base = 600 / (60 / 3.6) = 36s
  // Congestion = 36 * (2.2 * 2^2) = 36 * 8.8 = 316.8s
  // Hazard = 36 * (0.5 * 1.5) = 27s
  assert.ok(Math.abs(normalMetrics.freeFlowTimeSec - 36) < 1e-5);
  assert.ok(Math.abs(normalMetrics.congestionPenaltySec - 316.8) < 1e-5);
  assert.ok(Math.abs(normalMetrics.hazardPenaltySec - 27) < 1e-5);
  assert.equal(normalMetrics.loadPercentage, 200);

  // Contra-flow increases capacity by 1.85x, reducing congestion penalty
  const contraMetrics = calculateBPRMetrics({
    length: 600,
    baseSpeed: 60,
    capacity: 20,
    currentLoad: 40,
    hazardExposure: 0.5,
    isBlocked: false,
    isContraFlow: true,
  });
  assert.ok(contraMetrics.totalTravelCostSec < normalMetrics.totalTravelCostSec);
});

test('Agent mobility diversity multipliers match specification (1.0x, 0.65x, 1.35x)', () => {
  assert.equal(getMobilityMultiplier('standard'), 1.0);
  assert.equal(getMobilityMultiplier('slow'), 0.65);
  assert.equal(getMobilityMultiplier('fast'), 1.35);
});

test('Dijkstra shortest-path avoids blocked Central River Bridge (N6-N10) and routes to open shelters', () => {
  const { nodes, edges } = createInitialGreenfieldGraph();
  const route = findOptimalShelterRoute('N6', nodes, edges);

  assert.ok(route.shelterId);
  assert.ok(route.path.length >= 2);
  // N6 -> N10 direct edge is blocked, so second hop cannot be N10
  assert.notEqual(route.path[1], 'N10');
  // Since N17 (220/220) and N19 (150/150) start full, it should pick an open shelter (N20 or N18)
  assert.ok(route.shelterId === 'N20' || route.shelterId === 'N18');
});

test('EvacuationSimulationEngine initializes 86 active agents and updates state across ticks', () => {
  const engine = new EvacuationSimulationEngine();
  const initial = engine.getSnapshot();
  assert.equal(initial.activeAgentCount, 86);
  assert.equal(initial.nodes.length, 20);
  assert.equal(initial.edges.length, 32);

  const afterTick = engine.tick(5.0);
  assert.equal(afterTick.step, 1);
  assert.ok(afterTick.averageSpeedKmh > 0);
});
