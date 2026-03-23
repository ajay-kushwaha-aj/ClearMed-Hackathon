/**
 * ClearMed PII Detection & Removal Engine
 * Phase 2 — Automatically redacts sensitive patient information from OCR text
 */

export interface PiiDetectionResult {
  hasPii: boolean;
  fieldsFound: string[];
  redactedText: string;
  confidenceScore: number;
}

// ── Regex patterns for Indian medical bill PII ────────────────────────────
const PII_PATTERNS: Record<string, RegExp[]> = {
  patientName: [
    /patient\s*name\s*[:\-]?\s*([A-Z][a-zA-Z\s\.]{2,40})/gi,
    /name\s*[:\-]\s*([A-Z][a-zA-Z\s\.]{2,40})/gi,
    /mr\.?\s+([A-Z][a-zA-Z\s]{2,30})/gi,
    /mrs\.?\s+([A-Z][a-zA-Z\s]{2,30})/gi,
    /ms\.?\s+([A-Z][a-zA-Z\s]{2,30})/gi,
    /dr\.?\s+([A-Z][a-zA-Z\s]{2,30})(?=\s+patient)/gi,
  ],
  phoneNumber: [
    /(?:\+91|91|0)?[6-9]\d{9}/g,
    /\b\d{3}[-.\s]\d{3}[-.\s]\d{4}\b/g,
    /mobile\s*[:\-]?\s*(\+?[\d\s\-]{10,14})/gi,
    /phone\s*[:\-]?\s*(\+?[\d\s\-]{10,14})/gi,
    /contact\s*[:\-]?\s*(\+?[\d\s\-]{10,14})/gi,
  ],
  address: [
    /address\s*[:\-]\s*(.+?)(?=\n|city|pin|state|$)/gi,
    /\bh\.?no\.?\s*\d+[,\s]/gi,
    /flat\s*no\.?\s*\d+/gi,
    /\bplot\s+no\.?\s*[\dA-Z]+/gi,
    /\d+[,\s]+[A-Z][a-zA-Z\s]+(?:road|street|nagar|colony|sector|lane|marg)\b/gi,
  ],
  patientId: [
    /patient\s*id\s*[:\-]?\s*([\w\d\-\/]+)/gi,
    /patient\s*no\.?\s*[:\-]?\s*([\w\d\-\/]+)/gi,
    /uhid\s*[:\-]?\s*([\w\d\-\/]+)/gi,
    /mrn\s*[:\-]?\s*([\w\d\-\/]+)/gi,
    /reg\.?\s*no\.?\s*[:\-]?\s*([\w\d\-\/]+)/gi,
    /registration\s*no\.?\s*[:\-]?\s*([\w\d\-\/]+)/gi,
    /ip\s*no\.?\s*[:\-]?\s*([\w\d\-\/]+)/gi,
    /op\s*no\.?\s*[:\-]?\s*([\w\d\-\/]+)/gi,
  ],
  insuranceId: [
    /policy\s*no\.?\s*[:\-]?\s*([\w\d\-\/]+)/gi,
    /insurance\s*id\s*[:\-]?\s*([\w\d\-\/]+)/gi,
    /tpa\s*id\s*[:\-]?\s*([\w\d\-\/]+)/gi,
    /claim\s*no\.?\s*[:\-]?\s*([\w\d\-\/]+)/gi,
    /insured\s*id\s*[:\-]?\s*([\w\d\-\/]+)/gi,
  ],
  email: [
    /\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Z|a-z]{2,}\b/g,
  ],
  aadhaar: [
    /\b\d{4}\s?\d{4}\s?\d{4}\b/g,
    /aadhaar\s*[:\-]?\s*(\d[\d\s]{10,14}\d)/gi,
  ],
  pan: [
    /\b[A-Z]{5}\d{4}[A-Z]\b/g,
  ],
  dob: [
    /dob\s*[:\-]?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/gi,
    /date\s+of\s+birth\s*[:\-]?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/gi,
    /born\s*[:\-]?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/gi,
  ],
  age: [
    /\bage\s*[:\-]?\s*(\d{1,3})\s*(yrs?|years?)?\b/gi,
  ],
};

// Replacement tokens for each PII field
const REDACTION_TOKENS: Record<string, string> = {
  patientName: '[PATIENT NAME REDACTED]',
  phoneNumber: '[PHONE REDACTED]',
  address: '[ADDRESS REDACTED]',
  patientId: '[PATIENT ID REDACTED]',
  insuranceId: '[INSURANCE ID REDACTED]',
  email: '[EMAIL REDACTED]',
  aadhaar: '[AADHAAR REDACTED]',
  pan: '[PAN REDACTED]',
  dob: '[DOB REDACTED]',
  age: '[AGE REDACTED]',
};

