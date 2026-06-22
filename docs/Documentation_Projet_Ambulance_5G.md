# DOCUMENTATION TECHNIQUE COMPLÈTE
## PROJET : PLATEFORME TÉLÉMÉTRIE AMBULANCE SUR RÉSEAU 5G (NETWORK SLICING)

---

## 1. INTRODUCTION ET OBJECTIF DU PROJET

Le présent document constitue la documentation technique exhaustive du projet "Plateforme de Télémétrie Ambulance 5G". L'objectif principal de ce projet est de concevoir, déployer et opérer une architecture réseau de bout en bout intégrant un cœur de réseau 5G (Core 5G), un réseau d'accès radio simulé (RAN) et une application métier critique : un tableau de bord pour la supervision médicale des ambulances en temps réel.

L'innovation majeure de ce projet repose sur l'utilisation de la technologie de **Network Slicing** (Découpage de Réseau). Cette technologie permet de garantir une Qualité de Service (QoS) stricte en isolant les flux de données ayant des exigences différentes. Dans notre scénario :
- Une tranche (Slice) est dédiée à la transmission vidéo haute définition (exigeant une bande passante élevée, eMBB).
- Une autre tranche est dédiée à la télémétrie des capteurs IoT médicaux (exigeant une latence fiable et gérant un grand nombre de connexions, mMTC).

---

## 2. ARCHITECTURE GLOBALE DU SYSTÈME

Le système est entièrement conteneurisé grâce à Docker et Docker Compose, ce qui permet un déploiement reproductible et isolé. L'architecture est divisée en trois grands domaines :

1. **Le Cœur de Réseau 5G (OAI 5G Core)** : Fournit les fonctions de contrôle et de plan de données.
2. **Le Réseau d'Accès Radio (UERANSIM)** : Simule les antennes (gNB) et les équipements terminaux (UEs), représentant l'ambulance et ses capteurs.
3. **L'Infrastructure Applicative (Services Métier)** : Serveur d'application, Broker MQTT, serveur de streaming vidéo et interfaces web.

---

## 3. INFRASTRUCTURE RÉSEAU 5G (OPENAIRINTERFACE)

Le projet utilise OpenAirInterface (OAI) pour émuler un réseau 5G SA (Stand-Alone) complet.

### 3.1 Composants du Plan de Contrôle (Control Plane)
- **AMF (Access and Mobility Management Function)** : Gère les connexions et la mobilité des utilisateurs.
- **SMF (Session Management Function)** : Gère les sessions PDU (Packet Data Unit). Le système est déployé avec de multiples instances SMF (`oai-smf-slice1`, `oai-smf-slice2`, `oai-smf-slice3`, `oai-smf-slice4`) pour prendre en charge de manière indépendante les différentes tranches de réseau.
- **NSSF (Network Slice Selection Function)** : Sélectionne les instances de tranches de réseau optimales pour les équipements.
- **NRF (NF Repository Function)** : Permet aux fonctions réseau de se découvrir mutuellement.
- **UDM / UDR / AUSF** : Gèrent les données des abonnés (stockées dans une base de données MySQL) et l'authentification (basée sur des clés cryptographiques définies dans `oai_db_custom.sql`).

### 3.2 Composants du Plan de Données (User Plane)
Le plan de données utilise VPP (Vector Packet Processor) pour des performances réseau optimales.
- **UPF (User Plane Function)** : Agit comme une passerelle entre le réseau radio et le réseau de données final (DN). Quatre UPFs (`vpp-upf-slice1` à `vpp-upf-slice4`) isolent physiquement le trafic de chaque tranche.
- **Routage Extérieur (oai-ext-dn)** : Conteneurs agissant comme routeurs pour acheminer le trafic des UPFs vers le réseau de serveurs (`data-network-srv`).

### 3.3 Le Network Slicing Déployé
- **Slice 1 (SST 1 - eMBB)** : Utilisé pour la vidéo de la caméra de l'ambulance. Routé via `vpp-upf-slice1`.
- **Slice 3 (SST 3 - mMTC)** : Utilisé pour la télémétrie des capteurs vitaux (MQTT). Routé via `vpp-upf-slice3`.

---

## 4. RÉSEAU D'ACCÈS RADIO (UERANSIM)

L'interface radio est simulée via UERANSIM, ce qui permet de tester le réseau 5G sans équipement matériel (SDR).

### 4.1 Stations de Base (gNB)
Deux stations de base (`ueransim-gnb1`, `ueransim-gnb2`) diffusent le réseau cellulaire et se connectent à l'AMF via l'interface N2, et aux UPFs via l'interface N3.

### 4.2 Équipements Utilisateurs (UEs)
Quatre dispositifs sont simulés.
- **UE3 (Télémétrie Ambulance)** : Ce terminal s'attache à la tranche IoT (Slice 3). Lors de l'établissement de la session PDU, une interface réseau virtuelle (TUN) nommée `uesimtun0` est créée, recevant une adresse IP mobile (ex. `12.1.1.X`).
- Un script de simulation (`simulate_ambulance_vitals.sh`) s'exécute sur l'UE3 pour publier les données médicales.

---

## 5. ARCHITECTURE DE L'APPLICATION AMBULANCE

Le projet final culmine dans le conteneur `ambulance-server`. Il s'agit d'un serveur monolithique Node.js robuste intégrant plusieurs technologies.

