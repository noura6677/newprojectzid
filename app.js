// ================== مساعد متجر نجدية — محرك السلوك (Simulation) ==================
// كل المنطق محاكاة داخل الديمو فقط: لا دفع/خصومات/تجارة حقيقية.

const State = {
  mode: "PASSIVE",            // PASSIVE | ACTIVE | CHECKOUT | REWARD
  cart: {},                   // id -> qty
  category: "all",
  progress: 0,
  levelIndex: 0,
  respondedToAI: false,
  reward: null,
  rewardActivated: false,
  timer: null,
};

const $ = (s) => document.querySelector(s);
const fmt = (n) => n + " ر.س";

// ---------- محرك تحليل المنتجات + الاقتراح الذكي ----------
const AIEngine = {
  complementsFor(cartIds) {
    const inCart = cartIds.map((id) => PRODUCTS.find((p) => p.id === id));
    const cats = new Set(inCart.map((p) => p.cat));
    const wants = new Set();
    if (cats.has("specialty") || cats.has("arabic")) { wants.add("tools"); wants.add("cups"); }
    if (cats.has("tools")) { wants.add("specialty"); wants.add("cups"); }
    if (cats.has("cups")) { wants.add("specialty"); }
    if (cats.size === 0) { wants.add("bundle"); }
    return PRODUCTS.filter((p) => wants.has(p.cat) && !cartIds.includes(p.id)).slice(0, 4);
  },
  dynamicBundle(cartIds) {
    const hasCoffee = cartIds.some((id) => {
      const p = PRODUCTS.find((x) => x.id === id);
      return p && (p.cat === "specialty" || p.cat === "arabic");
    });
    if (!hasCoffee) return null;
    const tool = PRODUCTS.find((p) => p.cat === "tools" && !cartIds.includes(p.id));
    const cup = PRODUCTS.find((p) => p.cat === "cups" && !cartIds.includes(p.id));
    const parts = [tool, cup].filter(Boolean);
    return parts.length ? parts : null;
  },
};

// ---------- عرض المنتجات ----------
function renderProducts() {
  const wrap = $("#products");
  const list = State.category === "all"
    ? PRODUCTS : PRODUCTS.filter((p) => p.cat === State.category);
  const recoIds = State.mode === "ACTIVE"
    ? new Set(AIEngine.complementsFor(Object.keys(State.cart)).map((p) => p.id))
    : new Set();

  wrap.innerHTML = list.map((p) => `
    <div class="card">
      ${recoIds.has(p.id) ? '<span class="reco-tag">✨ مختارة لك</span>' : ""}
      <div class="emoji">${p.emoji}</div>
      <h3>${p.name}</h3>
      <p class="desc">${p.desc}</p>
      <div class="price">${fmt(p.price)} <small>(سعر تجريبي)</small></div>
      <button class="add-btn" data-add="${p.id}" data-reco="${recoIds.has(p.id)}">
        أضف إلى السلة
      </button>
    </div>`).join("");

  wrap.querySelectorAll("[data-add]").forEach((b) =>
    b.addEventListener("click", () =>
      addToCart(b.dataset.add, b.dataset.reco === "true")));
  $("#catTitle").textContent = CAT_TITLES[State.category];
}

// ---------- السلة ----------
function cartLines() { return Object.keys(State.cart); }
function cartQtyTotal() { return Object.values(State.cart).reduce((a, b) => a + b, 0); }
function cartTotalPrice() {
  return cartLines().reduce((s, id) =>
    s + PRODUCTS.find((p) => p.id === id).price * State.cart[id], 0);
}

function addToCart(id, fromReco = false) {
  const first = cartLines().length === 0 && cartQtyTotal() === 0;
  State.cart[id] = (State.cart[id] || 0) + 1;
  if (fromReco) State.respondedToAI = true;

  if (first) activateSellingMode();
  else if (State.mode === "ACTIVE" || State.mode === "REWARD") {
    State.progress++;
    updateLevels();
  }

  if (State.reward && !State.rewardActivated && cartLines().length >= 2) {
    activateReward();
  }

  renderProducts();
  renderCart();
  if (State.mode === "ACTIVE" && !fromReco) suggestNext();
}

function changeQty(id, d) {
  State.cart[id] += d;
  if (State.cart[id] <= 0) delete State.cart[id];
  renderCart();
  renderProducts();
}

function renderCart() {
  $("#cartCount").textContent = cartQtyTotal();
  const box = $("#cartItems");
  const ids = cartLines();
  box.innerHTML = ids.length
    ? ids.map((id) => {
        const p = PRODUCTS.find((x) => x.id === id);
        return `<div class="ci">
          <div class="ce">${p.emoji}</div>
          <div class="cinfo"><b>${p.name}</b><br><span>${fmt(p.price)}</span></div>
          <div class="qty">
            <button data-q="${id}|-1">−</button>
            <span>${State.cart[id]}</span>
            <button data-q="${id}|1">+</button>
          </div></div>`;
      }).join("")
    : `<div class="cart-empty">السلة فارغة ☕<br>اختر منتجاً لتبدأ التجربة</div>`;

  box.querySelectorAll("[data-q]").forEach((b) =>
    b.addEventListener("click", () => {
      const [pid, d] = b.dataset.q.split("|");
      changeQty(pid, +d);
    }));

  $("#cartTotal").textContent = fmt(cartTotalPrice());
  renderLockedReward();
}

