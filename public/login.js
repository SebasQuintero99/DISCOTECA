// Variables globales
let isLoginMode = true;

// Referencias a elementos del DOM
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const registerLink = document.getElementById('registerLink');
const loginLink = document.getElementById('loginLink');

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    // Verificar si ya hay token
    const token = localStorage.getItem('token');
    if (token) {
        verifyToken(token);
    }

    // Cambiar entre login y registro
    registerLink.addEventListener('click', function(e) {
        e.preventDefault();
        toggleForms();
    });

    loginLink.addEventListener('click', function(e) {
        e.preventDefault();
        toggleForms();
    });

    // Submit forms
    loginForm.addEventListener('submit', handleLogin);
    registerForm.addEventListener('submit', handleRegister);
});

// Función para alternar entre formularios
function toggleForms() {
    if (isLoginMode) {
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
        isLoginMode = false;
    } else {
        registerForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
        isLoginMode = true;
    }
}

// Manejar login
async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const loginBtn = document.getElementById('loginBtn');

    // Mostrar loading
    loginBtn.innerHTML = `
        <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Iniciando sesión...
    `;
    loginBtn.disabled = true;

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            // Guardar token en localStorage
            localStorage.setItem('token', data.token);
            
            await Swal.fire({
                icon: 'success',
                title: '¡Bienvenido!',
                text: 'Inicio de sesión exitoso',
                timer: 2000,
                showConfirmButton: false
            });

            // Redirigir a la aplicación principal
            window.location.href = '/dashboard.html';
        } else {
            await Swal.fire({
                icon: 'error',
                title: 'Error de autenticación',
                text: data.error || 'Credenciales incorrectas'
            });
        }
    } catch (error) {
        await Swal.fire({
            icon: 'error',
            title: 'Error de conexión',
            text: 'No se pudo conectar con el servidor'
        });
    } finally {
        // Restaurar botón
        loginBtn.innerHTML = `
            <span class="absolute left-0 inset-y-0 flex items-center pl-3">
                <svg class="h-5 w-5 text-indigo-500 group-hover:text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"></path>
                </svg>
            </span>
            Iniciar Sesión
        `;
        loginBtn.disabled = false;
    }
}

// Manejar registro
async function handleRegister(e) {
    e.preventDefault();
    
    const username = document.getElementById('reg-username').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;

    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();

        if (response.ok) {
            await Swal.fire({
                icon: 'success',
                title: '¡Registro exitoso!',
                text: 'Ya puedes iniciar sesión con tu cuenta'
            });

            // Cambiar a formulario de login
            toggleForms();
            
            // Limpiar formularios
            registerForm.reset();
            loginForm.reset();
        } else {
            await Swal.fire({
                icon: 'error',
                title: 'Error en el registro',
                text: data.error || 'No se pudo crear la cuenta'
            });
        }
    } catch (error) {
        await Swal.fire({
            icon: 'error',
            title: 'Error de conexión',
            text: 'No se pudo conectar con el servidor'
        });
    }
}

// Verificar token válido
async function verifyToken(token) {
    try {
        const response = await fetch('/api/auth/verify', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            // Token válido, redirigir a la aplicación principal
            window.location.href = '/dashboard.html';
        } else {
            // Token inválido, eliminar de localStorage
            localStorage.removeItem('token');
        }
    } catch (error) {
        // Error de conexión, eliminar token por seguridad
        localStorage.removeItem('token');
    }
}

// Función para logout (se puede usar desde la aplicación principal)
function logout() {
    localStorage.removeItem('token');
    window.location.href = '/login.html';
}