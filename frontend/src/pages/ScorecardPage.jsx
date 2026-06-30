import { useState, useEffect } from 'react';
import api from '../services/api';

export default function ScorecardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchScorecard = async () => {
      try {
        const res = await api.getScorecard();
        setData(res);
      } catch (err) {
        console.error('Failed to load scorecard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchScorecard();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-civic-500"></div>
      </div>
    );
  }

  const scorecard = data?.scorecard || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-display font-bold mb-4">Department Scorecard</h1>
        <p className="text-xl text-civic-400 max-w-2xl mx-auto">
          Public transparency report tracking municipal department performance, resolution rates, and SLA adherence.
        </p>
      </div>

      <div className="grid gap-6">
        {scorecard.map((dept, idx) => (
          <div key={dept.department} className="card overflow-hidden">
            <div className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold ${
                    idx === 0 ? 'bg-warning-500 text-white shadow-lg shadow-warning-500/20' :
                    idx === 1 ? 'bg-civic-300 text-civic-900' :
                    idx === 2 ? 'bg-warning-700 text-white' : 'bg-civic-800 text-civic-400'
                  }`}>
                    #{idx + 1}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{dept.department_name}</h2>
                    <p className="text-civic-400 text-sm">Ranked based on SLA adherence</p>
                  </div>
                </div>
                
                <div className="flex gap-8">
                  <div className="text-right">
                    <div className="text-3xl font-bold text-success-400">{dept.sla_adherence_pct}%</div>
                    <div className="text-xs text-civic-400 uppercase tracking-wide">SLA Met</div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold">{dept.resolution_rate}%</div>
                    <div className="text-xs text-civic-400 uppercase tracking-wide">Resolved</div>
                  </div>
                </div>
              </div>

              {/* Progress Bars */}
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-civic-300">Ticket Volume</span>
                    <span className="font-mono">{dept.resolved_tickets} / {dept.total_tickets}</span>
                  </div>
                  <div className="w-full bg-civic-800 rounded-full h-2">
                    <div 
                      className="bg-civic-500 h-2 rounded-full" 
                      style={{ width: `${dept.total_tickets > 0 ? (dept.resolved_tickets / dept.total_tickets) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-civic-800">
                  <div>
                    <div className="text-sm text-civic-400 mb-1">Avg Resolution Time</div>
                    <div className="font-mono text-lg">{dept.avg_resolution_hours}h</div>
                  </div>
                  <div>
                    <div className="text-sm text-civic-400 mb-1">Currently Active</div>
                    <div className="font-mono text-lg text-warning-400">{dept.active_tickets}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-8 text-center text-sm text-civic-500">
        Data updated in real-time via the CivicPulse Orchestrator Pipeline.
      </div>
    </div>
  );
}
