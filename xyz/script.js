/* ============================================================
   Smash Bros — menu page (index.html)
   ============================================================ */

"use strict";

const menuGrid = $("#menuGrid");

/* category photography shared by the menu grid */
const PHOTOS = {
  burgers: "img/burger-cat.jpg",
  sides: "img/fries.jpg",
  shakes: "img/shake.jpg",
};

/* ---------------- render tickets ---------------- */

function tagClass(label) {
  const l = label.toLowerCase();
  if (l === "spicy") return "tag tag--hot";
  if (l === "veggie") return "tag tag--veg";
  return "tag";
}

function renderMenu() {
  menuGrid.innerHTML = MENU.map((item, i) => {
    const no = String(i + 1).padStart(2, "0");
    const tags = item.tags.length
      ? '<div class="ticket__tags">' + item.tags.map((t) => '<span class="' + tagClass(t) + '">' + t + "</span>").join("") + "</div>"
      : "";

    return `
      <article class="ticket reveal" data-cat="${item.cat}" data-id="${item.id}" tabindex="0">
        <div class="ticket__perf">
          <span class="ticket__no">${no}</span>
          <span>${item.cat}</span>
          <span class="ticket__price">${money(item.price)}</span>
        </div>
        <div class="ticket__photo"><img src="${PHOTOS[item.cat] || PHOTOS.burgers}" alt="" loading="lazy" /></div>
        <h3><a href="product.html?id=${item.id}">${item.name}</a></h3>
        <p>${item.blurb}</p>
        ${tags}
        <button class="add-btn" data-add="${item.id}">+ Add to order</button>
      </article>`;
  }).join("");

  if (window.__observeReveals) window.__observeReveals();
}

renderMenu();

/* ---------------- filters ---------------- */

$("#filters").addEventListener("click", (e) => {
  const btn = e.target.closest(".chip");
  if (!btn) return;

  $$(".chip").forEach((c) => {
    const on = c === btn;
    c.classList.toggle("is-active", on);
    c.setAttribute("aria-pressed", String(on));
  });
  const filter = btn.dataset.filter;

  $$(".ticket", menuGrid).forEach((card) => {
    card.classList.toggle("is-hidden", filter !== "all" && card.dataset.cat !== filter);
  });
});

/* ---------------- ticket interactions ---------------- */

menuGrid.addEventListener("click", (e) => {
  const add = e.target.closest("[data-add]");
  if (add) {
    Cart.add(add.dataset.add, 1);
    toast(findItem(add.dataset.add).name + " added");
    return;
  }
  const ticket = e.target.closest(".ticket");
  if (ticket && !e.target.closest("a")) {
    location.href = "product.html?id=" + ticket.dataset.id;
  }
});

menuGrid.addEventListener("keydown", (e) => {
  if (e.key !== "Enter") return;
  const ticket = e.target.closest(".ticket");
  if (ticket && e.target === ticket) location.href = "product.html?id=" + ticket.dataset.id;
});

/* ---------------- cart drawer ---------------- */

const drawer  = $("#cartDrawer");
const backdrop = $("#cartBackdrop");
const itemsEl = $("#cartItems");
const noteEl  = $("#checkoutNote");

function paintDrawer() {
  const lines = Cart.all();

  if (!lines.length) {
    itemsEl.innerHTML = `
      <div class="cart-empty">
        <b>Nothing on the ticket</b>
        <span>Pick something off the menu and it lands right here.</span>
      </div>`;
  } else {
    itemsEl.innerHTML = lines.map(({ item, qty }) => `
      <div class="cart-item">
        <div>
          <div class="cart-item__name">${item.name}</div>
          <div class="cart-item__unit">${money(item.price)} each</div>
        </div>
        <div class="cart-item__sum">${money(item.price * qty)}</div>
        <div class="qty">
          <button data-dec="${item.id}" aria-label="One fewer ${item.name}">&minus;</button>
          <output>${qty}</output>
          <button data-inc="${item.id}" aria-label="One more ${item.name}">+</button>
          <button class="qty__remove" data-del="${item.id}">Remove</button>
        </div>
      </div>`).join("");
  }

  const sub = Cart.subtotal();
  $("#subtotal").textContent = money(sub);
  $("#tax").textContent = money(sub * TAX_RATE);
  $("#total").textContent = money(sub * (1 + TAX_RATE));
}

Cart.on(paintDrawer);
paintDrawer();

itemsEl.addEventListener("click", (e) => {
  const inc = e.target.closest("[data-inc]");
  const dec = e.target.closest("[data-dec]");
  const del = e.target.closest("[data-del]");
  if (inc) Cart.add(inc.dataset.inc, 1);
  if (dec) Cart.add(dec.dataset.dec, -1);
  if (del) Cart.remove(del.dataset.del);
});

let lastFocused = null;

function openCart() {
  drawer.classList.add("is-open");
  drawer.setAttribute("aria-hidden", "false");
  backdrop.hidden = false;
  requestAnimationFrame(() => backdrop.classList.add("is-open"));
  document.body.style.overflow = "hidden";
  lastFocused = document.activeElement;
  $("#cartClose").focus();
}

function closeCart() {
  const wasOpen = drawer.classList.contains("is-open");
  drawer.classList.remove("is-open");
  drawer.setAttribute("aria-hidden", "true");
  backdrop.classList.remove("is-open");
  document.body.style.overflow = "";
  setTimeout(() => {
    if (!drawer.classList.contains("is-open")) backdrop.hidden = true;
  }, 300);
  if (wasOpen && lastFocused && typeof lastFocused.focus === "function") {
    lastFocused.focus();
  }
  lastFocused = null;
}

$("#cartOpen").addEventListener("click", openCart);
$("#cartClose").addEventListener("click", closeCart);
backdrop.addEventListener("click", closeCart);

/* Escape closes, Tab is trapped inside the open drawer */
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") { closeCart(); return; }
  if (e.key !== "Tab" || !drawer.classList.contains("is-open")) return;

  const focusable = $$("a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex='-1'])", drawer)
    .filter((el) => el.offsetParent !== null);

  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
});

/* deep link: index.html#order opens the ticket drawer */
function syncDrawerToHash() {
  if (location.hash === "#order") openCart();
  else if (location.hash === "" && drawer.classList.contains("is-open")) closeCart();
}
window.addEventListener("hashchange", syncDrawerToHash);
if (location.hash === "#order") requestAnimationFrame(syncDrawerToHash);

$("#checkoutBtn").addEventListener("click", () => {
  if (!Cart.count()) {
    noteEl.textContent = "Add something tasty first.";
    noteEl.className = "form-note err";
    return;
  }
  location.href = "checkout.html";
});

/* ---------------- boot ---------------- */

initStore();
