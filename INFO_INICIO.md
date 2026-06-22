# GUÍA DE INICIO Y APAGADO SEGURO - AMBULANCE 5G

Este documento contiene los comandos exactos y en el orden correcto para arrancar, estabilizar y apagar la infraestructura de la Ambulancia 5G. Todos los comandos deben ejecutarse desde esta misma carpeta (`/home/psondi/oai-cn5g-fed/docker-compose/Projet4Slices`).

---

## 🟢 1. ENCENDER EL SISTEMA DE FORMA SEGURA

**Paso 1: Encender la infraestructura (Core 5G, UEs y Servidores)**
Ejecuta el orquestador en segundo plano. Esto encenderá las bases de datos, las funciones de red (AMF, SMF, UPF), las antenas y el servidor Node.js de la ambulancia.
```bash
sudo docker compose up -d
```
> ⏳ **IMPORTANTE:** Espera unos 30 segundos después de ejecutar este comando. La red móvil virtual 5G (OpenAirInterface) requiere tiempo para que los UPFs negocien las sesiones con el SMF y se estabilicen las rutas.

**Paso 2: Iniciar el flujo de Telemetría Médica (Signos Vitales)**
Como los contenedores se reinician limpios, primero copiamos el script generador de datos al servidor de la ambulancia y luego lo dejamos corriendo en segundo plano para que empuje la información al MQTT Broker.
```bash
sudo docker cp ./scripts/simulate_ambulance_vitals.sh ambulance-server:/simulate_ambulance_vitals.sh
sudo docker exec -d ambulance-server sh /simulate_ambulance_vitals.sh
```

**Paso 3: Iniciar la Inyección de Video de la Cámara**
Desplegamos un contenedor temporal (`ffmpeg-gen`) en la misma red de datos interna para inyectar una señal de video de prueba (RTMP) directamente al servidor de medios, garantizando un flujo sin latencia en la demostración.
```bash
sudo docker rm -f ffmpeg-gen 2>/dev/null || true
sudo docker run -d --name ffmpeg-gen \
  --network data-network-srv \
  jrottenberg/ffmpeg:4.4-ubuntu \
  -re -f lavfi -i testsrc=size=1920x1080:rate=30 -f lavfi -i sine=frequency=1000:sample_rate=44100 \
  -c:v libx264 -preset ultrafast -b:v 1000k -maxrate 1000k -bufsize 2000k -pix_fmt yuv420p \
  -c:a aac -b:a 128k -f flv rtmp://ambulance-server:1935/live/camera
```

🎉 **¡El sistema ya está funcionando!** Puedes abrir tu navegador en:
👉 `http://localhost:3001`

---

## 🔴 2. APAGAR EL SISTEMA DE FORMA SEGURA

Para no dejar contenedores huérfanos o redes virtuales colgadas (lo cual causa conflictos en futuros inicios), siempre sigue estos dos pasos para apagar el ecosistema.

**Paso 1: Destruir el inyector de video**
Detenemos y borramos el contenedor externo de FFMPEG que usamos para simular la cámara.
```bash
sudo docker rm -f ffmpeg-gen
```

**Paso 2: Apagar y destruir la infraestructura 5G**
Bajamos todos los componentes desplegados por Docker Compose. Usar `-t0` fuerza un cierre inmediato si tienes prisa, pero un apagado normal es recomendado para corromper menos los registros.
```bash
sudo docker compose down
```

---

## 🛠️ 3. COMANDOS ÚTILES PARA DEPURACIÓN (TROUBLESHOOTING)

Si algo falla, estos comandos te ayudarán a ver qué está pasando internamente:

**Ver logs del Dashboard de la Ambulancia en tiempo real:**
```bash
sudo docker logs -f ambulance-server
```

**Ver logs del intermediario de mensajes MQTT (Sensores):**
```bash
sudo docker logs -f iot-broker
```

**Verificar si la cámara está emitiendo video correctamente:**
```bash
sudo docker logs -f ffmpeg-gen
```
