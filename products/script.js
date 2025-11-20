/* products/script.js - versión final con init robusto y helper debug */
document.addEventListener('DOMContentLoaded', () => {

  /* CONFIG */
  const SUPABASE_URL = 'https://rxerfllxwdalduuzndiv.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4ZXJmbGx4d2RhbGR1dXpuZGl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1ODYxNTcsImV4cCI6MjA3OTE2MjE1N30.7l_8QAWd16aL3iHrxrRn1hJiW4MnxlR7HEjIkCEQDTE';
  const BUCKET_NAME = 'Products';

  /* --- DETECCIÓN ROBUSTA DEL UMD DE SUPABASE --- */
  const GLOBALS = {
    supabaseJs: window.supabaseJs,
    supabase: window.supabase,
    Supabase: window.Supabase,
    createClient: window.createClient
  };

  let _SUPABASE_GLOBAL = null;
  for (const k in GLOBALS) {
    if (GLOBALS[k] !== undefined && GLOBALS[k] !== null) {
      _SUPABASE_GLOBAL = GLOBALS[k];
      break;
    }
  }

  if (!_SUPABASE_GLOBAL) {
    console.error('Supabase UMD no detectado en window. Añade antes de este script:\n<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.28.0/dist/umd/supabase.min.js"></script>');
    return;
  }

  let _createClient;
  if (typeof _SUPABASE_GLOBAL.createClient === 'function') {
    _createClient = _SUPABASE_GLOBAL.createClient.bind(_SUPABASE_GLOBAL);
  } else if (typeof window.createClient === 'function') {
    _createClient = window.createClient;
  } else if (typeof _SUPABASE_GLOBAL === 'function') {
    _createClient = _SUPABASE_GLOBAL;
  } else {
    console.error('No se pudo localizar createClient en el global de Supabase:', _SUPABASE_GLOBAL);
    return;
  }

  const supabase = _createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  /* --- FIN detección --- */

  /* DOM refs */
  const productsList = () => document.getElementById('products-list');
  const searchInput = () => document.getElementById('searchInput');
  const categoryFilter = () => document.getElementById('categoryFilter');
  const stockFilter = () => document.getElementById('stockFilter');
  const sortSelect = () => document.getElementById('sortSelect');

  const modal = () => document.getElementById('productModal');
  const modalClose = () => document.getElementById('modalClose');
  const modalCloseBtn = () => document.getElementById('modalCloseBtn');
  const modalImg = () => document.getElementById('modalImg');
  const modalTitle = () => document.getElementById('modalTitle');
  const modalDesc = () => document.getElementById('modalDesc');
  const modalPrice = () => document.getElementById('modalPrice');
  const modalVariants = () => document.getElementById('modalVariants');

  let productsCache = [];

  /* helpers */
  function escapeHtml(str = '') {
    return String(str)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function productCardHTML(p){
    const variants = p.variants || [];
    const inStock = variants.some(v => v.stock > 0);
    const lowStock = variants.some(v => v.stock > 0 && v.stock < 5);
    return `
      <div class="product-card" data-id="${p.product_id}">
        <img loading="lazy" src="${p.image_url || 'assets/img/default.png'}" alt="${escapeHtml(p.title)}">
        <h3>${escapeHtml(p.title)}</h3>
        <p>${escapeHtml(p.description || '')}</p>
        <div class="price">${p.price ? '$' + p.price : ''}</div>
        <div class="stock-badge ${inStock ? 'in' : 'out'} ${lowStock ? 'low' : ''}">
          ${inStock ? (lowStock ? 'Stock bajo' : 'En stock') : 'Agotado'}
        </div>
        <ul class="variant-list">
          ${variants.map(v => `<li>${escapeHtml(v.name)} — <strong>${v.stock}</strong> unidades</li>`).join('')}
        </ul>
        <a class="details-btn" href="#" data-id="${p.product_id}">Ver detalles</a>
      </div>
    `;
  }

  function renderList(data){
    const container = productsList();
    if (!container) {
      console.warn('renderList: #products-list no encontrado (se intentó renderizar demasiado pronto).');
      return;
    }

    const cats = Array.from(new Set(data.map(d => d.category).filter(Boolean)));
    const catEl = categoryFilter();
    if(catEl && catEl.options.length <= 1){
      cats.forEach(c => {
        const o = document.createElement('option'); o.value = c; o.textContent = c;
        catEl.appendChild(o);
      });
    }

    const q = (searchInput()?.value || '').trim().toLowerCase();
    let list = data.filter(p => {
      if(q){
        return (p.title && p.title.toLowerCase().includes(q)) || (p.description && p.description.toLowerCase().includes(q));
      }
      return true;
    });

    const cat = catEl?.value;
    if(cat) list = list.filter(p => p.category === cat);

    const stock = stockFilter()?.value;
    if(stock === 'instock') list = list.filter(p => (p.variants || []).some(v=>v.stock>0));
    if(stock === 'low') list = list.filter(p => (p.variants || []).some(v=>v.stock>0 && v.stock<5));
    if(stock === 'out') list = list.filter(p => !(p.variants || []).some(v=>v.stock>0));

    const s = sortSelect()?.value;
    if(s === 'price_asc') list.sort((a,b)=> (a.price||0)-(b.price||0));
    if(s === 'price_desc') list.sort((a,b)=> (b.price||0)-(a.price||0));
    if(s === 'title_asc') list.sort((a,b)=> (a.title||'').localeCompare(b.title||''));

    container.innerHTML = list.map(productCardHTML).join('');

    // attach detail handlers
    document.querySelectorAll('.details-btn').forEach(btn => {
      btn.addEventListener('click', (e)=>{
        e.preventDefault();
        const id = btn.dataset.id;
        openModalById(id);
      });
    });
  }

  function openModalById(productId){
    const p = productsCache.find(x => x.product_id === productId);
    if(!p) return;
    const mImg = modalImg(), mTitle = modalTitle(), mDesc = modalDesc(), mPrice = modalPrice(), mVariants = modalVariants();
    if (mImg) mImg.src = p.image_url || 'assets/img/default.png';
    if (mTitle) mTitle.textContent = p.title;
    if (mDesc) mDesc.textContent = p.description || '';
    if (mPrice) mPrice.textContent = p.price ? '$' + p.price : '';
    if (mVariants) mVariants.innerHTML = (p.variants || []).map(v => `
      <div class="variant-row">
        <div class="vname">${escapeHtml(v.name)}</div>
        <div class="vstock">${v.stock} unidades</div>
      </div>
    `).join('');
    const m = modal();
    if (m) { m.classList.add('show'); m.setAttribute('aria-hidden','false'); }
  }

  function closeModal(){
    const m = modal();
    if (m) { m.classList.remove('show'); m.setAttribute('aria-hidden','true'); }
  }

  /* LOAD: obtiene datos y convierte image_url -> publicUrl desde bucket */
  async function loadProducts(){
    console.log('[products] loadProducts start');
    try {
      const { data, error } = await supabase.from('products_with_variants').select('*');
      if (error) {
        console.error('[products] Error al leer products_with_variants:', error);
        return;
      }
      console.log('[products] rows recibidas:', data?.length || 0);

      if (!data || data.length === 0) {
        productsCache = [];
        renderList(productsCache);
        console.warn('[products] No hay productos en la view products_with_variants');
        return;
      }

      const normalized = await Promise.all(data.map(async d => {
        const variants = Array.isArray(d.variants) ? d.variants : (d.variants ? JSON.parse(d.variants) : []);
        let imgPath = d.image_url || '';
        if (imgPath) {
          try {
            const { data: pub } = supabase.storage.from(BUCKET_NAME).getPublicUrl(imgPath);
            imgPath = pub?.publicUrl || imgPath;
          } catch(pubErr){
            console.warn('[products] getPublicUrl fallo para', imgPath, pubErr);
          }
        }
        return { ...d, variants, image_url: imgPath };
      }));

      productsCache = normalized;
      renderList(productsCache);
      console.log('[products] renderizado OK');
    } catch (err) {
      console.error('[products] Excepción loadProducts:', err);
    }
  }

// (intento realtime + fallback polling)
function subscribeRealtime(){
  try {
    const channel = supabase
      .channel('public:product_variants')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'product_variants' }, payload => {
        console.log('Realtime: cambio detectado', payload);
        loadProducts();
      });

    channel.subscribe(status => {
      console.log('Realtime status:', status);
      if (status === 'SUBSCRIBED') {
        console.log('Realtime suscripción OK');
      } else if (status === 'CHANNEL_ERROR' || status === 'CLOSED') {
        console.warn('Realtime no disponible, activando fallback polling.');
        startPollingFallback();
      }
    });

    channel.on('unhandled_rejection', () => {
      console.warn('Realtime: unhandled_rejection -> fallback polling');
      startPollingFallback();
    });

  } catch (e) {
    console.warn('subscribeRealtime catch -> fallback polling', e);
    startPollingFallback();
  }
}

// polling simple (recarga loadProducts cada X ms)
let _pollingInterval = null;
function startPollingFallback(intervalMs = 15000) {
  if (_pollingInterval) return;
  _pollingInterval = setInterval(() => {
    console.log('Polling fallback: recargando productos');
    loadProducts();
  }, intervalMs);
}
function stopPollingFallback(){
  if (_pollingInterval) { clearInterval(_pollingInterval); _pollingInterval = null; }
}

  /* DEBUG helpers (temporal) */
  window._productsDebug = {
    loadProducts: loadProducts,
    productsCache: () => productsCache
  };

  /* INIT robusto: espera por #products-list si hace falta (timeout 2s), luego carga y suscribe realtime */
  (async function initProducts(){
    const waitUntil = (selector, ms = 2000) => new Promise(res => {
      const el = document.querySelector(selector);
      if (el) return res(el);
      const obs = new MutationObserver(() => {
        const e = document.querySelector(selector);
        if (e) { obs.disconnect(); res(e); }
      });
      obs.observe(document.documentElement, { childList: true, subtree: true });
      setTimeout(() => { obs.disconnect(); res(document.querySelector(selector)); }, ms);
    });

    await waitUntil('#products-list', 2000);
    await loadProducts();
    subscribeRealtime();
  })();

  /* UI events (delegated handlers will use current DOM elements) */
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.details-btn');
    if (btn) {
      e.preventDefault();
      openModalById(btn.dataset.id);
    }
  });

  const si = () => { const el = searchInput(); if (el) el.addEventListener('input', () => renderList(productsCache)); };
  const cf = () => { const el = categoryFilter(); if (el) el.addEventListener('change', () => renderList(productsCache)); };
  const sf = () => { const el = stockFilter(); if (el) el.addEventListener('change', () => renderList(productsCache)); };
  const ss = () => { const el = sortSelect(); if (el) el.addEventListener('change', () => renderList(productsCache)); };

  si(); cf(); sf(); ss();

  modalClose()?.addEventListener('click', closeModal);
  modalCloseBtn()?.addEventListener('click', closeModal);
  document.addEventListener('keydown', (e)=> { if(e.key === 'Escape') closeModal(); });
  modal()?.querySelector('.modal-backdrop')?.addEventListener('click', closeModal);

});