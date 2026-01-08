const API_URL = '/api/facturas';
let listaClientes = [];
let listaProyectos = [];
let detailCounter = 0;

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const idFactura = urlParams.get('id');

    // Validación básica
    if (!idFactura) {
        alert("No se ha especificado ninguna factura para editar.");
        window.location.href = '/factura/list';
        return;
    }

    // Cambiar título visualmente
    const titulo = document.querySelector('h2');
    if (titulo) titulo.textContent = `Editando Factura #${idFactura}`;

    try {
        // IMPORTANTE: Usamos Promise.all para esperar a que carguen las listas
        await Promise.all([cargarClientes(), cargarProyectos()]);

        // Una vez tenemos las listas, cargamos la factura
        await cargarDatosFactura(idFactura);

    } catch (error) {
        console.error("Error en la carga inicial:", error);
        alert("Error al cargar los datos necesarios.");
    }

    // --- Listeners de Eventos ---
    
    // Botón añadir detalle manual
    const btnAdd = document.getElementById('btnAddDetail');
    if(btnAdd) btnAdd.addEventListener('click', () => agregarFilaDetalle());

    // Recálculo automático al cambiar descuento
    const inputDesc = document.getElementById('descuento');
    if(inputDesc) inputDesc.addEventListener('input', calculateGrandTotal);

    // Recálculo al cambiar IVA
    document.querySelectorAll('input[name="tipo_iva"]').forEach(r => {
        r.addEventListener('change', calculateGrandTotal);
    });

    // Manejo del envío del formulario (PUT)
    const form = document.getElementById('facturaForm');
    if(form) form.addEventListener('submit', enviarEdicion);
});

// ==========================================
// 3. CARGA DE LISTAS (Clientes y Proyectos)
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
// 4. CARGA DE DATOS DE LA FACTURA (GET)
// ==========================================
async function cargarDatosFactura(id) {
    const response = await fetch(`${API_URL}/${id}`);
    if (!response.ok) throw new Error('Error al cargar la factura');

    const factura = await response.json();
    console.log("Factura recuperada:", factura);

    // --- A. Cabecera ---
    document.getElementById('numero').value = factura.numFactura || factura.numero;

    if (factura.fechaEmision) {
        document.getElementById('fechaEmision').value = new Date(factura.fechaEmision).toISOString().split('T')[0];
    }

    // --- B. Cliente (Cruce de datos) ---
    const clienteId = factura.cliente?.id || factura.clienteId || factura.cliente_id;
    
    if (clienteId) {
        document.getElementById('cliente_id').value = clienteId;
        const cliObj = listaClientes.find(c => c.id === clienteId);
        if (cliObj) {
            document.getElementById('cliente').value = `${cliObj.nombre} ${cliObj.apellidos || ''}`.trim();
        }
    }

    // --- C. Proyecto (Cruce de datos) ---
    const proyectoId = factura.proyecto?.id || factura.proyectoId || factura.proyecto_id;
    
    if (proyectoId) {
        document.getElementById('proyecto_id').value = proyectoId;
        const proObj = listaProyectos.find(p => p.id === proyectoId);
        if (proObj) {
            document.getElementById('proyecto').value = proObj.nombre;
        }
    }

    // --- D. Valores económicos ---
    document.getElementById('descuento').value = factura.descuento || 0;
    
    const ivaVal = factura.tipoIva || factura.tipo_iva || 21;
    const radio = document.querySelector(`input[name="tipo_iva"][value="${parseInt(ivaVal)}"]`);
    if (radio) radio.checked = true;

    // --- E. Detalles (Líneas) ---
    const container = document.getElementById('detallesContainer');
    container.innerHTML = ''; 

    if (factura.detalles && factura.detalles.length > 0) {
        factura.detalles.forEach(detalle => {
            agregarFilaDetalle(detalle);
        });
    } else {
        agregarFilaDetalle(); 
    }

    calculateGrandTotal();
}

// ==========================================
// 5. GESTIÓN DE TABLA Y CÁLCULOS
// ==========================================

