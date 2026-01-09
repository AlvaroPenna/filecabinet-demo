const API_URL = '/api/presupuestos';
let listaClientes = [];
let listaProyectos = [];
let detailCounter = 0;

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const idPresupuesto = urlParams.get('id');

    // Validación básica
    if (!idPresupuesto) {
        alert("No se ha especificado ningún presupuesto para editar.");
        window.location.href = '/presupuesto/list';
        return;
    }

    // Cambiar título visualmente
    const titulo = document.querySelector('h2');
    if (titulo) titulo.textContent = `Editando Presupuesto #${idPresupuesto}`;

    try {
        // 1. Cargar listas auxiliares
        await Promise.all([cargarClientes(), cargarProyectos()]);

        // 2. Cargar el presupuesto
        await cargarDatosPresupuesto(idPresupuesto);

    } catch (error) {
        console.error("Error en la carga inicial:", error);
        alert("Error al cargar los datos necesarios.");
    }

    // --- Listeners de Eventos ---
    const btnAdd = document.getElementById('btnAddDetail');
    if(btnAdd) btnAdd.addEventListener('click', () => agregarFilaDetalle());

    // Listener para el cambio de IVA
    document.querySelectorAll('input[name="tipo_iva"]').forEach(r => {
        r.addEventListener('change', calculateGrandTotal);
    });

    const form = document.getElementById('presupuestoForm'); 
    if(form) form.addEventListener('submit', enviarEdicion);
});

// ==========================================
// CARGA DE LISTAS
// ==========================================

function cargarClientes() {
    return fetch('/api/clientes')
        .then(r => r.json())
        .then(clientes => {
            listaClientes = clientes;
            const datalist = document.getElementById('lista-clientes');
            datalist.innerHTML = '';
            clientes.forEach(c => {
                const opt = document.createElement('option');
                opt.value = `${c.nombre} ${c.apellidos || ''}`.trim();
                datalist.appendChild(opt);
            });
            
            // Listener input manual
            const inputVisible = document.getElementById('cliente');
            const inputHidden = document.getElementById('cliente_id');
            inputVisible.addEventListener('input', function() {
                const val = this.value;
                const found = clientes.find(c => `${c.nombre} ${c.apellidos || ''}`.trim() === val);
                inputHidden.value = found ? found.id : '';
            });
        });
}

function cargarProyectos() {
    return fetch('/api/proyectos')
        .then(r => r.json())
        .then(proyectos => {
            listaProyectos = proyectos;
            const datalist = document.getElementById('lista-proyectos');
            datalist.innerHTML = '';
            proyectos.forEach(p => {
                const opt = document.createElement('option');
                opt.value = p.nombre;
                datalist.appendChild(opt);
            });

            const inputVisible = document.getElementById('proyecto');
            const inputHidden = document.getElementById('proyecto_id');
            inputVisible.addEventListener('input', function() {
                const val = this.value;
                const found = proyectos.find(p => p.nombre === val);
                inputHidden.value = found ? found.id : '';
            });
        });
}

// ==========================================
// CARGA DE DATOS (GET)
// ==========================================
async function cargarDatosPresupuesto(id) {
    const response = await fetch(`${API_URL}/${id}`);
    if (!response.ok) throw new Error('Error al cargar el presupuesto');

    const presupuesto = await response.json();
    console.log("Presupuesto recuperado:", presupuesto);

    // A. Cabecera
    if(document.getElementById('numPresupuesto')) {
        document.getElementById('numPresupuesto').value = presupuesto.numPresupuesto;
    } else if (document.getElementById('numero')) {
         document.getElementById('numero').value = presupuesto.numPresupuesto;
    }

    if (presupuesto.fechaEmision) {
        document.getElementById('fechaEmision').value = new Date(presupuesto.fechaEmision).toISOString().split('T')[0];
    }
    
    // Fecha Aceptación (si existe)
    if (presupuesto.fechaAceptacion && document.getElementById('fechaAceptacion')) {
        document.getElementById('fechaAceptacion').value = new Date(presupuesto.fechaAceptacion).toISOString().split('T')[0];
    }
    
    // Estado de aceptación
    if(document.getElementById('estadoAceptacion') && presupuesto.estadoAceptacion) {
        document.getElementById('estadoAceptacion').value = presupuesto.estadoAceptacion;
    }

    // B. Cliente
    const clienteId = presupuesto.cliente?.id || presupuesto.clienteId || presupuesto.cliente_id;
    if (clienteId) {
        document.getElementById('cliente_id').value = clienteId;
        const cliObj = listaClientes.find(c => c.id === clienteId);
        if (cliObj) {
            document.getElementById('cliente').value = `${cliObj.nombre} ${cliObj.apellidos || ''}`.trim();
        }
    }

    // C. Proyecto
    const proyectoId = presupuesto.proyecto?.id || presupuesto.proyectoId || presupuesto.proyecto_id;
    if (proyectoId) {
        document.getElementById('proyecto_id').value = proyectoId;
        const proObj = listaProyectos.find(p => p.id === proyectoId);
        if (proObj) {
            document.getElementById('proyecto').value = proObj.nombre;
        }
    }
    
    // D. IVA (Eliminado descuento aquí)
    const ivaVal = presupuesto.tipoIva || presupuesto.tipo_iva || 21;
    const radio = document.querySelector(`input[name="tipo_iva"][value="${parseInt(ivaVal)}"]`);
    if (radio) radio.checked = true;

    // E. Detalles
    const container = document.getElementById('detallesContainer');
    container.innerHTML = ''; 

    if (presupuesto.detalles && presupuesto.detalles.length > 0) {
        presupuesto.detalles.forEach(detalle => {
            agregarFilaDetalle(detalle);
        });
    } else {
        agregarFilaDetalle(); 
    }

    calculateGrandTotal();
}

