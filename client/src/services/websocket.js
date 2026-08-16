/**
 * Real-time WebSocket Service for Live Contest Lobby
 */
class WebSocketService {
  constructor() {
    this.ws = null;
    this.listeners = new Map();
    this.contestId = null;
    this.username = null;
    this.reconnectTimer = null;
  }

  connect(contestId, username) {
    this.contestId = contestId;
    this.username = username;

    if (this.ws) {
      try {
        this.ws.close();
      } catch (e) {}
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws`;

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      // Join contest room
      this.send('JOIN_ROOM', { contestId, username });
      this.emit('connection_status', { connected: true });
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.emit(data.type, data.payload || data);
      } catch (err) {
        console.error('Error parsing WS message:', err);
      }
    };

    this.ws.onclose = () => {
      this.emit('connection_status', { connected: false });
      // Attempt reconnect after 3 seconds if still viewing the contest
      clearTimeout(this.reconnectTimer);
      if (this.contestId) {
        this.reconnectTimer = setTimeout(() => {
          this.connect(this.contestId, this.username);
        }, 3000);
      }
    };

    this.ws.onerror = (err) => {
      console.warn('WS error:', err);
    };
  }

  disconnect() {
    this.contestId = null;
    clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  send(type, payload) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }));
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(cb => {
        try {
          cb(data);
        } catch (e) {
          console.error(`Error in WS listener for ${event}:`, e);
        }
      });
    }
  }
}

export const wsService = new WebSocketService();
