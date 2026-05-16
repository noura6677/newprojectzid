// ================== مساعد متجر نجدية — محرك السلوك ==================

const State = {
  mode: "PASSIVE",            // PASSIVE | ACTIVE | CHECKOUT | REWARD
  cart: {},                   // id -> qty
  category: "all",
  search: "",
  levelIndex: 0,
  respondedToAI: false,
  reward: null,
  rewardActivated: false,
  timer: null,
};

const $ = (s) => document.querySelector(s);
const fmt = (n) => n + " ر.س";
const P = (id) => PRODUCTS.find((p) => p.id === id);

// صورة مع بديل مضمون عند فشل الرابط
function imgTag(p, cls = "") {
  return `<img class="${cls}" src="${p.img}" alt="${p.name}" loading="lazy"
    onerror="this.style.display='none'">`;
}
function stars(r) {
  const full = Math.round(r);
  return "★".repeat(full) + "☆".repeat(5 - full);
}

// ---------- محرك الاقتراح ----------
const AIEngine = {
  complementsFor(cartIds) {
    const cats = new Set(cartIds.map((id) => P(id).cat));
    const wants = new Set();
    if (cats.has("specialty") || cats.has("arabic")) { wants.add("tools"); wants.add("cups"); }
    if (cats.has("tools")) { wants.add("specialty"); wants.add("cups"); }
    if (cats.has("cups")) { wants.add("specialty"); }
    if (cats.size === 0) { wants.add("bundle"); }
    return PRODUCTS.filter((p) => wants.has(p.cat) && !cartIds.includes(p.id)).slice(0, 6);
  },
  dynamicBundle(cartIds) {
    const hasCoffee = cartIds.some((id) =>
      ["specialty", "arabic"].includes(P(id).cat));
    if (!hasCoffee) return null;
    const tool = PRODUCTS.find((p) => p.cat === "tools" && !cartIds.includes(p.id));
    const cup = PRODUCTS.find((p) => p.cat === "cups" && !cartIds.includes(p.id));
    const parts = [tool, cup].filter(Boolean);
    return parts.length ? parts : null;
  },
};

// ---------- عرض الحزم ----------
function renderBundles() {
  $("#bundles").innerHTML = BUNDLES.map((b) => {
    const items = b.items.map(P);
    const total = items.reduce((s, p) => s + p.price, 0);
    return `<div class="bundle-card">
      <div class="bimg">${imgTag(b)}<span class="btag">حزمة</span></div>
      <div class="bundle-body">
        <h3>${b.name}</h3>
        <p class="tg">${b.tagline}</p>
        <div class="bundle-items">${items.map((p) =>
          `<span>${p.emoji} ${p.name}</span>`).join("")}</div>
        <div class="bundle-foot">
          <div class="bprice"><b>${fmt(total)}</b><small>${items.length} منتجات</small></div>
          <button class="bundle-add" data-bundle="${b.id}">أضف الحزمة كاملة</button>
        </div>
      </div></div>`;
  }).join("");
  $("#bundles").querySelectorAll("[data-bundle]").forEach((b) =>
    b.addEventListener("click", () => addBundle(b.dataset.bundle)));
}

// ---------- عرض المنتجات ----------
function renderProducts() {
  const wrap = $("#products");
  let list = State.category === "all"
    ? PRODUCTS : PRODUCTS.filter((p) => p.cat === State.category);
  if (State.search) {
    const q = State.search.trim();
    list = PRODUCTS.filter((p) => (p.name + p.desc).includes(q));
  }
  const recoIds = State.mode === "ACTIVE"
    ? new Set(AIEngine.complementsFor(Object.keys(State.cart)).map((p) => p.id))
    : new Set();

  $("#noResults").classList.toggle("hidden", list.length > 0);
  $("#bundlesSec").classList.toggle("hidden",
    !!State.search || (State.category !== "all" && State.category !== "bundle"));

  wrap.innerHTML = list.map((p) => `
    <div class="card">
      <div class="pimg" data-detail="${p.id}">${p.emoji}${imgTag(p)}
        ${recoIds.has(p.id) ? '<span class="reco-tag">✨ مختارة لك</span>' : ""}</div>
      <div class="card-body">
        <h3 data-detail="${p.id}">${p.name}</h3>
        <div class="rating"><span class="stars">${stars(p.rating)}</span>
          ${p.rating} · ${p.reviews} تقييم</div>
        <div class="meta">${p.meta}</div>
        <div class="price-row">
          <span class="price">${fmt(p.price)}</span>
          <span class="detail-link" data-detail="${p.id}">التفاصيل</span>
        </div>
        <button class="add-btn" data-add="${p.id}" data-reco="${recoIds.has(p.id)}">
          أضف إلى السلة</button>
      </div>
    </div>`).join("");

  wrap.querySelectorAll("[data-add]").forEach((b) =>
    b.addEventListener("click", () => addToCart(b.dataset.add, b.dataset.reco === "true")));
  wrap.querySelectorAll("[data-detail]").forEach((e) =>
    e.addEventListener("click", () => openDetail(e.dataset.detail)));
  $("#catTitle").textContent = State.search
    ? `نتائج البحث "${State.search}"` : CAT_TITLES[State.category];
}

