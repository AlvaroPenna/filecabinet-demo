document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
});

async function handleLogin(event) {
    event.preventDefault(); 
    
    const email = document.getElementById('email').value; 
    const password = document.getElementById('password').value;
    const messageBox = document.getElementById('messageBox');
    const loginButton = document.querySelector('.btn-submit');

    if (email.trim() === '' || password.trim() === '') {
        messageBox.style.color = '#e74c3c';
        messageBox.innerHTML = 'Por favor, ingrese email y contraseña.';
        return;
    }

    loginButton.disabled = true;
    loginButton.textContent = 'Accediendo...';
    messageBox.innerHTML = '';

    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    try {
        // IMPORTANTE: La URL debe coincidir con tu .loginProcessingUrl("/perform_login")
        const response = await fetch('/perform_login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData 
        });

        // 1. ÉXITO (Tu successHandler envía status 200)
        if (response.status === 200) {
            messageBox.style.color = '#27ae60';
            messageBox.innerHTML = '¡Acceso exitoso! Redirigiendo...';
            
            // Redirigimos manualmente después de un pequeño delay
            setTimeout(() => {
                window.location.href = '/index'; 
            }, 1000);

        // 2. FALLO (Tu failureHandler envía status 401)
        } else if (response.status === 401) {
            messageBox.style.color = '#e74c3c';
            messageBox.innerHTML = 'Email o contraseña incorrectos.';
            resetButton(loginButton);
            
        } else {
            messageBox.style.color = '#e74c3c';
            messageBox.innerHTML = 'Error inesperado en el servidor.';
            resetButton(loginButton);
        }

    } catch (error) {
        console.error('Error de red:', error);
        messageBox.style.color = '#e74c3c';
        messageBox.innerHTML = 'No se pudo conectar con el servidor.';
        resetButton(loginButton);
    }
}

function resetButton(button) {
    button.disabled = false;
    button.textContent = 'Ingresar';
}