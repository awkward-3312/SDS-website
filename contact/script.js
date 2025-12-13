// contact.js — script específico SOLO para la página de contacto.
// No interfiere con script.js (navbar + hamburger).

document.addEventListener("DOMContentLoaded", () => {
  // Navbar toggle (misma experiencia que el home)
  (() => {
    const nav = document.getElementById('navbar');
    const toggle = document.getElementById('navToggle');
    const menu = document.getElementById('mainMenu');

    if (!toggle || !menu) return;

    toggle.addEventListener('click', () => {
      const isOpen = menu.classList.toggle('show');
      toggle.classList.toggle('open', !!isOpen);
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    menu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        if (menu.classList.contains('show')) {
          menu.classList.remove('show');
          toggle.classList.remove('open');
          toggle.setAttribute('aria-expanded', 'false');
        }
      });
    });

    if (nav) {
      window.addEventListener('scroll', () => {
        nav.classList.toggle('scrolled', window.scrollY > 10);
      });
    }
  })();

  const DEST_SHORT_URL = "https://maps.app.goo.gl/GGwMKSTcUmfTmZVU6";

  // Eliminar formulario antiguo si quedó en el HTML
  const oldForm = document.getElementById("formContacto");
  if (oldForm && oldForm.parentNode) oldForm.parentNode.removeChild(oldForm);

  // Eliminar botón "Cómo llegar" antiguo si existe
  const oldDirectionsBtn = document.getElementById("btn-directions");
  if (oldDirectionsBtn && oldDirectionsBtn.parentNode) oldDirectionsBtn.parentNode.removeChild(oldDirectionsBtn);

  const btnOpenMaps = document.getElementById("btn-open-maps");
  if (!btnOpenMaps) return;

  // Evita doble inicialización si el script se ejecuta más de una vez
  if (btnOpenMaps._contactInit) return;
  btnOpenMaps._contactInit = true;

  // Función central para abrir el mapa (fallbacks incluidos)
  function openMap() {
    try {
      // Preferimos abrir la URL en una nueva ventana/pestaña de forma segura
      const newWin = window.open(DEST_SHORT_URL, "_blank", "noopener,noreferrer");
      if (!newWin) {
        // Si el popup fue bloqueado, navegamos en la misma pestaña como fallback
        window.location.href = DEST_SHORT_URL;
      }
    } catch (err) {
      // Fallback muy robusto: asignar href al location
      window.location.href = DEST_SHORT_URL;
    }
  }

  // Click normal
  btnOpenMaps.addEventListener("click", (ev) => {
    ev.preventDefault();
    openMap();
  });

  // Activación por teclado (Enter / Space)
  btnOpenMaps.addEventListener("keydown", (ev) => {
    const key = ev.key || ev.keyIdentifier || ev.code;
    if (key === "Enter" || key === " " || key === "Spacebar" || key === "Space") {
      ev.preventDefault();
      openMap();
    }
  });

  // Soporte adicional: activar con "pointerdown" en dispositivos táctiles (más rápido)
  // Esto es opcional pero mejora la sensación en móviles
  btnOpenMaps.addEventListener("pointerdown", (ev) => {
    // solo si es un pointer de tipo touch o pen (evita duplicar en desktop)
    if (ev.pointerType === "touch" || ev.pointerType === "pen") {
      // no preventDefault aquí para no bloquear focus/gestos nativos
      openMap();
    }
  }, { passive: true });
});
