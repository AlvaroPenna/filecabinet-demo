document.addEventListener("DOMContentLoaded", () => {
    // Seleccionar el contenedor principal de los enlaces
    const navGroup = document.querySelector('.nav-group');
    
    // Verificar si el grupo de navegación existe en el DOM
    if (navGroup) {
        // Añadir un único listener al contenedor (delegación de eventos)
        navGroup.addEventListener('click', handleNavigation);
    } else {
        console.error("No se encontró el contenedor de navegación con clase 'nav-group'.");
    }
});

function handleNavigation(event) {
    // 1. Verificar si el elemento clickeado es un botón de navegación
    const target = event.target;
    if (!target.classList.contains('btn-submit')) {
        return; // Ignorar clics que no sean en los botones
    }

    // 2. Detener la acción por defecto del enlace (que es navegar a href="#")
    event.preventDefault();

    // 3. Obtener el ID del botón, que usaremos como base para la URL
    const id = target.id;
    
    let targetUrl = '';

    // 4. Determinar la ruta a la que debe ir el usuario
    switch (id) {
        case 'gastos':
            targetUrl = '/gasto/list';
            break;
        case 'presupuestos':
            targetUrl = '/presupuesto/list';
            break;
        case 'clientes':
            targetUrl = '/cliente/new';
            break;
        case 'facturas':
            targetUrl = '/factura/list';
            break;
        case 'trabajador':
            targetUrl = '/empleado/new';
            break;
        case 'proyecto':
            targetUrl = '/proyecto/new';
            break;
        case 'horas':
            targetUrl = '/proyectoEmpleado/new';
            break;
        case 'salir':
            // Esta es la ruta especial para el logout (POST)
            handleLogout(); 
            return; // No redirigimos aquí, la función handleLogout lo hará
        default:
            console.error(`ID de botón no reconocido: ${id}`);
            return;
    }

    // 5. Redirigir al usuario
    if (targetUrl) {
        window.location.href = targetUrl;
    }
}

// ----------------------------------------------------
// Función específica para el manejo del Cerrar Sesión (Logout)
// ----------------------------------------------------
async function handleLogout() {
    const logoutUrl = '/logout'; // Ruta configurada en Spring Security para cerrar sesión

    // Opcional: Mostrar un mensaje o deshabilitar el botón de salir
    const salirButton = document.getElementById('salir');
    if (salirButton) {
         salirButton.textContent = 'Cerrando...';
         salirButton.disabled = true;
    }

    try {
        // Usamos POST para el logout, que es el método por defecto y más seguro en Spring Security
        await fetch(logoutUrl, {
            method: 'POST',
            // Si usas CSRF, asegúrate de incluir el token aquí
        });

        // Spring Security maneja la invalidación de la sesión y la redirección
        // Si el fetch es exitoso, asumimos que Spring Security redirigirá a /login?logout
        // Forzamos la redirección por si acaso, aunque Spring Security ya debería haberlo hecho.
        window.location.href = '/login?logout'; 

    } catch (error) {
        console.error('Error durante el cierre de sesión:', error);
        alert('Error de red al intentar cerrar la sesión. Intente nuevamente.');
        
        // Restaurar el botón si hay un error de red
        if (salirButton) {
            salirButton.textContent = 'Cerrar Sesión';
            salirButton.disabled = false;
        }
    }
}