// ==========================================
// GESTIÓN DE TABLA Y CÁLCULOS
// ==========================================
function agregarFilaDetalle(datos = null) {
    detailCounter++;
    const container = document.getElementById('detallesContainer');
    
    const div = document.createElement('div');
    div.className = 'detalle-item';
    div.setAttribute('data-index', detailCounter);

    const valId = datos ? datos.id : ''; 
    const valTrabajo = datos ? (datos.trabajo || '') : '';
    const valDesc = datos ? (datos.descripcion || '') : '';
    const valCant = datos ? datos.cantidad : '';
    const valPrecio = datos ? datos.precioUnitario : '';
    const valSub = datos ? (datos.subTotal || datos.subtotal) : '';

    div.innerHTML = `
        <input type="hidden" name="detalle-id-${detailCounter}" value="${valId}">

        <div class="form-group">
            <label>Trabajo:</label>
            <input type="text" name="detalle-trabajo-${detailCounter}" value="${valTrabajo}">
        </div>
        <div class="form-group">
            <label>Descripción:</label>
            <input type="text" name="detalle-descripcion-${detailCounter}" value="${valDesc}">
        </div>
        <div class="form-group fila-calculos">
            <div class="columna-dato">
                <label>Cantidad:</label>
                <input type="number" name="detalle-cantidad-${detailCounter}" class="input-calc" value="${valCant}" step="0.01">
            </div>
            <div class="columna-dato">
                <label>Precio Unit.:</label>
                <input type="number" name="detalle-precioUnitario-${detailCounter}" class="input-calc" value="${valPrecio}" step="0.01">
            </div>
            <div class="columna-dato">
                <label>Subtotal:</label>
                <input type="number" name="detalle-subtotal-${detailCounter}" value="${valSub}" readonly>
            </div>
            <div class="form-group detail-actions" style="text-align: right; margin-top:23px">
                <button type="button" class="btn-delete-detail" style="background: #e74c3c; color: white; border: none; padding: 5px 10px; cursor: pointer;">X</button>
            </div>
        </div>
        <hr>
    `;

    div.querySelector('.btn-delete-detail').onclick = () => {
        div.remove();
        calculateGrandTotal();
    };

    container.appendChild(div);
    addCalculationListeners(div);
}

function addCalculationListeners(row) {
    const inputs = row.querySelectorAll('.input-calc');
    inputs.forEach(input => {
        input.addEventListener('input', () => calculateDetailTotal(row));
    });
}

function calculateDetailTotal(row) {
    const cantInput = row.querySelector('[name*="detalle-cantidad"]');
    const precInput = row.querySelector('[name*="detalle-precioUnitario"]');
    const subInput = row.querySelector('[name*="detalle-subtotal"]');

    const cant = parseFloat(cantInput.value) || 0;
    const prec = parseFloat(precInput.value) || 0;
    const sub = cant * prec;
    
    subInput.value = sub.toFixed(2); 
    calculateGrandTotal();
}

