fetch("../HTML/footer.html")
  .then(response => response.text())
  .then(html => {
    document.getElementById("footer").innerHTML = html;
  })
  .catch(error => {
    console.error("Error al cargar el footer:", error);
  });