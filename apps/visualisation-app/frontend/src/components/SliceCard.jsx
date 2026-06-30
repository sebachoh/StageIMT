import { useNavigate } from 'react-router-dom';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';

export default function SliceCard({ 
    id, 
    title, 
    subtitle, 
    color, 
    sliceData, 
    historyData, 
    dataKey 
}) {
    const navigate = useNavigate();

    // Determinar si hay alerta basada en pérdida de paquetes
    const isLossAlert = sliceData.packet_loss > 1.0;
    
    return (
        <div 
            onClick={() => navigate(`/slice/${id}`)}
            className="bg-[#12141c] hover:bg-[#1a1d27] border border-[#2a2e3f] rounded-xl p-4 transition-all cursor-pointer relative overflow-hidden group"
            style={{ borderTop: `3px solid ${color}` }}
        >
            {/* Top Row: Dot, Title, Subtitle, and Sparkline */}
            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="flex items-start gap-2">
                    <div className="w-2.5 h-2.5 rounded-full mt-1.5" style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }}></div>
                    <div>
                        <h2 className="text-sm font-bold text-white tracking-wide">{title}</h2>
                        <p className="text-[10px] text-slate-500 font-mono tracking-wider">{subtitle}</p>
                    </div>
                </div>
                
                {/* Sparkline */}
                <div className="w-24 h-8 opacity-70 group-hover:opacity-100 transition-opacity">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={historyData}>
                            <YAxis domain={['dataMin - 10', 'dataMax + 10']} hide />
                            <Line 
                                type="monotone" 
                                dataKey={dataKey} 
                                stroke={color} 
                                strokeWidth={1.5} 
                                dot={false} 
                                isAnimationActive={false} 
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Middle Row: Big Number, Unit, Latency */}
            <div className="flex justify-between items-end mb-2 relative z-10">
                <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold font-mono text-white tracking-tighter">
                        {sliceData.throughput}
                    </span>
                    <span className="text-xs text-slate-500 font-bold">Mbps</span>
                </div>
                <div className="text-right">
                    <span className="text-sm font-bold font-mono text-white block">
                        {sliceData.latency} <span className="text-[10px] text-slate-500">ms</span>
                    </span>
                </div>
            </div>

            {/* Bottom Row: Alerts and SLA */}
            <div className="flex justify-between items-center relative z-10 mt-1">
                <div className={`text-xs font-bold font-mono flex items-center gap-1 ${isLossAlert ? 'text-red-500' : 'text-emerald-500'}`}>
                    {isLossAlert ? '↘' : '↗'} {sliceData.packet_loss}%
                </div>
                <div className="text-[10px] text-slate-500 font-mono tracking-wide">
                    SLA 30ms · loss {sliceData.packet_loss}%
                </div>
            </div>

            {/* Subtile Glow on Hover */}
            <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none" 
                style={{ background: `radial-gradient(circle at top right, ${color}, transparent 60%)` }}
            ></div>
        </div>
    );
}
