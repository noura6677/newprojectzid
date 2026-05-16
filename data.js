// متجر نجدية — بيانات تجريبية فقط (Simulation). لا أسعار/خصومات حقيقية.
const PRODUCTS = [
  // قهوة مختصة
  { id: "sp1", cat: "specialty", name: "إثيوبيا يرغاتشيف", emoji: "🫘", price: 75, tags: ["coffee","light","fruity"], desc: "نكهات فاكهية وزهرية، تحميص فاتح." },
  { id: "sp2", cat: "specialty", name: "كولومبيا هويلا", emoji: "🫘", price: 68, tags: ["coffee","medium"], desc: "كراميل وشوكولاتة، تحميص متوسط." },
  { id: "sp3", cat: "specialty", name: "كينيا AA", emoji: "🫘", price: 82, tags: ["coffee","bright"], desc: "حموضة مشرقة وتوت أسود." },

  // قهوة عربية
  { id: "ar1", cat: "arabic", name: "قهوة عربية بالهيل", emoji: "☕", price: 45, tags: ["arabic"], desc: "خلطة نجدية أصيلة مع هيل." },
  { id: "ar2", cat: "arabic", name: "قهوة عربية بالزعفران", emoji: "☕", price: 55, tags: ["arabic","premium"], desc: "لمسة زعفران فاخرة." },

  // أدوات تحضير
  { id: "tl1", cat: "tools", name: "مقطرة V60", emoji: "⏬", price: 60, tags: ["tool","brew"], desc: "تقطير يدوي نقي." },
  { id: "tl2", cat: "tools", name: "فرنش برس", emoji: "🫖", price: 90, tags: ["tool","brew"], desc: "قوام كامل وغني." },
  { id: "tl3", cat: "tools", name: "مطحنة يدوية", emoji: "⚙️", price: 120, tags: ["tool","grinder"], desc: "طحنة متجانسة قابلة للضبط." },
  { id: "tl4", cat: "tools", name: "فلاتر ورقية V60", emoji: "📄", price: 18, tags: ["tool","consumable"], desc: "100 فلتر أصلي." },

  // أكواب ومجات
  { id: "cp1", cat: "cups", name: "كوب سيراميك نجدية", emoji: "🥛", price: 30, tags: ["cup"], desc: "سعة 250 مل، عازل." },
  { id: "cp2", cat: "cups", name: "مج حراري", emoji: "☕", price: 48, tags: ["cup","travel"], desc: "يحافظ على الحرارة 6 ساعات." },

  // بوكسات جاهزة
  { id: "bn1", cat: "bundle", name: "بوكس تجربة المختصة", emoji: "🎁", price: 150, tags: ["bundle"], desc: "٣ أنواع مختصة + كوب." },
  { id: "bn2", cat: "bundle", name: "بوكس البداية", emoji: "🎁", price: 199, tags: ["bundle"], desc: "V60 + بن + فلاتر + كوب." },
];

const CAT_TITLES = {
  all: "كل المنتجات",
  specialty: "قهوة مختصة",
  arabic: "قهوة عربية",
  tools: "أدوات تحضير",
  cups: "أكواب ومجات",
  bundle: "بوكسات جاهزة",
};

// جوائز الروليت — محاكاة UI فقط
const ROULETTE_PRIZES = [
  { label: "توصيل مجاني", emoji: "🚚", weight: 30 },
  { label: "كوب مجاني", emoji: "🥛", weight: 25 },
  { label: "بوكس قهوة", emoji: "🎁", weight: 10 },
  { label: "منتج إضافي", emoji: "🫘", weight: 20 },
  { label: "حظ أوفر", emoji: "🍀", weight: 15 },
];

// إعدادات قابلة للتعديل (Mock فقط)
const DEAL_CONFIG = {
  timerSeconds: 60,           // 30 / 60 / 120
  levels: [
    { name: "مبتدئ",  icon: "🌱", need: 0 },
    { name: "هاوي",   icon: "☕", need: 2 },
    { name: "خبير",   icon: "🔥", need: 4 },
    { name: "محترف",  icon: "🏆", need: 6 },
  ],
};
