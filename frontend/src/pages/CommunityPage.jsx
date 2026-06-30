import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export default function CommunityPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const res = await api.getTickets();
        // Only show active/in_progress tickets for voting
        const votable = (res.tickets || []).filter(t => ['active', 'in_progress', 'intake', 'routing'].includes(t.status));
        setTickets(votable);
      } catch (err) {
        console.error('Failed to load tickets:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, []);

  const handleVote = async (ticketId, type) => {
    try {
      await api.vote(ticketId, type);
      // Optimistic update
      setTickets(tickets.map(t => {
        if (t.id === ticketId) {
          const votes = t.trust_weighted_votes || { confirms: 0, disputes: 0 };
          const weight = (profile?.trust_score || 50) / 100;
          return {
            ...t,
            trust_weighted_votes: {
              ...votes,
              [type === 'confirm' ? 'confirms' : 'disputes']: votes[type === 'confirm' ? 'confirms' : 'disputes'] + weight
            },
            hasVoted: true
          };
        }
        return t;
      }));
    } catch (err) {
      alert(err.message || 'Failed to vote');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-civic-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold">Community Verification</h1>
        <p className="text-civic-400 mt-1">
          Review reported issues in your area. Your votes carry weight based on your <span className="text-success-400 font-semibold">{profile?.trust_score || 50}/100</span> Trust Score.
        </p>
      </div>

      <div className="space-y-6">
        {tickets.length > 0 ? tickets.map(ticket => {
          const votes = ticket.trust_weighted_votes || { confirms: 0, disputes: 0 };
          const totalWeight = votes.confirms + votes.disputes;
          const confirmPct = totalWeight > 0 ? (votes.confirms / totalWeight) * 100 : 50;

          return (
            <div key={ticket.id} className="card p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <Link to={`/tracker/${ticket.id}`} className="text-lg font-semibold hover:text-civic-400 capitalize transition-colors">
                    {(ticket.issue_type || 'Issue').replace(/_/g, ' ')}
                  </Link>
                  <div className="text-sm text-civic-400 mt-1">📍 {ticket.location?.address || ticket.location?.ward || 'Unknown'}</div>
                </div>
                <span className="text-xs text-civic-500 font-mono">{new Date(ticket.created_at).toLocaleDateString()}</span>
              </div>
              
              <p className="text-civic-300 text-sm mb-6 bg-civic-950 p-3 rounded border border-civic-800">
                {ticket.description || 'No description provided.'}
              </p>

              <div className="border-t border-civic-800 pt-4">
                <div className="flex justify-between text-xs text-civic-400 mb-2">
                  <span>Trust-Weighted Community Consensus</span>
                  <span>{ticket.affected_citizen_count || 1} Citizens Affected</span>
                </div>
                
                {/* Consensus Bar */}
                <div className="w-full h-2 rounded-full flex overflow-hidden mb-4 bg-civic-800">
                  {totalWeight > 0 ? (
                    <>
                      <div className="bg-success-500 h-full transition-all" style={{ width: `${confirmPct}%` }}></div>
                      <div className="bg-danger-500 h-full transition-all" style={{ width: `${100 - confirmPct}%` }}></div>
                    </>
                  ) : (
                    <div className="bg-civic-700 w-full h-full"></div>
                  )}
                </div>

                {/* Vote Buttons */}
                <div className="flex gap-4">
                  <button 
                    onClick={() => handleVote(ticket.id, 'confirm')}
                    disabled={ticket.hasVoted}
                    className="flex-1 btn bg-civic-800 hover:bg-success-500/20 hover:text-success-400 border border-civic-700 hover:border-success-500 disabled:opacity-50"
                  >
                    👍 Confirm
                  </button>
                  <button 
                    onClick={() => handleVote(ticket.id, 'dispute')}
                    disabled={ticket.hasVoted}
                    className="flex-1 btn bg-civic-800 hover:bg-danger-500/20 hover:text-danger-400 border border-civic-700 hover:border-danger-500 disabled:opacity-50"
                  >
                    👎 Dispute
                  </button>
                </div>
                {ticket.hasVoted && (
                  <p className="text-center text-xs text-success-400 mt-2">Your vote has been recorded.</p>
                )}
              </div>
            </div>
          );
        }) : (
          <div className="text-center py-12 card border-dashed">
            <p className="text-civic-400">No active issues in your area right now.</p>
          </div>
        )}
      </div>
    </div>
  );
}
