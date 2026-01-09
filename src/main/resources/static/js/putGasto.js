const API_URL = '/api/gastos';
// Variables globales para listas
let listaClientes = [];
let listaProyectos = [];

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const idGasto = urlParams.get('id');

    // Validación básica
    if (!idGasto) {
        alert("No se ha especificado ningún gasto para editar.");
        window.location.href = '/gasto/list'; // Ajusta la ruta a tu listado
        return;
    }

    // Cambiar título visualmente
    const titulo = document.querySelector('h2');
    if (titulo) titulo.textContent = `Editando Gasto #${idGasto}`;

    try {
        // 1. Cargar listas auxiliares (Clientes y Proyectos)
        await Promise.all([cargarClientes(), cargarProyectos()]);

        // 2. Cargar los datos del gasto
        await cargarDatosGasto(idGasto);

    } catch (error) {
        console.error("Error en la carga inicial:", error);
        alert("Error al cargar los datos necesarios.");
    }

    // Listener para el envío del formulario
    const form = document.getElementById('gasto-form');
    if (form) form.addEventListener('submit', enviarEdicion);
});

// ==========================================
// CARGA DE LISTAS (Igual que en facturas)
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

            // Listener input manual para asignar ID oculto
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

            // Listener input manual para asignar ID oculto
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
// CARGA DE DATOS DEL GASTO (GET)
// ==========================================
async function cargarDatosGasto(id) {
    const response = await fetch(`${API_URL}/${id}`);
    if (!response.ok) throw new Error('Error al cargar el gasto');

    const gasto = await response.json();
    console.log("Gasto recuperado:", gasto);

    // 1. Campos de texto simples
    document.getElementById('proveedor').value = gasto.proveedor;
    document.getElementById('numero').value = gasto.numGasto || gasto.numero; // Ajusta según tu DTO (numGasto o numero)
    
    // El importe base (sin IVA). 
    // Si tu backend guarda "total_neto" como base imponible, úsalo aquí.
    // Usamos replace para asegurar formato con punto si viene como string
    const importeBase = gasto.total_neto || gasto.importe || 0; 
    document.getElementById('importe_sin_iva').value = parseFloat(importeBase).toFixed(2);

    // 2. Fechas
    const fechaRaw = gasto.fecha || gasto.fechaEmision;
    if (fechaRaw) {
        document.getElementById('fechaEmision').value = new Date(fechaRaw).toISOString().split('T')[0];
    }

    // 3. Cliente (Cruce de datos)
    const clienteId = gasto.cliente?.id || gasto.clienteId || gasto.cliente_id;
    if (clienteId) {
        document.getElementById('cliente_id').value = clienteId;
        const cliObj = listaClientes.find(c => c.id === clienteId);
        if (cliObj) {
            document.getElementById('cliente').value = `${cliObj.nombre} ${cliObj.apellidos || ''}`.trim();
        }
    }

    // 4. Proyecto (Cruce de datos)
    const proyectoId = gasto.proyecto?.id || gasto.proyectoId || gasto.proyecto_id;
    if (proyectoId) {
        document.getElementById('proyecto_id').value = proyectoId;
        const proObj = listaProyectos.find(p => p.id === proyectoId);
        if (proObj) {
            document.getElementById('proyecto').value = proObj.nombre;
        }
    }

    // 5. Radio Buttons de IVA
    const ivaVal = gasto.tipoIva || gasto.tipo_iva || 21;
    const radio = document.querySelector(`input[name="tipo_iva"][value="${parseInt(ivaVal)}"]`);
    if (radio) radio.checked = true;
}

// ==========================================
// ENVÍO DE EDICIÓN (PUT)
// ==========================================
async function enviarEdicion(e) {
    e.preventDefault();
    
    // Cambiar texto botón para feedback
    const btnSubmit = document.querySelector('.btn-submit');
    const textoOriginal = btnSubmit.textContent;
    btnSubmit.textContent = 'Guardando...';
    btnSubmit.disabled = true;

    const urlParams = new URLSearchParams(window.location.search);
    const idGasto = urlParams.get('id');

    // 1. Obtener valores y calcular totales
    // Convertimos la coma a punto por si el usuario la usó
    const importeSinIvaStr = document.getElementById('importe_sin_iva').value.replace(',', '.');
    const importeSinIva = parseFloat(importeSinIvaStr) || 0;

    const radioIva = document.querySelector('input[name="tipo_iva"]:checked');
    const tipoIva = radioIva ? parseFloat(radioIva.value) : 21;

    // Cálculos
    const totalIva = importeSinIva * (tipoIva / 100);
    const totalConIva = importeSinIva + totalIva;

    // 2. Construir objeto JSON
    const gastoData = {
        id: parseInt(idGasto),
        proveedor: document.getElementById('proveedor').value,
        numGasto: document.getElementById('numero').value, // O 'numero', según tu Backend
        fechaEmision: document.getElementById('fechaEmision').value,
        
        // Relaciones
        cliente_id: parseInt(document.getElementById('cliente_id').value) || null,
        proyecto_id: parseInt(document.getElementById('proyecto_id').value) || null,

        // Económicos
        // Asumo que 'total_neto' es la Base Imponible y 'total' es el final
        // Ajusta los nombres de las claves según tu GastoDto en Java
        total_neto: importeSinIva,  // Base Imponible
        total_iva: totalIva,        // Cuota IVA
        total: totalConIva,         // Total a Pagar
        tipo_iva: tipoIva
    };

    try {
        const response = await fetch(`${API_URL}/${idGasto}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(gastoData)
        });

        if (!response.ok) throw new Error("Error al actualizar el gasto");

        alert("Gasto actualizado correctamente.");
        window.location.href = '/gasto/list'; // Redirige al listado

    } catch (error) {
        console.error("Error al guardar:", error);
        alert("Hubo un error al guardar los cambios.");
    } finally {
        btnSubmit.textContent = textoOriginal;
        btnSubmit.disabled = false;
    }
}

function volverAlIndex() {
    window.location.href = '/gasto/list';
}