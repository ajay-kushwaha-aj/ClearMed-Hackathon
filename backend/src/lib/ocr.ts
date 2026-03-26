/**
 * ClearMed OCR Engine — Phase 2
 * Primary: OCR.space (free cloud API)
 * Fallback: Google Vision API (paid, higher accuracy)
 */

import path from 'path';
import fs from 'fs';
import { detectAndRemovePii, extractBillData, ExtractedBillData } from './pii';

export interface OcrOutput {
  rawText: string;
  redactedText: string;
  extractedData: ExtractedBillData;
  piiFieldsFound: string[];
  confidence: number;
  engine: 'tesseract' | 'google_vision' | 'ocr_space' | 'manual';
  processingMs: number;
}

// ── OCR.space API (Free Cloud OCR) ────────────────────────────────────────
async function runOcrSpace(filePath: string): Promise<{ text: string; confidence: number }> {
  const apiKey = process.env.OCR_SPACE_API_KEY;
  if (!apiKey) throw new Error('OCR_SPACE_API_KEY not configured');

  const formData = new FormData();
  formData.append('apikey', apiKey);
  formData.append('isTable', 'true');
  formData.append('OCREngine', '2'); // Engine 2 is much better for Bills and Receipts

  // Read file from disk and convert to Blob to bypass Base64 size limits
  const fileBuffer = fs.readFileSync(filePath);
  let mimeType = 'application/octet-stream';
  if (filePath.toLowerCase().endsWith('.pdf')) mimeType = 'application/pdf';
  if (filePath.toLowerCase().endsWith('.png')) mimeType = 'image/png';
  if (filePath.toLowerCase().endsWith('.jpg') || filePath.toLowerCase().endsWith('.jpeg')) mimeType = 'image/jpeg';

  const blob = new Blob([fileBuffer], { type: mimeType });
  formData.append('file', blob, path.basename(filePath));

  const response = await fetch('https://api.ocr.space/parse/image', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) throw new Error(`OCR.space HTTP error: ${response.statusText}`);

  const result = await response.json() as any;
  if (result.IsErroredOnProcessing) {
    throw new Error(`OCR.space processing error: ${result.ErrorMessage?.[0]}`);
  }

  // Map through ALL pages of the bill, not just the first page
  const text = result.ParsedResults?.map((page: any) => page.ParsedText).join('\n\n') || '';

  return { text, confidence: 0.85 };
}

