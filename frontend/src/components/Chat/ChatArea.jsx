import { useEffect, useState, useRef } from 'react';
import useProjectStore from '../../stores/projectStore';
import useAuthStore from '../../stores/authStore';
import SSEClient from '../../services/sseClient';
import '../Layout/Layout.css'; 

const ChatArea = () => {
  const { currentProject } = useProjectStore();
  const { token } = useAuthStore();
  const [connectionStatus, setConnectionStatus] = useState('斷線');
  const sseClientRef = useRef(null);

  // 監聽專案切換，重新建立 SSE 連線
  useEffect(() => {
    if (!currentProject || !token) return;

    setConnectionStatus('連線中...');
    
    const sse = new SSEClient(
      `/api/projects/${currentProject.id}/stream`,
      (msg) => {
        if (msg.type === 'connected') {
          setConnectionStatus('🟢 準備就緒');
        } else if (msg.type === 'heartbeat') {
          // 可以在這裡處理心跳包更新最後連線時間
        }
      },
      (err) => {
        setConnectionStatus('🔴 連線中斷');
      }
    );

    sse.connect(token);
    sseClientRef.current = sse;

    return () => {
      sse.disconnect();
    };
  }, [currentProject?.id, token]);

  if (!currentProject) {
    return (
      <div className="chat-container">
        <div className="empty-state">
          <div className="empty-state-icon">✨</div>
          <h2>歡迎來到 SpecForge AI</h2>
          <p>請從左側選擇或建立一個專案開始</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h3>{currentProject.name}</h3>
        <span className="status-indicator">
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {connectionStatus}
          </span>
        </span>
      </div>

      <div className="chat-messages">
        {/* 這裡未來會渲染對話內容與 Markdown */}
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '2rem' }}>
          這是一個新的專案，向 BA Agent 描述您的商業點子吧！
        </div>
      </div>

      <div className="chat-input-area">
        <div className="chat-input-wrapper">
          <textarea 
            className="chat-input"
            placeholder="告訴我您想做什麼產品..."
            rows={1}
          />
          <button className="send-btn" title="發送">
            ➤
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatArea;
