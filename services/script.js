document.addEventListener('DOMContentLoaded', () => {
  /* NAV MOBILE (hamburger) */
  (function initMobileNav() {
    const btn = document.getElementById('navToggle');
    const menu = document.getElementById('mainMenu');
    if (!btn || !menu) return;

    // Evita doble inicialización
    if (btn._navInit) return;
    btn._navInit = true;

    // Estado inicial accesible
    if (!btn.hasAttribute('aria-expanded')) btn.setAttribute('aria-expanded', 'false');
    if (!menu.hasAttribute('role')) menu.setAttribute('role', 'navigation');

    // Helpers
    const breakpoint = 880;
    const isOpen = () => btn.getAttribute('aria-expanded') === 'true' && !menu.hasAttribute('hidden');

    const enableBodyLock = () => {
      document.documentElement.classList.add('nav-open');
      document.body.classList.add('nav-open');
    };
    const disableBodyLock = () => {
      document.documentElement.classList.remove('nav-open');
      document.body.classList.remove('nav-open');
    };

    // Focus trap handlers storage
    let _trapHandlers = null;

    const openMenu = () => {
      btn.setAttribute('aria-expanded', 'true');
      btn.classList.add('is-open'); // para animación hamburguesa -> X
      menu.removeAttribute('hidden');
      menu.classList.add('open');
      menu.classList.remove('show');

      // focus al primer enlace
      const first = menu.querySelector('a, button');
      if (first) first.focus();

      enableBodyLock();

      // instalar focus trap mínimo para el menú
      installMenuTrap();
    };

    const closeMenu = (returnFocus = true) => {
      btn.setAttribute('aria-expanded', 'false');
      btn.classList.remove('is-open');
      menu.classList.remove('open');
      menu.classList.remove('show');
      menu.setAttribute('hidden', '');

      disableBodyLock();

      // restaurar foco al botón que abrió
      if (returnFocus) {
        try { btn.focus(); } catch (e) {}
      }

      // quitar trap
      removeMenuTrap();
    };

    // Toggle al click (botón)
    btn.addEventListener('click', (ev) => {
      ev.preventDefault();
      if (isOpen()) closeMenu();
      else openMenu();
    });

    // Cerrar con ESC (global)
    document.addEventListener('keydown', (ev) => {
      if ((ev.key === 'Escape' || ev.key === 'Esc') && isOpen()) {
        closeMenu();
      }
    });

    // Cerrar con click fuera cuando el menú esté abierto
    document.addEventListener('click', (ev) => {
      if (!isOpen()) return;
      const path = ev.composedPath ? ev.composedPath() : (ev.path || []);
      // Si no hay composedPath disponible, fallback a contains
      const clickedInside = path.length ? path.includes(menu) || path.includes(btn) : (menu.contains(ev.target) || btn.contains(ev.target));
      if (!clickedInside) closeMenu();
    });

    // Cerrar al redimensionar a desktop
    let _resizeTimer = null;
    window.addEventListener('resize', () => {
      clearTimeout(_resizeTimer);
      _resizeTimer = setTimeout(() => {
        if (window.innerWidth > breakpoint && isOpen()) closeMenu();
      }, 120);
    });

    // Cerrar cuando se hace click en un enlace del menú (navegación)
    menu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        if (isOpen()) closeMenu(false); // no forzamos foco si el link navega fuera
      });
    });

    // --- Focus trap mínimo para el menú (mientras esté abierto) ---
    function installMenuTrap() {
      // evita re-instalar
      if (_trapHandlers) return;
      const focusableSelector = 'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
      const items = Array.from(menu.querySelectorAll(focusableSelector));
      if (!items.length) return;

      function handleKey(e) {
        if (e.key !== 'Tab') return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }

      function handleFocusin(e) {
        if (!menu.contains(e.target)) {
          // si el foco sale del menú, devolverlo al primer elemento
          items[0].focus();
        }
      }

      document.addEventListener('keydown', handleKey);
      document.addEventListener('focusin', handleFocusin);
      _trapHandlers = { handleKey, handleFocusin };
    }

    function removeMenuTrap() {
      if (!_trapHandlers) return;
      document.removeEventListener('keydown', _trapHandlers.handleKey);
      document.removeEventListener('focusin', _trapHandlers.handleFocusin);
      _trapHandlers = null;
    }

  })();


  /* ----------------------
     SERVICE CARDS + MODALS
     (dejé este bloque prácticamente igual a tu versión original,
      solo hice pequeños ajustes de robustez)
     ---------------------- */

  const cards = Array.from(document.querySelectorAll('.service-card[role="button"], .service-card[tabindex]'));

  // Helpers
  const isActivationKey = (e) => e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar';
  const focusableSelector = 'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

  // Open modal by id
  function openModal(modalId, triggerEl) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal._lastTrigger = triggerEl || document.activeElement;
    modal.setAttribute('aria-hidden', 'false');
    modal.style.display = ''; // ensure displayed if CSS used display:none
    const first = modal.querySelector(focusableSelector);
    if (first) first.focus();
    else {
      modal.setAttribute('tabindex', '-1');
      modal.focus();
    }
    trapFocus(modal);
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.setAttribute('aria-hidden', 'true');
    modal.style.display = 'none';
    if (modal.hasAttribute('tabindex')) modal.removeAttribute('tabindex');
    const trigger = modal._lastTrigger;
    if (trigger && typeof trigger.focus === 'function') trigger.focus();
    releaseTrap(modal);
  }

  // Basic focus trap: loop focus within modal
  const trapMap = new WeakMap();
  function trapFocus(modal) {
    if (!modal) return;
    const focusables = Array.from(modal.querySelectorAll(focusableSelector));
    if (!focusables.length) return;

    function handleKey(e) {
      if (e.key !== 'Tab') return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    function handleFocusin(e) {
      if (!modal.contains(e.target)) {
        focusables[0].focus();
      }
    }

    document.addEventListener('keydown', handleKey);
    document.addEventListener('focusin', handleFocusin);
    trapMap.set(modal, { handleKey, handleFocusin });
  }

  function releaseTrap(modal) {
    const handlers = trapMap.get(modal);
    if (!handlers) return;
    document.removeEventListener('keydown', handlers.handleKey);
    document.removeEventListener('focusin', handlers.handleFocusin);
    trapMap.delete(modal);
  }

  // Wire up each card
  cards.forEach(card => {
    if (!card.hasAttribute('tabindex')) card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');

    card.addEventListener('click', (e) => {
      const href = card.dataset.href;
      const modalId = card.dataset.modal;
      if (href) {
        window.location.href = href;
        return;
      }
      if (modalId) {
        openModal(modalId, card);
        return;
      }
      const pressed = card.getAttribute('aria-pressed') === 'true';
      card.setAttribute('aria-pressed', String(!pressed));
    });

    card.addEventListener('keydown', (e) => {
      if (isActivationKey(e)) {
        e.preventDefault();
        card.click();
      }
    });
  });

  // Modal global listeners
  const modals = Array.from(document.querySelectorAll('.modal'));
  modals.forEach(modal => {
    if (!modal.hasAttribute('aria-hidden')) modal.setAttribute('aria-hidden', 'true');
    modal.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', (ev) => {
        ev.preventDefault();
        closeModal(modal);
      });
    });

    modal.addEventListener('click', (ev) => {
      if (ev.target === modal) closeModal(modal);
    });
  });

  // ESC key to close any open modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' || e.key === 'Esc') {
      modals.forEach(m => {
        if (m.getAttribute('aria-hidden') === 'false') {
          closeModal(m);
        }
      });
    }
  });

  // Touch device hint class
  const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
  if (isTouch) {
    document.documentElement.classList.add('is-touch');
  }
});
