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

// Estado global de la simulación
let simulationMode = 'normal'; // puede ser 'normal', 'stress', 'custom'
let customConfig = null;

function generateNormalData() {
    return {
        // Slice 1: eMBB (Banda Ancha Móvil Mejorada - para streaming, VR, etc)
        slice1_eMBB: { throughput: Math.floor(Math.random() * 500) + 500, latency: Math.floor(Math.random() * 15) + 10, jitter: Math.floor(Math.random() * 5) + 1, packet_loss: (Math.random() * 0.1).toFixed(2), reliability: 99.9, connected_ues: 120 },
        // Slice 2: URLLC (Ultra Confiable y Baja Latencia - para robots, cirugías remotas)
        slice2_URLLC: { throughput: Math.floor(Math.random() * 50) + 100, latency: Math.floor(Math.random() * 2) + 1, jitter: Math.floor(Math.random() * 2), packet_loss: 0.00, reliability: 99.999, connected_ues: 20 },
        // Slice 3: Comunicaciones Masivas (Sensores IoT, miles de dispositivos, baja velocidad)
        slice3_mMTC: { throughput: Math.floor(Math.random() * 20) + 10, latency: Math.floor(Math.random() * 50) + 40, jitter: Math.floor(Math.random() * 20) + 5, packet_loss: (Math.random() * 2).toFixed(2), reliability: 98.5, connected_ues: 5000 },
        // Slice 4: V2X (Vehículos conectados / Carros)
        slice4_V2X: { throughput: Math.floor(Math.random() * 30) + 15, latency: Math.floor(Math.random() * 10) + 5, jitter: Math.floor(Math.random() * 3) + 1, packet_loss: (Math.random() * 0.01).toFixed(3), reliability: 99.99, connected_ues: 2500 }
    };
}

// Función temporal para simular el comportamiento de los 4 Slices de 5G
function generateMockSliceData() {
    const normalData = generateNormalData();

    if (simulationMode === 'test' && customConfig) {
        const testType = customConfig.testType;

        if (testType === 'eMBB_4k_video') {
            return {
                ...normalData,
                slice1_eMBB: { throughput: Math.floor(Math.random() * 500) + 2000, latency: Math.floor(Math.random() * 20) + 30, jitter: Math.floor(Math.random() * 10) + 5, packet_loss: (Math.random() * 0.5).toFixed(2), reliability: 99.0, connected_ues: 180 }
            };
        } else if (testType === 'URLLC_critical_load') {
            return {
                ...normalData,
                slice2_URLLC: { throughput: Math.floor(Math.random() * 100) + 200, latency: Math.floor(Math.random() * 2) + 3, jitter: Math.floor(Math.random() * 5) + 3, packet_loss: (Math.random() * 0.05).toFixed(2), reliability: 99.9, connected_ues: 500 }
            };
        } else if (testType === 'mMTC_10k_ues') {
            return {
                ...normalData,
                slice3_mMTC: { throughput: Math.floor(Math.random() * 50) + 80, latency: Math.floor(Math.random() * 100) + 150, jitter: Math.floor(Math.random() * 50) + 20, packet_loss: (Math.random() * 3 + 1).toFixed(2), reliability: 95.0, connected_ues: 10000 }
            };
        } else if (testType === 'V2X_emergency_brake') {
            return {
                ...normalData,
                slice4_V2X: { throughput: Math.floor(Math.random() * 100) + 150, latency: Math.floor(Math.random() * 10) + 15, jitter: Math.floor(Math.random() * 15) + 10, packet_loss: (Math.random() * 1 + 0.5).toFixed(2), reliability: 98.0, connected_ues: 5000 }
            };
        }
    }

    return normalData;
}

io.on('connection', (socket) => {
    console.log('🟢 Nuevo Dashboard de React conectado:', socket.id);
    
    // Escuchar comandos del frontend
    socket.on('set_simulation_mode', (config) => {
        console.log(`⚡ Cambio de modo de simulación a: ${config.mode}`);
        simulationMode = config.mode;
        if (config.mode === 'test') {
            customConfig = config.params;
            console.log(`Test activo: ${customConfig.testType}`);
        }
    });

    // Escuchar cambio de intervalo
    socket.on('set_interval', (ms) => {
        console.log(`⏱️ Cambio de intervalo de emisión a: ${ms} ms`);
        clearInterval(intervalId);
        intervalId = setInterval(() => {
            const data = generateMockSliceData();
            io.emit('slices_metrics', data);
        }, ms);
    });

    socket.on('disconnect', () => console.log('🔴 Dashboard desconectado:', socket.id));
});

// El "Latido" del servidor: Empujar datos al Frontend cada 1 segundo por defecto
let intervalId = setInterval(() => {
    const data = generateMockSliceData();
    io.emit('slices_metrics', data);
}, 1000);

// Levantamos el servidor en el puerto 4000
const PORT = 4000;
server.listen(PORT, () => {
    console.log(`🚀 Backend de Telemetría corriendo en http://localhost:${PORT}`);
    console.log('📡 Transmitiendo datos simulados de 5G por Sockets...');
});
