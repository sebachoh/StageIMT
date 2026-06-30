import { useState } from 'react';
import { useMetrics } from '../context/MetricsContext';

export default function FluxFlowDiagram() {
    const { metrics } = useMetrics();
    const [hoveredSlice, setHoveredSlice] = useState(null);

    if (!metrics) return null;

    // Normalizamos el ancho de las líneas basándonos en el throughput
    // Asumiremos un max_throughput de ~2000 para el escalado visual
    const getStrokeWidth = (throughput) => {
        const minWidth = 2;
        const maxWidth = 20;
        return Math.max(minWidth, Math.min(maxWidth, (throughput / 500) * 10));
    };

    const slices = [
        { id: 'embb', name: 'eMBB', color: '#3b82f6', throughput: metrics.slice1_eMBB.throughput, y: 15 },
        { id: 'urllc', name: 'URLLC', color: '#f97316', throughput: metrics.slice2_URLLC.throughput, y: 40 },
        { id: 'mmtc', name: 'mMTC', color: '#10b981', throughput: metrics.slice3_mMTC.throughput, y: 65 },
        { id: 'v2x', name: 'V2X', color: '#a855f7', throughput: metrics.slice4_V2X.throughput, y: 90 },
    ];

    const inputs = [
        { name: 'Macro RAN', y: 20 },
        { name: 'Small Cells', y: 50 },
        { name: 'Fixed Wireless', y: 80 },
    ];

    const outputs = [
        { name: 'Cloud / DC', y: 20 },
        { name: 'Edge MEC', y: 50 },
        { name: 'Internet', y: 80 },
    ];

    // SVG ViewBox
    const width = 800;
    const height = 400;

    const col1X = 100;
    const col2X = 400;
    const col3X = 700;

    const renderPath = (startX, startY, endX, endY, color, throughput, sliceId) => {
        // Cubic bezier para un efecto suave
        const controlX1 = startX + (endX - startX) * 0.5;
        const controlX2 = startX + (endX - startX) * 0.5;
        const d = `M ${startX} ${startY} C ${controlX1} ${startY}, ${controlX2} ${endY}, ${endX} ${endY}`;
        
        // Estado por defecto: línea delgada, opacidad media
        let opacity = 0.3;
        let strokeWidth = 2; // Delgada por defecto

        // Si hay un slice seleccionado (hovered)
        if (hoveredSlice) {
            if (hoveredSlice === sliceId) {
                opacity = 0.8;
                // Al hacer hover, se vuelve gruesa basándose en su throughput
                strokeWidth = getStrokeWidth(throughput);
            } else {
                opacity = 0.05;
                strokeWidth = 2;
            }
        }

        return (
            <path
                key={d}
                d={d}
                fill="none"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeOpacity={opacity}
                className="transition-all duration-300"
                onMouseEnter={() => setHoveredSlice(sliceId)}
                onMouseLeave={() => setHoveredSlice(null)}
            />
        );
    };

    return (
        <div className="bg-[#12141c] border border-[#2a2e3f] rounded-2xl p-6 h-full flex flex-col">
            <h3 className="text-sm font-bold text-slate-300 mb-1">Flux Flow Diagram</h3>
            <p className="text-[10px] text-slate-500 font-mono mb-4">Pasa el ratón sobre un Slice para aislar su tráfico</p>
            
            <div className="flex-1 w-full relative min-h-[200px]">
                <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="w-full h-full absolute inset-0">
                    {/* Render Links: Inputs to Slices */}
                    {inputs.map((input) => 
                        slices.map((slice) => renderPath(
                            col1X + 10, 
                            (input.y / 100) * height, 
                            col2X - 10, 
                            (slice.y / 100) * height, 
                            slice.color, 
                            slice.throughput,
                            slice.id
                        ))
                    )}

                    {/* Render Links: Slices to Outputs */}
                    {slices.map((slice) => 
                        outputs.map((output) => renderPath(
                            col2X + 10, 
                            (slice.y / 100) * height, 
                            col3X - 10, 
                            (output.y / 100) * height, 
                            slice.color, 
                            slice.throughput,
                            slice.id
                        ))
                    )}

                    {/* Render Input Nodes */}
                    {inputs.map((input) => (
                        <g key={input.name}>
                            <rect x={col1X - 10} y={(input.y / 100) * height - 40} width={10} height={80} fill="#475569" />
                            <text x={col1X + 8} y={(input.y / 100) * height + 4} fill="#94a3b8" fontSize="10" fontFamily="monospace">{input.name}</text>
                        </g>
                    ))}

                    {/* Render Slice Nodes (Middle) */}
                    {slices.map((slice) => (
                        <g 
                            key={slice.name} 
                            className="cursor-pointer transition-transform duration-300 origin-center"
                            onMouseEnter={() => setHoveredSlice(slice.id)}
                            onMouseLeave={() => setHoveredSlice(null)}
                            style={{ transform: hoveredSlice === slice.id ? 'scale(1.1)' : 'scale(1)' }}
                        >
                            <rect 
                                x={col2X - 4} 
                                y={(slice.y / 100) * height - 40} 
                                width={8} 
                                height={80} 
                                fill={slice.color}
                                rx="4"
                                style={{
                                    filter: hoveredSlice === slice.id ? `drop-shadow(0 0 8px ${slice.color})` : 'none',
                                    opacity: hoveredSlice && hoveredSlice !== slice.id ? 0.3 : 1
                                }}
                            />
                            <text 
                                x={col2X} 
                                y={(slice.y / 100) * height - 45} 
                                fill={hoveredSlice === slice.id ? '#ffffff' : '#94a3b8'} 
                                fontSize="12" 
                                fontWeight="bold"
                                fontFamily="monospace" 
                                textAnchor="middle"
                            >
                                {slice.name}
                            </text>
                        </g>
                    ))}

                    {/* Render Output Nodes */}
                    {outputs.map((output) => (
                        <g key={output.name}>
                            <rect x={col3X} y={(output.y / 100) * height - 40} width={10} height={80} fill="#475569" />
                            <text x={col3X - 8} y={(output.y / 100) * height + 4} fill="#94a3b8" fontSize="10" fontFamily="monospace" textAnchor="end">{output.name}</text>
                        </g>
                    ))}
                </svg>
            </div>
        </div>
    );
}
