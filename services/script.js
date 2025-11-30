/* ============================
   NAV MOBILE: toggle accesible
   ============================ */
   (function initMobileNavModule() {
    // Busca elementos por ID (id esperados: 'navToggle' y 'mainMenu')
    const btn = document.getElementById('navToggle');
    const menu = document.getElementById('mainMenu');
    if (!btn || !menu) return;
  
    // Evitar doble inicialización (si otro script ya lo hizo)
    if (btn._navInit) return;
    btn._navInit = true;
  
    // Asegurar estado aria inicial
    if (!btn.hasAttribute('aria-expanded')) btn.setAttribute('aria-expanded', 'false');
    if (!menu.hasAttribute('role')) menu.setAttribute('role', 'menu');
    // asegurar que el menú sea manejable por JS
    if (!menu.id) menu.id = 'mainMenu';
  
    // Abre el menú: añade clase .open, actualiza aria y mueve foco
    const openMenu = () => {
      btn.setAttribute('aria-expanded', 'true');
      btn.classList.add('is-open');
      menu.classList.add('open');
      menu.removeAttribute('hidden');
      // mover foco al primer elemento interactivo dentro del menú
      const first = menu.querySelector('a, button, [tabindex]:not([tabindex="-1"])');
      if (first && typeof first.focus === 'function') first.focus();
      // bloquear scroll del documento (evita que el fondo se desplace)
      document.documentElement.classList.add('nav-open');
      document.body.classList.add('nav-open');
    };
  
    // Cierra el menú: quita .open, restaura aria y foco en el botón
    const closeMenu = () => {
      btn.setAttribute('aria-expanded', 'false');
      btn.classList.remove('is-open');
      menu.classList.remove('open');
      menu.setAttribute('hidden', '');
      try { btn.focus(); } catch (e) { /* noop */ }
      document.documentElement.classList.remove('nav-open');
      document.body.classList.remove('nav-open');
    };
  
    // Toggle al click en el botón hamburguesa
    btn.addEventListener('click', (ev) => {
      ev.preventDefault();
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      if (expanded) closeMenu(); else openMenu();
    });
  
    // Cerrar con Escape cuando el menú esté abierto
    document.addEventListener('keydown', (ev) => {
      if ((ev.key === 'Escape' || ev.key === 'Esc') && menu.classList.contains('open')) {
        ev.preventDefault();
        closeMenu();
      }
    });
  
    // Cerrar al hacer click fuera del menú (cuando esté abierto)
    document.addEventListener('click', (ev) => {
      if (!menu.classList.contains('open')) return;
      const target = ev.target;
      if (menu.contains(target) || btn.contains(target)) return;
      closeMenu();
    });
  
    // Si se redimensiona a desktop ( > 880px ), cerrar el menú si está abierto
    let _resizeTimer = null;
    window.addEventListener('resize', () => {
      clearTimeout(_resizeTimer);
      _resizeTimer = setTimeout(() => {
        if (window.innerWidth > 880 && menu.classList.contains('open')) {
          closeMenu();
        }
      }, 120);
    });
  
    // Cerrar cuando se hace click en un enlace del menú (navegación)
    try {
      menu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
          if (menu.classList.contains('open')) closeMenu();
        });
      });
    } catch (err) {
      // noop
    }
  
    // Exponer funciones en el botón (opcional, útil para testing/otros scripts)
    btn._openMenu = openMenu;
    btn._closeMenu = closeMenu;
    btn._navInit = true;
  })();
  
  
  /* ===========================
     RESTO DEL SCRIPT (SERVICE CARDS & MODALS)
     =========================== */
  document.addEventListener('DOMContentLoaded', () => {
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
  