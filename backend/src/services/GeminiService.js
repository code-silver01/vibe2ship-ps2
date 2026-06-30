/**
 * CivicPulse — GeminiService
 * Wraps Google Gemini API for multimodal analysis.
 * All methods have mock fallbacks that return realistic sample data.
 */
import { model } from '../config/gemini.js';
import config from '../config/env.js';

class GeminiService {
  /**
   * Analyze an image/video for civic issue classification
   * @param {Buffer|string} imageData - Image buffer or base64 string
   * @param {string} textContext - Additional text description
   * @returns {Promise<{issue_type, severity_score, description, confidence_score, location_hints}>}
   */
  async analyzeImage(imageData, textContext = '') {
    if (config.useMock) {
      return this._mockAnalyzeImage(textContext);
    }

    const prompt = `You are a civic infrastructure analyst. Analyze this image of a reported civic issue.
Return a JSON object with these exact fields:
- issue_type: one of [pothole, water_leak, garbage_dump, streetlight_outage, sewage_overflow, road_damage, tree_fall, encroachment, noise_pollution, air_quality, drainage_block, footpath_damage, other]
- severity_score: number 0-10 (0=cosmetic, 10=life-threatening). Use visual cues like crack width, water spread area, garbage volume, etc.
- description: one-sentence description of what you see
- confidence_score: 0-1 how confident you are in the classification
- location_hints: any visible text/signs/landmarks that could help locate this

Additional context from reporter: ${textContext || 'None provided'}

Respond ONLY with valid JSON, no markdown formatting.`;

    try {
      const imagePart = {
        inlineData: {
          data: typeof imageData === 'string' ? imageData : imageData.toString('base64'),
          mimeType: 'image/jpeg',
        },
      };

      const result = await model.generateContent([prompt, imagePart]);
      const text = result.response.text();
      return JSON.parse(text.replace(/```json\n?/g, '').replace(/```\n?/g, ''));
    } catch (err) {
      console.error('Gemini analyzeImage error, falling back to mock:', err.message);
      return this._mockAnalyzeImage(textContext);
    }
  }

  /**
   * Transcribe voice recording and extract issue details
   * @param {Buffer|string} audioData - Audio buffer or base64
   * @param {string} language - Language code (en/hi/kn)
   * @returns {Promise<{transcript, issue_type, severity_score, confidence_score}>}
   */
  async transcribeVoice(audioData, language = 'en') {
    if (config.useMock) {
      return this._mockTranscribeVoice(language);
    }

    const prompt = `Transcribe this audio recording of a civic issue complaint. The language is ${language}.
Return a JSON object with:
- transcript: full transcription in the original language
- transcript_en: English translation if not in English
- issue_type: classified issue type (one of: pothole, water_leak, garbage_dump, streetlight_outage, sewage_overflow, road_damage, tree_fall, encroachment, noise_pollution, air_quality, drainage_block, footpath_damage, other)
- severity_score: estimated severity 0-10 based on described urgency
- confidence_score: 0-1

Respond ONLY with valid JSON.`;

    try {
      const audioPart = {
        inlineData: {
          data: typeof audioData === 'string' ? audioData : audioData.toString('base64'),
          mimeType: 'audio/webm',
        },
      };
      const result = await model.generateContent([prompt, audioPart]);
      const text = result.response.text();
      return JSON.parse(text.replace(/```json\n?/g, '').replace(/```\n?/g, ''));
    } catch (err) {
      console.error('Gemini transcribeVoice error, falling back to mock:', err.message);
      return this._mockTranscribeVoice(language);
    }
  }

