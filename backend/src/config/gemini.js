/**
 * CivicPulse — Gemini API Client Configuration
 * Wraps the @google/generative-ai SDK. Falls back to mock in mock mode.
 */
import { GoogleGenerativeAI } from '@google/generative-ai';
import config from './env.js';

let genAI = null;
let model = null;

if (!config.useMock && config.geminiApiKey) {
  genAI = new GoogleGenerativeAI(config.geminiApiKey);
  model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
}

export { genAI, model };
export default { genAI, model };
