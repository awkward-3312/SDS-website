document.addEventListener("DOMContentLoaded", function () {
  // Enlace corto a Google Maps (abre la app en móviles)
  const DEST_SHORT_URL = "https://maps.app.goo.gl/GGwMKSTcUmfTmZVU6";

  // Eliminamos formulario si por algún motivo sigue en DOM
  const form = document.getElementById("formContacto");
  if (form) form.remove();

  // Quitamos cualquier botón antiguo "Cómo llegar" por si quedó en el HTML
  const oldDirections = document.getElementById("btn-directions");
  if (oldDirections) oldDirections.remove();

  // Handler botón único: abrir la ficha en Google Maps
  const btnOpenMaps = document.getElementById("btn-open-maps");
  if (btnOpenMaps) {
    btnOpenMaps.addEventListener("click", function (e) {
      e.preventDefault();
      window.open(DEST_SHORT_URL, "_blank", "noopener,noreferrer");
    });

    // Soporte teclado: Enter / Space
    btnOpenMaps.addEventListener("keydown", function (ev) {
      if (ev.key === "Enter" || ev.key === " ") {
        ev.preventDefault();
        btnOpenMaps.click();
      }
    });
  }
});
