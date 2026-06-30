import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Activity, Zap, Clock, AlertTriangle, Users } from 'lucide-react';
import { useMetrics } from '../context/MetricsContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import IntensityHeatmap from '../components/IntensityHeatmap';
import LiveStreamlines from '../components/LiveStreamlines';

export default function SliceDetail() {
    const { sliceId } = useParams(); // 'embb', 'urllc', 'mmtc', 'v2x'
    const navigate = useNavigate();
    const { metrics, history } = useMetrics();

    // Determinar los colores y títulos según el slice
    const sliceInfo = {
        embb: { title: 'eMBB', subtitle: 'High Speeds', color: '#3b82f6', prefix: 'eMBB', metricKey: 'slice1_eMBB' },
        urllc: { title: 'URLLC', subtitle: 'Low Latency', color: '#f97316', prefix: 'URLLC', metricKey: 'slice2_URLLC' },
        mmtc: { title: 'mMTC', subtitle: 'IoT Devices', color: '#10b981', prefix: 'mMTC', metricKey: 'slice3_mMTC' },
        v2x: { title: 'V2X', subtitle: 'Connected Cars', color: '#a855f7', prefix: 'V2X', metricKey: 'slice4_V2X' }
    };

    const currentSlice = sliceInfo[sliceId.toLowerCase()];

    if (!metrics) {
        return (
            <div className="min-h-screen bg-[#0d1117] flex flex-col items-center justify-center text-slate-500 space-y-4">
                <Activity className="animate-bounce" size={48} />
                <div className="animate-pulse font-semibold tracking-widest uppercase">Waiting for telemetry...</div>
            </div>
        );
    }

    const currentMetrics = metrics[currentSlice.metricKey];

    const renderChart = (dataKey, title, unit, icon) => (
        <div className="bg-[#12141c] border border-[#2a2e3f] rounded-2xl p-6 shadow-lg flex flex-col h-[300px]">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                        {icon} {title}
                    </h3>
                    <p className="text-[10px] text-slate-500 font-mono mt-1">{currentSlice.title} · {unit}</p>
                </div>
                <div className="text-xl font-mono font-bold text-white">
                    {currentMetrics[dataKey.split('_')[1]] || currentMetrics.packet_loss} 
                    <span className="text-xs text-slate-500 ml-1">{unit}</span>
                </div>
            </div>
            <div className="flex-1 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={history} margin={{ top: 5, right: 0, bottom: 0, left: -20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis dataKey="time" stroke="#475569" fontSize={10} tickMargin={10} minTickGap={30} />
                        <YAxis stroke="#475569" fontSize={10} tickFormatter={(val) => `${val}`} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc', fontSize: '12px' }}
                            itemStyle={{ color: currentSlice.color }}
                            cursor={{ stroke: '#64748b', strokeWidth: 1, strokeDasharray: '5 5' }}
                        />
                        <Area 
                            type="monotone" 
                            name={title} 
                            dataKey={dataKey} 
                            stroke={currentSlice.color} 
                            fill={currentSlice.color} 
                            fillOpacity={0.2} 
                            strokeWidth={2} 
                            isAnimationActive={false} 
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0d1117] text-slate-100 p-4 md:p-6 font-sans">
            {/* HEADER */}
            <header className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#12141c] border border-[#2a2e3f] rounded-2xl p-4 shadow-lg">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/')}
                        className="bg-[#1e293b] border border-[#334155] p-3 rounded-xl hover:bg-[#334155] transition-colors flex items-center justify-center text-slate-300"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-lg md:text-xl font-bold text-white tracking-wide flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: currentSlice.color }}></div>
                            {currentSlice.title} Detailed Telemetry
                        </h1>
                        <p className="text-xs text-slate-400 font-mono tracking-wider mt-0.5">
                            {currentSlice.subtitle} · Real-time Metrics
                        </p>
                    </div>
                </div>

                {/* Minibox for Connected UEs */}
                <div className="flex items-center gap-4 bg-[#161b22] border border-[#2a2e3f] rounded-xl p-3 px-5 shadow-inner">
                    <div className="bg-[#1e293b] p-2 rounded-lg border border-[#334155]">
                        <Users size={20} className="text-emerald-400" />
                    </div>
                    <div>
                        <div className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider mb-1">Connected UEs</div>
                        <div className="text-xl font-bold font-mono text-white leading-none">
                            {currentMetrics.connected_ues} <span className="text-xs text-slate-500 font-sans ml-1">devices</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* CHARTS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
                {renderChart(`${currentSlice.prefix}_throughput`, 'Throughput', 'Mbps', <Activity size={16} className="text-blue-400" />)}
                {renderChart(`${currentSlice.prefix}_latency`, 'Latency', 'ms', <Zap size={16} className="text-orange-400" />)}
                {renderChart(`${currentSlice.prefix}_jitter`, 'Jitter', 'ms', <Clock size={16} className="text-purple-400" />)}
                {renderChart(`${currentSlice.prefix}_packetLoss`, 'Packet Loss', '%', <AlertTriangle size={16} className="text-red-400" />)}
            </div>

            {/* VISUAL COMPONENTS GRID */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="h-[300px]">
                    <LiveStreamlines filterSlice={sliceId} />
                </div>
                <div className="h-[300px]">
                    <IntensityHeatmap filterSlice={sliceId} />
                </div>
            </div>
        </div>
    );
}
