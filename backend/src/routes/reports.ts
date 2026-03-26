import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';

const router = Router();

// Multer config — store in memory for buffer usage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, WebP, GIF images and PDFs are accepted'));
    }
  },
});

const SUPPORTED_LANGUAGES: Record<string, string> = {
  en: 'English', hi: 'Hindi', ta: 'Tamil', te: 'Telugu', bn: 'Bengali',
  mr: 'Marathi', gu: 'Gujarati', kn: 'Kannada', ml: 'Malayalam', pa: 'Punjabi',
};

const buildPrompt = (language: string) => `You are an expert medical report analyzer. Analyze the provided medical report text thoroughly.

Respond ENTIRELY in ${SUPPORTED_LANGUAGES[language] || 'English'}.

Return your response as valid JSON with this exact structure:
{
  "patientInfo": { "name": "string", "age": "string", "gender": "string", "date": "string", "referredBy": "string", "labName": "string" },
  "reportType": "string",
  "testResults": [
    { "testName": "string", "value": "string", "unit": "string", "referenceRange": "string", "status": "NORMAL | HIGH | LOW | CRITICAL", "interpretation": "string" }
  ],
  "overallAnalysis": { "conditions": [ { "name": "string", "likelihood": "High | Moderate | Low" } ], "topDepartment": "string" },
  "summary": "string",
  "keyFindings": ["string"],
  "recommendations": ["string"],
  "urgencyLevel": "ROUTINE | ATTENTION_NEEDED | URGENT | CRITICAL",
  "disclaimer": "This is an AI-generated analysis. Always consult a doctor."
}
Keep the JSON structure strict and without markdown code blocks.`;

// ─── Analyze report (OCR.space + Groq Text) ───────────────────────────
router.post('/analyze', upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded. Please upload an image or PDF.' });
      return;
    }

    const language = (req.body.language as string) || 'en';
    const groqApiKey = process.env.GROQ_API_KEY;
    const ocrApiKey = process.env.OCR_SPACE_API_KEY;

    if (!groqApiKey || !ocrApiKey) {
      res.status(500).json({ error: 'API Keys (Groq or OCR.space) not configured on server.' });
      return;
    }

    // --- FIX 2: Use FormData to prevent Base64 size limits ---
    const formData = new FormData();
    formData.append('apikey', ocrApiKey);
    formData.append('isTable', 'true');
    formData.append('OCREngine', '2'); // Engine 2 is much better for medical tables/numbers

    // Convert multer buffer to a Blob for FormData
    const blob = new Blob([req.file.buffer], { type: req.file.mimetype });
    formData.append('file', blob, req.file.originalname);

    const ocrResponse = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      body: formData,
    });

    if (!ocrResponse.ok) throw new Error(`OCR.space HTTP error: ${ocrResponse.statusText}`);

    const ocrResult = await ocrResponse.json() as any;
    if (ocrResult.IsErroredOnProcessing) throw new Error(`OCR error: ${ocrResult.ErrorMessage?.[0]}`);

    // --- FIX 1: Map through ALL pages of a PDF to grab all text ---
    const extractedText = ocrResult.ParsedResults?.map((page: any) => page.ParsedText).join('\n\n') || '';

    if (!extractedText || extractedText.trim().length < 10) {
      res.status(422).json({ error: "Could not read text from this file. Please try a clearer document." });
      return;
    }

    // --- Send the extracted text to Groq ---
    const promptText = buildPrompt(language);
    const requestBody = {
      model: 'llama-3.3-70b-versatile', // Groq's super fast text model
      messages: [
        { role: 'user', content: `${promptText}\n\nHere is the raw text extracted from the report:\n\n${extractedText}` }
      ],
      temperature: 0.1
    };

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!groqResponse.ok) {
      const errText = await groqResponse.text();
      throw new Error(`Groq API Error: ${errText}`);
    }

    const result = await groqResponse.json() as any;
    let content = result.choices[0].message.content;

    let jsonStr = content.trim();
    jsonStr = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();

    let analysis;
    try {
      analysis = JSON.parse(jsonStr);
    } catch {
      analysis = {
        summary: content,
        testResults: [],
        keyFindings: ['Could not parse structured data from this report.'],
        recommendations: [],
        urgencyLevel: 'ROUTINE',
        disclaimer: 'This is an AI-generated analysis.',
      };
    }

    res.json({
      data: {
        ...analysis,
        language: SUPPORTED_LANGUAGES[language],
        fileName: req.file.originalname,
        fileSize: req.file.size,
        analyzedAt: new Date().toISOString(),
      }
    });
  } catch (err: any) {
    if (err.message?.includes('accepted')) {
      res.status(400).json({ error: err.message });
      return;
    }
    console.error('Report analysis error:', err);
    next(err);
  }
});

// ─── Chat about report ─────────────────────────────
router.post('/chat', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { message, reportContext, language = 'en' } = req.body;
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      res.status(500).json({ error: 'GROQ_API_KEY Setup Missing' });
      return;
    }

    const prompt = `You are a friendly, empathetic, and highly knowledgeable medical assistant talking directly to a patient. 
Your goal is to explain their medical report in simple, reassuring, and everyday language that anyone can easily understand. 
Avoid dense medical jargon. If you must use a medical term, explain it simply. 
Speak in a warm, human, conversational tone—as if you're a caring doctor explaining results to a patient face-to-face. 
Do NOT just output robotic bulleted lists. Use natural, conversational paragraphs and keep it easy to digest.

Here are the patient's report details:
${JSON.stringify(reportContext)}

IMPORTANT: Respond entirely and strictly in ${SUPPORTED_LANGUAGES[language] || 'English'}. 
Always remind the patient gently to consult their actual doctor for a final diagnosis.`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: message }
        ],
        temperature: 0.5
      })
    });

    const result = await response.json() as any;
    res.json({ data: { reply: result.choices[0].message.content } });
  } catch (err) {
    next(err);
  }
});

router.get('/languages', (_req: Request, res: Response) => {
  res.json({ data: SUPPORTED_LANGUAGES });
});

export default router;