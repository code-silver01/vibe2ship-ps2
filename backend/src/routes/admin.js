/**
 * CivicPulse — Admin Routes
 * Dashboard data, risk scanning, and department management.
 */
import { Router } from 'express';
import firestoreService from '../services/FirestoreService.js';
import orchestrator from '../orchestrator/Orchestrator.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

/**
 * GET /api/admin/dashboard — Official dashboard data
 */
router.get('/dashboard', requireAuth, requireRole('official'), async (req, res, next) => {
  try {
    const { department } = req.query;
    let tickets;

    if (department) {
      tickets = await firestoreService.getTicketsByDepartment(department);
    } else {
      tickets = await firestoreService.getAllTickets(200);
    }

    // Categorize tickets
    const stats = {
      total: tickets.length,
      active: tickets.filter((t) => t.status === 'active').length,
      in_progress: tickets.filter((t) => t.status === 'in_progress').length,
      pending_verification: tickets.filter((t) => t.status === 'pending_verification').length,
      closed: tickets.filter((t) => t.status === 'closed' || t.status === 'verified').length,
      human_review: tickets.filter((t) => t.status === 'human_review').length,
      risk_high: tickets.filter((t) => t.risk_flag === 'high' || t.risk_flag === 'critical').length,
    };

    // Sort: risk-flagged first, then by SLA deadline
    const sortedTickets = tickets
      .filter((t) => !['closed', 'verified', 'merged'].includes(t.status))
      .sort((a, b) => {
        const riskOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        const riskDiff = (riskOrder[a.risk_flag] || 3) - (riskOrder[b.risk_flag] || 3);
        if (riskDiff !== 0) return riskDiff;
        return new Date(a.sla_deadline || 0) - new Date(b.sla_deadline || 0);
      });

    res.json({ stats, tickets: sortedTickets });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/admin/risk-scan — Trigger manual risk scan
 */
router.post('/risk-scan', requireAuth, requireRole('official'), async (req, res, next) => {
  try {
    const results = await orchestrator.runRiskScan();
    res.json({
      success: true,
      scanned: results.length,
      flagged: results.filter((r) => r.risk_flag === 'high' || r.risk_flag === 'critical').length,
      results,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/admin/citizen-dashboard — Citizen personal stats
 */
router.get('/citizen-dashboard', requireAuth, async (req, res, next) => {
  try {
    const user = await firestoreService.getUser(req.user.uid);
    const tickets = await firestoreService.getTicketsByReporter(req.user.uid);

    const resolved = tickets.filter((t) => ['closed', 'verified'].includes(t.status));
    const avgResolutionMs = resolved.length > 0
      ? resolved.reduce((sum, t) => {
          const created = new Date(t.created_at).getTime();
          const updated = new Date(t.updated_at).getTime();
          return sum + (updated - created);
        }, 0) / resolved.length
      : 0;

    res.json({
      user: {
        name: user?.name || 'Citizen',
        civic_credits: user?.civic_credits || 0,
        trust_score: user?.trust_score || 50,
      },
      stats: {
        total_reported: tickets.length,
        resolved: resolved.length,
        pending: tickets.filter((t) => !['closed', 'verified', 'merged'].includes(t.status)).length,
        avg_resolution_hours: Math.round(avgResolutionMs / (1000 * 60 * 60) * 10) / 10,
      },
      recent_tickets: tickets.slice(-10).reverse(),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
