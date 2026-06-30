/**
 * CivicPulse — FirestoreService
 * Data access layer for all Firestore operations.
 */
import { db } from '../config/firebase.js';

class FirestoreService {
  // ── Tickets ──────────────────────────────────────────────────

  async createTicket(ticketData) {
    const ref = await db.collection('tickets').add({
      ...ticketData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    return { id: ref.id, ...ticketData };
  }

  async getTicket(ticketId) {
    const doc = await db.collection('tickets').doc(ticketId).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  }

  async updateTicket(ticketId, updates) {
    await db.collection('tickets').doc(ticketId).update({
      ...updates,
      updated_at: new Date().toISOString(),
    });
  }

  async getTicketsByStatus(status) {
    const snapshot = await db.collection('tickets').where('status', '==', status).get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  async getTicketsByDepartment(department) {
    const snapshot = await db.collection('tickets').where('department', '==', department).get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  async getOpenTickets() {
    const closedStatuses = ['closed', 'merged', 'verified'];
    const snapshot = await db.collection('tickets').get();
    return snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((t) => !closedStatuses.includes(t.status));
  }

  async getTicketsByReporter(reporterId) {
    const snapshot = await db.collection('tickets').where('reporter_id', '==', reporterId).get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  async getAllTickets(limit = 100) {
    const snapshot = await db.collection('tickets').limit(limit).get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  // ── Agent Traces ─────────────────────────────────────────────

  async writeTrace(traceData) {
    const ref = await db.collection('agent_trace').add({
      ...traceData,
      timestamp: new Date().toISOString(),
    });
    return { id: ref.id, ...traceData };
  }

  async getTracesByTicket(ticketId) {
    const snapshot = await db.collection('agent_trace')
      .where('ticket_id', '==', ticketId)
      .get();
    const traces = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return traces.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }

  // ── Users ────────────────────────────────────────────────────

  async createUser(userId, userData) {
    await db.collection('users').doc(userId).set({
      ...userData,
      trust_score: 50,
      civic_credits: 0,
      tickets_reported: 0,
      tickets_resolved: 0,
      created_at: new Date().toISOString(),
    });
  }

  async getUser(userId) {
    const doc = await db.collection('users').doc(userId).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  }

  async updateUser(userId, updates) {
    await db.collection('users').doc(userId).update(updates);
  }

  async getLeaderboard(limit = 20) {
    const snapshot = await db.collection('users').get();
    const users = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return users
      .sort((a, b) => (b.civic_credits || 0) - (a.civic_credits || 0))
      .slice(0, limit);
  }

  // ── Votes ────────────────────────────────────────────────────

  async addVote(voteData) {
    const ref = await db.collection('votes').add({
      ...voteData,
      timestamp: new Date().toISOString(),
    });
    return { id: ref.id };
  }

  async getVotesForTicket(ticketId) {
    const snapshot = await db.collection('votes').where('ticket_id', '==', ticketId).get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  async hasUserVoted(ticketId, userId) {
    const snapshot = await db.collection('votes')
      .where('ticket_id', '==', ticketId)
      .where('user_id', '==', userId)
      .get();
    return !snapshot.empty;
  }

  // ── Departments ──────────────────────────────────────────────

  async getDepartment(deptId) {
    const doc = await db.collection('departments').doc(deptId).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  }

  async getAllDepartments() {
    const snapshot = await db.collection('departments').get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  // ── Wards ────────────────────────────────────────────────────

  async getWard(wardId) {
    const doc = await db.collection('wards').doc(wardId).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  }

  async getAllWards() {
    const snapshot = await db.collection('wards').get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }
}

export default new FirestoreService();
