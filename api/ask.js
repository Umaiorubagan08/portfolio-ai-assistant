import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY environment variable is not set.");
      return response.status(500).json({ error: "Server-side API key is not configured." });
    }

    const { prompt, chatHistory, context } = request.body;
    
    // Check for required data
    if (!prompt || !context) {
        return response.status(400).json({ error: "Missing prompt or context." });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Prepare the full conversation history including the context
    const contents = [];
    contents.push({ role: 'user', parts: [{ text: context }] });
    // Add existing chat history to continue the conversation
    for (const h of chatHistory) {
      contents.push(h);
    }
    // Add the latest user prompt
    contents.push({ role: 'user', parts: [{ text: prompt }] });

    const result = await model.generateContent({ contents });
    const text = result.response.text();

    if (!text) {
      return response.status(500).json({ error: "No response from model." });
    }

    response.status(200).json({ reply: text });

  } catch (error) {
    console.error("Error in serverless function:", error);
    response.status(500).json({ error: `An error occurred: ${error.message}` });
  }
}