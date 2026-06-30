/**
 * CivicPulse — EmbeddingService
 * In-memory cosine-similarity vector service with a Vertex AI-compatible interface.
 * To swap to real Vertex AI, replace getEmbedding() with a Vertex API call.
 */
import { createHash } from 'crypto';

const EMBEDDING_DIM = 768;

class EmbeddingService {
  constructor() {
    // In-memory vector store: { ticketId: { embedding: number[], location: {lat, lng} } }
    this.store = new Map();
  }

  /**
   * Generate a pseudo-embedding from image data.
   * In production, this would call Vertex AI's multimodal embedding API.
   * Mock: creates a deterministic 768-dim vector from a hash of the input.
   *
   * @param {Buffer|string} data - Image buffer, base64 string, or text
   * @returns {Promise<number[]>} 768-dimensional embedding vector
   */
  async getEmbedding(data) {
    const input = typeof data === 'string' ? data : data.toString('base64').slice(0, 200);
    const hash = createHash('sha256').update(input).digest('hex');

    // Convert hash to deterministic float vector
    const embedding = [];
    for (let i = 0; i < EMBEDDING_DIM; i++) {
      // Use overlapping 4-char windows from repeated hash
      const hexChars = hash.slice((i * 2) % 60, ((i * 2) % 60) + 4) || hash.slice(0, 4);
      const val = parseInt(hexChars, 16);
      // Normalize to [-1, 1] range
      embedding.push((val / 65535) * 2 - 1);
    }

    // L2-normalize the vector
    const norm = Math.sqrt(embedding.reduce((sum, v) => sum + v * v, 0));
    return embedding.map((v) => v / norm);
  }

  /**
   * Compute cosine similarity between two vectors
   * @param {number[]} a
   * @param {number[]} b
   * @returns {number} Similarity score in [-1, 1]
   */
  cosineSimilarity(a, b) {
    if (a.length !== b.length) throw new Error('Vector dimension mismatch');
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Store an embedding for a ticket
   * @param {string} ticketId
   * @param {number[]} embedding
   * @param {{ lat: number, lng: number }} location
   */
  addToStore(ticketId, embedding, location) {
    this.store.set(ticketId, { embedding, location });
  }

  /**
   * Remove a ticket from the store
   */
  removeFromStore(ticketId) {
    this.store.delete(ticketId);
  }

  /**
   * Find similar tickets within a geographic radius
   * @param {number[]} queryEmbedding - The embedding to compare against
   * @param {{ lat: number, lng: number }} queryLocation - Location to search around
   * @param {number} radiusMeters - Search radius in meters
   * @param {number} similarityThreshold - Minimum cosine similarity (0-1)
   * @param {string[]} excludeIds - Ticket IDs to exclude
   * @returns {Array<{ ticketId: string, similarity: number, distance: number }>}
   */
  findSimilar(queryEmbedding, queryLocation, radiusMeters = 500, similarityThreshold = 0.8, excludeIds = []) {
    const results = [];
    const toRad = (deg) => (deg * Math.PI) / 180;

    for (const [ticketId, entry] of this.store) {
      if (excludeIds.includes(ticketId)) continue;

      // Calculate geographic distance (Haversine)
      const R = 6371000;
      const dLat = toRad(entry.location.lat - queryLocation.lat);
      const dLng = toRad(entry.location.lng - queryLocation.lng);
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(queryLocation.lat)) *
          Math.cos(toRad(entry.location.lat)) *
          Math.sin(dLng / 2) ** 2;
      const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

      if (distance > radiusMeters) continue;

      // Calculate embedding similarity
      const similarity = this.cosineSimilarity(queryEmbedding, entry.embedding);

      if (similarity >= similarityThreshold) {
        results.push({ ticketId, similarity, distance: Math.round(distance) });
      }
    }

    // Sort by similarity descending
    return results.sort((a, b) => b.similarity - a.similarity);
  }
}

// Singleton export
export default new EmbeddingService();
