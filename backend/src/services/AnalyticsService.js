/**
 * CivicPulse — AnalyticsService
 * BigQuery-compatible schema using SQLite for local development.
 * Switch to BigQuery by swapping the connection adapter; schema stays the same.
 */
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.resolve(__dirname, '../../data/analytics.db');

class AnalyticsService {
  constructor() {
    this.db = null;
  }

  init() {
    try {
      this.db = new Database(DB_PATH);
      this.db.pragma('journal_mode = WAL');
      this._createTables();
      console.log('📊 Analytics SQLite database initialized');
    } catch (err) {
      console.warn('⚠️ Analytics DB init failed (non-critical):', err.message);
      this.db = null;
    }
  }

  _createTables() {
    if (!this.db) return;

    // BigQuery-compatible schema: same column names and types
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS ticket_events (
        event_id TEXT PRIMARY KEY,
        ticket_id TEXT NOT NULL,
        event_type TEXT NOT NULL,
        agent_name TEXT,
        status_from TEXT,
        status_to TEXT,
        severity_score REAL,
        department TEXT,
        ward TEXT,
        timestamp TEXT NOT NULL,
        duration_ms INTEGER,
        metadata TEXT
      );

      CREATE TABLE IF NOT EXISTS department_performance (
        record_id TEXT PRIMARY KEY,
        department TEXT NOT NULL,
        ward TEXT,
        period TEXT NOT NULL,
        total_tickets INTEGER DEFAULT 0,
        resolved_tickets INTEGER DEFAULT 0,
        avg_resolution_hours REAL DEFAULT 0,
        sla_adherence_rate REAL DEFAULT 0,
        avg_severity REAL DEFAULT 0,
        timestamp TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS resolution_metrics (
        metric_id TEXT PRIMARY KEY,
        ticket_id TEXT NOT NULL,
        issue_type TEXT NOT NULL,
        department TEXT NOT NULL,
        ward TEXT,
        severity_score REAL,
        created_at TEXT NOT NULL,
        resolved_at TEXT,
        resolution_hours REAL,
        sla_hours REAL,
        sla_met INTEGER,
        verification_score REAL,
        affected_citizens INTEGER DEFAULT 1,
        timestamp TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_ticket_events_ticket ON ticket_events(ticket_id);
      CREATE INDEX IF NOT EXISTS idx_ticket_events_type ON ticket_events(event_type);
      CREATE INDEX IF NOT EXISTS idx_dept_perf_dept ON department_performance(department);
      CREATE INDEX IF NOT EXISTS idx_resolution_dept ON resolution_metrics(department);
      CREATE INDEX IF NOT EXISTS idx_resolution_type ON resolution_metrics(issue_type);
    `);
  }

  /**
   * Log a ticket event (status change, agent action, etc.)
   */
  logEvent(event) {
    if (!this.db) return;
    try {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO ticket_events (event_id, ticket_id, event_type, agent_name, status_from, status_to, severity_score, department, ward, timestamp, duration_ms, metadata)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        event.event_id || `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        event.ticket_id,
        event.event_type,
        event.agent_name || null,
        event.status_from || null,
        event.status_to || null,
        event.severity_score || null,
        event.department || null,
        event.ward || null,
        event.timestamp || new Date().toISOString(),
        event.duration_ms || null,
        event.metadata ? JSON.stringify(event.metadata) : null
      );
    } catch (err) {
      console.warn('Analytics logEvent error:', err.message);
    }
  }

  /**
   * Record resolution metrics when a ticket is closed
   */
  logResolution(metric) {
    if (!this.db) return;
    try {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO resolution_metrics (metric_id, ticket_id, issue_type, department, ward, severity_score, created_at, resolved_at, resolution_hours, sla_hours, sla_met, verification_score, affected_citizens, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        metric.metric_id || `res_${Date.now()}`,
        metric.ticket_id,
        metric.issue_type,
        metric.department,
        metric.ward || null,
        metric.severity_score || null,
        metric.created_at,
        metric.resolved_at || new Date().toISOString(),
        metric.resolution_hours || null,
        metric.sla_hours || null,
        metric.sla_met ? 1 : 0,
        metric.verification_score || null,
        metric.affected_citizens || 1,
        new Date().toISOString()
      );
    } catch (err) {
      console.warn('Analytics logResolution error:', err.message);
    }
  }

  /**
   * Get department performance summary
   */
  getDepartmentStats() {
    if (!this.db) return [];
    try {
      return this.db.prepare(`
        SELECT
          department,
          COUNT(*) as total_tickets,
          SUM(CASE WHEN resolved_at IS NOT NULL THEN 1 ELSE 0 END) as resolved_tickets,
          ROUND(AVG(resolution_hours), 1) as avg_resolution_hours,
          ROUND(AVG(CASE WHEN sla_met = 1 THEN 100.0 ELSE 0.0 END), 1) as sla_adherence_pct,
          ROUND(AVG(severity_score), 1) as avg_severity
        FROM resolution_metrics
        GROUP BY department
        ORDER BY sla_adherence_pct DESC
      `).all();
    } catch (err) {
      return [];
    }
  }

  /**
   * Get issue type distribution
   */
  getIssueTypeDistribution() {
    if (!this.db) return [];
    try {
      return this.db.prepare(`
        SELECT issue_type, COUNT(*) as count, ROUND(AVG(severity_score), 1) as avg_severity
        FROM resolution_metrics
        GROUP BY issue_type
        ORDER BY count DESC
      `).all();
    } catch (err) {
      return [];
    }
  }

  /**
   * Get ward-level stats for heatmap
   */
  getWardStats() {
    if (!this.db) return [];
    try {
      return this.db.prepare(`
        SELECT
          ward,
          COUNT(*) as total_issues,
          SUM(CASE WHEN sla_met = 0 THEN 1 ELSE 0 END) as sla_breaches,
          ROUND(AVG(resolution_hours), 1) as avg_resolution_hours
        FROM resolution_metrics
        WHERE ward IS NOT NULL
        GROUP BY ward
      `).all();
    } catch (err) {
      return [];
    }
  }
}

export default new AnalyticsService();
