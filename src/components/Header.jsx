import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import '../styles/components/_header.scss';
import { useState } from 'react';
import { logout } from '../api';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';

const menuItems = [
  { label: 'Новости', path: '/news' },
  { label: 'Специалисты', path: '/specialists' },
  { label: 'Личный кабинет', path: '/account' },
];

const Header = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogout = async () => {
    try {
      await logout();
      onLogout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AppBar position="static" className="header">
      <Toolbar>
        <Typography variant="h6" component={Link} to="/" sx={{ textDecoration: 'none', color: 'inherit', flexGrow: 1 }}>
          Law.AI
        </Typography>
        
        <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 2 }}>
          {menuItems.map((item) => (
            <Button
              key={item.path}
              component={Link}
              to={item.path}
              color="inherit"
              sx={{
                textTransform: 'none',
                fontWeight: location.pathname === item.path ? 'bold' : 'normal'
              }}
            >
              {item.label}
            </Button>
          ))}
        </Box>

        <Box sx={{ display: 'flex', gap: 2, ml: 2 }}>
          {user ? (
            <>
              <Button color="inherit" onClick={handleLogout}>
                Выйти
              </Button>
            </>
          ) : (
            <>
              <Button color="inherit" component={Link} to="/login">
                Войти
              </Button>
              <Button color="inherit" component={Link} to="/register">
                Регистрация
              </Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;