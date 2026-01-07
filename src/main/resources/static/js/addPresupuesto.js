const API_URL = '/api/presupuestos';
let detailCounter = 1;

function calculateDetailTotal(itemRow) {
    const cantidadInput = itemRow.querySelector('[name*="detalle-cantidad"]');
    const precioInput = itemRow.querySelector('[name*="detalle-precioUnitario"]');
    const subtotalInput = itemRow.querySelector('[name*="detalle-subtotal"]');

    const cantidad = parseFloat(cantidadInput?.value) || 0;
    const precio = parseFloat(precioInput?.value) || 0;
    const subtotal = cantidad * precio;

    if (subtotalInput) {
        subtotalInput.value = subtotal.toFixed(2);
    }

    calculateGrandTotal();
}

function calculateGrandTotal() {
    let grandTotal = 0.00;
    document.querySelectorAll('.detalle-item').forEach(item => {
        const subtotalInput = item.querySelector('[name*="detalle-subtotal"]');
        if (subtotalInput) {
            grandTotal += parseFloat(subtotalInput.value) || 0.00;
        }
    });

    const totalInput = document.getElementById('total_bruto');
    if (totalInput) {
        totalInput.value = grandTotal.toFixed(2);
    }
}

function addCalculationListeners(itemRow) {
    const inputs = itemRow.querySelectorAll('[name*="detalle-cantidad"], [name*="detalle-precioUnitario"]');
    inputs.forEach(input => {
        input.addEventListener('input', () => calculateDetailTotal(itemRow));
    });
}

function addDetailRow() {
    detailCounter++;
    const container = document.getElementById('detallesContainer');
    const original = container.querySelector('.detalle-item');
    const clone = original.cloneNode(true);
    clone.setAttribute('data-index', detailCounter);
    clone.querySelectorAll('input, select').forEach(input => {
        input.value = (input.type === 'number') ? '0.00' : '';

        if (input.name) {
            const baseName = input.name.split('-').slice(0, 2).join('-');
            input.name = `${baseName}-${detailCounter}`;
        }
        if (input.id) {
            const baseId = input.id.split('-').slice(0, 2).join('-');
            input.id = `${baseId}-${detailCounter}`;
        }
    });

    let deleteBtn = clone.querySelector('.btn-delete-detail');
    if (!deleteBtn) {
        const deleteDiv = document.createElement('div');
        deleteDiv.className = 'form-group detail-actions';
        deleteDiv.style.textAlign = 'right';
        deleteDiv.innerHTML = '<button type="button" class="btn-delete-detail">Eliminar Detalle</button>';
        clone.appendChild(deleteDiv);
        deleteBtn = deleteDiv.querySelector('button');
    }

    deleteBtn.onclick = () => {
        clone.remove();
        calculateGrandTotal();
    };

    container.appendChild(clone);
    addCalculationListeners(clone);
}

const presupuestoForm = document.getElementById('presupuestoForm');
if (presupuestoForm) {
    presupuestoForm.addEventListener('submit', function (event) {
        event.preventDefault();
        const messageElement = document.getElementById('message');
        messageElement.textContent = 'Enviando...';

        const detalles = [];
        document.querySelectorAll('.detalle-item').forEach(item => {
            const trabajo = item.querySelector('[name*="detalle-trabajo"]')?.value;
            const descripcion = item.querySelector('[name*="detalle-descripcion"]')?.value;
            const cantidad = parseFloat(item.querySelector('[name*="detalle-cantidad"]')?.value) || 0;
            const precio = parseFloat(item.querySelector('[name*="detalle-precioUnitario"]')?.value) || 0;
            const subtotal = parseFloat(item.querySelector('[name*="detalle-subtotal"]')?.value) || 0;

            if (descripcion && descripcion.trim() !== "") {
                detalles.push({
                    trabajo: trabajo,
                    descripcion: descripcion,
                    cantidad: cantidad,
                    precioUnitario: precio,
                    subTotal: subtotal
                });
            }
        });

        const totalBruto = parseFloat(document.getElementById('total_bruto').value) || 0.00;
        const tipoIvaRadio = document.querySelector('input[name="tipo_iva"]:checked');
        const porcentajeIva = tipoIvaRadio ? parseFloat(tipoIvaRadio.value) : 21.00;
        const totalIva = totalBruto * (porcentajeIva / 100);
        const totalNeto = totalBruto + totalIva;

        const presuestoData = {
            numPresupuesto: document.getElementById('numero').value,
            estadoAceptacion: 'PENDIENTE',
            fechaAceptacion: null,
            fechaEmision: document.getElementById('fechaEmision').value,
            total_bruto: totalBruto,
            total_iva: totalIva,
            total_neto: totalNeto,
            tipo_iva: porcentajeIva,
            cliente_id: parseInt(document.getElementById('cliente_id').value) || null,
            proyecto_id: parseInt(document.getElementById('proyecto_id').value) || null,
            detalles: detalles
        };

        fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(presuestoData)
        })
            .then(response => {
                if (response.ok) {
                    return response.json();
                } else {
                    throw new Error("Error en el servidor");
                }
            })
            .then(async (nuevoPresupuesto) => {
                alert("Presupuesto guardado. Iniciando descarga automática del Excel...");
                await descargarExcel(nuevoPresupuesto.id);
                setTimeout(() => {
                    window.location.reload();
                }, 1000); // 1 segundo de espera
            })
            .catch(error => {
                console.error(error);
                messageElement.textContent = 'Error al guardar.';
                alert("Hubo un error al guardar el Presupuesto");
            });
    });
}

