import { useState, useEffect } from 'react';
import { registerUser, registerProfessional, getProfessionalTypes } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import '../../styles/components/_auth.scss';
import { Link, useNavigate } from 'react-router-dom';

const Register = () => {
    const [formType, setFormType] = useState('user');
    const [currentStep, setCurrentStep] = useState(1);
    const [professionalTypes, setProfessionalTypes] = useState([]);
    const [formData, setFormData] = useState({
        // Шаг 1: Основная информация
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        // Шаг 2: Профессиональная информация
        professionalTypeName: '',
        experience: '',
        hourlyRate: '',
        // Шаг 3: Образование и квалификация
        education: '',
        certifications: '',
        languages: [''],
        specializations: [''],
        // Шаг 4: Дополнительная информация
        about: '',
        location: '',
        contactPhone: '',
        socialLinks: {
            linkedin: ''
        }
    });
    const [errorMessage, setErrorMessage] = useState('');
    const navigate = useNavigate();
    const { register, login } = useAuth();

    const totalSteps = 4;

    // Fetch professional types when component mounts
    useEffect(() => {
        const fetchProfessionalTypes = async () => {
            try {
                console.log('Fetching professional types...');
                const types = await getProfessionalTypes();
                console.log('Received professional types:', types);
                setProfessionalTypes(types);
            } catch (error) {
                console.error('Error fetching professional types:', error);
                setErrorMessage('Адистик түрлөрүн жүктөөдө ката кетти. Сураныч, кийин кайра аракет кылыңыз.');
            }
        };

        if (formType === 'professional') {
            console.log('Form type is professional, fetching types...');
            fetchProfessionalTypes();
        }
    }, [formType]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormData(prev => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: value
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleArrayInputChange = (index, value, field) => {
        setFormData(prev => ({
            ...prev,
            [field]: prev[field].map((item, i) => i === index ? value : item)
        }));
    };

    const addArrayField = (field) => {
        setFormData(prev => ({
            ...prev,
            [field]: [...prev[field], '']
        }));
    };

    const removeArrayField = (index, field) => {
        setFormData(prev => ({
            ...prev,
            [field]: prev[field].filter((_, i) => i !== index)
        }));
    };

    const nextStep = () => {
        setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    };

    const prevStep = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formType === 'professional' && currentStep < totalSteps) {
            nextStep();
            return;
        }

        try {
            let response;
            if (formType === 'user') {
                response = await register({
                    email: formData.email,
                    password: formData.password,
                    firstName: formData.firstName,
                    lastName: formData.lastName
                });
                toast.success('Каттоо ийгиликтүү болду!');
                navigate('/');
            } else {
                response = await registerProfessional({
                    ...formData,
                    experience: Number(formData.experience),
                    hourlyRate: Number(formData.hourlyRate),
                    languages: formData.languages.filter(lang => lang.trim() !== ''),
                    specializations: formData.specializations.filter(spec => spec.trim() !== '')
                });
                if (response.token) {
                    localStorage.setItem('accessToken', response.token);
                    await login({ email: formData.email, password: formData.password });
                    toast.success('Каттоо ийгиликтүү болду!');
                    navigate('/');
                }
            }
        } catch (error) {
            setErrorMessage(error.message || 'Каттоо ийгиликсиз болду. Сураныч, кайра аракет кылыңыз.');
            toast.error(error.message || 'Каттоо ийгиликсиз болду');
        }
    };

    const renderStepIndicator = () => {
        if (formType !== 'professional') return null;
        
        return (
            <div className="step-indicator">
                {Array.from({ length: totalSteps }, (_, i) => (
                    <div 
                        key={i} 
                        className={`step ${i + 1 === currentStep ? 'active' : ''} ${i + 1 < currentStep ? 'completed' : ''}`}
                    >
                        <div className="step-number">{i + 1}</div>
                        <div className="step-label">
                            {i === 0 && 'Негизги маалыматтар'}
                            {i === 1 && 'Адистик маалыматтары'}
                            {i === 2 && 'Билим жана квалификация'}
                            {i === 3 && 'Кошумча маалыматтар'}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const renderStepContent = () => {
        if (formType === 'user') {
            return (
                <>
                    <input
                        type="email"
                        name="email"
                        placeholder="Email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                    />
                    <input
                        type="password"
                        name="password"
                        placeholder="Сыр сөз"
                        value={formData.password}
                        onChange={handleInputChange}
                        required
                    />
                    <input
                        type="text"
                        name="firstName"
                        placeholder="Аты"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        required
                    />
                    <input
                        type="text"
                        name="lastName"
                        placeholder="Фамилиясы"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        required
                    />
                </>
            );
        }

        switch (currentStep) {
            case 1:
                return (
                    <>
                        <h3>Негизги маалыматтар</h3>
                        <input
                            type="email"
                            name="email"
                            placeholder="Email"
                            value={formData.email}
                            onChange={handleInputChange}
                            required
                        />
                        <input
                            type="password"
                            name="password"
                            placeholder="Сыр сөз"
                            value={formData.password}
                            onChange={handleInputChange}
                            required
                        />
                        <input
                            type="text"
                            name="firstName"
                            placeholder="Аты"
                            value={formData.firstName}
                            onChange={handleInputChange}
                            required
                        />
                        <input
                            type="text"
                            name="lastName"
                            placeholder="Фамилиясы"
                            value={formData.lastName}
                            onChange={handleInputChange}
                            required
                        />
                    </>
                );
            case 2:
                return (
                    <>
                        <h3>Адистик маалыматтары</h3>
                        <select
                            name="professionalTypeName"
                            value={formData.professionalTypeName}
                            onChange={handleInputChange}
                            required
                            className="select-input"
                        >
                            <option value="">Адистик түрүн тандаңыз</option>
                            {professionalTypes.map(type => (
                                <option key={type.id} value={type.name}>
                                    {type.name}
                                </option>
                            ))}
                        </select>
                        <input
                            type="number"
                            name="experience"
                            placeholder="Тажрыйба (жыл)"
                            value={formData.experience}
                            onChange={handleInputChange}
                            required
                        />
                        <input
                            type="number"
                            name="hourlyRate"
                            placeholder="Сааттык акы"
                            value={formData.hourlyRate}
                            onChange={handleInputChange}
                            required
                        />
                    </>
                );
            case 3:
                return (
                    <>
                        <h3>Билим жана квалификация</h3>
                        <input
                            type="text"
                            name="education"
                            placeholder="Билими"
                            value={formData.education}
                            onChange={handleInputChange}
                            required
                        />
                        <input
                            type="text"
                            name="certifications"
                            placeholder="Сертификаттар"
                            value={formData.certifications}
                            onChange={handleInputChange}
                            required
                        />
                        <div className="array-inputs">
                            <label>Тилдер</label>
                            {formData.languages.map((lang, index) => (
                                <div key={index} className="array-input-row">
                                    <input
                                        type="text"
                                        value={lang}
                                        onChange={(e) => handleArrayInputChange(index, e.target.value, 'languages')}
                                        placeholder="Тил"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeArrayField(index, 'languages')}
                                        className="remove-btn"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={() => addArrayField('languages')}
                                className="add-btn"
                            >
                                + Тил кошуу
                            </button>
                        </div>

                        <div className="array-inputs">
                            <label>Адистиктер</label>
                            {formData.specializations.map((spec, index) => (
                                <div key={index} className="array-input-row">
                                    <input
                                        type="text"
                                        value={spec}
                                        onChange={(e) => handleArrayInputChange(index, e.target.value, 'specializations')}
                                        placeholder="Адистик"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeArrayField(index, 'specializations')}
                                        className="remove-btn"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={() => addArrayField('specializations')}
                                className="add-btn"
                            >
                                + Адистик кошуу
                            </button>
                        </div>
                    </>
                );
            case 4:
                return (
                    <>
                        <h3>Кошумча маалыматтар</h3>
                        <textarea
                            name="about"
                            placeholder="Өзүңүз жөнүндө"
                            value={formData.about}
                            onChange={handleInputChange}
                            required
                        />
                        <input
                            type="text"
                            name="location"
                            placeholder="Жайгашкан жери"
                            value={formData.location}
                            onChange={handleInputChange}
                            required
                        />
                        <input
                            type="tel"
                            name="contactPhone"
                            placeholder="Байланыш телефону"
                            value={formData.contactPhone}
                            onChange={handleInputChange}
                            required
                        />
                        <input
                            type="url"
                            name="socialLinks.linkedin"
                            placeholder="LinkedIn профили"
                            value={formData.socialLinks.linkedin}
                            onChange={handleInputChange}
                        />
                    </>
                );
            default:
                return null;
        }
    };

    return (
        <div className="auth-form">
            <h1>Аккаунт түзүү</h1>
            <div className="form-type-toggle">
                <button
                    type="button"
                    className={formType === 'user' ? 'active' : ''}
                    onClick={() => {
                        setFormType('user');
                        setCurrentStep(1);
                    }}
                >
                    Колдонуучу
                </button>
                <button
                    type="button"
                    className={formType === 'professional' ? 'active' : ''}
                    onClick={() => {
                        setFormType('professional');
                        setCurrentStep(1);
                    }}
                >
                    Адис
                </button>
            </div>

            {renderStepIndicator()}

            <form onSubmit={handleSubmit}>
                {renderStepContent()}

                <div className="form-navigation">
                    {formType === 'professional' && currentStep > 1 && (
                        <button type="button" onClick={prevStep} className="prev-btn">
                            Артка
                        </button>
                    )}
                    <button type="submit" className="submit-btn">
                        {formType === 'professional' && currentStep < totalSteps ? 'Кийинки' : 'Катталуу'}
                    </button>
                </div>
            </form>

            {errorMessage && <div className="error-message">{errorMessage}</div>}
            <div className="auth-links">
                Аккаунтуңуз барбы? <Link to="/login">Кирүү</Link>
            </div>
        </div>
    );
};

export default Register;