  /**
   * Compare before/after images for issue verification
   * @param {Buffer|string} beforeImage
   * @param {Buffer|string} afterImage
   * @param {string} issueType
   * @returns {Promise<{match_score, verified, reasoning}>}
   */
  async compareImages(beforeImage, afterImage, issueType) {
    if (config.useMock) {
      return this._mockCompareImages(issueType);
    }

    const prompt = `You are verifying a civic issue resolution. Compare these two images:
- Image 1 (BEFORE): Shows the original reported issue (${issueType})
- Image 2 (AFTER): Shows the current state after repair work

Return a JSON object with:
- match_score: 0-1 how well the repair addresses the original issue (1 = fully fixed)
- verified: boolean - true if the issue appears genuinely resolved
- reasoning: one-sentence explanation of your assessment

Respond ONLY with valid JSON.`;

    try {
      const before = {
        inlineData: {
          data: typeof beforeImage === 'string' ? beforeImage : beforeImage.toString('base64'),
          mimeType: 'image/jpeg',
        },
      };
      const after = {
        inlineData: {
          data: typeof afterImage === 'string' ? afterImage : afterImage.toString('base64'),
          mimeType: 'image/jpeg',
        },
      };

      const result = await model.generateContent([prompt, before, after]);
      const text = result.response.text();
      return JSON.parse(text.replace(/```json\n?/g, '').replace(/```\n?/g, ''));
    } catch (err) {
      console.error('Gemini compareImages error, falling back to mock:', err.message);
      return this._mockCompareImages(issueType);
    }
  }

  // ── Mock Responses ──────────────────────────────────────────────

  _mockAnalyzeImage(textContext = '') {
    const types = ['pothole', 'water_leak', 'garbage_dump', 'road_damage', 'streetlight_outage'];
    const issueType = types[Math.floor(Math.random() * types.length)];
    const severity = Math.round((3 + Math.random() * 7) * 10) / 10;
    const descriptions = {
      pothole: `Medium-sized pothole approximately ${(20 + Math.random() * 40).toFixed(0)}cm wide with crumbling edges`,
      water_leak: `Water pipe leak with visible water spread of approximately ${(1 + Math.random() * 5).toFixed(1)} meters`,
      garbage_dump: `Unauthorized garbage dump with mixed waste including plastic and organic matter`,
      road_damage: `Road surface degradation with visible cracks spanning ${(0.5 + Math.random() * 3).toFixed(1)} meters`,
      streetlight_outage: `Non-functional streetlight on a main road, creating a dark zone of ~${(10 + Math.random() * 30).toFixed(0)}m`,
    };
    return {
      issue_type: issueType,
      severity_score: severity,
      description: descriptions[issueType] || 'Civic infrastructure issue detected',
      confidence_score: 0.75 + Math.random() * 0.2,
      location_hints: 'Near residential area, visible road markings',
    };
  }

  _mockTranscribeVoice(language) {
    const transcripts = {
      en: 'There is a big pothole on the main road near the park. It has been here for two weeks and is getting worse.',
      hi: 'पार्क के पास मुख्य सड़क पर एक बड़ा गड्ढा है। यह दो हफ्ते से है और बढ़ता जा रहा है।',
      kn: 'ಪಾರ್ಕ್ ಬಳಿ ಮುಖ್ಯ ರಸ್ತೆಯಲ್ಲಿ ದೊಡ್ಡ ಗುಂಡಿ ಇದೆ. ಇದು ಎರಡು ವಾರಗಳಿಂದ ಇದ್ದು ಹದಗೆಡುತ್ತಿದೆ.',
    };
    return {
      transcript: transcripts[language] || transcripts.en,
      transcript_en: transcripts.en,
      issue_type: 'pothole',
      severity_score: 6.5,
      confidence_score: 0.82,
    };
  }

  _mockCompareImages(issueType) {
    const verified = Math.random() > 0.3; // 70% chance of verification passing
    return {
      match_score: verified ? 0.85 + Math.random() * 0.15 : 0.2 + Math.random() * 0.3,
      verified,
      reasoning: verified
        ? `The ${issueType} appears to have been properly repaired. The affected area shows clear improvement.`
        : `The ${issueType} repair appears incomplete. Visible signs of the original issue remain.`,
    };
  }
}

// Singleton export
export default new GeminiService();
