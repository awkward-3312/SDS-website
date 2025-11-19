document.getElementById("formContacto").addEventListener("submit", function(e) {
    e.preventDefault();

    document.getElementById("estado").textContent = "Mensaje enviado correctamente";
    document.getElementById("estado").style.color = "#00A7C6";

    this.reset();
});
