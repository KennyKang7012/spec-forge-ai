import { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { ChevronDown, ChevronRight, Zap } from 'lucide-react';
import './Settings.css';

/**
 * SKILL 名稱對照
 */
const SKILL_LABELS = {
  'SKILL-01_intent_discovery': { icon: '🔍', label: 'SKILL-01：意圖挖掘', agent: 'BA Agent' },
  'SKILL-02_requirement_proposal': { icon: '📋', label: 'SKILL-02：需求提案', agent: 'PM Agent' },
  'SKILL-03_technical_design': { icon: '🏗️', label: 'SKILL-03：技術架構', agent: 'Architect Agent' },
  'SKILL-04_spec_writing': { icon: '📝', label: 'SKILL-04：規格撰寫', agent: 'Writer Agent' },
};

/**
 * SkillSettings — SKILL 對答設定面板
 */
const SkillSettings = () => {
  const api = useApi();
  const [skills, setSkills] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.get('/api/settings/skills');
        setSkills(data);
      } catch (err) {
        console.error('Failed to load skill configs:', err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleExpand = (name) => {
    setExpanded(expanded === name ? null : name);
  };

  if (isLoading) {
    return (
      <div className="settings-section">
        <h3><Zap size={18} /> SKILL 對答設定</h3>
        <p className="desc">載入中...</p>
      </div>
    );
  }

  return (
    <div className="settings-section">
      <h3><Zap size={18} /> SKILL 對答設定</h3>
      <p className="desc">
        自訂各 Agent 階段的對答問題與最大提問輪次。修改後將影響新專案的 Agent 互動流程。
      </p>

      <div className="skill-list">
        {skills.map((skill) => {
          const info = SKILL_LABELS[skill.skill_name] || {
            icon: '⚙️',
            label: skill.skill_name,
            agent: '-',
          };
          const isOpen = expanded === skill.skill_name;
          const config = skill.config || {};
          const questions = config.default_questions || config.custom_questions || [];
          const maxRounds = config.max_rounds || 7;

          return (
            <div key={skill.skill_name} className="skill-card">
              <div
                className="skill-card-header"
                onClick={() => toggleExpand(skill.skill_name)}
              >
                <div className="skill-card-title">
                  <span>{info.icon}</span>
                  <span>{info.label}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                    {info.agent}
                  </span>
                </div>
                {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </div>

              {isOpen && (
                <div className="skill-card-body">
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    最大提問輪次：<strong style={{ color: 'var(--text-primary)' }}>{maxRounds}</strong>
                  </div>

                  {questions.length > 0 && (
                    <div className="skill-questions">
                      {questions.map((q, idx) => (
                        <div key={idx} className="skill-question-item">
                          <span className="skill-question-num">{idx + 1}.</span>
                          <span>{q}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {questions.length === 0 && (
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      使用 Agent 預設的提問邏輯
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {skills.length === 0 && (
          <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 'var(--space-xl)' }}>
            沒有可用的 SKILL 設定
          </div>
        )}
      </div>
    </div>
  );
};

export default SkillSettings;
