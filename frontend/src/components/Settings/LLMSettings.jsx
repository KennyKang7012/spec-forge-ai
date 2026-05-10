import { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { Eye, EyeOff, Save, CheckCircle } from 'lucide-react';
import './Settings.css';

/**
 * 供應商選項與其需要的欄位
 */
const PROVIDERS = {
  ollama:     { label: 'Ollama（本地）', needsKey: false, needsUrl: true,  defaultUrl: 'http://localhost:11434' },
  openai:     { label: 'OpenAI',         needsKey: true,  needsUrl: false },
  google:     { label: 'Google Gemini',  needsKey: true,  needsUrl: false },
  openrouter: { label: 'OpenRouter',     needsKey: true,  needsUrl: false },
  nvidia:     { label: 'Nvidia',         needsKey: true,  needsUrl: true },
  custom:     { label: 'Custom（自訂）', needsKey: true,  needsUrl: true },
};

/**
 * LLMSettings — LLM 供應商設定面板
 */
const LLMSettings = () => {
  const api = useApi();
  const [provider, setProvider] = useState('ollama');
  const [modelName, setModelName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  // 載入現有設定
  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.get('/api/settings/llm');
        setProvider(data.provider || 'ollama');
        setModelName(data.model_name || '');
        setBaseUrl(data.base_url || '');
      } catch (err) {
        console.error('Failed to load LLM config:', err);
      }
    };
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const providerInfo = PROVIDERS[provider] || PROVIDERS.ollama;

  const handleSave = async () => {
    setIsLoading(true);
    setSaved(false);
    try {
      await api.put('/api/settings/llm', {
        provider,
        model_name: modelName,
        api_key: apiKey || null,
        base_url: baseUrl || null,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert('儲存失敗：' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="settings-section">
      <h3>🤖 LLM 供應商設定</h3>
      <p className="desc">
        選擇您偏好的 LLM 供應商與模型。Ollama 為預設的本地模型，可離線使用。
      </p>

      <div className="settings-card">
        <div className="settings-form">
          {/* Provider */}
          <div className="form-group">
            <label htmlFor="llm-provider">供應商</label>
            <select
              id="llm-provider"
              value={provider}
              onChange={(e) => {
                setProvider(e.target.value);
                const info = PROVIDERS[e.target.value];
                if (info?.defaultUrl) setBaseUrl(info.defaultUrl);
              }}
            >
              {Object.entries(PROVIDERS).map(([key, { label }]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          {/* Model Name */}
          <div className="form-group">
            <label htmlFor="llm-model">模型名稱</label>
            <input
              id="llm-model"
              type="text"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              placeholder="例如：gemma4:31b-cloud、gpt-4、gemini-pro"
            />
          </div>

          {/* API Key */}
          {providerInfo.needsKey && (
            <div className="form-group">
              <label htmlFor="llm-key">API Key</label>
              <div className="password-wrapper">
                <input
                  id="llm-key"
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="輸入 API Key"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <span className="form-hint">API Key 將加密儲存於本地資料庫</span>
            </div>
          )}

          {/* Base URL */}
          {providerInfo.needsUrl && (
            <div className="form-group">
              <label htmlFor="llm-url">API Base URL</label>
              <input
                id="llm-url"
                type="url"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="例如：http://localhost:11434"
              />
            </div>
          )}

          {/* Actions */}
          <div className="settings-form-actions">
            <button
              className="primary-btn"
              onClick={handleSave}
              disabled={isLoading || !modelName.trim()}
            >
              <Save size={14} style={{ marginRight: 6 }} />
              {isLoading ? '儲存中...' : '儲存設定'}
            </button>
          </div>

          {saved && (
            <div className="settings-success">
              <CheckCircle size={14} />
              設定已儲存成功
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LLMSettings;
