const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3005;

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

app.get('/api/clientes', async (req, res) => {
  try {
    const clientes = await prisma.cliente.findMany({
      orderBy: { fechaRegistro: 'desc' }
    });
    res.json(clientes);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener clientes' });
  }
});

app.post('/api/clientes', async (req, res) => {
  try {
    const { correo, telefono, fechaNacimiento, estatus, huellaBiometrica } = req.body;
    
    const cliente = await prisma.cliente.create({
      data: {
        correo,
        telefono,
        fechaNacimiento: new Date(fechaNacimiento),
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

app.post('/api/identificar', async (req, res) => {
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

app.put('/api/clientes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { correo, telefono, fechaNacimiento, estatus, huellaBiometrica } = req.body;
    
    const cliente = await prisma.cliente.update({
      where: { id: parseInt(id) },
      data: {
        correo,
        telefono,
        fechaNacimiento: new Date(fechaNacimiento),
        estatus,
        huellaBiometrica
      }
    });
    
    res.json(cliente);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar cliente' });
  }
});

app.delete('/api/clientes/:id', async (req, res) => {
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