// ---------- وضع البيع + المستويات ----------
function activateSellingMode() {
  State.mode = "ACTIVE";
  State.progress = 1;
  $("#aiLevels").classList.remove("hidden");
  updateLevels();
  celebrate();
  setBubble("ابدأ تجربتك! نختار لك ما يكمّل قهوتك خطوة بخطوة ☕");
  setTimeout(suggestNext, 1200);
}

function updateLevels() {
  const lv = DEAL_CONFIG.levels;
  let idx = 0;
  for (let i = 0; i < lv.length; i++) if (State.progress >= lv[i].need) idx = i;
  const leveledUp = idx > State.levelIndex;
  State.levelIndex = idx;

  const next = lv[idx + 1];
  const frac = next
    ? (State.progress - lv[idx].need) / (next.need - lv[idx].need) : 1;
  const overall = ((idx + (next ? Math.min(frac, 1) : 0)) / (lv.length - 1)) * 100;
  $("#lvlFill").style.height = overall + "%";

  document.querySelectorAll(".lvl-node").forEach((n) => {
    const i = +n.dataset.i;
    n.classList.toggle("active", i === idx);
    n.classList.toggle("done", i < idx);
  });

  if (leveledUp) toast(`🏆 ترقّيت إلى مستوى «${lv[idx].name}»!`, "good");
}

// ---------- لحظة الاحتفال ----------
function celebrate() {
  const wrap = $("#confetti");
  const colors = ["#c9962e", "#6f4e37", "#3c8a4e", "#e0b653", "#a9743b"];
  wrap.innerHTML = "";
  for (let i = 0; i < 46; i++) {
    const c = document.createElement("i");
    c.style.left = Math.random() * 100 + "%";
    c.style.background = colors[i % colors.length];
    c.style.animationDuration = (1.6 + Math.random() * 1.6) + "s";
    c.style.animationDelay = (Math.random() * 0.6) + "s";
    wrap.appendChild(c);
  }
  $("#celebrateModal").classList.remove("hidden");
}

// ---------- اقتراح ذكي (يظهر داخل فقاعة المساعد) ----------
function suggestNext() {
  const ids = cartLines();
  const bundle = AIEngine.dynamicBundle(ids);
  if (bundle) {
    setBubble(`💡 حوّل قهوتك لتجربة كاملة — جرّب ${bundle.map((p) => p.name).join(" + ")}`);
    return;
  }
  const comps = AIEngine.complementsFor(ids);
  if (comps.length) {
    setBubble(`💡 يكمل تجربتك: ${comps[0].name} — تلقاه بعلامة ✨ بالأسفل`);
  } else {
    setBubble("تجربتك صارت متكاملة ☕ استمتع بقهوتك!");
  }
}

// ---------- طبقة التحفيز / الروليت ----------
function onCheckout() {
  const onlyOne = cartLines().length === 1;
  if (!cartLines().length) {
    toast("السلة فارغة — أضف منتجاً أولاً ☕");
  } else if (onlyOne && !State.respondedToAI && !State.reward) {
    State.mode = "CHECKOUT";
    openRoulette();
  } else {
    toast("✅ تمت محاكاة الطلب بنجاح — شكراً لك!", "good");
  }
}

let wheelAngle = 0;
function drawWheel() {
  const c = $("#wheel"), ctx = c.getContext("2d");
  const n = ROULETTE_PRIZES.length, R = 160, cx = 160, cy = 160;
  const colors = ["#6f4e37", "#c9962e", "#4a3324", "#3c8a4e", "#a9743b"];
  ctx.clearRect(0, 0, 320, 320);
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * 2 * Math.PI + wheelAngle;
    const a1 = ((i + 1) / n) * 2 * Math.PI + wheelAngle;
    ctx.beginPath(); ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, R, a0, a1); ctx.closePath();
    ctx.fillStyle = colors[i % colors.length]; ctx.fill();
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((a0 + a1) / 2);
    ctx.fillStyle = "#fff"; ctx.font = "20px Cairo"; ctx.textAlign = "right";
    ctx.fillText(ROULETTE_PRIZES[i].emoji, R - 18, 6);
    ctx.restore();
  }
  ctx.beginPath(); ctx.arc(cx, cy, 26, 0, 2 * Math.PI);
  ctx.fillStyle = "#fff"; ctx.fill();
}

function openRoulette() {
  $("#rouletteModal").classList.remove("hidden");
  wheelAngle = 0; drawWheel();
  $("#wheel").style.transform = "rotate(0deg)";
  $("#spinBtn").disabled = false;
}

