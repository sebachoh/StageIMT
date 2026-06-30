import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Activity, Zap, Cpu, Car } from 'lucide-react';

// Nos conectamos al servidor Backend
const socket = io('http://localhost:4000');

function App() {
  const [metrics, setMetrics] = useState(null);
  const [history, setHistory] = useState([]); // Guardará los datos para la gráfica

  useEffect(() => {
    socket.on('slices_metrics', (data) => {
      setMetrics(data);

      // Guardar el historial para la gráfica (últimos 20 segundos)
      setHistory(prev => {
        const newPoint = {
          time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: "numeric", minute: "numeric", second: "numeric" }),
          eMBB: data.slice1_eMBB.throughput,
          URLLC: data.slice2_URLLC.throughput,
          mMTC: data.slice3_mMTC.throughput,
          V2X: data.slice4_V2X.throughput
        };
        const newHistory = [...prev, newPoint];
        // Mantener solo los últimos 20 puntos en pantalla para que no se sature
        if (newHistory.length > 20) newHistory.shift();
        return newHistory;
      });
    });

    return () => {
      socket.off('slices_metrics');
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
      {/* HEADER */}
      <header className="mb-8 border-b border-slate-800 pb-4 flex justify-between items-end">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent flex items-center gap-3">
            <Activity className="text-blue-400" size={32} />
            5G Core Telemetry
          </h1>
          <p className="text-slate-400 mt-2 tracking-wide">Multi-Slice Real-Time Dashboard</p>
        </div>
        <div className="hidden md:flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <span className="text-sm text-emerald-400 font-mono tracking-widest">LIVE LINK</span>
        </div>
      </header>

      {/* Si aún no llegan datos, mostramos cargando */}
      {!metrics ? (
        <div className="flex flex-col items-center justify-center h-64 text-slate-500 space-y-4">
          <Activity className="animate-bounce" size={48} />
          <div className="animate-pulse font-semibold tracking-widest uppercase">Interceptando Core 5G...</div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* TARJETAS DE LOS 4 SLICES */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

            {/* Slice 1 */}
            <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl p-6 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)] hover:border-blue-500/50 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xs font-bold text-blue-400 uppercase tracking-widest">eMBB (Banda Ancha)</h2>
                <Zap size={18} className="text-blue-400" />
              </div>
              <div className="text-4xl font-bold font-mono tracking-tighter text-white mb-1">
                {metrics.slice1_eMBB.throughput} <span className="text-sm text-slate-500 font-sans font-medium">Mbps</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400 mt-4">
                <span>Lat: <span className="text-white">{metrics.slice1_eMBB.latency}ms</span></span>
                <span>UEs: <span className="text-white">{metrics.slice1_eMBB.connected_ues}</span></span>
              </div>
            </div>

            {/* Slice 2 */}
            <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl p-6 border border-orange-500/20 shadow-[0_0_15px_rgba(249,115,22,0.1)] hover:border-orange-500/50 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xs font-bold text-orange-400 uppercase tracking-widest">URLLC (Baja Latencia)</h2>
                <Activity size={18} className="text-orange-400" />
              </div>
              <div className="text-4xl font-bold font-mono tracking-tighter text-white mb-1">
                {metrics.slice2_URLLC.latency} <span className="text-sm text-slate-500 font-sans font-medium">ms</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400 mt-4">
                <span>Tx: <span className="text-white">{metrics.slice2_URLLC.throughput} Mbps</span></span>
                <span>UEs: <span className="text-white">{metrics.slice2_URLLC.connected_ues}</span></span>
              </div>
            </div>

            {/* Slice 3 */}
            <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl p-6 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)] hover:border-emerald-500/50 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xs font-bold text-emerald-400 uppercase tracking-widest">mMTC (IoT Masivo)</h2>
                <Cpu size={18} className="text-emerald-400" />
              </div>
              <div className="text-4xl font-bold font-mono tracking-tighter text-white mb-1">
                {metrics.slice3_mMTC.connected_ues.toLocaleString()} <span className="text-sm text-slate-500 font-sans font-medium">UEs</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400 mt-4">
                <span>Tx: <span className="text-white">{metrics.slice3_mMTC.throughput} Mbps</span></span>
                <span>Lat: <span className="text-white">{metrics.slice3_mMTC.latency}ms</span></span>
              </div>
            </div>

            {/* Slice 4 */}
            <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl p-6 border border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.1)] hover:border-purple-500/50 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xs font-bold text-purple-400 uppercase tracking-widest">V2X (Carros Conectados)</h2>
                <Car size={18} className="text-purple-400" />
              </div>
              <div className="text-4xl font-bold font-mono tracking-tighter text-white mb-1">
                {metrics.slice4_V2X.throughput} <span className="text-sm text-slate-500 font-sans font-medium">Mbps</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400 mt-4">
                <span>Lat: <span className="text-white">{metrics.slice4_V2X.latency}ms</span></span>
                <span>UEs: <span className="text-white">{metrics.slice4_V2X.connected_ues}</span></span>
              </div>
            </div>
          </div>

          {/* GRÁFICA PRINCIPAL */}
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-slate-200 mb-6 flex items-center gap-2">
              Flujo de Red en Vivo (Throughput Mbps)
            </h3>
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="time" stroke="#475569" fontSize={12} tickMargin={10} />
                  <YAxis stroke="#475569" fontSize={12} tickFormatter={(val) => `${val}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f1f5f9' }}
                    itemStyle={{ fontWeight: 'bold' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  {/* Cada línea representa un Slice */}
                  <Line type="monotone" name="eMBB" dataKey="eMBB" stroke="#3b82f6" strokeWidth={3} dot={false} activeDot={{ r: 6 }} isAnimationActive={false} />
                  <Line type="monotone" name="URLLC" dataKey="URLLC" stroke="#f97316" strokeWidth={3} dot={false} isAnimationActive={false} />
                  <Line type="monotone" name="mMTC" dataKey="mMTC" stroke="#10b981" strokeWidth={3} dot={false} isAnimationActive={false} />
                  <Line type="monotone" name="V2X" dataKey="V2X" stroke="#a855f7" strokeWidth={3} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
