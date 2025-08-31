class DiscotecaSystem {
    constructor() {
        this.currentSection = 'entrada';
        this.testModeVisible = false;
        this.init();
    }

    init() {
        this.loadClients();
        this.setupEventListeners();
        this.setupNavigation();
    }

    setupEventListeners() {
        document.getElementById('captureFingerprint').addEventListener('click', () => this.captureFingerprint());
        document.getElementById('clientForm').addEventListener('submit', (e) => this.registerClient(e));
        document.getElementById('testIdentification').addEventListener('click', () => this.testHashIdentification());
    }

    setupNavigation() {
        document.getElementById('nav-entrada').addEventListener('click', () => this.navigateTo('entrada'));
        document.getElementById('nav-registro').addEventListener('click', () => this.navigateTo('registro'));
        document.getElementById('nav-lista').addEventListener('click', () => this.navigateTo('lista'));
    }

    navigateTo(section) {
        // Remover clase active de todos los botones del sidebar
        document.querySelectorAll('.sidebar-item').forEach(btn => btn.classList.remove('active'));
        
        // Ocultar todas las secciones
        document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
        
        // Activar el botón correspondiente
        document.getElementById(`nav-${section}`).classList.add('active');
        
        // Mostrar la sección correspondiente
        document.getElementById(`${section}-section`).classList.add('active');
        
        // Actualizar el título
        const titles = {
            'entrada': 'Entrada de Clientes',
            'registro': 'Registro de Clientes',
            'lista': 'Lista de Clientes'
        };
        document.getElementById('pageTitle').textContent = titles[section];
        
        this.currentSection = section;
        
        // Si navegamos a la lista, recargar los clientes
        if (section === 'lista') {
            this.loadClients();
        }
    }

    async loadClients() {
        try {
            const response = await fetch('/api/clientes', {
                headers: getAuthHeaders()
            });
            
            if (response.status === 401) {
                logout();
                return;
            }
            
            const clients = await response.json();
            this.displayClients(clients);
        } catch (error) {
            console.error('Error cargando clientes:', error);
        }
    }

    displayClients(clients) {
        const clientsList = document.getElementById('clientsList');
        const clientCount = document.getElementById('clientCount');
        
        if (clientCount) {
            clientCount.textContent = clients.length;
        }
        
        if (clients.length === 0) {
            clientsList.innerHTML = `
                <div class="text-center py-12 text-gray-400">
                    <svg class="w-16 h-16 mx-auto mb-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"></path>
                    </svg>
                    <p class="text-lg mb-2">No hay clientes registrados</p>
                    <p class="text-sm">Dirígete a "Registro de Clientes" para agregar el primer cliente</p>
                </div>
            `;
            return;
        }
        
        clientsList.innerHTML = clients.map(client => {
            const fechaNacimiento = new Date(client.fechaNacimiento);
            const edad = new Date().getFullYear() - fechaNacimiento.getFullYear();
            
            return `
            <div class="bg-gray-700 rounded-lg p-6 hover:bg-gray-650 transition duration-200">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <div class="flex items-center gap-3 mb-3">
                            <div class="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                                <span class="text-white font-semibold text-lg">${client.nombres.charAt(0).toUpperCase()}${client.apellidos.charAt(0).toUpperCase()}</span>
                            </div>
                            <div>
                                <p class="font-semibold text-lg">${client.nombres} ${client.apellidos}</p>
                                <p class="text-sm text-gray-300">${client.correo}</p>
                                <p class="text-sm text-gray-300">Tel: ${client.telefono} | Edad: ${edad} años | ${client.sexo}</p>
                            </div>
                        </div>
                        
                        <div class="grid grid-cols-2 gap-4 text-sm text-gray-400 mb-3">
                            <div>
                                <span class="font-medium">Nacimiento:</span> ${fechaNacimiento.toLocaleDateString()}
                            </div>
                            <div>
                                <span class="font-medium">Registro:</span> ${new Date(client.fechaRegistro).toLocaleDateString()}
                            </div>
                        </div>
                        
                        ${client.huellaBiometrica ? `
                            <div class="bg-gray-800 rounded-lg p-3 mb-3">
                                <div class="flex items-center justify-between">
                                    <span class="text-xs text-gray-500 font-medium">🔒 Hash Biométrico:</span>
                                    <button onclick="navigator.clipboard.writeText('${client.huellaBiometrica}')" class="text-xs bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-white transition duration-200">
                                        Copiar
                                    </button>
                                </div>
                                <code class="text-xs text-green-400 font-mono block mt-1 break-all">${client.huellaBiometrica}</code>
                            </div>
                        ` : `
                            <div class="bg-yellow-600 bg-opacity-20 border border-yellow-600 rounded-lg p-2 mb-3">
                                <p class="text-xs text-yellow-400">⚠️ Sin huella biométrica registrada</p>
                            </div>
                        `}
                    </div>
                    
                    <div class="ml-6 text-right">
                        <span class="status-${client.estatus} px-4 py-2 rounded-full text-sm font-semibold">
                            ${client.estatus.toUpperCase()}
                        </span>
                        ${client.ultimaVisita ? `
                            <p class="text-xs text-gray-400 mt-2">
                                <span class="font-medium">Última visita:</span><br>
                                ${new Date(client.ultimaVisita).toLocaleString()}
                            </p>
                        ` : `
                            <p class="text-xs text-gray-500 mt-2">Sin visitas registradas</p>
                        `}
                        
                        <div class="flex gap-2 mt-4">
                            <button onclick="discotecaApp.editClient(${client.id})" class="bg-yellow-600 hover:bg-yellow-700 px-3 py-1 rounded text-xs font-medium transition duration-200">
                                ✏️ Editar
                            </button>
                            <button onclick="discotecaApp.deleteClient(${client.id})" class="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-xs font-medium transition duration-200">
                                🗑️ Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        }).join('');
    }

    handleScannerClick() {
        // Usar timeout para evitar conflicto con doble clic
        if (this.clickTimeout) {
            clearTimeout(this.clickTimeout);
            this.clickTimeout = null;
            return; // Es un doble clic, no ejecutar toggle
        }
        
        this.clickTimeout = setTimeout(() => {
            this.toggleTestMode();
            this.clickTimeout = null;
        }, 300); // Esperar 300ms para detectar doble clic
    }

    toggleTestMode() {
        const testModePanel = document.getElementById('testModePanel');
        
        if (this.testModeVisible) {
            // Ocultar panel de prueba con animación
            testModePanel.classList.add('test-panel-exit');
            testModePanel.classList.remove('test-panel-enter');
            
            setTimeout(() => {
                testModePanel.classList.add('hidden');
                testModePanel.classList.remove('test-panel-exit');
            }, 300);
            
            this.testModeVisible = false;
        } else {
            // Mostrar panel de prueba con animación suave
            testModePanel.classList.remove('hidden');
            testModePanel.classList.add('test-panel-enter');
            testModePanel.classList.remove('test-panel-exit');
            
            this.testModeVisible = true;
            
            // Focus en el input para mejor UX
            setTimeout(() => {
                document.getElementById('testHash').focus();
            }, 150);
        }
    }

    simulateFingerprint() {
        const scanner = document.getElementById('scannerArea');
        scanner.style.animation = 'none';
        scanner.style.background = 'radial-gradient(circle, #10b981 0%, #059669 100%)';
        
        setTimeout(async () => {
            const fingerprintHash = this.generateFingerprintHash();
            await this.identifyClient(fingerprintHash);
            
            setTimeout(() => {
                scanner.style.background = 'radial-gradient(circle, #3b82f6 0%, #1e40af 100%)';
                scanner.style.animation = 'pulse 2s infinite';
            }, 3000);
        }, 1000);
    }

    testHashIdentification() {
        const testHash = document.getElementById('testHash').value.trim();
        if (!testHash) {
            Swal.fire({
                title: 'Advertencia',
                text: 'Por favor ingresa un hash de huella para probar',
                icon: 'warning',
                confirmButtonText: 'OK'
            });
            return;
        }
        
        this.identifyClient(testHash);
        document.getElementById('testHash').value = '';
    }

    generateFingerprintHash() {
        const samples = [
            'fp_001_sample_hash',
            'fp_002_sample_hash',
            'fp_003_sample_hash',
            'fp_new_user_hash'
        ];
        return samples[Math.floor(Math.random() * samples.length)];
    }

    async identifyClient(fingerprintHash) {
        try {
            const response = await fetch('/api/identificar', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ huellaBiometrica: fingerprintHash })
            });
            
            if (response.status === 401) {
                logout();
                return;
            }

            const result = document.getElementById('identificationResult');
            const clientInfo = document.getElementById('clientInfo');

            if (response.ok) {
                const client = await response.json();
                result.classList.remove('hidden');
                
                clientInfo.innerHTML = `
                    <div class="text-center">
                        <div class="mb-4">
                            <span class="status-${client.estatus} px-4 py-2 rounded-full text-lg font-bold">
                                ${client.estatus.toUpperCase()}
                            </span>
                        </div>
                        <p class="text-lg"><strong>Correo:</strong> ${client.correo}</p>
                        <p class="text-sm text-gray-300 mt-2">Acceso registrado: ${new Date(client.ultimaVisita).toLocaleString()}</p>
                    </div>
                `;
            } else {
                result.classList.remove('hidden');
                clientInfo.innerHTML = `
                    <div class="text-center text-red-400">
                        <p class="text-lg font-semibold">❌ Cliente no encontrado</p>
                        <p class="text-sm mt-2">Esta huella no está registrada en el sistema</p>
                    </div>
                `;
            }

            setTimeout(() => {
                result.classList.add('hidden');
            }, 5000);

        } catch (error) {
            console.error('Error identificando cliente:', error);
        }
    }

    captureFingerprint() {
        const button = document.getElementById('captureFingerprint');
        const input = document.getElementById('huellaBiometrica');
        
        button.textContent = 'Capturando...';
        button.disabled = true;
        
        setTimeout(() => {
            const fingerprintHash = 'fp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            input.value = fingerprintHash;
            button.textContent = '✓ Huella Capturada';
            button.style.backgroundColor = '#059669';
            
            setTimeout(() => {
                button.textContent = 'Capturar Huella';
                button.style.backgroundColor = '#2563eb';
                button.disabled = false;
            }, 2000);
        }, 2000);
    }

    async registerClient(event) {
        event.preventDefault();
        
        const formData = {
            nombres: document.getElementById('nombres').value,
            apellidos: document.getElementById('apellidos').value,
            correo: document.getElementById('correo').value,
            telefono: document.getElementById('telefono').value,
            fechaNacimiento: document.getElementById('fechaNacimiento').value,
            sexo: document.getElementById('sexo').value,
            estatus: document.getElementById('estatus').value,
            huellaBiometrica: document.getElementById('huellaBiometrica').value
        };

        if (!formData.huellaBiometrica) {
            Swal.fire({
                title: 'Advertencia',
                text: 'Por favor captura la huella biométrica primero',
                icon: 'warning',
                confirmButtonText: 'OK'
            });
            return;
        }

        try {
            const response = await fetch('/api/clientes', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(formData)
            });
            
            if (response.status === 401) {
                logout();
                return;
            }

            if (response.ok) {
                Swal.fire({
                    title: '¡Éxito!',
                    text: 'Cliente registrado exitosamente',
                    icon: 'success',
                    confirmButtonText: 'OK'
                });
                document.getElementById('clientForm').reset();
                document.getElementById('huellaBiometrica').value = '';
                
                // Resetear el botón de captura de huella
                const captureButton = document.getElementById('captureFingerprint');
                captureButton.textContent = '🔒 Capturar Huella Biométrica';
                captureButton.style.backgroundColor = '#2563eb';
                
                // Si estamos en la sección de lista, recargar
                if (this.currentSection === 'lista') {
                    this.loadClients();
                }
                
                // Navegar automáticamente a la lista de clientes
                setTimeout(() => {
                    this.navigateTo('lista');
                }, 1000);
            } else {
                const error = await response.json();
                Swal.fire({
                    title: 'Error',
                    text: 'Error: ' + error.error,
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
            }
        } catch (error) {
            console.error('Error registrando cliente:', error);
            Swal.fire({
                title: 'Error',
                text: 'Error al registrar cliente',
                icon: 'error',
                confirmButtonText: 'OK'
            });
        }
    }

    async editClient(clientId) {
        try {
            // Obtener datos del cliente
            const response = await fetch('/api/clientes', {
                headers: getAuthHeaders()
            });
            
            if (response.status === 401) {
                logout();
                return;
            }
            
            const clients = await response.json();
            const client = clients.find(c => c.id === clientId);
            
            if (!client) {
                Swal.fire({
                    title: 'Error',
                    text: 'Cliente no encontrado',
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
                return;
            }

            // Mostrar formulario de edición
            const { value: formValues } = await Swal.fire({
                title: '✏️ Editar Cliente',
                html: `
                    <div style="text-align: left; max-width: 100%;">
                        <div style="margin-bottom: 16px;">
                            <label style="display: block; margin-bottom: 6px; color: #d1d5db; font-weight: 500; font-size: 13px;">👤 Nombres</label>
                            <input id="swal-nombres" class="swal2-input" placeholder="Nombres" value="${client.nombres}" type="text" style="margin: 0;">
                        </div>
                        
                        <div style="margin-bottom: 16px;">
                            <label style="display: block; margin-bottom: 6px; color: #d1d5db; font-weight: 500; font-size: 13px;">👥 Apellidos</label>
                            <input id="swal-apellidos" class="swal2-input" placeholder="Apellidos" value="${client.apellidos}" type="text" style="margin: 0;">
                        </div>
                        
                        <div style="margin-bottom: 16px;">
                            <label style="display: block; margin-bottom: 6px; color: #d1d5db; font-weight: 500; font-size: 13px;">📧 Correo Electrónico</label>
                            <input id="swal-correo" class="swal2-input" placeholder="ejemplo@correo.com" value="${client.correo}" type="email" style="margin: 0;">
                        </div>
                        
                        <div style="margin-bottom: 16px;">
                            <label style="display: block; margin-bottom: 6px; color: #d1d5db; font-weight: 500; font-size: 13px;">📱 Teléfono</label>
                            <input id="swal-telefono" class="swal2-input" placeholder="Número de teléfono" value="${client.telefono}" type="tel" style="margin: 0;">
                        </div>
                        
                        <div style="margin-bottom: 16px;">
                            <label style="display: block; margin-bottom: 6px; color: #d1d5db; font-weight: 500; font-size: 13px;">🎂 Fecha de Nacimiento</label>
                            <input id="swal-fecha" class="swal2-input" type="date" value="${new Date(client.fechaNacimiento).toISOString().split('T')[0]}" style="margin: 0;">
                        </div>
                        
                        <div style="margin-bottom: 16px;">
                            <label style="display: block; margin-bottom: 6px; color: #d1d5db; font-weight: 500; font-size: 13px;">👤 Sexo</label>
                            <select id="swal-sexo" class="swal2-select" style="margin: 0;">
                                <option value="masculino" ${client.sexo === 'masculino' ? 'selected' : ''}>👨 Masculino</option>
                                <option value="femenino" ${client.sexo === 'femenino' ? 'selected' : ''}>👩 Femenino</option>
                            </select>
                        </div>
                        
                        <div style="margin-bottom: 16px;">
                            <label style="display: block; margin-bottom: 6px; color: #d1d5db; font-weight: 500; font-size: 13px;">⭐ Estatus del Cliente</label>
                            <select id="swal-estatus" class="swal2-select" style="margin: 0;">
                                <option value="activo" ${client.estatus === 'activo' ? 'selected' : ''}>✅ Activo</option>
                                <option value="vip" ${client.estatus === 'vip' ? 'selected' : ''}>🌟 VIP</option>
                                <option value="suspendido" ${client.estatus === 'suspendido' ? 'selected' : ''}>❌ Suspendido</option>
                            </select>
                        </div>
                    </div>
                `,
                width: '500px',
                showCancelButton: true,
                confirmButtonText: 'Guardar',
                cancelButtonText: 'Cancelar',
                preConfirm: () => {
                    return {
                        nombres: document.getElementById('swal-nombres').value,
                        apellidos: document.getElementById('swal-apellidos').value,
                        correo: document.getElementById('swal-correo').value,
                        telefono: document.getElementById('swal-telefono').value,
                        fechaNacimiento: document.getElementById('swal-fecha').value,
                        sexo: document.getElementById('swal-sexo').value,
                        estatus: document.getElementById('swal-estatus').value,
                        huellaBiometrica: client.huellaBiometrica
                    };
                }
            });

            if (formValues) {
                // Enviar actualización
                const updateResponse = await fetch(`/api/clientes/${clientId}`, {
                    method: 'PUT',
                    headers: getAuthHeaders(),
                    body: JSON.stringify(formValues)
                });
                
                if (updateResponse.status === 401) {
                    logout();
                    return;
                }

                if (updateResponse.ok) {
                    Swal.fire({
                        title: '¡Actualizado!',
                        text: 'Cliente actualizado exitosamente',
                        icon: 'success',
                        confirmButtonText: 'OK'
                    });
                    this.loadClients();
                } else {
                    const error = await updateResponse.json();
                    Swal.fire({
                        title: 'Error',
                        text: error.error,
                        icon: 'error',
                        confirmButtonText: 'OK'
                    });
                }
            }
        } catch (error) {
            console.error('Error editando cliente:', error);
            Swal.fire({
                title: 'Error',
                text: 'Error al editar cliente',
                icon: 'error',
                confirmButtonText: 'OK'
            });
        }
    }

    async deleteClient(clientId) {
        const result = await Swal.fire({
            title: '🗑️ ¿Eliminar Cliente?',
            text: 'Esta acción no se puede deshacer. El cliente será eliminado permanentemente.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#6b7280',
            confirmButtonText: '🗑️ Sí, eliminar',
            cancelButtonText: '❌ Cancelar',
            width: '450px'
        });

        if (result.isConfirmed) {
            try {
                const response = await fetch(`/api/clientes/${clientId}`, {
                    method: 'DELETE',
                    headers: getAuthHeaders()
                });
                
                if (response.status === 401) {
                    logout();
                    return;
                }

                if (response.ok) {
                    Swal.fire({
                        title: '¡Eliminado!',
                        text: 'Cliente eliminado exitosamente',
                        icon: 'success',
                        confirmButtonText: 'OK'
                    });
                    this.loadClients();
                } else {
                    const error = await response.json();
                    Swal.fire({
                        title: 'Error',
                        text: error.error,
                        icon: 'error',
                        confirmButtonText: 'OK'
                    });
                }
            } catch (error) {
                console.error('Error eliminando cliente:', error);
                Swal.fire({
                    title: 'Error',
                    text: 'Error al eliminar cliente',
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
            }
        }
    }
}

// Variable global para acceso desde onclick
let discotecaApp;

// Función para verificar autenticación
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return false;
    }
    return token;
}

// Función para logout
function logout() {
    localStorage.removeItem('token');
    window.location.href = '/login.html';
}

// Función para obtener headers con autorización
function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

document.addEventListener('DOMContentLoaded', () => {
    // Verificar autenticación antes de inicializar la app
    if (checkAuth()) {
        discotecaApp = new DiscotecaSystem();
    }
});