import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

export default function TrackerPage() {
  const { id } = useParams();
  const { role } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [traces, setTraces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showTrace, setShowTrace] = useState(false);

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const [ticketRes, traceRes] = await Promise.all([
          api.getTicket(id),
          api.getTicketTraces(id)
        ]);
        setTicket(ticketRes.ticket);
        setTraces(traceRes.traces || []);
      } catch (err) {
        console.error('Failed to load ticket:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTicket();

    // In a real app, we would set up a Firestore onSnapshot listener here for live updates
    const interval = setInterval(fetchTicket, 10000); // Polling as fallback
    return () => clearInterval(interval);
  }, [id]);

  const handleApproveEscalation = async () => {
    setActionLoading(true);
    try {
      await api.approveEscalation(id);
      const res = await api.getTicket(id);
      setTicket(res.ticket);
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolve = async () => {
    setActionLoading(true);
    try {
      const fd = new FormData();
      const mockImg = new Blob(['mock_after_image_data'], { type: 'image/jpeg' });
      fd.append('afterImage', mockImg, 'after.jpg');
      
      const res = await api.resolveTicket(id, fd);
      alert(res.verified ? 'Verification Passed!' : 'Verification Failed - Reverted to In Progress');
      
      const ticketRes = await api.getTicket(id);
      setTicket(ticketRes.ticket);
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && !ticket) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-civic-500"></div>
      </div>
    );
  }

  if (!ticket) return <div className="text-center py-12">Ticket not found.</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-display font-bold capitalize">
              {(ticket.issue_type || 'Issue').replace(/_/g, ' ')}
            </h1>
            <span className={`badge ${
              ticket.status === 'closed' || ticket.status === 'verified' ? 'bg-success-500/20 text-success-400' :
              ticket.status === 'pending_citizen_approval' ? 'bg-danger-500/20 text-danger-400 animate-pulse' :
              'bg-warning-500/20 text-warning-400'
            }`}>
              {ticket.status.replace(/_/g, ' ').toUpperCase()}
            </span>
          </div>
          <p className="text-civic-400 text-sm font-mono">ID: {ticket.id}</p>
        </div>
        
        {/* Actions based on status/role */}
        <div className="flex gap-2">
          {ticket.status === 'pending_citizen_approval' && role === 'citizen' && (
            <button 
              onClick={handleApproveEscalation} 
              disabled={actionLoading}
              className="btn btn-danger"
            >
              {actionLoading ? 'Approving...' : 'Approve Escalation (Send RTI)'}
            </button>
          )}
          
          {['active', 'in_progress'].includes(ticket.status) && (role === 'official' || role === 'admin') && (
            <button 
              onClick={handleResolve} 
              disabled={actionLoading}
              className="btn btn-success"
            >
              {actionLoading ? 'Processing...' : 'Mark Resolved (Upload Photo)'}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Col: Details */}
        <div className="md:col-span-2 space-y-6">
          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-4">Report Details</h2>
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-3 gap-2 border-b border-civic-800 pb-3">
                <div className="text-civic-400">Location</div>
                <div className="col-span-2 font-medium">{ticket.location?.address || ticket.location?.ward || 'Unknown'}</div>
              </div>
              <div className="grid grid-cols-3 gap-2 border-b border-civic-800 pb-3">
                <div className="text-civic-400">Department</div>
                <div className="col-span-2 font-medium capitalize">{ticket.department?.replace(/_/g, ' ') || 'Pending'}</div>
              </div>
              <div className="grid grid-cols-3 gap-2 border-b border-civic-800 pb-3">
                <div className="text-civic-400">Severity</div>
                <div className="col-span-2">
                  <div className="w-full bg-civic-800 rounded-full h-2 mt-2">
                    <div 
                      className={`h-2 rounded-full ${ticket.severity_score >= 8 ? 'bg-danger-500' : ticket.severity_score >= 5 ? 'bg-warning-500' : 'bg-success-500'}`} 
                      style={{ width: `${(ticket.severity_score / 10) * 100}%` }}
                    ></div>
                  </div>
                  <div className="mt-1 font-mono text-xs">{ticket.severity_score}/10</div>
                </div>
              </div>
              {ticket.description && (
                <div className="grid grid-cols-3 gap-2 border-b border-civic-800 pb-3">
                  <div className="text-civic-400">Description</div>
                  <div className="col-span-2 text-civic-300">{ticket.description}</div>
                </div>
              )}
              {ticket.escalation_draft && ticket.status === 'pending_citizen_approval' && (
                <div className="mt-4 p-4 bg-danger-500/10 border border-danger-500/30 rounded-lg">
                  <h3 className="font-semibold text-danger-400 mb-2">Escalation Draft (Requires Approval)</h3>
                  <pre className="whitespace-pre-wrap text-xs text-civic-300 font-mono overflow-x-auto">
                    {ticket.escalation_draft}
                  </pre>
                </div>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="card p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold">Resolution Timeline</h2>
              <button 
                onClick={() => setShowTrace(!showTrace)}
                className="text-xs text-civic-400 hover:text-civic-300 underline"
              >
                {showTrace ? 'Hide AI Trace Logs' : 'View AI Trace Logs'}
              </button>
            </div>

            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-civic-500 before:to-civic-800">
              {(ticket.status_log || []).map((log, idx) => (
                <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-civic-900 bg-civic-500 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded border border-civic-700 bg-civic-800/50 shadow">
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-bold text-sm text-civic-200 capitalize">{log.status.replace(/_/g, ' ')}</div>
                      <time className="font-mono text-xs text-civic-400">{new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</time>
                    </div>
                    <div className="text-xs text-civic-400 mt-2">{log.reasoning}</div>
                    
                    {/* Cryptographic Hash Validation Badge */}
                    <div className="mt-3 pt-2 border-t border-civic-700/50 flex items-center justify-between">
                      <span className="text-[10px] text-civic-500 font-mono flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                        Hash-chained entry
                      </span>
                      <span className="text-[10px] text-civic-600 font-mono" title={log.hash}>
                        {log.hash?.slice(0, 8)}...
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: AI Trace Logs (if shown) & Side Info */}
        <div className="space-y-6">
          {showTrace && (
            <div className="card p-4 border-civic-500/50 bg-civic-900 shadow-xl shadow-civic-500/10 animate-fade-in">
              <h2 className="font-display font-semibold text-civic-300 mb-4 flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" /></svg>
                AI Decision Trace
              </h2>
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {traces.map((trace) => (
                  <div key={trace.id} className="bg-civic-950 p-3 rounded text-xs border border-civic-800 font-mono">
                    <div className="text-civic-400 mb-1 font-bold">{trace.agent_name}</div>
                    <div className="text-civic-300 mb-2">{trace.reasoning}</div>
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div>
                        <span className="text-civic-500">Conf: </span>
                        {trace.confidence ? `${(trace.confidence * 100).toFixed(0)}%` : 'N/A'}
                      </div>
                      <div>
                        <span className="text-civic-500">Time: </span>
                        {trace.duration_ms}ms
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!showTrace && ticket.sla_deadline && (
            <div className={`card p-6 border-l-4 ${
              new Date(ticket.sla_deadline) < new Date() ? 'border-l-danger-500' : 'border-l-civic-500'
            }`}>
              <h3 className="text-sm font-semibold text-civic-400 uppercase tracking-wider mb-2">SLA Deadline</h3>
              <div className="text-xl font-bold">
                {new Date(ticket.sla_deadline).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>
              {new Date(ticket.sla_deadline) < new Date() && (
                <div className="text-danger-400 text-sm mt-1 font-medium">SLA Breached</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
