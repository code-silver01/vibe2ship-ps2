import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth, isMockMode } from '../services/firebase';
import api from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mockState, setMockState] = useState(api.loadMockIdentity());

  useEffect(() => {
    if (isMockMode) {
      // Handle mock mode authentication
      if (mockState.uid) {
        setCurrentUser({ uid: mockState.uid, email: `${mockState.uid}@civicpulse.dev` });
        api.setMockIdentity(mockState.uid, mockState.role);
        fetchProfile();
      } else {
        setCurrentUser(null);
        setProfile(null);
        setLoading(false);
      }
      return;
    }

    // Handle real Firebase authentication
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const token = await user.getIdToken();
        api.setToken(token);
        await fetchProfile();
      } else {
        api.setToken(null);
        setProfile(null);
        setLoading(false);
      }
    });

    return unsubscribe;
  }, [mockState]);

  const fetchProfile = async () => {
    try {
      const res = await api.getProfile();
      setProfile(res.user);
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    if (isMockMode) {
      const prefix = email.split('@')[0];
      const role = ['official', 'citizen'].includes(prefix) ? prefix : 'citizen';
      const uid = `mock_${role}_${Date.now()}`;
      
      api.setMockIdentity(uid, role);
      setMockState({ uid, role });
      return;
    }
    return signInWithEmailAndPassword(auth, email, password);
  };

  const signup = async (email, password) => {
    if (isMockMode) {
      // Mock signup is same as mock login for this demo
      return login(email, password);
    }
    return createUserWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    if (isMockMode) {
      api.setMockIdentity(null, null);
      setMockState({ uid: null, role: null });
      return;
    }
    return signOut(auth);
  };

  const value = {
    currentUser,
    profile,
    loading,
    login,
    signup,
    logout,
    isMockMode,
    role: isMockMode ? mockState.role : profile?.role || 'citizen',
    refreshProfile: fetchProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
