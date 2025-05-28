import React, { useState, useEffect, useRef } from 'react';
import '../styles/components/_home.scss';

const Home = () => {
    const [input, setInput] = useState('');
    const [freeQueriesLeft, setFreeQueriesLeft] = useState(3);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [messages, setMessages] = useState([]); // История сообщений
    const messagesEndRef = useRef(null);

    useEffect(() => {
        // Check if user is authenticated
        const token = localStorage.getItem('token');
        setIsAuthenticated(!!token);
    }, []);

    useEffect(() => {
        // Скролл вниз при добавлении сообщения
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isLoading]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        setIsLoading(true);
        setError('');

        setMessages(prev => [...prev, { question: input.trim(), answer: '' }]);
        const currentIndex = messages.length;

        try {
            let endpoint = 'http://localhost:5001/query';
            let headers = {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            };

            if (isAuthenticated) {
                endpoint = 'http://localhost:5000/api/chat/query';
                const token = localStorage.getItem('token');
                if (token) {
                    headers['Authorization'] = `Bearer ${token}`;
                }
            }

            if (!isAuthenticated && freeQueriesLeft <= 0) {
                setError('Акысыз суроолор бүттү. Сураныч, катталыңыз же системага кириңиз.');
                setIsLoading(false);
                return;
            }

            const response = await fetch(endpoint, {
                method: 'POST',
                headers,
                credentials: 'include',
                mode: 'cors',
                body: JSON.stringify({ question: input.trim() })
            });

            if (!response.ok) {
                throw new Error('Суроо жөнөтүүдө ката кетти');
            }

            const data = await response.json();
            setMessages(prev => prev.map((msg, idx) => idx === currentIndex ? { ...msg, answer: data.answer } : msg));

            if (!isAuthenticated) {
                setFreeQueriesLeft(prev => prev - 1);
            }

            setInput('');
        } catch (err) {
            setError('Суроо жөнөтүүдө ката кетти');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

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
                {/* Заголовок и счетчик только если нет сообщений */}
                {messages.length === 0 && (
                    <>
                        <h1 style={{
                            fontSize: '2.5rem',
                            fontWeight: 600,
                            marginTop: 48,
                            marginBottom: 32,
                            color: '#222',
                            textAlign: 'center',
                            letterSpacing: 1
                        }}>
                            Мен сизге кандай жардам бере алам?
                        </h1>
                        {!isAuthenticated && (
                            <div style={{
                                marginBottom: 20,
                                color: '#666',
                                textAlign: 'center'
                            }}>
                                Акысыз суроолор калды: {freeQueriesLeft}
                            </div>
                        )}
                    </>
                )}
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
                    {messages.map((msg, idx) => (
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
                                {msg.answer || (idx === messages.length - 1 && isLoading ? 'Жооп даярдалууда...' : '')}
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
                        placeholder={!isAuthenticated && freeQueriesLeft <= 0 ? 
                            "Акысыз суроолор бүттү. Сураныч, катталыңыз же системага кириңиз." : 
                            "Бир нерсе сураңыз..."}
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
                            opacity: (!isAuthenticated && freeQueriesLeft <= 0) ? 0.7 : 1,
                            resize: 'none',
                            minHeight: '48px',
                            maxHeight: '120px',
                            overflowY: 'hidden',
                            lineHeight: '1.5'
                        }}
                        disabled={isLoading || (!isAuthenticated && freeQueriesLeft <= 0)}
                        rows={1}
                        onInput={(e) => {
                            e.target.style.height = 'auto';
                            const newHeight = Math.min(e.target.scrollHeight, 120);
                            e.target.style.height = newHeight + 'px';
                            e.target.style.overflowY = e.target.scrollHeight > 120 ? 'auto' : 'hidden';
                        }}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || (!isAuthenticated && freeQueriesLeft <= 0)}
                        style={{
                            background: '#1976d2',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 16,
                            padding: '0 32px',
                            fontWeight: 500,
                            fontSize: '1.08rem',
                            height: 48,
                            cursor: (isLoading || (!isAuthenticated && freeQueriesLeft <= 0)) ? 'not-allowed' : 'pointer',
                            transition: 'background 0.18s',
                            opacity: (isLoading || (!isAuthenticated && freeQueriesLeft <= 0)) ? 0.7 : 1
                        }}
                    >
                        {isLoading ? 'Жөнөтүлүүдө...' : 'Жөнөтүү'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Home;

