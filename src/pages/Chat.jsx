import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getAllProfessionals, getAllUsers } from '../api';
import axios from 'axios';
import { io } from 'socket.io-client';

const API_URL = 'https://polniy-bankich.onrender.com/api';
const SOCKET_URL = 'https://polniy-bankich.onrender.com';

const Chat = () => {
  const { user } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState({});
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Получить список контактов
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        if (!user?.user?.id) return;
        
        if (user.user.role === 'professional') {
          // Для профессионала показываем только пользователей
          const users = await getAllUsers();
          setContacts(users.filter(u => u.id !== user.user.id && u.role === 'user'));
        } else {
          // Для пользователя показываем только профессионалов
          const response = await getAllProfessionals();
          console.log('Loaded professionals:', response);

          const professionals = response.professionals || response;
          setContacts(professionals
            .map(p => p.user)
            .filter(u => u.id !== user.user.id));
        }
      } catch (e) {
        console.error('Error fetching contacts:', e);
        setContacts([]);
      }
    };
    fetchContacts();
  }, [user]);

  // Получить непрочитанные сообщения
  useEffect(() => {
    const fetchUnread = async () => {
      try {
        if (!user?.user?.id) return;
  
        const res = await axios.get(`${API_URL}/chat/unread`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
  
        const counts = {};
        const sendersMap = {}; // Для уникальных отправителей
  
        res.data.forEach(msg => {
          const senderId = msg.senderId;
          counts[senderId] = (counts[senderId] || 0) + 1;
  
          // запоминаем отправителя
          if (!sendersMap[senderId]) {
            sendersMap[senderId] = msg.sender;
          }
        });
  
        setUnread(counts);
  
        // Добавим отправителей непрочитанных, если они ещё не в контактах
        setContacts(prev => {
          const existingIds = new Set(prev.map(c => c.id));
          const newContacts = Object.values(sendersMap).filter(sender => !existingIds.has(sender.id));
          return [...prev, ...newContacts];
        });
  
      } catch (e) {
        console.error('Error fetching unread messages:', e);
        setUnread({});
      }
    };
  
    fetchUnread();
  }, [user]);
  

  // Получить историю сообщений
  const fetchMessages = async (contactId) => {
    if (!user?.user?.id) return;
    
    setLoading(true);
    try {
      const res = await axios.get(
        `${API_URL}/chat/history/${contactId}`,
        {
          params: { limit: 50, offset: 0 },
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      
      const sortedMessages = res.data.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      setMessages(sortedMessages);
      
      // Пометить сообщения как прочитанные
      if (sortedMessages.length > 0) {
        try {
          await axios.put(`${API_URL}/chat/read/${contactId}`, {}, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
          setUnread(prev => ({ ...prev, [contactId]: 0 }));
          
          socketRef.current?.emit('mark_read', { 
            senderId: contactId, 
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          console.error('Error marking messages as read:', error);
        }
      }
    } catch (e) {
      console.error('Error fetching messages:', e);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  // При выборе контакта — загрузить историю
  useEffect(() => {
    if (selectedContact) {
      fetchMessages(selectedContact.id);
    }
  }, [selectedContact]);

  // Скролл вниз при новых сообщениях
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Отправить сообщение
  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedContact || !user?.user?.id) return;
    
    const messageToSend = {
      receiverId: selectedContact.id,
      content: newMessage.trim()
    };

    try {
      const res = await axios.post(`${API_URL}/chat/send`, messageToSend, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      setMessages(prev => {
        const newMessages = [...prev, res.data];
        return newMessages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      });
      
      setNewMessage('');
    } catch (e) {
      console.error('Error sending message:', e);
      const errorMessage = e.response?.data?.message || 'Error sending message';
      alert(errorMessage);
    }
  };

  // WebSocket подключение
  useEffect(() => {
    if (!user?.user?.id) return;
    
    socketRef.current = io(SOCKET_URL, {
      auth: { token: localStorage.getItem('token') },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });
    
    socketRef.current.on('connect', () => {
      console.log('Socket connected');
      socketRef.current.emit('join', user.user.id);
    });
    
    socketRef.current.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
    
    socketRef.current.on('error', (error) => {
      console.error('Socket error:', error);
    });
    
    socketRef.current.on('new_message', (msg) => {
      if (selectedContact && (msg.senderId === selectedContact.id || msg.receiverId === selectedContact.id)) {
        setMessages(prev => {
          const newMessages = [...prev, msg];
          return newMessages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        });
        
        if (msg.senderId === selectedContact.id) {
          socketRef.current?.emit('mark_read', { 
            senderId: msg.senderId,
            timestamp: new Date().toISOString()
          });
          setUnread(prev => ({ ...prev, [msg.senderId]: 0 }));
        }
      } else {
        setUnread(prev => ({ ...prev, [msg.senderId]: (prev[msg.senderId] || 0) + 1 }));
      }
    });
    
    socketRef.current.on('messages_read', ({ senderId, timestamp }) => {
      setUnread(prev => ({ ...prev, [senderId]: 0 }));
      setMessages(prev => prev.map(msg => 
        msg.senderId === senderId && new Date(msg.createdAt) <= new Date(timestamp)
          ? { ...msg, isRead: true }
          : msg
      ));
    });
    
    return () => {
      socketRef.current?.disconnect();
    };
  }, [user, selectedContact]);

  // Форматирование даты
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div style={{ 
        display: 'flex', 
        height: '100vh',
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center'
    }}>
        <div style={{ 
            display: 'flex', 
            height: '80vh', 
            width: '90%',
            maxWidth: 1200,
            border: '1px solid #eee', 
            borderRadius: 8, 
            overflow: 'hidden',
        }}>
            {/* Контакты */}
            <div style={{ width: 250, borderRight: '1px solid #eee', overflowY: 'auto', background: '#fafbfc' }}>
                <h3 style={{ padding: 16, margin: 0 }}>
                    {user?.user?.role === 'professional' ? 'Пользователи' : 'Профессионалы'}
                </h3>
                {contacts.map(c => (
                    <div
                        key={c.id}
                        onClick={() => setSelectedContact(c)}
                        style={{
                            padding: 12,
                            cursor: 'pointer',
                            background: selectedContact && selectedContact.id === c.id ? '#e3f2fd' : 'transparent',
                            borderBottom: '1px solid #f0f0f0',
                            position: 'relative',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 500 }}>{c.firstName} {c.lastName}</span>
                            {unread[c.id] > 0 && (
                                <span style={{
                                    background: '#1976d2',
                                    color: 'white',
                                    borderRadius: '50%',
                                    padding: '2px 6px',
                                    fontSize: '12px'
                                }}>
                                    {unread[c.id]}
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Чат */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {selectedContact ? (
                    <>
                        {/* Заголовок чата */}
                        <div style={{ 
                            padding: 16, 
                            borderBottom: '1px solid #eee',
                            background: '#fff'
                        }}>
                            <h3 style={{ margin: 0 }}>{selectedContact.firstName} {selectedContact.lastName}</h3>
                        </div>

                        {/* Сообщения */}
                        <div style={{ 
                            flex: 1, 
                            overflowY: 'auto', 
                            padding: 16,
                            background: '#f5f5f5'
                        }}>
                            {loading ? (
                                <div style={{ textAlign: 'center', padding: 20 }}>Жүктөлүүдө...</div>
                            ) : (
                                messages.map((msg, index) => (
                                    <div
                                        key={msg.id || index}
                                        style={{
                                            display: 'flex',
                                            justifyContent: msg.senderId === user?.user?.id ? 'flex-end' : 'flex-start',
                                            marginBottom: 8
                                        }}
                                    >
                                        <div style={{
                                            maxWidth: '70%',
                                            padding: '8px 12px',
                                            borderRadius: 12,
                                            background: msg.senderId === user?.user?.id ? '#1976d2' : '#fff',
                                            color: msg.senderId === user?.user?.id ? '#fff' : '#000',
                                            boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                                        }}>
                                            {msg.content}
                                        </div>
                                    </div>
                                ))
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Форма отправки */}
                        <form onSubmit={handleSend} style={{ 
                            padding: 16, 
                            borderTop: '1px solid #eee',
                            background: '#fff'
                        }}>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Жаңы билдирүү..."
                                    style={{
                                        flex: 1,
                                        padding: '8px 12px',
                                        border: '1px solid #ddd',
                                        borderRadius: 4,
                                        outline: 'none'
                                    }}
                                />
                                <button
                                    type="submit"
                                    style={{
                                        padding: '8px 16px',
                                        background: '#1976d2',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: 4,
                                        cursor: 'pointer'
                                    }}
                                >
                                    Жөнөтүү
                                </button>
                            </div>
                        </form>
                    </>
                ) : (
                    <div style={{ 
                        flex: 1, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        color: '#666'
                    }}>
                        Сүйлөшүү баштоо үчүн контактты тандаңыз
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default Chat;