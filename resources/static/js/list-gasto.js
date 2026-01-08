const API_URL = '/api/gastos';
// 1. Variables globales para guardar las listas
let listaClientes = [];
let listaProyectos = [];

document.addEventListener('DOMContentLoaded', async () => {
    // 2. Cargamos PRIMERO Clientes Y Proyectos (en paralelo)
    await Promise.all([cargarClientes(), cargarProyectos()]);
    
    // 3. Luego cargamos los gastos
    cargarGastos();

    // Activar el buscador si existe
    const inputBusqueda = document.getElementById('inputBusqueda');
    if (inputBusqueda) {
        inputBusqueda.addEventListener('keyup', filtrarTabla);
    }
});

// ==========================================
// CARGA DE DATOS AUXILIARES
// ==========================================
async function cargarClientes() {
    try {
        const response = await fetch('/api/clientes');
        if (response.ok) {
            listaClientes = await response.json();
        }
    } catch (error) {
        console.error("Error conexión clientes:", error);
    }
}

async function cargarProyectos() {
    try {
        const response = await fetch('/api/proyectos');
        if (response.ok) {
            listaProyectos = await response.json();
        }
    } catch (error) {
        console.error("Error conexión proyectos:", error);
    }
}

// ==========================================
// NAVEGACIÓN
// ==========================================
function irANuevaGasto() {
    window.location.href = '/gasto/new'; 
}

function volverAlIndex() {
    window.location.href = '/index';
}

function editarGasto(id) {
    window.location.href = `/gasto/put?id=${id}`;
}

// ==========================================
// CARGA Y RENDERIZADO DE GASTOS
// ==========================================
async function cargarGastos() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Error al cargar los gastos');
        
        const gastos = await response.json();
        renderTabla(gastos);
    } catch (error) {
        console.error(error);
        alert('No se pudieron cargar los gastos');
    }
}

function renderTabla(gastos) {
    const tbody = document.getElementById('listaGastosBody');
    const mensajeVacio = document.getElementById('mensajeVacio');
    tbody.innerHTML = '';

    if (!gastos || gastos.length === 0) {
        if(mensajeVacio) mensajeVacio.style.display = 'block';
        return;
    }

    if(mensajeVacio) mensajeVacio.style.display = 'none';

    gastos.forEach(gasto => {
        const row = document.createElement('tr');

        // 1. Formatear Precio
        const monto = gasto.total_neto || gasto.total || 0;
        const totalFormateado = new Intl.NumberFormat('es-ES', { 
            style: 'currency', 
            currency: 'EUR' 
        }).format(monto);

        // 2. Formatear Fecha
        let fechaFormateada = 'N/A';
        const fechaRaw = gasto.fecha || gasto.fechaEmision;
        if (fechaRaw) {
            fechaFormateada = new Date(fechaRaw).toLocaleDateString('es-ES');
        }

        // 3. OBTENER NOMBRE DEL CLIENTE
        const idCliente = gasto.cliente_id || (gasto.cliente ? gasto.cliente.id : null);
        let nombreCliente = '---';

        if (idCliente) {
            const clienteEncontrado = listaClientes.find(c => c.id === idCliente);
            if (clienteEncontrado) {
                nombreCliente = `${clienteEncontrado.nombre} ${clienteEncontrado.apellidos || ''}`.trim();
            } else {
                nombreCliente = 'Cliente no encontrado';
            }
        } else if (gasto.cliente && typeof gasto.cliente === 'object' && gasto.cliente.nombre) {
            nombreCliente = gasto.cliente.nombre;
        }

        // 4. OBTENER NOMBRE DEL PROYECTO (NUEVO)
        const idProyecto = gasto.proyecto_id || (gasto.proyecto ? gasto.proyecto.id : null);
        let nombreProyecto = '---';

        if (idProyecto) {
            // Buscamos en la listaProyectos cargada al inicio
            const proyectoEncontrado = listaProyectos.find(p => p.id === idProyecto);
            if (proyectoEncontrado) {
                nombreProyecto = proyectoEncontrado.nombre;
            } else {
                nombreProyecto = 'Proyecto no encontrado';
            }
        } else if (gasto.proyecto && typeof gasto.proyecto === 'object' && gasto.proyecto.nombre) {
             nombreProyecto = gasto.proyecto.nombre;
        }

        // 5. Obtener Número
        const numero = gasto.numGasto || gasto.numero || '---';

        row.innerHTML = `
            <td>${numero}</td>
            <td>${nombreCliente}</td>
            <td>${nombreProyecto}</td> <td>${fechaFormateada}</td>
            <td style="font-weight:bold;">${totalFormateado}</td>
            <td class="text-center">
                <div class="actions">
                    <button onclick="editarGasto(${gasto.id})" class="btn-icon btn-edit" title="Editar">
                        <i class="fas fa-wrench"></i>
                    </button>
                    
                    <button onclick="borrarGasto(${gasto.id})" class="btn-icon btn-delete" title="Borrar">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

async function borrarGasto(id) {
    if (!confirm('¿Estás seguro de que quieres eliminar este gasto? Esta acción no se puede deshacer.')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            cargarGastos();
        } else {
            alert('Error al eliminar el gasto');
        }
    } catch (error) {
        console.error(error);
        alert('Error de conexión');
    }
}

function filtrarTabla() {
    const input = document.getElementById('inputBusqueda');
    const filtro = input.value.toLowerCase();
    const tbody = document.getElementById('listaGastosBody');
    const filas = tbody.getElementsByTagName('tr');

    for (let i = 0; i < filas.length; i++) {
        const fila = filas[i];
        const textoFila = fila.textContent.toLowerCase();

        if (textoFila.includes(filtro)) {
            fila.style.display = '';
        } else {
            fila.style.display = 'none';
        }
    }
}