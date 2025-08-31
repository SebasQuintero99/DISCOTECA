// Script para acceso secreto al panel de administración
// Para activarlo: presiona Ctrl+Shift+A en la landing page

document.addEventListener('keydown', function(event) {
    // Detectar combinación de teclas Ctrl+Shift+A
    if (event.ctrlKey && event.shiftKey && event.key === 'A') {
        event.preventDefault();
        
        // Mostrar confirmación discreta
        const isAdmin = confirm('¿Acceder al panel de administración?');
        
        if (isAdmin) {
            window.location.href = '/login.html';
        }
    }
    
    // Easter egg: Detectar secuencia "elite" (solo para diversión)
    if (!window.easterEggSequence) {
        window.easterEggSequence = '';
    }
    
    window.easterEggSequence += event.key.toLowerCase();
    
    if (window.easterEggSequence.includes('elite')) {
        console.log('🎵 Welcome to Club Élite! Access: /login.html');
        window.easterEggSequence = ''; // Reset
    }
    
    // Mantener solo los últimos 10 caracteres para evitar memoria excesiva
    if (window.easterEggSequence.length > 10) {
        window.easterEggSequence = window.easterEggSequence.slice(-10);
    }
});

// Función para desarrolladores (disponible en consola)
window.adminAccess = function() {
    window.location.href = '/login.html';
};