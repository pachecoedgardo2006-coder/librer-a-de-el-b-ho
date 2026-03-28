document.addEventListener('DOMContentLoaded', () => {
    const contenedor = document.getElementById('contenedor-libros');
    const inputBuscador = document.getElementById('buscador');

    // 1. FUNCIÓN PARA CARGAR LOS LIBROS
    async function cargarCatalogo() {
        try {
            const respuesta = await fetch('./databasebooksv2.csv');
            const datos = await respuesta.text();
            const filas = datos.split('\n').filter(f => f.trim() !== '').slice(1);
            
            contenedor.innerHTML = '';
            const fragmento = document.createDocumentFragment();

            filas.forEach((fila) => {
                const columnas = fila.split(',');
                if (columnas.length >= 4) {
                    const titulo = columnas[0].trim();
                    const autor = columnas[1].trim();
                    const precio = columnas[2].trim();
                    const imagenLocal = columnas[3].trim();

                    const article = document.createElement('article');
                    article.className = 'card';
                    
                    const tituloLimpio = titulo.split('(')[0].split(':')[0].trim();
                    const backupImage = `https://covers.openlibrary.org/b/title/${encodeURIComponent(tituloLimpio)}-M.jpg?default=false`;

                    article.innerHTML = `
                        <img src="${imagenLocal}" alt="${titulo}" loading="lazy" 
                             onerror="this.onerror=null; this.src='${backupImage}'; this.addEventListener('error', () => this.src='https://via.placeholder.com/300x450?text=Sin+Portada')">
                        <div class="info">
                            <h3>${titulo}</h3>
                            <p><strong>Autor:</strong> ${autor}</p>
                            <span class="precio">${precio}</span>
                            <a href="https://wa.me/573003600635?text=Hola Buenas, me gustaría saber si tiene el libro: ${titulo}, está disponible en la tienda de Librería del Búho" target="_blank" class="whatsapp-btn">Consultar</a>
                        </div>
                    `;
                    fragmento.appendChild(article);
                }
            });
            contenedor.appendChild(fragmento);

        } catch (error) {
            console.error("Error cargando el catálogo:", error);
        }
    }

    // 2. LÓGICA DEL BUSCADOR
    inputBuscador.addEventListener('input', () => {
        const termino = inputBuscador.value.toLowerCase();
        const tarjetas = document.querySelectorAll('.card');

        tarjetas.forEach(tarjeta => {
            const textoTitulo = tarjeta.querySelector('h3').textContent.toLowerCase();
            const textoAutor = tarjeta.querySelector('p').textContent.toLowerCase();

            if (textoTitulo.includes(termino) || textoAutor.includes(termino)) {
                tarjeta.style.display = "flex";
            } else {
                tarjeta.style.display = "none";
            }
        });
    });

    // Ejecutar la carga al iniciar
    cargarCatalogo();
});