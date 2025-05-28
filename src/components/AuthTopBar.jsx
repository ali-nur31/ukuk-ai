import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/components/_authTopBar.scss';

const AuthTopBar = ({ user, onLogin, onLogout }) => {
  const navigate = useNavigate();
  return (
    <div className="auth-top-bar">
      {!user ? (
        <button className="auth-top-bar__login-btn" onClick={() => navigate('/login')}>Войти</button>
      ) : (
        <div className="auth-top-bar__profile">
          <span className="auth-top-bar__username">{user.username}</span>
          <button className="auth-top-bar__logout-btn" onClick={onLogout}>Выйти</button>
        </div>
      )}
    </div>
  );
};

export default AuthTopBar; 