// ---------- السلة ----------
function cartLines() { return Object.keys(State.cart); }
function cartQtyTotal() { return Object.values(State.cart).reduce((a, b) => a + b, 0); }
function cartTotalPrice() {
  return cartLines().reduce((s, id) => s + P(id).price * State.cart[id], 0);
}

function addToCart(id, fromReco = false) {
  const wasEmpty = cartQtyTotal() === 0;
  State.cart[id] = (State.cart[id] || 0) + 1;
  if (fromReco) State.respondedToAI = true;
  if (wasEmpty) activateSellingMode();
  if (State.reward && !State.rewardActivated && cartLines().length >= 2) activateReward();
  renderProducts();
  renderCart();
  if (State.mode === "ACTIVE" && !fromReco) suggestNext();
}

function addBundle(bid) {
  const b = BUNDLES.find((x) => x.id === bid);
  const wasEmpty = cartQtyTotal() === 0;
  b.items.forEach((id) => { State.cart[id] = (State.cart[id] || 0) + 1; });
  State.respondedToAI = true;
  if (wasEmpty) activateSellingMode();
  if (State.reward && !State.rewardActivated && cartLines().length >= 2) activateReward();
  renderProducts();
  renderCart();
  openCart();
  toast(`🛍️ تمت إضافة حزمة «${b.name}» للسلة`, "good");
}

function changeQty(id, d) {
  State.cart[id] += d;
  if (State.cart[id] <= 0) delete State.cart[id];
  renderProducts();
  renderCart();
}

function renderCart() {
  $("#cartCount").textContent = cartQtyTotal();
  const ids = cartLines();

  // التقدّم مشتق من السلة — يرتفع وينزل تلقائياً
  if (cartQtyTotal() === 0 && State.mode !== "PASSIVE") {
    State.mode = "PASSIVE";
    State.levelIndex = 0;
    $("#aiLevels").classList.add("hidden");
    setBubble("أهلاً بك في نجدية — هل تحب أن نساعدك في اختيار قهوتك؟");
  } else if (State.mode === "ACTIVE" || State.mode === "REWARD") {
    updateLevels();
  }

  $("#cartItems").innerHTML = ids.length
    ? ids.map((id) => {
        const p = P(id);
        return `<div class="ci">
          <div class="ce">${p.emoji}${imgTag(p)}</div>
          <div class="cinfo"><b>${p.name}</b><br><span>${fmt(p.price)}</span></div>
          <div class="qty">
            <button data-q="${id}|-1">−</button>
            <span>${State.cart[id]}</span>
            <button data-q="${id}|1">+</button>
          </div></div>`;
      }).join("")
    : `<div class="cart-empty">السلة فارغة ☕<br>اختر منتجاً لتبدأ تجربتك</div>`;

  $("#cartItems").querySelectorAll("[data-q]").forEach((b) =>
    b.addEventListener("click", () => {
      const [pid, d] = b.dataset.q.split("|");
      changeQty(pid, +d);
    }));

  $("#cartTotal").textContent = fmt(cartTotalPrice());
  renderLockedReward();
  renderSmartBundle();
}

// ---------- حزمة ذكية داخل السلة (بصورة حقيقية للحزمة) ----------
function renderSmartBundle() {
  const el = $("#smartBundle");
  const ids = cartLines();
  const parts = ids.length ? AIEngine.dynamicBundle(ids) : null;
  if (!parts) { el.classList.add("hidden"); return; }
  el.classList.remove("hidden");
  const total = parts.reduce((s, p) => s + p.price, 0);
  el.innerHTML = `
    <div class="sb-img">🎁<img src="${IMG("coffee,brewing,set", 51)}"
      alt="حزمة" loading="lazy" onerror="this.style.display='none'"></div>
    <div class="sb-in">
      <h4>✨ أكمل تجربتك — حزمة مقترحة</h4>
      <p>${parts.map((p) => p.name).join(" + ")}</p>
      <button class="sb-btn" id="sbAdd">أضف الحزمة (${fmt(total)})</button>
    </div>`;
  $("#sbAdd").addEventListener("click", () => {
    parts.forEach((p) => addToCart(p.id, true));
    toast("✨ أضفنا ما يكمّل تجربتك", "good");
  });
}

