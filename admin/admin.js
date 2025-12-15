import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/* ========== CONFIG ========== */
const SUPABASE_URL = 'https://rxerfllxwdalduuzndiv.supabase.co'
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4ZXJmbGx4d2RhbGR1dXpuZGl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1ODYxNTcsImV4cCI6MjA3OTE2MjE1N30.7l_8QAWd16aL3iHrxrRn1hJiW4MnxlR7HEjIkCEQDTE'
const BUCKET = 'Products'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

/* ========== Utilities ========== */
const $ = (id) => document.getElementById(id)
const toastRoot = $('toast-root')
let Swal = null

// load SweetAlert2 dynamically (non-blocking)
async function loadSwal() {
  try {
    const mod = await import(
      'https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.all.min.js'
    )
    Swal = mod.default || window.Swal || mod
    // configure a default toast mixin
    Swal.toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 1800,
      timerProgressBar: true,
      background: '#0f1724',
      color: '#e6eef5',
    })
  } catch (err) {
    console.warn('SweetAlert2 load failed, falling back to native toast', err)
    Swal = null
  }
}

// fallback toast (simple) if Swal not available
function fallbackToast(msg, type = 'info', timeout = 3500) {
  if (!toastRoot) return
  const el = document.createElement('div')
  el.className = `toast toast-${type}`
  el.textContent = msg
  el.setAttribute('role', 'status')
  toastRoot.appendChild(el)
  requestAnimationFrame(() => (el.style.opacity = 1))
  setTimeout(() => {
    el.style.opacity = 0
    setTimeout(() => el.remove(), 300)
  }, timeout)
}

// unified toast: prefer Swal if loaded
function toast(msg, type = 'info', timeout = 3500) {
  if (Swal && Swal.toast) {
    const icon =
      type === 'danger'
        ? 'error'
        : type === 'success'
          ? 'success'
          : type === 'warning'
            ? 'warning'
            : 'info'
    Swal.toast.fire({ icon, title: msg, timer: timeout })
  } else {
    fallbackToast(msg, type, timeout)
  }
}

// simple escape helper
function escapeHtml(s) {
  return String(s || '').replace(
    /[&<>"']/g,
    (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m])
  )
}

