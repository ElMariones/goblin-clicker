import { createServer } from 'vite';
import { writeFileSync } from 'node:fs';

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
try {
  const { simulateRoboPacing } = await server.ssrLoadModule('/src/game/robo/pacing.ts');
  const results = [
    { hours: 72, active: false, recompile: false, projects: false },
    { hours: 72, active: true, recompile: true, projects: false },
    { hours: 720, active: true, recompile: true, projects: true },
  ].map((scenario) => ({ ...scenario, ...simulateRoboPacing(scenario.hours, scenario.active, scenario.recompile, scenario.projects) }));
  writeFileSync(new URL('./engine-balance-results.json', import.meta.url), JSON.stringify(results, null, 2) + '\n');
  console.log(JSON.stringify(results, null, 2));
} finally {
  await server.close();
}