export function detectAndRemovePii(text: string): PiiDetectionResult {
  let redactedText = text;
  const fieldsFound: string[] = [];
  let totalMatches = 0;

  for (const [fieldName, patterns] of Object.entries(PII_PATTERNS)) {
    let fieldFound = false;
    for (const pattern of patterns) {
      const matches = redactedText.match(pattern);
      if (matches && matches.length > 0) {
        fieldFound = true;
        totalMatches += matches.length;
        redactedText = redactedText.replace(pattern, REDACTION_TOKENS[fieldName]);
      }
    }
    if (fieldFound) fieldsFound.push(fieldName);
  }

  // Calculate confidence: higher if more PII fields found (bill likely real)
  const confidenceScore = Math.min(1.0, fieldsFound.length * 0.15 + 0.1);

  return {
    hasPii: fieldsFound.length > 0,
    fieldsFound,
    redactedText,
    confidenceScore,
  };
}

// ── Extract structured data from OCR text ────────────────────────────────
export interface ExtractedBillData {
  hospitalName?: string;
  city?: string;
  treatmentName?: string;
  doctorName?: string;
  totalCost?: number;
  roomCharges?: number;
  surgeryFee?: number;
  implantCost?: number;
  pharmacyCost?: number;
  otherCharges?: number;
  admissionDate?: string;
  dischargeDate?: string;
  stayDays?: number;
  pathologyCost?: number;
  radiologyCost?: number;
  gst?: number;
  confidence: number;
}

const COST_PATTERNS = [
  /total\s*(?:amount|bill|charges?|cost)\s*[:\-]?\s*(?:rs\.?|₹|inr)?\s*([\d,]+(?:\.\d{1,2})?)/gi,
  /grand\s*total\s*[:\-]?\s*(?:rs\.?|₹|inr)?\s*([\d,]+(?:\.\d{1,2})?)/gi,
  /net\s*(?:amount|payable)\s*[:\-]?\s*(?:rs\.?|₹|inr)?\s*([\d,]+(?:\.\d{1,2})?)/gi,
  /amount\s*(?:paid|payable)\s*[:\-]?\s*(?:rs\.?|₹|inr)?\s*([\d,]+(?:\.\d{1,2})?)/gi,
  /(?:rs\.?|₹|inr)\s*([\d,]{4,}(?:\.\d{1,2})?)\s*(?:only|\/)?/gi,
];

const ROOM_PATTERNS = [
  /room\s*(?:rent|charges?|tariff)\s*[:\-]?\s*(?:rs\.?|₹)?\s*([\d,]+)/gi,
  /bed\s*charges?\s*[:\-]?\s*(?:rs\.?|₹)?\s*([\d,]+)/gi,
  /accommodation\s*[:\-]?\s*(?:rs\.?|₹)?\s*([\d,]+)/gi,
];

const SURGERY_PATTERNS = [
  /(?:surgery|operation|surgical|procedure|ot)\s*(?:charges?|fees?)\s*[:\-]?\s*(?:rs\.?|₹)?\s*([\d,]+)/gi,
  /surgeon\s*(?:fee|charges?)\s*[:\-]?\s*(?:rs\.?|₹)?\s*([\d,]+)/gi,
  /operation\s*theatre\s*[:\-]?\s*(?:rs\.?|₹)?\s*([\d,]+)/gi,
  /ot\s*charges?\s*[:\-]?\s*(?:rs\.?|₹)?\s*([\d,]+)/gi,
];

const IMPLANT_PATTERNS = [
  /implant\s*[:\-]?\s*(?:rs\.?|₹)?\s*([\d,]+)/gi,
  /prosthesis\s*[:\-]?\s*(?:rs\.?|₹)?\s*([\d,]+)/gi,
  /device\s*cost\s*[:\-]?\s*(?:rs\.?|₹)?\s*([\d,]+)/gi,
  /stent\s*(?:cost|charges?)?\s*[:\-]?\s*(?:rs\.?|₹)?\s*([\d,]+)/gi,
  /implantable\s*(?:device)?\s*[:\-]?\s*(?:rs\.?|₹)?\s*([\d,]+)/gi,
];

const PHARMACY_PATTERNS = [
  /pharmacy\s*[:\-]?\s*(?:rs\.?|₹)?\s*([\d,]+)/gi,
  /medicine[s]?\s*[:\-]?\s*(?:rs\.?|₹)?\s*([\d,]+)/gi,
  /drug[s]?\s*(?:charges?)?\s*[:\-]?\s*(?:rs\.?|₹)?\s*([\d,]+)/gi,
];

const DATE_PATTERNS = [
  /(?:admission|admit|date\s+of\s+admission)\s*[:\-]?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/gi,
  /(?:doa|admitted\s+on)\s*[:\-]?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/gi,
];

const DISCHARGE_PATTERNS = [
  /(?:discharge|discharged|date\s+of\s+discharge)\s*[:\-]?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/gi,
  /(?:dod|discharged\s+on)\s*[:\-]?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/gi,
];

