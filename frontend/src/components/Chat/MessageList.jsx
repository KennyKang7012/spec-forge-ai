import { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import useChatStore from '../../stores/chatStore';
import { Sparkles } from 'lucide-react';
import './Chat.css';

/**
 * MessageList — 訊息列表元件
 * 自動滾動至底部，渲染所有訊息與思考指示器
 * @param {{ onStartWorkflow: () => void }} props
 */
const MessageList = ({ onStartWorkflow }) => {
  const messages = useChatStore((s) => s.messages);
  const uiState = useChatStore((s) => s.uiState);
  const currentAgent = useChatStore((s) => s.currentAgent);
  const isWorkflowStarted = useChatStore((s) => s.isWorkflowStarted);

  const bottomRef = useRef(null);

  // 自動滾動到底部
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, uiState]);

  // ── Empty State ──────────────────────────────────────────────────
  if (!isWorkflowStarted && messages.length === 0) {
    return (
      <div className="chat-messages">
        <div className="empty-state">
          <div className="empty-state-icon">🔮</div>
          <h2>開始鍛造您的規格文件</h2>
          <p>
            點擊下方按鈕啟動 AI 工作流程，BA Agent 將引導您描述專案需求，
            透過深度對話挖掘真實的商業意圖。
          </p>
          <button
            className="primary-btn start-workflow-btn"
            onClick={onStartWorkflow}
          >
            <Sparkles size={18} />
            啟動 Agent 工作流程
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-messages">
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}

      {/* Agent 思考中 */}
      {uiState === 'AGENT_THINKING' && (
        <TypingIndicator agent={currentAgent} />
      )}

      {/* 滾動錨點 */}
      <div ref={bottomRef} />
    </div>
  );
};

export default MessageList;
