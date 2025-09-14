const express = require('express');
const { body, validationResult } = require('express-validator');
const OpenAI = require('openai');
const { authenticateToken, logActivity } = require('../middleware/auth');

const router = express.Router();

// Initialize OpenAI (only if API key is available)
let openai = null;
if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'dummy_key_for_development') {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
}

// System prompts
const CAREER_SYSTEM_PROMPT = `You are CampusPlacement AI, a helpful career guidance assistant for engineering students. Provide actionable advice on placements, higher studies, skills, and industry insights. Keep responses concise and practical.`;

const TRAINING_SYSTEM_PROMPT = `You are CampusPlacement AI, specializing in training and placement guidance. Focus on interview prep, resume tips, company research, skill assessment, and career planning.`;

const HIGHER_STUDIES_SYSTEM_PROMPT = `You are CampusPlacement AI, an expert in higher studies guidance. Provide advice on exams, university selection, scholarships, research, and application process.`;

// @route POST /api/chatbot/chat
router.post('/chat', [
  body('message').notEmpty().trim().withMessage('Message is required'),
  body('context').optional().isIn(['general', 'placement', 'higher-studies', 'training']).withMessage('Invalid context'),
  body('userId').optional().isMongoId().withMessage('Invalid user ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { message, context = 'general', userId } = req.body;

    // Check if OpenAI is available
    if (!openai) {
      return res.json({
        success: true,
        data: { 
          message: "I'm currently unavailable. Please contact the placement office for assistance with your career guidance needs.",
          context, 
          timestamp: new Date().toISOString(),
          note: "Chatbot service is temporarily disabled"
        }
      });
    }

    let systemPrompt = CAREER_SYSTEM_PROMPT;
    if (context === 'placement') systemPrompt = TRAINING_SYSTEM_PROMPT;
    else if (context === 'higher-studies') systemPrompt = HIGHER_STUDIES_SYSTEM_PROMPT;

    const conversation = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message }
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: conversation,
      max_tokens: 500,
      temperature: 0.7
    });

    const aiResponse = completion.choices[0].message.content;

    // Optional logging
    if (userId) logActivity('Chatbot Interaction')(req, res, () => {});

    res.json({
      success: true,
      data: { message: aiResponse, context, timestamp: new Date().toISOString() }
    });

  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get AI response',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route GET /api/chatbot/health
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Chatbot service is running',
    timestamp: new Date().toISOString(),
    features: [
      'General Career Guidance',
      'Placement Assistance',
      'Higher Studies Guidance'
    ]
  });
});

module.exports = router;
