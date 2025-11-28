import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

/* ========== CONFIG ========== */
const SUPABASE_URL = 'https://rxerfllxwdalduuzndiv.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4ZXJmbGx4d2RhbGR1dXpuZGl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1ODYxNTcsImV4cCI6MjA3OTE2MjE1N30.7l_8QAWd16aL3iHrxrRn1hJiW4MnxlR7HEjIkCEQDTE'
const BUCKET = 'Products'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

/* ========== Utilities ========== */
const $ = (id) => document.getElementById(id)
const toastRoot = $('toast-root')
let Swal = null

// load SweetAlert2 dynamically (non-blocking)
async function loadSwal() {
  try {
    const mod = await import('https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.all.min.js')
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
  requestAnimationFrame(() => el.style.opacity = 1)
  setTimeout(() => {
    el.style.opacity = 0
    setTimeout(() => el.remove(), 300)
  }, timeout)
}

// unified toast: prefer Swal if loaded
function toast(msg, type = 'info', timeout = 3500) {
  if (Swal && Swal.toast) {
    const icon = type === 'danger' ? 'error' : (type === 'success' ? 'success' : (type === 'warning' ? 'warning' : 'info'))
    Swal.toast.fire({ icon, title: msg, timer: timeout })
  } else {
    fallbackToast(msg, type, timeout)
  }
}

// simple escape helper
function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))
}

