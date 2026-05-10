import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bot, Zap } from 'lucide-react';
import LLMSettings from '../components/Settings/LLMSettings';
import SkillSettings from '../components/Settings/SkillSettings';
import '../components/Settings/Settings.css';

/**
 * SettingsPage — 設定頁面容器（Tab 切換）
 */
const SettingsPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('llm');

  return (
    <div className="settings-page">
      {/* Header */}
      <div className="settings-header">
        <button
          className="ghost-btn settings-back-btn"
          onClick={() => navigate('/dashboard')}
        >
          <ArrowLeft size={16} />
          返回
        </button>
        <h2>設定</h2>
      </div>

      {/* Tabs */}
      <div className="settings-tabs">
        <button
          className={`settings-tab ${activeTab === 'llm' ? 'active' : ''}`}
          onClick={() => setActiveTab('llm')}
        >
          <Bot size={16} />
          LLM 供應商
        </button>
        <button
          className={`settings-tab ${activeTab === 'skills' ? 'active' : ''}`}
          onClick={() => setActiveTab('skills')}
        >
          <Zap size={16} />
          SKILL 對答
        </button>
      </div>

      {/* Content */}
      <div className="settings-content">
        {activeTab === 'llm' && <LLMSettings />}
        {activeTab === 'skills' && <SkillSettings />}
      </div>
    </div>
  );
};

export default SettingsPage;
