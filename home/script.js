
//  NAVBAR – mobile menu + scroll shadow
(function () {
  const nav = document.getElementById('navbar');
  const toggle = document.getElementById('navToggle');
  const menu = document.getElementById('mainMenu');

  // Toggle mobile menu
  toggle.addEventListener('click', () => {
    const open = menu.classList.toggle('show');
    toggle.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', open);
  });

  // Close menu when clicking a link
  menu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      if (menu.classList.contains('show')) {
        menu.classList.remove('show');
        toggle.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  });

  // Shadow when scrolling
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 10);
  });
})();
  
// HERO SLIDER ACCESIBLE + OPTIMIZADO

const slides = document.querySelectorAll('.hero-slider .slide');
const dots = document.querySelectorAll('.slider-dots button');
const prevBtn = document.querySelector('.slider-control.prev');
const nextBtn = document.querySelector('.slider-control.next');
const slider = document.querySelector('.hero-slider');

let index = 0;
let auto = null;
const interval = 7000; // tiempo de cada slide


//  Funciones principales

function showSlide(n) {
  // 1. Normalizar índice
  index = (n + slides.length) % slides.length;

  // 2. Actualizar slides
  slides.forEach((sl, i) => {
    const active = i === index;
    sl.classList.toggle('active', active);
    sl.setAttribute('aria-hidden', !active);
  });

  // 3. Actualizar dots accesibles
  dots.forEach((dot, i) => {
    const active = i === index;
    dot.setAttribute('aria-selected', active);
    dot.classList.toggle('active-dot', active);
  });
}

function nextSlide() {
  showSlide(index + 1);
}

function prevSlide() {
  showSlide(index - 1);
}

function startAuto() {
  if (auto) clearInterval(auto);
  auto = setInterval(nextSlide, interval);
}

function stopAuto() {
  if (auto) clearInterval(auto);
}


// Controles: botones prev/next
if (prevBtn && nextBtn) {
  prevBtn.addEventListener('click', () => {
    prevSlide();
    startAuto();
  });

  nextBtn.addEventListener('click', () => {
    nextSlide();
    startAuto();
  });
}

// Dots – navegación accesible
dots.forEach((dot, i) => {
  dot.addEventListener('click', () => {
    showSlide(i);
    startAuto();
  });

  // teclado en dots (Enter/Espacio)
  dot.addEventListener('keydown', e => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      showSlide(i);
      startAuto();
    }
  });
});

//   Pausa automática por hover o focus
slider.addEventListener('mouseenter', stopAuto);
slider.addEventListener('mouseleave', startAuto);

// Si el usuario navega con teclado → pausa
slider.addEventListener('focusin', stopAuto);
slider.addEventListener('focusout', startAuto);


// Swipe en móvil (touch)
let startX = 0;
let endX = 0;

slider.addEventListener('touchstart', e => {
  startX = e.touches[0].clientX;
});

slider.addEventListener('touchend', e => {
  endX = e.changedTouches[0].clientX;
  const diff = endX - startX;

  if (Math.abs(diff) > 50) {
    if (diff < 0) nextSlide();
    else prevSlide();
    startAuto();
  }
});
// Lazy-loading y quitar blur/skeleton
slides.forEach(sl => {
  const img = sl.querySelector('img');
  if (!img) return;

  img.addEventListener('load', () => {
    sl.classList.add('loaded');
  });
});

//   Inicio del slider
showSlide(0);
startAuto();
