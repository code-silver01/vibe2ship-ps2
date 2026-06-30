/**
 * CivicPulse — Analytics Routes
 * Public scorecard, heatmap data, and department performance.
 */
import { Router } from 'express';
import analyticsService from '../services/AnalyticsService.js';
import firestoreService from '../services/FirestoreService.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const infraData = JSON.parse(readFileSync(path.resolve(__dirname, '../data/infra-age.json'), 'utf-8'));
const wardData = JSON.parse(readFileSync(path.resolve(__dirname, '../data/ward-boundaries.json'), 'utf-8'));
const deptData = JSON.parse(readFileSync(path.resolve(__dirname, '../data/departments.json'), 'utf-8'));

const router = Router();

/**
 * GET /api/analytics/scorecard — Public department scorecard
 */
router.get('/scorecard', async (req, res, next) => {
  try {
    // Get analytics from SQLite
    const dbStats = analyticsService.getDepartmentStats();

    // Also get live data from Firestore
    const allTickets = await firestoreService.getAllTickets(500);

    // Compute live stats per department
    const deptStats = {};
    for (const dept of deptData.departments) {
      const deptTickets = allTickets.filter((t) => t.department === dept.id);
      const resolved = deptTickets.filter((t) => ['closed', 'verified'].includes(t.status));
      const slaMet = resolved.filter((t) =>
        t.sla_deadline && new Date(t.updated_at) <= new Date(t.sla_deadline)
      );

      deptStats[dept.id] = {
        department: dept.id,
        department_name: dept.name,
        total_tickets: deptTickets.length,
        resolved_tickets: resolved.length,
        resolution_rate: deptTickets.length > 0
          ? Math.round((resolved.length / deptTickets.length) * 100) : 0,
        avg_resolution_hours: dept.avg_resolution_hours,
        sla_adherence_pct: resolved.length > 0
          ? Math.round((slaMet.length / resolved.length) * 100) : 100,
        active_tickets: deptTickets.filter((t) =>
          !['closed', 'verified', 'merged'].includes(t.status)
        ).length,
      };
    }

    // Sort by SLA adherence
    const ranked = Object.values(deptStats).sort(
      (a, b) => b.sla_adherence_pct - a.sla_adherence_pct
    );

    res.json({
      scorecard: ranked,
      historical: dbStats,
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/analytics/heatmap — Predictive maintenance heatmap data
 * Combines complaint density + infrastructure age data
 */
router.get('/heatmap', async (req, res, next) => {
  try {
    const allTickets = await firestoreService.getAllTickets(500);

    // Compute complaint density per ward
    const wardComplaintDensity = {};
    for (const ticket of allTickets) {
      const ward = ticket.ward || ticket.location?.ward || 'unknown';
      if (!wardComplaintDensity[ward]) {
        wardComplaintDensity[ward] = {
          total: 0, active: 0, avgSeverity: 0, severitySum: 0,
          points: [],
        };
      }
      wardComplaintDensity[ward].total++;
      wardComplaintDensity[ward].severitySum += (ticket.severity_score || 5);
      if (!['closed', 'verified', 'merged'].includes(ticket.status)) {
        wardComplaintDensity[ward].active++;
      }
      if (ticket.location?.lat && ticket.location?.lng) {
        wardComplaintDensity[ward].points.push({
          lat: ticket.location.lat,
          lng: ticket.location.lng,
          weight: (ticket.severity_score || 5) / 10,
        });
      }
    }

    // Calculate averages
    for (const ward of Object.keys(wardComplaintDensity)) {
      const d = wardComplaintDensity[ward];
      d.avgSeverity = d.total > 0 ? Math.round((d.severitySum / d.total) * 10) / 10 : 0;
    }

    // Merge with infrastructure age data to compute risk scores
    const heatmapZones = wardData.wards.map((ward) => {
      const complaints = wardComplaintDensity[ward.id] || { total: 0, active: 0, avgSeverity: 0, points: [] };
      const infraItems = infraData.infrastructure.filter((i) => i.ward === ward.id);
      const avgCondition = infraItems.length > 0
        ? infraItems.reduce((s, i) => s + i.condition_score, 0) / infraItems.length
        : 0.5;
      const avgAge = infraItems.length > 0
        ? infraItems.reduce((s, i) => s + i.age_years, 0) / infraItems.length
        : 10;

      // Risk score: combine complaint density + infrastructure age + condition
      const complaintFactor = Math.min(complaints.total / 10, 1) * 0.4;
      const conditionFactor = (1 - avgCondition) * 0.35;
      const ageFactor = Math.min(avgAge / 30, 1) * 0.25;
      const riskScore = Math.round((complaintFactor + conditionFactor + ageFactor) * 100) / 100;

      // Centroid of ward for map placement
      const coords = ward.boundary.coordinates[0];
      const centroidLat = coords.reduce((s, c) => s + c[1], 0) / coords.length;
      const centroidLng = coords.reduce((s, c) => s + c[0], 0) / coords.length;

      return {
        ward_id: ward.id,
        ward_name: ward.name,
        centroid: { lat: centroidLat, lng: centroidLng },
        boundary: ward.boundary,
        complaint_count: complaints.total,
        active_complaints: complaints.active,
        avg_severity: complaints.avgSeverity,
        avg_infra_condition: Math.round(avgCondition * 100) / 100,
        avg_infra_age_years: Math.round(avgAge),
        risk_score: riskScore,
        risk_level: riskScore >= 0.7 ? 'critical' : riskScore >= 0.5 ? 'high' : riskScore >= 0.3 ? 'medium' : 'low',
        heatmap_points: complaints.points,
        infrastructure: infraItems,
      };
    });

    res.json({
      zones: heatmapZones.sort((a, b) => b.risk_score - a.risk_score),
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/analytics/ward-stats — Ward-level analytics
 */
router.get('/ward-stats', async (req, res, next) => {
  try {
    const stats = analyticsService.getWardStats();
    res.json({ wards: stats });
  } catch (err) {
    next(err);
  }
});

export default router;
