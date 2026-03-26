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
export async function processImageWithOcr(filePath: string): Promise<OcrOutput> {
  const startTime = Date.now();
  let rawText = '';
  let confidence = 0;
  let engine: OcrOutput['engine'] = 'ocr_space'; // Defaulting to ocr_space

  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  // NOTE: We completely removed the PDF block here so OCR.space can read them!

  try {
    // 1. Try OCR.space first
    const result = await runOcrSpace(filePath);
    rawText = result.text;
    confidence = result.confidence;
    engine = 'ocr_space';
  } catch (ocrSpaceErr) {
    console.warn('[OCR] OCR.space failed, trying Google Vision:', (ocrSpaceErr as Error).message);
    try {
      // 2. Fallback to Google Vision if OCR.space fails or hits rate limits
      const result = await runGoogleVision(filePath);
      rawText = result.text;
      confidence = result.confidence;
      engine = 'google_vision';
    } catch (visionErr) {
      console.warn('[OCR] Google Vision also failed:', (visionErr as Error).message);
      return createManualReviewOutput('Both OCR engines failed — sent to manual review');
    }
  }

  const piiResult = detectAndRemovePii(rawText);
  const extractedData = extractBillData(piiResult.redactedText);
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