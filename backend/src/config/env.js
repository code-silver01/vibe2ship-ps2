/**
 * CivicPulse — Environment Configuration
 * Centralizes all env var access with sensible defaults and mock-mode detection.
 */
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // API Keys
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || '',

  // Firebase Admin
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || 'civicpulse-demo',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
    privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  },

  // Mock mode: auto-detect if API keys are missing
  get useMock() {
    if (process.env.USE_MOCK === 'false') return false;
    if (process.env.USE_MOCK === 'true') return true;
    // Auto-detect: if Gemini key is missing, default to mock
    return !this.geminiApiKey;
  },

  // Agent thresholds
  confidenceThreshold: parseFloat(process.env.CONFIDENCE_THRESHOLD || '0.7'),
  dedupRadiusMeters: parseInt(process.env.DEDUP_RADIUS_METERS || '500', 10),
  dedupSimilarityThreshold: parseFloat(process.env.DEDUP_SIMILARITY_THRESHOLD || '0.8'),
  escalationCitizenThreshold: parseInt(process.env.ESCALATION_CITIZEN_THRESHOLD || '10', 10),
  slaBreachRiskThreshold: parseFloat(process.env.SLA_BREACH_RISK_THRESHOLD || '0.7'),
};

export default config;
