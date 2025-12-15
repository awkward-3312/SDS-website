// login.js
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

// === CONFIG: usa tus claves ===
const SUPABASE_URL = 'https://rxerfllxwdalduuzndiv.supabase.co'
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4ZXJmbGx4d2RhbGR1dXpuZGl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1ODYxNTcsImV4cCI6MjA3OTE2MjE1N30.7l_8QAWd16aL3iHrxrRn1hJiW4MnxlR7HEjIkCEQDTE'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// === DOM ===
const form = document.getElementById('login-form')
const username = document.getElementById('username')
const password = document.getElementById('password')
const btnSignin = document.getElementById('btn-signin')
const statusEl = document.getElementById('status')

// ✅ Blindaje: si algo truena, el form NO debe recargar ni navegar
if (form) {
  form.addEventListener('submit', (ev) => ev.preventDefault())
} else {
  console.error('No se encontró #login-form. Revisa el HTML.')
}

// === Helpers ===
function setStatus(msg, type = 'info') {
  if (!statusEl) return
  statusEl.textContent = msg
  if (type === 'error') statusEl.style.color = '#ff6b6b'
  else if (type === 'success') statusEl.style.color = '#7ee0b8'
  else statusEl.style.color = '#e5e7eb'
}

function normalizeEmail(raw) {
  return (raw || '').trim().toLowerCase()
}

// Si ya hay sesión → verificar admin y redirigir
supabase.auth.getSession().then(async ({ data: { session } }) => {
  if (!session) return

  const user = session.user
  if (!user) return

  const { data, error } = await supabase
    .from('admins')
    .select('id,is_active')
    .eq('id', user.id)
    .single()

  if (error || !data || data.is_active === false) {
    await supabase.auth.signOut()
    return
  }

  window.location.href = 'admin.html'
})

// === Login submit ===
if (form) {
  form.addEventListener('submit', async (ev) => {
    ev.preventDefault()

    if (!btnSignin || !username || !password) {
      console.error('Faltan elementos del DOM', { btnSignin, username, password })
      setStatus('Error de interfaz: faltan campos del formulario.', 'error')
      return
    }

    btnSignin.disabled = true
    setStatus('Iniciando sesión...')

    const email = normalizeEmail(username.value)
    const pwd = (password.value || '').trim()

    if (!email || !pwd) {
      setStatus('Completa usuario y contraseña', 'error')
      btnSignin.disabled = false
      return
    }

    if (!email.includes('@')) {
      setStatus('Ingresa el correo corporativo, no solo el usuario', 'error')
      btnSignin.disabled = false
      return
    }

    try {
      // Login con email + password
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: pwd
      })

      if (error) {
        // ✅ Log para ver el error real en consola si vuelve a fallar
        console.log('LOGIN ERROR:', error)

        const friendly = (error.message || '').toLowerCase().includes('invalid')
          ? 'Credenciales incorrectas'
          : `No se pudo iniciar sesión: ${error.message}`
        setStatus(friendly, 'error')
        btnSignin.disabled = false
        return
      }

      const user = data?.user
      if (!user) {
        setStatus('Error: usuario no encontrado', 'error')
        btnSignin.disabled = false
        return
      }

      // Validar que esté en tabla "admins" con is_active = true
      const { data: adminRow, error: adminErr } = await supabase
        .from('admins')
        .select('id,is_active')
        .eq('id', user.id)
        .single()

      if (adminErr || !adminRow) {
        console.log('ADMIN CHECK ERROR:', adminErr)
        console.log('ADMIN ROW:', adminRow)

        await supabase.auth.signOut()
        setStatus('Acceso denegado (no es administrador)', 'error')
        btnSignin.disabled = false
        return
      }

      if (adminRow.is_active === false) {
        await supabase.auth.signOut()
        setStatus('Tu cuenta admin está desactivada', 'error')
        btnSignin.disabled = false
        return
      }

      setStatus('Acceso correcto. Redirigiendo...', 'success')

      setTimeout(() => {
        window.location.href = 'admin.html'
      }, 500)

    } catch (err) {
      console.error(err)
      setStatus('No se pudo conectar con el servicio de login. Intenta de nuevo.', 'error')
    } finally {
      btnSignin.disabled = false
    }
  })
}
