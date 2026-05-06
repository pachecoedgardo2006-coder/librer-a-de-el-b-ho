// =============================================
// VARIABLES GLOBALES
// =============================================
let todosLosLibros  = [];
let categoriaActiva = 'todos';
let terminoBusqueda = '';
let paginaActual = 1;
const librosPorPagina = 8;


const WHATSAPP = '573003600635';

const ICONOS_CAT = {
    'Literatura Clásica'   : '📜',
    'Fantasía'             : '🧙',
    'Fantasía Épica'       : '⚔️',
    'Fantasía Juvenil'     : '✨',
    'Ficción Contemporánea': '🌆',
    'Ficción Distópica'    : '🏙️',
    'Ficción Histórica'    : '🏛️',
    'Ficción y Aventura'   : '🗺️',
    'Misterio y Thriller'  : '🔎',
    'Policiaco y Misterio' : '🕵️',
    'Terror y Suspenso'    : '👻',
    'Desarrollo Personal'  : '🌱',
    'Psicología'           : '🧠',
    'Ensayo y Filosofía'   : '💭',
    'Historia y Ciencia'   : '🔭',
    'Estrategia'           : '♟️',
    'Literatura Hispana'   : '🌺',
    'Literatura Infantil'  : '🧸',
    'Aventura y Juvenil'   : '🚀',
    'Juvenil Distópica'    : '🌀',
    'Juvenil Romántica'    : '💕',
    'Cuento y Relato'      : '📖',
    'Poesía'               : '🌸',
    'Poesía y Teatro'      : '🎭',
    'Teatro Clásico'       : '🎬',
};

// =============================================
// PARSEAR CSV (maneja comas dentro de comillas)
// =============================================
function parseCSVLine(line) {
    const cols = [];
    let cur = '', inQ = false;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') { inQ = !inQ; continue; }
        if (ch === ',' && !inQ) { cols.push(cur.trim()); cur = ''; continue; }
        cur += ch;
    }
    cols.push(cur.trim());
    return cols;
}

// =============================================
// CARGAR CATÁLOGO
// =============================================
async function cargarCatalogo() {
    try {
        const resp = await fetch('./databasebooksv2.csv');
        const texto = await resp.text();
        const filas = texto.split('\n').filter(f => f.trim()).slice(1);

        const categorias = new Set();

        filas.forEach(fila => {
            const cols = parseCSVLine(fila);
            if (cols.length >= 4) {
                const titulo    = cols[0] || '';
                const autor     = cols[1] || '';
                const precio    = cols[2] || '';
                const imagen    = cols[3] || '';
                const categoria = cols[4] || 'General';
                const disp      = cols[5] || 'Disponible';

                if (titulo) {
                    todosLosLibros.push({ titulo, autor, precio, imagen, categoria, disp });
                    if (categoria && !categoria.startsWith('img/')) categorias.add(categoria);
                }
            }
        });

        // Stat counter
        document.getElementById('statLibros').textContent = '+' + todosLosLibros.length;

        // Hero visual — 4 portadas aleatorias
        rellenarHeroVisual();

        // Categorías
        construirFiltros([...categorias].sort());
        construirChips([...categorias].sort());

        // Renderizar
        renderizarLibros();

    } catch (e) {
        console.error('Error cargando catálogo:', e);
        document.getElementById('contenedor-libros').innerHTML =
            '<p style="grid-column:1/-1;text-align:center;color:var(--gris);padding:40px">No se pudo cargar el catálogo.</p>';
    }
}

