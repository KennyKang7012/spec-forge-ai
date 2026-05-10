import './Chat.css';

/**
 * Agent 角色色彩對照
 */
const AGENT_STYLES = {
  BA:        { bg: 'var(--agent-ba-bg)',        color: 'var(--agent-ba)',        icon: '🔍', name: 'BA Agent' },
  PM:        { bg: 'var(--agent-pm-bg)',        color: 'var(--agent-pm)',        icon: '📋', name: 'PM Agent' },
  Architect: { bg: 'var(--agent-architect-bg)', color: 'var(--agent-architect)', icon: '🏗️', name: 'Architect Agent' },
  Writer:    { bg: 'var(--agent-writer-bg)',    color: 'var(--agent-writer)',    icon: '📝', name: 'Writer Agent' },
};

/**
 * TypingIndicator — Agent 思考中指示器
 * @param {{ agent: string|null }} props
 */
const TypingIndicator = ({ agent }) => {
  const info = AGENT_STYLES[agent] || AGENT_STYLES.BA;

  return (
    <div className="typing-indicator">
      <div
        className="typing-avatar"
        style={{ background: info.bg, color: info.color }}
      >
        {info.icon}
      </div>
      <div className="typing-bubble">
        <div className="typing-dots">
          <span className="typing-dot" />
          <span className="typing-dot" />
          <span className="typing-dot" />
        </div>
        <span className="typing-agent-name">{info.name} 思考中...</span>
      </div>
    </div>
  );
};

export default TypingIndicator;
