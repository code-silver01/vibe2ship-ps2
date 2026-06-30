/**
 * CivicPulse — API Service
 * Wraps all backend REST API calls.
 */

// In development with Vite, we use the proxy set in vite.config.js
// In production, we assume the frontend is hosted alongside the backend or the API path is absolute.
const API_BASE = import.meta.env.VITE_API_URL || '/api';

class ApiService {
  constructor() {
    this.token = null;
    this.mockRole = null;
    this.mockUid = null;
  }

  setToken(token) {
    this.token = token;
  }

  // Used for mock mode when Firebase Auth isn't set up
  setMockIdentity(uid, role) {
    this.mockUid = uid;
    this.mockRole = role;
    if (uid && role) {
      localStorage.setItem('civicpulse_mock_uid', uid);
      localStorage.setItem('civicpulse_mock_role', role);
    } else {
      localStorage.removeItem('civicpulse_mock_uid');
      localStorage.removeItem('civicpulse_mock_role');
    }
  }

  loadMockIdentity() {
    this.mockUid = localStorage.getItem('civicpulse_mock_uid');
    this.mockRole = localStorage.getItem('civicpulse_mock_role');
    return { uid: this.mockUid, role: this.mockRole };
  }

  async _request(endpoint, options = {}) {
    const headers = {
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    // Pass mock headers if in mock mode
    if (this.mockUid && this.mockRole) {
      headers['x-mock-uid'] = this.mockUid;
      headers['x-mock-role'] = this.mockRole;
      if (!this.token) {
         // Send dummy token so middleware doesn't complain
         headers['Authorization'] = 'Bearer mock_token';
      }
    }

    if (options.body && !(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(options.body);
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    let data;
    try {
      data = await response.json();
    } catch (e) {
      data = null;
    }

    if (!response.ok) {
      const error = new Error(data?.error || `API Error: ${response.status} ${response.statusText}`);
      error.status = response.status;
      error.details = data?.details;
      throw error;
    }

    return data;
  }

  // ── Auth & Profile ──────────────────────────────────────────

  async register(profileData) {
    return this._request('/auth/register', {
      method: 'POST',
      body: profileData,
    });
  }

  async getProfile() {
    return this._request('/auth/profile');
  }

  async updateProfile(updates) {
    return this._request('/auth/profile', {
      method: 'PUT',
      body: updates,
    });
  }

  async getLeaderboard() {
    return this._request('/auth/leaderboard');
  }

  // ── Tickets ─────────────────────────────────────────────────

  async createTicket(formData) {
    return this._request('/tickets', {
      method: 'POST',
      body: formData, // FormData containing image/audio
    });
  }

  async getTickets(filters = {}) {
    const params = new URLSearchParams(filters);
    return this._request(`/tickets?${params.toString()}`);
  }

  async getTicket(id) {
    return this._request(`/tickets/${id}`);
  }

  async getTicketTraces(id) {
    return this._request(`/tickets/${id}/trace`);
  }

  async resolveTicket(id, formData) {
    return this._request(`/tickets/${id}/resolve`, {
      method: 'POST',
      body: formData, // FormData with afterImage
    });
  }

  async approveEscalation(id) {
    return this._request(`/tickets/${id}/approve-escalation`, {
      method: 'POST',
    });
  }

  // ── Community ───────────────────────────────────────────────

  async vote(ticketId, voteType) {
    return this._request('/votes', {
      method: 'POST',
      body: { ticket_id: ticketId, vote_type: voteType },
    });
  }

  async getVotes(ticketId) {
    return this._request(`/votes/${ticketId}`);
  }

  // ── Analytics & Admin ───────────────────────────────────────

  async getCitizenDashboard() {
    return this._request('/admin/citizen-dashboard');
  }

  async getOfficialDashboard(department = '') {
    return this._request(`/admin/dashboard?department=${department}`);
  }

  async getScorecard() {
    return this._request('/analytics/scorecard');
  }

  async getHeatmap() {
    return this._request('/analytics/heatmap');
  }
}

export default new ApiService();
