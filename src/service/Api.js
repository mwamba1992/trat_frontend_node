import axios from 'axios';
import { Config } from '@/utils/Config';


const API_BASE_URL = Config.API_BASE_URL;

// Create an Axios instance
const api = axios.create({
    baseURL: API_BASE_URL, // Replace with your API URL
    timeout: 10000, // Adjust timeout as needed
});

// Request Interceptor to append token
api.interceptors.request.use(
    (config) => {
        // Get token from localStorage or Vuex store
        const token = localStorage.getItem('access_token');

        // If token exists, append it to the Authorization header
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        } else {
            window.location.href = '/login';
        }

        return config;
    },
    (error) => {
        // Handle request error (if needed)
        return Promise.reject(error);
    }
);

// Response Interceptor to handle 401 Unauthorized (token expiration)
api.interceptors.response.use(
    (response) => {
        // Return the response as is if the request is successful
        return response;
    },
    async (error) => {
        console.log('Error:', error);
        // Check if the error is a 401 (Unauthorized)
        if (error.response && error.response.status === 401) {

            console.log('Token expired:', error);
            // Token might have expired or is invalid
            const refreshToken = localStorage.getItem('refresh_token');

            if (refreshToken) {
                try {
                    const refreshTokenDto = {
                        refreshToken: refreshToken,
                        userId: localStorage.getItem('userId')
                    };
                    // Attempt to refresh the token by making a refresh request
                    const response = await api.post('/auth/refresh', { refreshTokenDto });

                    // Get the new token from the response
                    const { newToken } = response.data;

                    // Store the new token in localStorage (or Vuex)
                    localStorage.setItem('access_token', newToken);

                    // Update the original request's Authorization header with the new token
                    error.config.headers['Authorization'] = `Bearer ${newToken}`;

                    // Retry the original request with the new token
                    return api(error.config);
                } catch (refreshError) {
                    // If refreshing the token fails, logout the user or redirect to login
                    console.error('Token refresh failed:', refreshError);
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                    // Redirect to login page or show login modal
                    window.location.href = '/login';
                }
            } else {
                // No refresh token available, redirect to login
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                window.location.href = '/login';
            }
        }

        // If the error is not related to token expiration, reject it as usual
        return Promise.reject(error);
    }
);


// Function to refresh the token
const refreshToken = async (refreshToken) => {
    try {
        const response = await api.post('/auth/refresh', { refreshToken });
        const { newToken } = response.data;
        localStorage.setItem('access_token', newToken);  // Store new token in localStorage
        return newToken;
    } catch (error) {
        console.error('Token refresh failed:', error);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';  // Redirect to login page
        throw error;  // rethrow the error after handling
    }
};

export default api;
