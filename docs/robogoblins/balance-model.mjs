/** Design-only reference model. Not imported by the game. Units: seconds and RG. */
export const TUNING = {
  permitCost: 100, permitLifetimeCunning: 2500, permitMigrations: 3,
  startingStock: 20, coreScale: 10_000_000, coreCoefficient: 0.1,
  growth: 1.14, offlineEfficiency: 0.8, offlineHours: 8,
  overclockCapacity: 120, overclockDuration: 30, overclockMultiplier: 2,
};

// id, name, base cost, average RG/s, batch interval, visual concept
export const LINES = [
  ['tin_cradle', 'Tin Cradle', 20, 0.5, 2, 'A soup tin rocks a newborn with mismatched ears.'],
  ['windup_workbench', 'Wind-up Workbench', 160, 4, 4, 'A goblin winds another goblin, who steals the key.'],
  ['cutlery_press', 'Cutlery Press', 2000, 32, 8, 'Forks become fingers; spoons become suspiciously large ears.'],
  ['magnet_nursery', 'Magnet Nursery', 26000, 240, 16, 'Hanging magnets fish tiny metal goblins from a scrap pool.'],
  ['boiler_brood', 'Boiler Brood', 350000, 1800, 8, 'An iron mother rocks a clutch of hissing pressure vessels.'],
  ['punchcard_den', 'Punchcard Den', 5000000, 13000, 16, 'Chewed instruction cards teach machines how to be rude.'],
  ['servo_scriptorium', 'Servo Scriptorium', 80000000, 95000, 32, 'Mechanical monks copy assembly plans with stolen quills.'],
  ['walking_foundry', 'Walking Foundry', 1400000000, 700000, 64, 'A furnace on chicken legs brings its own workforce.'],
  ['thunderhead_coil', 'Thunderhead Coil', 28000000000, 5200000, 16, 'A bottled storm mistakes every spark for a birth certificate.'],
  ['moonwire_loom', 'Moonwire Loom', 600000000000, 40000000, 32, 'Lunar wire is knitted into grinning skeletons.'],
  ['clockwyrm_assembly', 'Clockwyrm Assembly', 14000000000000, 320000000, 64, 'A gear-toothed dragon coughs up complete production lines.'],
  ['paradox_nest', 'Paradox Nest', 350000000000000, 2600000000, 64, 'Tomorrow’s robots arrive to assemble yesterday’s parents.'],
].map(([id, name, cost, rate, cycle, art]) => ({ id, name, cost, rate, cycle, art }));

export const MILESTONES = [
  [10, 2, 'Bolted'], [25, 2, 'Calibrated'], [50, 3, 'Synchronized'],
  [100, 4, 'Self-tooling'], [150, 2, 'Replicating'], [200, 3, 'Distributed'],
  [250, 3, 'Recursive'], [300, 4, 'Unreasonably Alive'],
];
export const GLOBAL_RESEARCH = [
  ['common_thread', 'Common Thread', 2000, 1.25],
  ['standard_sockets', 'Standard Sockets', 200000, 1.25],
  ['distributed_mischief', 'Distributed Mischief', 20000000, 1.5],
  ['factory_remembers', 'The Factory Remembers', 2000000000, 1.5],
  ['illegal_recursion', 'Illegal Recursion', 200000000000, 1.75],
  ['birth_without_permission', 'Birth Without Permission', 20000000000000, 2],
].map(([id, name, cost, multiplier]) => ({ id, name, cost, multiplier }));
export const BLUEPRINT_TIERS = [
  { threshold: 10, costFactor: 25, multiplier: 2, suffix: 'Stolen Plans' },
  { threshold: 50, costFactor: 500, multiplier: 2, suffix: 'Self-inspection' },
  { threshold: 100, costFactor: 20000, multiplier: 2, suffix: 'Recursive Tooling' },
];
export const KERNEL_PERKS = [
  { id: 'better_bolts', name: 'Better Bolts', base: 1, growth: 2, max: 10 },
  { id: 'boot_cache', name: 'Boot Cache', base: 2, growth: 2, max: 5 },
  { id: 'night_shift', name: 'Night Shift', base: 2, growth: 2, max: 4 },
  { id: 'deep_battery', name: 'Deep Battery', base: 3, growth: 2, max: 8 },
  { id: 'copper_memory', name: 'Copper Memory', base: 3, growth: 2, max: 5 },
  { id: 'warm_start', name: 'Warm Start', base: 4, growth: 2, max: 4 },
  { id: 'finger_servos', name: 'Finger Servos', base: 2, growth: 2, max: 5 },
  { id: 'family_adapter', name: 'Family Adapter', base: 5, growth: 2, max: 5 },
];

