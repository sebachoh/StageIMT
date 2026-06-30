import { useState } from 'react';
import { useMetrics } from '../context/MetricsContext';
import { AlertTriangle, Settings, RefreshCcw, Zap, Activity, Cpu, Car } from 'lucide-react';

export default function LoadTestPanel() {
    const { setSimulationMode } = useMetrics();
    const [activeMode, setActiveMode] = useState('normal');

    const handleModeChange = (mode, targetSlice = null) => {
        setActiveMode(targetSlice ? targetSlice : mode);
        if (targetSlice) {
            setSimulationMode('stress_slice', { targetSlice });
        } else {
            setSimulationMode(mode);
        }
    };

    return (
        <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl p-6 border border-slate-700 shadow-2xl h-full flex flex-col">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2 border-b border-slate-800 pb-4">
                <Settings className="text-slate-400" />
                Contrôle de Charge
            </h2>

            <div className="flex flex-col gap-4 mb-6">
                <button
                    onClick={() => handleModeChange('normal')}
                    className={`w-full py-3 px-4 rounded-xl flex items-center justify-start gap-3 font-bold transition-all ${
                        activeMode === 'normal' 
                        ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)]' 
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                >
                    <RefreshCcw size={18} /> Opération Normale
                </button>
            </div>

            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 flex-1 flex flex-col">
                <h3 className="text-xs text-amber-500 font-bold uppercase tracking-widest mb-4">Stress par Tranche (Slice)</h3>
                
                <div className="flex flex-col gap-3 flex-1">
                    <button
                        onClick={() => handleModeChange('stress_slice', 'slice1_eMBB')}
                        className={`w-full py-2 px-3 rounded-lg flex items-center justify-start gap-3 text-sm font-bold transition-all ${
                            activeMode === 'slice1_eMBB'
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.2)]'
                            : 'bg-slate-900 border border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                        }`}
                    >
                        <Zap size={16} className={activeMode === 'slice1_eMBB' ? 'text-blue-400' : 'text-slate-500'} />
                        Stress eMBB
                    </button>

                    <button
                        onClick={() => handleModeChange('stress_slice', 'slice2_URLLC')}
                        className={`w-full py-2 px-3 rounded-lg flex items-center justify-start gap-3 text-sm font-bold transition-all ${
                            activeMode === 'slice2_URLLC'
                            ? 'bg-orange-500/20 text-orange-400 border border-orange-500/50 shadow-[0_0_10px_rgba(249,115,22,0.2)]'
                            : 'bg-slate-900 border border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                        }`}
                    >
                        <Activity size={16} className={activeMode === 'slice2_URLLC' ? 'text-orange-400' : 'text-slate-500'} />
                        Stress URLLC
                    </button>

                    <button
                        onClick={() => handleModeChange('stress_slice', 'slice3_mMTC')}
                        className={`w-full py-2 px-3 rounded-lg flex items-center justify-start gap-3 text-sm font-bold transition-all ${
                            activeMode === 'slice3_mMTC'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                            : 'bg-slate-900 border border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                        }`}
                    >
                        <Cpu size={16} className={activeMode === 'slice3_mMTC' ? 'text-emerald-400' : 'text-slate-500'} />
                        Stress mMTC
                    </button>

                    <button
                        onClick={() => handleModeChange('stress_slice', 'slice4_V2X')}
                        className={`w-full py-2 px-3 rounded-lg flex items-center justify-start gap-3 text-sm font-bold transition-all ${
                            activeMode === 'slice4_V2X'
                            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50 shadow-[0_0_10px_rgba(168,85,247,0.2)]'
                            : 'bg-slate-900 border border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                        }`}
                    >
                        <Car size={16} className={activeMode === 'slice4_V2X' ? 'text-purple-400' : 'text-slate-500'} />
                        Stress V2X
                    </button>
                </div>
            </div>
        </div>
    );
}
