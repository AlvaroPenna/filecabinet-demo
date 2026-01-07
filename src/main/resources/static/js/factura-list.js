const API_URL = '/api/facturas';

document.addEventListener('DOMContentLoaded', () => {
    cargarFacturas();
});

function irANuevaFactura() {
    // Redirige a tu página de crear factura (ajusta el nombre del archivo si es distinto)
    window.location.href = 'factura-form.html'; 
}

async function cargarFacturas() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Error al cargar facturas');
        
        const facturas = await response.json();
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

        // Formatear precio (ej: 1.200,50 €)
        const totalFormateado = new Intl.NumberFormat('es-ES', { 
            style: 'currency', 
            currency: 'EUR' 
        }).format(factura.total_neto);

        // Formatear fecha (ej: 25/01/2025)
        const fechaFormateada = new Date(factura.fechaEmision).toLocaleDateString('es-ES');

        row.innerHTML = `
            <td>${factura.numFactura}</td>
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
    // Redirige al formulario pasando el ID en la URL
    window.location.href = `factura-form.html?id=${id}`;
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
            // Si se borró bien, recargamos la tabla
            cargarFacturas();
            // alert('Factura eliminada');
        } else {
            alert('Error al eliminar la factura');
        }
    } catch (error) {
        console.error(error);
        alert('Error de conexión');
    }
}

function descargarPdf(id) {
     window.open(`${API_URL}/${id}/pdf`, '_blank');
}