// Formateo de moneda local (Lempira, Honduras)
function formatCurrency(value) {
  const v = Number(value || 0)
  try {
    return new Intl.NumberFormat('es-HN', {
      style: 'currency',
      currency: 'HNL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(v)
  } catch (err) {
    // fallback simple: "L 123.45"
    return `L ${v.toFixed(2)}`
  }
}

// debounce util
function debounce(fn, wait = 300) {
  let t
  return (...args) => {
    clearTimeout(t)
    t = setTimeout(() => fn(...args), wait)
  }
}

/* ===========================
   ✅ image_url helpers
   image_url = PATH dentro del bucket Products (public)
   Ej: "products/SKU123/foto.png"
   =========================== */
function normalizeBucketPath(v) {
  const s = String(v || '').trim()
  if (!s) return ''
  if (/^https?:\/\//i.test(s)) {
    const marker = `/storage/v1/object/public/${BUCKET}/`
    const idx = s.indexOf(marker)
    if (idx !== -1) return s.slice(idx + marker.length).replace(/^\/+/, '')
    return s
  }
  return s.replace(/^\/+/, '')
}

function getPublicUrlFromImageUrl(image_url) {
  const v = String(image_url || '').trim()
  if (!v) return null
  if (/^https?:\/\//i.test(v)) return v
  const clean = normalizeBucketPath(v)
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(clean)
  return data?.publicUrl || null
}

/* ========== UI Elements (guarded) ========== */
const signOutBtn = $('sign-out')
const adminNameEl = $('admin-name')
const refreshBtn = $('refresh')
const newProductBtn = $('new-product')
const productListEl = $('product-list')
const searchEl = $('search')
const filterCategoryEl = $('filter-category')
const filterStatusEl = $('filter-status')
const filterWarehouseEl = $('filter-warehouse')
const filterAlertsEl = $('filter-alerts')
const filterSupplierEl = $('filter-supplier')

/* Modal / form elements */
const modal = $('modal')
const modalOverlay = $('modal-overlay')
const modalTitle = $('modal-title')
const modalClose = $('modal-close')
const productForm = $('product-form')
const cancelBtn = $('cancel')
const productIdEl = $('product-id')
const titleEl = $('title')
const skuEl = $('sku')
const categoryEl = $('category')
const descriptionEl = $('description')
const priceEl = $('price')
const stockEl = $('stock')
const imageNameEl = $('image-name')
const imageFileEl = $('image-file')
const imgPreview = $('img-preview')
const previewPlaceholder = $('preview-placeholder')
const uploadStatus = $('upload-status')
const uploadError = $('upload-error')
const uploadSuccess = $('upload-success')
const autoNameBtn = $('auto-name')
const startUploadBtn = $('start-upload')
const imageFilenameField = $('image-filename')
const imagePathField = $('image-path')
const saveProductBtn = $('save-product')

/* Logistics form fields */
const statusField = $('status')
const priorityField = $('priority')
const supplierField = $('supplier')
const supplierContactField = $('supplier-contact')
const costField = $('cost')
const leadTimeField = $('lead-time')
const warehouseZoneField = $('warehouse-zone')
const binCodeField = $('bin-code')
const reorderPointField = $('reorder-point')
const reorderQtyField = $('reorder-qty')
const incomingUnitsField = $('incoming-units')
const incomingEtaField = $('incoming-eta')
const logisticsNotesField = $('logistics-notes')

/* NEW: toggles and dropzone elements */
const toggleCompactBtn = $('toggle-compact')
const toggleTableBtn = $('toggle-table')
const uploaderDropzone = $('uploader-dropzone')

/* Snapshot + alerts */
const statTotalSkuEl = $('stat-total-skus')
const statTotalUnitsEl = $('stat-total-units')
const statLowStockEl = $('stat-low-stock')
const statInboundEl = $('stat-inbound')
const statStockValueEl = $('stat-stock-value')
const alertsListEl = $('alerts-list')
const alertsEmptyEl = $('alerts-empty')
const alertsCountEl = $('alerts-count')
const inboundListEl = $('inbound-list')
const inboundEmptyEl = $('inbound-empty')
const inboundCountEl = $('inbound-count')

/* Bulk selection */
const bulkToolbarEl = $('bulk-toolbar')
const bulkCountEl = $('bulk-count')
const clearSelectionBtn = $('clear-selection')

const bulkActionButtons = () => Array.from(document.querySelectorAll('[data-bulk-action]'))

const LOGISTICS_DEFAULTS = {
  status: 'activo',
  priority: 'normal',
  supplier: '',
  supplier_contact: '',
  cost: 0,
  lead_time_days: 0,
  warehouse_zone: '',
  bin_code: '',
  reorder_point: 0,
  reorder_qty: 0,
  incoming_units: 0,
  incoming_eta: '',
  logistics_notes: '',
}

const selectedProducts = new Set()
let lastRenderedProducts = []

function toggleSelection(id, checked) {
  if (!id) return
  if (checked) selectedProducts.add(id)
  else selectedProducts.delete(id)
}

function clearSelections() {
  selectedProducts.clear()
  updateBulkToolbar()
  if (!productListEl) return
  productListEl.querySelectorAll('.select-product').forEach((cb) => {
    cb.checked = false
  })
}

function updateBulkToolbar() {
  if (!bulkToolbarEl) return
  const count = selectedProducts.size
  if (count === 0) {
    bulkToolbarEl.hidden = true
  } else {
    bulkToolbarEl.hidden = false
    setText(bulkCountEl, count)
  }
}

/* ========== Filename helpers ========== */
function slugifyFilename(name) {
  const extMatch = name.match(/\.([a-zA-Z0-9]+)$/)
  const ext = extMatch ? extMatch[1].toLowerCase() : ''
  let base = ext ? name.slice(0, name.lastIndexOf('.')) : name
  base = base.normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
  base = base.toLowerCase()
  base = base.replace(/[^a-z0-9 _-]/g, '')
  base = base.replace(/\s+/g, '-')
  base = base.replace(/-+/g, '-')
  base = base.replace(/^[-_]+|[-_]+$/g, '')
  if (!base) base = 'file'
  return ext ? `${base}.${ext}` : base
}

function inferExtensionFromFile(file) {
  const mime = file.type || ''
  if (mime.includes('jpeg')) return 'jpg'
  if (mime.includes('png')) return 'png'
  if (mime.includes('webp')) return 'webp'
  const dot = file.name.lastIndexOf('.')
  if (dot > -1) return file.name.slice(dot + 1).toLowerCase()
  return 'jpg'
}

function toId(value) {
  return value === undefined || value === null ? '' : String(value)
}

function toNumber(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function parseLogisticsMeta(meta) {
  if (!meta) return { ...LOGISTICS_DEFAULTS }
  let source = meta
  if (typeof meta === 'string') {
    try {
      source = JSON.parse(meta)
    } catch {
      source = {}
    }
  }
  return { ...LOGISTICS_DEFAULTS, ...source }
}

function getStatusLabel(status) {
  switch (status) {
    case 'activo':
      return 'Activo'
    case 'agotado':
      return 'Bloqueado'
    case 'mantenimiento':
      return 'Mantenimiento'
    case 'borrador':
      return 'Borrador'
    default:
      return status || 'Sin estado'
  }
}

function getWarehouseLabel(meta) {
  if (!meta) return ''
  const parts = [meta.warehouse_zone, meta.bin_code].filter(Boolean)
  return parts.join(' · ')
}

function formatDateLabel(str) {
  if (!str) return ''
  try {
    const date = new Date(str)
    if (Number.isNaN(date.getTime())) return str
    return date.toLocaleDateString('es-HN', { day: '2-digit', month: 'short' })
  } catch {
    return str
  }
}

function needsReorder(product) {
  const meta = product?.logistics_meta || LOGISTICS_DEFAULTS
  const rop = toNumber(meta.reorder_point)
  if (!rop) return false
  return toNumber(product?.stock) <= rop
}

function hasInbound(product) {
  const meta = product?.logistics_meta || LOGISTICS_DEFAULTS
  return toNumber(meta.incoming_units) > 0
}

/* ========== Storage helpers ========== */
async function fileExistsInBucket(folderPath, fileName) {
  try {
    const listPath = folderPath.endsWith('/') ? folderPath.slice(0, -1) : folderPath
    const { data, error } = await supabase.storage.from(BUCKET).list(listPath, { limit: 1000 })
    if (error) {
      console.warn('storage.list error', error)
      return false
    }
    return (data || []).some((item) => item.name === fileName)
  } catch (err) {
    console.error('fileExistsInBucket err', err)
    return false
  }
}

async function generateNonCollidingName(folderPath, baseName) {
  let candidate = baseName
  let i = 1
  while (await fileExistsInBucket(folderPath, candidate)) {
    const dot = baseName.lastIndexOf('.')
    if (dot === -1) {
      candidate = `${baseName}_${i}`
    } else {
      const namePart = baseName.slice(0, dot)
      const ext = baseName.slice(dot + 1)
      candidate = `${namePart}_${i}.${ext}`
    }
    i++
    if (i > 200) throw new Error('No se pudo generar nombre no colisionante')
  }
  return candidate
}

/* ========== Auth / admin check ========== */
async function getCurrentUserFromSession(session) {
  if (session && session.user) return session.user
  const { data } = await supabase.auth.getUser()
  return data?.user || null
}

async function checkAdmin(user) {
  try {
    if (!user) return false
    const { data, error } = await supabase
      .from('admins')
      .select('id, display_name, is_active')
      .eq('id', user.id)
      .single()
    if (error) {
      console.error('checkAdmin error', error)
      return false
    }
    if (!data || data.is_active === false) return false
    if (adminNameEl) adminNameEl.textContent = data.display_name || user.email || ''
    return true
  } catch (err) {
    console.error('checkAdmin unexpected', err)
    return false
  }
}

async function initAuth() {
  // get session
  const { data: sessionData } = await supabase.auth.getSession()
  const session = sessionData?.session || null
  if (!session) {
    window.location.href = 'login.html'
    return
  }

  const user = await getCurrentUserFromSession(session)
  const ok = await checkAdmin(user)
  if (!ok) {
    await supabase.auth.signOut()
    window.location.href = 'login.html'
    return
  }

  // sign out buttons
  if (signOutBtn) {
    signOutBtn.addEventListener('click', async () => {
      await supabase.auth.signOut()
      window.location.href = 'login.html'
    })
  }

  // reveal app
  revealApp()

  // restore UI prefs
  restoreUiPreferences()
  await loadCategories()
  await refreshProducts()

  // auth state changes
  supabase.auth.onAuthStateChange(async (event, sessionPayload) => {
    const currentUser = await getCurrentUserFromSession(sessionPayload)
    if (!currentUser) {
      window.location.href = 'login.html'
      return
    }
    const stillAdmin = await checkAdmin(currentUser)
    if (!stillAdmin) {
      await supabase.auth.signOut()
      window.location.href = 'login.html'
      return
    }
    await loadCategories()
    await refreshProducts()
  })
}

/* ---------- APP SHELL reveal helper ---------- */
const appShell = document.querySelector('.app-shell')
function revealApp() {
  if (!appShell) return
  if (appShell.hasAttribute('aria-hidden')) appShell.removeAttribute('aria-hidden')
}

/* ========== Products CRUD & rendering ========== */
let productsCache = []

async function fetchProducts() {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('updated_at', { ascending: false })
    if (error) {
      console.error('fetchProducts error', error)
      toast('Error cargando productos: ' + (error.message || 'error'), 'danger')
      return []
    }
    const normalized = (data || []).map((item) => ({
      ...item,
      logistics_meta: parseLogisticsMeta(item.logistics_meta),
    }))
    productsCache = normalized
    return productsCache
  } catch (err) {
    console.error('fetchProducts unexpected', err)
    toast('Error cargando productos', 'danger')
    return []
  }
}

function stockBadgeClass(stock) {
  if (stock === 0) return 'badge-out'
  if (stock > 0 && stock < 5) return 'badge-low'
  return 'badge-ok'
}

/* ✅ FIX: render usa image_url (fuente real) */
function renderProductCard(p) {
  const wrapper = document.createElement('div')
  wrapper.className = 'card'
  wrapper.setAttribute('role', 'article')
  wrapper.setAttribute('aria-label', `Producto ${p.title || ''}`)

  const placeholder = 'https://via.placeholder.com/400x300?text=No+Image'
  const imgUrl = getPublicUrlFromImageUrl(p.image_url) || placeholder

  const stockClass = stockBadgeClass(p.stock || 0)
  const safeTitle = escapeHtml(p.title || '')
  const safeSku = escapeHtml(p.sku || '')
  const safeDesc = escapeHtml((p.description || '').slice(0, 120))
  const meta = p.logistics_meta || LOGISTICS_DEFAULTS
  const statusTag = meta.status ? `<span class="tag status-${escapeHtml(meta.status)}">${escapeHtml(getStatusLabel(meta.status))}</span>` : ''
  const priorityTag = meta.priority && meta.priority !== 'normal' ? `<span class="tag priority-${escapeHtml(meta.priority)}">Prioridad ${escapeHtml(meta.priority)}</span>` : ''
  const warehouseTag = getWarehouseLabel(meta) ? `<span class="tag warehouse">${escapeHtml(getWarehouseLabel(meta))}</span>` : ''
  const leadTag = meta.lead_time_days ? `<span class="tag">Lead ${escapeHtml(String(meta.lead_time_days))}d</span>` : ''
  const reorderChip = needsReorder(p)
    ? `<span class="alert-chip danger">ROP ${escapeHtml(String(meta.reorder_point || 0))}</span>`
    : ''
  const inboundChip = hasInbound(p)
    ? `<span class="alert-chip success">${escapeHtml(String(meta.incoming_units))} en tránsito ${meta.incoming_eta ? `· ${escapeHtml(formatDateLabel(meta.incoming_eta))}` : ''}</span>`
    : ''
  const supplier = meta.supplier ? escapeHtml(meta.supplier) : 'Sin proveedor'
  const costLabel = meta.cost ? formatCurrency(meta.cost) : 'N/D'
  const notes = meta.logistics_notes ? escapeHtml(meta.logistics_notes.slice(0, 120)) : ''
  const isSelected = selectedProducts.has(toId(p.id))

  wrapper.innerHTML = `
    <label class="card-select">
      <input type="checkbox" class="select-product" data-id="${escapeHtml(toId(p.id))}" ${isSelected ? 'checked' : ''}>
      <span>Seleccionar</span>
    </label>
    <div class="card-media">
      <img src="${imgUrl}" alt="${safeTitle}" loading="lazy"
           onerror="this.onerror=null;this.src='${placeholder}'; this.classList.add('img-broken')">
    </div>
    <div class="card-body">
      <h3 class="card-title">${safeTitle}</h3>
      <div class="muted">SKU: ${safeSku}</div>
      <p class="card-desc">${safeDesc}</p>
      <div class="card-logistics">
        ${statusTag}
        ${priorityTag}
        ${warehouseTag}
        ${leadTag}
      </div>
      <div class="card-alerts">
        ${reorderChip}
        ${inboundChip}
      </div>
      <div class="meta">
        <div><strong>${formatCurrency ? formatCurrency(p.price) : '$' + Number(p.price || 0).toFixed(2)}</strong></div>
        <div class="stock-wrap" aria-hidden="false">
          <span class="stock-badge ${stockClass}" aria-label="Stock ${p.stock}">${p.stock}</span>
        </div>
      </div>
      <div class="card-supplier">
        <span>Proveedor: <strong>${supplier}</strong></span>
        <span>Costo: ${costLabel}</span>
      </div>
      ${notes ? `<p class="card-notes">${notes}</p>` : ''}
      <div class="card-actions" role="group" aria-label="Acciones producto ${safeTitle}">
        <button data-edit="${p.id}" class="btn-ghost" type="button">Editar</button>
        <button data-delete="${p.id}" class="btn-ghost danger" type="button">Eliminar</button>
      </div>
    </div>
  `
  return wrapper
}

async function refreshProducts() {
  if (productListEl) productListEl.innerHTML = '<div class="loading">Cargando...</div>'
  await fetchProducts()
  updateInventorySnapshot(productsCache)
  updateAlertsPanel(productsCache)
  updateInboundPanel(productsCache)
  populateCategoryOptions(productsCache)
  updateDynamicFilters(productsCache)

  if (productListEl) productListEl.innerHTML = ''
  const filtered = filterProducts(productsCache || [])
  lastRenderedProducts = filtered
  if (!productListEl) return
  if (filtered.length === 0) {
    productListEl.innerHTML = '<div class="empty-state">No hay productos</div>'
    updateBulkToolbar()
    return
  }
  const fragment = document.createDocumentFragment()
  filtered.forEach((p) => fragment.appendChild(renderProductCard(p)))
  productListEl.appendChild(fragment)
  updateBulkToolbar()
}

function filterProducts(list) {
  const qVal = (searchEl?.value || '').trim().toLowerCase()
  const cat = filterCategoryEl?.value || ''
  const statusVal = filterStatusEl?.value || ''
  const warehouseVal = filterWarehouseEl?.value || ''
  const alertsVal = filterAlertsEl?.value || ''
  const supplierVal = (filterSupplierEl?.value || '').trim().toLowerCase()

  return (list || []).filter((p) => {
    if (cat && (p.category || '') !== cat) return false
    if (statusVal && (p.logistics_meta?.status || '') !== statusVal) return false
    if (warehouseVal && (p.logistics_meta?.warehouse_zone || '') !== warehouseVal) return false
    if (alertsVal === 'low' && !needsReorder(p)) return false
    if (alertsVal === 'inbound' && !hasInbound(p)) return false
    if (supplierVal) {
      const supplier = (p.logistics_meta?.supplier || '').toLowerCase()
      if (!supplier.includes(supplierVal)) return false
    }
    if (qVal) {
      const matchesTitle = (p.title || '').toLowerCase().includes(qVal)
      const matchesSku = (p.sku || '').toLowerCase().includes(qVal)
      if (!matchesTitle && !matchesSku) return false
    }
    return true
  })
}

function setText(el, text) {
  if (el) el.textContent = text
}

function updateInventorySnapshot(list) {
  const totalSku = list.length
  const totalUnits = list.reduce((acc, item) => acc + toNumber(item.stock), 0)
  const lowStock = list.filter((item) => needsReorder(item)).length
  const inboundUnits = list.reduce(
    (acc, item) => acc + toNumber(item.logistics_meta?.incoming_units),
    0
  )
  const stockValue = list.reduce(
    (acc, item) => acc + toNumber(item.price) * toNumber(item.stock),
    0
  )
  setText(statTotalSkuEl, totalSku)
  setText(statTotalUnitsEl, totalUnits)
  setText(statLowStockEl, lowStock)
  setText(statInboundEl, inboundUnits)
  setText(statStockValueEl, formatCurrency ? formatCurrency(stockValue) : `L ${stockValue}`)
}

function updateAlertsPanel(list) {
  if (!alertsListEl || !alertsEmptyEl) return
  alertsListEl.innerHTML = ''
  const alerts = list.filter((item) => needsReorder(item) || item.logistics_meta?.status === 'agotado')
  setText(alertsCountEl, alerts.length)
  if (!alerts.length) {
    alertsEmptyEl.hidden = false
    return
  }
  alertsEmptyEl.hidden = true
  alerts.forEach((item) => {
    const meta = item.logistics_meta || LOGISTICS_DEFAULTS
    const li = document.createElement('li')
    li.className = 'panel-item'
    li.innerHTML = `
      <strong>${escapeHtml(item.title || '')}</strong>
      <div class="meta">
        <span>Stock: ${toNumber(item.stock)}</span>
        <span>ROP: ${meta.reorder_point || 0}</span>
      </div>
    `
    alertsListEl.appendChild(li)
  })
}

function updateInboundPanel(list) {
  if (!inboundListEl || !inboundEmptyEl) return
  inboundListEl.innerHTML = ''
  const inbound = list.filter((item) => hasInbound(item))
  setText(inboundCountEl, inbound.length)
  if (!inbound.length) {
    inboundEmptyEl.hidden = false
    return
  }
  inboundEmptyEl.hidden = true
  inbound.forEach((item) => {
    const meta = item.logistics_meta || LOGISTICS_DEFAULTS
    const li = document.createElement('li')
    li.className = 'panel-item'
    li.innerHTML = `
      <strong>${escapeHtml(item.title || '')}</strong>
      <div>Cantidad en tránsito: ${escapeHtml(String(meta.incoming_units || 0))}</div>
      <div class="meta">
        <span>Proveedor: ${escapeHtml(meta.supplier || 'N/D')}</span>
        <span>ETA: ${escapeHtml(formatDateLabel(meta.incoming_eta) || 'Pendiente')}</span>
      </div>
    `
    inboundListEl.appendChild(li)
  })
}

/* ========== Categories ========== */
async function loadCategories() {
  try {
    if (productsCache.length) {
      populateCategoryOptions(productsCache)
      return
    }
    const { data, error } = await supabase.from('products').select('category').neq('category', null)
    if (error) {
      console.warn('loadCategories', error)
      return
    }
    const list = (data || []).map((r) => ({ category: r.category }))
    populateCategoryOptions(list)
  } catch (err) {
    console.warn('loadCategories unexpected', err)
  }
}

function populateCategoryOptions(list) {
  if (!filterCategoryEl) return
  const previous = filterCategoryEl.value
  const unique = Array.from(new Set((list || []).map((r) => r.category).filter(Boolean)))
  let html = `<option value="">Todas las categorías</option>`
  unique.forEach((c) => {
    html += `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`
  })
  filterCategoryEl.innerHTML = html
  if (previous && unique.includes(previous)) filterCategoryEl.value = previous
}

function populateSelectFromValues(selectEl, values, placeholder) {
  if (!selectEl) return
  const prev = selectEl.value
  let html = `<option value="">${placeholder}</option>`
  values.forEach((val) => {
    html += `<option value="${escapeHtml(val)}">${escapeHtml(val)}</option>`
  })
  selectEl.innerHTML = html
  if (prev && values.includes(prev)) selectEl.value = prev
}

function updateDynamicFilters(list) {
  const statuses = Array.from(
    new Set(
      (list || [])
        .map((p) => (p.logistics_meta && p.logistics_meta.status) || '')
        .filter(Boolean)
    )
  )
  const warehouses = Array.from(
    new Set(
      (list || [])
        .map((p) => p.logistics_meta?.warehouse_zone)
        .filter(Boolean)
    )
  )
  populateSelectFromValues(filterStatusEl, statuses, 'Todos')
  populateSelectFromValues(filterWarehouseEl, warehouses, 'Todas')
}

/* ========== Modal controls (accessibility) ========== */
let currentModalProductIndex = -1

function fillLogisticsFields(meta = LOGISTICS_DEFAULTS) {
  const data = { ...LOGISTICS_DEFAULTS, ...(meta || {}) }
  if (statusField) statusField.value = data.status || 'activo'
  if (priorityField) priorityField.value = data.priority || 'normal'
  if (supplierField) supplierField.value = data.supplier || ''
  if (supplierContactField) supplierContactField.value = data.supplier_contact || ''
  if (costField) costField.value = data.cost || ''
  if (leadTimeField) leadTimeField.value = data.lead_time_days || ''
  if (warehouseZoneField) warehouseZoneField.value = data.warehouse_zone || ''
  if (binCodeField) binCodeField.value = data.bin_code || ''
  if (reorderPointField) reorderPointField.value = data.reorder_point || ''
  if (reorderQtyField) reorderQtyField.value = data.reorder_qty || ''
  if (incomingUnitsField) incomingUnitsField.value = data.incoming_units || ''
  if (incomingEtaField) incomingEtaField.value = data.incoming_eta || ''
  if (logisticsNotesField) logisticsNotesField.value = data.logistics_notes || ''
}

function collectLogisticsMeta() {
  return {
    status: statusField ? statusField.value : LOGISTICS_DEFAULTS.status,
    priority: priorityField ? priorityField.value : LOGISTICS_DEFAULTS.priority,
    supplier: supplierField ? supplierField.value.trim() : '',
    supplier_contact: supplierContactField ? supplierContactField.value.trim() : '',
    cost: costField ? toNumber(costField.value) : 0,
    lead_time_days: leadTimeField ? toNumber(leadTimeField.value) : 0,
    warehouse_zone: warehouseZoneField ? warehouseZoneField.value.trim() : '',
    bin_code: binCodeField ? binCodeField.value.trim() : '',
    reorder_point: reorderPointField ? toNumber(reorderPointField.value) : 0,
    reorder_qty: reorderQtyField ? toNumber(reorderQtyField.value) : 0,
    incoming_units: incomingUnitsField ? toNumber(incomingUnitsField.value) : 0,
    incoming_eta: incomingEtaField ? incomingEtaField.value : '',
    logistics_notes: logisticsNotesField ? logisticsNotesField.value.trim() : '',
  }
}

function openModal(data = null) {
  if (!modal || !modalOverlay) return
  modal.hidden = false
  modalOverlay.hidden = false
  modal.setAttribute('aria-hidden', 'false')
  // hide main app for AT / focus trap
  if (appShell) appShell.setAttribute('aria-hidden', 'true')

  if (!data) {
    modalTitle && (modalTitle.textContent = 'Nuevo producto')
    productIdEl && (productIdEl.value = '')
    titleEl && (titleEl.value = '')
    skuEl && (skuEl.value = '')
    categoryEl && (categoryEl.value = '')
    descriptionEl && (descriptionEl.value = '')
    priceEl && (priceEl.value = '')
    stockEl && (stockEl.value = 0)
    imageNameEl && (imageNameEl.value = '')
    imageFileEl && (imageFileEl.value = '')
    imageFilenameField && (imageFilenameField.value = '')
    imagePathField && (imagePathField.value = '')
    if (imgPreview) {
      imgPreview.hidden = true
      imgPreview.src = ''
    }
    if (previewPlaceholder) previewPlaceholder.hidden = false
    fillLogisticsFields(LOGISTICS_DEFAULTS)
    currentModalProductIndex = -1
    setTimeout(() => titleEl && titleEl.focus(), 100)
  } else {
    modalTitle && (modalTitle.textContent = 'Editar producto')
    productIdEl && (productIdEl.value = data.id)
    titleEl && (titleEl.value = data.title || '')
    skuEl && (skuEl.value = data.sku || '')
    categoryEl && (categoryEl.value = data.category || '')
    descriptionEl && (descriptionEl.value = data.description || '')
    priceEl && (priceEl.value = data.price || 0)
    stockEl && (stockEl.value = data.stock || 0)

    // mantenemos estos campos por compatibilidad, pero la fuente real es image_url:
    imageFilenameField && (imageFilenameField.value = data.image_filename || '')
    imagePathField && (imagePathField.value = data.image_path || '')

    // ✅ preview desde image_url
    const previewUrl = getPublicUrlFromImageUrl(data.image_url)
    if (previewUrl && imgPreview) {
      imgPreview.src = previewUrl
      imgPreview.hidden = false
      if (previewPlaceholder) previewPlaceholder.hidden = true
    } else {
      if (imgPreview) imgPreview.hidden = true
      if (previewPlaceholder) previewPlaceholder.hidden = false
    }
    fillLogisticsFields(parseLogisticsMeta(data.logistics_meta))

    currentModalProductIndex = productsCache.findIndex((x) => x.id === data.id)
    setTimeout(() => titleEl && titleEl.focus(), 100)
  }
}

function closeModal() {
  if (!modal || !modalOverlay) return
  modal.hidden = true
  modalOverlay.hidden = true
  modal.setAttribute('aria-hidden', 'true')
  if (appShell) appShell.removeAttribute('aria-hidden')
}

/* keyboard navigation for modal */
document.addEventListener('keydown', (e) => {
  if (modal && modal.getAttribute('aria-hidden') === 'false') {
    if (e.key === 'Escape') closeModal()
    else if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && currentModalProductIndex > -1) {
      const dir = e.key === 'ArrowLeft' ? -1 : 1
      let idx = currentModalProductIndex + dir
      if (idx < 0) idx = productsCache.length - 1
      if (idx >= productsCache.length) idx = 0
      const next = productsCache[idx]
      if (next) openModal(next)
    }
  }
})

/* ========== Uploader integrated (guarded) ========== */
if (imageFileEl) {
  imageFileEl.addEventListener('change', () => {
    resetUploadMessages()
    const f = imageFileEl.files && imageFileEl.files[0]
    if (!f) {
      if (imgPreview) imgPreview.hidden = true
      if (previewPlaceholder) previewPlaceholder.hidden = false
      return
    }
    const url = URL.createObjectURL(f)
    if (imgPreview) {
      imgPreview.src = url
      imgPreview.hidden = false
    }
    if (previewPlaceholder) previewPlaceholder.hidden = true

    if (imageNameEl && !imageNameEl.value.trim()) {
      const ext = inferExtensionFromFile(f)
      const base = (titleEl && titleEl.value.trim()) || f.name
      imageNameEl.value = slugifyFilename(base + (base.includes('.') ? '' : `.${ext}`))
    }
  })
}

/* ---------- DROPZONE ---------- */
if (uploaderDropzone && imageFileEl) {
  function setInputFileFromFile(file) {
    try {
      const dt = new DataTransfer()
      dt.items.add(file)
      imageFileEl.files = dt.files
      imageFileEl.dispatchEvent(new Event('change', { bubbles: true }))
    } catch (err) {
      console.warn('Could not set input.files programmatically', err)
      toast('Selecciona el archivo manualmente (arrastre no soportado por este navegador).', 'warning')
    }
  }

  uploaderDropzone.addEventListener('click', () => imageFileEl.click())

  uploaderDropzone.addEventListener('keyup', (e) => {
    if (e.key === 'Enter' || e.key === ' ') imageFileEl.click()
  })

  ;['dragenter', 'dragover'].forEach((ev) => {
    uploaderDropzone.addEventListener(ev, (e) => {
      e.preventDefault()
      e.stopPropagation()
      uploaderDropzone.classList.add('dragover')
    })
  })
  ;['dragleave', 'dragend', 'drop'].forEach((ev) => {
    uploaderDropzone.addEventListener(ev, (e) => {
      e.preventDefault()
      e.stopPropagation()
      uploaderDropzone.classList.remove('dragover')
    })
  })

  uploaderDropzone.addEventListener('drop', (e) => {
    const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]
    if (f) setInputFileFromFile(f)
  })
}

if (autoNameBtn) {
  autoNameBtn.addEventListener('click', () => {
    const base = (titleEl && titleEl.value.trim()) || (skuEl && skuEl.value.trim()) || 'producto'
    const ext = imageFileEl && imageFileEl.files[0] ? inferExtensionFromFile(imageFileEl.files[0]) : 'png'
    if (imageNameEl) imageNameEl.value = slugifyFilename(`${base}.${ext}`)
    toast('Nombre sugerido', 'info')
  })
}

if (imageNameEl) {
  imageNameEl.addEventListener('input', () => {
    const raw = imageNameEl.value.trim()
    if (!raw) return
    const normalized = slugifyFilename(raw)
    if (normalized !== raw) imageNameEl.value = normalized
  })
}

function setUploadStatus(text) {
  if (uploadStatus) uploadStatus.textContent = `Estado: ${text}`
}
function resetUploadMessages() {
  if (uploadError) uploadError.hidden = true
  if (uploadSuccess) uploadSuccess.hidden = true
  setUploadStatus('idle')
}
function showUploadError(msg) {
  if (uploadError) {
    uploadError.hidden = false
    uploadError.textContent = msg
  }
  if (uploadSuccess) uploadSuccess.hidden = true
}
function showUploadSuccess(msg) {
  if (uploadSuccess) {
    uploadSuccess.hidden = false
    uploadSuccess.textContent = msg
  }
  if (uploadError) uploadError.hidden = true
}

if (startUploadBtn) {
  startUploadBtn.addEventListener('click', async () => {
    resetUploadMessages()
    setUploadStatus('validando')

    const file = imageFileEl && imageFileEl.files && imageFileEl.files[0]
    if (!file) return showUploadError('Selecciona un archivo primero.')

    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) return showUploadError('Tipo no permitido. Usa JPG, PNG o WEBP.')
    const maxMB = 5
    if (file.size > maxMB * 1024 * 1024) return showUploadError(`Archivo demasiado grande. Máx ${maxMB} MB.`)

    // prepare filename
    let filename = imageNameEl && imageNameEl.value.trim()
    if (!filename) {
      const ext = inferExtensionFromFile(file)
      filename = slugifyFilename(`${(titleEl && titleEl.value.trim()) || 'file'}.${ext}`)
      if (imageNameEl) imageNameEl.value = filename
    } else {
      filename = slugifyFilename(filename)
      if (imageNameEl) imageNameEl.value = filename
    }

    const dot = filename.lastIndexOf('.')
    if (dot === -1) {
      const ext = inferExtensionFromFile(file)
      filename = `${filename}.${ext}`
      if (imageNameEl) imageNameEl.value = filename
    }

    const sku = skuEl ? skuEl.value.trim() : ''
    const folder = sku ? `products/${sku}` : `products/temp`
    setUploadStatus('comprobando colisiones')

    let finalName = filename
    try {
      const exists = await fileExistsInBucket(folder, finalName)
      if (exists) {
        finalName = await generateNonCollidingName(folder, filename)
        showUploadSuccess(`Nombre ya existía. Usando: ${finalName}`)
      }
    } catch (err) {
      console.warn('Error comprobando colisión', err)
    }

    const filePath = `${folder}/${finalName}`
    setUploadStatus('subiendo')
    startUploadBtn.disabled = true
    if (autoNameBtn) autoNameBtn.disabled = true

    try {
      const { error: uploadErr } = await supabase.storage
        .from(BUCKET)
        .upload(filePath, file, { cacheControl: '3600', upsert: false })

      if (uploadErr) {
        if (uploadErr.status === 409) {
          const newName = await generateNonCollidingName(folder, finalName)
          const newPath = `${folder}/${newName}`
          const { error: uploadErr2 } = await supabase.storage
            .from(BUCKET)
            .upload(newPath, file, { cacheControl: '3600', upsert: false })
          if (uploadErr2) throw uploadErr2
          finalName = newName
        } else {
          throw uploadErr
        }
      }

      // ✅ image_url = path dentro del bucket (fuente real)
      const finalFilePath = `${folder}/${finalName}`

      // Public URL solo para preview (bucket público)
      const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(finalFilePath)

      if (imageFilenameField) imageFilenameField.value = finalName
      if (imagePathField) imagePathField.value = finalFilePath

      if (publicData?.publicUrl && imgPreview) {
        imgPreview.src = publicData.publicUrl
        imgPreview.hidden = false
        if (previewPlaceholder) previewPlaceholder.hidden = true
      }

      setUploadStatus('completado')
      showUploadSuccess(`Imagen subida: ${finalName}`)
      toast('Imagen subida', 'success', 1600)
    } catch (err) {
      console.error('upload error', err)
      showUploadError('Error al subir: ' + (err.message || JSON.stringify(err)))
      setUploadStatus('error')
      toast('Error subiendo imagen', 'danger')
    } finally {
      startUploadBtn.disabled = false
      if (autoNameBtn) autoNameBtn.disabled = false
    }
  })
}

