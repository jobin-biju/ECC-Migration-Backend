const { GoogleGenerativeAI } = require("@google/generative-ai");
const sapOData = require("./sap_odata");
require("dotenv").config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

class GeminiService {
    constructor() {
        this.model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
    }

    async processQuery(prompt) {
        try {
            // -------------------------------
            // 1️⃣ INTENT + FIELD EXTRACTION
            // -------------------------------
            const intentPrompt = `
Analyze the user query:

"${prompt}"

Rules:
- CHAT → general info, greetings, explanations
- DATA → requires backend/API data (fetching tables)

If DATA:
- searchText: Extract specific FILTER VALUE (e.g. "John", "9001", "Sales Dept"). 
  - DO NOT put column names like "phone", "email", "users" here.
  - If user asks for "all phone numbers", searchText is null.
- requestedFields: Extract specific columns requested (e.g. "name", "email", "phone"). 
  - If user asks "get all phone numbers", requestedFields = ["phone"].
  - If none specified, return [].

Return STRICT JSON ONLY:

{
  "intent": "CHAT" | "DATA",
  "dataSource": "SAP_ODATA" | "NONE",
  "searchText": "string | null",
  "requestedFields": ["field1", "field2"]
}
`;

            const intentResult = await this.model.generateContent(intentPrompt);
            const cleaned = intentResult.response.text()
                .replace(/```json|```/g, "")
                .trim();

            let intent;
            try {
                intent = JSON.parse(cleaned);
            } catch {
                intent = { intent: "CHAT", dataSource: "NONE", requestedFields: [] };
            }
            console.log("Parsed Intent:", intent);

            // -------------------------------
            // 2️⃣ CHAT MODE (NO DATA)
            // -------------------------------
            if (intent.intent === "CHAT" || intent.dataSource === "NONE") {
                const chatPrompt = `
You are an expert SAP ECC Migration Assistant.
Your goal is to help users with their SAP data, migration tasks, and general inquiries.
Maintain a professional, helpful, and corporate tone (like ChatGPT for Enterprise).

User Query: "${prompt}"`;

                const chat = await this.model.generateContent(chatPrompt);
                return {
                    text: chat.response.text(),
                    data: null
                };
            }

            // -------------------------------
            // 3️⃣ DATA FETCH (STRICT)
            // -------------------------------
            const data = await sapOData.fetchByIntent(intent);

            // -------------------------------
            // 4️⃣ FINAL RESPONSE
            // -------------------------------
            const finalPrompt = `
You are a Senior SAP Data Analyst for an ECC Migration project.

User question: "${prompt}"

Provided Data (Full Set):
${JSON.stringify(data)}

Rules:
1. Answer the user's question professionally based on the data.
2. **FILTER THE DATA LIST** in your JSON response if the user asks for a specific condition.
   - If the user asks for "list users starting with B", ONLY return those users in the 'data' array.
   - If no specific filter asked, return all data.
3. Be concise but helpful. Use phrases like "Here are the users..." or "I found the following records...".

Return STRICT JSON ONLY:
{
  "text": "Your professional answer here",
  "data": [ ... the filtered list of objects ... ]
}
`;

            const finalResult = await this.model.generateContent(finalPrompt);
            const finalCleaned = finalResult.response.text()
                .replace(/```json|```/g, "")
                .trim();

            return JSON.parse(finalCleaned);

        } catch (err) {
            console.error("Gemini Error:", err);
            return {
                text: "Sorry, I couldn't process your request.",
                data: null
            };
        }
    }
}

module.exports = new GeminiService();
