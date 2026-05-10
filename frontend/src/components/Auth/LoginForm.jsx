import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import useAuthStore from '../../stores/authStore';
import './Auth.css'; // 我們待會會加入專屬的 CSS

const LoginForm = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const api = useApi();
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await api.post('/api/auth/login', {
        username,
        password,
      });
      
      // 登入成功，儲存 token 與 user 資訊
      login(response.access_token, response.user);
      
      // 導向控制台
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || '登入失敗，請檢查帳號密碼。');
      setUsername(''); // 登入失敗時清空帳號欄位
      setPassword(''); // 登入失敗時清空密碼欄位
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="glass-panel auth-panel">
        <div className="auth-header">
          <h2>SpecForge AI</h2>
          <p>進入您的規格鍛造爐</p>
        </div>
        
        {error && <div className="auth-error">{error}</div>}
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="username">使用者名稱</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="輸入帳號"
              required
              disabled={isLoading}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">密碼</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="輸入密碼"
              required
              disabled={isLoading}
            />
          </div>
          
          <button type="submit" className="primary-btn" disabled={isLoading}>
            {isLoading ? '登入中...' : '登入'}
          </button>
        </form>
        
        <div className="auth-footer">
          還沒有帳號嗎？ <Link to="/register">立即註冊</Link>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
