import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import api from '../services/api';

export default function DashboardPage() {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.getCitizenDashboard();
        setDashboardData(res);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-civic-500"></div>
      </div>
    );
  }

  const stats = dashboardData?.stats || { total_reported: 0, resolved: 0, pending: 0 };
  const user = dashboardData?.user || profile || {};
  const tickets = dashboardData?.recent_tickets || [];
  const credits = user.civic_credits || 0;

  const getCivicTitle = (credits) => {
    if (credits >= 1000) return 'Elite Vanguard 💎';
    if (credits >= 500) return 'Gold Guardian 🥇';
    if (credits >= 100) return 'Silver Sentinel 🥈';
    return 'Bronze Watcher 🥉';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold">{t('my_dashboard')}</h1>
          <p className="text-civic-400 mt-1">{t('welcome_back')}, {user.name}</p>
        </div>
        <Link to="/report" className="btn btn-primary">
          {t('new_report')}
        </Link>
      </div>

      {/* Gamification / Trust Card */}
      <div className="card bg-gradient-to-br from-civic-900 to-civic-950 border-civic-700 mb-8 p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-civic-500 rounded-full opacity-10 blur-2xl"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between">
          <div className="mb-4 md:mb-0">
            <h2 className="text-xl font-semibold mb-2">{t('civic_credit_score')}</h2>
            <div className="flex items-baseline space-x-2">
              <span className="text-4xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-success-400 to-civic-400">
                {credits}
              </span>
              <span className="text-civic-400 text-sm tracking-wide uppercase">{t('credits')}</span>
            </div>
            <p className="text-sm text-civic-400 mt-2 max-w-md">
              {t('gamification_desc')}
            </p>
          </div>
          <div className="flex flex-col items-center md:items-end gap-2 text-center md:text-right">
            <div className="bg-civic-800/80 px-4 py-2 rounded-lg border border-civic-600/50 shadow-[0_0_15px_rgba(139,92,246,0.15)]">
              <div className="text-xs text-civic-300 uppercase tracking-wider mb-1">{t('title_unlocked') || 'Title Unlocked'}</div>
              <div className="text-lg font-bold text-civic-100">{getCivicTitle(credits)}</div>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-semibold">{user.trust_score || 50}/100</div>
              <div className="text-xs text-civic-400 uppercase tracking-wider mt-1">{t('trust_rating')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card p-6">
          <div className="text-civic-400 text-sm font-medium mb-1">{t('total_reported')}</div>
          <div className="text-3xl font-semibold">{stats.total_reported}</div>
        </div>
        <div className="card p-6">
          <div className="text-civic-400 text-sm font-medium mb-1">{t('resolved')}</div>
          <div className="text-3xl font-semibold text-success-400">{stats.resolved}</div>
        </div>
        <div className="card p-6">
          <div className="text-civic-400 text-sm font-medium mb-1">{t('active_pending')}</div>
          <div className="text-3xl font-semibold text-warning-400">{stats.pending}</div>
        </div>
      </div>

      {/* Recent Tickets */}
      <h2 className="text-xl font-display font-bold mb-4">{t('my_reports')}</h2>
      <div className="card overflow-hidden">
        {tickets.length > 0 ? (
          <div className="divide-y divide-civic-800">
            {tickets.map(ticket => (
              <Link key={ticket.id} to={`/tracker/${ticket.id}`} className="block hover:bg-civic-800/50 transition-colors p-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="ml-0">
                      <p className="text-sm font-medium text-white capitalize">
                        {(ticket.issue_type || 'issue').replace('_', ' ')}
                      </p>
                      <p className="text-sm text-civic-400 mt-1">
                        Reported {new Date(ticket.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={`badge ${
                      ticket.status === 'closed' || ticket.status === 'verified' ? 'bg-success-500/20 text-success-400' :
                      ticket.status === 'pending_citizen_approval' ? 'bg-danger-500/20 text-danger-400 animate-pulse' :
                      'bg-warning-500/20 text-warning-400'
                    }`}>
                      {ticket.status.replace(/_/g, ' ').toUpperCase()}
                    </span>
                    {ticket.status === 'pending_citizen_approval' && (
                      <span className="text-xs text-danger-400 mt-1 font-medium">Action Required!</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-civic-400">
            {t('no_reports')}
          </div>
        )}
      </div>
    </div>
  );
}
