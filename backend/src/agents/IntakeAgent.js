/**
 * CivicPulse — IntakeAgent
 * Accepts multimodal input (image/video/voice/text), calls Gemini for:
 * issue_type, severity_score, location, confidence_score.
 * If confidence < threshold, flags for human review instead of auto-proceeding.
 */
import BaseAgent from './BaseAgent.js';
import geminiService from '../services/GeminiService.js';
import config from '../config/env.js';

class IntakeAgent extends BaseAgent {
  constructor() {
    super('IntakeAgent');
  }

  /**
   * @param {object} context
   * @param {Buffer|string} [context.imageData] - Image data
   * @param {Buffer|string} [context.audioData] - Voice recording
   * @param {string} [context.textDescription] - Text description
   * @param {string} [context.language] - Language code (en/hi/kn)
   * @param {{ lat: number, lng: number }} [context.location] - Reporter's location
   * @returns {Promise<object>} Analyzed ticket data
   */
  async execute(context) {
    const { imageData, audioData, textDescription, language = 'en', location } = context;

    let analysis = {};
    let voiceTranscript = null;

    // Step 1: Analyze image if provided
    if (imageData) {
      analysis = await geminiService.analyzeImage(imageData, textDescription);
    }

    // Step 2: Transcribe voice if provided
    if (audioData) {
      voiceTranscript = await geminiService.transcribeVoice(audioData, language);

      // Merge voice analysis with image analysis (image takes priority for type/severity)
      if (!analysis.issue_type) {
        analysis.issue_type = voiceTranscript.issue_type;
      }
      if (!analysis.severity_score) {
        analysis.severity_score = voiceTranscript.severity_score;
      }
      // Average confidence if both exist
      if (analysis.confidence_score && voiceTranscript.confidence_score) {
        analysis.confidence_score = (analysis.confidence_score + voiceTranscript.confidence_score) / 2;
      } else if (!analysis.confidence_score) {
        analysis.confidence_score = voiceTranscript.confidence_score;
      }
    }

    // Step 3: Use text description as fallback if no media
    if (!imageData && !audioData && textDescription) {
      analysis = {
        issue_type: this._inferTypeFromText(textDescription),
        severity_score: 5.0, // Default medium severity for text-only
        description: textDescription,
        confidence_score: 0.5, // Lower confidence for text-only
        location_hints: '',
      };
    }

    // Step 4: Determine if human review is needed
    const confidence = analysis.confidence_score || 0;
    const needsHumanReview = confidence < config.confidenceThreshold;

    const result = {
      issue_type: analysis.issue_type || 'other',
      severity_score: analysis.severity_score || 5.0,
      description: analysis.description || textDescription || 'Civic issue reported',
      confidence_score: confidence,
      location_hints: analysis.location_hints || '',
      voice_transcript: voiceTranscript?.transcript || null,
      voice_transcript_en: voiceTranscript?.transcript_en || null,
      needs_human_review: needsHumanReview,
      newStatus: needsHumanReview ? 'human_review' : 'dedup_check',
      reasoning: needsHumanReview
        ? `Confidence score ${confidence.toFixed(2)} is below threshold ${config.confidenceThreshold}. Flagging for human review.`
        : `Classified as ${analysis.issue_type} with severity ${analysis.severity_score}/10 (confidence: ${confidence.toFixed(2)}). Proceeding to deduplication check.`,
    };

    return result;
  }

  /**
   * Simple keyword-based type inference for text-only reports
   */
  _inferTypeFromText(text) {
    const lower = text.toLowerCase();
    const keywords = {
      pothole: ['pothole', 'pit', 'hole in road', 'गड्ढा', 'ಗುಂಡಿ'],
      water_leak: ['water leak', 'pipe burst', 'water flowing', 'पानी', 'ನೀರು'],
      garbage_dump: ['garbage', 'trash', 'waste', 'dump', 'कचरा', 'ಕಸ'],
      streetlight_outage: ['streetlight', 'light not working', 'dark road', 'बत्ती', 'ದೀಪ'],
      sewage_overflow: ['sewage', 'drain overflow', 'sewer', 'नाला', 'ಒಳಚರಂಡಿ'],
      road_damage: ['road damage', 'broken road', 'crack', 'सड़क', 'ರಸ್ತೆ'],
      tree_fall: ['tree fall', 'fallen tree', 'branch', 'पेड़', 'ಮರ'],
      drainage_block: ['drainage', 'drain block', 'clogged', 'नाली', 'ಚರಂಡಿ'],
    };

    for (const [type, words] of Object.entries(keywords)) {
      if (words.some((w) => lower.includes(w))) return type;
    }
    return 'other';
  }
}

export default new IntakeAgent();
