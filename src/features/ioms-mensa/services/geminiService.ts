import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Service to handle interactions with Google Gemini API for intelligent insights.
 * Currently structured for future implementation of generative alerts and reporting.
 */

// Initialize API Client only when key is available
const apiKey = process.env.GOOGLE_GENAI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || process.env.API_KEY || '';
const ai = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export const generateSustainabilityReport = async (siteData: any): Promise<string> => {
  if (!ai) {
    console.warn("Gemini API Key missing. Returning mock insight.");
    return "To reduce waste in Mensa Nord, consider adjusting the potato peeling process and reducing buffet pan sizes during off-peak hours.";
  }

  try {
    const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const response = await model.generateContent(
      `Analyze this cafeteria data and suggest 3 actionable sustainability improvements: ${JSON.stringify(siteData)}`
    );
    return response.response.text() || "No insight generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error generating report.";
  }
};
