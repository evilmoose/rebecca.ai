/**
 * Handle API response errors
 * @param {Response} response - The fetch response object
 * @returns {Promise<any>} The response data if successful
 * @throws {Error} If the response is not successful
 */
export const handleApiError = async (response) => {
    if (!response.ok) {
        if (response.status === 401) {
            throw new Error('Session expired. Please log in again.');
        }
        const errorData = await response.json();
        throw new Error(errorData.detail || errorData.message || 'An error occurred');
    }
    return response.json();
};

/**
 * Get headers for API requests
 * @param {boolean} includeContentType - Whether to include Content-Type: application/json
 * @returns {Object} Headers object
 */
export const getRequestHeaders = (includeContentType = true) => {
    const token = localStorage.getItem('token');
    if (!token) {
        throw new Error('No authentication token found. Please log in.');
    }

    const headers = {
        'Authorization': `Bearer ${token}`,
    };
    
    if (includeContentType) {
        headers['Content-Type'] = 'application/json';
    }
    
    return headers;
}; 