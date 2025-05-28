import React, { useState, useEffect } from 'react';
import { getAllProfessionals, getProfessionalTypes, getProfessionalById } from '../api';
import { useNavigate } from 'react-router-dom';
import '../styles/pages/_specialists.scss';

const Specialists = () => {
    const navigate = useNavigate();
    const [professionals, setProfessionals] = useState([]);
    const [professionalTypes, setProfessionalTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedProfessional, setSelectedProfessional] = useState(null);
    const [filters, setFilters] = useState({
        professionalType: '',
        specialization: '',
        language: '',
        maxHourlyRate: '',
        isAvailable: false
    });
    const [searchParams, setSearchParams] = useState({
        page: 1,
        limit: 10,
        search: ''
    });

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        fetchProfessionals();
    }, [searchParams]);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [professionalsData, typesData] = await Promise.all([
                getAllProfessionals(searchParams),
                getProfessionalTypes()
            ]);
            setProfessionals(professionalsData.professionals || []);
            setProfessionalTypes(typesData);
            setError(null);
        } catch (err) {
            setError('Failed to fetch data. Please try again later.');
            console.error('Error fetching initial data:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchProfessionals = async () => {
        try {
            setLoading(true);
            const params = {
                ...searchParams,
                professionalType: filters.professionalType,
                maxHourlyRate: filters.maxHourlyRate,
                isAvailable: filters.isAvailable
            };
            console.log('Параметры запроса:', params);
            const data = await getAllProfessionals(params);
            console.log('Ответ от бэкенда:', data);
            setProfessionals(Array.isArray(data) ? data : (data.professionals || []));
            setError(null);
        } catch (err) {
            setError('Failed to fetch professionals. Please try again later.');
            console.error('Error fetching professionals:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        setSearchParams(prev => ({ ...prev, page: 1 })); // Reset to first page on filter change
    };

    const handleSearch = (e) => {
        const { value } = e.target;
        setSearchParams(prev => ({
            ...prev,
            search: value,
            page: 1
        }));
    };

    const handleProfessionalClick = async (professionalId) => {
        try {
            const professional = await getProfessionalById(professionalId);
            setSelectedProfessional(professional);
        } catch (err) {
            console.error('Error fetching professional details:', err);
        }
    };

    const handleStartChat = (professionalId) => {
        navigate(`/chat/${professionalId}`);
    };

    // Функция для парсинга строк PostgreSQL-массивов вида '{"English","Russian"}' в массив JS
    function parsePgArray(str) {
        if (!str) return [];
        if (Array.isArray(str)) return str;
        return str.replace(/^{|}$/g, '').split(',').map(s => s.replace(/"/g, '').trim()).filter(Boolean);
    }

    if (loading && !professionals.length) {
        return (
            <div className="specialists-page loading">
                <div className="spinner"></div>
                <p>Адистер жүктөлүүдө...</p>
            </div>
        );
    }

    if (error && !professionals.length) {
        return (
            <div className="specialists-page error">
                <p>{error}</p>
                <button onClick={fetchInitialData}>Кайра аракет кылуу</button>
            </div>
        );
    }

    console.log('professionals:', professionals);

    return (
        <div className="specialists-page">
            <h1>Биздин адистер</h1>
            
            <div className="search-filters">
                <div className="search-bar">
                    <input
                        type="text"
                        placeholder="Адистерди издөө..."
                        value={searchParams.search}
                        onChange={handleSearch}
                        className="search-input"
                    />
                </div>

                <div className="filters">
                    <select
                        name="professionalType"
                        value={filters.professionalType}
                        onChange={handleFilterChange}
                        className="filter-select"
                    >
                        <option value="">Бардык адистер</option>
                        {professionalTypes.map(type => (
                            <option key={type.id} value={type.name}>
                                {type.name}
                            </option>
                        ))}
                    </select>

                    <input
                        type="text"
                        name="specialization"
                        placeholder="Адистик"
                        value={filters.specialization}
                        onChange={handleFilterChange}
                        className="filter-input"
                    />

                    <input
                        type="text"
                        name="language"
                        placeholder="Тил"
                        value={filters.language}
                        onChange={handleFilterChange}
                        className="filter-input"
                    />

                    <input
                        type="number"
                        name="maxHourlyRate"
                        placeholder="Макс. сааттык акы"
                        value={filters.maxHourlyRate}
                        onChange={handleFilterChange}
                        className="filter-input"
                    />

                    <label className="availability-filter">
                        <input
                            type="checkbox"
                            name="isAvailable"
                            checked={filters.isAvailable}
                            onChange={handleFilterChange}
                        />
                        Бош адистер гана
                    </label>
                </div>
            </div>

            <div className="professionals-grid">
                {professionals.map(professional => (
                    <div 
                        key={professional.id} 
                        className="professional-card"
                        onClick={() => handleProfessionalClick(professional.id)}
                    >
                        <div className="professional-header">
                            <div className="professional-avatar">
                                {professional.details.profilePhoto ? (
                                    <img src={professional.details.profilePhoto} alt="Сүрөт" />
                                ) : (
                                    <div className="avatar-placeholder">
                                        {professional.user.firstName[0]}{professional.user.lastName[0]}
                                    </div>
                                )}
                            </div>
                            <div className="professional-title">
                                <h2>{professional.user.firstName} {professional.user.lastName}</h2>
                                <span className="professional-type">{professional.professionalType.name}</span>
                            </div>
                            <div className="professional-status">
                                {professional.isAvailable ? (
                                    <span className="status available">Бош</span>
                                ) : (
                                    <span className="status busy">Мыш</span>
                                )}
                            </div>
                        </div>
                        
                        <div className="professional-info">
                            <div className="info-section">
                                <h3>Адис жөнүндө</h3>
                                <p>{professional.details.about}</p>
                            </div>

                            <div className="info-section">
                                <h3>Тажрыйба жана акы</h3>
                                <p>Тажрыйба: {'Көрсөтүлгөн эмес'}</p>
                                <p>Акы: {professional.hourlyRate} сом/саат</p>
                            </div>

                            <div className="info-section">
                                <h3>Адистиктер</h3>
                                <div className="tags">
                                    {parsePgArray(professional.details.specializations).map((spec, i) => (
                                        <span key={i} className="tag">{spec}</span>
                                    ))}
                                </div>
                            </div>

                            <div className="info-section">
                                <h3>Тилдер</h3>
                                <div className="tags">
                                    {parsePgArray(professional.details.languages).map((lang, i) => (
                                        <span key={i} className="tag">{lang}</span>
                                    ))}
                                </div>
                            </div>

                            <div className="professional-actions">
                                <button 
                                    className="chat-button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleStartChat(professional.id);
                                    }}
                                >
                                    Начать чат
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {professionals.length === 0 && (
                <div className="no-results">
                    <p>Сиздин издөө шарттарыңызга ылайык адистер табылган жок.</p>
                </div>
            )}

            {selectedProfessional && (
                <div className="professional-modal" onClick={() => setSelectedProfessional(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <button className="close-button" onClick={() => setSelectedProfessional(null)}>×</button>
                        <div className="modal-header">
                            <h2>{selectedProfessional.user.firstName} {selectedProfessional.user.lastName}</h2>
                            <span className="professional-type">{selectedProfessional.professionalType.name}</span>
                        </div>
                        <div className="modal-body">
                            <div className="info-section">
                                <h3>Образование</h3>
                                <p>{selectedProfessional.details.education}</p>
                            </div>
                            <div className="info-section">
                                <h3>Сертификаты</h3>
                                <p>{selectedProfessional.details.certifications}</p>
                            </div>
                            <div className="info-section">
                                <h3>Контакты</h3>
                                <p>📍 {selectedProfessional.details.location}</p>
                                <p>📞 {selectedProfessional.details.contactPhone}</p>
                                {selectedProfessional.details.socialLinks && (
                                    <div className="social-links">
                                        {selectedProfessional.details.socialLinks.linkedin && (
                                            <a 
                                                href={selectedProfessional.details.socialLinks.linkedin}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="social-link linkedin"
                                            >
                                                LinkedIn
                                            </a>
                                        )}
                                        {selectedProfessional.details.socialLinks.website && (
                                            <a 
                                                href={selectedProfessional.details.socialLinks.website}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="social-link website"
                                            >
                                                Website
                                            </a>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button 
                                className="chat-button"
                                onClick={() => {
                                    setSelectedProfessional(null);
                                    handleStartChat(selectedProfessional.id);
                                }}
                            >
                                Начать чат
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Specialists; 