function agregarFilaDetalle(datos = null) {
    detailCounter++;
    const container = document.getElementById('detallesContainer');
    
    const div = document.createElement('div');
    div.className = 'detalle-item';
    div.setAttribute('data-index', detailCounter);

    // --- MODIFICACIÓN 1: Obtener el ID si existe ---
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
            <label>Descripción de Detalle:</label>
            <input type="text" name="detalle-descripcion-${detailCounter}" value="${valDesc}">
        </div>
        <div class="form-group fila-calculos">
            <div class="columna-dato">
                <label>Cantidad:</label>
                <input type="number" name="detalle-cantidad-${detailCounter}" class="input-calc" value="${valCant}" step="0.01">
            </div>
            <div class="columna-dato">
                <label>Precio Unitario:</label>
                <input type="number" name="detalle-precioUnitario-${detailCounter}" class="input-calc" value="${valPrecio}" step="0.01">
            </div>
            <div class="columna-dato" style="margin-bottom: 0;">
                <label>Subtotal:</label>
                <input type="number" name="detalle-subtotal-${detailCounter}" value="${valSub}" readonly>
            </div>
            <div class="form-group detail-actions" style="text-align: right; margin-top:23px">
                <button type="button" class="btn-delete-detail" style="background: #e74c3c; color: white; border: none; padding: 5px 10px; cursor: pointer;">
                    Eliminar
                </button>
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
        input.addEventListener('input', () => {
            calculateDetailTotal(row);
        });
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

    const descuentoVal = parseFloat(document.getElementById('descuento').value) || 0;
    const baseImponible = sumaSubtotales - descuentoVal;

    const radioIva = document.querySelector('input[name="tipo_iva"]:checked');
    const pctIva = radioIva ? parseFloat(radioIva.value) : 21;
    
    const totalIva = baseImponible * (pctIva / 100);
    const totalFinal = baseImponible + totalIva;

    document.getElementById('total_bruto').value = totalFinal.toFixed(2);
}

// ==========================================
// 6. ENVÍO DE DATOS (PUT)
// ==========================================
async function enviarEdicion(e) {
    e.preventDefault();
    const messageElement = document.getElementById('message');
    if(messageElement) messageElement.textContent = 'Guardando cambios...';

    // 1. Recoger ID Factura
    const urlParams = new URLSearchParams(window.location.search);
    const idFactura = urlParams.get('id');

    // 2. Recoger Detalles
    const detalles = [];
    document.querySelectorAll('.detalle-item').forEach(row => {
        // --- MODIFICACIÓN 3: Leer el ID oculto del DOM ---
        const idInput = row.querySelector('[name*="detalle-id"]');
        // Si tiene valor es un número (actualizar), si está vacío es null (insertar)
        const idDetalle = (idInput && idInput.value !== '') ? parseInt(idInput.value) : null;

        const trabajo = row.querySelector('[name*="detalle-trabajo"]')?.value;
        const desc = row.querySelector('[name*="detalle-descripcion"]')?.value;
        const cant = parseFloat(row.querySelector('[name*="detalle-cantidad"]')?.value) || 0;
        const prec = parseFloat(row.querySelector('[name*="detalle-precioUnitario"]')?.value) || 0;
        const sub = parseFloat(row.querySelector('[name*="detalle-subtotal"]')?.value) || 0;

        if (desc || trabajo || sub > 0) {
            detalles.push({
                id: idDetalle, // --- MODIFICACIÓN 4: Enviar el ID al backend ---
                trabajo: trabajo,
                descripcion: desc,
                cantidad: cant,
                precioUnitario: prec,
                subTotal: sub
            });
        }
    });

    // 3. Recoger Totales
    const totalFinal = parseFloat(document.getElementById('total_bruto').value) || 0;
    const descuentoDinero = parseFloat(document.getElementById('descuento').value) || 0;
    const radioIva = document.querySelector('input[name="tipo_iva"]:checked');
    const pctIva = radioIva ? parseFloat(radioIva.value) : 21;

    const baseImponible = totalFinal / (1 + (pctIva / 100));
    const totalIva = totalFinal - baseImponible;

    // 4. Construir objeto JSON
    const facturaData = {
        id: parseInt(idFactura),
        numFactura: document.getElementById('numero').value,
        fechaEmision: document.getElementById('fechaEmision').value,
        cliente_id: parseInt(document.getElementById('cliente_id').value) || null,
        proyecto_id: parseInt(document.getElementById('proyecto_id').value) || null,
        
        total_bruto: baseImponible + descuentoDinero, 
        total_iva: totalIva,
        total_neto: totalFinal, 
        tipo_iva: pctIva,
        descuento: descuentoDinero,
        
        detalles: detalles
    };

    // 5. Enviar PUT
    try {
        const response = await fetch(`${API_URL}/${idFactura}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(facturaData)
        });

        if (!response.ok) throw new Error("Error en el servidor al actualizar");

        alert("Factura actualizada correctamente.");
        
        if(confirm("¿Deseas descargar el PDF/Excel actualizado?")) {
            await descargarExcel(idFactura);
        }
        
        window.location.href = '/factura/list';

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
    window.location.href = "/factura/list";
}