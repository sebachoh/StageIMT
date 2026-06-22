#!/bin/bash

echo "=========================================================="
echo "    Iniciando despliegue de 5G Core (4 Slices) + UERANSIM   "
echo "=========================================================="

echo "[1/4] Deteniendo y limpiando contenedores anteriores..."
docker compose down -v

echo "[2/4] Iniciando Base de Datos (MySQL) y red asociada..."
docker compose up -d mysql
echo "Esperando 30 segundos para que la BD se inicialice correctamente..."
sleep 30

echo "[3/4] Iniciando el resto de Funciones de Red (5GC + gNBs + UEs)..."
docker compose up -d

echo "Esperando 40 segundos para que todos los contenedores y UEs se conecten..."
sleep 40

echo "[4/4] Verificando conectividad (Ping a las Data Networks Externas)..."
echo "----------------------------------------------------------"

echo "Ping de UE1 (Slice 1 - eMBB) a ext-dn1 (192.168.73.10):"
docker exec ueransim-ue1 ping -c 4 192.168.73.10
echo "----------------------------------------------------------"

echo "[5/4] Configurando UE1 (Cámara) y Servidor RTMP para Streaming de Video..."
echo "Instalando iproute2 y configurando ruta en camera-server..."
docker exec camera-server apt-get update > /dev/null
docker exec camera-server apt-get install -y iproute2 > /dev/null
docker exec camera-server ip route add 12.1.1.0/24 via 192.168.73.121

echo "Evitando bloqueos ICMP en el UPF de VPP..."
docker exec vpp-upf-slice1 ip route add 12.1.1.0/24 dev n6-3 || true

echo "Redirigiendo el tráfico del UE1 a través del túnel 5G..."
docker exec ueransim-ue1 ip route add 192.168.73.0/24 dev uesimtun0

echo "Instalando FFmpeg en UE1 (esto puede tardar un par de minutos la primera vez)..."
docker exec ueransim-ue1 apt-get update > /dev/null
docker exec ueransim-ue1 apt-get install -y ffmpeg > /dev/null
echo "¡Cámara (UE1) lista para transmitir!"

echo "Ping de UE2 (Slice 2 - URLLC) a ext-dn2 (192.168.73.20):"
docker exec ueransim-ue2 ping -I uesimtun0 -c 4 192.168.73.20
echo "----------------------------------------------------------"

echo "[7/4] Configurando UE2 (URLLC) y Servidor WebSocket para Teleoperación..."
echo "Configurando ruta en urllc-server..."
docker exec urllc-server ip route add 12.1.1.0/24 via 192.168.73.122 || true
echo "Evitando bloqueos ICMP en el UPF2 de VPP..."
docker exec vpp-upf-slice2 ip route add 12.1.1.0/24 dev n6-3 || true
echo "Redirigiendo el tráfico del UE2 a través del túnel 5G..."
docker exec ueransim-ue2 ip route add 192.168.73.0/24 dev uesimtun0 || true
echo "¡Servidor URLLC y UE2 listos!"
echo "----------------------------------------------------------"

echo "Ping de UE3 (Slice 3 - mMTC) a ext-dn3 (192.168.73.30):"
docker exec ueransim-ue3 ping -I uesimtun0 -c 4 192.168.73.30
echo "----------------------------------------------------------"

echo "[6/4] Configurando UE3 (IoT) y Servidor MQTT para mMTC..."
echo "Instalando iproute2 y configurando ruta en iot-broker..."
docker exec iot-broker apt-get update > /dev/null
docker exec iot-broker apt-get install -y iproute2 > /dev/null
docker exec iot-broker ip route add 12.1.1.0/24 via 192.168.73.123

echo "Evitando bloqueos ICMP en el UPF3 de VPP..."
docker exec vpp-upf-slice3 ip route add 12.1.1.0/24 dev n6-3 || true

echo "Redirigiendo el tráfico del UE3 a través del túnel 5G..."
docker exec ueransim-ue3 ip route add 192.168.73.0/24 dev uesimtun0

echo "Instalando mosquitto-clients en UE3 para simular sensores..."
docker exec ueransim-ue3 apt-get update > /dev/null
docker exec ueransim-ue3 apt-get install -y mosquitto-clients > /dev/null
echo "¡Servidores y UE3 listos para IoT!"
echo "----------------------------------------------------------"

echo "Ping de UE4 (Slice 4 - V2X) a ext-dn4 (192.168.73.40):"
docker exec ueransim-ue4 ping -I uesimtun0 -c 4 192.168.73.40
echo "----------------------------------------------------------"

echo "[8/4] Configurando UE4 (V2X) y Servidor MEC..."
echo "Configurando ruta en v2x-server..."
docker exec v2x-server ip route add 12.1.1.0/24 via 192.168.73.124 || true
echo "Evitando bloqueos ICMP en el UPF4 de VPP..."
docker exec vpp-upf-slice4 ip route add 12.1.1.0/24 dev n6-3 || true
echo "Redirigiendo el tráfico del UE4 a través del túnel 5G..."
docker exec ueransim-ue4 ip route add 192.168.73.0/24 dev uesimtun0 || true
echo "Instalando curl en UE4 para telemetría de coches..."
docker exec ueransim-ue4 apt-get update > /dev/null
docker exec ueransim-ue4 apt-get install -y curl > /dev/null
echo "¡Servidor V2X y Coches listos!"
echo "----------------------------------------------------------"

echo "¡Despliegue finalizado exitosamente!"
