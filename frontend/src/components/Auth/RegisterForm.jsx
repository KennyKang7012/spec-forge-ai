import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import './Auth.css';

const RegisterForm = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    display_name: '',
  });
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const api = useApi();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError('兩次輸入的密碼不一致！');
      return;
    }

    setIsLoading(true);

    try {
      await api.post('/api/auth/register', {
        username: formData.username,
        password: formData.password,
        display_name: formData.display_name,
      });
      
      // 註冊成功，導向登入頁並帶入成功訊息 (此處先簡單處理)
      alert('註冊成功！請使用新帳號登入。');
      navigate('/login');
    } catch (err) {
      setError(err.message || '註冊失敗，請稍後再試。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="glass-panel auth-panel">
        <div className="auth-header">
          <h2>建立帳號</h2>
          <p>加入 SpecForge AI</p>
        </div>
        
        {error && <div className="auth-error">{error}</div>}
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="username">使用者名稱 (帳號)</label>
            <input
              id="username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleChange}
              placeholder="請輸入帳號"
              required
              disabled={isLoading}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="display_name">顯示名稱</label>
            <input
              id="display_name"
              name="display_name"
              type="text"
              value={formData.display_name}
              onChange={handleChange}
              placeholder="您的稱呼"
              required
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">密碼</label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="請輸入密碼"
              required
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">確認密碼</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="再次輸入密碼"
              required
              disabled={isLoading}
            />
          </div>
          
          <button type="submit" className="primary-btn" disabled={isLoading}>
            {isLoading ? '註冊中...' : '註冊帳號'}
          </button>
        </form>
        
        <div className="auth-footer">
          已經有帳號了？ <Link to="/login">返回登入</Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;
