import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const ChatHistory = () => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const [chat, setChat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const fetchChat = async () => {
      try {
        const history = await axios.get(`${API_URL}/chat/drive-history`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        const foundChat = history.data.find(c => c.id === chatId);
        if (foundChat) {
          // Инициализируем историю сообщений с первым сообщением
          setChat({
            ...foundChat,
            messages: [{
              question: foundChat.question,
              answer: foundChat.answer,
              timestamp: foundChat.timestamp
            }]
          });
        } else {
          setError('Чат не найден');
        }
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchChat();
  }, [chatId]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chat?.messages, isLoading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    setIsLoading(true);
    setError('');

    // Добавляем новое сообщение в историю
    setChat(prevChat => ({
      ...prevChat,
      messages: [
        ...(prevChat.messages || []),
        { question: input.trim(), answer: '', timestamp: new Date().toISOString() }
      ]
    }));

    try {
      const response = await axios.post(
        `${API_URL}/chat/query`,
        { question: input.trim() },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );

      // Обновляем последнее сообщение с ответом
      setChat(prevChat => ({
        ...prevChat,
        messages: prevChat.messages.map((msg, idx) => 
          idx === prevChat.messages.length - 1 
            ? { ...msg, answer: response.data.answer }
            : msg
        )
      }));

      setInput('');
    } catch (err) {
      setError('Суроо жөнөтүүдө ката кетти');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#fff'
      }}>
        <div style={{ color: '#1976d2', fontSize: '1.2rem' }}>Жүктөлүүдө...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#fff'
      }}>
        <div style={{ color: '#d32f2f' }}>{error}</div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#fff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#222',
      width: '100%',
      height: '100vh',
      overflow: 'hidden',
    }}>
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        width: '100%',
        maxWidth: 800,
        height: '100vh',
        position: 'relative',
        background: '#fff',
      }}>
        {error && (
          <div style={{
            color: '#d32f2f',
            marginBottom: 20,
            textAlign: 'center',
            position: 'absolute',
            top: 10,
            left: 0,
            right: 0,
            zIndex: 10
          }}>
            {error}
          </div>
        )}
        {/* История сообщений */}
        <div style={{
          flex: 1,
          width: '100%',
          maxWidth: 700,
          margin: '0 auto',
          overflowY: 'auto',
          padding: '32px 0 120px 0',
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
          height: '100%',
        }}>
          {chat.messages?.map((msg, idx) => (
            <div key={idx} style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 8,
            }}>
              {/* Вопрос */}
              <div style={{
                alignSelf: 'flex-end',
                background: '#e3f0ff',
                color: '#1976d2',
                borderRadius: '16px 16px 4px 16px',
                padding: '14px 20px',
                fontWeight: 500,
                fontSize: '1.08rem',
                maxWidth: '80%',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
              }}>
                {msg.question}
              </div>
              {/* Ответ */}
              <div style={{
                alignSelf: 'flex-start',
                background: '#f5f6fa',
                color: '#222',
                borderRadius: '16px 16px 16px 4px',
                padding: '14px 20px',
                fontSize: '1.1rem',
                maxWidth: '80%',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                minHeight: 32,
                whiteSpace: 'pre-wrap',
              }}>
                {msg.answer || (idx === chat.messages.length - 1 && isLoading ? 'Жооп даярдалууда...' : '')}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        {/* Инпут закреплен снизу */}
        <form
          style={{
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: 0,
            width: '100%',
            background: 'rgba(255,255,255,0.98)',
            boxShadow: '0 -2px 16px rgba(0,0,0,0.04)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '24px 0 24px 0',
            zIndex: 100,
          }}
          onSubmit={handleSubmit}
        >
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Бир нерсе сураңыз..."
            style={{
              width: '100%',
              maxWidth: 700,
              padding: '16px 20px',
              borderRadius: 18,
              border: '1px solid #e0e0e0',
              fontSize: '1.1rem',
              background: '#f5f6fa',
              color: '#222',
              outline: 'none',
              marginRight: 12,
              resize: 'none',
              minHeight: '48px',
              maxHeight: '120px',
              overflowY: 'hidden',
              lineHeight: '1.5'
            }}
            disabled={isLoading}
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            onInput={(e) => {
              e.target.style.height = 'auto';
              const newHeight = Math.min(e.target.scrollHeight, 120);
              e.target.style.height = newHeight + 'px';
              e.target.style.overflowY = e.target.scrollHeight > 120 ? 'auto' : 'hidden';
            }}
          />
          <button
            type="submit"
            disabled={isLoading}
            style={{
              background: '#1976d2',
              color: '#fff',
              border: 'none',
              borderRadius: 16,
              padding: '0 32px',
              fontWeight: 500,
              fontSize: '1.08rem',
              height: 48,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'background 0.18s',
              opacity: isLoading ? 0.7 : 1
            }}
          >
            {isLoading ? 'Жөнөтүлүүдө...' : 'Жөнөтүү'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatHistory; 