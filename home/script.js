//  NAVBAR – mobile menu + scroll shadow (versión robusta)
(function () {
  const nav = document.getElementById('navbar');
  const toggle = document.getElementById('navToggle');
  const menu = document.getElementById('mainMenu');

  if (!toggle) return; // nada que hacer si no hay toggle

  // Toggle mobile menu (defensivo)
  toggle.addEventListener('click', () => {
    const isOpen = menu && menu.classList.toggle('show');
    // mantén la clase visual en el botón (open) y actualiza aria-expanded como string
    toggle.classList.toggle('open', !!isOpen);
    toggle.setAttribute('aria-expanded', !!isOpen ? 'true' : 'false');
  });

  // Close menu when clicking a link (defensivo)
  if (menu) {
    menu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        if (menu.classList.contains('show')) {
          menu.classList.remove('show');
          if (toggle) toggle.classList.remove('open');
          if (toggle) toggle.setAttribute('aria-expanded', 'false');
        }
      });
    });
  }

  // Shadow when scrolling (defensivo)
  if (nav) {
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 10);
    });
  }
})();

// HERO SLIDER ACCESIBLE + OPTIMIZADO (versión robusta)
(function () {
  const slidesNodeList = document.querySelectorAll('.hero-slider .slide');
  const dotsNodeList = document.querySelectorAll('.slider-dots button');
  const prevBtn = document.querySelector('.slider-control.prev');
  const nextBtn = document.querySelector('.slider-control.next');
  const slider = document.querySelector('.hero-slider');

  const slides = Array.from(slidesNodeList);
  const dots = Array.from(dotsNodeList);

  if (!slides.length) return; // no hay slides: salir

  let index = 0;
  let auto = null;
  const interval = 7000; // ms
  let _startAutoDebounce = null;

  // Mostrar slide n (defensivo con índices)
  function showSlide(n) {
    index = (n + slides.length) % slides.length;

    slides.forEach((sl, i) => {
      const active = i === index;
      sl.classList.toggle('active', active);
      sl.setAttribute('aria-hidden', (!active).toString());
    });

    // actualizar dots si existen y coinciden en cantidad
    if (dots.length) {
      dots.forEach((dot, i) => {
        const active = i === index;
        dot.setAttribute('aria-selected', active ? 'true' : 'false');
        dot.classList.toggle('active-dot', active);
      });
    }
  }

  function nextSlide() {
    showSlide(index + 1);
  }

  function prevSlide() {
    showSlide(index - 1);
  }

  function startAuto() {
    // no iniciar autoplay si solo 1 slide
    if (slides.length <= 1) return;
    if (auto) clearInterval(auto);
    // debounce ligero para evitar arranques múltiples
    if (_startAutoDebounce) clearTimeout(_startAutoDebounce);
    _startAutoDebounce = setTimeout(() => {
      auto = setInterval(nextSlide, interval);
    }, 80);
  }

  function stopAuto() {
    if (auto) { clearInterval(auto); auto = null; }
    if (_startAutoDebounce) { clearTimeout(_startAutoDebounce); _startAutoDebounce = null; }
  }

  // Controles prev/next
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      prevSlide();
      startAuto();
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      nextSlide();
      startAuto();
    });
  }

  // Dots – navegación accesible
  if (dots.length) {
    dots.forEach((dot, i) => {
      dot.addEventListener('click', (e) => {
        e.preventDefault();
        showSlide(i);
        startAuto();
      });

      dot.addEventListener('keydown', e => {
        const key = e.key || e.code;
        if (key === 'Enter' || key === ' ' || key === 'Spacebar') {
          e.preventDefault();
          showSlide(i);
          startAuto();
        }
      });
    });
  }

  // Pausa automática por hover/focus (si existe el slider wrapper)
  if (slider) {
    slider.addEventListener('mouseenter', stopAuto);
    slider.addEventListener('mouseleave', startAuto);
    slider.addEventListener('focusin', stopAuto);
    slider.addEventListener('focusout', startAuto);
  }

  // Swipe en móvil (defensivo)
  if (slider) {
    let startX = 0;
    slider.addEventListener('touchstart', e => {
      if (!e.touches || !e.touches[0]) return;
      startX = e.touches[0].clientX;
    }, { passive: true });

    slider.addEventListener('touchend', e => {
      if (!e.changedTouches || !e.changedTouches[0]) return;
      const endX = e.changedTouches[0].clientX;
      const diff = endX - startX;
      if (Math.abs(diff) > 50) {
        if (diff < 0) nextSlide(); else prevSlide();
        startAuto();
      }
    }, { passive: true });
  }

  // Lazy-loading visual: quitar clase skeleton al cargar imagen
  slides.forEach(sl => {
    const img = sl.querySelector('img');
    if (!img) return;
    if (img.complete) {
      // ya cargada
      sl.classList.add('loaded');
    } else {
      img.addEventListener('load', () => {
        sl.classList.add('loaded');
      });
    }
  });

  // Start: mostrar primer slide y arrancar autoplay si aplica
  showSlide(0);
  // solo iniciar auto si hay más de 1 slide
  if (slides.length > 1) startAuto();
})();
