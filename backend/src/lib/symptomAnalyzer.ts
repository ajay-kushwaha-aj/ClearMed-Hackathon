/**
 * Symptom Analyzer — ClearMed Phase 2
 */
import Anthropic from '@anthropic-ai/sdk';

export interface SymptomAnalysisResult {
  conditions: Array<{
    name: string;
    likelihood: 'high' | 'moderate' | 'low';
    matchConfidence: number;          // 0-100 percent
    icdCode?: string;
    description: string;              // short explanation of the condition
    prerequisites: string[];
    recoveryTime: string;             // e.g. "1-2 weeks rest"
    department: string;
  }>;
  specialists: string[];
  treatments: string[];
  urgency: 'emergency' | 'urgent' | 'routine' | 'elective';
  disclaimer: string;
  searchQuery: string;
}

const SYSTEM_PROMPT = `You are a clinical decision support AI for ClearMed, an Indian healthcare cost transparency platform.
Map patient symptoms → conditions → treatments for hospital searching purposes only.
RULES: 
1. Never diagnose definitively. Always include disclaimer.
2. Indian healthcare context.
3. For each condition provide ALL of these fields:
   - "name": condition name
   - "likelihood": "high" | "moderate" | "low"
   - "matchConfidence": integer 0-100 (how confident the symptom matches)
   - "icdCode": ICD-10 code
   - "description": one line describing what this condition is
   - "prerequisites": array of preliminary tests or first-aid steps the patient should take
   - "recoveryTime": expected recovery time description (e.g. "1-3 weeks for normal activities")
   - "department": the hospital department (Cardiology, Orthopaedics, Neurology, General Surgery, Gastroenterology, Oncology, Urology, Gynaecology, Pulmonology, Dermatology, General Medicine, Endocrinology, Ophthalmology, ENT)
4. Return multiple conditions if applicable — high, moderate, and low likelihood.
5. Do NOT use markdown. JSON ONLY.
Format: {"conditions":[{"name":"...","likelihood":"high","matchConfidence":90,"icdCode":"I25","description":"...","prerequisites":["..."],"recoveryTime":"...","department":"Cardiology"}],"specialists":[],"treatments":[],"urgency":"routine","searchQuery":"treatment-slug","disclaimer":"..."}`;

