document.addEventListener('DOMContentLoaded', () => {
    const cards = Array.from(document.querySelectorAll('.service-card[role="button"], .service-card[tabindex]'));
  
    // Helpers
    const isActivationKey = (e) => e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar';
    const focusableSelector = 'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
  
    // Open modal by id
    function openModal(modalId, triggerEl) {
      const modal = document.getElementById(modalId);
      if (!modal) return;
      // Save last focused
      modal._lastTrigger = triggerEl || document.activeElement;
      modal.setAttribute('aria-hidden', 'false');
      modal.style.display = ''; // ensure displayed if CSS used display:none
      // Put focus on first focusable element inside modal
      const first = modal.querySelector(focusableSelector);
      if (first) {
        first.focus();
      } else {
        // fallback to modal itself
        modal.setAttribute('tabindex', '-1');
        modal.focus();
      }
      // enable trap
      trapFocus(modal);
    }
  
    // Close modal and restore focus
    function closeModal(modal) {
      if (!modal) return;
      modal.setAttribute('aria-hidden', 'true');
      modal.style.display = 'none';
      // remove tabindex fallback
      if (modal.hasAttribute('tabindex')) modal.removeAttribute('tabindex');
      // restore focus
      const trigger = modal._lastTrigger;
      if (trigger && typeof trigger.focus === 'function') trigger.focus();
      // remove trap listeners
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
          // If focus moves outside, send it back to first
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
      // ensure keyboard focusable
      if (!card.hasAttribute('tabindex')) card.setAttribute('tabindex', '0');
      card.setAttribute('role', 'button');
  
      // click behavior
      card.addEventListener('click', (e) => {
        // data-href takes precedence: navigate (progressive enhancement)
        const href = card.dataset.href;
        const modalId = card.dataset.modal;
        if (href) {
          // allow regular navigation
          window.location.href = href;
          return;
        }
        if (modalId) {
          openModal(modalId, card);
          return;
        }
        // default behavior: toggle aria-pressed as a visual state (non-modal)
        const pressed = card.getAttribute('aria-pressed') === 'true';
        card.setAttribute('aria-pressed', String(!pressed));
      });
  
      // keyboard activation (Enter / Space)
      card.addEventListener('keydown', (e) => {
        if (isActivationKey(e)) {
          e.preventDefault();
          card.click();
        }
      });
    });
  
    // Modal global listeners: close on ESC or click outside / close buttons
    // Find all modals in the document
    const modals = Array.from(document.querySelectorAll('.modal'));
    modals.forEach(modal => {
      // ensure hidden state attribute exists
      if (!modal.hasAttribute('aria-hidden')) modal.setAttribute('aria-hidden', 'true');
      // close buttons
      modal.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', (ev) => {
          ev.preventDefault();
          closeModal(modal);
        });
      });
  
      // click outside panel
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
  
    // Optional: ensure links/buttons inside cards are usable (delegation)
    // If you later put <a> inside card, keep normal behavior.
  
    // Small UX: reduce hover animation on touch devices
    const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
    if (isTouch) {
      document.documentElement.classList.add('is-touch');
    }
  });
  