/**
 * Symptom Analyzer — ClearMed Phase 2
 */
import Anthropic from '@anthropic-ai/sdk';

export interface SymptomAnalysisResult {
  conditions: Array<{ name: string; likelihood: 'high' | 'moderate' | 'low'; icdCode?: string }>;
  specialists: string[];
  treatments: string[];
  urgency: 'emergency' | 'urgent' | 'routine' | 'elective';
  disclaimer: string;
  searchQuery: string;
}

const SYSTEM_PROMPT = `You are a clinical decision support AI for ClearMed, an Indian healthcare cost transparency platform.
Map patient symptoms → conditions → treatments for hospital searching purposes only.
RULES: Never diagnose. Always include disclaimer. Indian healthcare context. JSON only.
Format: {"conditions":[{"name":"...","likelihood":"high|moderate|low","icdCode":"..."}],"specialists":[],"treatments":[],"urgency":"routine","searchQuery":"treatment-slug","disclaimer":"..."}`;

const KEYWORD_MAP = [
  { keywords:['chest pain','heart','palpitation','angina'], conditions:[{name:'Coronary Artery Disease',likelihood:'high' as const,icdCode:'I25'}], specialists:['Cardiologist'], treatments:['Angioplasty','Bypass Surgery','Echocardiography'], urgency:'urgent' as const, searchQuery:'angioplasty' },
  { keywords:['knee pain','knee','arthritis','joint pain'], conditions:[{name:'Knee Osteoarthritis',likelihood:'high' as const,icdCode:'M17'}], specialists:['Orthopaedic Surgeon'], treatments:['Knee Replacement Surgery','ACL Reconstruction'], urgency:'routine' as const, searchQuery:'knee-replacement' },
  { keywords:['kidney stone','urine blood','stone','back pain urination'], conditions:[{name:'Kidney Stones',likelihood:'high' as const,icdCode:'N20'}], specialists:['Urologist'], treatments:['Kidney Stone Removal (PCNL)','Ureteroscopy (URSL)'], urgency:'urgent' as const, searchQuery:'kidney-stone-removal' },
  { keywords:['cataract','blurred vision','cloudy vision'], conditions:[{name:'Cataract',likelihood:'high' as const,icdCode:'H26'}], specialists:['Ophthalmologist'], treatments:['Cataract Surgery (Phaco)'], urgency:'elective' as const, searchQuery:'cataract-surgery' },
  { keywords:['hernia','lump groin','groin pain'], conditions:[{name:'Inguinal Hernia',likelihood:'high' as const,icdCode:'K40'}], specialists:['General Surgeon'], treatments:['Hernia Repair (Laparoscopic)'], urgency:'routine' as const, searchQuery:'hernia-repair' },
  { keywords:['gallstone','gallbladder','fatty food pain'], conditions:[{name:'Cholelithiasis',likelihood:'high' as const,icdCode:'K80'}], specialists:['General Surgeon'], treatments:['Gallbladder Removal (Cholecystectomy)'], urgency:'routine' as const, searchQuery:'gallbladder-removal' },
  { keywords:['cancer','tumour','lump','malignant','biopsy'], conditions:[{name:'Suspected Malignancy',likelihood:'moderate' as const,icdCode:'C80'}], specialists:['Medical Oncologist'], treatments:['Chemotherapy (per cycle)','Radiation Therapy (full course)'], urgency:'urgent' as const, searchQuery:'chemotherapy' },
  { keywords:['pregnancy','delivery','c-section','labour'], conditions:[{name:'Pregnancy',likelihood:'high' as const,icdCode:'Z34'}], specialists:['Gynaecologist'], treatments:['Normal Delivery','Caesarean Section (C-Section)'], urgency:'routine' as const, searchQuery:'normal-delivery' },
  { keywords:['back pain','spine','disc','spondylosis'], conditions:[{name:'Lumbar Disc Disease',likelihood:'moderate' as const,icdCode:'M47'}], specialists:['Spine Surgeon','Neurologist'], treatments:['Spinal Fusion Surgery'], urgency:'routine' as const, searchQuery:'spinal-fusion' },
  { keywords:['stomach pain','stomach ache','abdominal pain','vomiting','nausea','gastric','acidity','loose motion','diarrhea','food poisoning'], conditions:[{name:'Gastroenteritis / Gastric Issue',likelihood:'high' as const,icdCode:'K52'}], specialists:['Gastroenterologist','General Physician'], treatments:['Endoscopy','Colonoscopy'], urgency:'routine' as const, searchQuery:'gallbladder-removal' },
  { keywords:['fever','high temperature','chills','body ache','flu','cold','cough','throat pain','cold cough'], conditions:[{name:'Viral Fever / Flu',likelihood:'high' as const,icdCode:'J11'}], specialists:['General Physician','Internal Medicine'], treatments:[], urgency:'routine' as const, searchQuery:'' },
  { keywords:['diabetes','blood sugar','insulin','sugar level'], conditions:[{name:'Diabetes Mellitus',likelihood:'high' as const,icdCode:'E11'}], specialists:['Endocrinologist','Diabetologist'], treatments:['HbA1c Test','Blood Sugar Panel'], urgency:'routine' as const, searchQuery:'' },
  { keywords:['chest infection','pneumonia','breathing','shortness of breath','asthma','lung'], conditions:[{name:'Respiratory Infection / Asthma',likelihood:'moderate' as const,icdCode:'J45'}], specialists:['Pulmonologist','General Physician'], treatments:['Bronchoscopy','Spirometry'], urgency:'urgent' as const, searchQuery:'' },
  { keywords:['thyroid','weight gain','fatigue','tiredness','hypothyroid','hyperthyroid'], conditions:[{name:'Thyroid Disorder',likelihood:'moderate' as const,icdCode:'E03'}], specialists:['Endocrinologist'], treatments:['Thyroid Function Test'], urgency:'routine' as const, searchQuery:'' },
  { keywords:['skin','rash','allergy','itching','eczema','psoriasis','dermatitis'], conditions:[{name:'Dermatological Condition',likelihood:'moderate' as const,icdCode:'L30'}], specialists:['Dermatologist'], treatments:['Skin Biopsy'], urgency:'routine' as const, searchQuery:'' },
  { keywords:['seizure','epilepsy','fits','convulsion'], conditions:[{name:'Epilepsy',likelihood:'high' as const,icdCode:'G40'}], specialists:['Neurologist','Neurosurgeon'], treatments:['Epilepsy Surgery'], urgency:'urgent' as const, searchQuery:'epilepsy-surgery' },
];

