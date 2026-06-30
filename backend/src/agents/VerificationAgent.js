/**
 * CivicPulse — VerificationAgent
 * When an official marks a ticket "resolved," compares before/after images
 * via Gemini vision to confirm the fix matches the original complaint.
 * If mismatch, rejects closure and reverts status to "in_progress."
 */
import BaseAgent from './BaseAgent.js';
import geminiService from '../services/GeminiService.js';

class VerificationAgent extends BaseAgent {
  constructor() {
    super('VerificationAgent');
  }

  /**
   * @param {object} context
   * @param {Buffer|string} context.beforeImage - Original issue image
   * @param {Buffer|string} context.afterImage - Post-repair image
   * @param {string} context.issue_type - The issue type for context
   * @param {string} context.ticketId - Ticket being verified
   * @returns {Promise<object>} Verification result
   */
  async execute(context) {
    const { beforeImage, afterImage, issue_type, ticketId } = context;

    // Step 1: If no before/after images, auto-approve with low confidence
    if (!beforeImage || !afterImage) {
      return {
        verified: true,
        match_score: null,
        autoApproved: true,
        newStatus: 'verified',
        reasoning: 'No before/after images available for comparison. Auto-approved with low confidence — recommend manual inspection.',
        confidence_score: 0.3,
      };
    }

    // Step 2: Use Gemini to compare before/after images
    const comparison = await geminiService.compareImages(beforeImage, afterImage, issue_type);

    // Step 3: Make verification decision
    const VERIFICATION_THRESHOLD = 0.6; // Minimum match score to verify

    if (comparison.verified && comparison.match_score >= VERIFICATION_THRESHOLD) {
      return {
        verified: true,
        match_score: comparison.match_score,
        autoApproved: false,
        newStatus: 'verified',
        reasoning: `Verification PASSED. Match score: ${(comparison.match_score * 100).toFixed(1)}%. ${comparison.reasoning}`,
        confidence_score: comparison.match_score,
      };
    } else {
      return {
        verified: false,
        match_score: comparison.match_score,
        autoApproved: false,
        newStatus: 'in_progress',
        reasoning: `Verification FAILED. Match score: ${(comparison.match_score * 100).toFixed(1)}%. ${comparison.reasoning}. Reverting to in_progress.`,
        confidence_score: comparison.match_score,
        rejection_reason: comparison.reasoning,
      };
    }
  }
}

export default new VerificationAgent();
