#!/usr/bin/env bash
set -euo pipefail

export CONFIG_DIR="/openair-upf/etc"
BIN_DIR="/openair-upf/bin"

REGISTER_NRF=${REGISTER_NRF:-no}
NRF_IPV4_ADDRESS=${NRF_IPV4_ADDRESS:-0.0.0.0}
NRF_PORT=${NRF_PORT:-80}
NRF_API_VERSION=${NRF_API_VERSION:-v1}
NRF_FQDN=${NRF_FQDN:-oai-nrf}
USE_FQDN_DNS=${USE_FQDN_DNS:-no}

if [[ ${USE_FQDN_DNS} == "yes" ]];then
    NRF_IPV4_ADDRESS=(`getent hosts $NRF_FQDN | awk '{print $1}'`)
    echo -e "\nResolving NRF by FQDN : $NRF_FQDN - $NRF_IPV4_ADDRESS"
fi

export UUID=$(cat /proc/sys/kernel/random/uuid)

# Run the original config generator
python3 $CONFIG_DIR/create_configuration.py $CONFIG_DIR/init.conf $CONFIG_DIR/upf_profile.json $CONFIG_DIR/startup_debug.conf --rename

if [[ $? -ne 0 ]]; then
    echo "Error in creating configuration files"
    exit 1
fi

# Modify init.conf to inject MAC address at interface creation time
echo -e "\n# Modifying init.conf to inject correct MAC addresses at interface creation"
for iface in n4-1 n6-3 n9-2; do
  if [ -f "/sys/class/net/$iface/address" ]; then
    MAC=$(cat "/sys/class/net/$iface/address")
    sed -i "s/create host-interface name $iface/create host-interface name $iface hw-addr $MAC/g" $CONFIG_DIR/init.conf
    echo "Injected hw-addr $MAC into create host-interface command for $iface in init.conf"
  fi
done

if [[ ${NAME} == "ULCL" ]]; then
  echo "Injecting custom ULCL N9 configs into init.conf..."
  cat <<EOF >> $CONFIG_DIR/init.conf
upf nwi name aupf2.node.5gcn.mnc95.mcc208.3gppnetwork.org vrf 2
upf nwi name aupf3.node.5gcn.mnc95.mcc208.3gppnetwork.org vrf 2
upf nwi name aupf4.node.5gcn.mnc95.mcc208.3gppnetwork.org vrf 2
upf gtpu endpoint ip 192.168.72.150 nwi aupf2.node.5gcn.mnc95.mcc208.3gppnetwork.org teid 0x000004d2/2
upf gtpu endpoint ip 192.168.72.150 nwi aupf3.node.5gcn.mnc95.mcc208.3gppnetwork.org teid 0x000004d2/2
upf gtpu endpoint ip 192.168.72.150 nwi aupf4.node.5gcn.mnc95.mcc208.3gppnetwork.org teid 0x000004d2/2
EOF
fi

exec "$@"
