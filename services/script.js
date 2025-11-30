/* servicios.js — versión robusta: calcula altura del header, asegura z-index/top y depura */
document.addEventListener('DOMContentLoaded', () => {
  const html = document.documentElement;
  const body = document.body;

  // Selectores con fallback (soporta #navToggle o .nav-toggle, #mainMenu o .menu)
  const btn = document.getElementById('navToggle') || document.querySelector('.nav-toggle');
  const menu = document.getElementById('mainMenu') || document.querySelector('.menu');

  // También detectamos el header/navbar para calcular la altura
  const headerEl = document.querySelector('.navbar') || document.querySelector('.site-header') || document.querySelector('header');

  if (!btn) { console.warn('servicios.js: botón de menú no encontrado (#navToggle / .nav-toggle).'); return; }
  if (!menu) { console.warn('servicios.js: panel de menú no encontrado (#mainMenu / .menu).'); return; }

  console.log('servicios.js: iniciado');

  // links del menú para trap de foco
  const menuLinks = Array.from(menu.querySelectorAll('a[href]'));
  const firstLink = menuLinks[0] || null;
  let lastFocused = null;

  // Aplicar la altura del header al CSS para que el panel quede justo debajo
  function applyHeaderHeight() {
    const headerHeight = headerEl ? headerEl.getBoundingClientRect().height : 72;
    // setear variable en root (CSS)
    document.documentElement.style.setProperty('--header-mobile-h', `${Math.ceil(headerHeight)}px`);
    // también ajustar top directo por seguridad
    menu.style.top = `${Math.ceil(headerHeight)}px`;
    // ajustar max-height del panel para evitar overflow
    menu.style.maxHeight = `calc(100vh - ${Math.ceil(headerHeight + 24)}px)`;
    // debug
    // console.log('servicios.js: headerHeight', headerHeight);
  }

  // Llamar al inicio
  applyHeaderHeight();

  // Helpers de scroll lock (añade padding-right si aparece scrollbar para evitar salto)
  function preventScroll() {
    const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollBarWidth > 0) {
      body.style.paddingRight = `${scrollBarWidth}px`;
    }
    document.documentElement.classList.add('nav-open');
    body.classList.add('nav-open');
  }
  function allowScroll() {
    document.documentElement.classList.remove('nav-open');
    body.classList.remove('nav-open');
    body.style.paddingRight = '';
  }

  const isOpen = () => btn.getAttribute('aria-expanded') === 'true';

  function openMenu() {
    lastFocused = document.activeElement;
    btn.setAttribute('aria-expanded', 'true');
    menu.setAttribute('aria-hidden', 'false');
    menu.classList.add('open');
    preventScroll();
    if (firstLink) firstLink.focus();
    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('click', onDocClick, true);
    console.log('servicios.js: menú abierto');
  }

  function closeMenu() {
    btn.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-hidden', 'true');
    menu.classList.remove('open');
    allowScroll();
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
    document.removeEventListener('keydown', onKeyDown, true);
    document.removeEventListener('click', onDocClick, true);
    console.log('servicios.js: menú cerrado');
  }

  const toggleMenu = () => (isOpen() ? closeMenu() : openMenu());

  // Eventos
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMenu();
  });

  // Cierra al clicar un enlace dentro del menú
  menu.addEventListener('click', (e) => {
    const target = e.target;
    if (target && target.matches && target.matches('a')) {
      closeMenu();
    }
  });

  // Trap de foco y ESC
  function onKeyDown(e) {
    if (e.key === 'Escape' || e.key === 'Esc') {
      e.preventDefault();
      closeMenu();
      return;
    }
    if (e.key === 'Tab' && menuLinks.length) {
      const focused = document.activeElement;
      const first = menuLinks[0];
      const last = menuLinks[menuLinks.length - 1];
      if (e.shiftKey && focused === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && focused === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  // click fuera para cerrar
  function onDocClick(e) {
    const t = e.target;
    if (!menu.contains(t) && t !== btn && !btn.contains(t)) {
      closeMenu();
    }
  }

  // sincronizar estado inicial
  (function syncInitial() {
    const expanded = btn.getAttribute('aria-expanded');
    if (expanded === 'true') {
      menu.setAttribute('aria-hidden', 'false');
      menu.classList.add('open');
      preventScroll();
    } else {
      menu.setAttribute('aria-hidden', 'true');
      menu.classList.remove('open');
      allowScroll();
    }
  })();

  // cerrar al cambiar a desktop
  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      applyHeaderHeight(); // recalcula top del panel
      if (window.innerWidth >= 881 && isOpen()) closeMenu();
    }, 120);
  });

  // Por si el header cambia tamaño (fonts, carga de imagen), recalcular después de carga completa
  window.addEventListener('load', () => setTimeout(applyHeaderHeight, 60));
});