export function createState({ earned = 0, perks = {}, lifetime = 0, blueprintMultiplier = 1 } = {}) {
  return {
    stock: TUNING.startingStock + 100 * (perks.boot_cache ?? 0), lifetime, run: 0,
    counts: LINES.map(() => 0), blueprints: LINES.map(() => 0), globals: 0,
    phase: LINES.map(() => 0), pending: LINES.map(() => 0),
    earned, cores: earned, perks, policy: null, cadence: null,
    charge: 0, overclockLeft: 0, now: 0, blueprintMultiplier,
  };
}
export function corePotential(lifetime) {
  const amount = Math.max(0, lifetime);
  let n = Math.min(1_000_000_000, Math.floor(Math.cbrt(amount / TUNING.coreScale)));
  while (n < 1_000_000_000 && TUNING.coreScale * (n + 1) ** 3 <= amount) n++;
  while (n > 0 && TUNING.coreScale * n ** 3 > amount) n--;
  return n;
}
export const coreGain = s => Math.max(0, corePotential(s.lifetime) - s.earned);
export const cunningThreshold = total => 5_000_000 * total ** 2;
export const perkCost = (perk, rank) => rank >= perk.max ? Infinity : Math.ceil(perk.base * perk.growth ** rank);
export const mastery = n => MILESTONES.reduce((v, [threshold, multiplier]) => v * (n >= threshold ? multiplier : 1), 1);
export function circuitLevels(s) {
  return [0, 4, 8].map(start => [10, 25, 50, 100].filter(n => s.counts.slice(start, start + 4).every(c => c >= n)).length);
}
export function rates(s, temporary = false) {
  const network = 1 + circuitLevels(s).reduce((a, b) => a + b, 0) * (0.1 + 0.01 * (s.perks.copper_memory ?? 0));
  const core = 1 + TUNING.coreCoefficient * s.earned;
  const global = GLOBAL_RESEARCH.slice(0, s.globals).reduce((m, u) => m * u.multiplier, 1);
  const policy = s.policy === 'clock' ? 1.2 : 1;
  const cadence = s.cadence === 'heavy' ? 1.15 : 1;
  const overclock = temporary && s.overclockLeft > 0 ? TUNING.overclockMultiplier : 1;
  return LINES.map((b, i) => b.rate * s.counts[i] * mastery(s.counts[i]) * 2 ** s.blueprints[i]
    * network * core * global * policy * cadence * overclock * s.blueprintMultiplier * (1 + 0.05 * (s.perks.better_bolts ?? 0)));
}
export const totalRate = s => rates(s).reduce((a, b) => a + b, 0);
export function clickPower(s) {
  // Pre-policy, non-overclocked production keeps clock from also winning the active niche.
  const p = totalRate(s) / (s.policy === 'clock' ? 1.2 : 1);
  return (1 + p * (s.policy === 'spark' ? 0.15 : 0.03)) * (1 + 0.1 * (s.perks.finger_servos ?? 0));
}
export function bulkCost(s, i, count) {
  if (count <= 0) return 0;
  return Math.ceil(LINES[i].cost * TUNING.growth ** s.counts[i] * Math.expm1(count * Math.log(TUNING.growth)) / (TUNING.growth - 1) - 1e-9);
}
export function credit(s, amount) { s.stock += amount; s.run += amount; s.lifetime += amount; }

/** Integrates an interval of constant average rate; cycles pay automatically. */
export function integrateLine(phase, pending, cycle, rate, seconds) {
  const first = cycle - phase;
  if (seconds < first - 1e-9) return { phase: phase + seconds, pending: pending + rate * seconds, paid: 0 };
  const remaining = Math.max(0, seconds - first);
  const full = Math.floor((remaining + 1e-9) / cycle);
  const rest = Math.max(0, remaining - full * cycle);
  return { phase: rest, pending: rate * rest, paid: pending + rate * first + full * cycle * rate };
}
export function advance(s, seconds, { offline = false } = {}) {
  let left = seconds;
  if (offline) {
    left = Math.min(seconds, (TUNING.offlineHours + 2 * (s.perks.deep_battery ?? 0)) * 3600);
    s.overclockLeft = 0;
  }
  while (left > 1e-9) {
    const dt = !offline && s.overclockLeft > 0 ? Math.min(left, s.overclockLeft) : left;
    const efficiency = offline ? Math.min(1, TUNING.offlineEfficiency + 0.05 * (s.perks.night_shift ?? 0)) : 1;
    const output = rates(s, !offline);
    LINES.forEach((b, i) => {
      if (!s.counts[i]) return;
      const cycle = b.cycle * (s.cadence === 'quick' ? 0.5 : s.cadence === 'heavy' ? 2 : 1);
      const next = integrateLine(s.phase[i], s.pending[i], cycle, output[i] * efficiency, dt);
      s.phase[i] = next.phase; s.pending[i] = next.pending;
      credit(s, next.paid);
    });
    if (s.overclockLeft <= 0 && s.counts.some(n => n > 0)) s.charge = Math.min(TUNING.overclockCapacity, s.charge + dt);
    s.overclockLeft = Math.max(0, s.overclockLeft - dt);
    left -= dt;
  }
  s.now += seconds;
}
export function recompile(s) {
  // Drain already manufactured pending stock; this is a transfer, not free output.
  const lifetime = s.lifetime + s.pending.reduce((a, b) => a + b, 0);
  const gain = coreGain({ ...s, lifetime });
  if (!gain) return null;
  const next = createState({ earned: s.earned + gain, perks: { ...s.perks }, lifetime, blueprintMultiplier: s.blueprintMultiplier });
  next.cores = s.cores + gain;
  next.charge = 30 * (next.perks.warm_start ?? 0);
  return next;
}

