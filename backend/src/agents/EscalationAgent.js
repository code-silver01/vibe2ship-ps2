/**
 * CivicPulse — EscalationAgent
 * Triggers on SLA breach OR citizen-verification threshold (e.g. 10 confirms).
 * Auto-drafts RTI-style escalation text and sets status to "pending_citizen_approval".
 * Only sends/escalates after citizen approves via one-tap UI action.
 */
import BaseAgent from './BaseAgent.js';
import config from '../config/env.js';

class EscalationAgent extends BaseAgent {
  constructor() {
    super('EscalationAgent');
  }

  /**
   * @param {object} context
   * @param {object} context.ticket - The ticket to evaluate for escalation
   * @returns {Promise<object>} Escalation result with draft text
   */
  async execute(context) {
    const { ticket } = context;

    // Check escalation triggers
    const triggers = this._checkTriggers(ticket);

    if (!triggers.shouldEscalate) {
      return {
        shouldEscalate: false,
        triggers: triggers.reasons,
        reasoning: `No escalation needed. ${triggers.reasons.join('; ')}`,
        confidence_score: 0.95,
      };
    }

    // Draft RTI-style escalation message
    const draft = this._draftEscalation(ticket, triggers);

    return {
      shouldEscalate: true,
      triggers: triggers.reasons,
      escalation_draft: draft,
      newStatus: 'pending_citizen_approval',
      reasoning: `Escalation triggered: ${triggers.reasons.join('; ')}. Draft RTI request created. Awaiting citizen approval before sending.`,
      confidence_score: 0.9,
    };
  }

  /**
   * Check all escalation trigger conditions
   */
  _checkTriggers(ticket) {
    const reasons = [];
    let shouldEscalate = false;

    // Trigger 1: SLA breach
    if (ticket.sla_deadline) {
      const now = Date.now();
      const deadline = new Date(ticket.sla_deadline).getTime();
      if (now > deadline) {
        const hoursOverdue = Math.round((now - deadline) / (1000 * 60 * 60));
        reasons.push(`SLA breached by ${hoursOverdue} hours`);
        shouldEscalate = true;
      }
    }

    // Trigger 2: High citizen confirmation count
    const confirms = ticket.trust_weighted_votes?.confirms || 0;
    if (confirms >= config.escalationCitizenThreshold) {
      reasons.push(`${confirms} citizen confirmations (threshold: ${config.escalationCitizenThreshold})`);
      shouldEscalate = true;
    }

    // Trigger 3: Critical risk flag
    if (ticket.risk_flag === 'critical') {
      reasons.push('Critical risk flag set by RiskPredictionAgent');
      shouldEscalate = true;
    }

    if (!shouldEscalate) {
      reasons.push('No escalation triggers met');
    }

    return { shouldEscalate, reasons };
  }

  /**
   * Draft an RTI (Right to Information) style escalation request
   */
  _draftEscalation(ticket, triggers) {
    const now = new Date();
    const createdDate = new Date(ticket.created_at).toLocaleDateString('en-IN');

    return `
RIGHT TO INFORMATION / CIVIC ESCALATION REQUEST
=================================================

Date: ${now.toLocaleDateString('en-IN')}
Reference: Ticket #${ticket.id}

To: The Commissioner / Chief Engineer
Department: ${ticket.department || 'Concerned Department'}
Ward: ${ticket.location?.ward || 'N/A'}

Subject: Escalation of Unresolved Civic Issue — ${(ticket.issue_type || 'unknown').replace(/_/g, ' ').toUpperCase()}

Dear Sir/Madam,

This is to bring to your urgent attention the following civic issue that remains unresolved:

ISSUE DETAILS:
- Type: ${(ticket.issue_type || 'unknown').replace(/_/g, ' ')}
- Severity: ${ticket.severity_score || 'N/A'}/10
- Location: ${ticket.location?.address || `Lat: ${ticket.location?.lat}, Lng: ${ticket.location?.lng}`}
- Date Reported: ${createdDate}
- Current Status: ${ticket.status}
- Affected Citizens: ${ticket.affected_citizen_count || 1}

ESCALATION TRIGGERS:
${triggers.reasons.map((r) => `• ${r}`).join('\n')}

DESCRIPTION:
${ticket.description || 'A civic infrastructure issue requiring immediate attention.'}

As a concerned citizen exercising my right under the Right to Information Act and relevant municipal governance regulations, I request:

1. Immediate action to resolve this issue
2. A written response with an updated timeline for resolution
3. Details of the officer responsible for this area and any prior action taken

This request is generated through CivicPulse, a transparent civic engagement platform.
${ticket.affected_citizen_count > 1 ? `\nThis issue has been confirmed by ${ticket.affected_citizen_count} citizens.` : ''}

Regards,
Concerned Citizens of ${ticket.location?.ward || 'the locality'}
(via CivicPulse Platform)
`.trim();
  }
}

export default new EscalationAgent();
