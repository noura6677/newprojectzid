// متجر نجدية — بيانات المنتجات
// صور Unsplash محددة وثابتة (كل رابط = صورة واحدة بعينها، غير عشوائية)
const U = (id) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=900&q=80`;

// خريطة كلمات → صورة ثابتة (لاستدعاء IMG من app.js دون تغيير منطقه)
const IMG_MAP = {
  "coffee,brewing,set": "1495774856032-8b90bbb32b32",
};
const IMG = (kw) => U(IMG_MAP[kw] || "1447933601403-0c6688de566e");

const PRODUCTS = [
  // قهوة مختصة
  { id: "sp1", cat: "specialty", name: "إثيوبيا يرغاتشيف", emoji: "☕", price: 75,
    tags: ["coffee","light","fruity"], rating: 4.9, reviews: 214,
    meta: "تحميص فاتح · 250غ", img: U("1447933601403-0c6688de566e"),
    desc: "حبوب أحادية المصدر من مرتفعات يرغاتشيف، بنكهات فاكهية وزهرية وحموضة مشرقة — مثالية للتقطير اليدوي." },
  { id: "sp2", cat: "specialty", name: "كولومبيا هويلا", emoji: "☕", price: 68,
    tags: ["coffee","medium"], rating: 4.7, reviews: 168,
    meta: "تحميص متوسط · 250غ", img: U("1559056199-641a0ac8b55e"),
    desc: "توازن راقٍ بين الكراميل والشوكولاتة بقوام كريمي ناعم — خيار يومي يناسب جميع طرق التحضير." },
  { id: "sp3", cat: "specialty", name: "كينيا AA", emoji: "☕", price: 82,
    tags: ["coffee","bright"], rating: 4.8, reviews: 139,
    meta: "تحميص فاتح · 250غ", img: U("1442550528053-c431ecb55509"),
    desc: "حموضة مشرقة ونكهات التوت الأسود والحمضيات — تجربة نابضة لعشّاق القهوة المختصة." },

  // قهوة عربية
  { id: "ar1", cat: "arabic", name: "قهوة عربية بالهيل", emoji: "☕", price: 45,
    tags: ["arabic"], rating: 4.8, reviews: 305,
    meta: "خلطة نجدية · 500غ", img: U("1578374173705-969cbe6f2d6b"),
    desc: "خلطة نجدية أصيلة محمّصة على الطريقة التقليدية مع هيل فاخر — ضيافة كما ينبغي أن تكون." },
  { id: "ar2", cat: "arabic", name: "قهوة عربية بالزعفران", emoji: "☕", price: 55,
    tags: ["arabic","premium"], rating: 4.9, reviews: 192,
    meta: "خلطة فاخرة · 500غ", img: U("1565452344518-47faca79dc69"),
    desc: "لمسة زعفران فاخرة تمنح القهوة العربية رائحة ولوناً مميزَين — للمناسبات الخاصة." },

  // أدوات تحضير
  { id: "tl1", cat: "tools", name: "مقطرة V60", emoji: "⏬", price: 60,
    tags: ["tool","brew"], rating: 4.7, reviews: 121,
    meta: "سيراميك · مقاس 02", img: U("1495774856032-8b90bbb32b32"),
    desc: "مقطرة V60 سيراميك تمنحك تحكّماً كاملاً واستخلاصاً نقياً يُبرز نكهات القهوة المختصة." },
  { id: "tl2", cat: "tools", name: "فرنش برس", emoji: "🫖", price: 90,
    tags: ["tool","brew"], rating: 4.6, reviews: 98,
    meta: "زجاج بوروسيليكات · 600 مل", img: U("1544776193-352d25ca82cd"),
    desc: "تحضير سهل بقوام كامل وغني، مع فلتر معدني مزدوج لقهوة نظيفة دون ترسّبات." },
  { id: "tl3", cat: "tools", name: "مطحنة يدوية", emoji: "⚙️", price: 120,
    tags: ["tool","grinder"], rating: 4.9, reviews: 156,
    meta: "أسنان سيراميك · قابلة للضبط", img: U("1606937295547-bc0f668595e5"),
    desc: "طحنة متجانسة قابلة للضبط من الإسبريسو إلى الفرنش برس، بهيكل متين وأداء صامت." },
  { id: "tl4", cat: "tools", name: "فلاتر ورقية V60", emoji: "📃", price: 18,
    tags: ["tool","consumable"], rating: 4.8, reviews: 240,
    meta: "100 فلتر · مقاس 02", img: U("1610632380989-680fe40816c6"),
    desc: "فلاتر ورقية أصلية عالية الجودة لتقطير نظيف ومتّسق في كل مرة." },

  // أكواب ومجات
  { id: "cp1", cat: "cups", name: "كوب سيراميك نجدية", emoji: "🍵", price: 30,
    tags: ["cup"], rating: 4.7, reviews: 187,
    meta: "سيراميك · 250 مل", img: U("1514432324607-a09d9b4aefdd"),
    desc: "كوب سيراميك عازل بتصميم نجدية الأنيق، يحافظ على حرارة قهوتك لوقت أطول." },
  { id: "cp2", cat: "cups", name: "مج حراري للتنقّل", emoji: "🥤", price: 48,
    tags: ["cup","travel"], rating: 4.8, reviews: 211,
    meta: "ستانلس · حرارة 6 ساعات", img: U("1577937927133-66ef06acdf18"),
    desc: "مج حراري ستانلس يحافظ على المشروب ساخناً حتى 6 ساعات — رفيق التنقّل المثالي." },

  // بوكسات جاهزة
  { id: "bn1", cat: "bundle", name: "بوكس تجربة المختصة", emoji: "🎁", price: 150,
    tags: ["bundle"], rating: 4.9, reviews: 76,
    meta: "3 أنواع مختصة + كوب", img: U("1607681034540-2c46cc71896d"),
    desc: "ثلاثة أنواع مختصة منتقاة مع كوب سيراميك نجدية — هدية مثالية لعشّاق القهوة." },
  { id: "bn2", cat: "bundle", name: "بوكس البداية", emoji: "🎁", price: 199,
    tags: ["bundle"], rating: 4.8, reviews: 64,
    meta: "V60 + بن + فلاتر + كوب", img: U("1513267048331-5611cad62e41"),
    desc: "كل ما تحتاجه لتبدأ رحلتك مع القهوة المختصة في صندوق واحد متكامل." },
];

// حزم منسّقة (تُضاف كل مكوّناتها دفعة واحدة) — صورة تمثّل محتوى الحزمة
const BUNDLES = [
  { id: "bset1", name: "تجربة القهوة الكاملة",
    tagline: "بن مختص + مقطرة + كوب — كل ما تحتاجه لكوب مثالي",
    img: U("1495774856032-8b90bbb32b32"), items: ["sp1", "tl1", "cp1"] },
  { id: "bset2", name: "ركن الضيافة العربية",
    tagline: "قهوة بالهيل + قهوة بالزعفران + كوب",
    img: U("1578374173705-969cbe6f2d6b"), items: ["ar1", "ar2", "cp1"] },
  { id: "bset3", name: "طقم المحترف",
    tagline: "مطحنة يدوية + فرنش برس + بن كولومبي",
    img: U("1606937295547-bc0f668595e5"), items: ["tl3", "tl2", "sp2"] },
];

const CAT_TITLES = {
  all: "كل المنتجات",
  specialty: "قهوة مختصة",
  arabic: "قهوة عربية",
  tools: "أدوات تحضير",
  cups: "أكواب ومجات",
  bundle: "بوكسات جاهزة",
};

// جوائز العجلة — كل جائزة بصورة حقيقية تمثّلها
const ROULETTE_PRIZES = [
  { label: "توصيل مجاني", emoji: "🚚", weight: 30, img: U("1607081692251-d3e1c0c9a0f0") },
  { label: "كوب مجاني",  emoji: "🍵", weight: 25, img: U("1514432324607-a09d9b4aefdd") },
  { label: "بوكس قهوة",  emoji: "🎁", weight: 10, img: U("1607681034540-2c46cc71896d") },
  { label: "منتج إضافي", emoji: "☕", weight: 20, img: U("1447933601403-0c6688de566e") },
];

const DEAL_CONFIG = {
  timerSeconds: 60,
  levels: [
    { name: "مبتدئ",  icon: "🌱", need: 0 },
    { name: "هاوي",   icon: "☕", need: 2 },
    { name: "خبير",   icon: "🔥", need: 4 },
    { name: "محترف",  icon: "🏆", need: 6 },
  ],
};
