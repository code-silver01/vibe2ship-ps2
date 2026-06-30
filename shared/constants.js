/**
 * CivicPulse — Shared Constants
 * Used by both frontend and backend
 */

const TICKET_STATUS = {
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

const ISSUE_TYPES = {
  POTHOLE: 'pothole',
  WATER_LEAK: 'water_leak',
  GARBAGE_DUMP: 'garbage_dump',
  STREETLIGHT: 'streetlight_outage',
  SEWAGE: 'sewage_overflow',
  ROAD_DAMAGE: 'road_damage',
  TREE_FALL: 'tree_fall',
  ENCROACHMENT: 'encroachment',
  NOISE: 'noise_pollution',
  AIR_QUALITY: 'air_quality',
  DRAINAGE: 'drainage_block',
  FOOTPATH: 'footpath_damage',
  OTHER: 'other',
};

const RISK_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

const USER_ROLES = {
  CITIZEN: 'citizen',
  OFFICIAL: 'official',
  ADMIN: 'admin',
};

const AGENT_NAMES = {
  INTAKE: 'IntakeAgent',
  DEDUPLICATION: 'DeduplicationAgent',
  ROUTING: 'RoutingAgent',
  RISK_PREDICTION: 'RiskPredictionAgent',
  ESCALATION: 'EscalationAgent',
  VERIFICATION: 'VerificationAgent',
  ORCHESTRATOR: 'Orchestrator',
};

const CONFIDENCE_THRESHOLD = 0.7;
const DEDUP_RADIUS_METERS = 500;
const DEDUP_SIMILARITY_THRESHOLD = 0.8;
const ESCALATION_CITIZEN_THRESHOLD = 10;
const SLA_BREACH_RISK_THRESHOLD = 0.7;

const LANGUAGES = {
  en: 'English',
  hi: 'हिन्दी',
  kn: 'ಕನ್ನಡ',
};

// Export for both CJS and ESM
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    TICKET_STATUS, ISSUE_TYPES, RISK_LEVELS, USER_ROLES, AGENT_NAMES,
    CONFIDENCE_THRESHOLD, DEDUP_RADIUS_METERS, DEDUP_SIMILARITY_THRESHOLD,
    ESCALATION_CITIZEN_THRESHOLD, SLA_BREACH_RISK_THRESHOLD, LANGUAGES,
  };
}

export {
  TICKET_STATUS, ISSUE_TYPES, RISK_LEVELS, USER_ROLES, AGENT_NAMES,
  CONFIDENCE_THRESHOLD, DEDUP_RADIUS_METERS, DEDUP_SIMILARITY_THRESHOLD,
  ESCALATION_CITIZEN_THRESHOLD, SLA_BREACH_RISK_THRESHOLD, LANGUAGES,
};
