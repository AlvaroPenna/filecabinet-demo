function volverAlIndex() {
    window.location.href = "/index";
}
document.addEventListener('DOMContentLoaded', () => {

    cargarClientes();

    document.getElementById('proyecto-form').addEventListener('submit', function (event) {
        event.preventDefault();

        const nombre = document.getElementById('nombre').value;
        const direccion = document.getElementById('direccion').value;
        const ciudad = document.getElementById('ciudad').value;
        const codigoPostal = document.getElementById('codigoPostal').value;
        const fechaInicio = document.getElementById('fechaInicio').value;
        const fechaFin = document.getElementById('fechaFin').value;
        const clienteId = document.getElementById('cliente_id').value;

        const proyectoData = {
            nombre: nombre,
            direccion: direccion,
            ciudad: ciudad,
            codigoPostal: codigoPostal,
            fechaInicio: fechaInicio,
            fechaFin: fechaFin,
            cliente_id: clienteId ? parseInt(clienteId) : null
        };

        fetch('http://localhost:8080/api/proyectos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(proyectoData)
        })
            .then(response => {
                if (response.ok) {
                    alert('Proyecto guardado con éxito! ✅');
                    document.getElementById('proyecto-form').reset();
                } else {
                    if (response.status === 409) {
                        // 2. Intentar leer el cuerpo de la respuesta para obtener el mensaje específico
                        return response.json()
                            .then(errorBody => {
                                // Mostrar el mensaje de error específico (ej: "La factura con número X ya ha sido registrada.")
                                alert('⚠️ Error de Duplicado: ' + errorBody.error);
                                console.error('Error de servidor (409 Conflict):', errorBody.error);
                                document.getElementById('proyecto-form').reset();
                            })
                            .catch(() => {
                                // Manejar si la respuesta 409 no tiene un cuerpo JSON válido
                                alert('Error: El proyecto ya fue registrado. (Código 409)');
                            });
                    }

                    // 3. Si es otro error general de servidor (400, 500, etc.)
                    else {
                        // Para otros errores, lee el texto del estado HTTP si no puedes leer el cuerpo
                        console.error('Error al guardar el proyecto:', response.status, response.statusText);
                        alert(`Error al guardar el proyecto (Código ${response.status}). Por favor, revisa los datos.`);
                        document.getElementById('proyecto-form').reset();
                    }
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Ocurrió un error al conectar con el servidor.');
            });
    });
});

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