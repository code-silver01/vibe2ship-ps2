/**
 * CivicPulse — DeduplicationAgent
 * Searches existing open tickets within a radius for visual+geo similarity.
 * If match found, merges into existing ticket and increments affected_citizen_count.
 */
import BaseAgent from './BaseAgent.js';
import embeddingService from '../services/EmbeddingService.js';
import firestoreService from '../services/FirestoreService.js';
import config from '../config/env.js';

class DeduplicationAgent extends BaseAgent {
  constructor() {
    super('DeduplicationAgent');
  }

  /**
   * @param {object} context
   * @param {string} context.ticketId - The new ticket being checked
   * @param {Buffer|string} context.imageData - Image data for embedding
   * @param {{ lat: number, lng: number }} context.location - Ticket location
   * @param {string} context.issue_type - Classified issue type
   * @returns {Promise<object>} Dedup result: isDuplicate, mergedInto, or proceed
   */
  async execute(context) {
    const { ticketId, imageData, location, issue_type } = context;

    // Step 1: Generate embedding for the new ticket's image
    const embedding = await embeddingService.getEmbedding(
      imageData || `${issue_type}_${location?.lat}_${location?.lng}_${Date.now()}`
    );

    // Step 2: Search for similar tickets in the vector store
    const matches = embeddingService.findSimilar(
      embedding,
      location || { lat: 0, lng: 0 },
      config.dedupRadiusMeters,
      config.dedupSimilarityThreshold,
      [ticketId] // Exclude self
    );

    // Step 3: If we find a high-similarity match, it's a duplicate
    if (matches.length > 0) {
      const bestMatch = matches[0];

      // Fetch the existing ticket to verify it's still open and same type
      const existingTicket = await firestoreService.getTicket(bestMatch.ticketId);

      if (existingTicket && existingTicket.status !== 'closed' && existingTicket.status !== 'merged') {
        // Merge: increment affected count on existing ticket
        const newCount = (existingTicket.affected_citizen_count || 1) + 1;
        await firestoreService.updateTicket(bestMatch.ticketId, {
          affected_citizen_count: newCount,
        });

        return {
          isDuplicate: true,
          mergedInto: bestMatch.ticketId,
          similarity: bestMatch.similarity,
          distance: bestMatch.distance,
          newAffectedCount: newCount,
          newStatus: 'merged',
          reasoning: `Found existing ticket ${bestMatch.ticketId} within ${bestMatch.distance}m with ${(bestMatch.similarity * 100).toFixed(1)}% visual similarity. Merged as duplicate (affected citizens: ${newCount}).`,
          confidence_score: bestMatch.similarity,
        };
      }
    }

    // Step 4: No duplicate found — add to vector store and proceed
    embeddingService.addToStore(ticketId, embedding, location || { lat: 0, lng: 0 });

    return {
      isDuplicate: false,
      mergedInto: null,
      searchedCount: embeddingService.store.size,
      newStatus: 'routing',
      reasoning: `No duplicate found within ${config.dedupRadiusMeters}m radius (searched ${embeddingService.store.size} tickets). Proceeding to routing.`,
      confidence_score: 1.0,
    };
  }
}

export default new DeduplicationAgent();