// Formateo de moneda local (Lempira, Honduras)
function formatCurrency(value) {
  const v = Number(value || 0)
  try {
    return new Intl.NumberFormat('es-HN', {
      style: 'currency',
      currency: 'HNL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
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

/* ---------- APP SHELL reveal bug fix ---------- */
const appShell = document.querySelector('.app-shell')
if (appShell) {
  // Only set aria-hidden if the attribute exists (don't blindly set it)
  if (appShell.hasAttribute('aria-hidden')) {
    appShell.setAttribute('aria-hidden', 'true')
  } else {
    // if it didn't exist, set it for initial hide (so revealApp can remove safely)
    appShell.setAttribute('aria-hidden', 'true')
  }
}
function revealApp() {
  if (!appShell) return
  if (appShell.hasAttribute('aria-hidden')) appShell.removeAttribute('aria-hidden')
}

/* ========== UI Elements (guarded) ========== */
const authArea = $('auth-area')
const signOutBtn = $('sign-out')
const adminNameEl = $('admin-name')
const refreshBtn = $('refresh')
const newProductBtn = $('new-product')
const productListEl = $('product-list')
const searchEl = $('search')
const filterCategoryEl = $('filter-category')

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

/* NEW: toggles and dropzone elements */
const toggleCompactBtn = $('toggle-compact')
const toggleTableBtn = $('toggle-table')
const uploaderDropzone = $('uploader-dropzone')

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

/* ========== Storage helpers ========== */
async function fileExistsInBucket(folderPath, fileName) {
  try {
    const listPath = folderPath.endsWith('/') ? folderPath.slice(0, -1) : folderPath
    const { data, error } = await supabase.storage.from(BUCKET).list(listPath, { limit: 1000 })
    if (error) {
      console.warn('storage.list error', error)
      return false
    }
    return (data || []).some(item => item.name === fileName)
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
    const { data, error } = await supabase.from('admins').select('id, display_name, is_active').eq('id', user.id).single()
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

  if (authArea && user) {
    authArea.innerHTML = `<div class="admin-session">
      Conectado como <strong>${escapeHtml(user.email)}</strong> 
      <button id="sign-out-inline" class="btn-ghost">Salir</button>
    </div>`
  
    const sbtn = $('sign-out-inline')
    if (sbtn) sbtn.addEventListener('click', async () => {
      await supabase.auth.signOut()
      window.location.href = 'login.html'   // ← IMPORTANTE
    })
  }  

  revealApp()
  // restore UI prefs (compact / table) before loading categories/products
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

/* ========== Products CRUD & rendering ========== */
let productsCache = []

async function fetchProducts() {
  try {
    const { data, error } = await supabase.from('products').select('*').order('updated_at', { ascending: false })
    if (error) {
      console.error('fetchProducts error', error)
      toast('Error cargando productos', 'danger')
      return []
    }
    productsCache = data || []
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

function renderProductCard(p) {
  const wrapper = document.createElement('div')
  wrapper.className = 'card'
  wrapper.setAttribute('role', 'article')
  wrapper.setAttribute('aria-label', `Producto ${p.title || ''}`)

  // Construir URL pública preferida (p.image_path tiene prioridad)
  const bucketBase = `https://${SUPABASE_URL.replace('https://','')}/storage/v1/object/public/${BUCKET}`
  let filePath = null

  if (p.image_path && String(p.image_path).trim()) {
    filePath = p.image_path
  } else if (p.sku && p.image_filename) {
    // si guardas filename separado y sku en tabla
    filePath = `products/${p.sku}/${p.image_filename}`
  } else if (p.sku && p.title) {
    // intento heurístico: slug del título + png/jpeg fallback
    const slug = String(p.title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    filePath = `products/${p.sku}/${slug}.png`
  }

  const placeholder = 'https://via.placeholder.com/400x300?text=No+Image'
  const imgUrl = filePath ? `${bucketBase}/${filePath}` : placeholder

  const stockClass = stockBadgeClass(p.stock || 0)
  const safeTitle = escapeHtml(p.title || '')
  const safeSku = escapeHtml(p.sku || '')
  const safeDesc = escapeHtml((p.description || '').slice(0, 120))

  wrapper.innerHTML = `
    <div class="card-media">
      <img src="${imgUrl}" alt="${safeTitle}" loading="lazy"
           onerror="this.onerror=null;this.src='${placeholder}'; this.classList.add('img-broken')">
    </div>
    <div class="card-body">
      <h3 class="card-title">${safeTitle}</h3>
      <div class="muted">SKU: ${safeSku}</div>
      <p class="card-desc">${safeDesc}</p>
      <div class="meta">
        <div><strong>${formatCurrency ? formatCurrency(p.price) : ('$' + Number(p.price||0).toFixed(2))}</strong></div>
        <div class="stock-wrap"><span class="stock-badge ${stockClass}">${p.stock}</span>
          <label class="visually-hidden">Stock de ${safeTitle}</label>
          <input data-id="${p.id}" aria-label="Editar stock ${safeTitle}" class="stock-input" type="number" value="${p.stock || 0}" style="width:80px;margin-left:8px">
        </div>
      </div>
      <div class="card-actions" role="group" aria-label="Acciones producto ${safeTitle}">
        <button data-edit="${p.id}" class="btn-ghost">Editar</button>
        <button data-delete="${p.id}" class="btn-ghost danger">Eliminar</button>
        <button data-history="${p.id}" class="btn-ghost">Historial</button>
      </div>
    </div>
  `
  return wrapper
}

async function refreshProducts() {
  if (productListEl) productListEl.innerHTML = '<div class="loading">Cargando...</div>'
  await fetchProducts()
  const qVal = (searchEl?.value || '').trim().toLowerCase()
  const cat = filterCategoryEl?.value || ''
  if (productListEl) productListEl.innerHTML = ''
  const filtered = (productsCache || []).filter(p => {
    if (cat && (p.category || '') !== cat) return false
    if (!qVal) return true
    return (p.title||'').toLowerCase().includes(qVal) || (p.sku||'').toLowerCase().includes(qVal)
  })
  if (!productListEl) return
  if (filtered.length === 0) {
    productListEl.innerHTML = '<div class="empty-state">No hay productos</div>'
    return
  }
  const fragment = document.createDocumentFragment()
  filtered.forEach(p => fragment.appendChild(renderProductCard(p)))
  productListEl.appendChild(fragment)
}

/* ========== Categories ========== */
async function loadCategories() {
  try {
    const { data, error } = await supabase.from('products').select('category').neq('category', null)
    if (error) { console.warn('loadCategories', error); return }
    const unique = Array.from(new Set((data||[]).map(r => r.category).filter(Boolean)))
    if (filterCategoryEl) filterCategoryEl.innerHTML = `<option value="">Todas las categorías</option>` + unique.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('')
  } catch (err) {
    console.warn('loadCategories unexpected', err)
  }
}

/* ========== Modal controls (accessibility) ========== */
let currentModalProductIndex = -1

function openModal(data = null) {
  if (!modal || !modalOverlay) return
  modal.hidden = false
  modalOverlay.hidden = false
  modal.setAttribute('aria-hidden', 'false')
  modal.focus?.()
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
    if (imgPreview) { imgPreview.hidden = true; imgPreview.src = '' }
    if (previewPlaceholder) previewPlaceholder.hidden = false
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
    imageFilenameField && (imageFilenameField.value = data.image_filename || '')
    imagePathField && (imagePathField.value = data.image_path || '')
    if (data.image_path && imgPreview) {
      imgPreview.src = `https://${SUPABASE_URL.replace('https://','')}/storage/v1/object/public/${BUCKET}/${data.image_path}`
      imgPreview.hidden = false
      if (previewPlaceholder) previewPlaceholder.hidden = true
    } else {
      if (imgPreview) imgPreview.hidden = true
      if (previewPlaceholder) previewPlaceholder.hidden = false
    }

    // set currentModalProductIndex to match productsCache ordering (if present)
    currentModalProductIndex = productsCache.findIndex(x => x.id === data.id)
    setTimeout(() => titleEl && titleEl.focus(), 100)
  }
}

function closeModal() {
  if (!modal || !modalOverlay) return
  modal.hidden = true
  modalOverlay.hidden = true
  modal.setAttribute('aria-hidden', 'true')
}

/* keyboard navigation for modal: Esc closes, ArrowLeft/Right navigate prev/next product when editing */
document.addEventListener('keydown', (e) => {
  if (modal && modal.getAttribute('aria-hidden') === 'false') {
    if (e.key === 'Escape') closeModal()
    else if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && currentModalProductIndex > -1) {
      // navigate only when editing an existing product
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
    if (!f) { if (imgPreview) imgPreview.hidden = true; if (previewPlaceholder) previewPlaceholder.hidden = false; return }
    const url = URL.createObjectURL(f)
    if (imgPreview) { imgPreview.src = url; imgPreview.hidden = false }
    if (previewPlaceholder) previewPlaceholder.hidden = true

    if (imageNameEl && !imageNameEl.value.trim()) {
      const ext = inferExtensionFromFile(f)
      const base = (titleEl && titleEl.value.trim()) || f.name
      imageNameEl.value = slugifyFilename(base + (base.includes('.') ? '' : `.${ext}`))
    }
  })
}

/* ---------- DROPZONE: connect uploader-dropzone to image-file input ---------- */
if (uploaderDropzone && imageFileEl) {
  // helper to set input.files from a File object
  function setInputFileFromFile(file) {
    try {
      const dt = new DataTransfer()
      dt.items.add(file)
      imageFileEl.files = dt.files
      // dispatch change so existing handlers run
      imageFileEl.dispatchEvent(new Event('change', { bubbles: true }))
    } catch (err) {
      // fallback: cannot set files programmatically in some browsers -> inform user
      console.warn('Could not set input.files programmatically', err)
      toast('Selecciona el archivo manualmente (arrastre no soportado por este navegador).', 'warning')
    }
  }

  uploaderDropzone.addEventListener('click', (e) => {
    // open native file picker
    imageFileEl.click()
  })

  // keyboard accessibility: Enter / Space triggers click
  uploaderDropzone.addEventListener('keyup', (e) => {
    if (e.key === 'Enter' || e.key === ' ') imageFileEl.click()
  })

  ;['dragenter','dragover'].forEach(ev => {
    uploaderDropzone.addEventListener(ev, (e) => {
      e.preventDefault(); e.stopPropagation()
      uploaderDropzone.classList.add('dragover')
    })
  })
  ;['dragleave','dragend','drop'].forEach(ev => {
    uploaderDropzone.addEventListener(ev, (e) => {
      e.preventDefault(); e.stopPropagation()
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

function setUploadStatus(text) { if (uploadStatus) uploadStatus.textContent = `Estado: ${text}` }
function resetUploadMessages() {
  if (uploadError) uploadError.hidden = true
  if (uploadSuccess) uploadSuccess.hidden = true
  setUploadStatus('idle')
}
function showUploadError(msg) {
  if (uploadError) { uploadError.hidden = false; uploadError.textContent = msg }
  if (uploadSuccess) uploadSuccess.hidden = true
}
function showUploadSuccess(msg) {
  if (uploadSuccess) { uploadSuccess.hidden = false; uploadSuccess.textContent = msg }
  if (uploadError) uploadError.hidden = true
}

if (startUploadBtn) {
  startUploadBtn.addEventListener('click', async () => {
    resetUploadMessages()
    setUploadStatus('validando')

    const file = imageFileEl && imageFileEl.files && imageFileEl.files[0]
    if (!file) return showUploadError('Selecciona un archivo primero.')

    const allowed = ['image/jpeg','image/png','image/webp']
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
      const { error: uploadErr } = await supabase.storage.from(BUCKET).upload(filePath, file, { cacheControl: '3600', upsert: false })
      if (uploadErr) {
        if (uploadErr.status === 409) {
          const newName = await generateNonCollidingName(folder, finalName)
          const newPath = `${folder}/${newName}`
          const { error: uploadErr2 } = await supabase.storage.from(BUCKET).upload(newPath, file, { cacheControl: '3600', upsert: false })
          if (uploadErr2) throw uploadErr2
          finalName = newName
        } else {
          throw uploadErr
        }
      }

      // get public url (bucket público)
      const finalFilePath = `${folder}/${finalName}`
      const { data: publicData, error: publicErr } = await supabase.storage.from(BUCKET).getPublicUrl(finalFilePath)
      if (publicErr) console.warn('getPublicUrl err', publicErr)

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
    const payload = {
      title: titleEl ? titleEl.value.trim() : null,
      sku: skuEl ? skuEl.value.trim() || null : null,
      category: categoryEl ? categoryEl.value.trim() || null : null,
      description: descriptionEl ? descriptionEl.value.trim() || null : null,
      price: priceEl ? parseFloat(priceEl.value) || 0 : 0,
      stock: stockEl ? parseInt(stockEl.value) || 0 : 0,
      image_filename: imageFilenameField ? imageFilenameField.value || null : null,
      image_path: imagePathField ? imagePathField.value || null : null,
      updated_by: userId
    }

    try {
      if (id) {
        const { error } = await supabase.from('products').update(payload).eq('id', id)
        if (error) throw error
        toast('Producto actualizado', 'success')
      } else {
        payload.created_by = userId
        const { data, error } = await supabase.from('products').insert(payload).select().single()
        if (error) throw error

        // try to call RPC to create initial movement (optional)
        try {
          await supabase.rpc('create_product_with_stock', {
            p_sku: payload.sku,
            p_title: payload.title,
            p_description: payload.description,
            p_category: payload.category,
            p_price: payload.price,
            p_stock: payload.stock,
            p_image_path: payload.image_path,
            p_performed_by: payload.created_by
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
      if (Swal) Swal.fire({ icon: 'error', title: 'Error', text: (err.message || JSON.stringify(err)) })
    } finally {
      if (saveProductBtn) saveProductBtn.disabled = false
    }
  })
}

/* ========== Delete / Edit / Stock inline handlers ========== */
if (productListEl) {
  productListEl.addEventListener('click', async (ev) => {
    const editId = ev.target.dataset?.edit
    const deleteId = ev.target.dataset?.delete
    const histId = ev.target.dataset?.history

    if (editId) {
      const { data, error } = await supabase.from('products').select('*').eq('id', editId).single()
      if (error) { toast('Error cargando producto', 'danger'); return }
      openModal(data)
    } else if (deleteId) {
      // use Swal confirm if available
      if (Swal) {
        const res = await Swal.fire({
          title: '¿Eliminar producto?',
          text: 'Esta acción es irreversible.',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Sí, eliminar',
          cancelButtonText: 'Cancelar',
          reverseButtons: true
        })
        if (!res.isConfirmed) return
      } else {
        if (!confirm('¿Eliminar producto? Esta acción es irreversible.')) return
      }

      try {
        const { error } = await supabase.from('products').delete().eq('id', deleteId)
        if (error) { toast('Error eliminando: ' + error.message, 'danger'); return }
        toast('Producto eliminado', 'success')
        await refreshProducts()
      } catch (err) {
        console.error('delete error', err)
        toast('Error eliminando', 'danger')
      }
    } else if (histId) {
      const { data, error } = await supabase.from('inventory_movements').select('*').eq('product_id', histId).order('created_at', { ascending: false }).limit(50)
      if (error) { toast('Error cargando historial', 'danger'); return }
      // show a minimal modal with history (could be improved)
      if (Swal) {
        const html = (data || []).map(r => `<div style="margin-bottom:8px"><strong>${r.change}</strong> — ${new Date(r.created_at).toLocaleString()} <div class="muted">${escapeHtml(r.note||'')}</div></div>`).join('') || '<div class="muted">No hay movimientos</div>'
        Swal.fire({ title: 'Historial', html, width: 700, icon: 'info' })
      } else {
        console.table(data || [])
        toast('Historial cargado en consola (implementar UI)', 'info')
      }
    }
  })

  /* stock inline change (debounced update by 400ms per input) */
  const pendingStockUpdates = new Map()
  productListEl.addEventListener('input', (ev) => {
    if (!ev.target.classList.contains('stock-input')) return
    const id = ev.target.dataset.id
    const el = ev.target
    // debounce per id
    if (pendingStockUpdates.has(id)) clearTimeout(pendingStockUpdates.get(id).timer)
    const previous = productsCache.find(p => p.id === id)?.stock || 0
    const newValue = parseInt(el.value, 10) || 0
    // temporary visual feedback
    el.disabled = true
    el.setAttribute('aria-busy', 'true')

    const timer = setTimeout(async () => {
      try {
        // try atomic RPC
        const { data, error } = await supabase.rpc('adjust_stock_atomic', {
          p_product_id: id,
          p_change: newValue - previous,
          p_type: 'manual_adjust',
          p_reason: 'Ajuste inline',
          p_performed_by: (await supabase.auth.getUser()).data?.user?.id || null
        })
        if (error) throw error
        toast('Stock actualizado (atomic)', 'success')
      } catch (rpcErr) {
        console.warn('RPC adjust_stock_atomic failed, fallback to update', rpcErr)
        try {
          const { error } = await supabase.from('products').update({ stock: newValue, updated_by: (await supabase.auth.getUser()).data?.user?.id || null }).eq('id', id)
          if (error) throw error
          toast('Stock actualizado', 'success')
        } catch (err) {
          toast('Error actualizando stock: ' + (err.message || JSON.stringify(err)), 'danger')
        }
      } finally {
        el.disabled = false
        el.removeAttribute('aria-busy')
        pendingStockUpdates.delete(id)
        await refreshProducts()
      }
    }, 450)

    pendingStockUpdates.set(id, { timer })
  })
}

/* ========== UI Toggles: compact / table view (persisted) ========== */
function applyCompactMode(enabled) {
  if (!appShell) return
  if (enabled) appShell.classList.add('compact')
  else appShell.classList.remove('compact')
  if (toggleCompactBtn) { toggleCompactBtn.setAttribute('aria-pressed', String(Boolean(enabled))); toggleCompactBtn.classList.toggle('active', Boolean(enabled)) }
  localStorage.setItem('ui_compact', enabled ? '1' : '0')
}

function applyTableView(enabled) {
  if (!productListEl) return
  if (enabled) productListEl.classList.add('table-view')
  else productListEl.classList.remove('table-view')
  if (toggleTableBtn) { toggleTableBtn.setAttribute('aria-pressed', String(Boolean(enabled))); toggleTableBtn.classList.toggle('active', Boolean(enabled)) }
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
if (modalClose) modalClose.addEventListener('click', closeModal)
if (cancelBtn) cancelBtn.addEventListener('click', closeModal)
if (modalOverlay) modalOverlay.addEventListener('click', closeModal)

/* ========== Init ========== */
async function main() {
  await loadSwal() // attempt to load Swal early
  await initAuth()
  if (productListEl) productListEl.innerHTML = '<div class="empty-state">Pulsa "Refrescar" para cargar productos</div>'
}

main().catch(err => {
  console.error('admin main error', err)
  toast('Error crítico arrancando admin', 'danger')
})
