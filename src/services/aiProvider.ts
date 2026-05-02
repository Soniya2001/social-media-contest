import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

export interface Task {
  title: string;
  description: string;
  assignee: string;
  deadline: string;
  priority: 'low' | 'medium' | 'high';
  status: string;
}

export interface Blocker {
  issue: string;
  affected_tasks: string[];
}

export interface Prediction {
  task: string;
  risk_level: 'low' | 'medium' | 'high';
  reason: string;
}

export interface AnalysisResult {
  tasks: Task[];
  blockers: Blocker[];
  predictions: Prediction[];
  suggestions: string[];
}

const SYSTEM_PROMPT = `
You are an AI-powered team coordination assistant.
Analyze the provided conversation logs, meeting notes, or task updates.
Extract structured tasks, detect blockers, and predict potential delays.

RULES:
- Do not hallucinate unknown names or deadlines.
- If data is missing, leave fields empty.
- Keep output concise and structured.
- Focus on actionable insights only.
- Respond ONLY with a clean JSON object following this format:
{
  "tasks": [{ "title": "", "description": "", "assignee": "", "deadline": "", "priority": "low | medium | high", "status": "pending" }],
  "blockers": [{ "issue": "", "affected_tasks": [] }],
  "predictions": [{ "task": "", "risk_level": "low | medium | high", "reason": "" }],
  "suggestions": [""]
}
`;

export async function analyzeTeamSync(content: string): Promise<AnalysisResult> {
  if (!API_KEY) {
    throw new Error("VITE_GEMINI_API_KEY is not configured.");
  }

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const result = await model.generateContent([SYSTEM_PROMPT, content]);
  const response = await result.response;
  const text = response.text();
  
  // Extract JSON from potential markdown blocks
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse AI response as JSON.");
  }

  return JSON.parse(jsonMatch[0]);
}
