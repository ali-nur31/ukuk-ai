import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Drawer, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  IconButton, 
  Divider,
  Box,
  Typography,
  Button,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  Home as HomeIcon,
  People as SpecialistsIcon,
  Person as AccountIcon,
  Chat as ChatIcon,
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  Login as LoginIcon,
  Logout as LogoutIcon,
  PersonAdd as RegisterIcon
} from '@mui/icons-material';
import ChatHistory from './AiChatHistory';
import '../styles/components/_sidebar.scss';

const menuItems = [
  { label: 'Башкы бет', path: '/', icon: <HomeIcon /> },
  { label: 'Адистер', path: '/specialists', icon: <SpecialistsIcon /> },
  { label: 'Сүйлөшүү', path: '/chat', icon: <ChatIcon /> },
];

const protectedMenuItems = [
  { label: 'Жеке кабинет', path: '/account', icon: <AccountIcon /> },
];

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [chats, setChats] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);

  useEffect(() => {
    if (isMobile) {
      setCollapsed(true);
    }
  }, [isMobile]);

  useEffect(() => {
    if (user) {
      const mockChats = [
        { id: 1, title: 'Чат с юристом', lastMessage: 'Последнее сообщение...' },
        { id: 2, title: 'Консультация', lastMessage: 'Спасибо за помощь!' },
      ];
      setChats(mockChats);
    }
  }, [user]);

  const handleChatSelect = (chatId) => {
    setSelectedChatId(chatId);
    navigate(`/chat/${chatId}`);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) {
      setCollapsed(true);
    }
  };

  return (
    <>
      <Drawer
        variant="permanent"
        className={`sidebar ${collapsed ? 'collapsed' : ''}`}
        sx={{
          width: collapsed ? 65 : 240,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: collapsed ? 65 : 240,
            boxSizing: 'border-box',
            transition: theme.transitions.create(['width', 'margin'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
            overflowX: 'hidden',
            backgroundColor: theme.palette.background.paper,
            borderRight: `1px solid ${theme.palette.divider}`,
          },
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: collapsed ? 'center' : 'space-between',
          padding: '16px',
          minHeight: '64px'
        }}>
          {!collapsed && (
            <Typography 
              variant="h6" 
              component={Link} 
              to="/" 
              onClick={() => handleNavigation('/')}
              sx={{ 
                textDecoration: 'none', 
                color: 'inherit',
                fontWeight: 'bold',
                letterSpacing: '1px',
                cursor: 'pointer'
              }}
            >
              UKUK
            </Typography>
          )}
          <IconButton 
            onClick={toggleSidebar}
            sx={{
              color: theme.palette.text.secondary,
              '&:hover': {
                color: theme.palette.primary.main,
              }
            }}
          >
            {collapsed ? <MenuIcon /> : <ChevronLeftIcon />}
          </IconButton>
        </Box>

        <Divider />

        <List>
          {menuItems.map((item) => (
            <ListItem
              button
              key={item.path}
              onClick={() => handleNavigation(item.path)}
              selected={location.pathname === item.path}
              sx={{
                minHeight: 48,
                justifyContent: collapsed ? 'center' : 'initial',
                px: 2.5,
                '&.Mui-selected': {
                  backgroundColor: theme.palette.primary.light + '20',
                  '&:hover': {
                    backgroundColor: theme.palette.primary.light + '30',
                  },
                },
              }}
            >
              <ListItemIcon sx={{
                minWidth: 0,
                mr: collapsed ? 'auto' : 3,
                justifyContent: 'center',
                color: location.pathname === item.path ? theme.palette.primary.main : 'inherit'
              }}>
                {item.icon}
              </ListItemIcon>
              {!collapsed && <ListItemText primary={item.label} />}
            </ListItem>
          ))}
        </List>

        {user && !collapsed && (
          <ChatHistory
            chats={chats}
            onChatSelect={handleChatSelect}
            selectedChatId={selectedChatId}
          />
        )}

        {user ? (
          <>
            <Divider />
            <List>
              {protectedMenuItems.map((item) => (
                <ListItem
                  button
                  key={item.path}
                  onClick={() => handleNavigation(item.path)}
                  selected={location.pathname === item.path}
                  sx={{
                    minHeight: 48,
                    justifyContent: collapsed ? 'center' : 'initial',
                    px: 2.5,
                    '&.Mui-selected': {
                      backgroundColor: theme.palette.primary.light + '20',
                      '&:hover': {
                        backgroundColor: theme.palette.primary.light + '30',
                      },
                    },
                  }}
                >
                  <ListItemIcon sx={{
                    minWidth: 0,
                    mr: collapsed ? 'auto' : 3,
                    justifyContent: 'center',
                    color: location.pathname === item.path ? theme.palette.primary.main : 'inherit'
                  }}>
                    {item.icon}
                  </ListItemIcon>
                  {!collapsed && <ListItemText primary={item.label} />}
                </ListItem>
              ))}
              <ListItem
                button
                onClick={handleLogout}
                sx={{
                  minHeight: 48,
                  justifyContent: collapsed ? 'center' : 'initial',
                  px: 2.5,
                }}
              >
                <ListItemIcon sx={{
                  minWidth: 0,
                  mr: collapsed ? 'auto' : 3,
                  justifyContent: 'center',
                }}>
                  <LogoutIcon />
                </ListItemIcon>
                {!collapsed && <ListItemText primary="Чыгуу" />}
              </ListItem>
            </List>
          </>
        ) : (
          <>
            <Divider />
            <List>
              <ListItem
                button
                onClick={() => handleNavigation('/login')}
                selected={location.pathname === '/login'}
                sx={{
                  minHeight: 48,
                  justifyContent: collapsed ? 'center' : 'initial',
                  px: 2.5,
                }}
              >
                <ListItemIcon sx={{
                  minWidth: 0,
                  mr: collapsed ? 'auto' : 3,
                  justifyContent: 'center',
                }}>
                  <LoginIcon />
                </ListItemIcon>
                {!collapsed && <ListItemText primary="Кирүү" />}
              </ListItem>
              <ListItem
                button
                onClick={() => handleNavigation('/register')}
                selected={location.pathname === '/register'}
                sx={{
                  minHeight: 48,
                  justifyContent: collapsed ? 'center' : 'initial',
                  px: 2.5,
                }}
              >
                <ListItemIcon sx={{
                  minWidth: 0,
                  mr: collapsed ? 'auto' : 3,
                  justifyContent: 'center',
                }}>
                  <RegisterIcon />
                </ListItemIcon>
                {!collapsed && <ListItemText primary="Катталуу" />}
              </ListItem>
            </List>
          </>
        )}
      </Drawer>

      {collapsed && (
        <IconButton
          onClick={toggleSidebar}
          sx={{
            position: 'fixed',
            left: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            backgroundColor: theme.palette.primary.main,
            color: 'white',
            borderRadius: '0 4px 4px 0',
            padding: '8px',
            zIndex: 999,
            '&:hover': {
              backgroundColor: theme.palette.primary.dark,
            }
          }}
        >
          <MenuIcon />
        </IconButton>
      )}
    </>
  );
};

export default Sidebar; 