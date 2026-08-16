const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '');

function getAuthHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  
  const adminPasscode = sessionStorage.getItem('leetcompete_admin_passcode') || localStorage.getItem('leetcompete_admin_passcode');
  if (adminPasscode) {
    headers['x-admin-passcode'] = adminPasscode;
  }

  const gToken = sessionStorage.getItem('leetcompete_gtoken');
  if (gToken) {
    headers['Authorization'] = `Bearer ${gToken}`;
  }

  return headers;
}

async function handleResponse(res) {
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return data;
}

export const api = {
  // === SEASONS ===
  async getSeasons() {
    const res = await fetch(`${API_BASE}/api/seasons`, { headers: getAuthHeaders() });
    const data = await handleResponse(res);
    return data.seasons || [];
  },

  async getSeason(id) {
    const res = await fetch(`${API_BASE}/api/seasons/${id}`, { headers: getAuthHeaders() });
    return await handleResponse(res);
  },

  async createSeason({ title, description, pool }) {
    const res = await fetch(`${API_BASE}/api/seasons`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ title, description, pool })
    });
    const data = await handleResponse(res);
    return data.season;
  },

  async generateSeasonRound(seasonId, params) {
    const res = await fetch(`${API_BASE}/api/seasons/${seasonId}/generate-round`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(params)
    });
    return await handleResponse(res);
  },

  // === CONTESTS ===
  async getContests() {
    const res = await fetch(`${API_BASE}/api/contests`, { headers: getAuthHeaders() });
    const data = await handleResponse(res);
    return data.contests || [];
  },

  async getContest(codeOrId) {
    const res = await fetch(`${API_BASE}/api/contests/${codeOrId}`, { headers: getAuthHeaders() });
    const data = await handleResponse(res);
    return data.contest;
  },

  async createContest(contestData) {
    const res = await fetch(`${API_BASE}/api/contests`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(contestData)
    });
    const data = await handleResponse(res);
    return data.contest;
  },

  async joinContest(id, username, displayName, password) {
    const res = await fetch(`${API_BASE}/api/contests/${id}/join`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ username, displayName, password })
    });
    return await handleResponse(res);
  },

  async startContest(id) {
    const res = await fetch(`${API_BASE}/api/contests/${id}/start`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return await handleResponse(res);
  },

  async finishContest(id) {
    const res = await fetch(`${API_BASE}/api/contests/${id}/finish`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return await handleResponse(res);
  },

  async verifySubmission(id, username, problemSlug) {
    const res = await fetch(`${API_BASE}/api/contests/${id}/verify`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ username, problemSlug })
    });
    return await res.json();
  },

  // === MESSAGES ===
  async getMessages(id) {
    const res = await fetch(`${API_BASE}/api/contests/${id}/messages`, { headers: getAuthHeaders() });
    const data = await handleResponse(res);
    return data.messages || [];
  },

  async sendMessage(id, username, text) {
    const res = await fetch(`${API_BASE}/api/contests/${id}/messages`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ username, text })
    });
    const data = await handleResponse(res);
    return data.message;
  },

  // === PROBLEMS ===
  async searchProblems({ query, difficulty, topic, limit }) {
    const params = new URLSearchParams();
    if (query) params.append('query', query);
    if (difficulty) params.append('difficulty', difficulty);
    if (topic) params.append('topic', topic);
    if (limit) params.append('limit', limit);

    const res = await fetch(`${API_BASE}/api/problems/search?${params.toString()}`, { headers: getAuthHeaders() });
    const data = await handleResponse(res);
    return data.problems || [];
  },

  async resolveProblem(input) {
    const res = await fetch(`${API_BASE}/api/problems/resolve`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ input })
    });
    const data = await handleResponse(res);
    return data.problem;
  }
};
