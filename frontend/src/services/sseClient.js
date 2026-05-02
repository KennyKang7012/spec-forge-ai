class SSEClient {
  constructor(endpoint, onMessage, onError) {
    this.endpoint = endpoint;
    this.onMessage = onMessage;
    this.onError = onError;
    this.eventSource = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  connect(token) {
    if (this.eventSource) {
      this.disconnect();
    }

    // EventSource 本身不支援自訂 headers (如 Authorization Bearer)
    // 實務上通常把 token 放在 URL query 中，或者透過 cookie 傳遞。
    // 在這裡我們先用 URL query 參數傳遞 token，請確認後端是否支援。
    // 如果後端尚未支援 query token，我們目前只先做基本的 EventSource 骨架。
    
    // 注意：因為我們有加 Vite proxy，路徑直接用相對路徑即可
    const url = `${this.endpoint}?token=${token}`;
    
    this.eventSource = new EventSource(url);

    this.eventSource.onopen = () => {
      console.log('SSE Connection Opened:', this.endpoint);
      this.reconnectAttempts = 0;
    };

    this.eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (this.onMessage) {
          this.onMessage({ type: event.type || 'message', data });
        }
      } catch (err) {
        console.error('Failed to parse SSE message:', err);
      }
    };

    // 監聽後端自訂的事件 (例如 connected, heartbeat)
    this.eventSource.addEventListener('connected', (event) => {
      const data = JSON.parse(event.data);
      if (this.onMessage) this.onMessage({ type: 'connected', data });
    });

    this.eventSource.addEventListener('heartbeat', (event) => {
      const data = JSON.parse(event.data);
      if (this.onMessage) this.onMessage({ type: 'heartbeat', data });
    });

    this.eventSource.onerror = (error) => {
      console.error('SSE Connection Error:', error);
      if (this.onError) this.onError(error);
      
      this.eventSource.close();
      
      // 簡單的斷線重連機制
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        setTimeout(() => {
          console.log(`Attempting to reconnect... (${this.reconnectAttempts})`);
          this.connect(token);
        }, 3000 * this.reconnectAttempts);
      }
    };
  }

  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }
}

export default SSEClient;