const KEYWORD_MAP = [
  { keywords:['chest pain','heart','palpitation','angina'], conditions:[{name:'Coronary Artery Disease',likelihood:'high' as const,matchConfidence:88,icdCode:'I25',description:'Narrowing of coronary arteries reducing blood flow to the heart.',prerequisites:['Immediate ECG','Lipid profile test','Avoid strenuous activity'],recoveryTime:'Depends on procedure; angioplasty recovery 1-2 weeks.',department:'Cardiology'}], specialists:['Cardiologist'], treatments:['Angioplasty','Bypass Surgery','Echocardiography'], urgency:'urgent' as const, searchQuery:'angioplasty' },
  { keywords:['knee pain','knee','arthritis','joint pain'], conditions:[{name:'Knee Osteoarthritis',likelihood:'high' as const,matchConfidence:85,icdCode:'M17',description:'Degenerative joint disease causing pain and stiffness in the knee.',prerequisites:['X-Ray of Knee joint','Rest the joint','Anti-inflammatory medication'],recoveryTime:'6-8 weeks post surgery; physiotherapy recommended.',department:'Orthopaedics'}], specialists:['Orthopaedic Surgeon'], treatments:['Knee Replacement Surgery','ACL Reconstruction'], urgency:'routine' as const, searchQuery:'knee-replacement' },
  { keywords:['kidney stone','urine blood','stone','back pain urination'], conditions:[{name:'Kidney Stones',likelihood:'high' as const,matchConfidence:90,icdCode:'N20',description:'Hard mineral deposits forming inside the kidneys causing severe pain.',prerequisites:['Drink plenty of water','Ultrasound KUB','Urine routine test'],recoveryTime:'1-2 weeks after lithotripsy; 2-4 weeks after PCNL.',department:'Urology'}], specialists:['Urologist'], treatments:['Kidney Stone Removal (PCNL)','Ureteroscopy (URSL)'], urgency:'urgent' as const, searchQuery:'kidney-stone-removal' },
  { keywords:['cataract','blurred vision','cloudy vision'], conditions:[{name:'Cataract',likelihood:'high' as const,matchConfidence:92,icdCode:'H26',description:'Clouding of the natural lens of the eye causing blurred vision.',prerequisites:['Avoid driving','Comprehensive eye exam','Blood sugar check'],recoveryTime:'Full recovery typically 4-6 weeks post-surgery.',department:'Ophthalmology'}], specialists:['Ophthalmologist'], treatments:['Cataract Surgery (Phaco)'], urgency:'elective' as const, searchQuery:'cataract-surgery' },
  { keywords:['hernia','lump groin','groin pain'], conditions:[{name:'Inguinal Hernia',likelihood:'high' as const,matchConfidence:82,icdCode:'K40',description:'A bulge in the groin area when abdominal tissue pushes through a weak spot.',prerequisites:['Avoid heavy lifting','Ultrasound Abdomen','Surgical consultation'],recoveryTime:'1-3 weeks for laparoscopic repair.',department:'General Surgery'}], specialists:['General Surgeon'], treatments:['Hernia Repair (Laparoscopic)'], urgency:'routine' as const, searchQuery:'hernia-repair' },
  { keywords:['gallstone','gallbladder','fatty food pain'], conditions:[{name:'Cholelithiasis',likelihood:'high' as const,matchConfidence:87,icdCode:'K80',description:'Formation of stones in the gallbladder causing pain after fatty food.',prerequisites:['Fast for 8 hours','Ultrasound Abdomen','Liver function test'],recoveryTime:'1-2 weeks after laparoscopic cholecystectomy.',department:'Gastroenterology'}], specialists:['General Surgeon'], treatments:['Gallbladder Removal (Cholecystectomy)'], urgency:'routine' as const, searchQuery:'gallbladder-removal' },
  { keywords:['cancer','tumour','lump','malignant','biopsy'], conditions:[{name:'Suspected Malignancy',likelihood:'moderate' as const,matchConfidence:55,icdCode:'C80',description:'Abnormal cell growth that may be cancerous; requires biopsy confirmation.',prerequisites:['Gather previous medical records','Recent biopsy reports','PET-CT scan'],recoveryTime:'Varies widely depending on type and stage.',department:'Oncology'}], specialists:['Medical Oncologist'], treatments:['Chemotherapy (per cycle)','Radiation Therapy (full course)'], urgency:'urgent' as const, searchQuery:'chemotherapy' },
  { keywords:['pregnancy','delivery','c-section','labour'], conditions:[{name:'Pregnancy / Delivery',likelihood:'high' as const,matchConfidence:95,icdCode:'Z34',description:'Pregnancy requiring antenatal care and delivery planning.',prerequisites:['Routine antenatal checkup','Blood group & Rh typing','Ultrasound obstetric'],recoveryTime:'Normal delivery: 2-4 weeks; C-section: 6-8 weeks.',department:'Gynaecology'}], specialists:['Gynaecologist'], treatments:['Normal Delivery','Caesarean Section (C-Section)'], urgency:'routine' as const, searchQuery:'normal-delivery' },
  { keywords:['back pain','spine','disc','spondylosis'], conditions:[{name:'Lumbar Disc Disease',likelihood:'moderate' as const,matchConfidence:65,icdCode:'M47',description:'Degeneration or herniation of spinal discs causing back and leg pain.',prerequisites:['Avoid bending or lifting','MRI Spine','Pain management consultation'],recoveryTime:'Conservative: 4-6 weeks; Surgery: 3-6 months full recovery.',department:'Orthopaedics'}], specialists:['Spine Surgeon','Neurologist'], treatments:['Spinal Fusion Surgery'], urgency:'routine' as const, searchQuery:'spinal-fusion' },
  { keywords:['stomach pain','stomach ache','abdominal pain','vomiting','nausea','gastric','acidity','loose motion','diarrhea','food poisoning'], conditions:[{name:'Gastroenteritis / Gastric Issue',likelihood:'high' as const,matchConfidence:80,icdCode:'K52',description:'Inflammation of the stomach and intestines causing pain and nausea.',prerequisites:['Stay hydrated','Avoid spicy food','Stool routine test'],recoveryTime:'Typically 3-7 days with proper medication and rest.',department:'Gastroenterology'}], specialists:['Gastroenterologist','General Physician'], treatments:['Endoscopy','Colonoscopy'], urgency:'routine' as const, searchQuery:'gallbladder-removal' },
  { keywords:['fever','high temperature','chills','body ache','flu','cold','cough','throat pain','cold cough'], conditions:[{name:'Viral Fever / Flu',likelihood:'high' as const,matchConfidence:78,icdCode:'J11',description:'Common viral infection causing fever, body ache and weakness.',prerequisites:['Rest and hydrate','Check temperature regularly','Complete blood count (CBC)'],recoveryTime:'Usually 5-7 days with rest and medication.',department:'General Medicine'},{name:'Dengue / Malaria',likelihood:'moderate' as const,matchConfidence:45,icdCode:'A90',description:'Mosquito-borne illness that can cause high fever and platelet drop.',prerequisites:['Dengue NS1 antigen test','Malarial parasite smear','Platelet count monitoring'],recoveryTime:'7-14 days; monitor platelet count closely.',department:'General Medicine'},{name:'Typhoid Fever',likelihood:'low' as const,matchConfidence:25,icdCode:'A01',description:'Bacterial infection from contaminated food/water causing prolonged fever.',prerequisites:['Widal test / Typhidot','Blood culture','Avoid outside food'],recoveryTime:'2-4 weeks with antibiotic treatment.',department:'General Medicine'}], specialists:['General Physician','Internal Medicine'], treatments:[], urgency:'routine' as const, searchQuery:'' },
  { keywords:['diabetes','blood sugar','insulin','sugar level'], conditions:[{name:'Diabetes Mellitus',likelihood:'high' as const,matchConfidence:85,icdCode:'E11',description:'Chronic condition where the body cannot regulate blood sugar properly.',prerequisites:['Fasting Blood Sugar test (12 hrs)','HbA1c test','Kidney function test'],recoveryTime:'Lifelong management; controlled with diet and medication.',department:'Endocrinology'}], specialists:['Endocrinologist','Diabetologist'], treatments:['HbA1c Test','Blood Sugar Panel'], urgency:'routine' as const, searchQuery:'' },
  { keywords:['chest infection','pneumonia','breathing','shortness of breath','asthma','lung'], conditions:[{name:'Respiratory Infection / Asthma',likelihood:'moderate' as const,matchConfidence:68,icdCode:'J45',description:'Airway inflammation causing breathing difficulty and wheezing.',prerequisites:['Chest X-Ray','Spirometry / PFT','Use prescribed inhalers if any'],recoveryTime:'Acute infection: 1-3 weeks; Asthma is lifelong managed.',department:'Pulmonology'}], specialists:['Pulmonologist','General Physician'], treatments:['Bronchoscopy','Spirometry'], urgency:'urgent' as const, searchQuery:'' },
  { keywords:['thyroid','weight gain','fatigue','tiredness','hypothyroid','hyperthyroid'], conditions:[{name:'Thyroid Disorder',likelihood:'moderate' as const,matchConfidence:62,icdCode:'E03',description:'Thyroid gland producing too much or too little hormone.',prerequisites:['Fasting Thyroid Profile (TSH, T3, T4)','Thyroid ultrasound'],recoveryTime:'Managed with daily medication; regular monitoring required.',department:'Endocrinology'}], specialists:['Endocrinologist'], treatments:['Thyroid Function Test'], urgency:'routine' as const, searchQuery:'' },
  { keywords:['skin','rash','allergy','itching','eczema','psoriasis','dermatitis'], conditions:[{name:'Dermatological Condition',likelihood:'moderate' as const,matchConfidence:60,icdCode:'L30',description:'Skin inflammation or allergic reaction causing rash and itching.',prerequisites:['Avoid scratching','Do not apply unrecognized creams','Patch allergy test'],recoveryTime:'Varies; acute allergies resolve in days, chronic conditions need ongoing care.',department:'Dermatology'}], specialists:['Dermatologist'], treatments:['Skin Biopsy'], urgency:'routine' as const, searchQuery:'' },
  { keywords:['seizure','epilepsy','fits','convulsion'], conditions:[{name:'Epilepsy',likelihood:'high' as const,matchConfidence:82,icdCode:'G40',description:'Neurological disorder causing recurrent unprovoked seizures.',prerequisites:['Ensure safe environment','EEG test','MRI Brain'],recoveryTime:'Managed with lifelong anti-epileptic medications.',department:'Neurology'}], specialists:['Neurologist','Neurosurgeon'], treatments:['Epilepsy Surgery'], urgency:'urgent' as const, searchQuery:'epilepsy-surgery' },
];

function keywordFallback(symptoms: string): SymptomAnalysisResult {
  const lower = symptoms.toLowerCase();
  const match = KEYWORD_MAP.find(e => e.keywords.some(kw => lower.includes(kw)));
  if (match) return { conditions: match.conditions, specialists: match.specialists, treatments: match.treatments, urgency: match.urgency, searchQuery: match.searchQuery, disclaimer: 'This is NOT a medical diagnosis. Please consult a qualified doctor before making any healthcare decisions.' };
  return { conditions:[{name:'Please describe your symptoms in more detail',likelihood:'low',matchConfidence:0,description:'We need more information to provide accurate analysis.',prerequisites:[],recoveryTime:'N/A',department:'General Medicine'}], specialists:['General Physician'], treatments:[], urgency:'routine', searchQuery:'', disclaimer:'This is NOT a medical diagnosis. Please consult a qualified doctor.' };
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
