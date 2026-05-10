import { useState, useRef, useCallback, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';
import useChatStore from '../../stores/chatStore';
import './Chat.css';

/**
 * ChatInput — 對話輸入區塊元件
 * @param {{ onSend: (text: string) => void, disabled?: boolean }} props
 */
const ChatInput = ({ onSend, disabled = false }) => {
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isComposing, setIsComposing] = useState(false); // 追蹤輸入法狀態
  const textareaRef = useRef(null);

  const uiState = useChatStore((s) => s.uiState);
  const isWorkflowStarted = useChatStore((s) => s.isWorkflowStarted);
  const isWaiting = uiState === 'WAITING_USER_INPUT';

  // 自動調整 textarea 高度
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 160) + 'px';
    }
  }, [text]);

  // 等待使用者輸入時聚焦
  useEffect(() => {
    if (isWaiting && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isWaiting]);

  const canSend =
    text.trim().length > 0 &&
    !isSending &&
    !disabled &&
    (isWaiting || !isWorkflowStarted);

  const handleSend = useCallback(async () => {
    if (!canSend) return;
    const trimmed = text.trim();
    setIsSending(true);
    setText('');

    try {
      await onSend(trimmed);
    } finally {
      setIsSending(false);
    }
  }, [canSend, text, onSend]);

  const handleKeyDown = (e) => {
    // 避免輸入法（IME）選字時按 Enter 提早送出
    if (isComposing || e.nativeEvent.isComposing) return;

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const placeholderText = isWaiting
    ? '輸入您的回覆...'
    : isWorkflowStarted
      ? 'Agent 處理中，請稍候...'
      : '告訴我您想做什麼產品...';

  const isDisabled =
    disabled || isSending || (isWorkflowStarted && !isWaiting);

  return (
    <div className="chat-input-area">
      {isWaiting && (
        <div className="chat-input-hint">
          💬 Agent 正在等待您的回覆
        </div>
      )}

      <div className={`chat-input-wrapper ${isWaiting ? 'waiting' : ''}`}>
        <textarea
          ref={textareaRef}
          className="chat-input"
          placeholder={placeholderText}
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
          disabled={isDisabled}
        />
        <button
          className="send-btn"
          onClick={handleSend}
          disabled={!canSend}
          title="發送 (Enter)"
        >
          {isSending ? (
            <Loader2 size={20} className="spin-icon" />
          ) : (
            <Send size={20} />
          )}
        </button>
      </div>

      <div className="chat-footer-info">
        Shift + Enter 換行 · Enter 發送
      </div>
    </div>
  );
};

export default ChatInput;