// ---------- وضع البيع + المستويات ----------
function activateSellingMode() {
  State.mode = "ACTIVE";
  $("#aiLevels").classList.remove("hidden");
  updateLevels();
  celebrate();
  setBubble("بدأنا! نختار لك ما يكمّل قهوتك خطوة بخطوة ☕");
  setTimeout(suggestNext, 1200);
}

function updateLevels() {
  const lv = DEAL_CONFIG.levels;
  const progress = cartQtyTotal();
  let idx = 0;
  for (let i = 0; i < lv.length; i++) if (progress >= lv[i].need) idx = i;
  const wentUp = idx > State.levelIndex;
  State.levelIndex = idx;

  const next = lv[idx + 1];
  const frac = next ? (progress - lv[idx].need) / (next.need - lv[idx].need) : 1;
  const overall = ((idx + (next ? Math.min(frac, 1) : 0)) / (lv.length - 1)) * 100;
  $("#lvlFill").style.width = overall + "%";

  document.querySelectorAll(".lvl-node").forEach((n) => {
    const i = +n.dataset.i;
    n.classList.toggle("active", i === idx);
    n.classList.toggle("done", i < idx);
    if (wentUp && i === idx) {
      n.classList.remove("bump"); void n.offsetWidth; n.classList.add("bump");
    }
  });

  if (wentUp) toast(`🏆 ترقّيت إلى مستوى «${lv[idx].name}»!`, "good");
}

// ---------- لحظة الاحتفال ----------
function celebrate() {
  const cur = DEAL_CONFIG.levels[State.levelIndex];
  $("#celebrateBadge").textContent = `${cur.icon} ${cur.name}`;
  const wrap = $("#confetti");
  const colors = ["#c9962e", "#6f4e37", "#3c8a4e", "#e0b653", "#a9743b"];
  wrap.innerHTML = "";
  for (let i = 0; i < 48; i++) {
    const c = document.createElement("i");
    c.style.left = Math.random() * 100 + "%";
    c.style.background = colors[i % colors.length];
    c.style.animationDuration = (1.6 + Math.random() * 1.7) + "s";
    c.style.animationDelay = (Math.random() * 0.6) + "s";
    wrap.appendChild(c);
  }
  $("#celebrateModal").classList.remove("hidden");
}

// ---------- اقتراح في الفقاعة ----------
function suggestNext() {
  const ids = cartLines();
  if (!ids.length) return;
  const bundle = AIEngine.dynamicBundle(ids);
  if (bundle) {
    setBubble(`💡 حوّل قهوتك لتجربة كاملة — جرّب ${bundle.map((p) => p.name).join(" + ")}`);
  } else {
    const comps = AIEngine.complementsFor(ids);
    setBubble(comps.length
      ? `💡 يكمل تجربتك: ${comps[0].name} — موجود بعلامة ✨`
      : "تجربتك صارت متكاملة ☕ استمتع بقهوتك!");
  }
}

// ---------- تفاصيل المنتج ----------
function openDetail(id) {
  const p = P(id);
  const comps = AIEngine.complementsFor([id]).slice(0, 4);
  $("#detailBody").innerHTML = `
    <div class="detail-img">${p.emoji}${imgTag(p)}</div>
    <div class="detail-in">
      <h3>${p.name}</h3>
      <div class="rating"><span class="stars">${stars(p.rating)}</span>
        ${p.rating} · ${p.reviews} تقييم · ${p.meta}</div>
      <p class="d-desc">${p.desc}</p>
      <div class="d-price">${fmt(p.price)}</div>
      <button class="add-btn" id="detailAdd">أضف إلى السلة</button>
      ${comps.length ? `<div class="d-comp"><h4>يكمّل معه</h4>
        <div class="comp-row">${comps.map((c) => `
          <div class="comp-card">
            <div class="cimg">${c.emoji}${imgTag(c)}</div>
            <b>${c.name}</b><small>${fmt(c.price)}</small>
            <button class="comp-add" data-add="${c.id}">+ أضف</button>
          </div>`).join("")}</div></div>` : ""}
    </div>`;
  $("#detailModal").classList.remove("hidden");
  $("#detailAdd").addEventListener("click", () => {
    addToCart(id);
    $("#detailModal").classList.add("hidden");
    openCart();
  });
  $("#detailBody").querySelectorAll(".comp-add").forEach((b) =>
    b.addEventListener("click", () => {
      addToCart(b.dataset.add, true);
      toast("تمت الإضافة ✓", "good");
    }));
}

