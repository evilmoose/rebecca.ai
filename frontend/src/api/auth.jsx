/**
 * Service for interacting with the authentication API endpoints.
 */
const authService = {
  /**
   * Login a user with email and password
   * 
   * @param {string} email - User's email
   * @param {string} password - User's password
   * @returns {Promise<Object>} - The login response with access token
   */
  login: async (email, password) => {
    try {
      const response = await fetch('/api/v1/auth/jwt/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          username: email,
          password: password,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to login');
      }

      const data = await response.json();
      
      // Store token and user data
      const { access_token } = data;
      localStorage.setItem('token', access_token);
      
      // Get user profile
      const userProfile = await authService.getCurrentUser();
      localStorage.setItem('user', JSON.stringify(userProfile));
      
      return userProfile;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },
  
  /**
   * Register a new user
   * 
   * @param {string} name - User's full name
   * @param {string} email - User's email
   * @param {string} password - User's password
   * @returns {Promise<Object>} - The registration response
   */
  register: async (name, email, password) => {
    try {
      // Split name into first_name and last_name
      const nameParts = name.split(' ');
      const first_name = nameParts[0];
      const last_name = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
      
      const response = await fetch('/api/v1/auth/register', {
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

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to register');
      }

      // After successful registration, log the user in
      return await authService.login(email, password);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },
  
  /**
   * Get the current user's profile
   * 
   * @returns {Promise<Object>} - The user profile
   */
  getCurrentUser: async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('/api/v1/users/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Handle unauthorized access
          authService.logout();
          throw new Error('Session expired. Please login again.');
        }
        const error = await response.json();
        throw new Error(error.detail || 'Failed to fetch user profile');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Get user error:', error);
      throw error;
    }
  },

  /**
   * Logout the current user
   */
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  },

  /**
   * Check if user is authenticated
   * @returns {boolean} - True if user is authenticated
   */
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  /**
   * Get authentication headers for API requests
   * 
   * @returns {Object} - Headers object with Authorization
   */
  getAuthHeaders: () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  },
};

export default authService;