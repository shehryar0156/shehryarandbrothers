/* ============================================================
   Smash Bros — shared store, cart & page utilities
   Loaded before any page-specific script.
   ============================================================ */

"use strict";

/* ---------------- menu data ---------------- */

const MENU = [
  { id: "classic",  cat: "burgers", name: "The Classic Smash", price: 8.50,
    blurb: "Single smashed patty, American cheese, pickles, onion, house sauce.",
    desc: "One two-ounce ball of chuck and brisket, smashed hard on the plancha for thirty seconds a side. American cheese melted over the top at the twenty-second mark, house pickles, shaved white onion, and the sauce we refuse to explain.",
    tags: ["Bestseller"], kcal: 640, prep: "8 min" },
  { id: "double",    cat: "burgers", name: "Double Trouble", price: 12.00,
    blurb: "Two patties, double cheddar, caramelised onion, bacon jam.",
    desc: "Two patties, two slices of aged cheddar, a spoonful of slow-cooked bacon jam and a heap of caramelised onion. The one we are known for. Bring napkins, bring a friend.",
    tags: ["Bestseller"], kcal: 980, prep: "10 min" },
  { id: "bacon",     cat: "burgers", name: "Smokehouse Bacon", price: 13.50,
    blurb: "Patty, double-smoked bacon, aged cheddar, crispy onions, BBQ glaze.",
    desc: "Double-smoked bacon cooked to order, aged cheddar, a tangle of crispy onions and a sticky house BBQ glaze brushed straight onto the patty.",
    tags: ["Popular"], kcal: 910, prep: "11 min" },
  { id: "spicy",     cat: "burgers", name: "Hot Mess", price: 12.50,
    blurb: "Patty, pepper jack, jalapeños, chipotle mayo, hot honey drizzle.",
    desc: "Pepper jack, pickled jalapeños, chipotle mayo and a hot honey drizzle that lands after the press. It is not subtle. It is not trying to be.",
    tags: ["Spicy"], kcal: 870, prep: "10 min" },
  { id: "veggie",    cat: "burgers", name: "Garden Smash", price: 10.50,
    blurb: "Charred mushroom & black bean patty, avocado, gem lettuce, herb mayo.",
    desc: "A charred mushroom and black bean patty smashed on the same plancha, with avocado, gem lettuce and a bright herb mayo. Ordered as often as anything else on the board.",
    tags: ["Veggie"], kcal: 560, prep: "9 min" },
  { id: "chicken",   cat: "burgers", name: "Buttermilk Bird", price: 11.50,
    blurb: "Crispy buttermilk chicken, slaw, pickles, hot honey butter.",
    desc: "Thigh meat brined overnight in buttermilk, fried to order, stacked with sharp slaw, house pickles and hot honey butter melting down the side.",
    tags: ["Popular"], kcal: 820, prep: "12 min" },

  { id: "fries",     cat: "sides", name: "Dirty Fries", price: 5.00,
    blurb: "Skin-on fries, cheese sauce, pickled onion, scallion, house dust.",
    desc: "Skin-on fries buried under cheese sauce, pickled onion, scallion and a shake of our smoked house dust. The correct order is to get one for the table and then regret sharing.",
    tags: ["Bestseller"], kcal: 720, prep: "6 min" },
  { id: "rings",     cat: "sides", name: "Beer Onion Rings", price: 4.50,
    blurb: "Thick-cut rings in a light batter with smoked aioli.",
    desc: "Thick-cut sweet onion in a light beer batter, fried crisp and salted immediately, served with smoked aioli for dipping.",
    tags: [], kcal: 480, prep: "7 min" },
  { id: "tots",      cat: "sides", name: "Loaded Tots", price: 5.50,
    blurb: "Crispy tots, bacon, cheddar, sour cream and chives.",
    desc: "Crispy tots with bacon, sharp cheddar, a cold dollop of sour cream and a heavy hand with the chives.",
    tags: [], kcal: 690, prep: "7 min" },

  { id: "oreo",      cat: "shakes", name: "Cookies & Cream", price: 6.00,
    blurb: "Thick vanilla custard shake blitzed with cookie crumb.",
    desc: "Vanilla custard churned thick, blitzed with cookie crumb until it is more cookies than cream. Served so thick the straw stands up on its own.",
    tags: ["Bestseller"], kcal: 640, prep: "4 min" },
  { id: "saltedc",   cat: "shakes", name: "Salted Caramel", price: 6.00,
    blurb: "Caramel swirl, flaky sea salt, whipped cream.",
    desc: "House caramel swirled through vanilla custard, finished with flaky sea salt and a cloud of whipped cream.",
    tags: [], kcal: 660, prep: "4 min" },
  { id: "straw",     cat: "shakes", name: "Strawberry Fields", price: 6.00,
    blurb: "Real macerated strawberries folded through vanilla shake.",
    desc: "Strawberries macerated with sugar that morning, folded through vanilla shake with the fruit left in. No syrup, no pink dye.",
    tags: ["Veggie"], kcal: 540, prep: "4 min" },
];

