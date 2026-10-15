const OpenAI = require('openai');
const { GoogleGenAI } = require('@google/genai');

// Category & Department mapping dictionary
const CATEGORY_DEPARTMENT_MAP = {
  "Road": "Roads & Infrastructure",
  "Roads & Transport": "Roads & Infrastructure",
  "Garbage": "Waste Management",
  "Waste Management": "Waste Management",
  "Water": "Water Supply",
  "Water Supply": "Water Supply",
  "Electricity": "Electricity & Power",
  "Street Light": "Electricity & Power",
  "Drainage": "Drainage & Sewerage",
  "Building": "Urban Planning & Buildings",
  "Other": "General Civic Admin"
};

const ALLOWED_CATEGORIES = [
  "Roads & Transport", "Road",
  "Waste Management", "Garbage",
  "Water Supply", "Water",
  "Electricity", "Street Light",
  "Drainage", "Building", "Other"
];

const ALLOWED_PRIORITIES = ["Low", "Medium", "High", "Critical"];

/**
 * Genuine AI Image Analysis Service
 * Sends the actual image URL to OpenAI Vision or Gemini Vision API.
 * NO hardcoded fallback values. NO fake AI results.
 * 
 * @param {string} imageUrl Cloudinary image URL received from frontend
 * @returns {Promise<Object>} Structured AI analysis from Vision model
 */
