import type { LanguageCode } from './index';

export interface RoboUnlockCopy {
  switchLockedLabel: string;
  switchLockedDetail: string;
  switchReadyLabel: string;
  switchReadyDetail: string;
  switchOwnedLabel: string;
  switchOwnedDetail: string;
  title: string;
  subtitle: string;
  frontier: string;
  requirement: string;
  requirementProgress: string;
  requirementMet: string;
  permanent: string;
  price: string;
  balance: string;
  buy: string;
  needMore: string;
  enter: string;
  purchasedTitle: string;
  purchasedMessage: string;
}

const EN: RoboUnlockCopy = {
  switchLockedLabel: 'RoboGoblins locked',
  switchLockedDetail: 'Unlock every Warren building to discover this frontier.',
  switchReadyLabel: 'Unlock RoboGoblins',
  switchReadyDetail: 'All Warren buildings discovered · costs 100 Ancestral Cunning.',
  switchOwnedLabel: 'Enter RoboGoblins',
  switchOwnedDetail: 'The foundry runs in parallel with your Warren.',
  title: 'RoboGoblins Foundry',
  subtitle: 'A second production world built from questionable machinery.',
  frontier: 'Mechanical frontier',
  requirement: 'Discover every default Warren building first.',
  requirementProgress: '{current} / {total} buildings discovered',
  requirementMet: 'All Warren buildings discovered',
  permanent: 'Once this frontier is discovered, the option to buy it stays unlocked through every Great Migration. The one-time purchase costs 100 Ancestral Cunning. Your Warren and the foundry keep producing in parallel.',
  price: '100 Ancestral Cunning',
  balance: 'Available: {amount}',
  buy: 'Buy RoboGoblins · 100',
  needMore: 'Need {amount} more Ancestral Cunning',
  enter: 'Enter RoboGoblins',
  purchasedTitle: 'RoboGoblins unlocked',
  purchasedMessage: 'The foundry is online. Your Warren continues producing in parallel.',
};

