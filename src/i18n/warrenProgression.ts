import type { LanguageCode } from './index';

const COPY = {
  "en": {
    "title": "Warren Megaprojects",
    "hint": "Raise wonders that survive every Great Migration.",
    "help": "Stages spend goblins and Ancestral Cunning. Buildings and research are not consumed. Project stages and production bonuses survive migration; innovations must be researched again.",
    "entry": "Requires one Great Migration and one Reality Burrow in this run.",
    "stage": "Stage {rank} / {max}",
    "build": "Build stage",
    "complete": "Complete",
    "owned": "Each expansion: {owned} / {required}",
    "research": "Deep innovations: {owned} / {required}",
    "effect": "Permanent output: ×{current} → ×{next}",
    "nextMilestone": "Next milestone",
    "tree": "Research tree",
    "innovations": "Deep innovations",
    "innovationHelp": "Grow beyond the old blueprints. Twelve living expansions and six new disciplines prepare the warren for megaprojects. These upgrades reset each migration.",
    "living": "Living Architecture",
    "requires": "Requires {amount} {name}",
    "built": "Stage completed",
    "districts": [
      "Root warrens",
      "Moon industry",
      "Beyond the burrow",
      "All expansions"
    ],
    "projects": [
      "Worldroot Sanctuary",
      "Moonforge Citadel",
      "Worldgate Nexus",
      "Everlasting Warren"
    ],
    "utility": [
      "Collective Instinct",
      "Lunar Almanac",
      "Sleeping Shifts",
      "Ancestral Curriculum",
      "Brood Resonance",
      "Boundless Warren"
    ]
  },
  "es": {
    "title": "Megaproyectos de la Madriguera",
    "hint": "Alza maravillas que sobrevivan a cada Gran Migración.",
    "help": "Las fases consumen goblins y Astucia Ancestral, pero no edificios ni investigaciones. Las fases y sus bonos de producción sobreviven a la migración; las innovaciones se investigan de nuevo.",
    "entry": "Requiere una Gran Migración y una Madriguera de la Realidad en esta partida.",
    "stage": "Fase {rank} / {max}",
    "build": "Construir fase",
    "complete": "Completado",
    "owned": "Cada expansión: {owned} / {required}",
    "research": "Innovaciones profundas: {owned} / {required}",
    "effect": "Producción permanente: ×{current} → ×{next}",
    "nextMilestone": "Siguiente hito",
    "tree": "Árbol de investigación",
    "innovations": "Innovaciones profundas",
    "innovationHelp": "Doce expansiones vivientes y seis disciplinas nuevas preparan la madriguera para los megaproyectos. Estas mejoras se reinician en cada migración.",
    "living": "Arquitectura Viviente",
    "requires": "Requiere {amount} {name}",
    "built": "Fase completada",
    "districts": [
      "Madrigueras de raíz",
      "Industria lunar",
      "Más allá del cubil",
      "Todas las expansiones"
    ],
    "projects": [
      "Santuario de la Raíz del Mundo",
      "Ciudadela de la Forja Lunar",
      "Nexo de Portales",
      "Madriguera Eterna"
    ],
    "utility": [
      "Instinto Colectivo",
      "Almanaque Lunar",
      "Turnos Durmientes",
      "Enseñanza Ancestral",
      "Resonancia de la Prole",
      "Madriguera Sin Límites"
    ]
  },
  "fr": {
    "title": "Mégaprojets du Terrier",
    "hint": "Érigez des merveilles qui survivent aux Grandes Migrations.",
    "help": "Les étapes coûtent des gobelins et de la Ruse ancestrale, sans consommer bâtiments ni recherches. Les étapes et bonus persistent après migration ; les innovations doivent être recherchées à nouveau.",
    "entry": "Nécessite une Grande Migration et un Terrier de la Réalité dans ce cycle.",
    "stage": "Étape {rank} / {max}",
    "build": "Construire",
    "complete": "Terminé",
    "owned": "Chaque expansion : {owned} / {required}",
    "research": "Innovations profondes : {owned} / {required}",
    "effect": "Production permanente : ×{current} → ×{next}",
    "nextMilestone": "Prochain palier",
    "tree": "Arbre de recherche",
    "innovations": "Innovations profondes",
    "innovationHelp": "Douze expansions vivantes et six disciplines préparent les mégaprojets. Ces améliorations sont réinitialisées à chaque migration.",
    "living": "Architecture Vivante",
    "requires": "Nécessite {amount} {name}",
    "built": "Étape terminée",
    "districts": [
      "Terriers racinaires",
      "Industrie lunaire",
      "Au-delà du terrier",
      "Toutes les expansions"
    ],
    "projects": [
      "Sanctuaire des Racines du Monde",
      "Citadelle de la Forge Lunaire",
      "Nexus des Portails",
      "Terrier Éternel"
    ],
    "utility": [
      "Instinct Collectif",
      "Almanach Lunaire",
      "Équipes Dormantes",
      "Savoir Ancestral",
      "Résonance de la Couvée",
      "Terrier Sans Limites"
    ]
  },
  "de": {
    "title": "Megaprojekte des Baus",
    "hint": "Errichte Wunder, die jede Große Wanderung überdauern.",
    "help": "Stufen kosten Goblins und Ahnenlist. Gebäude und Forschung werden nicht verbraucht. Projektstufen und Produktionsboni bleiben nach Wanderungen erhalten; Innovationen werden erneut erforscht.",
    "entry": "Benötigt eine Große Wanderung und einen Realitätsbau in diesem Durchlauf.",
    "stage": "Stufe {rank} / {max}",
    "build": "Stufe bauen",
    "complete": "Abgeschlossen",
    "owned": "Jede Erweiterung: {owned} / {required}",
    "research": "Tiefe Innovationen: {owned} / {required}",
    "effect": "Dauerhafte Produktion: ×{current} → ×{next}",
    "nextMilestone": "Nächster Meilenstein",
    "tree": "Forschungsbaum",
    "innovations": "Tiefe Innovationen",
    "innovationHelp": "Zwölf lebende Erweiterungen und sechs Disziplinen bereiten Megaprojekte vor. Diese Verbesserungen werden bei jeder Wanderung zurückgesetzt.",
    "living": "Lebende Architektur",
    "requires": "Benötigt {amount} {name}",
    "built": "Stufe abgeschlossen",
    "districts": [
      "Wurzelbaue",
      "Mondindustrie",
      "Jenseits des Baus",
      "Alle Erweiterungen"
    ],
    "projects": [
      "Weltenwurzel-Heiligtum",
      "Mondschmiede-Zitadelle",
      "Weltentor-Nexus",
      "Ewiger Bau"
    ],
    "utility": [
      "Kollektiver Instinkt",
      "Mondalmanach",
      "Schlafende Schichten",
      "Ahnenlehrplan",
      "Brutresonanz",
      "Grenzenloser Bau"
    ]
  },
  "zh": {
    "title": "地穴巨型工程",
    "hint": "建造在每次大迁徙后保留的奇观。",
    "help": "每个阶段消耗哥布林和祖传狡黠，不消耗建筑或研究。工程阶段和产量加成在迁徙后保留；创新需要重新研究。",
    "entry": "需要完成一次大迁徙，并在本轮拥有一个现实地穴。",
    "stage": "阶段 {rank} / {max}",
    "build": "建造阶段",
    "complete": "已完成",
    "owned": "每种建筑：{owned} / {required}",
    "research": "深层创新：{owned} / {required}",
    "effect": "永久产量：×{current} → ×{next}",
    "nextMilestone": "下个里程碑",
    "tree": "研究树",
    "innovations": "深层创新",
    "innovationHelp": "十二种活体建筑和六个新学科为巨型工程做好准备。这些升级在迁徙后重置。",
    "living": "活体建筑",
    "requires": "需要 {amount} {name}",
    "built": "阶段已完成",
    "districts": [
      "根系地穴",
      "月光工业",
      "地穴之外",
      "所有建筑"
    ],
    "projects": [
      "世界之根圣所",
      "月炉堡垒",
      "世界之门枢纽",
      "永恒地穴"
    ],
    "utility": [
      "集体本能",
      "月光年鉴",
      "梦中轮班",
      "祖传课程",
      "族群共振",
      "无界地穴"
    ]
  },
  "ar": {
    "title": "مشاريع الوكر العملاقة",
    "hint": "ابنِ عجائب تبقى بعد كل هجرة كبرى.",
    "help": "تستهلك المراحل الغوبلن ودهاء الأجداد دون استهلاك المباني أو الأبحاث. تبقى المراحل ومكافآت الإنتاج بعد الهجرة؛ يجب بحث الابتكارات مجددًا.",
    "entry": "يتطلب هجرة كبرى واحدة وجحر واقع واحد في هذه الدورة.",
    "stage": "المرحلة {rank} / {max}",
    "build": "بناء المرحلة",
    "complete": "مكتمل",
    "owned": "كل توسعة: {owned} / {required}",
    "research": "الابتكارات العميقة: {owned} / {required}",
    "effect": "إنتاج دائم: ×{current} → ×{next}",
    "nextMilestone": "المعلم التالي",
    "tree": "شجرة البحث",
    "innovations": "الابتكارات العميقة",
    "innovationHelp": "اثنتا عشرة توسعة حية وستة تخصصات جديدة تمهد للمشاريع العملاقة. تُعاد هذه الترقيات إلى الصفر بعد كل هجرة.",
    "living": "العمارة الحية",
    "requires": "يتطلب {amount} {name}",
    "built": "اكتملت المرحلة",
    "districts": [
      "أوكار الجذور",
      "صناعة القمر",
      "ما وراء الوكر",
      "كل التوسعات"
    ],
    "projects": [
      "ملاذ جذور العالم",
      "قلعة مسبك القمر",
      "ملتقى بوابات العالم",
      "الوكر الأبدي"
    ],
    "utility": [
      "الغريزة الجماعية",
      "التقويم القمري",
      "ورديات النوم",
      "منهج الأجداد",
      "رنين الحضنة",
      "الوكر اللامحدود"
    ]
  },
  "tr": {
    "title": "İn Megaprojeleri",
    "hint": "Her Büyük Göçten sonra kalan harikalar inşa et.",
    "help": "Aşamalar goblin ve Atasal Kurnazlık harcar; binalar ve araştırmalar tüketilmez. Aşamalar ve üretim bonusları göçten sonra kalır; yenilikler yeniden araştırılır.",
    "entry": "Bu döngüde bir Büyük Göç ve bir Gerçeklik İni gerektirir.",
    "stage": "Aşama {rank} / {max}",
    "build": "Aşama inşa et",
    "complete": "Tamamlandı",
    "owned": "Her genişleme: {owned} / {required}",
    "research": "Derin yenilikler: {owned} / {required}",
    "effect": "Kalıcı üretim: ×{current} → ×{next}",
    "nextMilestone": "Sonraki kilometre taşı",
    "tree": "Araştırma ağacı",
    "innovations": "Derin yenilikler",
    "innovationHelp": "On iki canlı genişleme ve altı yeni disiplin ini megaprojeler için hazırlar. Bu yükseltmeler her göçte sıfırlanır.",
    "living": "Canlı Mimari",
    "requires": "{amount} {name} gerektirir",
    "built": "Aşama tamamlandı",
    "districts": [
      "Kök inleri",
      "Ay endüstrisi",
      "İnin ötesi",
      "Tüm genişlemeler"
    ],
    "projects": [
      "Dünya Kökü Tapınağı",
      "Ay Ocağı Hisarı",
      "Dünya Kapısı Kavşağı",
      "Ebedî İn"
    ],
    "utility": [
      "Ortak İçgüdü",
      "Ay Almanağı",
      "Uyuyan Vardiyalar",
      "Atasal Müfredat",
      "Kuluçka Rezonansı",
      "Sınırsız İn"
    ]
  }
} as const;

export const WARREN_PROGRESSION = COPY satisfies Record<LanguageCode, { [K in keyof typeof COPY.en]: string | readonly string[] }>;
export const INNOVATION_UTILITY_IDS = ['innovation_collective_instinct', 'innovation_lunar_almanac', 'innovation_sleeping_shifts', 'innovation_ancestral_curriculum', 'innovation_brood_resonance', 'innovation_boundless_warren'];

export function formatWarren(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, token: string) => String(values[token] ?? `{${token}}`));
}
