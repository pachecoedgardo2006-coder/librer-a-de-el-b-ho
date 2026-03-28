document.addEventListener('DOMContentLoaded', () => {
    const contenedor = document.getElementById('contenedor-libros');

    async function cargarCatalogo() {
        try {
            const respuesta = await fetch('./databasebooksv2.csv');
            const datos = await respuesta.text();
            const filas = datos.split('\n').filter(f => f.trim() !== '').slice(1);
            
            contenedor.innerHTML = '';

            // Fragmento de documento para mejorar el rendimiento de inserción en el DOM
            const fragmento = document.createDocumentFragment();

            filas.forEach((fila) => {
                const columnas = fila.split(',');
                if (columnas.length >= 4) {
                    const [titulo, autor, precio, imagenLocal] = columnas.map(c => c.trim());

                    const article = document.createElement('article');
                    article.className = 'card';
                    
                    // Limpiamos el título para el respaldo
                    const tituloLimpio = titulo.split('(')[0].split(':')[0].trim();
                    const backupImage = `https://covers.openlibrary.org/b/title/${encodeURIComponent(tituloLimpio)}-M.jpg?default=false`;

                    article.innerHTML = `
                        <img src="${imagenLocal}" 
                             alt="${titulo}" 
                             loading="lazy" 
                             class="book-image"
                             onerror="this.onerror=null; this.src='${backupImage}'; this.addEventListener('error', () => this.src='https://via.placeholder.com/300x450?text=Sin+Portada')">
                        <div class="info">
                            <h3>${titulo}</h3>
                            <p><strong>Autor:</strong> ${autor}</p>
                            <span class="precio">${precio}</span>
                            <a href="https://wa.me/573003600635?text=Hola Muy Buenas, me gustaría comprar el libro: ${titulo}." 
                               target="_blank" class="whatsapp-btn">Consultar</a>
                        </div>
                    `;
                    fragmento.appendChild(article);
                }
            });

            contenedor.appendChild(fragmento);

        } catch (error) {
            console.error("Error:", error);
        }
    }

    cargarCatalogo();
});