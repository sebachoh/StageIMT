const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mqtt = require('mqtt');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

// Connect to IoT Broker on Slice 3 (192.168.73.101) or local environment variable
const brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://192.168.73.101:1883';
const client = mqtt.connect(brokerUrl);

client.on('connect', () => {
    console.log('Connected to MQTT Broker on Slice 3');
    client.subscribe('ambulance/vitals', (err) => {
        if (!err) {
            console.log('Subscribed to ambulance/vitals');
        }
    });
});

client.on('message', (topic, message) => {
    // message is Buffer
    try {
        const vitals = JSON.parse(message.toString());
        // Broadcast to Dashboard UI
        io.emit('vitals_update', vitals);
    } catch(e) {
        console.error("Invalid MQTT Message:", message.toString());
    }
});

// --- Node Media Server (RTMP to HTTP-FLV) ---
const NodeMediaServer = require('node-media-server');
const nmsConfig = {
  rtmp: {
    port: 1935,
    chunk_size: 60000,
    gop_cache: true,
    ping: 30,
    ping_timeout: 60
  },
  http: {
    port: 8000,
    allow_origin: '*'
  }
};
const nms = new NodeMediaServer(nmsConfig);
nms.run();

const PORT = 3001;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Ambulance Dashboard running on port ${PORT}`);
});
