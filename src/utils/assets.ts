import brandLogo from '../images/brand-logo.webp';
import bogHatchery from '../images/building-bog-hatchery.webp';
import broodMatron from '../images/building-brood-matron.webp';
import deepforgeVat from '../images/building-deepforge-vat.webp';
import goblinGate from '../images/building-goblin-gate.webp';
import moonsporeCavern from '../images/building-moonspore-cavern.webp';
import mushroomNursery from '../images/building-mushroom-nursery.webp';
import realityBurrow from '../images/building-reality-burrow.webp';
import scrapIncubator from '../images/building-scrap-incubator.webp';
import shamanCircle from '../images/building-shaman-circle.webp';
import warCamp from '../images/building-war-camp.webp';
import warrenDen from '../images/building-warren-den.webp';
import wyrmHoard from '../images/building-wyrm-hoard.webp';
import goblinSpawn from '../images/goblin-spawn.webp';
import missionGiver from '../images/mission.webp';

export function publicAsset(path: string): string {
  const cleanPath = path.replace(/^\/+/, '');
  return `${import.meta.env.BASE_URL}${cleanPath}`;
}

const BUILDING_IMAGE_ART: Readonly<Record<string, string>> = {
  brood_matron: broodMatron,
  mushroom_nursery: mushroomNursery,
  warren_den: warrenDen,
  bog_hatchery: bogHatchery,
  scrap_incubator: scrapIncubator,
  shaman_circle: shamanCircle,
  war_camp: warCamp,
  moonspore_cavern: moonsporeCavern,
  deepforge_vat: deepforgeVat,
  goblin_gate: goblinGate,
  wyrm_hoard: wyrmHoard,
  reality_burrow: realityBurrow,
};

export const gameArt = {
  brandLogo,
  goblinSpawn,
  missionGiver,
} as const;

/**
 * Prefer the bespoke transparent raster set where one exists, while keeping the
 * original SVG library as a deterministic fallback for art that has not yet
 * received a matching painted asset.
 */
export function buildingArtAsset(id: string): string {
  return BUILDING_IMAGE_ART[id] ?? publicAsset(`assets/building-${id.replace(/_/g, '-')}.svg`);
}