function keywordFallback(symptoms: string): SymptomAnalysisResult {
  const lower = symptoms.toLowerCase();
  const match = KEYWORD_MAP.find(e => e.keywords.some(kw => lower.includes(kw)));
  if (match) return { conditions: match.conditions, specialists: match.specialists, treatments: match.treatments, urgency: match.urgency, searchQuery: match.searchQuery, disclaimer: 'This is NOT a medical diagnosis. Please consult a qualified doctor before making any healthcare decisions.' };
  return { conditions:[{name:'Please describe your symptoms in more detail',likelihood:'low'}], specialists:['General Physician'], treatments:[], urgency:'routine', searchQuery:'', disclaimer:'This is NOT a medical diagnosis. Please consult a qualified doctor.' };
}

export async function analyzeSymptoms(symptoms: string, city = 'Delhi'): Promise<SymptomAnalysisResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey.includes('your-key')) return keywordFallback(symptoms);
  try {
    const client = new Anthropic({ apiKey });
    const msg = await client.messages.create({
      model: 'claude-sonnet-4-20250514', max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages:[{role:'user',content:`Symptoms: "${symptoms}"\nCity: ${city}`}]
    });
    const text = msg.content[0].type === 'text' ? msg.content[0].text : '';
    const parsed = JSON.parse(text) as SymptomAnalysisResult;
    if (!parsed.disclaimer) parsed.disclaimer = 'This is NOT a medical diagnosis. Please consult a qualified doctor.';
    return parsed;
  } catch {
    return keywordFallback(symptoms);
  }
}
