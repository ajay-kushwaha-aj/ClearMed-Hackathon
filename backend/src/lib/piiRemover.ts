/**
 * PII Remover — ClearMed Phase 2
 * Strips patient-identifying information from OCR-extracted bill text.
 * Multi-layer approach: regex patterns + keyword proximity + structure detection.
 */

export interface PiiRemovalResult {
  cleanedText: string;
  fieldsFound: string[];
  removalCount: number;
}

// ── Patterns ────────────────────────────────────────────────────────────────

const PATTERNS: Array<{ name: string; regex: RegExp; replacement: string }> = [
  // Phone numbers (Indian formats)
  { name: 'phone', regex: /(?:\+91[-\s]?)?[6-9]\d{9}/g, replacement: '[PHONE REMOVED]' },
  { name: 'phone_formatted', regex: /\b\d{3,4}[-\s]\d{3,4}[-\s]\d{3,4}\b/g, replacement: '[PHONE REMOVED]' },

  // Aadhaar (12-digit, sometimes formatted)
  { name: 'aadhaar', regex: /\b\d{4}\s\d{4}\s\d{4}\b/g, replacement: '[AADHAAR REMOVED]' },
  { name: 'aadhaar_raw', regex: /\b(?:aadhaar|aadhar|uid)[\s:]*\d{12}\b/gi, replacement: '[AADHAAR REMOVED]' },

  // PAN card
  { name: 'pan', regex: /\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b/g, replacement: '[PAN REMOVED]' },

  // Email addresses
  { name: 'email', regex: /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g, replacement: '[EMAIL REMOVED]' },

  // Indian PIN codes when labeled
  { name: 'pincode_labeled', regex: /(?:pin(?:code)?|zip)[\s:]*\d{6}\b/gi, replacement: '[PINCODE REMOVED]' },

  // Patient ID / MRN / UHID
  { name: 'patient_id', regex: /(?:patient\s*id|pat\s*id|mrn|uhid|reg\.?\s*no\.?|ip\s*no\.?|op\s*no\.?)[\s:]*[\w\-\/]{3,20}/gi, replacement: '[PATIENT ID REMOVED]' },

  // Insurance policy number
  { name: 'policy', regex: /(?:policy\s*(?:no\.?|number)|insurance\s*(?:id|no\.?))[\s:]*[\w\-\/]{5,25}/gi, replacement: '[POLICY NO REMOVED]' },

  // TPA / insurance member ID
  { name: 'tpa_id', regex: /(?:tpa\s*id|member\s*id|card\s*no\.?)[\s:]*[\w\-]{5,20}/gi, replacement: '[MEMBER ID REMOVED]' },

  // Date of Birth (various formats)
  { name: 'dob', regex: /(?:d\.?o\.?b\.?|date\s+of\s+birth|born)[\s:]*\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/gi, replacement: '[DOB REMOVED]' },

  // Patient address lines (multi-pattern)
  { name: 'address_labeled', regex: /(?:address|addr|residence)[\s:]+[^\n]{10,100}/gi, replacement: '[ADDRESS REMOVED]' },
  { name: 'guardian', regex: /(?:guardian|relative|attendant|spouse|son\s+of|wife\s+of|d\/o|s\/o|w\/o)[\s:]+[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}/g, replacement: '[RELATION REMOVED]' },
];

// ── Name extraction (title-based proximity) ─────────────────────────────────
const NAME_PREFIXES = ['Mr\\.?', 'Mrs\\.?', 'Ms\\.?', 'Dr\\.?', 'Shri', 'Smt', 'Ku(?:mari)?', 'Master'];
const NAME_LABELS = ['patient(?:\\s+name)?', 'name(?:\\s+of\\s+patient)?', 'pat\\.?\\s*name'];

const NAME_PATTERNS = [
  // "Patient Name: Rahul Kumar Sharma"
  new RegExp(`(?:${NAME_LABELS.join('|')})\\s*[:\\-]\\s*(?:${NAME_PREFIXES.join('|')})?\\s*[A-Z][a-z]+(?:\\s+[A-Z][a-z]+){1,3}`, 'gi'),
  // "Mr. Rahul Kumar" standalone
  new RegExp(`(?:${NAME_PREFIXES.join('|')})\\s+[A-Z][A-Za-z]+(?:\\s+[A-Z][A-Za-z]+){1,3}`, 'g'),
];

// ── Main function ────────────────────────────────────────────────────────────

