const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3005;

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Middleware de autenticación JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de acceso requerido' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido' });
    }
    req.user = user;
    next();
  });
};

// Endpoints de autenticación
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username y password son requeridos' });
    }

    // Buscar usuario por username o email
    const usuario = await prisma.usuario.findFirst({
      where: {
        OR: [
          { username: username },
          { email: username }
        ],
        activo: true
      }
    });

    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Verificar password
    const passwordValido = await bcrypt.compare(password, usuario.password);
    
    if (!passwordValido) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Generar token JWT
    const token = jwt.sign(
      { 
        id: usuario.id, 
        username: usuario.username,
        email: usuario.email,
        rol: usuario.rol 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login exitoso',
      token: token,
      user: {
        id: usuario.id,
        username: usuario.username,
        email: usuario.email,
        rol: usuario.rol
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email y password son requeridos' });
    }

    // Verificar si el usuario ya existe
    const usuarioExistente = await prisma.usuario.findFirst({
      where: {
        OR: [
          { username: username },
          { email: email }
        ]
      }
    });

    if (usuarioExistente) {
      return res.status(400).json({ error: 'El usuario o email ya existe' });
    }

    // Hash del password
    const passwordHash = await bcrypt.hash(password, 10);

    // Crear nuevo usuario
    const nuevoUsuario = await prisma.usuario.create({
      data: {
        username,
        email,
        password: passwordHash
      }
    });

    res.status(201).json({
      message: 'Usuario creado exitosamente',
      user: {
        id: nuevoUsuario.id,
        username: nuevoUsuario.username,
        email: nuevoUsuario.email,
        rol: nuevoUsuario.rol
      }
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.get('/api/auth/verify', authenticateToken, (req, res) => {
  res.json({
    valid: true,
    user: req.user
  });
});

app.get('/api/clientes', authenticateToken, async (req, res) => {
  try {
    const clientes = await prisma.cliente.findMany({
      orderBy: { fechaRegistro: 'desc' }
    });
    res.json(clientes);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener clientes' });
  }
});

app.post('/api/clientes', authenticateToken, async (req, res) => {
  try {
    const { nombres, apellidos, correo, telefono, fechaNacimiento, sexo, estatus, huellaBiometrica } = req.body;
    
    const cliente = await prisma.cliente.create({
      data: {
        nombres,
        apellidos,
        correo,
        telefono,
        fechaNacimiento: new Date(fechaNacimiento),
        sexo,
        estatus: estatus || 'activo',
        huellaBiometrica
      }
    });
    
    res.status(201).json(cliente);
  } catch (error) {
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'El correo ya está registrado' });
    } else {
      res.status(500).json({ error: 'Error al crear cliente' });
    }
  }
});

app.post('/api/identificar', authenticateToken, async (req, res) => {
  try {
    const { huellaBiometrica } = req.body;
    
    if (!huellaBiometrica) {
      return res.status(400).json({ error: 'Huella biométrica requerida' });
    }
    
    const cliente = await prisma.cliente.findFirst({
      where: { huellaBiometrica }
    });
    
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }
    
    await prisma.cliente.update({
      where: { id: cliente.id },
      data: { ultimaVisita: new Date() }
    });
    
    res.json({
      id: cliente.id,
      correo: cliente.correo,
      estatus: cliente.estatus,
      ultimaVisita: new Date()
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al identificar cliente' });
  }
});

app.put('/api/clientes/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { nombres, apellidos, correo, telefono, fechaNacimiento, sexo, estatus, huellaBiometrica } = req.body;
    
    const cliente = await prisma.cliente.update({
      where: { id: parseInt(id) },
      data: {
        nombres,
        apellidos,
        correo,
        telefono,
        fechaNacimiento: new Date(fechaNacimiento),
        sexo,
        estatus,
        huellaBiometrica
      }
    });
    
    res.json(cliente);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar cliente' });
  }
});

app.delete('/api/clientes/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.cliente.delete({
      where: { id: parseInt(id) }
    });
    res.json({ message: 'Cliente eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar cliente' });
  }
});

app.use(express.static('public'));

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});

process.on('beforeExit', async () => {
  await prisma.$disconnect();
});