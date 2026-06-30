import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import api from '../services/api';

export default function HomePage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser, role } = useAuth();
  const { t } = useLanguage();

  if (currentUser && role === 'official') {
    return <Navigate to="/official" replace />;
  }

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const res = await api.getTickets();
        setTickets(res.tickets || []);
      } catch (err) {
        console.error('Failed to load recent activity:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="text-center mb-16 pt-12 pb-8">
        <h1 className="text-5xl md:text-6xl font-display font-extrabold tracking-tight mb-6">
          <span className="block text-white">{t('home_hero1')}</span>
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-civic-400 to-success-400">
            {t('home_hero2')}
          </span>
        </h1>
        <p className="mt-4 max-w-2xl text-xl text-civic-300 mx-auto mb-10">
          {t('home_subhero')}
        </p>
        <div className="flex justify-center gap-4">
          <Link to="/report" className="btn btn-primary text-lg px-8 py-4 animate-pulse-slow">
            {t('report_now')}
          </Link>
          <Link to="/scorecard" className="btn btn-secondary text-lg px-8 py-4">
            {t('view_scorecard')}
          </Link>
        </div>
      </div>

      {/* Feed Section */}
      <div className="mt-12">
        <h2 className="text-2xl font-display font-bold mb-6 flex items-center">
          <span className="w-2 h-2 rounded-full bg-success-500 mr-3 animate-pulse"></span>
          {t('live_feed')}
        </h2>
        
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="card p-6 h-48 animate-pulse bg-civic-800/50"></div>
            ))}
          </div>
        ) : tickets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tickets.map(ticket => (
              <Link key={ticket.id} to={`/tracker/${ticket.id}`} className="card hover:border-civic-500 transition-colors block">
                <div className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <span className={`badge ${
                      ticket.status === 'resolved' || ticket.status === 'verified' 
                        ? 'bg-success-500/20 text-success-400' 
                        : 'bg-warning-500/20 text-warning-400'
                    }`}>
                      {ticket.status.replace(/_/g, ' ').toUpperCase()}
                    </span>
                    <span className="text-xs text-civic-400">
                      {new Date(ticket.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold capitalize mb-1">
                    {(ticket.issue_type || 'Issue').replace(/_/g, ' ')}
                  </h3>
                  <p className="text-sm text-civic-300 line-clamp-2 mb-4">
                    {ticket.description || 'No description provided.'}
                  </p>
                  <div className="flex items-center text-xs text-civic-400">
                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {ticket.location?.ward || 'Unknown location'}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 card bg-civic-900/30">
            <p className="text-civic-400">No recent activity. Be the first to report an issue!</p>
          </div>
        )}
      </div>
    </div>
  );
}