/* ========== Save product (insert/update) ========== */
if (productForm) {
  productForm.addEventListener('submit', async (ev) => {
    ev.preventDefault()
    if (saveProductBtn) saveProductBtn.disabled = true
    const id = productIdEl ? productIdEl.value || null : null
    const userId = (await supabase.auth.getUser()).data?.user?.id || null

    const imagePath = imagePathField ? (imagePathField.value || null) : null

    const payload = {
      title: titleEl ? titleEl.value.trim() : null,
      sku: skuEl ? skuEl.value.trim() || null : null,
      category: categoryEl ? categoryEl.value.trim() || null : null,
      description: descriptionEl ? descriptionEl.value.trim() || null : null,
      price: priceEl ? parseFloat(priceEl.value) || 0 : 0,
      stock: stockEl ? parseInt(stockEl.value) || 0 : 0,

      // ✅ fuente real:
      image_url: imagePath ? normalizeBucketPath(imagePath) : null,

      // compat:
      image_filename: imageFilenameField ? imageFilenameField.value || null : null,
      image_path: imagePath ? normalizeBucketPath(imagePath) : null,

      updated_by: userId,
      logistics_meta: collectLogisticsMeta(),
    }

    try {
      if (id) {
        const { error } = await supabase.from('products').update(payload).eq('id', id)
        if (error) throw error
        toast('Producto actualizado', 'success')
      } else {
        payload.created_by = userId
        const { error } = await supabase.from('products').insert(payload).select().single()
        if (error) throw error

        try {
          await supabase.rpc('create_product_with_stock', {
            p_sku: payload.sku,
            p_title: payload.title,
            p_description: payload.description,
            p_category: payload.category,
            p_price: payload.price,
            p_stock: payload.stock,
            p_image_path: payload.image_url,
            p_performed_by: payload.created_by,
          })
        } catch (rpcErr) {
          console.warn('RPC create_product_with_stock failed (ignored):', rpcErr)
        }

        toast('Producto creado', 'success')
      }
      await loadCategories()
      await refreshProducts()
      closeModal()
    } catch (err) {
      console.error('save product error', err)
      toast('Error guardando producto: ' + (err.message || JSON.stringify(err)), 'danger')
      if (Swal) Swal.fire({ icon: 'error', title: 'Error', text: err.message || JSON.stringify(err) })
    } finally {
      if (saveProductBtn) saveProductBtn.disabled = false
    }
  })
}

