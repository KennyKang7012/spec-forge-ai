/**
 * SpecForge AI — SSE Client Service
 * 管理 EventSource 連線，支援所有自訂事件類型與指數退避重連
 */
class SSEClient {
  constructor(endpoint, onMessage, onError) {
    this.endpoint = endpoint;
    this.onMessage = onMessage;
    this.onError = onError;
    this.eventSource = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 8;
    this._token = null;
  }

  connect(token) {
    if (this.eventSource) {
      this.disconnect();
    }

    this._token = token;

    // EventSource 不支援自訂 headers，透過 query string 傳遞 token
    const url = `${this.endpoint}?token=${token}`;
    this.eventSource = new EventSource(url);

    this.eventSource.onopen = () => {
      console.log('[SSE] Connection opened:', this.endpoint);
      this.reconnectAttempts = 0;
    };

    // 通用 message 處理（fallback）
    this.eventSource.onmessage = (event) => {
      this._dispatch(event.type || 'message', event.data);
    };

    // 監聽所有後端自訂事件
    const eventTypes = [
      'connected',
      'heartbeat',
      'agent_question',
      'agent_message',
      'doc_stream',
      'phase_complete',
      'error',
    ];

    eventTypes.forEach((eventType) => {
      this.eventSource.addEventListener(eventType, (event) => {
        this._dispatch(eventType, event.data);
      });
    });

    this.eventSource.onerror = (error) => {
      console.error('[SSE] Connection error:', error);
      if (this.onError) this.onError(error);

      this.eventSource.close();

      // 指數退避重連（含 jitter）
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        const baseDelay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
        const jitter = Math.random() * 1000;
        const delay = baseDelay + jitter;

        console.log(
          `[SSE] Reconnecting in ${Math.round(delay)}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
        );

        setTimeout(() => {
          this.connect(this._token);
        }, delay);
      } else {
        console.error('[SSE] Max reconnect attempts reached.');
      }
    };
  }

  /** 解析並分派事件 */
  _dispatch(type, rawData) {
    try {
      const data = JSON.parse(rawData);
      if (this.onMessage) {
        this.onMessage({ type, data });
      }
    } catch (err) {
      // 非 JSON 資料（如純文字心跳）
      if (this.onMessage) {
        this.onMessage({ type, data: { content: rawData } });
      }
    }
  }

  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }
}

export default SSEClient;
