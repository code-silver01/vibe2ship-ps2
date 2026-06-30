/**
 * CivicPulse — RiskPredictionAgent
 * Scans open tickets and flags ones likely to breach SLA.
 * Uses a simple rule-based scoring on time_remaining vs department historical performance.
 */
import BaseAgent from './BaseAgent.js';
import firestoreService from '../services/FirestoreService.js';
import config from '../config/env.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const deptData = JSON.parse(readFileSync(path.resolve(__dirname, '../data/departments.json'), 'utf-8'));

class RiskPredictionAgent extends BaseAgent {
  constructor() {
    super('RiskPredictionAgent');
  }

  /**
   * Scan a single ticket for SLA breach risk
   * @param {object} context
   * @param {object} context.ticket - The ticket to evaluate
   * @returns {Promise<object>} Risk assessment
   */
  async execute(context) {
    const { ticket } = context;

    if (!ticket.sla_deadline) {
      return {
        risk_flag: 'low',
        breach_probability: 0,
        reasoning: 'No SLA deadline set.',
        confidence_score: 1.0,
      };
    }

    const now = Date.now();
    const deadline = new Date(ticket.sla_deadline).getTime();
    const created = new Date(ticket.created_at).getTime();
    const totalTime = deadline - created;
    const timeElapsed = now - created;
    const timeRemaining = deadline - now;

    // Already breached
    if (timeRemaining <= 0) {
      return {
        risk_flag: 'critical',
        breach_probability: 1.0,
        time_remaining_hours: 0,
        hours_overdue: Math.round(-timeRemaining / (1000 * 60 * 60) * 10) / 10,
        newStatus: null, // Don't change status, escalation agent handles this
        reasoning: `SLA BREACHED. Deadline was ${ticket.sla_deadline}. Now ${Math.round(-timeRemaining / (1000 * 60 * 60))} hours overdue.`,
        confidence_score: 1.0,
      };
    }

    // Calculate risk based on time used vs historical performance
    const dept = deptData.departments.find((d) => d.id === ticket.department);
    const avgResolutionHours = dept?.avg_resolution_hours || 72;
    const percentTimeUsed = timeElapsed / totalTime;
    const remainingHours = timeRemaining / (1000 * 60 * 60);

    // Risk factors:
    // 1. How much of the SLA time has been used
    // 2. Whether remaining time is less than department's avg resolution time
    // 3. Severity (higher severity = higher risk if delayed)
    // 4. Affected citizen count (more people = higher urgency)
    let riskScore = 0;

    // Time pressure factor (0 to 0.4)
    riskScore += percentTimeUsed * 0.4;

    // Historical performance factor (0 to 0.3)
    if (remainingHours < avgResolutionHours) {
      riskScore += 0.3 * (1 - remainingHours / avgResolutionHours);
    }

    // Severity factor (0 to 0.2)
    riskScore += ((ticket.severity_score || 5) / 10) * 0.2;

    // Citizen pressure factor (0 to 0.1)
    const citizenFactor = Math.min((ticket.affected_citizen_count || 1) / 10, 1);
    riskScore += citizenFactor * 0.1;

    // Clamp to [0, 1]
    riskScore = Math.min(Math.max(riskScore, 0), 1);

    // Determine risk level
    let riskFlag;
    if (riskScore >= 0.8) riskFlag = 'critical';
    else if (riskScore >= config.slaBreachRiskThreshold) riskFlag = 'high';
    else if (riskScore >= 0.4) riskFlag = 'medium';
    else riskFlag = 'low';

    return {
      risk_flag: riskFlag,
      breach_probability: Math.round(riskScore * 100) / 100,
      time_remaining_hours: Math.round(remainingHours * 10) / 10,
      percent_time_used: Math.round(percentTimeUsed * 100),
      reasoning: `Risk: ${riskFlag} (${(riskScore * 100).toFixed(0)}%). ${remainingHours.toFixed(1)}h remaining. ${(percentTimeUsed * 100).toFixed(0)}% of SLA time used. Dept avg resolution: ${avgResolutionHours}h.`,
      confidence_score: 0.85,
    };
  }

  /**
   * Batch scan all open tickets for risk
   * @returns {Promise<object[]>} Array of risk assessments
   */
  async scanAllOpenTickets() {
    const tickets = await firestoreService.getOpenTickets();
    const results = [];

    for (const ticket of tickets) {
      if (['intake', 'dedup_check', 'routing', 'merged', 'human_review'].includes(ticket.status)) {
        continue; // Skip tickets still in pipeline
      }

      const result = await this.run(ticket.id, { ticket });

      // Update ticket risk flag in Firestore
      if (result.risk_flag !== ticket.risk_flag) {
        await firestoreService.updateTicket(ticket.id, {
          risk_flag: result.risk_flag,
        });
      }

      results.push({ ticketId: ticket.id, ...result });
    }

    return results;
  }
}

export default new RiskPredictionAgent();