/* ========== Delete / Edit handlers ========== */
if (productListEl) {
  productListEl.addEventListener('click', async (ev) => {
    const editId = ev.target.dataset?.edit
    const deleteId = ev.target.dataset?.delete

    if (editId) {
      const { data, error } = await supabase.from('products').select('*').eq('id', editId).single()
      if (error) {
        toast('Error cargando producto: ' + error.message, 'danger')
        return
      }
      openModal(data)
    } else if (deleteId) {
      if (Swal) {
        const res = await Swal.fire({
          title: '¿Eliminar producto?',
          text: 'Esta acción es irreversible.',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Sí, eliminar',
          cancelButtonText: 'Cancelar',
          reverseButtons: true,
        })
        if (!res.isConfirmed) return
      } else {
        if (!confirm('¿Eliminar producto? Esta acción es irreversible.')) return
      }

      try {
        const { error } = await supabase.from('products').delete().eq('id', deleteId)
        if (error) {
          toast('Error eliminando: ' + error.message, 'danger')
          return
        }
        selectedProducts.delete(toId(deleteId))
        toast('Producto eliminado', 'success')
        await refreshProducts()
      } catch (err) {
        console.error('delete error', err)
        toast('Error eliminando', 'danger')
      }
    }
  })
}

/* ========== UI Toggles: compact / table view (persisted) ========== */
function applyCompactMode(enabled) {
  if (!appShell) return
  if (enabled) appShell.classList.add('compact')
  else appShell.classList.remove('compact')
  if (toggleCompactBtn) {
    toggleCompactBtn.setAttribute('aria-pressed', String(Boolean(enabled)))
    toggleCompactBtn.classList.toggle('active', Boolean(enabled))
  }
  localStorage.setItem('ui_compact', enabled ? '1' : '0')
}