const TAX_RATE = 0.08;
const CART_KEY = "smashbros.cart.v1";

/* ---------------- helpers ---------------- */

const $  = (sel, scope = document) => scope.querySelector(sel);
const $$ = (sel, scope = document) => Array.from(scope.querySelectorAll(sel));
const money = (n) => "$" + n.toFixed(2);
const findItem = (id) => MENU.find((m) => m.id === id) || null;

/* ---------------- cart storage ---------------- */

const Cart = {
  read() {
    try {
      const raw = JSON.parse(localStorage.getItem(CART_KEY)) || {};
      return typeof raw === "object" && raw !== null ? raw : {};
    } catch (e) {
      return {};
    }
  },

  write(data) {
    try { localStorage.setItem(CART_KEY, JSON.stringify(data)); } catch (e) { /* private mode */ }
    Cart.emit();
  },

  all() {
    const data = Cart.read();
    return Object.keys(data)
      .filter((id) => findItem(id) && data[id] > 0)
      .map((id) => ({ item: findItem(id), qty: data[id] }));
  },

  qtyOf(id) { return Cart.read()[id] || 0; },

  /* counts resolved lines only, so stale ids in storage can't inflate the badge */
  count() {
    return Cart.all().reduce((sum, line) => sum + (Number(line.qty) || 0), 0);
  },

  subtotal() {
    return Cart.all().reduce((sum, line) => sum + line.item.price * line.qty, 0);
  },

  add(id, n = 1) {
    const data = Cart.read();
    data[id] = Math.max(0, (data[id] || 0) + n);
    if (data[id] === 0) delete data[id];
    Cart.write(data);
  },

  set(id, qty) {
    const data = Cart.read();
    if (qty > 0) data[id] = qty; else delete data[id];
    Cart.write(data);
  },

  remove(id) { Cart.set(id, 0); },

  clear() { Cart.write({}); },

  /* tiny event bus so every open page stays in sync */
  listeners: [],
  on(fn) { Cart.listeners.push(fn); },
  emit() { Cart.listeners.forEach((fn) => { try { fn(); } catch (e) {} }); },
};

/* ---------------- shared UI ---------------- */

function initNav() {
  const nav = $("#nav");
  const toggle = $("#navToggle");
  if (!nav || !toggle) return;

  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(open));
  });

  nav.addEventListener("click", (e) => {
    if (e.target.closest("a")) {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    }
  });
}

function initHeaderShadow() {
  const header = $(".site-header");
  if (!header) return;
  const onScroll = () => header.classList.toggle("is-stuck", window.scrollY > 12);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

function initReveal() {
  const nodes = $$(".reveal");
  if (!("IntersectionObserver" in window)) {
    nodes.forEach((el) => el.classList.add("is-visible"));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: "0px 0px -40px 0px" });

  const observeAll = () => $$(".reveal:not(.is-visible)").forEach((el) => io.observe(el));
  observeAll();
  return observeAll;
}

let toastTimer;
function toast(msg) {
  const el = $("#toast");
  if (!el) return;
  el.textContent = msg;
  el.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("is-visible"), 2400);
}

/* keeps the header badge in step with the cart on every page */
function initCartBadge() {
  const badge = $("#cartCount");
  const paint = () => {
    if (!badge) return;
    const n = Cart.count();
    badge.textContent = n;
    badge.classList.toggle("is-empty", n === 0);
  };
  Cart.on(paint);
  paint();
  return paint;
}

function initYear() {
  const el = $("#year");
  if (el) el.textContent = new Date().getFullYear();
}

function initTodayHours() {
  const row = $('.hours tr[data-day="' + new Date().getDay() + '"]');
  if (row) row.classList.add("is-today");
}

function initContactForm() {
  const form = $("#contactForm");
  if (!form) return;
  const note = $("#formNote");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const fields = ["name", "email", "message"].map((n) => form.elements[n]);
    let valid = true;

    fields.forEach((field) => {
      const bad = !field.value.trim() ||
        (field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value.trim()));
      field.classList.toggle("is-error", bad);
      if (bad) valid = false;
    });

    if (!valid) {
      note.textContent = "Fill in every line with a valid email.";
      note.className = "form-note err";
      return;
    }
    note.textContent = "Sent. We will reply within a working day.";
    note.className = "form-note ok";
    form.reset();
  });
}

/* runs on every page */
function initStore() {
  initNav();
  initHeaderShadow();
  initCartBadge();
  initYear();
  initTodayHours();
  initContactForm();
  const reveal = initReveal();
  if (reveal) window.__observeReveals = reveal;
}
