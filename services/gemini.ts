import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export interface GeminiTriageResult {
  summary: string;
  priority: "Low" | "Medium" | "High";
  recommendedLabels: string[];
}

export async function triageGithubEvent(
  eventType: "issues" | "pull_request",
  title: string,
  body: string
): Promise<GeminiTriageResult> {
  // If API key is missing, return a graceful fallback
  if (!genAI) {
    console.warn("GEMINI_API_KEY is not configured. Skipping AI triage.");
    return {
      summary: `Automated summary: ${title.slice(0, 100)}...`,
      priority: "Low",
      recommendedLabels: [],
    };
  }

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const prompt = `
Analyze the following GitHub event content to summarize and categorize it.

Event Type: ${eventType}
Title: ${title}
Body: ${body || "(No description provided)"}

Provide a JSON object response with exactly the following schema:
{
  "summary": "Concise one-sentence summary of the issue or PR (max 150 characters).",
  "priority": "Low" | "Medium" | "High",
  "recommendedLabels": ["label1", "label2"] (Provide 1 to 3 appropriate repository labels)
}
`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    if (!responseText) {
      throw new Error("Empty response from Gemini API");
    }

    const parsed = JSON.parse(responseText.trim()) as GeminiTriageResult;
    
    // Validate output format
    return {
      summary: parsed.summary || title.slice(0, 100),
      priority: ["Low", "Medium", "High"].includes(parsed.priority) ? parsed.priority : "Low",
      recommendedLabels: Array.isArray(parsed.recommendedLabels) ? parsed.recommendedLabels : [],
    };
  } catch (error) {
    console.error("Error running Gemini AI triage:", error);
    return {
      summary: `Failed to generate AI summary: ${title.slice(0, 100)}`,
      priority: "Low",
      recommendedLabels: [],
    };
  }
}
