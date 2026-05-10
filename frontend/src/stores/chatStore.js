import { create } from 'zustand';

/**
 * SpecForge AI — Chat State Store
 * 管理對話訊息、UI 狀態、當前 Agent 與階段進度
 */
const useChatStore = create((set, get) => ({
  // ── State ──────────────────────────────────────────────────────
  messages: [],
  uiState: 'IDLE', // IDLE | AGENT_THINKING | WAITING_USER_INPUT | STREAMING_DOC | ERROR
  currentAgent: null, // 'BA' | 'PM' | 'Architect' | 'Writer'
  currentPhase: 1, // 1-5
  isWorkflowStarted: false,
  connectionStatus: 'disconnected', // connected | disconnected | connecting | error
  error: null,

  // ── Actions ────────────────────────────────────────────────────

  addMessage: (message) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id: message.id || `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          timestamp: message.timestamp || new Date().toISOString(),
          ...message,
        },
      ],
    })),

  setMessages: (messages) =>
    set({
      messages: messages.map((m) => ({
        id: m.id || `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        ...m,
      })),
    }),

  /**
   * 新增 Agent 訊息
   * @param {'BA'|'PM'|'Architect'|'Writer'} agent
   * @param {string} content
   * @param {'message'|'question'} type
   */
  addAgentMessage: (agent, content, type = 'message') =>
    get().addMessage({
      role: 'agent',
      agent,
      content,
      type,
    }),

  /**
   * 新增使用者訊息
   * @param {string} content
   */
  addUserMessage: (content) =>
    get().addMessage({
      role: 'user',
      agent: null,
      content,
      type: 'reply',
    }),

  /**
   * 新增系統訊息（階段完成、錯誤通知等）
   * @param {string} content
   * @param {'info'|'success'|'warning'|'error'} level
   */
  addSystemMessage: (content, level = 'info') =>
    get().addMessage({
      role: 'system',
      agent: null,
      content,
      type: level,
    }),

  setUIState: (uiState) => set({ uiState }),

  setCurrentAgent: (agent) => set({ currentAgent: agent }),

  setCurrentPhase: (phase) => set({ currentPhase: phase }),

  advancePhase: () =>
    set((state) => ({
      currentPhase: Math.min(state.currentPhase + 1, 5),
    })),

  setWorkflowStarted: (started) => set({ isWorkflowStarted: started }),

  setConnectionStatus: (status) => set({ connectionStatus: status }),

  setError: (error) => set({ error, uiState: error ? 'ERROR' : 'IDLE' }),

  clearMessages: () =>
    set({
      messages: [],
      uiState: 'IDLE',
      currentAgent: null,
      currentPhase: 1,
      isWorkflowStarted: false,
      error: null,
    }),

  // ── Computed helpers ───────────────────────────────────────────

  /** 是否允許使用者輸入 */
  canUserInput: () => {
    const { uiState, isWorkflowStarted } = get();
    return uiState === 'WAITING_USER_INPUT' || !isWorkflowStarted;
  },
}));

export default useChatStore;
