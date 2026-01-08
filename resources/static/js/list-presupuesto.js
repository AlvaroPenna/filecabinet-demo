const API_URL = '/api/presupuestos';
// Asumimos estas rutas para clientes y proyectos
const API_URL_CLIENTES = '/api/clientes'; 
const API_URL_PROYECTOS = '/api/proyectos';

// Variables globales para guardar las listas
let listaClientes = [];
let listaProyectos = [];

document.addEventListener('DOMContentLoaded', async () => {
    // 1. PRIMERO cargamos las listas de referencia (Clientes y Proyectos)
    // Usamos Promise.all para cargarlos en paralelo y esperar a que ambos terminen
    await Promise.all([cargarClientes(), cargarProyectos()]);

    // 2. DESPUÉS cargamos los presupuestos (así ya tendremos dónde buscar los nombres)
    cargarpresupuestos();
});

// --- FUNCIONES NUEVAS PARA CARGAR DATOS AUXILIARES ---
async function cargarClientes() {
    try {
        const response = await fetch(API_URL_CLIENTES);
        if (response.ok) {
            listaClientes = await response.json();
        }
    } catch (error) {
        console.error("Error cargando clientes:", error);
    }
}

async function cargarProyectos() {
    try {
        const response = await fetch(API_URL_PROYECTOS);
        if (response.ok) {
            listaProyectos = await response.json();
        }
    } catch (error) {
        console.error("Error cargando proyectos:", error);
    }
}
// -----------------------------------------------------

function irANuevoPresupuesto() {
    window.location.href = '/presupuesto/new'; 
}

async function cargarpresupuestos() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Error al cargar los presupuestos');
        
        const presupuestos = await response.json();
        console.log("Datos recibidos de la API:", presupuestos); 
        renderTabla(presupuestos);
    } catch (error) {
        console.error(error);
        alert('No se pudieron cargar los presupuestos');
    }
}

function renderTabla(presupuestos) {
    const tbody = document.getElementById('listaPresupuestosBody');
    const mensajeVacio = document.getElementById('mensajeVacio');
    tbody.innerHTML = '';

    if (presupuestos.length === 0) {
        mensajeVacio.style.display = 'block';
        return;
    }

    mensajeVacio.style.display = 'none';

    presupuestos.forEach(presupuesto => {
        const row = document.createElement('tr');

        // Formatear precio
        const totalFormateado = new Intl.NumberFormat('es-ES', { 
            style: 'currency', 
            currency: 'EUR' 
        }).format(presupuesto.total_neto);

        // Formatear fecha
        const fechaFormateada = new Date(presupuesto.fechaEmision).toLocaleDateString('es-ES');

        // --- LÓGICA DE CLIENTE ---
        // Intentamos obtener ID, o si viene el objeto completo, el ID de dentro
        const idCliente = presupuesto.cliente_id || (presupuesto.cliente ? presupuesto.cliente.id : null);
        let nombreCliente = '---';

        // Opción A: Buscar en la lista que cargamos al inicio
        if (idCliente && listaClientes.length > 0) {
            const clienteEncontrado = listaClientes.find(c => c.id === idCliente);
            if (clienteEncontrado) {
                nombreCliente = `${clienteEncontrado.nombre} ${clienteEncontrado.apellidos || ''}`.trim();
            } else {
                nombreCliente = 'Cliente no encontrado';
            }
        } 
        // Opción B: Si la API ya traía el nombre dentro del objeto presupuesto
        else if (presupuesto.cliente && presupuesto.cliente.nombre) {
            nombreCliente = presupuesto.cliente.nombre;
        }

        // --- LÓGICA DE PROYECTO ---
        const idProyecto = presupuesto.proyecto_id || (presupuesto.proyecto ? presupuesto.proyecto.id : null);
        let nombreProyecto = '---';

        if (idProyecto && listaProyectos.length > 0) {
            const proyectoEncontrado = listaProyectos.find(p => p.id === idProyecto);
            if (proyectoEncontrado) {
                nombreProyecto = proyectoEncontrado.nombre;
            } 
        } 
        // Corregido: antes decía "gasto.proyecto", ahora es "presupuesto.proyecto"
        else if (presupuesto.proyecto && presupuesto.proyecto.nombre) {
             nombreProyecto = presupuesto.proyecto.nombre;
        }

        row.innerHTML = `
            <td>${presupuesto.numPresupuesto}</td>
            <td>${nombreCliente}</td>
            <td>${nombreProyecto}</td>
            <td>${fechaFormateada}</td>
            <td style="font-weight:bold;">${totalFormateado}</td>
            <td><span class="badge">${presupuesto.estadoAceptacion || 'PENDIENTE'}</span></td>
            <td class="text-center">
                <div class="actions">
                    <button onclick="editarPresupuesto(${presupuesto.id})" class="btn-icon btn-edit" title="Editar">
                        <i class="fas fa-wrench"></i>
                    </button>
                    <button onclick="borrarPresupuesto(${presupuesto.id})" class="btn-icon btn-delete" title="Borrar">
                        <i class="fas fa-times"></i>
                    </button>
                    <button onclick="descargarPdf(${presupuesto.id})" class="btn-icon" style="color:green" title="PDF">
                        <i class="fas fa-file-pdf"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// ... Resto de funciones (editar, borrar, pdf, busqueda) siguen igual ...
function editarPresupuesto(id) { window.location.href = `/presupuesto/put?id=${id}`; }
async function borrarPresupuesto(id) { /* ... tu código de borrar ... */ }
function descargarPdf(id) { window.open(`${API_URL}/exportar-excel/${id}`, '_blank'); }

// Búsqueda
document.getElementById('inputBusqueda').addEventListener('keyup', function() {
    const termino = this.value.toLowerCase();
    const filas = document.querySelectorAll('#listaPresupuestosBody tr');
    filas.forEach(fila => {
        const textoFila = fila.textContent.toLowerCase();
        fila.style.display = textoFila.includes(termino) ? '' : 'none';
    });
    verificarSiHayResultadosVisibles();
});

function verificarSiHayResultadosVisibles() {
    const filas = document.querySelectorAll('#listaPresupuestosBody tr');
    const mensajeVacio = document.getElementById('mensajeVacio');
    const visibles = Array.from(filas).filter(fila => fila.style.display !== 'none');
    if (visibles.length === 0 && filas.length > 0) {
        mensajeVacio.style.display = 'block';
        mensajeVacio.textContent = 'No se encontraron resultados para tu búsqueda.';
    } else if (filas.length === 0) {
        mensajeVacio.style.display = 'block';
        mensajeVacio.textContent = 'No hay presupuestos registrados.';
    } else {
        mensajeVacio.style.display = 'none';
    }
}

function volverAlIndex() {
    window.location.href = "/index"; 
}