function applyTableView(enabled) {
  if (!productListEl) return
  if (enabled) productListEl.classList.add('table-view')
  else productListEl.classList.remove('table-view')
  if (toggleTableBtn) {
    toggleTableBtn.setAttribute('aria-pressed', String(Boolean(enabled)))
    toggleTableBtn.classList.toggle('active', Boolean(enabled))
  }
  localStorage.setItem('ui_table', enabled ? '1' : '0')
}

function restoreUiPreferences() {
  try {
    const compact = localStorage.getItem('ui_compact') === '1'
    const table = localStorage.getItem('ui_table') === '1'
    applyCompactMode(compact)
    applyTableView(table)
  } catch (err) {
    console.warn('restoreUiPreferences failed', err)
  }
}

if (toggleCompactBtn) {
  toggleCompactBtn.addEventListener('click', () => {
    const isOn = toggleCompactBtn.getAttribute('aria-pressed') === 'true'
    applyCompactMode(!isOn)
  })
}
if (toggleTableBtn) {
  toggleTableBtn.addEventListener('click', () => {
    const isOn = toggleTableBtn.getAttribute('aria-pressed') === 'true'
    applyTableView(!isOn)
  })
}

/* ========== Misc UI handlers ========== */
if (newProductBtn) newProductBtn.addEventListener('click', () => openModal())
if (refreshBtn) refreshBtn.addEventListener('click', refreshProducts)
if (searchEl) searchEl.addEventListener('input', debounce(() => refreshProducts(), 300))
if (filterCategoryEl) filterCategoryEl.addEventListener('change', () => refreshProducts())
if (filterStatusEl) filterStatusEl.addEventListener('change', () => refreshProducts())
if (filterWarehouseEl) filterWarehouseEl.addEventListener('change', () => refreshProducts())
if (filterAlertsEl) filterAlertsEl.addEventListener('change', () => refreshProducts())
if (filterSupplierEl) filterSupplierEl.addEventListener('input', debounce(() => refreshProducts(), 300))
if (modalClose) modalClose.addEventListener('click', closeModal)
if (cancelBtn) cancelBtn.addEventListener('click', closeModal)
if (modalOverlay) modalOverlay.addEventListener('click', closeModal)
if (productListEl) {
  productListEl.addEventListener('change', (ev) => {
    const input = ev.target
    if (input && input.classList && input.classList.contains('select-product')) {
      toggleSelection(toId(input.dataset.id), input.checked)
      updateBulkToolbar()
    }
  })
}
if (clearSelectionBtn) clearSelectionBtn.addEventListener('click', () => clearSelections())
bulkActionButtons().forEach((btn) => {
  btn.addEventListener('click', () => handleBulkAction(btn.dataset.bulkAction))
})

