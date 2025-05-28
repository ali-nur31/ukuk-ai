import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, registerUser, getCurrentUser } from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            try {
                const token = localStorage.getItem('token');
                if (token) {
                    const responseData = await getCurrentUser();
                    // Store the entire response data, which includes user and possibly professional
                    if(responseData && responseData.user) {
                        setUser(responseData);
                    } else {
                         // Handle cases where getCurrentUser might return an empty or unexpected response
                         setUser(null);
                         localStorage.removeItem('token');
                    }
                }
            } catch (error) {
                console.error('Failed to initialize auth:', error);
                localStorage.removeItem('token');
                 setUser(null); // Ensure user is null on auth error
            } finally {
                setLoading(false);
            }
        };

        initAuth();
    }, []);

    const login = async (credentials) => {
        try {
            const responseData = await loginUser(credentials);
             // Store the entire response data, which includes user and possibly professional
             if(responseData && responseData.user) {
                 localStorage.setItem('token', responseData.token);
                 setUser(responseData);
             }
            return responseData.user; // Return just the user part for consistency if needed elsewhere
        } catch (error) {
            throw error;
        }
    };

    const register = async (userData) => {
        try {
            const responseData = await registerUser(userData);
             // Store the entire response data, which includes user and possibly professional
             if(responseData && responseData.user) {
                 localStorage.setItem('token', responseData.token);
                 setUser(responseData);
             }
            return responseData.user; // Return just the user part for consistency if needed elsewhere
        } catch (error) {
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    const value = {
        user,
        loading,
        login,
        register,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}; 