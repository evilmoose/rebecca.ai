import { createContext, useState, useContext, useEffect } from 'react';
import { formatAuthError, getCurrentUser, clearAuth } from '../utils/auth';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);

  // Check if user is already logged in on mount
  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setCurrentUser(user);
      setToken(localStorage.getItem('token'));
    }
    setLoading(false);
  }, []);

  // Login function
  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/jwt/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          username: email,
          password: password,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(formatAuthError(data));
      }
      
      // Store token
      localStorage.setItem('token', data.access_token);
      setToken(data.access_token);
      
      // Fetch user data
      const userResponse = await fetch(`${import.meta.env.VITE_API_URL}/users/me`, {
        headers: {
          'Authorization': `Bearer ${data.access_token}`
        }
      });
      
      const userData = await userResponse.json();
      
      if (!userResponse.ok) {
        throw new Error(formatAuthError(userData));
      }
      
      // Store user data
      localStorage.setItem('user', JSON.stringify(userData));
      setCurrentUser(userData);
      return { ...data, user: userData };
    } catch (err) {
      setError(err.message);
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
      // Split name into first_name and last_name
      const nameParts = name.split(' ');
      const first_name = nameParts[0];
      const last_name = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email, 
          password,
          first_name,
          last_name,
          is_active: true,
          is_verified: false,
          is_superuser: false
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(formatAuthError(data));
      }
      
      // Auto login after signup
      return login(email, password);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    clearAuth();
    setCurrentUser(null);
    setToken(null);
  };

  // Get authenticated API headers
  const getAuthHeaders = () => {
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  };

  const value = {
    currentUser,
    isAdmin: currentUser?.is_superuser,
    loading,
    error,
    token,
    login,
    signup,
    logout,
    getAuthHeaders,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;