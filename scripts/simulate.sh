#!/bin/bash
BROKER="192.168.73.101"
apk update > /dev/null
apk add mosquitto-clients > /dev/null

echo "Iniciando transmisión de signos vitales al broker $BROKER..."
while true; do
  HR=$(( 75 + RANDOM % 15 ))
  SPO2=$(( 95 + RANDOM % 5 ))
  SYS=$(( 110 + RANDOM % 15 ))
  DIA=$(( 70 + RANDOM % 10 ))
  PAYLOAD="{\"hr\": $HR, \"spo2\": $SPO2, \"sys\": $SYS, \"dia\": $DIA}"
  mosquitto_pub -h $BROKER -t "ambulance/vitals" -m "$PAYLOAD"
  sleep 1
done
