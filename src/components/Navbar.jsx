import {Link, useNavigate} from 'react-router-dom';
import '../styles/components/_navbar.scss';

const Navbar = ({ user, onLogout }) => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        onLogout();
        navigate('/login');
    };

    return (
        <nav className="navbar">
            <div className="navbar__links">
                {!user && <Link to="/login" className="nav-link">Войти</Link>}
                {!user && <Link to="/register" className="nav-link">Регистрация</Link>}
                {user && <Link to="/account" className="nav-link">Личный кабинет</Link>}
                <Link to="/news" className="nav-link">Новости</Link>
                <Link to="/specialists" className="nav-link">Специалисты</Link>
            </div>

            {user && (
                <div className="navbar__user">
                    <span className="user-greeting">Привет, {user.username}</span>
                    <button onClick={handleLogout} className="logout-btn">
                        Выйти
                    </button>
                </div>
            )}
        </nav>
    );
};

export default Navbar;