async function handleBulkAction(action) {
  if (!action) return
  if (!selectedProducts.size && action !== 'export') {
    toast('Selecciona productos primero', 'info')
    return
  }
  try {
    if (action === 'mark-active') {
      await bulkUpdateStatus('activo')
      toast('Estados actualizados', 'success')
    } else if (action === 'mark-hold') {
      await bulkUpdateStatus('mantenimiento')
      toast('Productos pausados', 'success')
    } else if (action === 'restock') {
      await bulkRestock()
    } else if (action === 'receive') {
      await bulkReceiveShipments()
    } else if (action === 'export') {
      exportSelectionToCsv()
      return
    }
    if (action !== 'export') {
      clearSelections()
      await refreshProducts()
    }
  } catch (err) {
    console.error('bulk action error', err)
    toast('Error en acción masiva: ' + (err.message || 'Error'), 'danger')
  }
}

async function bulkUpdateStatus(newStatus) {
  const ids = Array.from(selectedProducts)
  for (const id of ids) {
    const product = productsCache.find((p) => toId(p.id) === id)
    if (!product) continue
    const updatedMeta = { ...product.logistics_meta, status: newStatus }
    const { error } = await supabase.from('products').update({ logistics_meta: updatedMeta }).eq('id', id)
    if (error) throw error
  }
}

