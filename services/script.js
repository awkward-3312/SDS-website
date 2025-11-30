document.addEventListener('DOMContentLoaded', () => {
  const html = document.documentElement;
  const btn = document.getElementById('navToggle');
  const menu = document.getElementById('mainMenu');

  if (!btn || !menu) return;

  // Guardar enlaces del menú
  const menuLinks = Array.from(menu.querySelectorAll('a[href]'));
  const firstLink = menuLinks[0] || null;
  let lastFocused = null;

  // Helpers
  const isOpen = () => btn.getAttribute('aria-expanded') === 'true';
  const openMenu = () => {
    lastFocused = document.activeElement;
    btn.setAttribute('aria-expanded', 'true');
    menu.setAttribute('aria-hidden', 'false');
    menu.classList.add('open');
    html.classList.add('nav-open'); // bloqueo de scroll
    // focus en primer enlace si existe
    if (firstLink) firstLink.focus();
    // Escuchar eventos de cierre
    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('click', onDocClick, true);
  };
  const closeMenu = () => {
    btn.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-hidden', 'true');
    menu.classList.remove('open');
    html.classList.remove('nav-open');
    // restaurar foco
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
    document.removeEventListener('keydown', onKeyDown, true);
    document.removeEventListener('click', onDocClick, true);
  };
  const toggleMenu = () => (isOpen() ? closeMenu() : openMenu());

  // Eventos
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMenu();
  });

  // Cierra cuando se clickea un enlace del menú (útil en mobile)
  menu.addEventListener('click', (e) => {
    const target = e.target;
    if (target && target.matches && target.matches('a')) {
      // Si es navegación interna, cerramos
      closeMenu();
    }
  });

  // Cierra con ESC y maneja TAB para mantener foco dentro (trap simple)
  function onKeyDown(e) {
    if (e.key === 'Escape' || e.key === 'Esc') {
      e.preventDefault();
      closeMenu();
      return;
    }
    // Trap básico: si tabulamos fuera del menú cuando está abierto, mantener foco (mejorable)
    if (e.key === 'Tab') {
      // Si no hay enlaces, no hacemos nada
      if (!menuLinks.length) return;

      const focused = document.activeElement;
      const first = menuLinks[0];
      const last = menuLinks[menuLinks.length - 1];

      // SHIFT+TAB en primer elemento => mover foco al último
      if (e.shiftKey && focused === first) {
        e.preventDefault();
        last.focus();
      }
      // TAB en último => mover foco al primero
      else if (!e.shiftKey && focused === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  // Cierra si se hace click fuera del menú (excluye el botón)
  function onDocClick(e) {
    const target = e.target;
    if (!menu.contains(target) && target !== btn && !btn.contains(target)) {
      closeMenu();
    }
  }

  // A11y: si el markup inicial tiene atributos diferentes, sincroniza estado inicial
  (function syncInitialState() {
    const expanded = btn.getAttribute('aria-expanded');
    if (expanded === 'true') {
      menu.setAttribute('aria-hidden', 'false');
      menu.classList.add('open');
      html.classList.add('nav-open');
    } else {
      menu.setAttribute('aria-hidden', 'true');
      menu.classList.remove('open');
      html.classList.remove('nav-open');
    }
  })();

  // Mejoras opcionales: cerrar al redimensionar si pasamos a desktop
  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      // Si ancho >= breakpoint y el menú está abierto, cerrarlo
      if (window.innerWidth >= 881 && isOpen()) closeMenu();
    }, 120);
  });
});
