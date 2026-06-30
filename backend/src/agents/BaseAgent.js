/**
 * CivicPulse — BaseAgent
 * Abstract base class for all AI agents.
 * Provides tracing, logging, and a standardized execution interface.
 * Every agent decision is logged to the agent_trace collection for auditability.
 */
import firestoreService from '../services/FirestoreService.js';
import analyticsService from '../services/AnalyticsService.js';

class BaseAgent {
  constructor(name) {
    if (new.target === BaseAgent) {
      throw new Error('BaseAgent is abstract and cannot be instantiated directly');
    }
    this.name = name;
  }

  /**
   * Execute the agent's primary function.
   * Subclasses must override this.
   * @param {object} context - Input context for the agent
   * @returns {Promise<object>} - Agent output
   */
  async execute(context) {
    throw new Error(`${this.name}.execute() must be implemented`);
  }

  /**
   * Run the agent with full tracing. This wraps execute() and logs everything.
   * @param {string} ticketId
   * @param {object} context
   * @returns {Promise<object>} - Agent output including trace info
   */
  async run(ticketId, context) {
    const startTime = Date.now();
    let output = null;
    let error = null;

    try {
      console.log(`🤖 [${this.name}] Starting for ticket ${ticketId}`);
      output = await this.execute(context);
      console.log(`✅ [${this.name}] Completed for ticket ${ticketId} (${Date.now() - startTime}ms)`);
    } catch (err) {
      error = err;
      console.error(`❌ [${this.name}] Failed for ticket ${ticketId}:`, err.message);
      output = { error: err.message, fallback: true };
    }

    const durationMs = Date.now() - startTime;

    // Write trace to Firestore
    const trace = await this.writeTrace(ticketId, context, output, durationMs);

    // Log to analytics
    analyticsService.logEvent({
      ticket_id: ticketId,
      event_type: `agent_${this.name.toLowerCase()}`,
      agent_name: this.name,
      status_from: context.currentStatus || null,
      status_to: output?.newStatus || null,
      timestamp: new Date().toISOString(),
      duration_ms: durationMs,
      metadata: { confidence: output?.confidence_score, error: error?.message },
    });

    return {
      ...output,
      _trace: trace,
      _duration_ms: durationMs,
      _agent: this.name,
    };
  }

  /**
   * Write an agent decision trace to Firestore
   */
  async writeTrace(ticketId, input, output, durationMs) {
    // Sanitize input to avoid storing large binary data
    const sanitizedInput = { ...input };
    delete sanitizedInput.imageBuffer;
    delete sanitizedInput.audioBuffer;
    if (sanitizedInput.images) {
      sanitizedInput.images = sanitizedInput.images.map((_, i) => `[image_${i}]`);
    }

    const traceData = {
      ticket_id: ticketId,
      agent_name: this.name,
      input: sanitizedInput,
      output: output || {},
      reasoning: output?.reasoning || output?.description || 'No reasoning provided',
      confidence: output?.confidence_score || null,
      duration_ms: durationMs,
    };

    try {
      return await firestoreService.writeTrace(traceData);
    } catch (err) {
      console.error(`Failed to write trace for ${this.name}:`, err.message);
      return traceData;
    }
  }
}

export default BaseAgent;
