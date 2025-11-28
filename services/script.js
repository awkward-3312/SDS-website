// script.js — navbar / hamburger + service cards & modals
document.addEventListener('DOMContentLoaded', () => {
  /* NAV MOBILE (hamburger) */
  (function initMobileNav() {
    const btn = document.getElementById('navToggle');
    const menu = document.getElementById('mainMenu');
    if (!btn || !menu) return;

    // Evita doble inicialización
    if (btn._navInit) return;
    btn._navInit = true;

    // Atributos accesibles iniciales
    if (!btn.hasAttribute('aria-expanded')) btn.setAttribute('aria-expanded', 'false');
    if (!menu.hasAttribute('role')) menu.setAttribute('role', 'navigation');
    if (!menu.id) menu.id = 'mainMenu'; // asegurar id

    const BREAKPOINT = 880;
    let trapHandlers = null;
    let resizeTimer = null;

    const isOpen = () => btn.getAttribute('aria-expanded') === 'true' && !menu.hasAttribute('hidden');

    const lockScroll = () => {
      document.documentElement.classList.add('nav-open');
      document.body.classList.add('nav-open');
    };
    const unlockScroll = () => {
      document.documentElement.classList.remove('nav-open');
      document.body.classList.remove('nav-open');
    };

    const installMenuTrap = () => {
      if (trapHandlers) return;
      const focusable = Array.from(menu.querySelectorAll(
        'a[href], area[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      ));
      if (!focusable.length) return;

      function onKey(e) {
        if (e.key !== 'Tab') return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
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

      function onFocusIn(e) {
        if (!menu.contains(e.target)) {
          focusable[0].focus();
        }
      }

      document.addEventListener('keydown', onKey);
      document.addEventListener('focusin', onFocusIn);
      trapHandlers = { onKey, onFocusIn };
    };

    const removeMenuTrap = () => {
      if (!trapHandlers) return;
      document.removeEventListener('keydown', trapHandlers.onKey);
      document.removeEventListener('focusin', trapHandlers.onFocusIn);
      trapHandlers = null;
    };

    const openMenu = () => {
      btn.setAttribute('aria-expanded', 'true');
      btn.classList.add('is-open');
      menu.removeAttribute('hidden');
      menu.classList.add('open');
      lockScroll();
      // focus al primer elemento
      const first = menu.querySelector('a, button');
      if (first) first.focus();
      installMenuTrap();
    };

    const closeMenu = (restoreFocus = true) => {
      btn.setAttribute('aria-expanded', 'false');
      btn.classList.remove('is-open');
      menu.classList.remove('open');
      menu.setAttribute('hidden', '');
      removeMenuTrap();
      unlockScroll();
      if (restoreFocus) try { btn.focus(); } catch (e) {}
    };

    // Toggle (click / pointer)
    btn.addEventListener('click', (ev) => {
      ev.preventDefault();
      if (isOpen()) closeMenu();
      else openMenu();
    });

    // pointerdown para respuesta rápida en touch (no impide click)
    btn.addEventListener('pointerdown', (ev) => {
      if (ev.pointerType === 'touch' || ev.pointerType === 'pen') {
        // no preventDefault para mantener focus behavior nativo
        if (!isOpen()) openMenu();
        else closeMenu();
      }
    }, { passive: true });

    // Cerrar con ESC (global)
    document.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape' || ev.key === 'Esc') {
        if (isOpen()) closeMenu();
      }
    });

    // Cerrar con click fuera — uso composedPath con fallback seguro
    document.addEventListener('click', (ev) => {
      if (!isOpen()) return;
      const path = typeof ev.composedPath === 'function' ? ev.composedPath() : (ev.path || []);
      const clickedInside = Array.isArray(path) && path.length
        ? path.includes(menu) || path.includes(btn)
        : (menu.contains(ev.target) || btn.contains(ev.target));
      if (!clickedInside) closeMenu();
    }, { passive: true });

    // Cerrar al redimensionar a desktop (debounce pequeño)
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (window.innerWidth > BREAKPOINT && isOpen()) closeMenu();
      }, 120);
    }, { passive: true });

    // Cerrar cuando se hace click en un enlace del menú (navegación)
    try {
      menu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
          if (isOpen()) closeMenu(false);
        });
      });
    } catch (err) {
      // noop — si el menu cambia dinámicamente no rompemos
    }
  })();


  /* ----------------------
     SERVICE CARDS + MODALS
     ---------------------- */

  const cards = Array.from(document.querySelectorAll('.service-card[role="button"], .service-card[tabindex]'));

  const isActivationKey = (e) => e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar';
  const focusableSelector = 'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

  function openModal(modalId, triggerEl) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal._lastTrigger = triggerEl || document.activeElement;
    modal.setAttribute('aria-hidden', 'false');
    modal.style.display = '';
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

  // ESC key closes any open modal (keeps behavior for nav as well)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' || e.key === 'Esc') {
      modals.forEach(m => {
        if (m.getAttribute('aria-hidden') === 'false') closeModal(m);
      });
    }
  });

  // Touch device hint
  const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
  if (isTouch) document.documentElement.classList.add('is-touch');
});