function candidates(s, strategy, forcedPolicy, forcedCadence) {
  const before = totalRate(s);
  const list = [];
  LINES.forEach((b, i) => {
    if (i > 0 && !s.counts[i - 1]) return;
    const counts = [1];
    if (strategy !== 'single') {
      const next = MILESTONES.find(([threshold]) => threshold > s.counts[i]);
      if (next) counts.push(next[0] - s.counts[i]);
    }
    for (const n of new Set(counts)) {
      const cost = bulkCost(s, i, n);
      s.counts[i] += n;
      const delta = totalRate(s) - before;
      s.counts[i] -= n;
      list.push({ cost, delta, delay: b.cycle / 2, apply: () => { s.counts[i] += n; } });
    }
    const tier = BLUEPRINT_TIERS[s.blueprints[i]];
    if (tier && s.counts[i] >= tier.threshold) {
      const cost = b.cost * tier.costFactor;
      s.blueprints[i]++;
      const delta = totalRate(s) - before;
      s.blueprints[i]--;
      list.push({ cost, delta, delay: 0, apply: () => { s.blueprints[i]++; } });
    }
  });
  const g = GLOBAL_RESEARCH[s.globals];
  if (g) list.push({ cost: g.cost, delta: before * (g.multiplier - 1), delay: 0, apply: () => { s.globals++; } });
  if (!s.policy && s.run >= 1000000 && s.stock >= 500000) {
    s.stock -= 500000; s.policy = forcedPolicy;
    return candidates(s, strategy, forcedPolicy, forcedCadence);
  }
  if (!s.cadence && s.run >= 1000000000 && s.stock >= 500000000) {
    s.stock -= 500000000; s.cadence = forcedCadence;
    // Cadence changes restart phases after settling accrued output.
    credit(s, s.pending.reduce((a, b) => a + b, 0)); s.pending.fill(0); s.phase.fill(0);
    return candidates(s, strategy, forcedPolicy, forcedCadence);
  }
  return list;
}

/** Heuristic player; no claim of optimal play or human pacing. */
export function simulate({ hours = 12, clicksPerSecond = 0, activeSeconds = Infinity, decisionSeconds = 10,
  strategy = 'milestone', useOverclock = false, policy = 'clock', cadence = 'heavy',
  initial = createState(), targetCores = 8, stopAtTarget = true } = {}) {
  const s = structuredClone(initial);
  const entered = s.now;
  const firstOwned = LINES.map(() => null);
  let firstCircuit = null;
  const coreTimes = {};
  for (let elapsed = 0; elapsed < hours * 3600; elapsed++) {
    if (elapsed % decisionSeconds === 0) {
      for (let purchases = 0; purchases < 100; purchases++) {
        const list = candidates(s, strategy, policy, cadence);
        const p = Math.max(0.5, totalRate(s) + (elapsed < activeSeconds ? clicksPerSecond * clickPower(s) : 0));
        const relevant = list.filter(c => c.delta > 0 && c.cost <= s.stock + p * 300);
        relevant.sort((a, b) => (Math.max(0, a.cost - s.stock) / p + a.cost / a.delta + a.delay) - (Math.max(0, b.cost - s.stock) / p + b.cost / b.delta + b.delay));
        const best = relevant[0];
        if (!best || best.cost > s.stock) break;
        s.stock -= best.cost; best.apply();
      }
    }
    LINES.forEach((b, i) => { if (s.counts[i] && firstOwned[i] === null) firstOwned[i] = elapsed; });
    if (firstCircuit === null && circuitLevels(s).some(n => n > 0)) firstCircuit = elapsed;
    if (useOverclock && s.charge >= TUNING.overclockCapacity && s.overclockLeft === 0) {
      s.charge -= TUNING.overclockCapacity; s.overclockLeft = TUNING.overclockDuration;
    }
    if (elapsed < activeSeconds) credit(s, clickPower(s) * clicksPerSecond);
    advance(s, 1);
    const gain = coreGain({ ...s, lifetime: s.lifetime + s.pending.reduce((a, b) => a + b, 0) });
    for (const target of [1, 4, 8, 16, 32, 64]) if (gain >= target && coreTimes[target] === undefined) coreTimes[target] = elapsed + 1;
    if (gain >= targetCores && stopAtTarget) break;
  }
  return { state: s, elapsed: s.now - entered, firstOwned, firstCircuit, coreTimes };
}
