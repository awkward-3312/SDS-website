// contact.js — script específico SOLO para la página de contacto.
// No interfiere con script.js (navbar + hamburger).

document.addEventListener("DOMContentLoaded", () => {
  const DEST_SHORT_URL = "https://maps.app.goo.gl/GGwMKSTcUmfTmZVU6";

  // Eliminar formulario si quedó en el HTML viejo
  const oldForm = document.getElementById("formContacto");
  if (oldForm) oldForm.remove();

  // Eliminar botón "Cómo llegar" antiguo si existe
  const oldDirectionsBtn = document.getElementById("btn-directions");
  if (oldDirectionsBtn) oldDirectionsBtn.remove();

  // Botón único: abrir Google Maps
  const btnOpenMaps = document.getElementById("btn-open-maps");
  if (btnOpenMaps) {
    // Click normal
    btnOpenMaps.addEventListener("click", (ev) => {
      ev.preventDefault();
      window.open(DEST_SHORT_URL, "_blank", "noopener,noreferrer");
    });

    // Activación por teclado (Enter / Space)
    btnOpenMaps.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter" || ev.key === " " || ev.key === "Spacebar") {
        ev.preventDefault();
        btnOpenMaps.click();
      }
    });
  }
});
