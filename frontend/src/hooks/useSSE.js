import { useEffect, useRef, useCallback } from 'react';
import SSEClient from '../services/sseClient';
import useChatStore from '../stores/chatStore';
import useAuthStore from '../stores/authStore';

/**
 * useSSE — 管理 SSE 連線生命週期並分派事件到 chatStore
 * @param {number|null} projectId
 * @param {Function} onEvent - 事件發生時的回調函式
 * @returns {{ connectionStatus: string, reconnect: () => void }}
 */
const useSSE = (projectId, onEvent) => {
  const { token } = useAuthStore();
  const {
    addAgentMessage,
    addSystemMessage,
    setUIState,
    setCurrentAgent,
    advancePhase,
    setConnectionStatus,
    setError,
  } = useChatStore();

  const connectionStatus = useChatStore((s) => s.connectionStatus);
  const sseRef = useRef(null);

  // ── SSE 事件處理器 ──────────────────────────────────────────────
  const handleSSEMessage = useCallback(
    (msg) => {
      const { type, data } = msg;

      switch (type) {
        case 'connected':
          setConnectionStatus('connected');
          break;

        case 'heartbeat':
          // 靜默處理，僅維持連線
          break;

        case 'agent_question':
          // Agent 提出問題，等待使用者回覆
          setCurrentAgent(data.agent || null);
          addAgentMessage(data.agent || 'BA', data.content, 'question');
          setUIState('WAITING_USER_INPUT');
          break;

        case 'agent_message':
          // Agent 一般訊息（中間產出、進度更新等）
          setCurrentAgent(data.agent || null);
          addAgentMessage(data.agent || 'BA', data.content, 'message');
          setUIState('AGENT_THINKING');
          break;

        case 'doc_stream':
          // 文件串流（即時 Markdown 渲染）
          setUIState('STREAMING_DOC');
          addAgentMessage(data.agent || 'Writer', data.content, 'message');
          break;

        case 'phase_complete':
          advancePhase();
          addSystemMessage(data.message || '階段已完成', 'success');
          setUIState('IDLE');
          break;

        case 'error':
          setError(data.message || 'Agent 執行時發生錯誤');
          addSystemMessage(data.message || '發生錯誤', 'error');
          break;

        default:
          console.warn('[SSE] 未知事件類型:', type, data);
      }

      if (onEvent) {
        onEvent(msg);
      }
    },
    [
      onEvent,
      addAgentMessage,
      addSystemMessage,
      setUIState,
      setCurrentAgent,
      advancePhase,
      setConnectionStatus,
      setError,
    ]
  );

  const handleSSEError = useCallback(
    () => {
      setConnectionStatus('error');
    },
    [setConnectionStatus]
  );

  // ── 連線管理 ────────────────────────────────────────────────────
  const connect = useCallback(() => {
    if (!projectId || !token) return;

    // 斷開舊連線
    if (sseRef.current) {
      sseRef.current.disconnect();
    }

    setConnectionStatus('connecting');

    const sse = new SSEClient(
      `/api/projects/${projectId}/stream`,
      handleSSEMessage,
      handleSSEError
    );

    sse.connect(token);
    sseRef.current = sse;
  }, [projectId, token, handleSSEMessage, handleSSEError, setConnectionStatus]);

  const reconnect = useCallback(() => {
    connect();
  }, [connect]);

  // ── 生命週期 ────────────────────────────────────────────────────
  useEffect(() => {
    connect();

    return () => {
      if (sseRef.current) {
        sseRef.current.disconnect();
        sseRef.current = null;
      }
      setConnectionStatus('disconnected');
    };
  }, [projectId, token]); // eslint-disable-line react-hooks/exhaustive-deps

  return { connectionStatus, reconnect };
};

export default useSSE;