// =============================================
// HERO VISUAL
// =============================================
function rellenarHeroVisual() {
    const visual = document.getElementById('heroVisual');
    if (!visual) return;
    const muestra = [...todosLosLibros].sort(() => .5 - Math.random()).slice(0, 4);
    visual.innerHTML = `<div class="hero-book-stack">
        ${muestra.map(l => {
            const tLimpio = l.titulo.split('(')[0].split(':')[0].trim();
            const backup  = `https://covers.openlibrary.org/b/title/${encodeURIComponent(tLimpio)}-M.jpg?default=false`;
            return `<div class="hero-book-card">
                <img src="${l.imagen}" alt="${l.titulo}" loading="lazy"
                        onerror="this.onerror=null;this.src='${backup}';this.addEventListener('error',()=>this.src='https://via.placeholder.com/300x450?text=Portada')">
                <div class="hbc-info">
                    <p>${l.titulo.length > 40 ? l.titulo.substring(0,40)+'…' : l.titulo}</p>
                    <div class="hbc-price">${l.precio}</div>
                </div>
            </div>`;
        }).join('')}
    </div>`;
}

// =============================================
// CHIPS DE CATEGORÍA (sección superior)
// =============================================
function construirChips(cats) {
    const grid = document.getElementById('categoriasGrid');
    if (!grid) return;
    grid.innerHTML = cats.map(cat => `
        <a class="cat-chip" href="#catalogo" data-filter="${cat}"
            onclick="filtrarDesdeChip('${cat}')">
            <span class="cat-icon">${ICONOS_CAT[cat] || '📚'}</span>
            <span class="cat-name">${cat}</span>
        </a>
    `).join('');
}

function filtrarDesdeChip(cat) {
    categoriaActiva = cat;
    document.getElementById('buscador').value = '';
    terminoBusqueda = '';
    renderizarLibros();
    actualizarFiltrosUI();
}

// =============================================
// FILTROS BAR (encima del grid)
// =============================================
function construirFiltros(cats) {
    const bar = document.getElementById('filtrosBar');
    cats.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = 'filtro-btn';
        btn.dataset.cat = cat;
        btn.textContent = (ICONOS_CAT[cat] || '📚') + ' ' + cat;
        btn.addEventListener('click', () => {
            categoriaActiva = cat;
            terminoBusqueda = '';
            document.getElementById('buscador').value = '';
            renderizarLibros();
            actualizarFiltrosUI();
        });
        bar.appendChild(btn);
    });
}

function actualizarFiltrosUI() {
    document.querySelectorAll('.filtro-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.cat === categoriaActiva);
    });
    document.querySelectorAll('.cat-chip').forEach(c => {
        c.classList.toggle('active', c.dataset.filter === categoriaActiva);
    });
}

// =============================================
// RENDERIZAR LIBROS
// =============================================
function renderizarLibros() {
    const contenedor = document.getElementById('contenedor-libros');
    const noRes      = document.getElementById('noResultados');

    let filtrados = todosLosLibros;

    if (categoriaActiva !== 'todos') {
        filtrados = filtrados.filter(l => l.categoria === categoriaActiva);
    }

    if (terminoBusqueda) {
        const t = normalizarTexto(terminoBusqueda);
        filtrados = filtrados.filter(l =>
            normalizarTexto(l.titulo).includes(t) ||
            normalizarTexto(l.autor).includes(t)
        );
    }

    if (filtrados.length === 0) {
        contenedor.innerHTML = '';
        noRes.style.display = 'block';
        document.getElementById('paginacion').innerHTML = '';
        return;
    }

    noRes.style.display = 'none';

    // LÓGICA DE PAGINACIÓN
    const totalPaginas = Math.ceil(filtrados.length / librosPorPagina);
    const inicio = (paginaActual - 1) * librosPorPagina;
    const fin = inicio + librosPorPagina;
    const librosAMostrar = filtrados.slice(inicio, fin);

    const frag = document.createDocumentFragment();

    librosAMostrar.forEach(l => {
        const tLimpio = l.titulo.split('(')[0].split(':')[0].trim();
        const backup  = `https://covers.openlibrary.org/b/title/${encodeURIComponent(tLimpio)}-M.jpg?default=false`;
        const msg     = `Hola Buenas, me gustaría saber si tiene el libro: ${l.titulo}, está disponible en la tienda de Librería del Búho`;

        const art = document.createElement('article');
        art.className = 'card';
        art.innerHTML = `
            <img src="${l.imagen}" alt="${l.titulo}" loading="lazy"
                    onerror="this.onerror=null;this.src='${backup}';this.addEventListener('error',()=>this.src='https://via.placeholder.com/300x450?text=Sin+Portada')">
            <div class="info">
                ${l.categoria ? `<span class="card-badge">${l.categoria}</span>` : ''}
                <h3>${l.titulo}</h3>
                <p><strong>Autor:</strong> ${l.autor}</p>
                <span class="precio">${l.precio}</span>
                <a href="https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}"
                    target="_blank" class="whatsapp-btn">💬 Consultar</a>
            </div>
        `;
        frag.appendChild(art);
    });

    contenedor.innerHTML = '';
    contenedor.appendChild(frag);
    
    actualizarControlesPaginacion(totalPaginas);
}

