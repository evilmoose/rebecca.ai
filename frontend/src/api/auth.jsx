import axios from 'axios';

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
    const response = await axios.post(
      `/auth/jwt/login`,
      new URLSearchParams({
        username: email,
        password: password,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
    
    return response.data;
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
    // Split name into first_name and last_name
    const nameParts = name.split(' ');
    const first_name = nameParts[0];
    const last_name = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
    
    const response = await axios.post(
      `/auth/register`,
      {
        email, 
        password,
        first_name,
        last_name,
        is_active: true,
        is_verified: false,
        is_superuser: false
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    
    return response.data;
  },
  
  /**
   * Get the current user's profile
   * 
   * @param {string} token - Authentication token
   * @returns {Promise<Object>} - The user profile
   */
  getCurrentUser: async (token) => {
    const response = await axios.get(
      `/users/me`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    return response.data;
  },
  
  /**
   * Get authentication headers for API requests
   * 
   * @param {string} token - Authentication token
   * @returns {Object} - Headers object with Authorization
   */
  getAuthHeaders: (token) => {
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  },
};

export default authService;