function calculateGrandTotal() {
    let sumaSubtotales = 0;
    document.querySelectorAll('.detalle-item').forEach(row => {
        const subInput = row.querySelector('[name*="detalle-subtotal"]');
        sumaSubtotales += parseFloat(subInput.value) || 0;
    });

    // Sin descuento, la base imponible es la suma de subtotales
    const baseImponible = sumaSubtotales;

    const radioIva = document.querySelector('input[name="tipo_iva"]:checked');
    const pctIva = radioIva ? parseFloat(radioIva.value) : 21;
    
    const totalIva = baseImponible * (pctIva / 100);
    const totalFinal = baseImponible + totalIva;

    document.getElementById('total_bruto').value = totalFinal.toFixed(2);
}

// ==========================================
// ENVÍO DE DATOS (PUT)
// ==========================================
async function enviarEdicion(e) {
    e.preventDefault();
    const messageElement = document.getElementById('message');
    if(messageElement) messageElement.textContent = 'Guardando cambios...';

    const urlParams = new URLSearchParams(window.location.search);
    const idPresupuesto = urlParams.get('id');

    // 1. Recoger Detalles
    const detalles = [];
    document.querySelectorAll('.detalle-item').forEach(row => {
        const idInput = row.querySelector('[name*="detalle-id"]');
        const idDetalle = (idInput && idInput.value !== '') ? parseInt(idInput.value) : null;

        const trabajo = row.querySelector('[name*="detalle-trabajo"]')?.value;
        const desc = row.querySelector('[name*="detalle-descripcion"]')?.value;
        const cant = parseFloat(row.querySelector('[name*="detalle-cantidad"]')?.value) || 0;
        const prec = parseFloat(row.querySelector('[name*="detalle-precioUnitario"]')?.value) || 0;
        const sub = parseFloat(row.querySelector('[name*="detalle-subtotal"]')?.value) || 0;

        if (desc || trabajo || sub > 0) {
            detalles.push({
                id: idDetalle, 
                trabajo: trabajo,
                descripcion: desc,
                cantidad: cant,
                precioUnitario: prec,
                subTotal: sub
            });
        }
    });

    // 2. Recoger Totales (Sin descuento)
    const totalFinal = parseFloat(document.getElementById('total_bruto').value) || 0;
    const radioIva = document.querySelector('input[name="tipo_iva"]:checked');
    const pctIva = radioIva ? parseFloat(radioIva.value) : 21;

    // Cálculo inverso para sacar base imponible y total IVA
    const baseImponible = totalFinal / (1 + (pctIva / 100));
    const totalIva = totalFinal - baseImponible;

    // Obtener número de presupuesto
    let numPresupuestoVal = '';
    if(document.getElementById('numPresupuesto')) numPresupuestoVal = document.getElementById('numPresupuesto').value;
    else if(document.getElementById('numero')) numPresupuestoVal = document.getElementById('numero').value;

    // 3. Construir JSON (Sin campo descuento)
    const presupuestoData = {
        id: parseInt(idPresupuesto),
        numPresupuesto: numPresupuestoVal,
        fechaEmision: document.getElementById('fechaEmision').value,
        cliente_id: parseInt(document.getElementById('cliente_id').value) || null,
        proyecto_id: parseInt(document.getElementById('proyecto_id').value) || null,
        
        estadoAceptacion: document.getElementById('estadoAceptacion') ? document.getElementById('estadoAceptacion').value : 'PENDIENTE',
        fechaAceptacion: document.getElementById('fechaAceptacion') ? document.getElementById('fechaAceptacion').value : null,

        total_bruto: baseImponible,  // Base imponible (Suma productos)
        total_iva: totalIva,
        total_neto: totalFinal,      // Total a pagar
        tipo_iva: pctIva,
        
        detalles: detalles
    };

    // 4. PUT
    try {
        const response = await fetch(`${API_URL}/${idPresupuesto}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(presupuestoData)
        });

        if (!response.ok) throw new Error("Error al actualizar presupuesto");

        alert("Presupuesto actualizado correctamente.");
        
        if(confirm("¿Deseas descargar el PDF/Excel actualizado?")) {
            await descargarExcel(idPresupuesto);
        }
        
        window.location.href = '/presupuesto/list';

    } catch (error) {
        console.error("Error al guardar:", error);
        if(messageElement) messageElement.textContent = 'Error al actualizar.';
        alert("Hubo un error al guardar los cambios.");
    }
}

async function descargarExcel(id) {
    const link = document.createElement('a');
    link.href = `${API_URL}/exportar-excel/${id}`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    link.remove();
}

function volverAlIndex() {
    window.location.href = "/presupuesto/list";
}