function cargarUltimoNumPresupuesto(){
    fetch('http://localhost:8080/api/presupuestos', {
        method: 'GET',
    })
    .then(response => {
        if (!response.ok) throw new Error('Error al obtener presupuestos');
        return response.json();
    })
    .then(presupuestos => {
        // 1. Obtener los últimos dos dígitos del año actual (ej: 2025 -> "25")
        const anioActual = new Date().getFullYear().toString().slice(-2);
        const prefijo = `PRP${anioActual}-`;
        
        let siguienteSecuencia = 1;

        if (presupuestos && presupuestos.length > 0) {
            // 2. Filtrar solo los presupuestos del año actual y extraer su número correlativo
            const numerosDelAnio = presupuestos
                .filter(f => f.numPresupuesto && f.numPresupuesto.startsWith(prefijo))
                .map(f => {
                    // Extraer la parte numérica después del guion (ej: "FRP25-0005" -> "0005")
                    const partes = f.numPresupuesto.split('-');
                    return parseInt(partes[1]) || 0;
                });

            // 3. Si hay presupuestos de este año, buscar la mayor y sumar 1
            if (numerosDelAnio.length > 0) {
                siguienteSecuencia = Math.max(...numerosDelAnio) + 1;
            }
        }

        // 4. Formatear con ceros a la izquierda (ej: 1 -> "0001")
        const secuenciaFormateada = siguienteSecuencia.toString().padStart(4, '0');
        const nuevoNumPresupuesto = `${prefijo}${secuenciaFormateada}`;

        // 5. Asignar al input
        const inputNumero = document.getElementById('numero');
        if (inputNumero) {
            inputNumero.value = nuevoNumPresupuesto;
        }
    })
    .catch(error => console.error('Error:', error));
}

function cargarProyectos() {
    const inputVisibleProyecto = document.getElementById('proyecto');
    const datalistProyecto = document.getElementById('lista-proyectos');
    const inputHiddenIdProyecto = document.getElementById('proyecto_id');
    fetch('http://localhost:8080/api/proyectos')
        .then(response => response.json())
        .then(proyectos =>{
            datalistProyecto.innerHTML = '';
            proyectos.forEach(proyecto =>{
                const opcion = document.createElement('option');
                opcion.value = `${proyecto.nombre}`;
                datalistProyecto.appendChild(opcion);
            });
        inputVisibleProyecto.addEventListener('input', function(){
            const valorActual = this.value;
            const proyectoEncontrado = proyectos.find(c =>
                 `${c.nombre}` === valorActual
            );
            if(proyectoEncontrado){
                inputHiddenIdProyecto.value = proyectoEncontrado.id;
            }else{
                inputHiddenIdProyecto.value = '';
            }
        });
    })
    .catch(error => console.error('Error cargando proyectos:', error));
        
}

function cargarClientes() {
    const inputVisible = document.getElementById('cliente');
    const dataList = document.getElementById('lista-clientes');
    const inputHiddenId = document.getElementById('cliente_id'); // Tu input oculto

    fetch('http://localhost:8080/api/clientes')
        .then(response => response.json())
        .then(clientes => {
            // 1. Limpiamos el datalist
            dataList.innerHTML = '';

            // 2. Llenamos el datalist
            clientes.forEach(cliente => {
                const option = document.createElement('option');
                // IMPORTANTE: Definir el formato exacto del nombre
                option.value = `${cliente.nombre} ${cliente.apellidos}`; 
                dataList.appendChild(option);
            });

            // 3. Agregamos el evento "escucha" AQUÍ MISMO.
            // Al estar dentro del .then, este evento puede "ver" la variable 'clientes'
            inputVisible.addEventListener('input', function() {
                const valorActual = this.value;

                // Buscamos en el array 'clientes' alguien con ese mismo nombre
                const clienteEncontrado = clientes.find(c => 
                    `${c.nombre} ${c.apellidos}` === valorActual
                );

                if (clienteEncontrado) {
                    // Si coincide, metemos el ID en el input oculto
                    inputHiddenId.value = clienteEncontrado.id;
                } else {
                    // Si el usuario borra o escribe un nombre que no existe, limpiamos el ID
                    inputHiddenId.value = '';
                }
            });
        })
        .catch(error => console.error('Error cargando clientes:', error));
}

document.addEventListener('DOMContentLoaded', () => {
    cargarProyectos();
    cargarClientes();
    cargarUltimoNumPresupuesto();

    const today = new Date().toISOString().split('T')[0];
    document.getElementById('fechaEmision').value = today;

    // Activar cálculos en la primera fila existente
    const primeraFila = document.querySelector('.detalle-item');
    if (primeraFila) addCalculationListeners(primeraFila);

    const btnAddDetail = document.getElementById('btnAddDetail');
    if (btnAddDetail) btnAddDetail.addEventListener('click', addDetailRow);
});

function volverAlIndex() {
    window.location.href = "/index";
}

async function descargarExcel(idPresupuesto) {
    try {
        // Llamamos al endpoint que acabamos de asegurar en el Backend
        const response = await fetch(`http://localhost:8080/api/presupuestos/exportar-excel/${idPresupuesto}`, {
            method: 'GET',
            credentials: 'include', // IMPORTANTE: Envía la cookie de sesión (usuario logueado)
        });

        if (!response.ok) {
            throw new Error('Error al descargar el Excel');
        }

        // Convertimos la respuesta binaria a un Blob
        const blob = await response.blob();

        // Creamos una URL temporal
        const url = window.URL.createObjectURL(blob);

        // Creamos el link invisible para forzar la descarga
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Presupuesto_${idPresupuesto}.xlsx`); // Extensión .xlsx

        document.body.appendChild(link);
        link.click();

        // Limpiamos
        link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(url);

        return true; // Indicamos que terminó bien

    } catch (error) {
        console.error('Fallo la descarga del Excel:', error);
        alert('El Presupuesto se guardó, pero hubo un error al descargar el Excel.');
        return false;
    }
}