// ---------- الدفع / الروليت ----------
function onCheckout() {
  const ids = cartLines();
  if (!ids.length) { toast("السلة فارغة — أضف منتجاً أولاً ☕"); return; }
  if (ids.length === 1 && !State.respondedToAI && !State.reward) {
    State.mode = "CHECKOUT";
    openRoulette();
  } else {
    $("#orderNo").textContent =
      "رقم الطلب: NJ-" + Math.floor(100000 + Math.random() * 900000);
    closeCart();
    $("#orderModal").classList.remove("hidden");
  }
}

let wheelAngle = 0;
function drawWheel() {
  const ctx = $("#wheel").getContext("2d");
  const n = ROULETTE_PRIZES.length, R = 160, cx = 160, cy = 160;
  const colors = ["#6f4e37", "#c9962e", "#4a3324", "#3c8a4e", "#a9743b"];
  ctx.clearRect(0, 0, 320, 320);
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * 2 * Math.PI + wheelAngle;
    const a1 = ((i + 1) / n) * 2 * Math.PI + wheelAngle;
    ctx.beginPath(); ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, R, a0, a1); ctx.closePath();
    ctx.fillStyle = colors[i % colors.length]; ctx.fill();
    ctx.save(); ctx.translate(cx, cy); ctx.rotate((a0 + a1) / 2);
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
  for (let i = 0; i < ROULETTE_PRIZES.length; i++)
    if ((r -= ROULETTE_PRIZES[i].weight) <= 0) return i;
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

// ---------- المكافأة + المؤقت ----------
function grantReward(prize) {
  State.reward = { label: prize.label, emoji: prize.emoji, img: prize.img };
  State.rewardActivated = false;
  State.mode = "REWARD";
  $("#rewardImg").innerHTML = `${prize.emoji}<img src="${prize.img}" alt="${prize.label}"
    onerror="this.style.display='none'">`;
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
    <div class="lr-top">
      <div class="lr-img">${State.reward.emoji}<img src="${State.reward.img}"
        alt="${State.reward.label}" onerror="this.style.display='none'"></div>
      <div>مكافأة: ${State.reward.label}
        <span>${State.rewardActivated ? "✅" : "🔒"}</span></div>
    </div>
    <div class="lr-state">${State.rewardActivated
      ? "تم التفعيل — أضيفت لطلبك."
      : "غير مفعّلة بعد · ☕ أضف منتجاً واحداً لتفعيلها"}</div>`;
}

// ---------- مساعدات ----------
function setBubble(t) { $("#bubbleText").textContent = t; }
function toast(msg, kind = "") {
  const t = document.createElement("div");
  t.className = "toast " + kind;
  t.textContent = msg;
  $("#toasts").appendChild(t);
  setTimeout(() => { t.style.opacity = "0"; t.style.transition = ".4s"; }, 4200);
  setTimeout(() => t.remove(), 4700);
}
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
  renderBundles();
  renderProducts();
  renderCart();

  document.querySelectorAll(".nav a").forEach((a) =>
    a.addEventListener("click", (e) => {
      e.preventDefault();
      document.querySelectorAll(".nav a").forEach((x) => x.classList.remove("active"));
      a.classList.add("active");
      State.category = a.dataset.cat;
      State.search = "";
      $("#searchInput").value = "";
      renderProducts();
      window.scrollTo({ top: 360, behavior: "smooth" });
    }));

  $("#searchInput").addEventListener("input", (e) => {
    State.search = e.target.value;
    renderProducts();
  });
  $("#heroBtn").addEventListener("click", () =>
    window.scrollTo({ top: 560, behavior: "smooth" }));

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
  $("#detailClose").addEventListener("click", () =>
    $("#detailModal").classList.add("hidden"));
  $("#detailModal").addEventListener("click", (e) => {
    if (e.target.id === "detailModal") $("#detailModal").classList.add("hidden");
  });
  $("#rewardGoShopping").addEventListener("click", () =>
    $("#rewardModal").classList.add("hidden"));
  $("#orderClose").addEventListener("click", () => {
    $("#orderModal").classList.add("hidden");
    State.cart = {};
    State.reward = null;
    State.respondedToAI = false;
    renderProducts();
    renderCart();
  });
}

document.addEventListener("DOMContentLoaded", init);
