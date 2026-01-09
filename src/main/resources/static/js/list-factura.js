const API_URL = '/api/facturas';
// Definimos las URLs para obtener los datos auxiliares
const API_URL_CLIENTES = '/api/clientes';
const API_URL_PROYECTOS = '/api/proyectos';

// Variables globales para guardar las listas
let listaClientes = [];
let listaProyectos = [];

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Cargamos Clientes y Proyectos en paralelo
    await Promise.all([cargarClientes(), cargarProyectos()]);

    // 2. Una vez cargados, pedimos las facturas
    cargarFacturas();
});

// --- FUNCIONES DE CARGA AUXILIAR ---
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
// -----------------------------------

function irANuevaFactura() {
    window.location.href = '/factura/new'; 
}

async function cargarFacturas() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Error al cargar facturas');
        
        const facturas = await response.json();
        console.log("Facturas recibidas:", facturas); // Debug
        renderTabla(facturas);
    } catch (error) {
        console.error(error);
        alert('No se pudieron cargar las facturas');
    }
}

function renderTabla(facturas) {
    const tbody = document.getElementById('listaFacturasBody');
    const mensajeVacio = document.getElementById('mensajeVacio');
    tbody.innerHTML = '';

    if (facturas.length === 0) {
        mensajeVacio.style.display = 'block';
        return;
    }

    mensajeVacio.style.display = 'none';

    facturas.forEach(factura => {
        const row = document.createElement('tr');

        // Formatear precio
        const totalFormateado = new Intl.NumberFormat('es-ES', { 
            style: 'currency', 
            currency: 'EUR' 
        }).format(factura.total_neto);

        // Formatear fecha
        const fechaFormateada = new Date(factura.fechaEmision).toLocaleDateString('es-ES');

        // --- LÓGICA DE CLIENTE (Corregida) ---
        const idCliente = factura.cliente_id || (factura.cliente ? factura.cliente.id : null);
        let nombreCliente = '---';

        // 1. Buscamos por ID en la lista cargada
        if (idCliente && listaClientes.length > 0) {
            const clienteEncontrado = listaClientes.find(c => c.id === idCliente);
            if (clienteEncontrado) {
                nombreCliente = `${clienteEncontrado.nombre} ${clienteEncontrado.apellidos || ''}`.trim();
            } else {
                nombreCliente = 'Cliente no encontrado';
            }
        } 
        // 2. Si no, miramos si el objeto cliente ya venía con nombre desde el backend
        else if (factura.cliente && factura.cliente.nombre) {
            nombreCliente = factura.cliente.nombre;
        }

        // --- LÓGICA DE PROYECTO (Corregida) ---
        const idProyecto = factura.proyecto_id || (factura.proyecto ? factura.proyecto.id : null);
        let nombreProyecto = '---';

        if (idProyecto && listaProyectos.length > 0) {
            const proyectoEncontrado = listaProyectos.find(p => p.id === idProyecto);
            if (proyectoEncontrado) {
                nombreProyecto = proyectoEncontrado.nombre;
            } 
        } 
        else if (factura.proyecto && factura.proyecto.nombre) {
             nombreProyecto = factura.proyecto.nombre;
        }

        row.innerHTML = `
            <td>${factura.numFactura}</td>
            
            <td>${nombreCliente}</td>
            <td>${nombreProyecto}</td>
            
            <td>${fechaFormateada}</td>
            <td style="font-weight:bold;">${totalFormateado}</td>
            <td><span class="badge">${factura.estadoPago || 'PENDIENTE'}</span></td>
            <td class="text-center">
                <div class="actions">
                    <button onclick="editarFactura(${factura.id})" class="btn-icon btn-edit" title="Editar">
                        <i class="fas fa-wrench"></i>
                    </button>
                    
                    <button onclick="borrarFactura(${factura.id})" class="btn-icon btn-delete" title="Borrar">
                        <i class="fas fa-times"></i>
                    </button>
                    <button onclick="descargarPdf(${factura.id})" class="btn-icon" style="color:green" title="PDF">
                        <i class="fas fa-file-pdf"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function editarFactura(id) {
    window.location.href = `/factura/put?id=${id}`;
}

async function borrarFactura(id) {
    if (!confirm('¿Estás seguro de que quieres eliminar esta factura? Esta acción no se puede deshacer.')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            cargarFacturas();
        } else {
            alert('Error al eliminar la factura');
        }
    } catch (error) {
        console.error(error);
        alert('Error de conexión');
    }
}

function volverAlIndex() {
    window.location.href = "/index"; 
}

function descargarPdf(id) {
    window.open(`${API_URL}/exportar-excel/${id}`, '_blank');
}

// Búsqueda
document.getElementById('inputBusqueda').addEventListener('keyup', function() {
    const termino = this.value.toLowerCase(); 
    const filas = document.querySelectorAll('#listaFacturasBody tr'); 

    filas.forEach(fila => {
        const textoFila = fila.textContent.toLowerCase();
        if (textoFila.includes(termino)) {
            fila.style.display = '';
        } else {
            fila.style.display = 'none';
        }
    });

    verificarSiHayResultadosVisibles();
});

function verificarSiHayResultadosVisibles() {
    const filas = document.querySelectorAll('#listaFacturasBody tr');
    const mensajeVacio = document.getElementById('mensajeVacio');
    
    const visibles = Array.from(filas).filter(fila => fila.style.display !== 'none');

    if (visibles.length === 0 && filas.length > 0) {
        mensajeVacio.style.display = 'block';
        mensajeVacio.textContent = 'No se encontraron resultados para tu búsqueda.';
    } else if (filas.length === 0) {
        mensajeVacio.style.display = 'block';
        mensajeVacio.textContent = 'No hay facturas registradas.';
    } else {
        mensajeVacio.style.display = 'none';
    }
}