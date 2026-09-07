type SoundName = 'spawn' | 'buy' | 'upgrade' | 'achievement' | 'mooncap' | 'prestige';

let context: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === 'undefined' || !('AudioContext' in window)) return null;
  context ??= new AudioContext();
  if (context.state === 'suspended') void context.resume();
  return context;
}

function tone(frequency: number, duration: number, gainValue: number, type: OscillatorType = 'sine', offset = 0) {
  const audio = getContext();
  if (!audio) return;
  const start = audio.currentTime + offset;
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, gainValue), start + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain);
  gain.connect(audio.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}

export function playSound(name: SoundName, enabled: boolean) {
  if (!enabled) return;
  switch (name) {
    case 'spawn':
      tone(160, 0.055, 0.025, 'triangle');
      tone(230, 0.04, 0.012, 'sine', 0.018);
      break;
    case 'buy':
      tone(260, 0.07, 0.025, 'square');
      tone(390, 0.08, 0.02, 'triangle', 0.04);
      break;
    case 'upgrade':
      tone(330, 0.09, 0.024, 'triangle');
      tone(495, 0.11, 0.025, 'triangle', 0.055);
      tone(660, 0.12, 0.018, 'sine', 0.11);
      break;
    case 'achievement':
      tone(440, 0.09, 0.028, 'sine');
      tone(554, 0.1, 0.025, 'sine', 0.07);
      tone(659, 0.16, 0.023, 'sine', 0.14);
      break;
    case 'mooncap':
      tone(740, 0.12, 0.025, 'sine');
      tone(1046, 0.2, 0.018, 'sine', 0.08);
      break;
    case 'prestige':
      tone(220, 0.2, 0.025, 'sine');
      tone(330, 0.22, 0.022, 'triangle', 0.1);
      tone(440, 0.35, 0.02, 'sine', 0.22);
      break;
  }
}

