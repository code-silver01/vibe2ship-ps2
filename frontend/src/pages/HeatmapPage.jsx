import { useState, useEffect } from 'react';
import api from '../services/api';

export default function HeatmapPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHeatmap = async () => {
      try {
        const res = await api.getHeatmap();
        setData(res);
      } catch (err) {
        console.error('Failed to load heatmap:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHeatmap();
  }, []);

  const zones = data?.zones || [];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-civic-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">Predictive Maintenance Heatmap</h1>
          <p className="text-civic-400 mt-1">AI-driven risk scoring based on complaint density & infrastructure age</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Col: Static Map with Overlay */}
        <div className="lg:col-span-2">
          <div className="card h-[600px] border-civic-700 shadow-[0_0_40px_rgba(139,92,246,0.15)] relative overflow-hidden bg-civic-950 flex flex-col items-center justify-center">
            {/* Dark Purple Static Map Background */}
            <div className="absolute inset-0 bg-[url('/map_bg.png')] bg-cover bg-center opacity-70 mix-blend-screen"></div>
            
            {/* Artificial Heat Spots overlay based on zones */}
            {zones.map((zone, idx) => (
              <div 
                key={idx}
                className="absolute rounded-full blur-3xl opacity-60 mix-blend-screen pointer-events-none"
                style={{
                  width: `${zone.risk_score * 4}px`,
                  height: `${zone.risk_score * 4}px`,
                  top: `${40 + (Math.random() * 40 - 20)}%`, // Mock positions on the map
                  left: `${40 + (Math.random() * 40 - 20)}%`,
                  backgroundColor: zone.risk_level === 'critical' ? '#ef4444' : zone.risk_level === 'high' ? '#8b5cf6' : '#3b82f6',
                  boxShadow: `0 0 ${zone.risk_score * 2}px ${zone.risk_level === 'critical' ? '#ef4444' : '#8b5cf6'}`,
                  animation: `pulse ${3 + Math.random() * 2}s infinite alternate`
                }}
              />
            ))}

            <div className="z-10 text-center p-8 bg-civic-950/80 backdrop-blur-md rounded-2xl border border-civic-700 max-w-md shadow-[0_0_30px_rgba(139,92,246,0.3)]">
              <div className="text-4xl mb-4 drop-shadow-[0_0_15px_rgba(139,92,246,0.8)]">🌐</div>
              <h3 className="text-lg font-bold mb-2 text-white">Live Intelligence Layer</h3>
              <p className="text-civic-300 text-sm mb-6">
                City grid mapped with predictive AI overlays. Neon clusters indicate critical infrastructure risks.
              </p>
              <div className="flex flex-wrap justify-center gap-2 text-xs">
                {zones.map(z => (
                  <span key={z.ward_id} className={`px-3 py-1.5 rounded-full border shadow-lg ${
                    z.risk_level === 'critical' ? 'bg-danger-500/20 border-danger-500 text-danger-400 shadow-danger-500/20' :
                    z.risk_level === 'high' ? 'bg-civic-500/30 border-civic-500 text-civic-300 shadow-civic-500/30' :
                    'bg-civic-800/80 border-civic-700 text-civic-400'
                  }`}>
                    {z.ward_name} ({z.risk_score})
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Zone List */}
        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
          <h2 className="text-xl font-bold sticky top-0 bg-civic-950/90 backdrop-blur py-3 z-10 border-b border-civic-800 text-white">
            Risk Zones Ranked
          </h2>
          
          {zones.map((zone, idx) => (
            <div key={zone.ward_id} className={`card p-5 border-l-4 transition-all duration-300 hover:shadow-[0_0_20px_rgba(139,92,246,0.15)] ${
              zone.risk_level === 'critical' ? 'border-l-danger-500 bg-gradient-to-r from-danger-900/20 to-transparent' :
              zone.risk_level === 'high' ? 'border-l-civic-500 bg-gradient-to-r from-civic-900/30 to-transparent' :
              zone.risk_level === 'medium' ? 'border-l-civic-400' : 'border-l-success-500'
            }`}>
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-bold text-white">#{idx + 1} {zone.ward_name}</h3>
                <span className={`badge ${
                  zone.risk_level === 'critical' ? 'bg-danger-500/20 text-danger-400 border border-danger-500/30' :
                  zone.risk_level === 'high' ? 'bg-civic-500/20 text-civic-300 border border-civic-500/30' :
                  'bg-civic-800 text-civic-400'
                }`}>
                  Risk: {zone.risk_score}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                <div className="bg-civic-900/50 p-3 rounded-lg border border-civic-800/50">
                  <div className="text-civic-400 mb-1">Active Complaints</div>
                  <div className="font-mono text-sm text-white">{zone.active_complaints}</div>
                </div>
                <div className="bg-civic-900/50 p-3 rounded-lg border border-civic-800/50">
                  <div className="text-civic-400 mb-1">Avg Infra Age</div>
                  <div className="font-mono text-sm text-white">{zone.avg_infra_age_years} yrs</div>
                </div>
              </div>

              <div className="text-xs leading-relaxed text-civic-300">
                <span className="font-semibold text-civic-100">AI Assessment: </span>
                {zone.risk_level === 'critical' 
                  ? 'High probability of cascaded infrastructure failure. Immediate preventative maintenance recommended.' 
                  : zone.risk_level === 'high'
                  ? 'Elevated wear detected. Schedule routine inspection within 30 days.'
                  : 'Normal wear patterns. Continue standard maintenance schedule.'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
