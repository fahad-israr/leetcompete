const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '');

function getClientMachineId() {
  let id = localStorage.getItem('leetcompete_client_id');
  if (!id) {
    id = `m_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('leetcompete_client_id', id);
  }
  return id;
}

function getAuthHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  
  const token = localStorage.getItem('leetcompete_auth_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const userJson = localStorage.getItem('leetcompete_user');
  if (userJson) {
    try {
      const user = JSON.parse(userJson);
      if (user.username) {
        headers['x-username'] = user.username;
      }
    } catch (e) {}
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
  // === AUTHENTICATION & EMAIL VERIFICATION ===
  async register(arg1, arg2, arg3, arg4) {
    let payload = {};
    if (typeof arg1 === 'object' && arg1 !== null) {
      payload = { ...arg1 };
    } else {
      payload = { username: arg1, email: arg2, password: arg3, displayName: arg4 };
    }
    const clientMachineId = getClientMachineId();
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, clientMachineId })
    });
    const data = await handleResponse(res);
    if (data.token && data.user) {
      localStorage.setItem('leetcompete_auth_token', data.token);
      localStorage.setItem('leetcompete_user', JSON.stringify(data.user));
      localStorage.setItem('leetcompete_username', data.user.username);
    }
    return data;
  },

  async verifyEmail(username, code) {
    const res = await fetch(`${API_BASE}/api/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, code })
    });
    const data = await handleResponse(res);
    if (data.token && data.user) {
      localStorage.setItem('leetcompete_auth_token', data.token);
      localStorage.setItem('leetcompete_user', JSON.stringify(data.user));
      localStorage.setItem('leetcompete_username', data.user.username);
    }
    return data;
  },

  async resendCode(username) {
    const clientMachineId = getClientMachineId();
    const res = await fetch(`${API_BASE}/api/auth/resend-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, clientMachineId })
    });
    return await handleResponse(res);
  },

  async forgotPassword(usernameOrEmail) {
    const clientMachineId = getClientMachineId();
    const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usernameOrEmail, clientMachineId })
    });
    return await handleResponse(res);
  },

  async resetPassword(username, code, newPassword) {
    const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, code, newPassword })
    });
    return await handleResponse(res);
  },

  async login(identifier, password) {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: identifier, email: identifier, identifier, password })
    });
    const data = await handleResponse(res);
    if (data.token && data.user) {
      localStorage.setItem('leetcompete_auth_token', data.token);
      localStorage.setItem('leetcompete_user', JSON.stringify(data.user));
      localStorage.setItem('leetcompete_username', data.user.username);
    }
    return data;
  },

  async getMe() {
    const token = localStorage.getItem('leetcompete_auth_token');
    if (!token) return null;
    try {
      const res = await fetch(`${API_BASE}/api/auth/me`, { headers: getAuthHeaders() });
      const data = await handleResponse(res);
      return data.user;
    } catch (e) {
      this.logout();
      return null;
    }
  },

  logout() {
    localStorage.removeItem('leetcompete_auth_token');
    localStorage.removeItem('leetcompete_user');
  },

  getCurrentUser() {
    try {
      const raw = localStorage.getItem('leetcompete_user');
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  },

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

  async archiveSeason(id) {
    const res = await fetch(`${API_BASE}/api/seasons/${id}/archive`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return await handleResponse(res);
  },

  async unarchiveSeason(id) {
    const res = await fetch(`${API_BASE}/api/seasons/${id}/unarchive`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return await handleResponse(res);
  },

  async addProblemsToSeason(id, { problems, input }) {
    const res = await fetch(`${API_BASE}/api/seasons/${id}/add-problems`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ problems, input })
    });
    return await handleResponse(res);
  },

  async importProblemList(listUrlOrInput) {
    const res = await fetch(`${API_BASE}/api/problems/import-list`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ input: listUrlOrInput })
    });
    return await handleResponse(res);
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

  async extendContest(id, minutes) {
    const res = await fetch(`${API_BASE}/api/contests/${id}/extend`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ minutes })
    });
    return await handleResponse(res);
  },

  async getAdminAnalytics() {
    const res = await fetch(`${API_BASE}/api/admin/analytics`, {
      headers: getAuthHeaders()
    });
    return await handleResponse(res);
  },

  async adminVerifyUser(username) {
    const res = await fetch(`${API_BASE}/api/admin/users/${encodeURIComponent(username)}/verify`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return await handleResponse(res);
  },

  async adminDeleteUser(username) {
    const res = await fetch(`${API_BASE}/api/admin/users/${encodeURIComponent(username)}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return await handleResponse(res);
  },

  async adminDeleteSeason(seasonId) {
    const res = await fetch(`${API_BASE}/api/admin/seasons/${encodeURIComponent(seasonId)}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return await handleResponse(res);
  },

  async adminDeleteContest(contestId) {
    const res = await fetch(`${API_BASE}/api/admin/contests/${encodeURIComponent(contestId)}`, {
      method: 'DELETE',
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
