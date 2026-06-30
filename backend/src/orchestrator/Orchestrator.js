/**
 * CivicPulse — Orchestrator
 * Coordinates the full agent pipeline:
 * Intake → Dedup → Routing → (ongoing Risk monitoring) → Escalation → Verification → Close
 *
 * Manages state transitions in Firestore and writes every agent decision
 * to an auditable trace log per ticket.
 */
import { STATES, isValidTransition } from './states.js';
import intakeAgent from '../agents/IntakeAgent.js';
import deduplicationAgent from '../agents/DeduplicationAgent.js';
import routingAgent from '../agents/RoutingAgent.js';
import riskPredictionAgent from '../agents/RiskPredictionAgent.js';
import escalationAgent from '../agents/EscalationAgent.js';
import verificationAgent from '../agents/VerificationAgent.js';
import firestoreService from '../services/FirestoreService.js';
import analyticsService from '../services/AnalyticsService.js';
import { createStatusLogEntry } from '../utils/hashChain.js';

class Orchestrator {
  constructor() {
    this.name = 'Orchestrator';
  }

  /**
   * Process a new ticket through the full intake pipeline.
   * Runs: IntakeAgent → DeduplicationAgent → RoutingAgent
   *
   * @param {object} params
   * @param {Buffer|string} [params.imageData]
   * @param {Buffer|string} [params.audioData]
   * @param {string} [params.textDescription]
   * @param {string} [params.language]
   * @param {{ lat: number, lng: number, address?: string }} [params.location]
   * @param {string} params.reporterId
   * @param {string[]} [params.imageUrls]
   * @returns {Promise<object>} Created/merged ticket
   */
  async processNewReport(params) {
    const { imageData, audioData, textDescription, language, location, reporterId, imageUrls } = params;

    console.log('🚀 [Orchestrator] Processing new report...');

    // ── Step 1: Create initial ticket ──────────────────────────
    const initialStatusLog = [
      createStatusLogEntry({
        status: STATES.INTAKE,
        agent: 'Orchestrator',
        reasoning: 'New civic issue report received. Starting intake analysis.',
        existingLog: [],
      }),
    ];

    const ticketData = {
      status: STATES.INTAKE,
      reporter_id: reporterId,
      location: location || { lat: 0, lng: 0 },
      images: imageUrls || [],
      after_images: [],
      affected_citizen_count: 1,
      severity_score: 0,
      risk_flag: 'low',
      trust_weighted_votes: { confirms: 0, disputes: 0 },
      status_log: initialStatusLog,
      description: textDescription || '',
    };

    const ticket = await firestoreService.createTicket(ticketData);
    console.log(`📝 [Orchestrator] Created ticket ${ticket.id}`);

    // ── Step 2: IntakeAgent ────────────────────────────────────
    const intakeResult = await intakeAgent.run(ticket.id, {
      imageData,
      audioData,
      textDescription,
      language,
      location,
    });

    const intakeUpdate = {
      issue_type: intakeResult.issue_type,
      severity_score: intakeResult.severity_score,
      description: intakeResult.description,
      confidence_score: intakeResult.confidence_score,
      voice_transcript: intakeResult.voice_transcript || null,
    };

    // Transition to next state based on IntakeAgent decision
    await this._transitionState(ticket.id, STATES.INTAKE, intakeResult.newStatus, {
      agent: 'IntakeAgent',
      reasoning: intakeResult.reasoning,
      updates: intakeUpdate,
    });

    // If flagged for human review, stop pipeline
    if (intakeResult.needs_human_review) {
      return {
        ticket: { id: ticket.id, ...ticketData, ...intakeUpdate, status: STATES.HUMAN_REVIEW },
        pipeline: 'paused_human_review',
        intakeResult,
      };
    }

    // ── Step 3: DeduplicationAgent ─────────────────────────────
    const dedupResult = await deduplicationAgent.run(ticket.id, {
      ticketId: ticket.id,
      imageData: imageData || textDescription || ticket.id,
      location,
      issue_type: intakeResult.issue_type,
    });

    if (dedupResult.isDuplicate) {
      // Mark current ticket as merged
      await this._transitionState(ticket.id, STATES.DEDUP_CHECK, STATES.MERGED, {
        agent: 'DeduplicationAgent',
        reasoning: dedupResult.reasoning,
        updates: { merged_into: dedupResult.mergedInto },
      });

      return {
        ticket: { id: ticket.id, status: STATES.MERGED, merged_into: dedupResult.mergedInto },
        pipeline: 'merged',
        intakeResult,
        dedupResult,
      };
    }

    await this._transitionState(ticket.id, STATES.DEDUP_CHECK, STATES.ROUTING, {
      agent: 'DeduplicationAgent',
      reasoning: dedupResult.reasoning,
    });

    // ── Step 4: RoutingAgent ───────────────────────────────────
    const routingResult = await routingAgent.run(ticket.id, {
      issue_type: intakeResult.issue_type,
      location,
      severity_score: intakeResult.severity_score,
    });

    const routingUpdate = {
      department: routingResult.department,
      ward: routingResult.ward,
      sla_deadline: routingResult.sla_deadline,
      assigned_official_id: routingResult.assigned_official_id,
    };

    await this._transitionState(ticket.id, STATES.ROUTING, STATES.ACTIVE, {
      agent: 'RoutingAgent',
      reasoning: routingResult.reasoning,
      updates: routingUpdate,
    });

    // ── Step 5: Initial risk assessment ────────────────────────
    const fullTicket = {
      id: ticket.id,
      ...ticketData,
      ...intakeUpdate,
      ...routingUpdate,
      status: STATES.ACTIVE,
    };

    const riskResult = await riskPredictionAgent.run(ticket.id, { ticket: fullTicket });

    if (riskResult.risk_flag !== 'low') {
      await firestoreService.updateTicket(ticket.id, {
        risk_flag: riskResult.risk_flag,
      });
    }

    // Update reporter stats
    try {
      const user = await firestoreService.getUser(reporterId);
      if (user) {
        await firestoreService.updateUser(reporterId, {
          tickets_reported: (user.tickets_reported || 0) + 1,
          civic_credits: (user.civic_credits || 0) + 10, // +10 credits for reporting
        });
      }
    } catch (err) {
      console.warn('Could not update reporter stats:', err.message);
    }

    console.log(`✅ [Orchestrator] Ticket ${ticket.id} fully processed: ${intakeResult.issue_type} → ${routingResult.department_name} (${routingResult.ward_name})`);

    return {
      ticket: fullTicket,
      pipeline: 'completed',
      intakeResult,
      dedupResult,
      routingResult,
      riskResult,
    };
  }

