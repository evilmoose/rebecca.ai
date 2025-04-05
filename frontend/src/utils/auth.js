/**
 * Authentication utility functions
 */

/**
 * Check if the user is authenticated
 * @returns {boolean} True if the user is authenticated
 */
export const isAuthenticated = () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    return !!token && !!user;
  };
  
  /**
   * Get the current user from localStorage
   * @returns {Object|null} The current user or null if not authenticated
   */
  export const getCurrentUser = () => {
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch (e) {
      console.error('Error parsing user data:', e);
      return null;
    }
  };
  
  /**
   * Get the authentication token
   * @returns {string|null} The authentication token or null if not authenticated
   */
  export const getToken = () => {
    return localStorage.getItem('token');
  };
  
  /**
   * Clear authentication data from localStorage
   */
  export const clearAuth = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };
  
  /**
   * Get headers for authenticated API requests
   * @returns {Object} Headers object with Authorization token
   */
  export const getAuthHeaders = () => {
    const token = getToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  };
  
  /**
   * Format API error messages for display
   * @param {Error|Object} error - The error object
   * @returns {string} Formatted error message
   */
  export const formatAuthError = (error) => {
    if (typeof error === 'string') return error;
    
    if (error.message) return error.message;
    
    if (error.detail) {
      if (typeof error.detail === 'string') return error.detail;
      if (Array.isArray(error.detail)) {
        return error.detail.map(d => d.msg || d).join(', ');
      }
    }
    
    return 'An unknown error occurred';
  }; 