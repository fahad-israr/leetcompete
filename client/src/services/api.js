const API_BASE = '/api';

async function handleResponse(res) {
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return data;
}

export const api = {
  // Seasons
  async getSeasons() {
    const res = await fetch(`${API_BASE}/seasons`);
    const data = await handleResponse(res);
    return data.seasons;
  },

  async getSeason(id) {
    const res = await fetch(`${API_BASE}/seasons/${id}`);
    return await handleResponse(res);
  },

  async createSeason({ title, description }) {
    const res = await fetch(`${API_BASE}/seasons`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description })
    });
    const data = await handleResponse(res);
    return data.season;
  },

  async deleteSeason(id) {
    const res = await fetch(`${API_BASE}/seasons/${id}`, { method: 'DELETE' });
    return await handleResponse(res);
  },

  // Contests
  async getContests() {
    const res = await fetch(`${API_BASE}/contests`);
    const data = await handleResponse(res);
    return data.contests;
  },

  async getContest(codeOrId) {
    const res = await fetch(`${API_BASE}/contests/${codeOrId}`);
    const data = await handleResponse(res);
    return data.contest;
  },

  async createContest(contestData) {
    const res = await fetch(`${API_BASE}/contests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(contestData)
    });
    const data = await handleResponse(res);
    return data.contest;
  },

  async startContest(id) {
    const res = await fetch(`${API_BASE}/contests/${id}/start`, { method: 'POST' });
    const data = await handleResponse(res);
    return data.contest;
  },

  async finishContest(id) {
    const res = await fetch(`${API_BASE}/contests/${id}/finish`, { method: 'POST' });
    const data = await handleResponse(res);
    return data.contest;
  },

  async joinContest(id, username, displayName) {
    const res = await fetch(`${API_BASE}/contests/${id}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, displayName })
    });
    return await handleResponse(res);
  },

  async verifySubmission(id, username, problemSlug) {
    const res = await fetch(`${API_BASE}/contests/${id}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, problemSlug })
    });
    return await res.json();
  },

  async getMessages(id) {
    const res = await fetch(`${API_BASE}/contests/${id}/messages`);
    const data = await handleResponse(res);
    return data.messages;
  },

  async sendMessage(id, username, text) {
    const res = await fetch(`${API_BASE}/contests/${id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, text })
    });
    const data = await handleResponse(res);
    return data.message;
  },

  // Problems
  async searchProblems({ query, difficulty, topic, seasonId, limit }) {
    const params = new URLSearchParams();
    if (query) params.append('query', query);
    if (difficulty) params.append('difficulty', difficulty);
    if (topic) params.append('topic', topic);
    if (seasonId) params.append('seasonId', seasonId);
    if (limit) params.append('limit', limit);

    const res = await fetch(`${API_BASE}/problems/search?${params.toString()}`);
    const data = await handleResponse(res);
    return data.problems;
  },

  async resolveProblem(input, seasonId) {
    const res = await fetch(`${API_BASE}/problems/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input, seasonId })
    });
    const data = await handleResponse(res);
    return data.problem;
  },

  async generateRandomProblems({ countEasy, countMedium, countHard, topic, seasonId }) {
    const res = await fetch(`${API_BASE}/problems/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ countEasy, countMedium, countHard, topic, seasonId })
    });
    return await handleResponse(res);
  }
};
