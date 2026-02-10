const { GoogleGenerativeAI } = require("@google/generative-ai");
const sapOData = require('./sap_odata');
require('dotenv').config();

// Initialize Gemini - API Key directly injected as user requested, but should be in .env in production
const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

class GeminiService {
    constructor() {
        this.model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
    }

    async processQuery(prompt) {
        try {
            console.log(`Processing with Gemini: "${prompt}"`);

            // 1. Get Context Data (Mock or Real)
            const contextData = await sapOData.getAllData();

            // 2. Construct Prompt for Gemini
            // We tell Gemini to act as a data query engine
            const instruction = `
            You are an intelligent data assistant for an SAP ECC Migration dashboard.
            
            Here is the current dataset (JSON format):
            ${JSON.stringify(contextData)}

            User Query: "${prompt}"

            Your Task:
            1. Analyze the user's query against the dataset.
            2. Decide if the user wants to SEE the data rows or just wants an ANSWER.
            
            RULES FOR 'data' FIELD:
            - IF the user asks for a count, sum, average, or single value (e.g. "How many users?", "Total stock?"): 
              -> Set "text" to the answer.
              -> Set "data" to [] (EMPTY ARRAY). Do NOT return the rows unless explicitly asked to "show" or "list" them.
            
            - IF the user asks to see/list/find records (e.g. "List active users", "Show details of Leanne", "Find order 9001"):
              -> Set "text" to a brief intro (e.g. "Here are the active users:").
              -> Set "data" to the array of matching records.

            - IF the user asks a general question not about data (e.g. "Hello", "Help"):
              -> Set "text" to a helpful response.
              -> Set "data" to [].

            OUTPUT FORMAT (Strict JSON):
            {
                "text": "Your natural language response here.",
                "data": [ ...array of relevant data objects or empty... ] 
            }
            
            IMPORTANT: Return ONLY raw JSON. No markdown code blocks (like \`\`\`json).
            `;

            // 3. Generate Content
            const result = await this.model.generateContent(instruction);
            const response = await result.response;
            const responseText = response.text();

            console.log("Gemini Raw Response:", responseText);

            // 4. Parse the JSON response from Gemini
            try {
                // Clean up potential markdown code blocks if Gemini adds them, just in case
                const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
                return JSON.parse(cleanedText);
            } catch (parseError) {
                console.error("Failed to parse Gemini response as JSON:", parseError);
                // Fallback: If parsing fails, just return text
                return {
                    text: responseText,
                    data: null
                };
            }

        } catch (error) {
            console.error("Gemini Service Error:", error);
            // Graceful fallback
            return {
                text: "I'm sorry, could not process your request with Gemini AI at this moment. Please check the backend configuration.",
                data: null,
                error: error.message
            };
        }
    }
}

module.exports = new GeminiService();
