/**
 * CivicPulse — Hash Chain Utility
 * Creates tamper-evident status logs using hash chaining.
 * Each status_log entry includes a SHA-256 hash of the previous entry,
 * making any retroactive modification detectable.
 */
import { createHash } from 'crypto';

/**
 * Generate SHA-256 hash of a string
 */
export function sha256(data) {
  return createHash('sha256').update(data).digest('hex');
}

/**
 * Create a new hash-chained status log entry
 * @param {object} params
 * @param {string} params.status - New status
 * @param {string} params.agent - Agent that made the change
 * @param {string} params.reasoning - Why this change was made
 * @param {Array} params.existingLog - Existing status_log array
 * @returns {object} New log entry with hash chain
 */
export function createStatusLogEntry({ status, agent, reasoning, existingLog = [] }) {
  const prevEntry = existingLog[existingLog.length - 1];
  const prevHash = prevEntry ? prevEntry.hash : '0'.repeat(64); // Genesis hash

  const timestamp = new Date().toISOString();
  const payload = JSON.stringify({ status, agent, reasoning, timestamp, prevHash });
  const hash = sha256(payload);

  return {
    status,
    agent,
    reasoning,
    timestamp,
    prev_hash: prevHash,
    hash,
  };
}

/**
 * Verify integrity of an entire status log chain
 * @param {Array} log - The status_log array to verify
 * @returns {{ valid: boolean, brokenAt: number|null }}
 */
export function verifyStatusLogChain(log) {
  for (let i = 0; i < log.length; i++) {
    const entry = log[i];
    const expectedPrevHash = i === 0 ? '0'.repeat(64) : log[i - 1].hash;

    if (entry.prev_hash !== expectedPrevHash) {
      return { valid: false, brokenAt: i };
    }

    // Recompute hash to verify it wasn't tampered
    const payload = JSON.stringify({
      status: entry.status,
      agent: entry.agent,
      reasoning: entry.reasoning,
      timestamp: entry.timestamp,
      prevHash: entry.prev_hash,
    });
    const expectedHash = sha256(payload);

    if (entry.hash !== expectedHash) {
      return { valid: false, brokenAt: i };
    }
  }
  return { valid: true, brokenAt: null };
}