// ── Google Vision API (paid fallback, higher accuracy) ───────────────────
async function runGoogleVision(filePath: string): Promise<{ text: string; confidence: number }> {
  const apiKey = process.env.GOOGLE_VISION_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_VISION_API_KEY not configured');

  const imageBytes = fs.readFileSync(filePath);
  const base64Image = imageBytes.toString('base64');

  const requestBody = {
    requests: [{
      image: { content: base64Image },
      features: [{ type: 'DOCUMENT_TEXT_DETECTION', maxResults: 1 }]
    }]
  };

  const response = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody) }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google Vision API error: ${error}`);
  }

  const result = await response.json() as {
    responses?: Array<{
      fullTextAnnotation?: { text: string; pages?: Array<{ confidence?: number }> };
      error?: { message: string };
    }>;
  };

  if (result.responses?.[0]?.error) {
    throw new Error(`Vision API error: ${result.responses[0].error.message}`);
  }

  const annotation = result.responses?.[0]?.fullTextAnnotation;
  if (!annotation?.text) throw new Error('No text detected by Vision API');

  return { text: annotation.text, confidence: annotation.pages?.[0]?.confidence ?? 0.8 };
}

// ── Main OCR dispatcher ───────────────────────────────────────────────────
// ── Main OCR dispatcher ───────────────────────────────────────────────────
export async function processImageWithOcr(filePath: string): Promise<OcrOutput> {
  const startTime = Date.now();
  let rawText = '';
  let confidence = 0;
  let engine: OcrOutput['engine'] = 'ocr_space';

  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  try {
    const result = await runOcrSpace(filePath);
    rawText = result.text;
    confidence = result.confidence;
    engine = 'ocr_space';
  } catch (ocrSpaceErr) {
    console.warn('[OCR] OCR.space failed, trying Google Vision:', (ocrSpaceErr as Error).message);
    try {
      const result = await runGoogleVision(filePath);
      rawText = result.text;
      confidence = result.confidence;
      engine = 'google_vision';
    } catch (visionErr) {
      console.warn('[OCR] Google Vision also failed:', (visionErr as Error).message);
      return createManualReviewOutput('Both OCR engines failed — sent to manual review');
    }
  }

  // 1. Remove Patient PII (HIPAA Compliance)
  const piiResult = detectAndRemovePii(rawText);
  let extractedData: ExtractedBillData = { confidence: 0 };

  // 2. SMART EXTRACTION: Use Groq to pull exactly what the form needs
  const groqApiKey = process.env.GROQ_API_KEY;
  if (groqApiKey && piiResult.redactedText.length > 50) {
    try {
      console.log(`[OCR] 🧠 Sending redacted text to Groq for smart extraction...`);
      const prompt = `You are an expert medical billing assistant. Extract the billing details from the following hospital bill text.
      
      RULES:
      1. Map the hospital's location to the exact official Indian State name (e.g., "Delhi", "Maharashtra").
      2. Identify the main treatment or surgery name.
      3. Categorize costs accurately. If a cost is missing, return null. 
      4. Return ONLY valid JSON with this exact structure:
      {
        "hospitalName": "string", "city": "string", "state": "string", "treatmentName": "string", "doctorName": "string",
        "totalCost": 0, "roomCharges": 0, "surgeryFee": 0, "implantCost": 0, "pharmacyCost": 0,
        "pathologyCost": 0, "radiologyCost": 0, "gst": 0, "otherCharges": 0,
        "admissionDate": "YYYY-MM-DD", "dischargeDate": "YYYY-MM-DD", "stayDays": 0
      }`;

      const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${groqApiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: prompt },
            { role: 'user', content: piiResult.redactedText }
          ],
          temperature: 0.1
        })
      });

      const groqJson = await groqRes.json() as any;
      let jsonStr = groqJson.choices[0].message.content;
      jsonStr = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();

      const parsedData = JSON.parse(jsonStr);
      extractedData = { ...parsedData, confidence: 0.95 }; // Groq is highly confident

    } catch (error) {
      console.error("[OCR] ⚠️ Groq extraction failed, falling back to basic regex.", error);
      extractedData = extractBillData(piiResult.redactedText); // Safely fall back to old regex
    }
  } else {
    extractedData = extractBillData(piiResult.redactedText); // Fall back if no API key
  }

  const processingMs = Date.now() - startTime;

  return {
    rawText,
    redactedText: piiResult.redactedText,
    extractedData,
    piiFieldsFound: piiResult.fieldsFound,
    confidence: (confidence + extractedData.confidence) / 2,
    engine,
    processingMs,
  };
}

function createManualReviewOutput(_reason: string): OcrOutput {
  return {
    rawText: '',
    redactedText: '',
    extractedData: { confidence: 0 },
    piiFieldsFound: [],
    confidence: 0,
    engine: 'manual',
    processingMs: 0,
  };
}

// ── Async OCR queue processor ─────────────────────────────────────────────
export async function processOcrInBackground(
  billId: string,
  filePath: string,
  prisma: import('@prisma/client').PrismaClient
): Promise<void> {
  try {
    await prisma.ocrResult.upsert({
      where: { billId },
      update: { status: 'PROCESSING' },
      create: { billId, status: 'PROCESSING' },
    });

    const ocrOutput = await processImageWithOcr(filePath);
    const status = ocrOutput.engine === 'manual' ? 'MANUAL_REVIEW' : 'COMPLETED';

    await prisma.ocrResult.update({
      where: { billId },
      data: {
        status,
        extractedData: ocrOutput.extractedData as object,
        confidence: ocrOutput.confidence,
        piiRemoved: ocrOutput.piiFieldsFound.length > 0,
        piiFields: ocrOutput.piiFieldsFound as unknown as object,
        ocrEngine: ocrOutput.engine,
        processingMs: ocrOutput.processingMs,
      },
    });

    if (
      ocrOutput.extractedData.totalCost &&
      ocrOutput.confidence > 0.6 &&
      status === 'COMPLETED'
    ) {
      const d = ocrOutput.extractedData;
      await prisma.bill.update({
        where: { id: billId },
        data: {
          totalCost: d.totalCost,
          roomCharges: d.roomCharges,
          implantCost: d.implantCost,
          surgeryFee: d.surgeryFee,
          pharmacyCost: d.pharmacyCost,
          admissionDate: d.admissionDate ? new Date(d.admissionDate) : undefined,
          dischargeDate: d.dischargeDate ? new Date(d.dischargeDate) : undefined,
          stayDays: d.stayDays,
          status: 'BILL_OCR_REVIEW',
        },
      });
    }

    console.log(`[OCR] Bill ${billId} processed: ${status}, confidence: ${ocrOutput.confidence.toFixed(2)}, engine: ${ocrOutput.engine}`);
  } catch (err) {
    console.error(`[OCR] Failed for bill ${billId}:`, (err as Error).message);
    await prisma.ocrResult.update({
      where: { billId },
      data: { status: 'FAILED', errorMessage: (err as Error).message },
    }).catch(() => { });
  }
}