// =============================================
// BUSCADOR OPTIMIZADO
// =============================================
document.getElementById('buscador').addEventListener('input', e => {
    // Normalizamos el término de búsqueda: minúsculas y sin espacios laterales
    terminoBusqueda = e.target.value.toLowerCase().trim();
    
    // Al buscar, reiniciamos a la primera página para evitar que el buscador 
    // se quede en una página vacía si hay pocos resultados
    paginaActual = 1; 

    if (terminoBusqueda) {
        categoriaActiva = 'todos';
        actualizarFiltrosUI();
    }
    renderizarLibros();
});

// Función auxiliar para normalizar texto (opcional pero recomendada)
// Esto permite que si buscas "magia" encuentre "Mágia"
function normalizarTexto(texto) {
    return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

// Filtro "Todos"
document.querySelector('.filtro-btn[data-cat="todos"]').addEventListener('click', () => {
    categoriaActiva = 'todos';
    terminoBusqueda = '';
    document.getElementById('buscador').value = '';
    renderizarLibros();
    actualizarFiltrosUI();
});

// =============================================
// FORMULARIO → WhatsApp
// =============================================
document.getElementById('btnEnviar').addEventListener('click', () => {
    const nombre  = document.getElementById('fNombre').value.trim();
    const tel     = document.getElementById('fTelefono').value.trim();
    const libro   = document.getElementById('fLibro').value.trim();
    const mensaje = document.getElementById('fMensaje').value.trim();

    if (!nombre && !mensaje && !libro) {
        alert('Por favor completa al menos tu nombre y mensaje.');
        return;
    }

    const txt = [
        `Hola, soy ${nombre || 'un interesado'}${tel ? ' (Tel: ' + tel + ')' : ''}.`,
        libro   ? `Busco el libro: "${libro}".` : '',
        mensaje ? mensaje : '',
        'Gracias.'
    ].filter(Boolean).join('\n');

    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(txt)}`, '_blank');

    // Mostrar confirmación
    document.getElementById('formWrap').querySelector('.form-title').style.display = 'none';
    document.querySelectorAll('.form-group, .form-row, .btn-form').forEach(el => el.style.display = 'none');
    document.getElementById('formSuccess').style.display = 'block';
});

// =============================================
// HAMBURGER NAV
// =============================================
document.getElementById('hamburger').addEventListener('click', () => {
    document.getElementById('mobileMenu').classList.toggle('open');
});

function closeMobile() {
    document.getElementById('mobileMenu').classList.remove('open');
}

// =============================================
// SCROLL ANIMATIONS
// =============================================
const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); } });
}, { threshold: 0.12 });

document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

// =============================================
// INIT
// =============================================
cargarCatalogo();


// =============================================
// FUNCION ACTUALIZAR CONTROLES
// =============================================
function actualizarControlesPaginacion(totalPaginas) {
    const contenedorPaginacion = document.getElementById('paginacion');
    if (!contenedorPaginacion) return;

    let html = '';
    
    // Botón Anterior
    html += `
        <button class="pag-btn ${paginaActual === 1 ? 'disabled' : ''}" 
                onclick="cambiarPagina(${paginaActual - 1})" 
                ${paginaActual === 1 ? 'disabled' : ''}>
            &laquo; Ant.
        </button>
    `;

    // Números de Página
    for (let i = 1; i <= totalPaginas; i++) {
        html += `
            <button class="pag-btn ${i === paginaActual ? 'active' : ''}" 
                    onclick="cambiarPagina(${i})">
                ${i}
            </button>
        `;
    }

    // Botón Siguiente
    html += `
        <button class="pag-btn ${paginaActual === totalPaginas ? 'disabled' : ''}" 
                onclick="cambiarPagina(${paginaActual + 1})" 
                ${paginaActual === totalPaginas ? 'disabled' : ''}>
            Sig. &raquo;
        </button>
    `;

    contenedorPaginacion.innerHTML = html;
}

// Función auxiliar para cambiar de página y volver arriba del catálogo
function cambiarPagina(nuevaPagina) {
    paginaActual = nuevaPagina;
    renderizarLibros();
    document.getElementById('catalogo').scrollIntoView({ behavior: 'smooth' });
}