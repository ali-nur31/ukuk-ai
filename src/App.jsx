import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './contexts/AuthContext.jsx';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Account from './pages/Account';
import Specialists from './pages/Specialists';
import Chat from './pages/Chat';
import ChatHistory from './pages/ChatHistory';
import './styles/main.scss';

function App() {
  return (
    <AuthProvider>
      <div className="app-container">
        <Sidebar />
        <main className="main-content">
          <div className="content-wrapper">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route 
                path="/account" 
                element={
                  <ProtectedRoute>
                    <Account />
                  </ProtectedRoute>
                } 
              />
              <Route path="/specialists" element={<Specialists />} />
              <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
              <Route path="/chat/:chatId" element={<ProtectedRoute><ChatHistory /></ProtectedRoute>} />
            </Routes>
          </div>
        </main>
        <ToastContainer position="top-right" autoClose={3000} />
      </div>
    </AuthProvider>
  );
}

export default App;