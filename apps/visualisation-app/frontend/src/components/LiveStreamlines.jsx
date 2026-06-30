import { useEffect, useRef } from 'react';
import { useMetrics } from '../context/MetricsContext';

class Particle {
    constructor(y, speed, color, ctx, canvasWidth) {
        this.x = 0;
        this.y = y;
        this.speed = speed;
        this.color = color;
        this.ctx = ctx;
        this.canvasWidth = canvasWidth;
        this.length = Math.random() * 20 + 10;
        this.alpha = Math.random() * 0.5 + 0.5;
    }

    update() {
        this.x += this.speed;
    }

    draw() {
        this.ctx.beginPath();
        this.ctx.moveTo(this.x, this.y);
        this.ctx.lineTo(this.x - this.length, this.y);
        this.ctx.strokeStyle = this.color;
        this.ctx.lineWidth = 2;
        this.ctx.globalAlpha = this.alpha;
        this.ctx.stroke();
    }
}

export default function LiveStreamlines({ filterSlice }) {
    const canvasRef = useRef(null);
    const { metrics } = useMetrics();
    const particlesRef = useRef([]);

    const sliceDefinitions = [
        { id: 'embb', color: '#3b82f6', y: 30, metricKey: 'slice1_eMBB' },
        { id: 'urllc', color: '#f97316', y: 70, metricKey: 'slice2_URLLC' },
        { id: 'mmtc', color: '#10b981', y: 110, metricKey: 'slice3_mMTC' },
        { id: 'v2x', color: '#a855f7', y: 150, metricKey: 'slice4_V2X' },
    ];

    useEffect(() => {
        if (!metrics) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrameId;

        let activeSlices = sliceDefinitions.map(def => ({
            ...def,
            ues: metrics[def.metricKey].connected_ues,
            latency: metrics[def.metricKey].latency
        }));

        if (filterSlice) {
            activeSlices = activeSlices.filter(s => s.id === filterSlice.toLowerCase());
            if (activeSlices.length > 0) activeSlices[0].y = 100; // Center it if only one
        }

        const render = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw grid lines
            ctx.strokeStyle = '#2a2e3f';
            ctx.lineWidth = 1;
            ctx.globalAlpha = 0.5;
            for (let i = 0; i < canvas.width; i += 40) {
                ctx.beginPath();
                ctx.moveTo(i, 0);
                ctx.lineTo(i, canvas.height);
                ctx.stroke();
            }

            // Spawn new particles
            activeSlices.forEach(slice => {
                const spawnProb = Math.min(slice.ues / 5000, 0.5); 
                if (Math.random() < spawnProb) {
                    const speed = Math.max(1, 10 - (slice.latency / 20));
                    const randomY = slice.y + (Math.random() * (filterSlice ? 40 : 10) - (filterSlice ? 20 : 5));
                    
                    particlesRef.current.push(new Particle(randomY, speed, slice.color, ctx, canvas.width));
                }
            });

            // Update and draw existing particles
            particlesRef.current = particlesRef.current.filter(p => p.x - p.length < canvas.width);
            particlesRef.current.forEach(p => {
                p.update();
                p.draw();
            });

            ctx.globalAlpha = 1.0;
            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => cancelAnimationFrame(animationFrameId);
    }, [metrics, filterSlice]);

    const legendItems = filterSlice 
        ? [ { id: filterSlice.toUpperCase(), color: sliceDefinitions.find(s => s.id === filterSlice.toLowerCase())?.color, val: metrics?.[sliceDefinitions.find(s => s.id === filterSlice.toLowerCase())?.metricKey]?.connected_ues } ]
        : [
            { id: 'eMBB', color: '#3b82f6', val: metrics?.slice1_eMBB?.connected_ues },
            { id: 'URLLC', color: '#f97316', val: metrics?.slice2_URLLC?.connected_ues },
            { id: 'mMTC', color: '#10b981', val: metrics?.slice3_mMTC?.connected_ues },
            { id: 'V2X', color: '#a855f7', val: metrics?.slice4_V2X?.connected_ues },
        ];

    return (
        <div className="bg-[#12141c] border border-[#2a2e3f] rounded-2xl p-6 h-full flex flex-col">
            <h3 className="text-sm font-bold text-slate-300 mb-1 shrink-0">Live Streamlines</h3>
            <p className="text-[10px] text-slate-500 font-mono mb-4 shrink-0">Particle speed + density ≈ slice load</p>
            
            <div className="flex-1 w-full relative min-h-0 overflow-hidden rounded border border-slate-800 bg-[#0d1017]">
                <canvas 
                    ref={canvasRef} 
                    width={800} 
                    height={200} 
                    className="w-full h-full block"
                />
            </div>

            {/* Bottom Legend */}
            <div className="flex flex-wrap gap-4 mt-4 shrink-0">
                {metrics && legendItems.map(item => (
                    <div key={item.id} className="flex items-center gap-1.5 text-xs font-mono">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                        <span className="text-slate-500">{item.id} · <span className="text-slate-300">{item.val}</span></span>
                    </div>
                ))}
            </div>
        </div>
    );
}