async function bulkRestock() {
  const ids = Array.from(selectedProducts)
  if (!ids.length) {
    toast('Selecciona productos para reponer', 'info')
    return
  }
  let manualQuantity = null
  if (Swal) {
    const result = await Swal.fire({
      title: 'Reposición',
      text: 'Ingresa la cantidad final de stock (opcional). Si lo dejas vacío se usará el lote de reposición.',
      input: 'number',
      inputAttributes: { min: 0 },
      showCancelButton: true,
      confirmButtonText: 'Actualizar',
      cancelButtonText: 'Cancelar',
    })
    if (result.isDismissed) return
    manualQuantity = result.value ? Number(result.value) : null
  }

  for (const id of ids) {
    const product = productsCache.find((p) => toId(p.id) === id)
    if (!product) continue
    const meta = { ...product.logistics_meta }
    const fallbackTarget = toNumber(meta.reorder_qty) || toNumber(meta.reorder_point) || toNumber(product.stock)
    const target = manualQuantity || fallbackTarget
    if (!target && target !== 0) continue
    meta.incoming_units = 0
    meta.incoming_eta = ''
    const { error } = await supabase
      .from('products')
      .update({ stock: target, logistics_meta: meta })
      .eq('id', id)
    if (error) throw error
  }
  toast('Stock actualizado', 'success')
}