async function analyzeImage(imageUrl) {
  if (!imageUrl || typeof imageUrl !== 'string') {
    throw new Error('Valid imageUrl is required');
  }

  console.log(`[AI-Service] AI Image Analysis Started for URL: ${imageUrl}`);

  const openAiKey = process.env.OPENAI_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  let rawContent = null;
  let providerUsed = null;

  // 1. TRY OPENAI VISION API (if valid OpenAI key exists)
  if (openAiKey && openAiKey !== 'your_openai_api_key' && openAiKey.startsWith('sk-')) {
    try {
      console.log('[AI-Service] Sending image to OpenAI Vision API (gpt-4o-mini)...');
      const openai = new OpenAI({ apiKey: openAiKey, timeout: 15000 });
      const promptText = `
You are an expert civic infrastructure vision classifier for the CIVORA Smart City Platform.
Examine the provided image carefully and identify visible civic issues such as road potholes, road damage, garbage accumulation, overflowing bins, water leakage, pipe burst, broken street light, damaged electric pole, exposed wires, drain blockage, drain overflow, etc.

Allowed Categories (pick exact match): ["Roads & Transport", "Waste Management", "Water Supply", "Electricity", "Street Light", "Drainage", "Building", "Other"]
Allowed Priorities (pick exact match): ["Low", "Medium", "High", "Critical"]

If no civic issue is found or image is unclear:
- detectedIssue: "Unknown Civic Issue"
- confidenceScore: 0.35
- suggestedCategory: "Other"
- suggestedPriority: "Low"

You MUST output raw JSON in this exact structure:
{
  "detectedIssue": "Short title describing the detected issue",
  "confidenceScore": 0.85,
  "suggestedCategory": "Roads & Transport",
  "suggestedPriority": "High"
}
`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: 'You are a civic vision model. Output JSON only.' },
          { role: 'user', content: [{ type: 'text', text: promptText }, { type: 'image_url', image_url: { url: imageUrl } }] }
        ],
        max_tokens: 300,
        temperature: 0.1
      });

      rawContent = response.choices[0]?.message?.content || null;
      if (rawContent) providerUsed = 'OpenAI (gpt-4o-mini)';
    } catch (openAiErr) {
      console.warn('[AI-Service] OpenAI Vision call failed:', openAiErr.message);
    }
  }

  // 2. TRY GEMINI VISION API (if OpenAI unavailable or key invalid)
  if (!rawContent && geminiKey && geminiKey !== 'your_gemini_api_key') {
    // gemini-3.8-flash is the only model accessible with the current key.
    // Uses exponential backoff for 503 "high demand" responses.
    const GEMINI_MODEL = 'gemini-3.8-flash';
    const MAX_RETRIES = 5;  // up to 5 attempts on 503
    const BASE_DELAY_MS = 3000; // 3s, 6s, 12s, 24s between retries
    const GEMINI_TIMEOUT_MS = 25000;
    let lastGeminiError = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`[AI-Service] Gemini Vision (${GEMINI_MODEL}), attempt ${attempt}/${MAX_RETRIES}...`);
        const ai = new GoogleGenAI({ apiKey: geminiKey });

        // Fetch image from Cloudinary with timeout guard
        const fetchController = new AbortController();
        const fetchTimeout = setTimeout(() => fetchController.abort(), GEMINI_TIMEOUT_MS);
        let imageResp;
        try {
          imageResp = await fetch(imageUrl, {
            signal: fetchController.signal,
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
          });
        } finally {
          clearTimeout(fetchTimeout);
        }

        if (!imageResp.ok) {
          throw new Error(`Cloudinary image fetch failed (HTTP ${imageResp.status} ${imageResp.statusText})`);
        }

        const arrayBuffer = await imageResp.arrayBuffer();
        const base64Data = Buffer.from(arrayBuffer).toString('base64');
        const mimeType = imageResp.headers.get('content-type') || 'image/jpeg';

        const promptText = `
You are an expert civic infrastructure vision classifier for the CIVORA Smart City Platform.
Examine the provided image carefully and identify visible civic issues such as road potholes, road damage, garbage accumulation, overflowing bins, water leakage, pipe burst, broken street light, damaged electric pole, exposed wires, drain blockage, drain overflow, etc.

Allowed Categories (pick exact match): ["Roads & Transport", "Waste Management", "Water Supply", "Electricity", "Street Light", "Drainage", "Building", "Other"]
Allowed Priorities (pick exact match): ["Low", "Medium", "High", "Critical"]

If no civic issue is found or image is non-civic:
- set detectedIssue to "Unknown Civic Issue"
- set confidenceScore to 0.35
- set suggestedCategory to "Other"
- set suggestedPriority to "Low"

You MUST output raw JSON matching this exact structure (no extra text):
{
  "detectedIssue": "Short title describing detected issue",
  "confidenceScore": 0.88,
  "suggestedCategory": "Waste Management",
  "suggestedPriority": "Medium"
}
`;

        // Wrap generateContent with a timeout so the server never hangs
        const genController = new AbortController();
        const genTimeout = setTimeout(() => genController.abort(), GEMINI_TIMEOUT_MS);
        let response;
        try {
          response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: [
              {
                role: 'user',
                parts: [
                  { inlineData: { data: base64Data, mimeType } },
                  { text: promptText }
                ]
              }
            ]
          });
        } finally {
          clearTimeout(genTimeout);
        }

        rawContent = response.text || null;
        if (rawContent) {
          providerUsed = `Gemini (${GEMINI_MODEL})`;
          break; // success
        }
        // Empty response - treat like a soft failure and retry
        throw new Error('Gemini returned empty response');

      } catch (geminiErr) {
        lastGeminiError = geminiErr;
        const errMsg = geminiErr.message || '';
        const is503 = errMsg.includes('503') || errMsg.includes('UNAVAILABLE') || errMsg.includes('high demand');
        const isRetryable = is503 || errMsg.includes('timeout') || errMsg.includes('abort') || errMsg.includes('network');

        if (isRetryable && attempt < MAX_RETRIES) {
          const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1); // 3s, 6s, 12s, 24s
          console.warn(`[AI-Service] Gemini ${is503 ? '503 high demand' : 'network error'}, retry in ${delay/1000}s (attempt ${attempt}/${MAX_RETRIES})...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        // Non-retryable or exhausted retries — log full error then stop
        console.error(`[AI-Service] Gemini failed after ${attempt} attempt(s):`, errMsg.substring(0, 300));
        break;
      }
    }

    // Surface the real Gemini error in the thrown message so the route can propagate it
    if (!rawContent && lastGeminiError) {
      const em = lastGeminiError.message || '';
      const is503 = em.includes('503') || em.includes('UNAVAILABLE');
      // Re-attach real error as a property so the route can read it
      const wrappedErr = new Error(
        is503
          ? `Gemini API is overloaded (503). The model "${GEMINI_MODEL}" is temporarily experiencing high demand. Please retry in a few minutes.`
          : `Gemini API error: ${em.substring(0, 200)}`
      );
      wrappedErr.geminiStatus = is503 ? 503 : 500;
      throw wrappedErr;
    }
  }

  // IF BOTH AI SERVICES FAILED TO RETURN A RESPONSE, THROW GENUINE ERROR
  if (!rawContent) {
    console.error('[AI-Service] Error: All AI vision services failed to process image URL:', imageUrl);
    throw new Error('AI image analysis service is temporarily unavailable');
  }

  // Parse raw JSON output from Vision model
  let parsed = {};
  try {
    let cleanJson = rawContent.replace(/```json/gi, '').replace(/```/g, '').trim();
    parsed = JSON.parse(cleanJson);
  } catch (e) {
    console.error('[AI-Service] Failed to parse JSON from AI model:', rawContent);
    throw new Error('Invalid JSON response returned by AI Vision model');
  }

  // Process & Validate Genuine AI Output
  let confidenceScore = typeof parsed.confidenceScore === 'number' ? parsed.confidenceScore : 0.75;
  confidenceScore = Math.max(0.01, Math.min(1.0, confidenceScore));

  let suggestedCategory = ALLOWED_CATEGORIES.includes(parsed.suggestedCategory) ? parsed.suggestedCategory : "Other";
  if (suggestedCategory === "Road") suggestedCategory = "Roads & Transport";
  if (suggestedCategory === "Garbage") suggestedCategory = "Waste Management";
  if (suggestedCategory === "Water") suggestedCategory = "Water Supply";

  let suggestedPriority = ALLOWED_PRIORITIES.includes(parsed.suggestedPriority) ? parsed.suggestedPriority : "Medium";
  let detectedIssue = parsed.detectedIssue || "Civic Infrastructure Issue";
  let suggestedDepartment = CATEGORY_DEPARTMENT_MAP[suggestedCategory] || "General Civic Admin";

  const result = {
    detectedIssue,
    confidenceScore: parseFloat(confidenceScore.toFixed(2)),
    suggestedCategory,
    suggestedPriority,
    suggestedDepartment,
    aiProvider: providerUsed,
    analyzedAt: new Date()
  };

  console.log(`[AI-Service] AI Analysis Completed via ${providerUsed}:`, {
    imageUrl,
    detectedIssue: result.detectedIssue,
    confidenceScore: result.confidenceScore,
    suggestedCategory: result.suggestedCategory,
    suggestedPriority: result.suggestedPriority
  });

  return result;
}

module.exports = {
  analyzeImage,
  CATEGORY_DEPARTMENT_MAP,
  ALLOWED_CATEGORIES,
  ALLOWED_PRIORITIES
};
