import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

const router = Router();

// Multer config — store in memory for base64 conversion
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, WebP, GIF images and PDF files are accepted'));
    }
  },
});

const SUPPORTED_LANGUAGES: Record<string, string> = {
  en: 'English',
  hi: 'Hindi',
  ta: 'Tamil',
  te: 'Telugu',
  bn: 'Bengali',
  mr: 'Marathi',
  gu: 'Gujarati',
  kn: 'Kannada',
  ml: 'Malayalam',
  pa: 'Punjabi',
};

const buildPrompt = (language: string) => `You are an expert medical report analyzer. Analyze the uploaded medical report image or pdf thoroughly and provide a detailed analysis.

Respond ENTIRELY in ${SUPPORTED_LANGUAGES[language] || 'English'}.

Return your response as valid JSON with this exact structure:
{
  "patientInfo": {
    "name": "patient name or 'Not Available'",
    "age": "age or 'Not Available'",
    "gender": "gender or 'Not Available'",
    "date": "report date or 'Not Available'",
    "referredBy": "doctor name or 'Not Available'",
    "labName": "laboratory name or 'Not Available'"
  },
  "reportType": "Type of report (e.g., Complete Blood Count, Lipid Profile, Thyroid Panel, etc.)",
  "testResults": [
    {
      "testName": "name of the test/parameter",
      "value": "measured value with unit",
      "unit": "measurement unit",
      "referenceRange": "normal range",
      "status": "NORMAL | HIGH | LOW | CRITICAL",
      "interpretation": "brief 1-line interpretation of this specific value"
    }
  ],
  "summary": "A comprehensive 3-5 sentence summary of the overall report findings",
  "keyFindings": ["list of important findings that need attention"],
  "recommendations": ["list of actionable health recommendations based on the results"],
  "urgencyLevel": "ROUTINE | ATTENTION_NEEDED | URGENT | CRITICAL",
  "disclaimer": "This is an AI-generated analysis for informational purposes only. Always consult a qualified healthcare professional for medical advice."
}

Be thorough — extract every test parameter visible in the report. If a value is abnormal, clearly explain why in the interpretation field.`;

// ─── Analyze report ────────────────────────────────────────────────────────
router.post('/analyze', upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded. Please upload an image or PDF.' });
      return;
    }

    const language = (req.body.language as string) || 'en';
    if (!SUPPORTED_LANGUAGES[language]) {
      res.status(400).json({ error: `Unsupported language. Supported: ${Object.keys(SUPPORTED_LANGUAGES).join(', ')}` });
      return;
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: 'OpenAI API key not configured on server.' });
      return;
    }

    const openai = new OpenAI({ apiKey });

    // Convert file to base64
    const base64 = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype;
    const dataUrl = `data:${mimeType};base64,${base64}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: buildPrompt(language) },
            { type: 'image_url', image_url: { url: dataUrl, detail: 'high' } },
          ],
        },
      ],
    });

    const content = response.choices[0]?.message?.content || '';

    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    let analysis;
    try {
      analysis = JSON.parse(jsonStr);
    } catch {
      // If JSON parsing fails, return raw text
      analysis = {
        summary: content,
        testResults: [],
        keyFindings: ['Could not parse structured data from this report. Please try a clearer document.'],
        recommendations: [],
        urgencyLevel: 'ROUTINE',
        disclaimer: 'This is an AI-generated analysis for informational purposes only.',
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

// ─── Get supported languages ───────────────────────────────────────────────
router.get('/languages', (_req: Request, res: Response) => {
  res.json({ data: SUPPORTED_LANGUAGES });
});

export default router;
