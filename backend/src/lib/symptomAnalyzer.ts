export interface SymptomQuiz {
  questions: Array<{
    id: string;
    text: string;
    options: string[];
  }>;
}

export interface SymptomAnalysisResult {
  conditions: Array<{
    name: string;
    likelihood: 'high' | 'moderate' | 'low';
    matchConfidence: number;
    icdCode?: string;
    description: string;
    prerequisites: string[];
    recoveryTime: string;
    department: string;
  }>;
  specialists: string[];
  treatments: string[];
  urgency: 'emergency' | 'urgent' | 'routine' | 'elective';
  disclaimer: string;
  searchQuery: string;
}

const SYSTEM_PROMPT = `You are a medical triage assistant.
Analyze the user's symptoms and return a JSON object exactly matching this interface:
{
  "conditions": [{
    "name": "string",
    "likelihood": "high" | "moderate" | "low",
    "matchConfidence": number (0-100),
    "icdCode": "string (optional)",
    "description": "string",
    "prerequisites": ["string"],
    "recoveryTime": "string",
    "department": "string"
  }],
  "specialists": ["string"],
  "treatments": ["string"],
  "urgency": "emergency" | "urgent" | "routine" | "elective",
  "disclaimer": "string",
  "searchQuery": "string"
}

CRITICAL INSTRUCTION: If the user is in "Delhi" and their symptoms relate to clinical departments such as Cardiology, Gastroenterology, Nephrology, Neurology, Orthopaedics, Pediatrics, Obstetrics & Gynaecology, Ophthalmology, Psychiatry, Oncology, or Trauma, you MUST strongly suggest "AIIMS New Delhi" within the disclaimer and ensure your searchQuery is perfectly formulated so the platform can query and return AIIMS New Delhi.
Ensure the output is strictly valid JSON without markdown wrapping.`;

const QUIZ_PROMPT = `You are a medical triage assistant.
The user has reported the following initial symptoms.
Generate 3 to 5 simple, highly-relevant clarifying questions to help narrow down the possible medical conditions.
For each question, provide 3 to 5 specific, short answer options tailored perfectly to the question. Do NOT just use generic "Yes", "No", "Not sure" unless it is a strict binary question.
Output exactly this JSON format:
{
  "questions": [
    { 
      "id": "q1", 
      "text": "How long have you had this pain?",
      "options": ["Less than a day", "A few days", "Over a week", "Not sure"]
    },
    { 
      "id": "q2", 
      "text": "Is it affecting both eyes or just one?",
      "options": ["Only left eye", "Only right eye", "Both eyes", "Not sure"]
    }
  ]
}
Ensure strictly valid JSON without markdown wrapping.`;

export async function generateSymptomQuiz(symptoms: string): Promise<SymptomQuiz> {
  const apiKey = process.env.GROQ_API_KEY; // Swapped to Groq
  if (!apiKey) throw new Error("GROQ_API_KEY environment variable is missing");

  try {
    const promptText = `${QUIZ_PROMPT}\n\nSymptoms: "${symptoms}"`;

    // Natively fetch from Groq API
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: promptText }],
        temperature: 0.2 // Kept low for strict JSON output
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Groq API Error: ${errText}`);
    }

    const result = await response.json() as any;
    let responseText = result.choices[0].message.content;

    // Clean JSON parsing
    responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(responseText || '{}') as Partial<SymptomQuiz>;

    return { questions: parsed.questions || [] };
  } catch (error) {
    console.error("Groq Quiz API Error:", error);
    throw new Error("Failed to generate clarification questions");
  }
}

export async function analyzeSymptoms(symptoms: string, city: string = 'Delhi', answers?: { question: string, answer: string }[]): Promise<SymptomAnalysisResult> {
  const apiKey = process.env.GROQ_API_KEY; // Swapped to Groq
  if (!apiKey) {
    throw new Error("GROQ_API_KEY environment variable is missing");
  }

  try {
    let promptText = `${SYSTEM_PROMPT}\n\nSymptoms: "${symptoms}"\nCity: ${city}`;
    if (answers && answers.length > 0) {
      promptText += `\n\nPatient answered the following clarification questions:\n`;
      answers.forEach(a => promptText += `- ${a.question} -> ${a.answer}\n`);
    }

    // Natively fetch from Groq API
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: promptText }],
        temperature: 0.1 // Kept low for strict JSON output
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Groq API Error: ${errText}`);
    }

    const result = await response.json() as any;
    let responseText = result.choices[0].message.content;

    // Clean JSON parsing
    responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(responseText || '{}') as Partial<SymptomAnalysisResult>;

    const safeParsed: SymptomAnalysisResult = {
      conditions: parsed.conditions || [],
      specialists: parsed.specialists || [],
      treatments: parsed.treatments || [],
      urgency: parsed.urgency || 'routine',
      disclaimer: parsed.disclaimer || 'This is NOT a medical diagnosis. Please consult a qualified doctor before making any healthcare decisions.',
      searchQuery: parsed.searchQuery || ''
    };

    return safeParsed;
  } catch (error) {
    console.error("Groq Analysis API Error:", error);
    throw new Error("Failed to analyze symptoms");
  }
}