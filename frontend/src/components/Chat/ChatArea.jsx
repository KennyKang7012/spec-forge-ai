import { useCallback, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import useSSE from '../../hooks/useSSE';
import useProjectStore from '../../stores/projectStore';
import useChatStore from '../../stores/chatStore';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import PhaseProgress from './PhaseProgress';
import { Wifi, WifiOff, RefreshCw, FileText } from 'lucide-react';
import './Chat.css';

/**
 * ChatArea — 對話區容器元件
 * 管理 SSE 連線、工作流程啟動、使用者回覆等核心邏輯
 */
const ChatArea = ({ onToggleFiles }) => {
  const { currentProject } = useProjectStore();
  const api = useApi();

  const uiState = useChatStore((s) => s.uiState);
  const currentPhase = useChatStore((s) => s.currentPhase);
  const isWorkflowStarted = useChatStore((s) => s.isWorkflowStarted);
  const addUserMessage = useChatStore((s) => s.addUserMessage);
  const addSystemMessage = useChatStore((s) => s.addSystemMessage);
  const setMessages = useChatStore((s) => s.setMessages);
  const setUIState = useChatStore((s) => s.setUIState);
  const setWorkflowStarted = useChatStore((s) => s.setWorkflowStarted);
  const setCurrentAgent = useChatStore((s) => s.setCurrentAgent);
  const setCurrentPhase = useChatStore((s) => s.setCurrentPhase);
  const clearMessages = useChatStore((s) => s.clearMessages);
  const setFiles = useChatStore((s) => s.setFiles);

  // ── 抓取專案檔案清單 ────────────────────────────────────────────
  const fetchFiles = useCallback(async () => {
    const projectId = currentProject?.id;
    if (!projectId) return;

    try {
      const files = await api.get(`/api/projects/${projectId}/files`);
      setFiles(files);
    } catch (err) {
      console.error('[ChatArea] 無法抓取檔案清單:', err);
    }
  }, [currentProject?.id, api, setFiles]);

  // SSE 事件回調
  const handleSSEEvent = useCallback((msg) => {
    // 當階段完成時，自動刷新檔案清單
    if (msg.type === 'phase_complete' || msg.type === 'connected') {
      fetchFiles();
    }
  }, [fetchFiles]);

  // SSE 連線
  const { connectionStatus, reconnect } = useSSE(currentProject?.id || null, handleSSEEvent);

  // 當切換專案時，載入歷史訊息
  useEffect(() => {
    const projectId = currentProject?.id;
    if (!projectId) return;

    const loadHistory = async () => {
      try {
        console.log(`[ChatArea] 正在載入專案 #${projectId} 的歷史紀錄...`);
        clearMessages(); // 先清空舊專案訊息
        const history = await api.get(`/api/projects/${projectId}/messages`);
        
        if (history && history.length > 0) {
          setMessages(history);
          
          const lastMsg = history[history.length - 1];
          // 如果最後一條是 Agent 的提問，解鎖輸入框讓使用者回答
          if (lastMsg.role === 'agent' && lastMsg.msg_type === 'question') {
            setWorkflowStarted(true); 
          } else {
            // 如果最後一條不是提問，且已經過了很久（例如載入歷史時），允許使用者重新啟動或對話
            setWorkflowStarted(false);
          }
          
          if (lastMsg.agent === 'PM') setCurrentPhase(2);
          else if (lastMsg.agent === 'Architect') setCurrentPhase(3);
          else if (lastMsg.agent === 'Writer') setCurrentPhase(4);
        }
      } catch (err) {
        console.error('無法載入歷史訊息:', err);
      }
    };

    loadHistory();
    fetchFiles(); // 同時載入現有檔案
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProject?.id]); // 只在專案 ID 改變時執行一次

  // ── 啟動 Workflow ──────────────────────────────────────────────
  const handleStartWorkflow = useCallback(async () => {
    if (!currentProject) return;

    try {
      setWorkflowStarted(true);
      setUIState('AGENT_THINKING');
      setCurrentAgent('BA');
      addSystemMessage('正在啟動 Agent 工作流程...', 'info');

      await api.post(`/api/projects/${currentProject.id}/start`);
    } catch (err) {
      addSystemMessage(`啟動失敗：${err.message}`, 'error');
      setUIState('ERROR');
    }
  }, [currentProject, api, setWorkflowStarted, setUIState, setCurrentAgent, addSystemMessage]);

  // ── 發送回覆 ──────────────────────────────────────────────────
  const handleSend = useCallback(
    async (text) => {
      if (!currentProject) return;

      // 若工作流程尚未啟動，先啟動再送出第一條訊息
      if (!isWorkflowStarted) {
        addUserMessage(text);
        setWorkflowStarted(true);
        setUIState('AGENT_THINKING');
        setCurrentAgent('BA');
        addSystemMessage('正在啟動 Agent 工作流程...', 'info');

        try {
          await api.post(`/api/projects/${currentProject.id}/start`);
        } catch (err) {
          addSystemMessage(`啟動失敗：${err.message}`, 'error');
          setUIState('ERROR');
        }
        return;
      }

      // 工作流程已啟動：送出回覆
      addUserMessage(text);
      setUIState('AGENT_THINKING');

      try {
        await api.post(`/api/projects/${currentProject.id}/reply`, { text });
      } catch (err) {
        addSystemMessage(`回覆發送失敗：${err.message}`, 'error');
        setUIState('ERROR');
      }
    },
    [currentProject, isWorkflowStarted, api, addUserMessage, setUIState, setCurrentAgent, setWorkflowStarted, addSystemMessage]
  );

  // ── 無專案選擇的空狀態 ──────────────────────────────────────
  if (!currentProject) {
    return (
      <div className="chat-container">
        <div className="empty-state">
          <div className="empty-state-icon">✨</div>
          <h2>歡迎來到 SpecForge AI</h2>
          <p>請從左側選擇或建立一個專案，開始鍛造您的規格文件。</p>
        </div>
      </div>
    );
  }

  // ── Connection Badge ──────────────────────────────────────────
  const connectionBadge = (
    <div className={`connection-badge ${connectionStatus}`}>
      <span className="connection-dot" />
      {connectionStatus === 'connected' && '已連線'}
      {connectionStatus === 'connecting' && '連線中...'}
      {connectionStatus === 'disconnected' && '未連線'}
      {connectionStatus === 'error' && '連線中斷'}
    </div>
  );

  return (
    <div className="chat-container">
      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-left">
          <h3>{currentProject.name}</h3>
          {connectionBadge}
        </div>
        <div className="chat-header-right">
          {connectionStatus === 'error' && (
            <button className="icon-btn" onClick={reconnect} title="重新連線">
              <RefreshCw size={16} />
            </button>
          )}
          {onToggleFiles && (
            <button className="icon-btn" onClick={onToggleFiles} title="檔案面板">
              <FileText size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Phase Progress */}
      {isWorkflowStarted && <PhaseProgress currentPhase={currentPhase} />}

      {/* Messages */}
      <MessageList onStartWorkflow={handleStartWorkflow} />

      {/* Input */}
      <ChatInput onSend={handleSend} />
    </div>
  );
};

export default ChatArea;
