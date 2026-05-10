import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { MessageCircleQuestion } from 'lucide-react';
import './Chat.css';

/**
 * Agent 角色對照表
 */
const AGENT_MAP = {
  BA: { label: '商業分析師', icon: '🔍', role: 'Business Analyst' },
  PM: { label: '產品經理', icon: '📋', role: 'Product Manager' },
  Architect: { label: '架構師', icon: '🏗️', role: 'Architect' },
  Writer: { label: '技術寫手', icon: '📝', role: 'Tech Writer' },
};

/**
 * MessageBubble — 單一訊息氣泡元件
 * @param {{ message: { id, role, agent, content, type, timestamp } }} props
 */
const MessageBubble = ({ message }) => {
  const { role, agent, content, type, timestamp } = message;

  // ── System Message ──────────────────────────────────────────────
  if (role === 'system') {
    return (
      <div className={`system-message ${type}`}>
        {type === 'success' && '✅'}
        {type === 'error' && '❌'}
        {type === 'warning' && '⚠️'}
        {type === 'info' && 'ℹ️'}
        <span>{content}</span>
      </div>
    );
  }

  const isAgent = role === 'agent';
  const agentInfo = AGENT_MAP[agent] || AGENT_MAP.BA;
  const timeStr = timestamp
    ? new Date(timestamp).toLocaleTimeString('zh-TW', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <div className={`message-row ${role}`}>
      {/* Avatar */}
      {isAgent && (
        <div className={`message-avatar ${agent}`}>
          {agentInfo.icon}
        </div>
      )}

      {/* Bubble */}
      <div className="message-bubble">
        {/* Agent Label */}
        {isAgent && (
          <div className={`message-agent-label ${agent}`}>
            {agentInfo.label}
            <span className="message-agent-role">{agentInfo.role}</span>
          </div>
        )}

        {/* Content */}
        <div className="message-content">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ node, inline, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '');
                return !inline && match ? (
                  <SyntaxHighlighter
                    style={oneDark}
                    language={match[1]}
                    PreTag="div"
                    customStyle={{
                      borderRadius: '10px',
                      fontSize: '0.85rem',
                      margin: '0.5em 0',
                    }}
                    {...props}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                ) : (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              },
            }}
          >
            {content}
          </ReactMarkdown>
        </div>

        {/* Question badge */}
        {type === 'question' && isAgent && (
          <div className="question-badge">
            <MessageCircleQuestion size={12} />
            等待您的回覆
          </div>
        )}

        {/* Timestamp */}
        {timeStr && <div className="message-time">{timeStr}</div>}
      </div>
    </div>
  );
};

export default MessageBubble;