  /**
   * Process a resolution attempt (official marks ticket as resolved)
   * Runs: VerificationAgent
   */
  async processResolution(ticketId, { afterImage, afterImageUrls }) {
    console.log(`🔍 [Orchestrator] Processing resolution for ticket ${ticketId}`);

    const ticket = await firestoreService.getTicket(ticketId);
    if (!ticket) throw new Error(`Ticket ${ticketId} not found`);

    // Update after images
    await firestoreService.updateTicket(ticketId, {
      after_images: afterImageUrls || [],
    });

    await this._transitionState(ticketId, ticket.status, STATES.PENDING_VERIFICATION, {
      agent: 'Orchestrator',
      reasoning: 'Official submitted resolution with after-images. Triggering verification.',
    });

    // Run VerificationAgent
    const beforeImage = ticket.images?.[0] || null; // Use first image as reference
    const verificationResult = await verificationAgent.run(ticketId, {
      beforeImage,
      afterImage,
      issue_type: ticket.issue_type,
      ticketId,
    });

    if (verificationResult.verified) {
      // Award large civic credit bounty to the reporter for successful resolution
      try {
        const user = await firestoreService.getUser(ticket.reporter_id);
        if (user) {
          await firestoreService.updateUser(ticket.reporter_id, {
            civic_credits: (user.civic_credits || 0) + 50,
          });
        }
      } catch (err) {
        console.warn('Could not update reporter rewards:', err.message);
      }

      await this._transitionState(ticketId, STATES.PENDING_VERIFICATION, STATES.VERIFIED, {
        agent: 'VerificationAgent',
        reasoning: verificationResult.reasoning,
      });

      // Auto-close after verification
      await this._transitionState(ticketId, STATES.VERIFIED, STATES.CLOSED, {
        agent: 'Orchestrator',
        reasoning: 'Verified by AI. Closing ticket.',
      });

      // Log resolution analytics
      analyticsService.logResolution({
        ticket_id: ticketId,
        issue_type: ticket.issue_type,
        department: ticket.department,
        ward: ticket.ward,
        severity_score: ticket.severity_score,
        created_at: ticket.created_at,
        resolved_at: new Date().toISOString(),
        resolution_hours: (Date.now() - new Date(ticket.created_at).getTime()) / (1000 * 60 * 60),
        sla_hours: ticket.sla_deadline
          ? (new Date(ticket.sla_deadline).getTime() - new Date(ticket.created_at).getTime()) / (1000 * 60 * 60)
          : null,
        sla_met: ticket.sla_deadline ? Date.now() <= new Date(ticket.sla_deadline).getTime() : null,
        verification_score: verificationResult.match_score,
        affected_citizens: ticket.affected_citizen_count,
      });

      return { verified: true, result: verificationResult };
    } else {
      // Verification failed — revert to in_progress
      await this._transitionState(ticketId, STATES.PENDING_VERIFICATION, STATES.IN_PROGRESS, {
        agent: 'VerificationAgent',
        reasoning: verificationResult.reasoning,
      });

      return { verified: false, result: verificationResult };
    }
  }

