import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { I18nProvider, SUPPORTED_LANGUAGES } from '../i18n';
import { EXPEDITION_COPY } from '../i18n/expeditions';
import { createInitialGameState, startExpedition, tickGame } from '../game';
import { ExpeditionEntry, ExpeditionMap } from './ExpeditionMap';

const noop = () => undefined;
describe('expedition presentation', () => {
  it.each(SUPPORTED_LANGUAGES)('localizes the planner and accessible controls in %s', language => {
    const state = createInitialGameState(1000); state.buildings.war_camp = 1;
    const html = renderToStaticMarkup(<I18nProvider language={language}><ExpeditionMap open state={state} onClose={noop} onLaunch={noop} onCancel={noop} onClaim={noop} /></I18nProvider>);
    const copy = EXPEDITION_COPY[language];
    expect(html).toContain(copy.title);
    expect(html).toContain(copy.launch);
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-pressed="true"');
    expect(html.match(/type="radio"/g)).toHaveLength(3);
    expect(html.match(/expedition-pin__seal/g)).toHaveLength(3);
    expect(Object.keys(copy)).toEqual(Object.keys(EXPEDITION_COPY.en));
    expect(Object.values(copy).every(value => value.length > 0)).toBe(true);
  });
  it('explains the unlock gate for fresh players', () => {
    const html = renderToStaticMarkup(<ExpeditionEntry state={createInitialGameState(1000)} onOpen={noop} />);
    expect(html).toContain('Build a War Camp'); expect(html).toContain('disabled');
  });
  it('shows a recall while traveling, then an accessible claim and restored production at arrival', () => {
    const s = createInitialGameState(1000); s.buildings.war_camp = 1;
    const active = startExpedition(s, { destination: 'ruins', crew: 'keepers', band: 'short', complication: false });
    const render = (state: typeof s) => renderToStaticMarkup(<ExpeditionMap open state={state} onClose={noop} onLaunch={noop} onCancel={noop} onClaim={noop} />);
    const traveling = render(active);
    expect(traveling).toContain('Recall crew');
    expect(traveling).not.toContain('Send crew');
    expect(traveling.match(/aria-disabled="true"/g)).toHaveLength(2);
    const arrived = render(tickGame(active, active.expeditions.active!.endsAt));
    expect(arrived).toContain('Welcome crew home'); expect(arrived).toContain('Production is fully restored');
  });
});
