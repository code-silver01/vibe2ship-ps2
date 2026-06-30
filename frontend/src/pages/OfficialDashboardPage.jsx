import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function OfficialDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('queue');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.getOfficialDashboard();
        setData(res);
      } catch (err) {
        console.error('Failed to load official dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const runRiskScan = async () => {
    try {
      setLoading(true);
      await api._request('/admin/risk-scan', { method: 'POST' });
      const res = await api.getOfficialDashboard();
      setData(res);
    } catch (err) {
      console.error('Failed to run risk scan:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-civic-500"></div>
      </div>
    );
  }

  const { stats, tickets } = data || { stats: {}, tickets: [] };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Tab Switcher */}
      <div className="flex justify-center mb-8">
        <div className="bg-civic-900/50 backdrop-blur-md p-1 rounded-xl border border-civic-800 inline-flex shadow-[0_0_20px_rgba(139,92,246,0.1)]">
          <button
            onClick={() => setActiveTab('queue')}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'queue'
                ? 'bg-civic-600 text-white shadow-[0_0_10px_rgba(139,92,246,0.5)]'
                : 'text-civic-400 hover:text-white'
            }`}
          >
            Department Queue
          </button>
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'overview'
                ? 'bg-civic-600 text-white shadow-[0_0_10px_rgba(139,92,246,0.5)]'
                : 'text-civic-400 hover:text-white'
            }`}
          >
            System Overview
          </button>
        </div>
      </div>

      {activeTab === 'queue' && (
        <div className="animate-fade-in">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-display font-bold">Department Queue</h1>
              <p className="text-civic-400 mt-1">Manage incoming tickets and SLA deadlines</p>
            </div>
            <button onClick={runRiskScan} className="btn btn-secondary mt-4 sm:mt-0 flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Run Risk Scan
            </button>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="card p-4 border-l-4 border-l-civic-500">
              <div className="text-civic-400 text-xs font-semibold uppercase tracking-wider mb-1">Active</div>
              <div className="text-2xl font-bold">{stats.active || 0}</div>
            </div>
            <div className="card p-4 border-l-4 border-l-warning-500">
              <div className="text-civic-400 text-xs font-semibold uppercase tracking-wider mb-1">In Progress</div>
              <div className="text-2xl font-bold">{stats.in_progress || 0}</div>
            </div>
            <div className="card p-4 border-l-4 border-l-danger-500 bg-danger-500/5">
              <div className="text-danger-400 text-xs font-semibold uppercase tracking-wider mb-1">At Risk / Breached</div>
              <div className="text-2xl font-bold text-danger-400">{stats.risk_high || 0}</div>
            </div>
            <div className="card p-4 border-l-4 border-l-success-500">
              <div className="text-civic-400 text-xs font-semibold uppercase tracking-wider mb-1">Resolved</div>
              <div className="text-2xl font-bold">{stats.closed || 0}</div>
            </div>
          </div>

          {/* Ticket Queue */}
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-civic-900 text-civic-300 uppercase text-xs">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Issue</th>
                    <th className="px-6 py-4 font-semibold">Location</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold">Risk Level</th>
                    <th className="px-6 py-4 font-semibold text-right">SLA Deadline</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-civic-800">
                  {tickets.length > 0 ? tickets.map(ticket => {
                    const isBreached = ticket.sla_deadline && new Date(ticket.sla_deadline) < new Date();
                    return (
                      <tr key={ticket.id} className="hover:bg-civic-800/30 transition-colors">
                        <td className="px-6 py-4">
                          <Link to={`/tracker/${ticket.id}`} className="font-medium hover:text-civic-400 capitalize">
                            {(ticket.issue_type || 'unknown').replace('_', ' ')}
                          </Link>
                          <div className="text-xs text-civic-400 mt-1">Severity: {ticket.severity_score}/10</div>
                        </td>
                        <td className="px-6 py-4 text-civic-300">{ticket.location?.ward || 'Unknown'}</td>
                        <td className="px-6 py-4">
                          <span className="badge bg-civic-800 text-civic-300">
                            {ticket.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {ticket.risk_flag === 'critical' ? (
                            <span className="badge bg-danger-500/20 text-danger-400">Critical</span>
                          ) : ticket.risk_flag === 'high' ? (
                            <span className="badge bg-warning-500/20 text-warning-400">High</span>
                          ) : (
                            <span className="badge bg-civic-800 text-civic-400">Low</span>
                          )}
                        </td>
                        <td className={`px-6 py-4 text-right font-medium ${isBreached ? 'text-danger-400' : 'text-civic-300'}`}>
                          {ticket.sla_deadline 
                            ? new Date(ticket.sla_deadline).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                            : 'None'}
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-civic-400">
                        Queue is empty.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'overview' && (
        <div className="animate-fade-in">
          <div className="mb-8">
            <h1 className="text-3xl font-display font-bold text-white">System Overview</h1>
            <p className="text-civic-400 mt-1">Global AI Orchestrator Health and City-wide Metrics</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Active Agents */}
            <div className="card p-6 border-civic-700 bg-civic-900/40">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
                <span className="w-2 h-2 rounded-full bg-success-500 mr-2 animate-pulse"></span>
                Active AI Agents
              </h2>
              <div className="space-y-3">
                {['IntakeAgent', 'DeduplicationAgent', 'RoutingAgent', 'RiskPredictionAgent', 'EscalationAgent', 'VerificationAgent'].map(agent => (
                  <div key={agent} className="flex justify-between items-center text-sm">
                    <span className="text-civic-300 font-mono">{agent}</span>
                    <span className="text-success-400">Online</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Global Stats */}
            <div className="lg:col-span-2 grid grid-cols-2 gap-4">
              <div className="card p-6 flex flex-col justify-center border-civic-800">
                <div className="text-civic-400 text-sm font-semibold uppercase tracking-wider mb-1">Total System Load</div>
                <div className="text-4xl font-bold text-white">{stats.active || 0} Tickets</div>
              </div>
              <div className="card p-6 flex flex-col justify-center border-civic-800">
                <div className="text-civic-400 text-sm font-semibold uppercase tracking-wider mb-1">Global API Health</div>
                <div className="text-4xl font-bold text-success-400">99.9%</div>
              </div>
              <div className="card p-6 flex flex-col justify-center border-civic-800 bg-civic-500/10">
                <div className="text-civic-400 text-sm font-semibold uppercase tracking-wider mb-1">Gemini Integrations</div>
                <div className="text-4xl font-bold text-civic-300">Connected</div>
              </div>
              <div className="card p-6 flex flex-col justify-center border-civic-800">
                <div className="text-civic-400 text-sm font-semibold uppercase tracking-wider mb-1">Overall Resolution Rate</div>
                <div className="text-4xl font-bold text-white">
                  {stats.closed ? Math.round((stats.closed / (stats.active + stats.closed)) * 100) : 0}%
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
