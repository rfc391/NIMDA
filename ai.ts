import OpenAI from "openai";
import type { Intelligence } from "@db/schema";

const openai = new OpenAI();

export type ProcessedIntelligence = {
  summary: string;
  entities: string[];
  sentiment: "positive" | "negative" | "neutral";
  confidence: number;
  recommendations: string[];
};

export async function processIntelligence(intel: Intelligence): Promise<ProcessedIntelligence & { isCritical?: boolean }> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an intelligence analyst assistant. Analyze the following intelligence report and provide a structured response with summary, key entities, sentiment, confidence score (0-1), and actionable recommendations.",
        },
        {
          role: "user",
          content: `Title: ${intel.title}\n\nContent: ${intel.content}\n\nClassification: ${intel.classification}`,
        },
      ],
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error("No response from AI");
    }

    // Parse the structured response
    const lines = response.split("\n");
    const summary = lines.find(l => l.startsWith("Summary:"))?.slice(8) || "";
    const entities = lines.find(l => l.startsWith("Entities:"))?.slice(9).split(",").map(e => e.trim()) || [];
    const sentiment = (lines.find(l => l.startsWith("Sentiment:"))?.slice(10).toLowerCase() || "neutral") as "positive" | "negative" | "neutral";
    const confidence = parseFloat(lines.find(l => l.startsWith("Confidence:"))?.slice(11) || "0.5");
    const recommendations = lines.find(l => l.startsWith("Recommendations:"))?.slice(16).split(";").map(r => r.trim()) || [];

    return {
      summary,
      entities,
      sentiment,
      confidence,
      recommendations,
    };
  } catch (error) {
    console.error("AI Processing Error:", error);
    return {
      summary: "Error processing intelligence",
      entities: [],
      sentiment: "neutral",
      confidence: 0,
      recommendations: [],
    };
  }
}