const PATHOLOGY_PATTERNS = [
  /(?:pathology|lab(?:oratory)?|tests?|investigations?)\s*(?:charges?)?\s*[:\-]?\s*(?:rs\.?|₹)?\s*([\d,]+)/gi,
  /blood\s*tests?\s*[:\-]?\s*(?:rs\.?|₹)?\s*([\d,]+)/gi,
];

const RADIOLOGY_PATTERNS = [
  /(?:radiology|x-?ray|scan|mri|ct\s*scan|ultrasound)\s*(?:charges?)?\s*[:\-]?\s*(?:rs\.?|₹)?\s*([\d,]+)/gi,
];

const GST_PATTERNS = [
  /(?:gst|cgst|sgst|igst|tax)\s*(?:amount)?\s*[:\-]?\s*(?:rs\.?|₹)?\s*([\d,]+(?:\.\d{1,2})?)/gi,
];

const DOCTOR_PATTERNS = [
  /(?:consultant|treating|attending)\s*doctor\s*[:\-]?\s*(dr\.?\s*[A-Z][a-zA-Z\s\.]{2,30})/gi,
  /dr\.?\s+([A-Z][a-zA-Z\s\.]{2,30})(?=\s+[A-Z]|\s*$|\s*,)/gm,
];

function parseAmount(match: string): number | undefined {
  const cleaned = match.replace(/[,\s]/g, '');
  const val = parseFloat(cleaned);
  // Sanity check: medical bills are between ₹500 and ₹50L
  if (!isNaN(val) && val >= 500 && val <= 5000000) return val;
  return undefined;
}

function extractFirst(text: string, patterns: RegExp[]): number | undefined {
  for (const pattern of patterns) {
    pattern.lastIndex = 0;
    const match = pattern.exec(text);
    if (match?.[1]) {
      const val = parseAmount(match[1]);
      if (val) return val;
    }
  }
  return undefined;
}

function extractDate(text: string, patterns: RegExp[]): string | undefined {
  for (const pattern of patterns) {
    pattern.lastIndex = 0;
    const match = pattern.exec(text);
    if (match?.[1]) {
      const raw = match[1].trim();
      // Try to normalize to YYYY-MM-DD
      const parts = raw.split(/[\/\-\.]/);
      if (parts.length === 3) {
        const [d, m, y] = parts;
        const year = y.length === 2 ? `20${y}` : y;
        const month = m.padStart(2, '0');
        const day = d.padStart(2, '0');
        const date = new Date(`${year}-${month}-${day}`);
        if (!isNaN(date.getTime()) && date.getFullYear() > 2000) {
          return date.toISOString().split('T')[0];
        }
      }
      return raw;
    }
  }
  return undefined;
}

export function extractBillData(text: string): ExtractedBillData {
  const data: ExtractedBillData = { confidence: 0 };
  let fieldsExtracted = 0;

  // Total cost
  data.totalCost = extractFirst(text, COST_PATTERNS);
  if (data.totalCost) fieldsExtracted++;

  // Cost breakdown
  data.roomCharges = extractFirst(text, ROOM_PATTERNS);
  if (data.roomCharges) fieldsExtracted++;

  data.surgeryFee = extractFirst(text, SURGERY_PATTERNS);
  if (data.surgeryFee) fieldsExtracted++;

  data.implantCost = extractFirst(text, IMPLANT_PATTERNS);
  if (data.implantCost) fieldsExtracted++;

  data.pharmacyCost = extractFirst(text, PHARMACY_PATTERNS);
  if (data.pharmacyCost) fieldsExtracted++;

  // Dates
  data.admissionDate = extractDate(text, DATE_PATTERNS);
  if (data.admissionDate) fieldsExtracted++;

  data.dischargeDate = extractDate(text, DISCHARGE_PATTERNS);
  if (data.dischargeDate) fieldsExtracted++;

  // Calculate stay days
  if (data.admissionDate && data.dischargeDate) {
    const admit = new Date(data.admissionDate);
    const discharge = new Date(data.dischargeDate);
    const diffMs = discharge.getTime() - admit.getTime();
    const days = Math.round(diffMs / (1000 * 60 * 60 * 24));
    if (days > 0 && days < 365) data.stayDays = days;
  }

  // New fields
  data.pathologyCost = extractFirst(text, PATHOLOGY_PATTERNS);
  if (data.pathologyCost) fieldsExtracted++;

  data.radiologyCost = extractFirst(text, RADIOLOGY_PATTERNS);
  if (data.radiologyCost) fieldsExtracted++;

  data.gst = extractFirst(text, GST_PATTERNS);
  if (data.gst) fieldsExtracted++;

  // Doctor name (first match after PII removal)
  for (const pattern of DOCTOR_PATTERNS) {
    pattern.lastIndex = 0;
    const match = pattern.exec(text);
    if (match?.[1]) {
      data.doctorName = match[1].trim().replace(/\s+/g, ' ');
      fieldsExtracted++;
      break;
    }
  }

  // Confidence: 0–1 based on fields successfully extracted
  data.confidence = Math.min(1.0, fieldsExtracted / 5);

  return data;
}
