import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../api';
import { updateUserProfile, uploadProfilePhoto } from '../api';
import { toast } from 'react-toastify';
import { FaUser, FaEnvelope, FaEdit, FaSave, FaTimes, FaSuitcase, FaGraduationCap, FaCertificate, FaLanguage, FaInfoCircle, FaMapMarkerAlt, FaPhone, FaGlobe, FaLinkedin } from 'react-icons/fa';
import '../styles/Account.css';

// Функция для парсинга строк PostgreSQL-массивов вида '{"English","Russian"}' в массив JS
function parsePgArray(str) {
  if (!str) return [];
  if (Array.isArray(str)) return str;
  // Если это JSON-строка массива
  if (str.startsWith('[') || str.startsWith('{')) {
    try {
      // Пробуем JSON.parse
      const parsed = JSON.parse(str.replace(/([a-zA-Z0-9]+):/g, '"$1":'));
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      // Если не JSON, парсим вручную
      return str.replace(/^{|}$/g, '').split(',').map(s => s.replace(/"/g, '').trim()).filter(Boolean);
    }
  }
  return str.split(',').map(s => s.replace(/"/g, '').replace(/[{}]/g, '').trim()).filter(Boolean);
}

const Account = () => {
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [professionalData, setProfessionalData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoUrl, setPhotoUrl] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        const data = await getCurrentUser();
        if (!data || !data.user) {
          setError('Колдонуучу табылган жок');
          setLoading(false);
          return;
        }
        setProfile(data.user);
        if (data.professional) setProfessionalData(data.professional);
        setEditForm({
          firstName: data.user.firstName || '',
          lastName: data.user.lastName || '',
          email: data.user.email || ''
        });
        setLoading(false);
      } catch (err) {
        setError('Колдонуучуну алууда ката кетти');
        setLoading(false);
      }
    };
    fetchUser();
  }, [navigate]);

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancelClick = () => {
    setIsEditing(false);
    setEditForm({
      firstName: profile.firstName || '',
      lastName: profile.lastName || '',
      email: profile.email || ''
    });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePhotoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setPhotoFile(e.target.files[0]);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      // Подготовка данных для обновления
      const dataToUpdate = { ...editForm };

      if (profile && profile.role === 'professional') {
        // Отдельные данные для пользователя и профессионала
        const userUpdate = { 
          firstName: dataToUpdate.firstName,
          lastName: dataToUpdate.lastName,
          email: dataToUpdate.email
        };
        const professionalUpdate = {
          hourlyRate: dataToUpdate.hourlyRate,
          details: {
            education: dataToUpdate.education,
            certifications: dataToUpdate.certifications,
            languages: dataToUpdate.languages ? dataToUpdate.languages.split(', ').map(lang => lang.trim()) : undefined,
            specializations: dataToUpdate.specializations ? dataToUpdate.specializations.split(', ').map(spec => spec.trim()) : undefined,
            about: dataToUpdate.about,
            location: dataToUpdate.location,
            contactPhone: dataToUpdate.contactPhone,
            website: dataToUpdate.website,
            socialLinks: { linkedin: dataToUpdate.linkedin }
          }
        };
        
        // Сначала обновляем профиль, потом фото (если выбрано)
        const updatedUserData = await updateUserProfile(profile._id, { user: userUpdate, professional: professionalUpdate });
        if (photoFile && profile && profile.professionalId) {
          // Загрузка фото
          const uploadRes = await uploadProfilePhoto(profile.professionalId, photoFile);
          setPhotoUrl(uploadRes.photoUrl);
          toast.success('Фото профиля обновлено!');
        }
        setProfile(updatedUserData.user);
        if (updatedUserData.professional) setProfessionalData(updatedUserData.professional);
      } else {
        // Обновление обычного пользователя
        const updatedUserData = await updateUserProfile(profile._id, dataToUpdate);
        setProfile(updatedUserData);
      }
      
      setIsEditing(false);
      toast.success('Профиль успешно обновлен!');
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
      setPhotoFile(null);
    }
  };

  // Logout button handled in Sidebar

  if (loading) return <div>Жүктөлүүдө...</div>;
  if (error) return <div>Ката: {error}</div>;
  if (!profile) return <div>Профиль табылган жок же маалыматтар жүктөлүүдө...</div>;

  const isProfessional = profile.role === 'professional';

  return (
    <div className="account-container">
      <div className="profile-card">
        <div className="profile-header">
          <h2>Жеке кабинет</h2>
          {!isEditing ? (
            <button className="edit-button" onClick={handleEditClick}><FaEdit /> Оңдоо</button>
          ) : (
            <div className="edit-buttons">
              <button className="save-button" onClick={handleSave}><FaSave /> Сактоо</button>
              <button className="cancel-button" onClick={handleCancelClick}><FaTimes /> Жокко чыгаруу</button>
            </div>
          )}
        </div>
        
        {!isEditing ? (
          <div className="user-info">
            <div className="profile-photo">
              {photoUrl ? (
                <img src={photoUrl} alt="Профиль сүрөтү" />
              ) : (
                <div className="avatar-placeholder">
                  {profile.firstName?.[0]}{profile.lastName?.[0]}
                </div>
              )}
            </div>
            <p><FaUser /> <strong>Аты:</strong> {profile.firstName} {profile.lastName}</p>
            <p><FaEnvelope /> <strong>Email:</strong> {profile.email}</p>
            {isProfessional && professionalData && (
              <>
                <p><FaSuitcase /> <strong>Түрү:</strong> {professionalData.professionalType?.name || 'Көрсөтүлгөн эмес'}</p>
                <p><strong>Сааттык акы:</strong> {professionalData.hourlyRate}</p>
                <p><strong>Жумушка бош:</strong> {professionalData.isAvailable ? 'Ооба' : 'Жок'}</p>
                <p><FaGraduationCap /> <strong>Билими:</strong> {professionalData.details?.education || 'Көрсөтүлгөн эмес'}</p>
                <p><FaCertificate /> <strong>Сертификаттар:</strong> {professionalData.details?.certifications || 'Көрсөтүлгөн эмес'}</p>
                <p><FaLanguage /> <strong>Тилдер:</strong> {parsePgArray(professionalData.details?.languages).join(', ') || 'Көрсөтүлгөн эмес'}</p>
                <p><FaInfoCircle /> <strong>Өзү жөнүндө:</strong> {professionalData.details?.about || 'Көрсөтүлгөн эмес'}</p>
                <p><FaMapMarkerAlt /> <strong>Жайгашкан жери:</strong> {professionalData.details?.location || 'Көрсөтүлгөн эмес'}</p>
                <p><FaPhone /> <strong>Байланыш телефону:</strong> {professionalData.details?.contactPhone || 'Көрсөтүлгөн эмес'}</p>
                <p><FaGlobe /> <strong>Вебсайт:</strong> {professionalData.details?.website || 'Көрсөтүлгөн эмес'}</p>
                <p><FaLinkedin /> <strong>LinkedIn:</strong> {professionalData.details?.socialLinks?.linkedin || 'Көрсөтүлгөн эмес'}</p>
              </>
            )}
          </div>
        ) : (
          <div className="edit-form">
            <div className="form-group">
              <label>Аты:</label>
              <input
                type="text"
                name="firstName"
                value={editForm.firstName}
                onChange={handleFormChange}
              />
            </div>
            <div className="form-group">
              <label>Фамилиясы:</label>
              <input
                type="text"
                name="lastName"
                value={editForm.lastName}
                onChange={handleFormChange}
              />
            </div>
            <div className="form-group">
              <label>Email:</label>
              <input
                type="email"
                name="email"
                value={editForm.email}
                onChange={handleFormChange}
                disabled
              />
            </div>
            {isProfessional && (
              <>
                <div className="form-group">
                  <label>Сааттык акы:</label>
                  <input
                    type="number"
                    name="hourlyRate"
                    value={editForm.hourlyRate}
                    onChange={handleFormChange}
                  />
                </div>
                <div className="form-group">
                  <label>Билими:</label>
                  <textarea
                    name="education"
                    value={editForm.education}
                    onChange={handleFormChange}
                  />
                </div>
                <div className="form-group">
                  <label>Сертификаттар:</label>
                  <textarea
                    name="certifications"
                    value={editForm.certifications}
                    onChange={handleFormChange}
                  />
                </div>
                <div className="form-group">
                  <label>Тилдер (чекит менен бөлүңүз):</label>
                  <input
                    type="text"
                    name="languages"
                    value={editForm.languages}
                    onChange={handleFormChange}
                  />
                </div>
                <div className="form-group">
                  <label>Адистиктер (чекит менен бөлүңүз):</label>
                  <input
                    type="text"
                    name="specializations"
                    value={editForm.specializations}
                    onChange={handleFormChange}
                  />
                </div>
                <div className="form-group">
                  <label>Өзү жөнүндө:</label>
                  <textarea
                    name="about"
                    value={editForm.about}
                    onChange={handleFormChange}
                  />
                </div>
                <div className="form-group">
                  <label>Жайгашкан жери:</label>
                  <input
                    type="text"
                    name="location"
                    value={editForm.location}
                    onChange={handleFormChange}
                  />
                </div>
                <div className="form-group">
                  <label>Байланыш телефону:</label>
                  <input
                    type="tel"
                    name="contactPhone"
                    value={editForm.contactPhone}
                    onChange={handleFormChange}
                  />
                </div>
                <div className="form-group">
                  <label>Вебсайт:</label>
                  <input
                    type="url"
                    name="website"
                    value={editForm.website}
                    onChange={handleFormChange}
                  />
                </div>
                <div className="form-group">
                  <label>LinkedIn:</label>
                  <input
                    type="url"
                    name="linkedin"
                    value={editForm.linkedin}
                    onChange={handleFormChange}
                  />
                </div>
                <div className="form-group">
                  <label>Профиль сүрөтү:</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                  />
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Account;