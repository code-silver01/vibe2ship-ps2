/**
 * CivicPulse — State Definitions
 * Defines valid ticket states and transition rules for the Orchestrator.
 */

export const STATES = {
  INTAKE: 'intake',
  DEDUP_CHECK: 'dedup_check',
  ROUTING: 'routing',
  ACTIVE: 'active',
  IN_PROGRESS: 'in_progress',
  PENDING_VERIFICATION: 'pending_verification',
  PENDING_CITIZEN_APPROVAL: 'pending_citizen_approval',
  VERIFIED: 'verified',
  CLOSED: 'closed',
  HUMAN_REVIEW: 'human_review',
  MERGED: 'merged',
};

/**
 * Valid state transitions: { fromState: [toState1, toState2, ...] }
 */
export const TRANSITIONS = {
  [STATES.INTAKE]: [STATES.DEDUP_CHECK, STATES.HUMAN_REVIEW],
  [STATES.DEDUP_CHECK]: [STATES.ROUTING, STATES.MERGED],
  [STATES.ROUTING]: [STATES.ACTIVE],
  [STATES.ACTIVE]: [STATES.IN_PROGRESS, STATES.PENDING_CITIZEN_APPROVAL],
  [STATES.IN_PROGRESS]: [STATES.PENDING_VERIFICATION, STATES.PENDING_CITIZEN_APPROVAL],
  [STATES.PENDING_VERIFICATION]: [STATES.VERIFIED, STATES.IN_PROGRESS],
  [STATES.PENDING_CITIZEN_APPROVAL]: [STATES.ACTIVE, STATES.IN_PROGRESS],
  [STATES.VERIFIED]: [STATES.CLOSED],
  [STATES.CLOSED]: [], // Terminal state
  [STATES.HUMAN_REVIEW]: [STATES.DEDUP_CHECK, STATES.CLOSED],
  [STATES.MERGED]: [], // Terminal state
};

/**
 * Check if a state transition is valid
 */
export function isValidTransition(from, to) {
  const allowed = TRANSITIONS[from];
  return allowed && allowed.includes(to);
}

/**
 * Get human-readable state label
 */
export function getStateLabel(state) {
  const labels = {
    [STATES.INTAKE]: 'Intake & Analysis',
    [STATES.DEDUP_CHECK]: 'Checking for Duplicates',
    [STATES.ROUTING]: 'Routing to Department',
    [STATES.ACTIVE]: 'Active — Awaiting Action',
    [STATES.IN_PROGRESS]: 'In Progress',
    [STATES.PENDING_VERIFICATION]: 'Pending Verification',
    [STATES.PENDING_CITIZEN_APPROVAL]: 'Awaiting Your Approval',
    [STATES.VERIFIED]: 'Verified — Resolved',
    [STATES.CLOSED]: 'Closed',
    [STATES.HUMAN_REVIEW]: 'Under Human Review',
    [STATES.MERGED]: 'Merged with Existing Report',
  };
  return labels[state] || state;
}
