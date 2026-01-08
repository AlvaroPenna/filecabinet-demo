function volverAlIndex() {
    window.location.href = "/index";
}
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('cliente-form').addEventListener('submit', function (event) {
        event.preventDefault();

        const nombre = document.getElementById('nombre').value;
        const apellidos = document.getElementById('apellidos').value;
        const cif = document.getElementById('cif').value;
        const email = document.getElementById('email').value;
        const tel = document.getElementById('tel').value;
        const direccion = document.getElementById('direccion').value;
        const ciudad = document.getElementById('ciudad').value;
        const codigoPostal = document.getElementById('codigoPostal').value;

        const clienteData = {
            nombre: nombre,
            apellidos: apellidos,
            cif: cif,
            email: email,
            telefono: tel,
            direccion: direccion,
            ciudad: ciudad,
            codigoPostal: codigoPostal
        };

        fetch('http://localhost:8080/api/clientes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(clienteData)
        })
            .then(response => {
                if (response.ok) {
                    alert('Cliente guardado con éxito! ✅');
                    document.getElementById('cliente-form').reset();
                } else {
                    if (response.status === 409) {
                        // 2. Intentar leer el cuerpo de la respuesta para obtener el mensaje específico
                        return response.json()
                            .then(errorBody => {
                                // Mostrar el mensaje de error específico (ej: "La factura con número X ya ha sido registrada.")
                                alert('⚠️ Error de Duplicado: ' + errorBody.error);
                                console.error('Error de servidor (409 Conflict):', errorBody.error);
                                document.getElementById('cliente-form').reset();
                            })
                            .catch(() => {
                                // Manejar si la respuesta 409 no tiene un cuerpo JSON válido
                                alert('Error: El cliente ya fue registrado. (Código 409)');
                            });
                    }

                    // 3. Si es otro error general de servidor (400, 500, etc.)
                    else {
                        // Para otros errores, lee el texto del estado HTTP si no puedes leer el cuerpo
                        console.error('Error al guardar el cliente:', response.status, response.statusText);
                        alert(`Error al guardar el cliente (Código ${response.status}). Por favor, revisa los datos.`);
                        document.getElementById('cliente-form').reset();
                    }
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Ocurrió un error al conectar con el servidor.');
            });
    });
});