function weightedPrize() {
  const total = ROULETTE_PRIZES.reduce((s, p) => s + p.weight, 0);
  let r = Math.random() * total;
  for (let i = 0; i < ROULETTE_PRIZES.length; i++) {
    if ((r -= ROULETTE_PRIZES[i].weight) <= 0) return i;
  }
  return 0;
}

function spinWheel() {
  $("#spinBtn").disabled = true;
  const n = ROULETTE_PRIZES.length;
  const idx = weightedPrize();
  const seg = 360 / n;
  const target = 360 * 6 + (360 - (idx * seg + seg / 2)) - 90;
  $("#wheel").style.transform = `rotate(${target}deg)`;
  setTimeout(() => {
    $("#rouletteModal").classList.add("hidden");
    grantReward(ROULETTE_PRIZES[idx]);
  }, 4800);
}

// ---------- المكافأة + المؤقت + Locked Reward Cart ----------
function grantReward(prize) {
  State.reward = { label: prize.label, emoji: prize.emoji };
  State.rewardActivated = false;
  State.mode = "REWARD";
  $("#rewardEmoji").textContent = prize.emoji;
  $("#rewardLabel").textContent = prize.label;
  $("#rewardModal").classList.remove("hidden");
  setBubble(`🎁 مكافأتك «${prize.label}» محفوظة — أضف منتجاً واحداً لتفعيلها قبل انتهاء الوقت!`);
  startTimer(DEAL_CONFIG.timerSeconds);
  renderCart();
}

function startTimer(secs) {
  clearInterval(State.timer);
  let t = secs;
  $("#timerValue").textContent = t;
  State.timer = setInterval(() => {
    t--;
    $("#timerValue").textContent = t;
    if (t <= 0) {
      clearInterval(State.timer);
      if (!State.rewardActivated) {
        toast("⏱️ انتهى الوقت — مكافأتك ما زالت معلّقة 🔒");
        setBubble("مكافأتك ما زالت معلّقة 🔒 — أضف منتجاً لتفعيلها");
        renderLockedReward();
      }
    }
  }, 1000);
}

function activateReward() {
  State.rewardActivated = true;
  clearInterval(State.timer);
  toast(`✅ تم تفعيل مكافأتك: ${State.reward.emoji} ${State.reward.label}!`, "good");
  setBubble(`✅ تم تفعيل مكافأتك: ${State.reward.emoji} ${State.reward.label} — مبروك!`);
  renderLockedReward();
}

function renderLockedReward() {
  const el = $("#lockedReward");
  if (!State.reward) { el.classList.add("hidden"); return; }
  el.classList.remove("hidden");
  el.classList.toggle("activated", State.rewardActivated);
  el.innerHTML = `
    <div class="lr-top">${State.reward.emoji} مكافأة: ${State.reward.label}
      <span>${State.rewardActivated ? "✅" : "🔒"}</span></div>
    <div class="lr-state">${
      State.rewardActivated
        ? "تم التفعيل — أضيفت لتجربتك (محاكاة)."
        : "غير مفعّلة بعد · ☕ أضف منتجاً واحداً لتفعيلها"
    }</div>`;
}

// ---------- فقاعة المساعد ----------
function setBubble(text) { $("#bubbleText").textContent = text; }

// ---------- إشعارات ----------
function toast(msg, kind = "") {
  const t = document.createElement("div");
  t.className = "toast " + kind;
  t.textContent = msg;
  $("#toasts").appendChild(t);
  setTimeout(() => { t.style.opacity = "0"; t.style.transition = ".4s"; }, 4200);
  setTimeout(() => t.remove(), 4700);
}

// ---------- لوحة السلة فتح/إغلاق ----------
function openCart() {
  $("#cartPanel").classList.add("open");
  $("#overlay").classList.remove("hidden");
}
function closeCart() {
  $("#cartPanel").classList.remove("open");
  $("#overlay").classList.add("hidden");
}

// ---------- ربط الأحداث ----------
function init() {
  renderProducts();
  renderCart();

  document.querySelectorAll(".nav a").forEach((a) =>
    a.addEventListener("click", (e) => {
      e.preventDefault();
      document.querySelectorAll(".nav a").forEach((x) => x.classList.remove("active"));
      a.classList.add("active");
      State.category = a.dataset.cat;
      renderProducts();
    }));

  $("#cartBtn").addEventListener("click", openCart);
  $("#closeCart").addEventListener("click", closeCart);
  $("#overlay").addEventListener("click", closeCart);
  $("#checkoutBtn").addEventListener("click", onCheckout);
  $("#spinBtn").addEventListener("click", spinWheel);
  $("#skipRoulette").addEventListener("click", () => {
    $("#rouletteModal").classList.add("hidden");
    toast("تم التخطّي ☕");
  });
  $("#celebrateClose").addEventListener("click", () =>
    $("#celebrateModal").classList.add("hidden"));
  $("#rewardGoShopping").addEventListener("click", () => {
    $("#rewardModal").classList.add("hidden");
  });
}

document.addEventListener("DOMContentLoaded", init);
