import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Typography,
  Box,
  Divider,
  IconButton,
  Collapse,
  CircularProgress
} from '@mui/material';
import { 
  Chat as ChatIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';
import { getChatHistory } from '../api';

const AiChatHistory = () => {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(true);
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchChatHistory = async () => {
      try {
        const history = await getChatHistory();
        setChats(history);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchChatHistory();
  }, []);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleChatClick = (chatId) => {
    navigate(`/chat/${chatId}`);
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        px: 2,
        py: 1
      }}>
        <Typography
          variant="subtitle2"
          sx={{
            color: 'text.secondary',
            fontWeight: 'medium'
          }}
        >
          Сүйлөшүүлөрдүн тарыхы
        </Typography>
        <IconButton 
          onClick={toggleExpand}
          size="small"
          sx={{ 
            color: 'text.secondary',
            '&:hover': {
              color: 'primary.main'
            }
          }}
        >
          {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>
      <Collapse in={isExpanded}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress size={24} />
          </Box>
        ) : error ? (
          <Typography color="error" sx={{ px: 2, py: 1 }}>
            {error}
          </Typography>
        ) : (
          <List sx={{ py: 0 }}>
            {chats.map((chat) => (
              <React.Fragment key={chat.id}>
                <ListItem
                  button
                  onClick={() => handleChatClick(chat.id)}
                  sx={{
                    py: 1,
                    px: 2,
                    '&:hover': {
                      backgroundColor: 'primary.light + 20',
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <ChatIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary={chat.question}
                    secondary={formatDate(chat.timestamp)}
                    primaryTypographyProps={{
                      variant: 'body2',
                      noWrap: true,
                    }}
                    secondaryTypographyProps={{
                      variant: 'caption',
                      noWrap: true,
                    }}
                  />
                </ListItem>
                <Divider variant="inset" component="li" />
              </React.Fragment>
            ))}
          </List>
        )}
      </Collapse>
    </Box>
  );
};

export default AiChatHistory; 