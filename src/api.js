import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://polniy-bankich.onrender.com/api';

// Utility functions
const checkUserRole = (requiredRole) => {
  const user = JSON.parse(localStorage.getItem('user'));
  return user && user.role === requiredRole;
};

const handleApiError = (error) => {
  if (error.response) {
    switch (error.response.status) {
      case 401:
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        throw new Error('Unauthorized access. Please login again.');
      case 403:
        throw new Error('You do not have permission to perform this action.');
      case 404:
        throw new Error('The requested resource was not found.');
      default:
        throw new Error(error.response?.data?.message || 'An error occurred while processing your request.');
    }
  }
  throw error;
};

// Create axios instance with interceptors
const api = axios.create({
    baseURL: API_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    },
    withCredentials: true
});

// Request interceptor
api.interceptors.request.use(config => {
    // Не добавляем токен только для login/register
    if (
        config.url === '/auth/login' ||
        config.url === '/auth/register/user' ||
        config.url === '/auth/register/professional'
    ) {
        return config;
    }
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response interceptor
api.interceptors.response.use(
    response => response,
    error => {
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.error('Response error:', error.response.data);
            throw new Error(error.response.data.message || 'An error occurred');
        } else if (error.request) {
            // The request was made but no response was received
            console.error('Request error:', error.request);
            throw new Error('No response from server');
        } else {
            // Something happened in setting up the request that triggered an Error
            console.error('Error:', error.message);
            throw new Error('Request setup failed');
        }
    }
);

// Auth endpoints
export const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
};

export const registerUser = async (userData) => {
    try {
        const response = await api.post('/auth/register/user', userData);
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

export const registerProfessional = async (professionalData) => {
    try {
        const response = await api.post('/auth/register/professional', professionalData);
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

export const loginUser = async (credentials) => {
    try {
        const response = await api.post('/auth/login', credentials);
        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
        }
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

export const getCurrentUser = async () => {
    try {
        const response = await api.get('/auth/me');
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

// User endpoints
export const getAllUsers = async () => {
    if (!checkUserRole('admin')) {
        throw new Error('Only administrators can view all users');
    }
    try {
        const response = await api.get('/users');
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

export const getUserById = async (id) => {
    try {
        const response = await api.get(`/users/${id}`);
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

export const updateUserProfile = async (userId, userData) => {
    try {
        const response = await api.put(`/users/${userId}`, userData);
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

export const deleteUser = async (id) => {
    if (!checkUserRole('admin')) {
        throw new Error('Only administrators can delete users');
    }
    try {
        const response = await api.delete(`/users/${id}`);
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

// Professional endpoints
export const getAllProfessionals = async (params = {}) => {
    try {
        const response = await api.get('/professionals', { params: { limit: 1000, ...params } });
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

export const getProfessionalById = async (id) => {
    try {
        const response = await api.get(`/professionals/${id}`);
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

export const updateProfessionalProfile = async (profileData) => {
    if (!checkUserRole('professional')) {
        throw new Error('Only professionals can update their profile');
    }
    try {
        const response = await api.put('/professionals/profile', profileData);
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

export const deleteProfessionalProfile = async () => {
    if (!checkUserRole('professional')) {
        throw new Error('Only professionals can delete their profile');
    }
    try {
        const response = await api.delete('/professionals/profile');
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

// Professional Types endpoints
export const getProfessionalTypes = async () => {
    try {
        const response = await api.get('/professional-types');
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

export const getProfessionalTypeById = async (id) => {
    try {
        const response = await api.get(`/professional-types/${id}`);
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

export const createProfessionalType = async (typeData) => {
    if (!checkUserRole('admin')) {
        throw new Error('Only administrators can create professional types');
    }
    try {
        const response = await api.post('/professional-types', typeData);
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

export const updateProfessionalType = async (id, typeData) => {
    if (!checkUserRole('admin')) {
        throw new Error('Only administrators can update professional types');
    }
    try {
        const response = await api.put(`/professional-types/${id}`, typeData);
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

export const deleteProfessionalType = async (id) => {
    if (!checkUserRole('admin')) {
        throw new Error('Only administrators can delete professional types');
    }
    try {
        const response = await api.delete(`/professional-types/${id}`);
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

export const uploadProfilePhoto = async (professionalId, file) => {
  const formData = new FormData();
  formData.append('photo', file);

  // Не указывай Content-Type, axios сам выставит boundary для form-data!
  const response = await api.post(`/professionals/${professionalId}/photo`, formData);
  return response.data;
};

// Chat endpoints
export const getChatHistory = async () => {
    try {
        const response = await api.get('/chat/drive-history');
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

export default api;