const COPY: Record<LanguageCode, RoboUnlockCopy> = {
  en: EN,
  es: {
    switchLockedLabel: 'RoboGoblins bloqueados', switchLockedDetail: 'Desbloquea todos los edificios de la Madriguera para descubrir esta frontera.',
    switchReadyLabel: 'Desbloquear RoboGoblins', switchReadyDetail: 'Todos los edificios descubiertos · cuesta 100 de Astucia Ancestral.', switchOwnedLabel: 'Entrar en RoboGoblins', switchOwnedDetail: 'La fundición produce en paralelo con tu Madriguera.',
    title: 'Fundición RoboGoblins', subtitle: 'Un segundo mundo de producción construido con maquinaria de dudosa procedencia.', frontier: 'Frontera mecánica', requirement: 'Descubre primero todos los edificios de la Madriguera básica.', requirementProgress: '{current} / {total} edificios descubiertos', requirementMet: 'Todos los edificios de la Madriguera descubiertos',
    permanent: 'Una vez descubierta esta frontera, la opción de comprarla permanece desbloqueada tras cada Gran Migración. La compra única cuesta 100 de Astucia Ancestral. La Madriguera y la fundición siguen produciendo en paralelo.', price: '100 de Astucia Ancestral', balance: 'Disponible: {amount}', buy: 'Comprar RoboGoblins · 100', needMore: 'Faltan {amount} de Astucia Ancestral', enter: 'Entrar en RoboGoblins', purchasedTitle: 'RoboGoblins desbloqueados', purchasedMessage: 'La fundición está operativa. Tu Madriguera sigue produciendo en paralelo.',
  },
  zh: {
    switchLockedLabel: '机械哥布林未解锁', switchLockedDetail: '解锁巢穴中的全部建筑，才能发现这片新区域。', switchReadyLabel: '解锁机械哥布林', switchReadyDetail: '全部巢穴建筑已发现 · 花费 100 祖传智慧。', switchOwnedLabel: '进入机械哥布林', switchOwnedDetail: '铸造厂会与巢穴并行生产。',
    title: '机械哥布林铸造厂', subtitle: '由可疑机械拼成的第二生产世界。', frontier: '机械边疆', requirement: '先发现默认巢穴中的全部建筑。', requirementProgress: '已发现 {current} / {total} 个建筑', requirementMet: '全部巢穴建筑已发现', permanent: '一旦发现这片边疆，之后无论进行多少次大迁徙，购买资格都会永久保留。一次性购买需要 100 祖传智慧。巢穴与铸造厂会同时持续生产。', price: '100 祖传智慧', balance: '可用：{amount}', buy: '购买机械哥布林 · 100', needMore: '还需要 {amount} 祖传智慧', enter: '进入机械哥布林', purchasedTitle: '机械哥布林已解锁', purchasedMessage: '铸造厂已上线。你的巢穴仍会并行生产。',
  },
  fr: {
    switchLockedLabel: 'RoboGoblins verrouillés', switchLockedDetail: 'Débloquez tous les bâtiments du Terrier pour découvrir cette frontière.', switchReadyLabel: 'Débloquer RoboGoblins', switchReadyDetail: 'Tous les bâtiments sont découverts · coûte 100 Ruse Ancestrale.', switchOwnedLabel: 'Entrer dans RoboGoblins', switchOwnedDetail: 'La fonderie produit en parallèle avec votre Terrier.',
    title: 'Fonderie RoboGoblins', subtitle: 'Un second monde de production assemblé avec des machines douteuses.', frontier: 'Frontière mécanique', requirement: 'Découvrez d’abord tous les bâtiments du Terrier de base.', requirementProgress: '{current} / {total} bâtiments découverts', requirementMet: 'Tous les bâtiments du Terrier sont découverts', permanent: 'Une fois cette frontière découverte, son achat reste disponible après toutes les Grandes Migrations. L’achat unique coûte 100 Ruse Ancestrale. Le Terrier et la fonderie continuent de produire en parallèle.', price: '100 Ruse Ancestrale', balance: 'Disponible : {amount}', buy: 'Acheter RoboGoblins · 100', needMore: 'Il manque {amount} Ruse Ancestrale', enter: 'Entrer dans RoboGoblins', purchasedTitle: 'RoboGoblins débloqués', purchasedMessage: 'La fonderie est en ligne. Votre Terrier continue de produire en parallèle.',
  },
  de: {
    switchLockedLabel: 'RoboGoblins gesperrt', switchLockedDetail: 'Schalte alle Bau-Gebäude frei, um diese Grenze zu entdecken.', switchReadyLabel: 'RoboGoblins freischalten', switchReadyDetail: 'Alle Bau-Gebäude entdeckt · kostet 100 Ahnenlist.', switchOwnedLabel: 'RoboGoblins betreten', switchOwnedDetail: 'Die Gießerei produziert parallel zu deinem Bau.',
    title: 'RoboGoblins-Gießerei', subtitle: 'Eine zweite Produktionswelt aus höchst fragwürdigen Maschinen.', frontier: 'Mechanische Grenze', requirement: 'Entdecke zuerst alle Gebäude des normalen Baus.', requirementProgress: '{current} / {total} Gebäude entdeckt', requirementMet: 'Alle Bau-Gebäude entdeckt', permanent: 'Sobald diese Grenze entdeckt wurde, bleibt der Kauf nach jeder Großen Wanderung verfügbar. Der einmalige Kauf kostet 100 Ahnenlist. Bau und Gießerei produzieren parallel weiter.', price: '100 Ahnenlist', balance: 'Verfügbar: {amount}', buy: 'RoboGoblins kaufen · 100', needMore: 'Noch {amount} Ahnenlist benötigt', enter: 'RoboGoblins betreten', purchasedTitle: 'RoboGoblins freigeschaltet', purchasedMessage: 'Die Gießerei ist online. Dein Bau produziert parallel weiter.',
  },
  ar: {
    switchLockedLabel: 'الغوبلن الآلي مقفل', switchLockedDetail: 'افتح جميع مباني الوكر لاكتشاف هذه الجبهة.', switchReadyLabel: 'فتح عالم الغوبلن الآلي', switchReadyDetail: 'اكتُشفت جميع مباني الوكر · التكلفة 100 من الدهاء الموروث.', switchOwnedLabel: 'دخول عالم الغوبلن الآلي', switchOwnedDetail: 'يعمل المسبك بالتوازي مع الوكر.',
    title: 'مسبك الغوبلن الآلي', subtitle: 'عالم إنتاج ثانٍ مبني من آلات مشكوك في أمرها.', frontier: 'الجبهة الميكانيكية', requirement: 'اكتشف أولًا جميع مباني الوكر الأساسية.', requirementProgress: 'اكتُشف {current} / {total} من المباني', requirementMet: 'اكتُشفت جميع مباني الوكر', permanent: 'بعد اكتشاف هذه الجبهة يبقى خيار شرائها مفتوحًا عبر كل هجرة كبرى. الشراء لمرة واحدة يكلف 100 من الدهاء الموروث. يواصل الوكر والمسبك الإنتاج بالتوازي.', price: '100 من الدهاء الموروث', balance: 'المتاح: {amount}', buy: 'شراء RoboGoblins · 100', needMore: 'تحتاج إلى {amount} إضافية من الدهاء الموروث', enter: 'دخول عالم الغوبلن الآلي', purchasedTitle: 'تم فتح RoboGoblins', purchasedMessage: 'المسبك يعمل الآن. يواصل وكرك الإنتاج بالتوازي.',
  },
  tr: {
    switchLockedLabel: 'RoboGoblinler kilitli', switchLockedDetail: 'Bu cepheyi keşfetmek için tüm İn binalarını aç.', switchReadyLabel: 'RoboGoblinleri aç', switchReadyDetail: 'Tüm İn binaları keşfedildi · 100 Atasal Kurnazlık.', switchOwnedLabel: 'RoboGoblinlere gir', switchOwnedDetail: 'Dökümhane İn ile paralel üretim yapar.',
    title: 'RoboGoblin Dökümhanesi', subtitle: 'Şüpheli makinelerden kurulmuş ikinci bir üretim dünyası.', frontier: 'Mekanik cephe', requirement: 'Önce varsayılan İn’deki tüm binaları keşfet.', requirementProgress: '{current} / {total} bina keşfedildi', requirementMet: 'Tüm İn binaları keşfedildi', permanent: 'Bu cephe bir kez keşfedildiğinde satın alma seçeneği her Büyük Göç sonrasında da açık kalır. Tek seferlik satın alma 100 Atasal Kurnazlık tutar. İn ve dökümhane paralel üretmeye devam eder.', price: '100 Atasal Kurnazlık', balance: 'Mevcut: {amount}', buy: 'RoboGoblinleri satın al · 100', needMore: '{amount} Atasal Kurnazlık daha gerekli', enter: 'RoboGoblinlere gir', purchasedTitle: 'RoboGoblinler açıldı', purchasedMessage: 'Dökümhane çevrimiçi. İn paralel üretmeye devam ediyor.',
  },
};

export function getRoboUnlockCopy(language: LanguageCode): RoboUnlockCopy {
  return COPY[language] ?? EN;
}

export function formatRoboUnlock(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, token: string) => String(values[token] ?? `{${token}}`));
}
