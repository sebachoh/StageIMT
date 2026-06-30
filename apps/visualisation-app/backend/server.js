const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
// Permitimos CORS para que nuestro React (que correrá en otro puerto) pueda conectarse sin bloqueos
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Función temporal para simular el comportamiento de los 4 Slices de 5G
function generateMockSliceData() {
    return {
        // Slice 1: Banda ancha mejorada (Mucho ancho de banda Mbps, latencia normal)
        slice1_eMBB: { throughput: Math.floor(Math.random() * 500) + 800, latency: Math.floor(Math.random() * 5) + 10, connected_ues: 150 },
        // Slice 2: Ultra baja latencia (Poco ancho de banda, latencia de 1-3ms - ej. Ambulancias/Robots)
        slice2_URLLC: { throughput: Math.floor(Math.random() * 50) + 100, latency: Math.floor(Math.random() * 2) + 1, connected_ues: 20 },
        // Slice 3: Comunicaciones Masivas (Sensores IoT, miles de dispositivos, baja velocidad)
        slice3_mMTC: { throughput: Math.floor(Math.random() * 20) + 10, latency: Math.floor(Math.random() * 50) + 40, connected_ues: 5000 },
        // Slice 4: V2X (Vehículos conectados / Carros)
        slice4_V2X: { throughput: Math.floor(Math.random() * 30) + 15, latency: Math.floor(Math.random() * 40) + 30, connected_ues: 2500 }
    };
}

io.on('connection', (socket) => {
    console.log('🟢 Nuevo Dashboard de React conectado:', socket.id);
    socket.on('disconnect', () => console.log('🔴 Dashboard desconectado:', socket.id));
});

// El "Latido" del servidor: Empujar datos al Frontend cada 1 segundo (1000 ms)
setInterval(() => {
    const data = generateMockSliceData();
    // Emitimos un evento llamado 'slices_metrics' que React estará escuchando
    io.emit('slices_metrics', data);
}, 1000);

// Levantamos el servidor en el puerto 4000
const PORT = 4000;
server.listen(PORT, () => {
    console.log(`🚀 Backend de Telemetría corriendo en http://localhost:${PORT}`);
    console.log('📡 Transmitiendo datos simulados de 5G por Sockets...');
});
