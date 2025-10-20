

// localStorage helpers
const storage = {
  get(k, d){ try{ return JSON.parse(localStorage.getItem(k)) ?? d; }catch{ return d; } },
  set(k,v){ localStorage.setItem(k, JSON.stringify(v)); }
};

let cart = storage.get('cart', []); // [{id, qty}]

// update nav cart count
function updateNavCartCount(){
  const el = document.getElementById('nav-cart-count');
  if (!el) return;
  const count = cart.reduce((s,i)=>s+i.qty,0);
  el.textContent = count;
}
document.addEventListener('DOMContentLoaded', updateNavCartCount);

// homepage ambience control
document.addEventListener('DOMContentLoaded', ()=>{
  const btn = document.getElementById('toggle-ambience');
  const audio = document.getElementById('ambience');
  if (btn && audio){
    btn.addEventListener('click', ()=>{
      if (audio.paused){ audio.play(); btn.textContent='停止環境音'; }
      else { audio.pause(); btn.textContent='播放環境音'; }
    });
  }
});

// product list rendering
function renderProductList(list){
  const container = document.getElementById('product-list');
  if (!container) return;
  container.innerHTML = '';
  list.forEach(p=>{
    const d = document.createElement('div'); d.className='card';
    d.innerHTML = `
      <img src="${p.image}" alt="${p.name}" loading="lazy" />
      <div class="card-body">
        <div class="card-title">${p.name}</div>
        <div class="card-meta">${p.origin}</div>
        <p>${p.description}</p>
        <div class="card-actions">
          <a class="btn btn-secondary" href="product.html?id=${p.id}">查看詳情</a>
          <button class="btn btn-primary" data-add="${p.id}">加入購物車（$${p.price}）</button>
        </div>
      </div>`;
    container.appendChild(d);
  });
  container.querySelectorAll('button[data-add]').forEach(b=>b.addEventListener('click', ()=>addToCart(parseInt(b.dataset.add),1)));
}

// filters
function setupFilters(){
  const s = document.getElementById('search'), sort = document.getElementById('sort');
  if (!s || !sort) return;
  function apply(){
    const term = s.value.trim().toLowerCase();
    let list = products.filter(p=>{
      const t = `${p.name} ${p.origin} ${p.ingredients} ${p.description}`.toLowerCase();
      return t.includes(term);
    });
    switch(sort.value){
      case 'price-asc': list.sort((a,b)=>a.price-b.price); break;
      case 'price-desc': list.sort((a,b)=>b.price-a.price); break;
      case 'name-asc': list.sort((a,b)=>a.name.localeCompare(b.name,'zh-HK')); break;
      case 'name-desc': list.sort((a,b)=>b.name.localeCompare(a.name,'zh-HK')); break;
    }
    renderProductList(list);
  }
  s.addEventListener('input', apply);
  sort.addEventListener('change', apply);
  apply();
}

// product detail
function renderProductDetail(){
  const wrap = document.getElementById('product-detail');
  if (!wrap) return;
  const id = parseInt(new URLSearchParams(location.search).get('id'));
  const p = products.find(x=>x.id===id);
  if (!p){ wrap.innerHTML=`<div class="detail-box"><p>找不到商品</p><a class="btn btn-secondary" href="products.html">返回</a></div>`; return; }

  const thumbs = (p.gallery||[p.image]).map(src=>`<img src="${src}" data-large="${src}" alt="${p.name}" loading="lazy">`).join('');
  wrap.innerHTML = `
    <div class="media">
      <img id="hero-img" src="${p.image}" alt="${p.name}" />
      <div class="gallery">${thumbs}</div>
      <div class="media-actions">
        ${p.video?`<button class="btn btn-light" id="play-video">播放製作短片</button>`:''}
        ${p.audio?`<button class="btn btn-light" id="play-audio">播放語音導覽</button><audio id="audio-el" src="${p.audio}" preload="none"></audio>`:''}
      </div>
    </div>
    <div class="detail-box">
      <h1>${p.name}</h1>
      <div class="card-meta">${p.origin}</div>
      <p>${p.description}</p>
      <div class="kv"><div><strong>成份：</strong><br>${p.ingredients}</div><div><strong>做法說明：</strong><br>${p.method}</div></div>
      <div class="price">價格：$${p.price}</div>
      <div class="card-actions">
        <button class="btn btn-primary" id="add-one">加入購物車</button>
        <a class="btn btn-secondary" href="products.html">返回列表</a>
      </div>
    </div>
  `;

  const lightbox = document.getElementById('lightbox'), lightImg = document.getElementById('lightbox-img');
  document.querySelectorAll('.gallery img, #hero-img').forEach(img=>{
    img.addEventListener('click', ()=>{ lightImg.src = img.dataset.large || img.src; lightbox.setAttribute('aria-hidden','false'); });
  });
  document.querySelector('.lightbox-close')?.addEventListener('click', ()=>lightbox.setAttribute('aria-hidden','true'));
  lightbox?.addEventListener('click', e=>{ if (e.target===lightbox) lightbox.setAttribute('aria-hidden','true'); });

  const videobox = document.getElementById('videobox'), videoEl = document.getElementById('videobox-el');
  document.getElementById('play-video')?.addEventListener('click', ()=>{
    videoEl.src = p.video; videobox.setAttribute('aria-hidden','false'); videoEl.play();
  });
  document.querySelector('.videobox-close')?.addEventListener('click', ()=>{ videobox.setAttribute('aria-hidden','true'); videoEl.pause(); videoEl.src='';});
  videobox?.addEventListener('click', e=>{ if (e.target===videobox){ videobox.setAttribute('aria-hidden','true'); videoEl.pause(); videoEl.src=''; }});

  const audioBtn = document.getElementById('play-audio'), audioEl = document.getElementById('audio-el');
  if (audioBtn && audioEl) audioBtn.addEventListener('click', ()=>{ if (audioEl.paused){ audioEl.play(); audioBtn.textContent='停止語音導覽'; } else { audioEl.pause(); audioBtn.textContent='播放語音導覽'; } });

  document.getElementById('add-one')?.addEventListener('click', ()=>addToCart(p.id,1));
}

