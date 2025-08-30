# Sistema de Identificación Biométrica para Discoteca

Sistema completo para gestión de clientes de discoteca con identificación por huella dactilar.

## Características

- ✅ Registro de clientes con datos completos
- ✅ Identificación biométrica por huella dactilar
- ✅ Sistema de estatus (Activo, VIP, Suspendido)
- ✅ Base de datos PostgreSQL con Prisma ORM
- ✅ Interfaz web moderna y responsiva
- ✅ Containerización con Docker

## Campos del Cliente

- **Correo**: Email único del cliente
- **Teléfono**: Número de contacto
- **Edad**: Edad del cliente (mínimo 18 años)
- **Estatus**: Estado del cliente (activo, vip, suspendido)
- **Huella Biométrica**: Hash de identificación biométrica
- **Fecha de Registro**: Timestamp automático
- **Última Visita**: Se actualiza cada identificación

## Instalación y Uso

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar base de datos con Docker
```bash
docker-compose up -d postgres
```

### 3. Ejecutar migraciones de Prisma
```bash
npm run db:generate
npm run db:migrate
```

### 4. Iniciar la aplicación
```bash
npm run dev
```

### 5. Acceder a la aplicación
- Frontend: http://localhost:3000
- Base de datos (Prisma Studio): `npm run db:studio`

## API Endpoints

- `GET /api/clientes` - Listar todos los clientes
- `POST /api/clientes` - Registrar nuevo cliente
- `POST /api/identificar` - Identificar cliente por huella
- `PUT /api/clientes/:id` - Actualizar cliente
- `DELETE /api/clientes/:id` - Eliminar cliente

## Tecnologías

- **Backend**: Node.js, Express.js
- **Base de datos**: PostgreSQL con Prisma ORM
- **Frontend**: HTML5, CSS3 (Tailwind), JavaScript
- **Containerización**: Docker & Docker Compose 