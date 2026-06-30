/**
 * CivicPulse — Voting Routes
 * Community confirm/dispute voting on tickets, weighted by reporter trust_score.
 */
import { Router } from 'express';
import firestoreService from '../services/FirestoreService.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

/**
 * POST /api/votes — Cast a vote on a ticket
 * Body: { ticket_id, vote_type: 'confirm' | 'dispute' }
 */
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { ticket_id, vote_type } = req.body;

    if (!ticket_id || !['confirm', 'dispute'].includes(vote_type)) {
      return res.status(400).json({ error: 'ticket_id and vote_type (confirm/dispute) required' });
    }

    // Check if user already voted on this ticket
    const alreadyVoted = await firestoreService.hasUserVoted(ticket_id, req.user.uid);
    if (alreadyVoted) {
      return res.status(409).json({ error: 'You have already voted on this ticket' });
    }

    // Get user's trust score for weighted voting
    const user = await firestoreService.getUser(req.user.uid);
    const trustScore = user?.trust_score || 50;

    // Record vote
    await firestoreService.addVote({
      ticket_id,
      user_id: req.user.uid,
      vote_type,
      trust_score_at_vote: trustScore,
    });

    // Update ticket's trust-weighted vote tally
    const ticket = await firestoreService.getTicket(ticket_id);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const votes = ticket.trust_weighted_votes || { confirms: 0, disputes: 0 };
    const weight = trustScore / 100; // Normalize trust to 0-1 weight

    if (vote_type === 'confirm') {
      votes.confirms = (votes.confirms || 0) + weight;
    } else {
      votes.disputes = (votes.disputes || 0) + weight;
    }

    // Also increment affected_citizen_count for confirms
    const updates = { trust_weighted_votes: votes };
    if (vote_type === 'confirm') {
      updates.affected_citizen_count = (ticket.affected_citizen_count || 1) + 1;
    }

    await firestoreService.updateTicket(ticket_id, updates);

    // Award civic credits for voting
    if (user) {
      await firestoreService.updateUser(req.user.uid, {
        civic_credits: (user.civic_credits || 0) + 2,
      });
    }

    res.json({
      success: true,
      vote_type,
      weighted_value: weight,
      updated_votes: votes,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/votes/:ticketId — Get votes for a ticket
 */
router.get('/:ticketId', requireAuth, async (req, res, next) => {
  try {
    const votes = await firestoreService.getVotesForTicket(req.params.ticketId);
    const ticket = await firestoreService.getTicket(req.params.ticketId);

    res.json({
      votes,
      count: votes.length,
      weighted_tally: ticket?.trust_weighted_votes || { confirms: 0, disputes: 0 },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
