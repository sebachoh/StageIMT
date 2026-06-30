import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const socket = io('http://localhost:4000');
const MetricsContext = createContext();

export function MetricsProvider({ children }) {
    const [metrics, setMetrics] = useState(null);
    const [history, setHistory] = useState([]);

    useEffect(() => {
        socket.on('slices_metrics', (data) => {
            setMetrics(data);

            setHistory(prev => {
                const newPoint = {
                    time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: "numeric", minute: "numeric", second: "numeric" }),
                    // eMBB
                    eMBB_throughput: data.slice1_eMBB.throughput,
                    eMBB_latency: data.slice1_eMBB.latency,
                    eMBB_jitter: data.slice1_eMBB.jitter,
                    eMBB_packetLoss: data.slice1_eMBB.packet_loss,
                    eMBB_ues: data.slice1_eMBB.connected_ues,
                    // URLLC
                    URLLC_throughput: data.slice2_URLLC.throughput,
                    URLLC_latency: data.slice2_URLLC.latency,
                    URLLC_jitter: data.slice2_URLLC.jitter,
                    URLLC_packetLoss: data.slice2_URLLC.packet_loss,
                    URLLC_ues: data.slice2_URLLC.connected_ues,
                    // mMTC
                    mMTC_throughput: data.slice3_mMTC.throughput,
                    mMTC_latency: data.slice3_mMTC.latency,
                    mMTC_jitter: data.slice3_mMTC.jitter,
                    mMTC_packetLoss: data.slice3_mMTC.packet_loss,
                    mMTC_ues: data.slice3_mMTC.connected_ues,
                    // V2X
                    V2X_throughput: data.slice4_V2X.throughput,
                    V2X_latency: data.slice4_V2X.latency,
                    V2X_jitter: data.slice4_V2X.jitter,
                    V2X_packetLoss: data.slice4_V2X.packet_loss,
                    V2X_ues: data.slice4_V2X.connected_ues,
                };
                const newHistory = [...prev, newPoint];
                if (newHistory.length > 3600) newHistory.shift();
                return newHistory;
            });
        });

        return () => {
            socket.off('slices_metrics');
        };
    }, []);

    const [activeTest, setActiveTest] = useState(null);

    // Función para enviar comandos al backend
    const setSimulationMode = (mode, params = null) => {
        socket.emit('set_simulation_mode', { mode, params });
    };

    const startSimulationTest = (testType) => {
        if (!testType) {
            setActiveTest(null);
            setSimulationMode('normal');
        } else {
            setActiveTest(testType);
            setSimulationMode('test', { testType });
        }
    };

    // Función para cambiar el intervalo de actualización del backend
    const setUpdateInterval = (ms) => {
        socket.emit('set_interval', ms);
    };

    return (
        <MetricsContext.Provider value={{ metrics, history, setSimulationMode, setUpdateInterval, activeTest, startSimulationTest }}>
            {children}
        </MetricsContext.Provider>
    );
}

export function useMetrics() {
    return useContext(MetricsContext);
}
