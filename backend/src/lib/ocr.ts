/**
 * ClearMed OCR Engine — Phase 2
 * Primary: Tesseract.js (free, local)
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
  engine: 'tesseract' | 'google_vision' | 'manual';
  processingMs: number;
}

// ── Tesseract OCR (local, no API key needed) ─────────────────────────────
async function runTesseract(filePath: string): Promise<{ text: string; confidence: number }> {
  try {
    const { createWorker } = await import('tesseract.js');
    const worker = await createWorker('eng');
    const { data } = await worker.recognize(filePath);
    await worker.terminate();
    return { text: data.text, confidence: (data.confidence || 0) / 100 };
  } catch (err) {
    throw new Error(`Tesseract failed: ${(err as Error).message}`);
  }
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
  let engine: OcrOutput['engine'] = 'tesseract';

  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.pdf') {
    return createManualReviewOutput('PDF files are queued for manual review');
  }

  try {
    const result = await runTesseract(filePath);
    rawText = result.text;
    confidence = result.confidence;
    engine = 'tesseract';
  } catch (tesseractErr) {
    console.warn('[OCR] Tesseract failed, trying Google Vision:', (tesseractErr as Error).message);
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
    // FIX: was 'OCR_PROCESSING', correct OcrStatus enum value is 'PROCESSING'
    await prisma.ocrResult.upsert({
      where: { billId },
      update: { status: 'PROCESSING' },
      create: { billId, status: 'PROCESSING' },
    });

    const ocrOutput = await processImageWithOcr(filePath);
    const status = ocrOutput.engine === 'manual' ? 'MANUAL_REVIEW' : 'COMPLETED';

    // FIX: removed 'rawText' which does not exist on OcrResult model
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