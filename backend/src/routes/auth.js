/**
 * CivicPulse — Auth Routes
 * User registration, profile, and role management.
 */
import { Router } from 'express';
import firestoreService from '../services/FirestoreService.js';
import { auth } from '../config/firebase.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

/**
 * POST /api/auth/register — Register a new user profile
 */
router.post('/register', requireAuth, async (req, res, next) => {
  try {
    const { name, ward, language_pref } = req.body;

    const existing = await firestoreService.getUser(req.user.uid);
    if (existing) {
      return res.json({ success: true, user: existing, message: 'User already exists' });
    }

    await firestoreService.createUser(req.user.uid, {
      name: name || 'Anonymous Citizen',
      email: req.user.email,
      role: req.user.role || 'citizen',
      ward: ward || '',
      language_pref: language_pref || 'en',
    });

    const user = await firestoreService.getUser(req.user.uid);
    res.status(201).json({ success: true, user });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/auth/profile — Get current user profile
 */
router.get('/profile', requireAuth, async (req, res, next) => {
  try {
    let user = await firestoreService.getUser(req.user.uid);

    if (!user) {
      // Auto-create user profile on first access
      await firestoreService.createUser(req.user.uid, {
        name: req.user.email?.split('@')[0] || 'Citizen',
        email: req.user.email,
        role: req.user.role || 'citizen',
        ward: '',
        language_pref: 'en',
      });
      user = await firestoreService.getUser(req.user.uid);
    }

    res.json({ user });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/auth/profile — Update user profile
 */
router.put('/profile', requireAuth, async (req, res, next) => {
  try {
    const { name, ward, language_pref, role } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (ward) updates.ward = ward;
    if (language_pref) updates.language_pref = language_pref;
    if (role) updates.role = role; // Allow setting role directly for demo purposes

    await firestoreService.updateUser(req.user.uid, updates);
    const user = await firestoreService.getUser(req.user.uid);
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/set-role — Official: assign role to a user
 */
router.post('/set-role', requireAuth, requireRole('official'), async (req, res, next) => {
  try {
    const { userId, role, department } = req.body;

    if (!userId || !role) {
      return res.status(400).json({ error: 'userId and role required' });
    }

    if (!['citizen', 'official'].includes(role)) {
      return res.status(400).json({ error: 'Role must be citizen or official' });
    }

    // Set custom claims in Firebase Auth
    await auth.setCustomUserClaims(userId, { role, department });

    // Update Firestore user doc
    const updates = { role };
    if (department) updates.department = department;
    await firestoreService.updateUser(userId, updates);

    res.json({ success: true, message: `User ${userId} role set to ${role}` });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/auth/leaderboard — Get civic credit leaderboard
 */
router.get('/leaderboard', requireAuth, async (req, res, next) => {
  try {
    const leaderboard = await firestoreService.getLeaderboard(20);
    res.json({
      leaderboard: leaderboard.map((u, i) => ({
        rank: i + 1,
        name: u.name,
        civic_credits: u.civic_credits || 0,
        trust_score: u.trust_score || 50,
        tickets_reported: u.tickets_reported || 0,
      })),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
