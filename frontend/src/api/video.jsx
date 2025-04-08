import { handleApiError, getRequestHeaders } from './utils';

const BASE_URL = '/api/v1/video';

const videoService = {
    /**
     * Upload and process a video file
     * @param {File} file - The video file to upload
     * @returns {Promise<Object>} The processed video data
     */
    uploadFile: async (file) => {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(`${BASE_URL}/upload`, {
                method: 'POST',
                headers: getRequestHeaders(false), // Don't include Content-Type for FormData
                body: formData,
            });

            return handleApiError(response);
        } catch (error) {
            throw error;
        }
    },

    /**
     * Process a YouTube video URL
     * @param {string} url - The YouTube video URL
     * @returns {Promise<Object>} The processed video data
     */
    processYoutubeUrl: async (url) => {
        try {
            const response = await fetch(`${BASE_URL}/youtube`, {
                method: 'POST',
                headers: getRequestHeaders(),
                body: JSON.stringify({ url: url }),
            });

            return handleApiError(response);
        } catch (error) {
            throw error;
        }
    },
};

export default videoService; 