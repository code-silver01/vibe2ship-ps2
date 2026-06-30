/**
 * CivicPulse — Ticket Routes
 * Core API routes for creating, viewing, and managing tickets.
 */
import { Router } from 'express';
import multer from 'multer';
import orchestrator from '../orchestrator/Orchestrator.js';
import firestoreService from '../services/FirestoreService.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
});

/**
 * POST /api/tickets — Create a new ticket (triggers full Orchestrator pipeline)
 */
router.post('/',
  requireAuth,
  upload.fields([
    { name: 'image', maxCount: 5 },
    { name: 'audio', maxCount: 1 },
  ]),
  async (req, res, next) => {
    try {
      const { textDescription, language, lat, lng, address } = req.body;

      const imageFiles = req.files?.image || [];
      const audioFile = req.files?.audio?.[0];

      // Use first image for AI analysis
      const imageData = imageFiles.length > 0 ? imageFiles[0].buffer : null;
      const audioData = audioFile ? audioFile.buffer : null;

      const location = lat && lng
        ? { lat: parseFloat(lat), lng: parseFloat(lng), address: address || '' }
        : null;

      // Process through orchestrator
      const result = await orchestrator.processNewReport({
        imageData,
        audioData,
        textDescription,
        language: language || 'en',
        location,
        reporterId: req.user.uid,
        imageUrls: imageFiles.map((_, i) => `uploaded_image_${i}`), // In production, upload to Cloud Storage
      });

      res.status(201).json({
        success: true,
        ticket: result.ticket,
        pipeline: result.pipeline,
        agentResults: {
          intake: result.intakeResult,
          dedup: result.dedupResult,
          routing: result.routingResult,
          risk: result.riskResult,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/tickets — List tickets with optional filters
 */
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { status, department, reporter, limit: queryLimit } = req.query;
    let tickets;

    if (reporter === 'me') {
      tickets = await firestoreService.getTicketsByReporter(req.user.uid);
    } else if (status) {
      tickets = await firestoreService.getTicketsByStatus(status);
    } else if (department) {
      tickets = await firestoreService.getTicketsByDepartment(department);
    } else {
      tickets = await firestoreService.getAllTickets(parseInt(queryLimit) || 100);
    }

    res.json({ tickets, count: tickets.length });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/tickets/:id — Get single ticket
 */
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const ticket = await firestoreService.getTicket(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    res.json({ ticket });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/tickets/:id/trace — Get agent trace log for a ticket
 */
router.get('/:id/trace', requireAuth, async (req, res, next) => {
  try {
    const traces = await firestoreService.getTracesByTicket(req.params.id);
    res.json({ traces, count: traces.length });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/tickets/:id/resolve — Official resolves a ticket (triggers VerificationAgent)
 */
router.post('/:id/resolve',
  requireAuth,
  requireRole('official', 'admin'),
  upload.single('afterImage'),
  async (req, res, next) => {
    try {
      const afterImage = req.file ? req.file.buffer : null;
      const result = await orchestrator.processResolution(req.params.id, {
        afterImage,
        afterImageUrls: req.file ? ['after_image_uploaded'] : [],
      });

      res.json({
        success: true,
        verified: result.verified,
        result: result.result,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/tickets/:id/approve-escalation — Citizen approves escalation
 */
router.post('/:id/approve-escalation', requireAuth, async (req, res, next) => {
  try {
    const result = await orchestrator.approveEscalation(req.params.id);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/tickets/:id/escalation-check — Manually trigger escalation check
 */
router.post('/:id/escalation-check', requireAuth, async (req, res, next) => {
  try {
    const result = await orchestrator.processEscalation(req.params.id);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

export default router;
