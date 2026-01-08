function volverAlIndex() {
        window.location.href = "/gasto/list"; 
}
document.addEventListener('DOMContentLoaded', () => {
    cargarClientes();
    cargarProyectos()
    document.getElementById('gasto-form').addEventListener('submit', function(event) {
        event.preventDefault();

        const proveedor = document.getElementById('proveedor').value;
        const fechaInput = document.getElementById('fechaEmision').value;
        const fechaEmision = new Date(fechaInput).toISOString();
        const numero = document.getElementById('numero').value;
        const importe_sin_iva = parseFloat(document.getElementById('importe_sin_iva').value);
        const tipo_iva = parseInt(document.querySelector('input[name="tipo_iva"]:checked').value);
        
        const ivaDecimal = tipo_iva / 100;
        const precioIva = importe_sin_iva * ivaDecimal;
        const precioConIva = importe_sin_iva + precioIva;

        const gastoData = {
            proveedor: proveedor,
            fechaEmision: fechaEmision,
            numGasto: numero,
            total_bruto: importe_sin_iva,
            total_iva: precioIva,
            total_neto: precioConIva,
            tipo_iva: tipo_iva,
            proyecto_id: parseInt(document.getElementById('proyecto_id').value) || null,
            cliente_id: parseInt(document.getElementById('cliente_id').value) || null,
        };
        
        fetch('http://localhost:8080/api/gastos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(gastoData)
        })
        .then(response => {
            if (response.ok) {
        alert('¡Gasto guardado con éxito! ✅');
        document.getElementById('gasto-form').reset();
    } else {
        // 1. Verificar si el status es 409 (Conflict), que usamos para duplicados
        if (response.status === 409) {
            // 2. Intentar leer el cuerpo de la respuesta para obtener el mensaje específico
            return response.json()
                .then(errorBody => {
                    // Mostrar el mensaje de error específico (ej: "La factura con número X ya ha sido registrada.")
                    alert('⚠️ Error de Duplicado: ' + errorBody.error); 
                    console.error('Error de servidor (409 Conflict):', errorBody.error);
                    document.getElementById('gasto-form').reset();
                })
                .catch(() => {
                    // Manejar si la respuesta 409 no tiene un cuerpo JSON válido
                    alert('Error: El gasto ya fue registrado. (Código 409)');
                });
        } 
        
        // 3. Si es otro error general de servidor (400, 500, etc.)
        else {
            // Para otros errores, lee el texto del estado HTTP si no puedes leer el cuerpo
            console.error('Error al guardar el gasto:', response.status, response.statusText);
            alert(`Error al guardar el gasto (Código ${response.status}). Por favor, revisa los datos.`);
            document.getElementById('gasto-form').reset();
        }
    }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Ocurrió un error al conectar con el servidor.');
        });
    });
});
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