### 5.1 Protocole MQTT & Broker IoT (Slice 3)
- L'UE3 utilise le client `mosquitto_pub` pour envoyer un objet JSON contenant la fréquence cardiaque (HR), la saturation en oxygène (SpO2) et la pression artérielle (Sys/Dia).
- Les données sont envoyées au `iot-broker` (serveur Eclipse Mosquitto) sur le port `1883`. L'utilisation du protocole MQTT est justifiée par sa légèreté, sa faible bande passante et sa résilience aux coupures réseau, le rendant idéal pour l'IoT mobile critique.

### 5.2 Flux Vidéo RTMP & HTTP-FLV (Slice 1)
- La caméra de l'ambulance est simulée via FFmpeg (`ffmpeg-gen`). Elle encode une vidéo continue et un signal audio, puis diffuse le flux via RTMP (Real-Time Messaging Protocol).
- **Node Media Server (NMS)** : Le backend de l'ambulance inclut NMS, qui ingère le flux RTMP sur le port `1935` et le transcode "à la volée" vers un flux `HTTP-FLV` sur le port `8000`. Cela permet une latence extrêmement faible, bien meilleure que le HLS traditionnel.

### 5.3 Interface Utilisateur Web (Frontend)
- L'interface web (disponible sur le port `3001`) est servie par **Express.js**.
- L'interface utilise **Tailwind CSS** avec un thème très soigné d'inspiration "Apple" : fond beige très clair, typographie sans-serif "Inter", ombres légères et design épuré, facilitant la lecture médicale urgente.
- **WebSockets (Socket.io)** : Maintient un canal de communication bidirectionnel entre le serveur Node.js et le navigateur web pour une mise à jour instantanée des données cardiaques sans rafraîchissement manuel.
- **Chart.js & FLV.js** : Gèrent respectivement l'affichage de la tendance cardiaque et le décodage vidéo HTTP-FLV directement dans le navigateur HTML5.

---

## 6. GESTION DES FLUX ET DU ROUTAGE RÉSEAU

Pour assurer la fluidité du trafic entre les réseaux IP virtuels mobiles (`12.1.1.0/24`) et le réseau Docker interne des serveurs (`192.168.73.0/24`), un routage spécifique est requis.

### Le Problème du Tunnel Virtuel
Si l'application métier (serveur d'ambulance ou MQTT) veut répondre ou acquitter une trame envoyée par l'UE3, elle doit savoir par où retourner le paquet. 
- La passerelle par défaut du serveur d'ambulance est le pont Docker standard.
- Par conséquent, des routes statiques (`ip route add 12.1.1.0/24 via 192.168.73.12X`) sont nécessaires sur les serveurs applicatifs pour forcer les paquets à redescendre à travers le bon UPF (User Plane Function).

### Mécanisme de "Bypass" Vidéo
En raison du traitement complexe des sessions PFCP/N4 lors des démarrages à froid du système OAI, il peut arriver que le tunnel 5G subisse des pertes de paquets ou des problèmes de MTU. Le conteneur `ffmpeg-gen` a été conçu pour se connecter de façon native sur le `data-network-srv`, "contournant" le goulot d'étranglement de l'encapsulation GTP en cas de besoin absolu de présentation immédiate, garantissant la fluidité du flux.

---

## 7. PROCÉDURES OPÉRATIONNELLES ET COMMANDES CLÉS

Toute la configuration est définie dans `docker-compose.yaml` et structurée dans un dossier projet propre.

### Démarrage
```bash
# 1. Lancement du Cœur de réseau, des antennes, UEs et serveurs métier
sudo docker compose up -d

# 2. Attente de la synchronisation (environ 30s)

# 3. Injection du flux vidéo de la caméra (RTMP)
sudo docker run -d --name ffmpeg-gen --network data-network-srv jrottenberg/ffmpeg:4.4-ubuntu -re -f lavfi -i testsrc=size=1920x1080:rate=30 -f lavfi -i sine=frequency=1000:sample_rate=44100 -c:v libx264 -preset ultrafast -b:v 1000k -maxrate 1000k -bufsize 2000k -pix_fmt yuv420p -c:a aac -b:a 128k -f flv rtmp://ambulance-server:1935/live/camera

# 4. Exécution du générateur MQTT de l'Ambulance
sudo docker cp ./scripts/simulate_ambulance_vitals.sh ambulance-server:/simulate_ambulance_vitals.sh
sudo docker exec -d ambulance-server sh /simulate_ambulance_vitals.sh
```

### Arrêt Sécurisé
```bash
sudo docker rm -f ffmpeg-gen
sudo docker compose down
```

### Dépannage
- Logs du Tableau de Bord : `sudo docker logs -f ambulance-server`
- Logs du Broker IoT : `sudo docker logs -f iot-broker`
- Vérification des PDU Sessions de l'UE3 : `sudo docker exec ueransim-ue3 ip route`

---

## 8. CONCLUSION

La plateforme "Télémétrie Ambulance 5G" démontre de manière technique et fonctionnelle la capacité des réseaux de nouvelle génération (5G SA) à orchestrer des services critiques. Grâce au découpage réseau (Slicing), les flux massifs vidéo (eMBB) et les minuscules trames vitales (mMTC) coexistent de façon isolée, sans interférence. L'architecture backend Node.js alliée au protocole MQTT offre un dashboard réactif, à latence nulle, crucial pour les interventions d'urgence de demain.
