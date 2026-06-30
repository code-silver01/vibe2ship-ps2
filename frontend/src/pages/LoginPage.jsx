import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

import api from '../services/api';

export default function LoginPage() {
  const { login, signup, isMockMode, refreshProfile } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  
  // In a real app, these would be controlled inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [selectedRole, setSelectedRole] = useState('citizen');

  const from = location.state?.from?.pathname || '/';

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      let finalRole = 'citizen';
      
      if (isSignUp) {
        await signup(email, password);
        // Save profile with selected role and name
        await api._request('/auth/profile', {
          method: 'PUT',
          body: { name, role: selectedRole }
        });
        await refreshProfile();
        finalRole = selectedRole;
      } else {
        await login(email, password || 'password');
        // Refresh to get the actual role from backend if it wasn't mocked
        await refreshProfile();
        const prefix = email.split('@')[0];
        finalRole = prefix === 'official' ? 'official' : (prefix === 'admin' ? 'admin' : 'citizen');
      }

      // Navigate to role-specific dashboard if no explicit 'from' path
      if (from === '/') {
        if (finalRole === 'official' || finalRole === 'admin') {
          navigate('/official');
        } else {
          navigate('/dashboard');
        }
      } else {
        navigate(from);
      }
    } catch (err) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  const handleMockLogin = (role) => {
    setEmail(`${role}@civicpulse.dev`);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 card p-8">
        <div>
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-tr from-civic-500 to-success-400 flex items-center justify-center shadow-lg shadow-civic-500/20 mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-display font-extrabold text-white">
            {isSignUp ? 'Create an account' : 'Sign in to CivicPulse'}
          </h2>
          <p className="mt-2 text-center text-sm text-civic-400">
            {isMockMode ? 'Running in Mock Mode — API keys not required' : 'Enter your credentials'}
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {error && (
            <div className="bg-danger-500/10 border border-danger-500 text-danger-400 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          
          <div className="rounded-md shadow-sm space-y-4">
            {isSignUp && (
              <>
                <div>
                  <label htmlFor="name" className="sr-only">Full Name</label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    className="input"
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="role" className="sr-only">Role</label>
                  <select
                    id="role"
                    className="input appearance-none"
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                  >
                    <option value="citizen">Citizen</option>
                    <option value="official">City Official</option>
                    <option value="admin">System Admin</option>
                  </select>
                </div>
              </>
            )}
            <div>
              <label htmlFor="email-address" className="sr-only">Email address</label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="input"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {!isMockMode && (
              <div>
                <label htmlFor="password" className="sr-only">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="input"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || !email}
              className="w-full btn btn-primary flex justify-center py-3"
            >
              {loading ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                isSignUp ? 'Sign Up' : 'Sign In'
              )}
            </button>
          </div>
          
          <div className="text-center mt-4">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-civic-400 hover:text-civic-300 text-sm font-medium transition-colors"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </form>

        {isMockMode && (
          <div className="mt-8 pt-6 border-t border-civic-800">
            <p className="text-sm text-civic-400 text-center mb-4">Quick login for testing:</p>
            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => handleMockLogin('citizen')} type="button" className="btn btn-secondary text-xs">
                Citizen
              </button>
              <button onClick={() => handleMockLogin('official')} type="button" className="btn btn-secondary text-xs border-warning-500 text-warning-400">
                City Official
              </button>
              <button onClick={() => handleMockLogin('admin')} type="button" className="btn btn-secondary text-xs border-danger-500 text-danger-400">
                Admin
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