export function removePii(text: string): PiiRemovalResult {
  let cleaned = text;
  const fieldsFound: string[] = [];
  let removalCount = 0;

  // Apply regex patterns
  for (const pattern of PATTERNS) {
    const before = cleaned;
    cleaned = cleaned.replace(pattern.regex, pattern.replacement);
    if (cleaned !== before) {
      fieldsFound.push(pattern.name);
      const matches = before.match(pattern.regex);
      removalCount += matches?.length || 0;
    }
  }

  // Apply name patterns
  for (const pattern of NAME_PATTERNS) {
    const before = cleaned;
    cleaned = cleaned.replace(pattern, '[NAME REMOVED]');
    if (cleaned !== before) {
      if (!fieldsFound.includes('patient_name')) fieldsFound.push('patient_name');
      const matches = before.match(pattern);
      removalCount += matches?.length || 0;
    }
  }

  return { cleanedText: cleaned, fieldsFound, removalCount };
}

// ── Extract structured cost data from OCR text ──────────────────────────────

export interface ExtractedBillData {
  totalCost?: number;
  roomCharges?: number;
  surgeryFee?: number;
  implantCost?: number;
  pharmacyCost?: number;
  otherCharges?: number;
  hospitalName?: string;
  treatmentName?: string;
  admissionDate?: string;
  dischargeDate?: string;
  stayDays?: number;
  confidence: number;
}

export function extractBillData(text: string): ExtractedBillData {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const result: ExtractedBillData = { confidence: 0 };
  let matches = 0;

  const findAmount = (pattern: RegExp): number | undefined => {
    const m = text.match(pattern);
    if (!m) return undefined;
    const raw = m[1] || m[0];
    const amount = parseFloat(raw.replace(/[,\s₹Rs]/g, ''));
    return isNaN(amount) ? undefined : amount;
  };

  // Total amount — highest priority, multiple patterns
  const totalPatterns = [
    /(?:net\s+payable|total\s+(?:amount|bill|payable|due)|grand\s+total|amount\s+(?:payable|due|paid))[\s:₹Rs]*([0-9,]+(?:\.\d{1,2})?)/i,
    /total[\s:₹Rs]*([0-9]{4,}(?:,\d{3})*(?:\.\d{1,2})?)/i,
  ];
  for (const p of totalPatterns) {
    result.totalCost = findAmount(p);
    if (result.totalCost) { matches++; break; }
  }

  // Room charges
  result.roomCharges = findAmount(/(?:room|ward|bed)\s+(?:charges?|rent|fees?)[\s:₹Rs]*([0-9,]+(?:\.\d{1,2})?)/i);
  if (result.roomCharges) matches++;

  // Surgery / operation fee
  result.surgeryFee = findAmount(/(?:surgery|operation|surgical|procedure|ot\s+charges?)[\s:₹Rs]*([0-9,]+(?:\.\d{1,2})?)/i);
  if (result.surgeryFee) matches++;

  // Implant cost
  result.implantCost = findAmount(/(?:implant|prosthesis|device|stent|valve|graft)[\s:₹Rs]*([0-9,]+(?:\.\d{1,2})?)/i);
  if (result.implantCost) matches++;

  // Pharmacy
  result.pharmacyCost = findAmount(/(?:pharmacy|medicine|drug|consumable)s?[\s:₹Rs]*([0-9,]+(?:\.\d{1,2})?)/i);
  if (result.pharmacyCost) matches++;

  // Hospital name
  const hospitalMatch = text.match(/(?:hospital|clinic|medical\s+centre|health\s+care)[\s:\-]*([A-Z][A-Za-z\s&]{5,50})/i);
  if (hospitalMatch) result.hospitalName = hospitalMatch[1].trim();

  // Dates
  const datePattern = /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/g;
  const dates = [...text.matchAll(datePattern)].map(m => m[1]);

  const admitMatch = text.match(/(?:admission|admitted|admit)\s+(?:date|dt)?[\s:]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i);
  if (admitMatch) { result.admissionDate = admitMatch[1]; matches++; }

  const dischargeMatch = text.match(/(?:discharge|discharged)\s+(?:date|dt)?[\s:]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i);
  if (dischargeMatch) { result.dischargeDate = dischargeMatch[1]; matches++; }

  // Stay days
  const stayMatch = text.match(/(?:stay|days?)[\s:]*(\d{1,3})\s*(?:day|night|d)/i);
  if (stayMatch) result.stayDays = parseInt(stayMatch[1]);

  // Confidence score based on how much we extracted
  result.confidence = Math.min(1.0, (matches / 5) * (result.totalCost ? 1.5 : 0.5));

  return result;
}
