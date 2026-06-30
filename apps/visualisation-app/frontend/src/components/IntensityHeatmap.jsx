import { useMetrics } from '../context/MetricsContext';

export default function IntensityHeatmap({ filterSlice }) {
    const { metrics, history } = useMetrics();

    if (!history || history.length === 0) return null;

    // Helper to calculate opacity based on value relative to max expected value
    const getOpacity = (value, max) => {
        const ratio = Math.min(value / max, 1.0);
        return Math.max(0.2, ratio); // Minimum opacity 0.2
    };

    let slices = [
        { id: 'eMBB', color: '#3b82f6', dataKey: 'eMBB_throughput', max: 1000 },
        { id: 'URLLC', color: '#f97316', dataKey: 'URLLC_throughput', max: 200 },
        { id: 'mMTC', color: '#10b981', dataKey: 'mMTC_throughput', max: 50 },
        { id: 'V2X', color: '#a855f7', dataKey: 'V2X_throughput', max: 50 },
    ];

    if (filterSlice) {
        slices = slices.filter(s => s.id.toLowerCase() === filterSlice.toLowerCase());
    }

    // We only want to visualize the last 30 samples in the heatmap
    const heatmapHistory = history.slice(-30);
    // Ensure we always render 30 blocks even if history is short
    const paddedHistory = [...Array(Math.max(0, 30 - heatmapHistory.length)).fill(null), ...heatmapHistory];

    return (
        <div className="bg-[#12141c] border border-[#2a2e3f] rounded-2xl p-6 h-full flex flex-col">
            <h3 className="text-sm font-bold text-slate-300 mb-1">Flux Intensity Heatmap</h3>
            <p className="text-[10px] text-slate-500 font-mono mb-4">Normalized load per slice · last 30 samples</p>

            <div className="flex-1 flex flex-col justify-center gap-2">
                {slices.map((slice) => (
                    <div key={slice.id} className="flex items-center gap-4">
                        <div className="w-16 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: slice.color }}></div>
                            <span className="text-[10px] text-slate-400 font-mono">{slice.id}</span>
                        </div>
                        <div className="flex flex-1 gap-1">
                            {paddedHistory.map((point, i) => {
                                const val = point ? point[slice.dataKey] : 0;
                                const opacity = point ? getOpacity(val, slice.max) : 0.05;
                                
                                return (
                                    <div 
                                        key={i} 
                                        className="flex-1 h-6 rounded-sm transition-all duration-300"
                                        style={{ 
                                            backgroundColor: slice.color, 
                                            opacity: opacity,
                                            boxShadow: opacity > 0.8 ? `0 0 8px ${slice.color}` : 'none'
                                        }}
                                        title={point ? `${slice.id}: ${val} Mbps` : 'No data'}
                                    ></div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex justify-between items-center mt-6 pl-[80px] text-[10px] text-slate-500 font-mono">
                <span>30 samples ago</span>
                <div className="flex items-center gap-2">
                    <span>low</span>
                    <div className="flex gap-1">
                        <div className="w-4 h-2 bg-slate-400 opacity-20"></div>
                        <div className="w-4 h-2 bg-slate-400 opacity-40"></div>
                        <div className="w-4 h-2 bg-slate-400 opacity-60"></div>
                        <div className="w-4 h-2 bg-slate-400 opacity-80"></div>
                        <div className="w-4 h-2 bg-slate-400 opacity-100"></div>
                    </div>
                    <span>high</span>
                </div>
                <span>now</span>
            </div>
        </div>
    );
}
