import { GoogleGenerativeAI } from '@google/generative-ai';

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
Ensure the output is strictly valid JSON without markdown wrapping.`;

export async function analyzeSymptoms(symptoms: string, city: string = 'Delhi'): Promise<SymptomAnalysisResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is missing");
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    const prompt = `${SYSTEM_PROMPT}\n\nSymptoms: "${symptoms}"\nCity: ${city}`;

    const result = await model.generateContent(prompt);
    let responseText = result.response.text();
    responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(responseText) as SymptomAnalysisResult;
    
    if (!parsed.disclaimer) {
      parsed.disclaimer = 'This is NOT a medical diagnosis. Please consult a qualified doctor before making any healthcare decisions.';
    }
    
    return parsed;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to analyze symptoms");
  }
}
