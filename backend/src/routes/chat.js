import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = Router();
const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { message, history } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!genAI) {
      // Mock response if no key
      return res.json({
        reply: `[Mock AI] I received your message: "${message}". Please configure GEMINI_API_KEY for the real assistant.`
      });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Build chat history for context
    const chatContext = `
You are the CivicPulse AI Assistant, a helpful and professional city support agent.
You help citizens track tickets, report issues, and understand city guidelines.
Be concise, polite, and reassuring. Keep responses under 3 sentences unless explaining a complex rule.
Current User ID: ${req.user.uid}
    `;

    const chatHistory = [
      { role: 'user', parts: [{ text: chatContext }] },
      { role: 'model', parts: [{ text: 'Understood. I am the CivicPulse AI Assistant.' }] },
      ...(history || []).map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      })),
      { role: 'user', parts: [{ text: message }] }
    ];

    const result = await model.generateContent({
      contents: chatHistory,
      generationConfig: {
        temperature: 0.4,
      }
    });

    const reply = result.response.text();

    res.json({ reply });
  } catch (err) {
    console.error('Chat error:', err);
    if (err.status === 429) {
      return res.status(429).json({ error: 'Gemini API Rate Limit Exceeded. Please wait a minute before sending another message.' });
    }
    res.status(500).json({ error: 'Failed to generate response' });
  }
});

export default router;
