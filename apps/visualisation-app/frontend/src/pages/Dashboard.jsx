import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Zap, Cpu, Car } from 'lucide-react';
import { useMetrics } from '../context/MetricsContext';
import LoadTestPanel from '../components/LoadTestPanel';
import SliceCard from '../components/SliceCard';
import FluxFlowDiagram from '../components/FluxFlowDiagram';
import LiveStreamlines from '../components/LiveStreamlines';
import IntensityHeatmap from '../components/IntensityHeatmap';

function Dashboard() {
    const navigate = useNavigate();
    const { metrics, history, setUpdateInterval, activeTest, startSimulationTest } = useMetrics();

    const [isTestMenuOpen, setIsTestMenuOpen] = useState(false);
    const [activeMetric, setActiveMetric] = useState('throughput');
    const [chartMode, setChartMode] = useState('lines'); // 'stacked' | 'lines'

    const [timeRange, setTimeRange] = useState('5m');
    const timeRanges = ['1m', '5m', '15m', '1h', '24h'];
    
    const [updateInterval, setLocalUpdateInterval] = useState(1000);
    const intervals = [
        { label: '1s', ms: 1000 },
        { label: '2s', ms: 2000 },
        { label: '5s', ms: 5000 }
    ];

    const handleIntervalChange = (ms) => {
        setLocalUpdateInterval(ms);
        if (setUpdateInterval) setUpdateInterval(ms);
    };

    const [visibleSlices, setVisibleSlices] = useState({
        eMBB: true,
        URLLC: true,
        mMTC: true,
        V2X: true
    });

    const toggleSlice = (sliceName) => {
        setVisibleSlices(prev => ({
            ...prev,
            [sliceName]: !prev[sliceName]
        }));
    };    // Calculate Aggregate Throughput in Gbps (assuming base metrics are in Mbps)
    const aggregateThroughput = metrics 
        ? ((metrics.slice1_eMBB.throughput + metrics.slice2_URLLC.throughput + metrics.slice3_mMTC.throughput + metrics.slice4_V2X.throughput) / 1000).toFixed(1)
        : "0.0";

    // Calcular cuántos puntos mostrar según el rango de tiempo seleccionado
    // Asumimos 1 punto por intervalo.
    const getPointsToShow = () => {
        const pointsPerMinute = 60000 / updateInterval;
        switch (timeRange) {
            case '1m': return pointsPerMinute;
            case '5m': return pointsPerMinute * 5;
            case '15m': return pointsPerMinute * 15;
            case '1h': return pointsPerMinute * 60;
            case '24h': return pointsPerMinute * 60 * 24;
            default: return 300;
        }
    };
    
    const chartHistory = history.slice(-getPointsToShow());

    return (
        <div className="min-h-screen bg-[#0d1117] text-slate-100 p-4 md:p-6 font-sans">
            {/* HEADER */}
            <header className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#12141c] border border-[#2a2e3f] rounded-2xl p-4 shadow-lg">
                
                {/* Header Left: Title & Icon */}
                <div className="flex items-center gap-4">
                    <div className="bg-[#1e293b] border border-[#334155] p-3 rounded-xl flex items-center justify-center">
                        <Activity className="text-blue-400" size={24} />
                    </div>
                    <div>
                        <h1 className="text-lg md:text-xl font-bold text-white tracking-wide">
                            Network Slice Flux
                        </h1>
                        <p className="text-xs text-slate-400 font-mono tracking-wider mt-0.5">
                            5G Core · Multi-Slice Traffic Monitor
                        </p>
                    </div>
                </div>

                {/* Header Right: Stats, Time Range, Status */}
                <div className="flex flex-wrap items-center gap-3">
                    
                    {/* Tests Menu */}
                    <div className="relative">
                        <button 
                            onClick={() => setIsTestMenuOpen(!isTestMenuOpen)}
                            className={`border px-3 py-1 text-[10px] font-mono rounded-lg transition-colors flex items-center gap-2 ${
                                activeTest 
                                ? 'bg-red-500/10 border-red-500/50 text-red-400' 
                                : 'bg-[#1e293b] border-[#334155] hover:bg-[#334155] text-slate-300'
                            }`}
                        >
                            {activeTest && <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>}
                            Tests {activeTest && `(${activeTest.split('_')[0]})`}
                        </button>

                        {isTestMenuOpen && (
                            <div className="absolute right-0 top-full mt-2 w-64 bg-[#1e293b] border border-[#334155] rounded-xl shadow-2xl overflow-hidden z-50">
                                <div className="p-2 bg-[#0f172a] border-b border-[#334155]">
                                    <span className="text-xs font-bold text-slate-300 ml-2">Performance Tests</span>
                                </div>
                                <div className="p-2 space-y-1">
                                    {activeTest && (
                                        <button 
                                            onClick={() => { startSimulationTest(null); setIsTestMenuOpen(false); }}
                                            className="w-full text-left px-3 py-2 text-xs font-mono text-red-400 hover:bg-red-500/10 rounded flex items-center gap-2"
                                        >
                                            <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                                            Stop Current Test
                                        </button>
                                    )}
                                    <button 
                                        onClick={() => { startSimulationTest('eMBB_4k_video'); setIsTestMenuOpen(false); }}
                                        className={`w-full text-left px-3 py-2 text-xs font-mono rounded hover:bg-[#334155] ${activeTest === 'eMBB_4k_video' ? 'bg-[#334155] text-blue-400' : 'text-slate-300'}`}
                                    >
                                        🎬 eMBB: 2x 4K@60FPS Stream
                                    </button>
                                    <button 
                                        onClick={() => { startSimulationTest('URLLC_critical_load'); setIsTestMenuOpen(false); }}
                                        className={`w-full text-left px-3 py-2 text-xs font-mono rounded hover:bg-[#334155] ${activeTest === 'URLLC_critical_load' ? 'bg-[#334155] text-orange-400' : 'text-slate-300'}`}
                                    >
                                        ⚡ URLLC: Critical Load Influx
                                    </button>
                                    <button 
                                        onClick={() => { startSimulationTest('mMTC_10k_ues'); setIsTestMenuOpen(false); }}
                                        className={`w-full text-left px-3 py-2 text-xs font-mono rounded hover:bg-[#334155] ${activeTest === 'mMTC_10k_ues' ? 'bg-[#334155] text-emerald-400' : 'text-slate-300'}`}
                                    >
                                        📡 mMTC: 10,000 UEs Storm
                                    </button>
                                    <button 
                                        onClick={() => { startSimulationTest('V2X_emergency_brake'); setIsTestMenuOpen(false); }}
                                        className={`w-full text-left px-3 py-2 text-xs font-mono rounded hover:bg-[#334155] ${activeTest === 'V2X_emergency_brake' ? 'bg-[#334155] text-purple-400' : 'text-slate-300'}`}
                                    >
                                        🚗 V2X: Emergency Brake Broadcast
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Interval Selector */}
                    <div className="border border-[#2a2e3f] bg-[#161b22] rounded-lg p-1 flex items-center gap-1">
                        <span className="text-[10px] text-slate-500 font-mono px-2">Update rate:</span>
                        {intervals.map(int => (
                            <button 
                                key={int.label}
                                onClick={() => handleIntervalChange(int.ms)}
                                className={`text-[10px] font-mono px-2 py-1 rounded transition-colors ${
                                    updateInterval === int.ms 
                                    ? 'bg-slate-700 text-white' 
                                    : 'text-slate-400 hover:bg-[#1f2937]'
                                }`}
                            >
                                {int.label}
                            </button>
                        ))}
                    </div>

                    {/* Aggregate Box */}
                    <div className="border border-[#2a2e3f] bg-[#161b22] rounded-lg p-2 px-4 flex items-center gap-3">
                        <Activity className="text-blue-500" size={16} />
                        <div className="flex items-baseline gap-1.5">
                            <span className="font-mono text-white font-bold text-lg">{aggregateThroughput}</span>
                            <span className="text-sm text-slate-300 font-bold">Gbps</span>
                            <span className="text-xs text-slate-500 ml-1">aggregate</span>
                        </div>
                    </div>

                    {/* Time Division Box */}
                    <div className="border border-[#2a2e3f] bg-[#161b22] rounded-lg p-1 flex items-center gap-1">
                        {timeRanges.map(range => (
                            <button 
                                key={range}
                                onClick={() => setTimeRange(range)}
                                className={`text-xs font-mono px-3 py-1.5 rounded transition-colors ${
                                    timeRange === range 
                                    ? 'bg-[#1e3a8a] text-blue-200 font-bold' 
                                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#1f2937]'
                                }`}
                            >
                                {range}
                            </button>
                        ))}
                    </div>

                    {/* Status Box */}
                    <div className="border border-[#2a2e3f] bg-[#161b22] rounded-lg p-2 px-4 flex items-center gap-2">
                        {metrics ? (
                            <>
                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></div>
                                <span className="text-xs font-bold text-slate-300 tracking-widest">LIVE</span>
                            </>
                        ) : (
                            <>
                                <div className="w-2.5 h-2.5 rounded-full bg-slate-600"></div>
                                <span className="text-xs font-bold text-slate-500 tracking-widest">WAITING</span>
                            </>
                        )}
                    </div>

                </div>
            </header>

            <div className="w-full flex flex-col space-y-8">
                {/* Si aún no llegan datos, mostramos cargando */}
                {!metrics ? (
                    <div className="flex flex-col items-center justify-center h-64 text-slate-500 space-y-4">
                        <Activity className="animate-bounce" size={48} />
                        <div className="animate-pulse font-semibold tracking-widest uppercase">Interception du Core 5G...</div>
                    </div>
                ) : (
                        <div className="space-y-8">
                    {/* CARDS DE SLICES */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6 mb-6">
                        <SliceCard 
                            id="embb"
                            title="eMBB" 
                            subtitle="High Speeds" 
                            color="#3b82f6" 
                            activeMetric={activeMetric}
                            sliceData={metrics.slice1_eMBB}
                            historyData={chartHistory}
                            dataKey={`eMBB_${activeMetric}`}
                        />
                        <SliceCard 
                            id="urllc"
                            title="URLLC" 
                            subtitle="Low Latency" 
                            color="#f97316" 
                            activeMetric={activeMetric}
                            sliceData={metrics.slice2_URLLC}
                            historyData={chartHistory}
                            dataKey={`URLLC_${activeMetric}`}
                        />
                        <SliceCard 
                            id="mmtc"
                            title="mMTC" 
                            subtitle="IoT Devices" 
                            color="#10b981" 
                            activeMetric={activeMetric}
                            sliceData={metrics.slice3_mMTC}
                            historyData={chartHistory}
                            dataKey={`mMTC_${activeMetric}`}
                        />
                        <SliceCard 
                            id="v2x"
                            title="V2X" 
                            subtitle="Connected Cars" 
                            color="#a855f7" 
                            activeMetric={activeMetric}
                            sliceData={metrics.slice4_V2X}
                            historyData={chartHistory}
                            dataKey={`V2X_${activeMetric}`}
                        />
                    </div>

                    {/* VISUALIZACIONES PRINCIPALES (Fila 2) */}
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
                        {/* GRÁFICA PRINCIPAL (Ocupa 2 columnas en pantallas grandes) */}
                        <div className="xl:col-span-2 bg-[#12141c] border border-[#2a2e3f] rounded-2xl p-6 shadow-2xl h-[550px] flex flex-col">
                            <div className="flex flex-col justify-between items-start mb-6 gap-4">
                                <div className="flex justify-between items-end w-full">
                                    <div>
                                        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                                            Throughput Over Time
                                        </h2>
                                        <p className="text-xs text-slate-400 font-mono mt-1">Per-slice traffic · Gbps</p>
                                    </div>
                                    <div className="flex bg-[#161b22] border border-[#2a2e3f] rounded-lg overflow-hidden">
                                        <button 
                                            onClick={() => setChartMode('stacked')} 
                                            className={`px-3 py-1 text-xs font-mono transition-colors ${chartMode === 'stacked' ? 'bg-[#1e3a8a] text-blue-200' : 'text-slate-400 hover:bg-[#1f2937]'}`}
                                        >
                                            Stacked
                                        </button>
                                        <button 
                                            onClick={() => setChartMode('lines')} 
                                            className={`px-3 py-1 text-xs font-mono transition-colors ${chartMode === 'lines' ? 'bg-[#1e3a8a] text-blue-200' : 'text-slate-400 hover:bg-[#1f2937]'}`}
                                        >
                                            Lines
                                        </button>
                                    </div>
                                </div>
                                <div className="flex gap-4 items-center w-full justify-between">
                                    <div className="flex bg-[#1a1d27] border border-[#2a2e3f] rounded overflow-hidden">
                                        <button 
                                            onClick={() => setActiveMetric('throughput')} 
                                            className={`px-3 py-1.5 text-[10px] font-mono transition-colors ${activeMetric === 'throughput' ? 'bg-[#3b82f6] text-white' : 'text-slate-400 hover:bg-[#1f2937]'}`}
                                        >
                                            Débit
                                        </button>
                                        <button 
                                            onClick={() => setActiveMetric('latency')} 
                                            className={`px-3 py-1.5 text-[10px] font-mono transition-colors ${activeMetric === 'latency' ? 'bg-[#3b82f6] text-white' : 'text-slate-400 hover:bg-[#1f2937]'}`}
                                        >
                                            Latence
                                        </button>
                                        <button 
                                            onClick={() => setActiveMetric('jitter')} 
                                            className={`px-3 py-1.5 text-[10px] font-mono transition-colors ${activeMetric === 'jitter' ? 'bg-[#3b82f6] text-white' : 'text-slate-400 hover:bg-[#1f2937]'}`}
                                        >
                                            Gigue
                                        </button>
                                    </div>

                                </div>
                            </div>
                            <div className="flex-1 w-full relative min-h-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartHistory} margin={{ top: 10, right: 0, bottom: 0, left: -20 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                        <XAxis dataKey="time" stroke="#475569" fontSize={12} tickMargin={10} />
                                        <YAxis stroke="#475569" fontSize={12} tickFormatter={(val) => `${val}`} />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc', fontSize: '12px' }}
                                            itemStyle={{ color: '#cbd5e1' }}
                                            cursor={{ stroke: '#64748b', strokeWidth: 1, strokeDasharray: '5 5' }}
                                        />
                                        {/* Cada área representa un Slice. Al no tener stackId, son superpuestas independientemente. El orden determina quién dibuja por encima. */}
                                        {visibleSlices.eMBB && <Area type="monotone" name="eMBB" dataKey={`eMBB_${activeMetric}`} stroke="#3b82f6" fill="#3b82f6" fillOpacity={chartMode === 'stacked' ? 0.3 : 0} strokeWidth={2} isAnimationActive={false} />}
                                        {visibleSlices.URLLC && <Area type="monotone" name="URLLC" dataKey={`URLLC_${activeMetric}`} stroke="#f97316" fill="#f97316" fillOpacity={chartMode === 'stacked' ? 0.3 : 0} strokeWidth={2} isAnimationActive={false} />}
                                        {visibleSlices.mMTC && <Area type="monotone" name="mMTC" dataKey={`mMTC_${activeMetric}`} stroke="#10b981" fill="#10b981" fillOpacity={chartMode === 'stacked' ? 0.3 : 0} strokeWidth={2} isAnimationActive={false} />}
                                        {visibleSlices.V2X && <Area type="monotone" name="V2X" dataKey={`V2X_${activeMetric}`} stroke="#a855f7" fill="#a855f7" fillOpacity={chartMode === 'stacked' ? 0.3 : 0} strokeWidth={2} isAnimationActive={false} />}
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                            
                            <div className="flex gap-6 items-center mt-6 px-2 shrink-0">
                                <label className="flex items-center gap-2 text-xs font-mono cursor-pointer hover:opacity-80 transition-opacity">
                                    <div className={`w-2.5 h-2.5 rounded-full ${visibleSlices.eMBB ? 'bg-blue-500' : 'bg-slate-700'}`}></div>
                                    <span className={visibleSlices.eMBB ? 'text-slate-300' : 'text-slate-500'}>eMBB</span>
                                    <input type="checkbox" checked={visibleSlices.eMBB} onChange={() => toggleSlice('eMBB')} className="hidden" />
                                </label>
                                <label className="flex items-center gap-2 text-xs font-mono cursor-pointer hover:opacity-80 transition-opacity">
                                    <div className={`w-2.5 h-2.5 rounded-full ${visibleSlices.URLLC ? 'bg-orange-500' : 'bg-slate-700'}`}></div>
                                    <span className={visibleSlices.URLLC ? 'text-slate-300' : 'text-slate-500'}>URLLC</span>
                                    <input type="checkbox" checked={visibleSlices.URLLC} onChange={() => toggleSlice('URLLC')} className="hidden" />
                                </label>
                                <label className="flex items-center gap-2 text-xs font-mono cursor-pointer hover:opacity-80 transition-opacity">
                                    <div className={`w-2.5 h-2.5 rounded-full ${visibleSlices.mMTC ? 'bg-emerald-500' : 'bg-slate-700'}`}></div>
                                    <span className={visibleSlices.mMTC ? 'text-slate-300' : 'text-slate-500'}>mMTC</span>
                                    <input type="checkbox" checked={visibleSlices.mMTC} onChange={() => toggleSlice('mMTC')} className="hidden" />
                                </label>
                                <label className="flex items-center gap-2 text-xs font-mono cursor-pointer hover:opacity-80 transition-opacity">
                                    <div className={`w-2.5 h-2.5 rounded-full ${visibleSlices.V2X ? 'bg-purple-500' : 'bg-slate-700'}`}></div>
                                    <span className={visibleSlices.V2X ? 'text-slate-300' : 'text-slate-500'}>V2X</span>
                                    <input type="checkbox" checked={visibleSlices.V2X} onChange={() => toggleSlice('V2X')} className="hidden" />
                                </label>
                            </div>
                        </div> 

                        {/* COLUMNA DERECHA (Streamlines y Heatmap apilados) */}
                        <div className="flex flex-col gap-6 xl:col-span-1 h-[550px]">
                            <div className="flex-1 min-h-0">
                                <LiveStreamlines />
                            </div>
                            <div className="flex-1 min-h-0">
                                <IntensityHeatmap />
                            </div>
                        </div>
                    </div>  </div>
            )}
            </div>
        </div>
    );
}

export default Dashboard;
