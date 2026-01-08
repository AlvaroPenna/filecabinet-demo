function volverAlIndex() {
    window.location.href = "/index";
}
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('trabajador-form').addEventListener('submit', function (event) {
        event.preventDefault();

        const nombre = document.getElementById('nombre').value;
        const apellidos = document.getElementById('apellidos').value;
        const nif = document.getElementById('nif').value;
        const email = document.getElementById('email').value;
        const tel = document.getElementById('tel').value;
        const direccion = document.getElementById('direccion').value;
        const ciudad = document.getElementById('ciudad').value;
        const codigoPostal = document.getElementById('codigoPostal').value;

        const trabajadorData = {
            nombre: nombre,
            apellidos: apellidos,
            nif: nif,
            telefono: tel,
            email: email,
            direccion: direccion,
            ciudad: ciudad,
            codigoPostal: codigoPostal
        };

        fetch('http://localhost:8080/api/trabajadores', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(trabajadorData)
        })
            .then(response => {
                if (response.ok) {
                    alert('Trabajador guardado con éxito! ✅');
                    document.getElementById('trabajador-form').reset();
                } else {
                    if (response.status === 409) {
                        // 2. Intentar leer el cuerpo de la respuesta para obtener el mensaje específico
                        return response.json()
                            .then(errorBody => {
                                // Mostrar el mensaje de error específico (ej: "La factura con número X ya ha sido registrada.")
                                alert('⚠️ Error de Duplicado: ' + errorBody.error);
                                console.error('Error de servidor (409 Conflict):', errorBody.error);
                                document.getElementById('trabajador-form').reset();
                            })
                            .catch(() => {
                                // Manejar si la respuesta 409 no tiene un cuerpo JSON válido
                                alert('Error: El empleado ya fue registrado. (Código 409)');
                            });
                    }

                    // 3. Si es otro error general de servidor (400, 500, etc.)
                    else {
                        // Para otros errores, lee el texto del estado HTTP si no puedes leer el cuerpo
                        console.error('Error al guardar el empleado:', response.status, response.statusText);
                        alert(`Error al guardar el empleado (Código ${response.status}). Por favor, revisa los datos.`);
                        document.getElementById('trabajador-form').reset();
                    }
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Ocurrió un error al conectar con el servidor.');
            });
    });
});