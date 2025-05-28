import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import '../../styles/components/_auth.scss';

const Login = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await login(formData);
            toast.success('Ийгиликтүү кирдиңиз!');
            navigate('/');
        } catch (error) {
            toast.error(error.message || 'Кирүүдө ката кетти');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page-center">
            <div className="auth-form">
                <h1>Кабинетке кирүү</h1>
                <form onSubmit={handleSubmit}>
                    <input
                        type="email"
                        name="email"
                        placeholder="Email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />
                    <input
                        type="password"
                        name="password"
                        placeholder="Сыр сөз"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />
                    <button type="submit" disabled={loading}>
                        {loading ? 'Кирүүдө...' : 'Кирүү'}
                    </button>
                </form>
                <div className="auth-links">
                    Аккаунт жокбу? <Link to="/register">Катталуу</Link>
                </div>
            </div>
        </div>
    );
};

export default Login;