// cart ops
function addToCart(id, qty=1){
  const it = cart.find(i=>i.id===id);
  if (it) it.qty += qty; else cart.push({id, qty});
  storage.set('cart', cart); updateNavCartCount(); alert('已加入購物車');
}
function changeQty(id, delta){
  const it = cart.find(i=>i.id===id); if (!it) return; it.qty += delta; if (it.qty<=0) cart = cart.filter(i=>i.id!==id);
  storage.set('cart', cart); renderCart(); updateNavCartCount();
}
function removeItem(id){ cart = cart.filter(i=>i.id!==id); storage.set('cart', cart); renderCart(); updateNavCartCount(); }

// render cart + checkout
function renderCart(){
  const box = document.getElementById('cart-items'); if (!box) return;
  box.innerHTML=''; let subtotal=0;
  cart.forEach(ci=>{
    const p = products.find(x=>x.id===ci.id); if (!p) return;
    const lineTotal = p.price*ci.qty; subtotal += lineTotal;
    const div = document.createElement('div'); div.className='cart-item';
    div.innerHTML = `
      <img src="${p.image}" alt="${p.name}">
      <div>
        <div class="card-title">${p.name}</div>
        <div class="card-meta">${p.origin}</div>
        <div>單價：$${p.price} ｜ 小計：$${lineTotal}</div>
        <div class="qty">
          <button data-dec="${p.id}">－</button>
          <span>數量：${ci.qty}</span>
          <button data-inc="${p.id}">＋</button>
          <button class="btn btn-light" data-remove="${p.id}">移除</button>
        </div>
      </div>
      <div class="price">$${lineTotal}</div>
    `;
    box.appendChild(div);
  });
  const shipping = cart.length?30:0;
  document.getElementById('subtotal') && (document.getElementById('subtotal').textContent = `$${subtotal}`);
  document.getElementById('shipping') && (document.getElementById('shipping').textContent = `$${shipping}`);
  document.getElementById('grand-total') && (document.getElementById('grand-total').textContent = `$${subtotal+shipping}`);
  box.querySelectorAll('button[data-inc]').forEach(b=>b.addEventListener('click', ()=>changeQty(parseInt(b.dataset.inc),+1)));
  box.querySelectorAll('button[data-dec]').forEach(b=>b.addEventListener('click', ()=>changeQty(parseInt(b.dataset.dec),-1)));
  box.querySelectorAll('button[data-remove]').forEach(b=>b.addEventListener('click', ()=>removeItem(parseInt(b.dataset.remove))));
  document.getElementById('clear-cart')?.addEventListener('click', ()=>{
    if (confirm('確定清空購物車？')){ cart=[]; storage.set('cart',cart); renderCart(); updateNavCartCount(); }
  });

  const form = document.getElementById('checkout-form');
  if (form){
    form.addEventListener('submit', e=>{
      e.preventDefault();
      if (!cart.length){ alert('購物車為空'); return; }
      const subtotalEls = document.getElementById('subtotal').textContent.replace('$','') || '0';
      const shipping = parseInt(document.getElementById('shipping').textContent.replace('$',''))||0;
      const order = {
        items: cart.map(ci=>{ const p = products.find(x=>x.id===ci.id); return {id:p.id,name:p.name,price:p.price,qty:ci.qty}; }),
        subtotal: Number(subtotalEls), shipping, total: Number(subtotalEls)+shipping,
        customer: {
          name: document.getElementById('name').value.trim(),
          email: document.getElementById('email').value.trim(),
          phone: document.getElementById('phone').value.trim(),
          address: document.getElementById('address').value.trim(),
          delivery: document.getElementById('delivery').value,
          note: document.getElementById('note').value.trim()
        },
        createdAt: new Date().toISOString()
      };
      console.log('Order payload:', order);
      alert('感謝您的訂購！訂單已建立（模擬）。');
      cart=[]; storage.set('cart',cart); updateNavCartCount(); location.href='index.html';
    });
  }
}

// boot
document.addEventListener('DOMContentLoaded', ()=>{
  updateNavCartCount();
  if (document.getElementById('product-list')){ renderProductList(products); setupFilters(); }
  if (document.getElementById('product-detail')) renderProductDetail();
  if (document.getElementById('cart-items')) renderCart();
});
