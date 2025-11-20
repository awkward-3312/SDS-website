/* products/script.js - versión corregida y robusta (focus restore, fallback image, selectores fijos) */
document.addEventListener('DOMContentLoaded', () => {

  /* CONFIG */
  const SUPABASE_URL = 'https://rxerfllxwdalduuzndiv.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4ZXJmbGx4d2RhbGR1dXpuZGl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1ODYxNTcsImV4cCI6MjA3OTE2MjE1N30.7l_8QAWd16aL3iHrxrRn1hJiW4MnxlR7HEjIkCEQDTE';
  const BUCKET_NAME = 'Products';

  // Fallback local image (ruta del archivo que subiste)
  const DEFAULT_IMG = '/mnt/data/b379a345-57b4-42f0-a748-df0c92d8a389.png';

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

  /* DOM refs (funciones para resolver en tiempo de uso) */
  const productsList = () => document.getElementById('products-list');
  const searchInput = () => document.getElementById('searchInput');
  const categoryFilter = () => document.getElementById('categoryFilter');
  const stockFilter = () => document.getElementById('stockFilter');
  const sortSelect = () => document.getElementById('sortSelect');

  const modal = () => document.getElementById('productModal');
  const modalCloseBtn = () => document.getElementById('modalCloseBtn'); // coincide con tu HTML
  const modalImg = () => document.getElementById('modalImg');
  const modalTitle = () => document.getElementById('modalTitle');
  const modalDesc = () => document.getElementById('modalDesc');
  const modalPrice = () => document.getElementById('modalPrice');
  const modalVariants = () => document.getElementById('modalVariants');
  const modalStock = () => document.getElementById('modalStock'); // <-- nuevo getter para stock

  const productCountEl = () => document.getElementById('productCount');
  const categoryChipsEl = () => document.getElementById('categoryChips');

  let productsCache = [];
  let _previousFocus = null;

  /* helpers */
  function escapeHtml(str = '') {
    return String(str)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  /* productCardHTML now includes tabindex and data-id so card can be focusable and clickable */
  function productCardHTML(p){
    const stock = Number(p.stock || 0);
    const inStock = stock > 0;
    const lowStock = inStock && stock < 5;

    // build badge text
    const badgeClass = inStock ? (lowStock ? 'stock-badge low' : 'stock-badge in') : 'stock-badge out';
    const badgeText = inStock ? (lowStock ? 'Stock bajo' : 'En stock') : 'Agotado';
    const badgeUnits = inStock ? ` — ${stock} unidades` : '';

    // Ensure id is string
    const id = p.id || p.product_id || '';

    const imgSrc = p.image_url && p.image_url.trim() ? p.image_url : DEFAULT_IMG;

    // Use a button for details to avoid accidental navigation
    return `
      <div class="product-card" data-id="${escapeHtml(String(id))}" tabindex="0" role="button" aria-pressed="false">
        <img loading="lazy" src="${escapeHtml(imgSrc)}" alt="${escapeHtml(p.title || '')}">
        <h3>${escapeHtml(p.title || '')}</h3>
        <p>${escapeHtml(p.description || '')}</p>
        <div class="price">${p.price ? 'L. ' + Number(p.price).toFixed(2) : ''}</div>
        <div class="${badgeClass}">
          ${badgeText}${badgeUnits}
        </div>
        <button class="details-btn" type="button" data-id="${escapeHtml(String(id))}">Ver detalles</button>
      </div>
    `;
  }

  /* Render category chips (mobile-friendly) */
  function renderCategoryChips(categories){
    const wrapper = categoryChipsEl();
    if (!wrapper) return;
    wrapper.innerHTML = ''; // reset
    const all = document.createElement('div');
    all.className = 'chip active';
    all.dataset.category = '';
    all.textContent = 'Todas';
    wrapper.appendChild(all);

    categories.forEach(c => {
      const ch = document.createElement('div');
      ch.className = 'chip';
      ch.dataset.category = c;
      ch.textContent = c;
      wrapper.appendChild(ch);
    });

    wrapper.querySelectorAll('.chip').forEach(chip => {
      chip.addEventListener('click', () => {
        wrapper.querySelectorAll('.chip').forEach(x => x.classList.remove('active'));
        chip.classList.add('active');
        const select = categoryFilter();
        if (select) select.value = chip.dataset.category;
        renderList(productsCache);
      });
    });
  }

  /* Renders the product grid and updates controls (category select, chips, count) */
  function renderList(data){
    const container = productsList();
    if (!container) {
      console.warn('renderList: #products-list no encontrado (se intentó renderizar demasiado pronto).');
      return;
    }

    // compute categories
    const cats = Array.from(new Set(data.map(d => d.category).filter(Boolean)));
    const catEl = categoryFilter();
    if (catEl && catEl.options.length <= 1){
      // ensure we don't duplicate options
      catEl.innerHTML = '';
      const empty = document.createElement('option'); empty.value = ''; empty.textContent = 'Todas las categorías';
      catEl.appendChild(empty);
      cats.forEach(c => {
        const o = document.createElement('option'); o.value = c; o.textContent = c;
        catEl.appendChild(o);
      });
    }

    // render chips once if container exists
    if (categoryChipsEl() && categoryChipsEl().children.length === 0 && cats.length) {
      renderCategoryChips(cats);
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
    if(stock === 'instock') list = list.filter(p => Number(p.stock || 0) > 0);
    if(stock === 'low') list = list.filter(p => {
      const s = Number(p.stock || 0);
      return s > 0 && s < 5;
    });
    if(stock === 'out') list = list.filter(p => Number(p.stock || 0) === 0);

    const s = sortSelect()?.value;
    if(s === 'price_asc') list.sort((a,b)=> (Number(a.price)||0)-(Number(b.price)||0));
    if(s === 'price_desc') list.sort((a,b)=> (Number(b.price)||0)-(Number(a.price)||0));
    if(s === 'title_asc') list.sort((a,b)=> (a.title||'').localeCompare(b.title||''));

    // update product count
    const countEl = productCountEl();
    if (countEl) countEl.textContent = `${list.length} ${list.length === 1 ? 'producto' : 'productos'} encontrados`;

    // render cards
    container.innerHTML = list.map(productCardHTML).join('');

    // attach detail handlers for the visible buttons (not strictly necessary due to delegated click, but ok)
    container.querySelectorAll('.details-btn').forEach(btn => {
      // avoid duplicate handlers by clearing a possible marker
      if (!btn._hasHandler) {
        btn.addEventListener('click', onDetailsBtnClick);
        btn._hasHandler = true;
      }
    });
  }

  /* details button click handler */
  function onDetailsBtnClick(e){
    e.preventDefault();
    const id = e.currentTarget.dataset.id;
    if (id) openModalById(id);
  }

  /* Accessibility / keyboard: handle Escape */
  function handleEscapeClose(e){
    if (e.key === 'Escape') closeModal();
  }

  /* Open modal (fills content, focuses close button, locks scroll) */
  function openModalById(productId){
    const p = productsCache.find(x => String(x.id) === String(productId));
    if(!p) {
      console.warn('openModalById: producto no encontrado', productId);
      return;
    }

    const m = modal();
    const mImg = modalImg(), mTitle = modalTitle(), mDesc = modalDesc(), mPrice = modalPrice(), mVariants = modalVariants(), mStockEl = modalStock();

    if (mImg) mImg.src = p.image_url && p.image_url.trim() ? p.image_url : DEFAULT_IMG;
    if (mTitle) mTitle.textContent = p.title || '';
    if (mDesc) mDesc.textContent = p.description || '';

    // Price -> goes to modalPrice
    if (mPrice) {
      mPrice.innerHTML = `<div class="modal-price"><div class="amount">${p.price ? 'L. ' + Number(p.price).toFixed(2) : ''}</div><div class="label">Precio</div></div>`;
    }

    // Stock -> goes to modalStock (not modalVariants)
    if (mStockEl) {
      const stock = Number(p.stock || 0);
      if (stock > 0) {
        mStockEl.innerHTML = `<div class="modal-stock in">En stock <strong style="margin-left:8px;">${stock} unidades</strong></div>`;
        mStockEl.classList.remove('out');
      } else {
        mStockEl.innerHTML = `<div class="modal-stock out">Agotado</div>`;
        mStockEl.classList.add('out');
      }
    }

    // Variants: only populate modalVariants if product has variants (sizes/colors)
    if (mVariants) {
      // Clear previous variants
      mVariants.innerHTML = '';

      // Example: if your product object contains sizes/colors arrays, populate selects
      const hasSizes = Array.isArray(p.sizes) && p.sizes.length > 0;
      const hasColors = Array.isArray(p.colors) && p.colors.length > 0;

      if (hasSizes) {
        const label = document.createElement('label');
        label.className = 'option-row';
        label.htmlFor = 'select-talla';
        label.textContent = 'Talla';
        const select = document.createElement('select');
        select.id = 'select-talla';
        select.name = 'size';
        select.style.marginLeft = '8px';
        p.sizes.forEach(s => {
          const o = document.createElement('option'); o.value = s; o.textContent = s;
          select.appendChild(o);
        });
        label.appendChild(select);
        mVariants.appendChild(label);
      }

      if (hasColors) {
        const labelC = document.createElement('label');
        labelC.className = 'option-row';
        labelC.htmlFor = 'select-color';
        labelC.textContent = 'Color';
        const selectC = document.createElement('select');
        selectC.id = 'select-color';
        selectC.name = 'color';
        selectC.style.marginLeft = '8px';
        p.colors.forEach(c => {
          const o = document.createElement('option'); o.value = c; o.textContent = c;
          selectC.appendChild(o);
        });
        labelC.appendChild(selectC);
        mVariants.appendChild(labelC);
      }

      // If no variants, optionally show a small hint (or leave empty)
      if (!hasSizes && !hasColors) {
        // keep empty to avoid layout jump; you could show a note if desired
        // mVariants.innerHTML = `<p class="variant-note">Sin variantes</p>`;
      }
    }

    if (!m) return;

    // store previously focused element
    _previousFocus = document.activeElement;

    // show modal
    m.classList.add('show');
    m.setAttribute('aria-hidden','false');

    // block body scroll
    document.body.style.overflow = 'hidden';

    // reset internal modal scroll & focus close
    const mw = m.querySelector('.modal-window');
    if (mw) {
      mw.scrollTop = 0;
      setTimeout(() => {
        const closeBtn = modalCloseBtn();
        if (closeBtn) closeBtn.focus();
      }, 40);
    }

    // add escape listener
    document.addEventListener('keydown', handleEscapeClose);
  }

  function closeModal(){
    const m = modal();
    if (!m) return;

    document.removeEventListener('keydown', handleEscapeClose);
    m.classList.remove('show');
    m.setAttribute('aria-hidden','true');

    // restore scroll after animation
    setTimeout(()=> {
      document.body.style.overflow = '';
      if (_previousFocus && typeof _previousFocus.focus === 'function') {
        _previousFocus.focus();
      }
    }, 180);
  }

  /* LOAD: obtiene datos desde 'products' y convierte image_url -> publicUrl desde bucket */
  async function loadProducts(){
    console.log('[products] loadProducts start');
    try {
      const { data, error } = await supabase.from('products').select('*');
      if (error) {
        console.error('[products] Error al leer products:', error);
        return;
      }
      console.log('[products] rows recibidas:', data?.length || 0);

      if (!data || data.length === 0) {
        productsCache = [];
        renderList(productsCache);
        console.warn('[products] No hay productos en la tabla products');
        return;
      }

      // Normalize images: convert image_url to publicUrl if stored in bucket
      const normalized = await Promise.all(data.map(async (d) => {
        let imgPath = d.image_url || '';
        if (imgPath) {
          try {
            // getPublicUrl is synchronous in the UMD wrapper returning { data: { publicUrl }, error }
            const { data: pub, error: pubErr } = supabase.storage.from(BUCKET_NAME).getPublicUrl(imgPath);
            if (!pubErr && pub && pub.publicUrl) {
              imgPath = pub.publicUrl;
            }
          } catch(pubErr){
            console.warn('[products] getPublicUrl fallo para', imgPath, pubErr);
          }
        }
        return { ...d, image_url: imgPath || DEFAULT_IMG };
      }));

      productsCache = normalized;
      renderList(productsCache);
      console.log('[products] renderizado OK');
    } catch (err) {
      console.error('[products] Excepción loadProducts:', err);
    }
  }

  // Realtime: suscribirse a la tabla 'products'
  function subscribeRealtime(){
    try {
      const channel = supabase
        .channel('public:products')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, payload => {
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

  /* UI events (delegated) */
  // 1) delegated click handler to make whole card clickable but keep .details-btn behaviour
  document.addEventListener('click', (e) => {
    // if the click was on details button, let its handler run (we attach it in renderList)
    if (e.target.closest('.details-btn')) return;

    // otherwise, if they clicked anywhere inside a product-card, open modal
    const card = e.target.closest('.product-card');
    if (card) {
      const id = card.dataset.id || card.getAttribute('data-id');
      if (id) openModalById(id);
    }
  });

  // 2) keyboard support: Enter opens focused card
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const active = document.activeElement;
      if (active && active.classList && active.classList.contains('product-card')) {
        const id = active.dataset.id || active.getAttribute('data-id');
        if (id) openModalById(id);
      }
    }
  });

  // modal close bindings (if element exists)
  (function attachModalClose(){
    const mClose = modalCloseBtn();
    if (mClose) mClose.addEventListener('click', closeModal);

    // close when clicking backdrop
    const m = modal();
    if (m) {
      const backdrop = m.querySelector('.modal-backdrop');
      if (backdrop) backdrop.addEventListener('click', closeModal);
    }
  })();

  // input/filter bindings
  const si = () => { const el = searchInput(); if (el) el.addEventListener('input', () => renderList(productsCache)); };
  const cf = () => { const el = categoryFilter(); if (el) el.addEventListener('change', () => renderList(productsCache)); };
  const sf = () => { const el = stockFilter(); if (el) el.addEventListener('change', () => renderList(productsCache)); };
  const ss = () => { const el = sortSelect(); if (el) el.addEventListener('change', () => renderList(productsCache)); };

  si(); cf(); sf(); ss();

});
