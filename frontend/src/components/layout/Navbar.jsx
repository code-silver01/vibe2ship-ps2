import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';

export default function Navbar() {
  const { currentUser, logout, role } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const location = useLocation();

  const isActive = (path) => location.pathname === path ? 'text-civic-300 font-semibold drop-shadow-[0_0_8px_rgba(139,92,246,0.8)]' : 'text-civic-100 hover:text-civic-300 hover:drop-shadow-[0_0_5px_rgba(139,92,246,0.5)] transition-all';

  const NavLink = ({ to, active, children }) => (
    <Link to={to} className={`px-3 py-2 rounded-md text-sm ${active}`}>
      {children}
    </Link>
  );

  return (
    <nav className="bg-civic-950/80 backdrop-blur-xl border-b border-civic-800 fixed w-full z-50 shadow-[0_4px_30px_rgba(139,92,246,0.1)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <span className="text-2xl drop-shadow-[0_0_10px_rgba(139,92,246,0.9)] mr-2">🏛️</span>
              <span className="font-display font-bold text-xl tracking-tight text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]">
                {t('app_name')}
              </span>
            </Link>
            
            <div className="hidden sm:ml-8 sm:flex sm:space-x-4">
              {(!currentUser || role === 'citizen') && (
                <NavLink to="/" active={isActive('/')}>{t('home')}</NavLink>
              )}
              
              {currentUser && role === 'citizen' && (
                <>
                  <NavLink to="/report" active={isActive('/report')}>{t('report_issue')}</NavLink>
                  <NavLink to="/community" active={isActive('/community')}>{t('community')}</NavLink>
                  <NavLink to="/dashboard" active={isActive('/dashboard')}>{t('dashboard')}</NavLink>
                </>
              )}
              
              {(currentUser && (role === 'official' || role === 'admin')) && (
                <>
                  <NavLink to="/official" active={isActive('/official')}>{t('official_hub')}</NavLink>
                  <NavLink to="/heatmap" active={isActive('/heatmap')}>{t('heatmap')}</NavLink>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <select 
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-civic-900 border border-civic-700 text-white text-sm rounded focus:ring-civic-500 focus:border-civic-500 block px-2 py-1 shadow-[0_0_10px_rgba(139,92,246,0.2)]"
            >
              <option value="en">English</option>
              <option value="hi">हिंदी</option>
              <option value="kn">ಕನ್ನಡ</option>
            </select>

            {currentUser ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-civic-300 hidden sm:block">
                  {currentUser.email} <span className="badge bg-civic-800 text-civic-100 ml-2 shadow-[0_0_10px_rgba(139,92,246,0.3)]">{role}</span>
                </span>
                <button onClick={logout} className="btn btn-secondary text-sm">
                  {t('logout')}
                </button>
              </div>
            ) : (
              <Link to="/login" className="btn btn-primary text-sm">
                {t('login')}
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
