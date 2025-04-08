import { createContext, useState, useContext, useEffect } from 'react';
import authService from '../api/auth';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is already logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (authService.isAuthenticated()) {
        try {
          const user = await authService.getCurrentUser();
          setCurrentUser(user);
        } catch (err) {
          console.error('Error fetching user:', err);
          authService.logout();
        }
      }
      setLoading(false);
    };
    
    checkAuth();
  }, []);

  // Login function
  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    
    try {
      const user = await authService.login(email, password);
      setCurrentUser(user);
      return user;
    } catch (err) {
      setError(err.message || 'An error occurred during login');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Signup function
  const signup = async (name, email, password) => {
    setLoading(true);
    setError(null);
    
    try {
      const user = await authService.register(name, email, password);
      setCurrentUser(user);
      return user;
    } catch (err) {
      setError(err.message || 'An error occurred during signup');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    authService.logout();
    setCurrentUser(null);
  };

  const value = {
    currentUser,
    isAdmin: currentUser?.is_superuser,
    loading,
    error,
    login,
    signup,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;