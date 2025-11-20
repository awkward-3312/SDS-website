// Navbar: toggle mobile menu + shadow on scroll
(function () {
    const nav = document.getElementById('navbar');
    const toggle = document.getElementById('navToggle');
    const menu = document.getElementById('mainMenu');
  
    // Toggle mobile menu
    toggle.addEventListener('click', () => {
      const open = menu.classList.toggle('show');
      toggle.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', !!open);
    });
  
    // Close menu on link click (mobile)
    menu.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        if (menu.classList.contains('show')) {
          menu.classList.remove('show');
          toggle.classList.remove('open');
          toggle.setAttribute('aria-expanded', 'false');
        }
      });
    });
  
    // Add shadow when scroll > 10px
    window.addEventListener('scroll', () => {
      if (window.scrollY > 10) nav.classList.add('scrolled');
      else nav.classList.remove('scrolled');
    });
  })();
  
  // SLIDER AUTOMÁTICO HERO
let slideIndex = 0;
const slides = document.querySelectorAll('.hero-slider .slide');

function changeSlide() {
    slides[slideIndex].classList.remove('active');
    slideIndex = (slideIndex + 1) % slides.length;
    slides[slideIndex].classList.add('active');
}

setInterval(changeSlide, 7000); // Cambia los segundos