async function bulkReceiveShipments() {
  const ids = Array.from(selectedProducts)
  if (!ids.length) {
    toast('Selecciona productos', 'info')
    return
  }
  for (const id of ids) {
    const product = productsCache.find((p) => toId(p.id) === id)
    if (!product) continue
    const meta = { ...product.logistics_meta }
    const incoming = toNumber(meta.incoming_units)
    if (!incoming) continue
    const newStock = toNumber(product.stock) + incoming
    meta.incoming_units = 0
    meta.incoming_eta = ''
    const { error } = await supabase
      .from('products')
      .update({ stock: newStock, logistics_meta: meta })
      .eq('id', id)
    if (error) throw error
  }
  toast('Se registraron las entradas', 'success')
}

function exportSelectionToCsv() {
  const source = selectedProducts.size
    ? lastRenderedProducts.filter((p) => selectedProducts.has(toId(p.id)))
    : lastRenderedProducts
  if (!source.length) {
    toast('No hay productos para exportar', 'info')
    return
  }
  const headers = [
    'ID',
    'Título',
    'SKU',
    'Categoría',
    'Precio',
    'Stock',
    'Estado',
    'Proveedor',
    'Bodega',
    'ROP',
    'Lote',
    'Ingreso_en_transito',
    'ETA',
    'LeadTime',
    'Costo',
    'Notas',
  ]
  const rows = source.map((item) => {
    const meta = item.logistics_meta || LOGISTICS_DEFAULTS
    return [
      toId(item.id),
      item.title || '',
      item.sku || '',
      item.category || '',
      toNumber(item.price),
      toNumber(item.stock),
      meta.status || '',
      meta.supplier || '',
      getWarehouseLabel(meta),
      meta.reorder_point || 0,
      meta.reorder_qty || 0,
      meta.incoming_units || 0,
      meta.incoming_eta || '',
      meta.lead_time_days || 0,
      meta.cost || 0,
      meta.logistics_notes || '',
    ]
  })
  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `productos-${Date.now()}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/* ========== Init ========== */
async function main() {
  await loadSwal()
  await initAuth()
}

main().catch((err) => {
  console.error('admin main error', err)
  toast('Error crítico arrancando admin', 'danger')
})
