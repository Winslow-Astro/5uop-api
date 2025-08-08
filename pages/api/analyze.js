import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Fallback advice mapping for each tag
const FALLBACK_ADVICE = {
  FLOW: "Take long walks by a river or stream",
  CHAOS: "Spend an afternoon in a busy airport terminal", 
  SQUEEZE: "Watch disturbing documentaries about real injustice",
  STABILITY: "Watch time-lapse videos of construction projects",
  EXPANSION: "Visit a courthouse during active trials"
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  const { text } = req.body;

  if (!text || text.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Text is required'
    });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "ft:gpt-4o-mini-2024-07-18:winslowastro:5uop-v1:C2H74ZwQ",
      messages: [
        {
          role: "system",
          content: "Analyze human behavior using 5UOP framework (FLOW, CHAOS, SQUEEZE, STABILITY, EXPANSION). You must respond with valid JSON containing: primary_tag, secondary_tag (if applicable), interpretation, and advice. The advice field must never be empty."
        },
        {
          role: "user",
          content: text.trim()
        }
      ],
      temperature: 0.7,
      max_tokens: 400
    });

    const responseContent = completion.choices[0].message.content;
    let analysis = JSON.parse(responseContent);
    
    // Use fallback advice if model's advice is empty or missing
    if (!analysis.advice || analysis.advice.trim() === '') {
      analysis.advice = FALLBACK_ADVICE[analysis.primary_tag] || "Try a new approach to this situation";
    }

    return res.status(200).json({
      success: true,
      data: analysis
    });

  } catch (error) {
    console.error('API Error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Analysis failed'
    });
  }
}
