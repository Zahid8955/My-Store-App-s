(() => {
  "use strict";

  const API = "https://dummyjson.com/products?limit=100";
  const CART_KEY = "zahid_store_cart";
  const WISH_KEY = "zahid_store_wishlist";

  const fallbackProducts = [
    {id:1,title:"Essence Mascara Lash Princess",price:9.99,category:"beauty",thumbnail:"https://cdn.dummyjson.com/product-images/beauty/essence-mascara-lash-princess/thumbnail.webp",description:"Popular mascara known for its volumizing and lengthening effects."},
    {id:2,title:"Calvin Klein CK One",price:49.99,category:"fragrances",thumbnail:"https://cdn.dummyjson.com/product-images/fragrances/calvin-klein-ck-one/thumbnail.webp",description:"A classic fragrance with a clean and fresh character."},
    {id:3,title:"Annibale Colombo Bed",price:1899.99,category:"furniture",thumbnail:"https://cdn.dummyjson.com/product-images/furniture/annibale-colombo-bed/thumbnail.webp",description:"A premium furniture piece for a comfortable bedroom."},
    {id:4,title:"Apple MacBook Pro 14 Inch Space Grey",price:1999.99,category:"laptops",thumbnail:"https://cdn.dummyjson.com/product-images/laptops/apple-macbook-pro-14-inch-space-grey/thumbnail.webp",description:"A powerful laptop designed for demanding everyday work."},
    {id:5,title:"Blue & Black Check Shirt",price:29.99,category:"mens-shirts",thumbnail:"https://cdn.dummyjson.com/product-images/mens-shirts/blue-&-black-check-shirt/thumbnail.webp",description:"A comfortable everyday check shirt."},
    {id:6,title:"Nike Air Jordan 1 Red And Black",price:149.99,category:"mens-shoes",thumbnail:"https://cdn.dummyjson.com/product-images/mens-shoes/nike-air-jordan-1-red-and-black/thumbnail.webp",description:"Classic athletic footwear with a bold design."},
    {id:7,title:"Rolex Submariner Watch",price:13999.99,category:"mens-watches",thumbnail:"https://cdn.dummyjson.com/product-images/mens-watches/rolex-submariner-watch/thumbnail.webp",description:"A premium watch with a timeless design."}
  ];

  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const money = n => `₹${Number(n || 0).toFixed(2)}`;

  function read(key) {
    try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; }
  }
  function write(key, value) { localStorage.setItem(key, JSON.stringify(value)); }

  if (!localStorage.getItem(CART_KEY))
    write(CART_KEY, fallbackProducts.slice(0,3).map(p => ({...p, qty:1})));
  if (!localStorage.getItem(WISH_KEY))
    write(WISH_KEY, fallbackProducts.slice(5,7));

  function updateCounts() {
    const cart = read(CART_KEY), wish = read(WISH_KEY);
    const cartCount = cart.reduce((sum,p) => sum + Number(p.qty || 0), 0);
    $$("#cart-count").forEach(el => el.textContent = cartCount);
    $$("#wishlist-count").forEach(el => el.textContent = wish.length);
  }

  function addCart(product, qty=1) {
    const cart = read(CART_KEY);
    const old = cart.find(p => Number(p.id) === Number(product.id));
    if (old) old.qty = Number(old.qty || 0) + Number(qty || 1);
    else cart.push({...product, qty:Number(qty)||1});
    write(CART_KEY, cart);
    updateCounts();
  }

  function addWish(product) {
    const wish = read(WISH_KEY);
    if (!wish.some(p => Number(p.id) === Number(product.id))) wish.push({...product});
    write(WISH_KEY, wish);
    updateCounts();
  }

  function removeWish(id) {
    write(WISH_KEY, read(WISH_KEY).filter(p => Number(p.id) !== Number(id)));
    updateCounts();
  }

  function removeCart(id) {
    write(CART_KEY, read(CART_KEY).filter(p => Number(p.id) !== Number(id)));
    updateCounts();
  }

  function esc(v) {
    return String(v ?? "").replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  }

  async function getProducts() {
    try {
      const r = await fetch(API);
      if (!r.ok) throw new Error();
      const d = await r.json();
      return d.products?.length ? d.products : fallbackProducts;
    } catch { return fallbackProducts; }
  }

  async function initHome() {
    const container = $("#products-container");
    if (!container) return;

    const search = $("#search-input");
    const filters = $("#category-filters");
    const products = await getProducts();
    let active = "all";

    const categories = ["all", ...new Set(products.map(p => p.category).filter(Boolean))];
    filters.innerHTML = categories.map(c => `
      <button type="button" data-category="${esc(c)}"
        class="px-4 py-1.5 rounded-md text-sm font-medium transition ${c==="all" ? "bg-teal-700 text-white" : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-100"}">
        ${esc(c.replaceAll("-"," "))}
      </button>`).join("");

    function render() {
      const q = (search?.value || "").toLowerCase().trim();
      const list = products.filter(p =>
        (active === "all" || p.category === active) &&
        (!q || `${p.title} ${p.category} ${p.description || ""}`.toLowerCase().includes(q))
      );

      container.innerHTML = list.length ? list.map(p => `
        <article class="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition">
          <div class="h-48 flex items-center justify-center mb-4">
            <img src="${p.thumbnail}" alt="${esc(p.title)}" class="max-h-full max-w-full object-contain" loading="lazy">
          </div>
          <span class="text-xs font-semibold text-teal-700 uppercase">${esc(p.category || "product")}</span>
          <h2 class="font-semibold text-slate-900 text-sm my-2 line-clamp-2">${esc(p.title)}</h2>
          <div class="font-bold text-lg text-slate-900">${money(p.price)}</div>
          <div class="grid grid-cols-2 gap-2 mt-4">
            <a href="product-details.html?id=${encodeURIComponent(p.id)}" class="text-center bg-teal-700 hover:bg-teal-800 text-white text-sm font-medium py-2 rounded">Details</a>
            <button data-add-cart="${p.id}" class="bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium py-2 rounded">Add Cart</button>
          </div>
        </article>`).join("")
      : `<div class="col-span-full bg-white border border-slate-200 rounded-lg p-10 text-center text-slate-500">No products found.</div>`;

      $$("[data-add-cart]", container).forEach(btn => btn.onclick = () => {
        const p = products.find(x => Number(x.id) === Number(btn.dataset.addCart));
        addCart(p); btn.textContent = "Added ✓";
        setTimeout(() => btn.textContent = "Add Cart", 900);
      });
    }

    filters.onclick = e => {
      const b = e.target.closest("[data-category]");
      if (!b) return;
      active = b.dataset.category;
      $$("[data-category]", filters).forEach(x => x.className = "px-4 py-1.5 rounded-md text-sm font-medium bg-white text-slate-700 border border-slate-300 hover:bg-slate-100 transition");
      b.className = "px-4 py-1.5 rounded-md text-sm font-medium bg-teal-700 text-white transition";
      render();
    };
    search?.addEventListener("input", render);
    render();
  }

  function initCart() {
    const root = $("#cart-container");
    if (!root) return;

    function render() {
      const cart = read(CART_KEY);
      if (!cart.length) {
        root.innerHTML = `<div class="bg-white border border-slate-200 rounded-lg p-12 text-center">
          <h2 class="text-xl font-semibold text-slate-900">Your cart is empty</h2>
          <p class="text-slate-500 text-sm mt-2 mb-6">Add some products to continue shopping.</p>
          <a href="index.html" class="inline-flex bg-teal-700 text-white px-6 py-2.5 rounded-md text-sm">Start Shopping</a>
        </div>`;
        return;
      }

      const subtotal = cart.reduce((s,p) => s + Number(p.price)*Number(p.qty), 0);
      root.innerHTML = `<div class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div class="lg:col-span-2 bg-white border border-slate-200 rounded-lg divide-y divide-slate-200 overflow-hidden shadow-sm">
          ${cart.map(p => `<div class="p-4 sm:p-6 flex flex-col sm:flex-row items-center gap-4 justify-between">
            <div class="flex items-center gap-4 flex-1 min-w-0 w-full">
              <img src="${p.thumbnail}" alt="${esc(p.title)}" class="w-20 h-20 object-contain border rounded p-1">
              <div class="min-w-0"><a href="product-details.html?id=${p.id}" class="text-sm font-semibold hover:text-teal-700">${esc(p.title)}</a><p class="text-xs text-slate-500">${money(p.price)} each</p></div>
            </div>
            <div class="flex items-center gap-3">
              <button data-minus="${p.id}" class="px-3 py-1 border rounded">−</button><span>${p.qty}</span><button data-plus="${p.id}" class="px-3 py-1 border rounded">+</button>
              <b class="w-24 text-right">${money(p.price*p.qty)}</b>
              <button data-wish="${p.id}" class="text-teal-700">♡</button><button data-remove="${p.id}" class="text-red-500">🗑</button>
            </div>
          </div>`).join("")}
        </div>
        <aside class="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
          <h2 class="font-bold text-lg">Order Summary</h2>
          <div class="flex justify-between mt-5 text-sm"><span>Items</span><span>${cart.reduce((s,p)=>s+Number(p.qty),0)}</span></div>
          <div class="flex justify-between mt-3 text-sm"><span>Subtotal</span><span>${money(subtotal)}</span></div>
          <div class="flex justify-between mt-3 text-sm"><span>Delivery</span><span class="text-teal-700">Free</span></div>
          <div class="border-t mt-5 pt-5 flex justify-between font-bold"><span>Total</span><span>${money(subtotal)}</span></div>
          <button id="checkout-btn" class="w-full mt-6 bg-teal-700 hover:bg-teal-800 text-white py-2.5 rounded">Checkout</button>
        </aside>
      </div>`;

      $$("[data-minus]",root).forEach(b => b.onclick=()=>changeQty(b.dataset.minus,-1));
      $$("[data-plus]",root).forEach(b => b.onclick=()=>changeQty(b.dataset.plus,1));
      $$("[data-remove]",root).forEach(b => b.onclick=()=>{removeCart(b.dataset.remove);render();});
      $$("[data-wish]",root).forEach(b => b.onclick=()=>{
        const p=cart.find(x=>String(x.id)===String(b.dataset.wish)); if(p){addWish(p);removeCart(p.id);render();}
      });
      $("#checkout-btn")?.addEventListener("click",()=>alert("Checkout demo: your order is ready to be processed."));
    }

    function changeQty(id, delta) {
      const cart=read(CART_KEY), p=cart.find(x=>String(x.id)===String(id));
      if(!p)return;
      p.qty=Number(p.qty)+delta;
      write(CART_KEY,p.qty>0?cart:cart.filter(x=>String(x.id)!==String(id)));
      updateCounts(); render();
    }
    render();
  }

  async function initProduct() {
    const root = $("#product-detail-container");
    if (!root) return;
    const products = await getProducts();
    const id = Number(new URLSearchParams(location.search).get("id")) || 1;
    const p = products.find(x=>Number(x.id)===id) || products[0];

    root.innerHTML = `<div class="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
      <div class="bg-white border border-slate-200 rounded-lg p-8 flex items-center justify-center min-h-[350px]">
        <img src="${p.thumbnail}" alt="${esc(p.title)}" class="max-h-96 max-w-full object-contain">
      </div>
      <div>
        <span class="text-xs font-semibold text-teal-700 uppercase">${esc(p.category || "product")}</span>
        <h1 class="text-2xl sm:text-3xl font-bold text-slate-900 mt-2 mb-3">${esc(p.title)}</h1>
        <div class="text-amber-400 mb-4">★★★★★ <span class="text-sm text-slate-500">${Number(p.rating || 0).toFixed(1)} rating</span></div>
        <div class="text-3xl font-bold text-slate-900 mb-6">${money(p.price)}</div>
        <p class="border-y py-6 mb-6 text-slate-600 leading-relaxed">${esc(p.description || "Quality product for everyday use.")}</p>
        <div class="flex flex-wrap items-center gap-4">
          <div class="flex items-center border rounded"><button id="qty-minus" class="px-3 py-2">−</button><span id="qty-value" class="w-10 text-center">1</span><button id="qty-plus" class="px-3 py-2">+</button></div>
          <button id="add-to-cart-btn" class="bg-teal-700 hover:bg-teal-800 text-white font-medium py-2.5 px-6 rounded">Add to Cart</button>
          <button id="add-to-wishlist-btn" class="border border-teal-700 text-teal-700 py-2.5 px-6 rounded"><span id="wishlist-btn-text">Add to Wishlist</span></button>
        </div>
      </div>
    </div>`;

    let qty=1;
    $("#qty-minus").onclick=()=>{qty=Math.max(1,qty-1);$("#qty-value").textContent=qty;};
    $("#qty-plus").onclick=()=>{qty++;$("#qty-value").textContent=qty;};
    $("#add-to-cart-btn").onclick=()=>{addCart(p,qty);alert("Product added to cart.");};
    $("#add-to-wishlist-btn").onclick=()=>{addWish(p);$("#wishlist-btn-text").textContent="Added ✓";};
  }

  function initWishlist() {
    const root = $("#wishlist-container");
    if (!root) return;

    function render() {
      const wish=read(WISH_KEY);
      root.innerHTML = wish.length ? `<div class="bg-white border border-slate-200 rounded-lg divide-y divide-slate-200 overflow-hidden shadow-sm">
        ${wish.map(p=>`<div class="p-4 sm:p-6 flex items-center justify-between gap-4">
          <div class="flex items-center gap-4 min-w-0"><img src="${p.thumbnail}" class="w-20 h-20 object-contain border rounded p-1"><div><a href="product-details.html?id=${p.id}" class="font-semibold hover:text-teal-700">${esc(p.title)}</a><p class="font-bold mt-1">${money(p.price)}</p></div></div>
          <div class="flex gap-2"><button data-wcart="${p.id}" class="bg-teal-700 text-white px-4 py-2 rounded text-sm">Add to Cart</button><button data-wremove="${p.id}" class="border px-3 py-2 rounded text-sm hover:text-red-600">Remove</button></div>
        </div>`).join("")}</div>`
      : `<div class="bg-white border border-slate-200 rounded-lg p-12 text-center"><h2 class="text-xl font-semibold">Your wishlist is empty</h2><p class="text-slate-500 text-sm mt-2 mb-6">Save products here to find them later.</p><a href="index.html" class="bg-teal-700 text-white px-6 py-2.5 rounded-md text-sm">Start Shopping</a></div>`;

      $$("[data-wcart]",root).forEach(b=>b.onclick=()=>{const p=wish.find(x=>String(x.id)===String(b.dataset.wcart));addCart(p);b.textContent="Added ✓";});
      $$("[data-wremove]",root).forEach(b=>b.onclick=()=>{removeWish(b.dataset.wremove);render();});
    }
    render();
  }

  document.addEventListener("DOMContentLoaded", async () => {
    updateCounts();
    await initHome();
    initCart();
    await initProduct();
    initWishlist();
    updateCounts();
  });
})();