// js/servicios.js
// Maneja el menú móvil accesible para la página "Servicios"
// Requisitos: botón toggle #navToggle, menú #mainMenu, CSS compatible (body.menu-open, .menu-overlay)

document.addEventListener('DOMContentLoaded', () => {
  const body = document.body;
  const html = document.documentElement;

  // Navbar (estilo unificado)
  (() => {
    const nav = document.getElementById('navbar') || document.querySelector('.navbar');
    if (!nav) return;
    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 10);
    onScroll();
    window.addEventListener('scroll', onScroll);
  })();

  const btn = document.getElementById('navToggle') || document.querySelector('.nav-toggle');
  const originalMenu = document.getElementById('mainMenu') || document.querySelector('.menu');
  const headerEl = document.querySelector('.navbar') || document.querySelector('.site-header') || document.querySelector('header');

  if (!btn || !originalMenu) return;

  let overlayEl = null;
  let panelEl = null;
  let lastFocused = null;

  const MOBILE_BREAKPOINT = 880;
  const focusableSelector = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

  const isMobile = () => window.innerWidth <= MOBILE_BREAKPOINT;
  const getHeaderHeight = () => headerEl ? Math.ceil(headerEl.getBoundingClientRect().height) || 72 : 72;

  function lockScroll() {
    const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollBarWidth > 0) body.style.paddingRight = `${scrollBarWidth}px`;
    html.classList.add('nav-open');
    body.classList.add('nav-open', 'menu-open');
    body.style.overflow = 'hidden';
  }
  function unlockScroll() {
    html.classList.remove('nav-open');
    body.classList.remove('nav-open', 'menu-open');
    body.style.overflow = '';
    body.style.paddingRight = '';
  }

  function onOverlayKeydown(e) {
    if (!overlayEl) return;
    const focusables = Array.from(overlayEl.querySelectorAll(focusableSelector))
      .filter((el) => !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length));

    if (e.key === 'Escape' || e.key === 'Esc') {
      e.preventDefault();
      closeMenu();
      return;
    }

    if (e.key === 'Tab' && focusables.length) {
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  function createOverlay() {
    if (overlayEl) return overlayEl;

    overlayEl = document.createElement('div');
    overlayEl.className = 'menu-overlay';
    overlayEl.setAttribute('aria-hidden', 'true');
    overlayEl.setAttribute('role', 'dialog');
    overlayEl.setAttribute('aria-modal', 'true');
    overlayEl.style.position = 'fixed';
    overlayEl.style.inset = '0';
    overlayEl.style.zIndex = '110';
    overlayEl.style.display = 'none';
    overlayEl.style.pointerEvents = 'auto';

    const wrapper = document.createElement('div');
    wrapper.className = 'menu-overlay__wrapper';
    const headerH = getHeaderHeight();
    wrapper.style.marginTop = `${headerH}px`;
    wrapper.style.display = 'flex';
    wrapper.style.justifyContent = 'center';
    wrapper.style.alignItems = 'flex-start';
    wrapper.style.padding = '12px';

    panelEl = document.createElement('div');
    panelEl.className = 'mobile-menu-panel';
    panelEl.setAttribute('role', 'menu');
    panelEl.tabIndex = -1;
    panelEl.innerHTML = originalMenu.innerHTML;

    const closeBtn = document.createElement('button');
    closeBtn.className = 'mobile-menu-close';
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', 'Cerrar menú');
    closeBtn.innerHTML = '✕';
    closeBtn.style.position = 'absolute';
    closeBtn.style.right = '12px';
    closeBtn.style.top = '8px';
    closeBtn.style.background = 'transparent';
    closeBtn.style.border = '0';
    closeBtn.style.fontSize = '20px';
    closeBtn.style.cursor = 'pointer';

    const panelWrapper = document.createElement('div');
    panelWrapper.className = 'mobile-menu-panel__box';
    panelWrapper.style.position = 'relative';
    panelWrapper.style.width = '100%';
    panelWrapper.style.maxWidth = `${Math.min(360, window.innerWidth - 48)}px`;
    panelWrapper.style.borderRadius = '12px';
    panelWrapper.style.background = '#fff';
    panelWrapper.style.boxShadow = '0 18px 50px rgba(3,22,45,0.12)';
    panelWrapper.style.overflow = 'auto';
    panelWrapper.style.maxHeight = `calc(100vh - ${headerH + 24}px)`;
    panelWrapper.style.padding = '18px 14px 24px';

    panelWrapper.appendChild(closeBtn);
    panelWrapper.appendChild(panelEl);
    wrapper.appendChild(panelWrapper);
    overlayEl.appendChild(wrapper);
    document.body.appendChild(overlayEl);

    overlayEl.addEventListener('click', (ev) => {
      if (!panelWrapper.contains(ev.target)) closeMenu();
    });
    closeBtn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      closeMenu();
    });
    panelEl.addEventListener('click', (ev) => {
      const a = ev.target.closest('a[href]');
      if (a) closeMenu();
    });

    overlayEl.addEventListener('keydown', onOverlayKeydown);

    return overlayEl;
  }

  function openMenu() {
    if (!isMobile()) {
      btn.setAttribute('aria-expanded', 'true');
      originalMenu.setAttribute('aria-hidden', 'false');
      originalMenu.classList.add('open');
      return;
    }

    lastFocused = document.activeElement;
    btn.setAttribute('aria-expanded', 'true');

    createOverlay();
    overlayEl.style.display = 'block';
    overlayEl.setAttribute('aria-hidden', 'false');
    lockScroll();
    body.classList.add('menu-open');

    const focusables = Array.from(overlayEl.querySelectorAll(focusableSelector))
      .filter((el) => !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length));
    if (focusables.length) focusables[0].focus();
    else {
      const closeBtn = overlayEl.querySelector('.mobile-menu-close');
      if (closeBtn) closeBtn.focus();
      else if (panelEl) panelEl.focus();
    }
  }

  function closeMenu() {
    if (overlayEl) {
      overlayEl.style.display = 'none';
      overlayEl.setAttribute('aria-hidden', 'true');
      overlayEl.removeEventListener('keydown', onOverlayKeydown);
      if (overlayEl.parentElement) overlayEl.parentElement.removeChild(overlayEl);
      overlayEl = null;
      panelEl = null;
    }

    btn.setAttribute('aria-expanded', 'false');
    originalMenu.setAttribute('aria-hidden', 'true');
    originalMenu.classList.remove('open');

    unlockScroll();

    if (lastFocused && typeof lastFocused.focus === 'function') {
      lastFocused.focus();
      lastFocused = null;
    }
  }

  function toggleMenu() {
    const expanded = btn.getAttribute('aria-expanded') === 'true';
    if (expanded) closeMenu();
    else openMenu();
  }

  btn.addEventListener('click', (ev) => {
    ev.stopPropagation();
    toggleMenu();
  });

  document.addEventListener('click', (e) => {
    if (isMobile()) return;
    if (originalMenu.classList.contains('open')) {
      const target = e.target;
      if (!originalMenu.contains(target) && !btn.contains(target)) {
        btn.setAttribute('aria-expanded', 'false');
        originalMenu.classList.remove('open');
        originalMenu.setAttribute('aria-hidden', 'true');
      }
    }
  });

  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (overlayEl && window.innerWidth > MOBILE_BREAKPOINT) closeMenu();
    }, 120);
  });

  window.addEventListener('beforeunload', () => {
    if (overlayEl) closeMenu();
  });

  (function syncInitial() {
    const expanded = btn.getAttribute('aria-expanded');
    if (expanded === 'true') {
      btn.setAttribute('aria-expanded', 'true');
      originalMenu.setAttribute('aria-hidden', 'false');
      originalMenu.classList.add('open');
    } else {
      btn.setAttribute('aria-expanded', 'false');
      originalMenu.setAttribute('aria-hidden', 'true');
      originalMenu.classList.remove('open');
    }
  })();
});
