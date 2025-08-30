class DiscotecaSystem {
    constructor() {
        this.currentSection = 'entrada';
        this.init();
    }

    init() {
        this.loadClients();
        this.setupEventListeners();
        this.setupNavigation();
    }

    setupEventListeners() {
        document.getElementById('scannerArea').addEventListener('click', () => this.simulateFingerprint());
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
            const response = await fetch('/api/clientes');
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
                                <span class="text-white font-semibold text-lg">${client.correo.charAt(0).toUpperCase()}</span>
                            </div>
                            <div>
                                <p class="font-semibold text-lg">${client.correo}</p>
                                <p class="text-sm text-gray-300">Tel: ${client.telefono} | Edad: ${edad} años</p>
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
                    </div>
                </div>
            </div>
        `;
        }).join('');
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
            alert('Por favor ingresa un hash de huella para probar');
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
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ huellaBiometrica: fingerprintHash })
            });

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
            correo: document.getElementById('correo').value,
            telefono: document.getElementById('telefono').value,
            fechaNacimiento: document.getElementById('fechaNacimiento').value,
            estatus: document.getElementById('estatus').value,
            huellaBiometrica: document.getElementById('huellaBiometrica').value
        };

        if (!formData.huellaBiometrica) {
            alert('Por favor captura la huella biométrica primero');
            return;
        }

        try {
            const response = await fetch('/api/clientes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                alert('Cliente registrado exitosamente');
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
                alert('Error: ' + error.error);
            }
        } catch (error) {
            console.error('Error registrando cliente:', error);
            alert('Error al registrar cliente');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new DiscotecaSystem();
});