  /**
   * Process escalation check for a ticket
   */
  async processEscalation(ticketId) {
    const ticket = await firestoreService.getTicket(ticketId);
    if (!ticket) throw new Error(`Ticket ${ticketId} not found`);

    const result = await escalationAgent.run(ticketId, { ticket });

    if (result.shouldEscalate) {
      await firestoreService.updateTicket(ticketId, {
        escalation_draft: result.escalation_draft,
      });

      await this._transitionState(ticketId, ticket.status, STATES.PENDING_CITIZEN_APPROVAL, {
        agent: 'EscalationAgent',
        reasoning: result.reasoning,
      });
    }

    return result;
  }

  /**
   * Process citizen approval of escalation
   */
  async approveEscalation(ticketId) {
    const ticket = await firestoreService.getTicket(ticketId);
    if (!ticket) throw new Error(`Ticket ${ticketId} not found`);

    // In a real system, this would send the escalation to the department
    console.log(`📨 [Orchestrator] Escalation approved for ticket ${ticketId}. Sending RTI request.`);

    await this._transitionState(ticketId, STATES.PENDING_CITIZEN_APPROVAL, STATES.IN_PROGRESS, {
      agent: 'Orchestrator',
      reasoning: 'Citizen approved escalation. RTI request sent to department. Returning to in_progress for resolution tracking.',
      updates: { escalation_sent: true, escalation_sent_at: new Date().toISOString() },
    });

    return { escalated: true, message: 'Escalation sent to department' };
  }

  /**
   * Run periodic risk scan on all open tickets
   */
  async runRiskScan() {
    console.log('🔄 [Orchestrator] Running periodic risk scan...');
    const results = await riskPredictionAgent.scanAllOpenTickets();

    // Check if any need escalation
    for (const r of results) {
      if (r.risk_flag === 'critical' || r.breach_probability >= 1.0) {
        try {
          await this.processEscalation(r.ticketId);
        } catch (err) {
          console.error(`Escalation check failed for ${r.ticketId}:`, err.message);
        }
      }
    }

    console.log(`✅ [Orchestrator] Risk scan complete. ${results.length} tickets scanned.`);
    return results;
  }

  /**
   * Transition a ticket from one state to another with full logging
   */
  async _transitionState(ticketId, fromState, toState, { agent, reasoning, updates = {} }) {
    // Get current ticket for status log
    const ticket = await firestoreService.getTicket(ticketId);
    const existingLog = ticket?.status_log || [];

    // Create hash-chained log entry
    const logEntry = createStatusLogEntry({
      status: toState,
      agent,
      reasoning,
      existingLog,
    });

    // Update ticket
    await firestoreService.updateTicket(ticketId, {
      status: toState,
      status_log: [...existingLog, logEntry],
      ...updates,
    });

    // Log analytics event
    analyticsService.logEvent({
      ticket_id: ticketId,
      event_type: 'state_transition',
      agent_name: agent,
      status_from: fromState,
      status_to: toState,
      department: ticket?.department,
      ward: ticket?.ward,
      severity_score: ticket?.severity_score,
    });

    console.log(`  ↳ [${agent}] ${fromState} → ${toState}`);
  }
}

export default new Orchestrator();
