const { GoogleGenerativeAI } = require("@google/generative-ai");
const sapOData = require("./sap_odata");
const sapRfc = require("./sap_rfc");
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
            // 3️⃣ DATA FETCH (ROUTING LOGIC)
            // -------------------------------
            let data = [];

            // Check if OData is configured
            const odataConfigured = process.env.SAP_SERVICE_URL && process.env.SAP_SERVICE_URL.startsWith('http');

            if (intent.dataSource === "SAP_ODATA" && !odataConfigured) {
                console.warn("⚠️ SAP OData not configured. Falling back to RFC.");
                intent.dataSource = "SAP_RFC";
            }

            if (intent.dataSource === "SAP_RFC") {

                // Smart routing: Check if SDK is present before trying
                if (sapRfc.isSdkInstalled()) {
                    console.log("Using RFC Data Source...");
                    data = await sapRfc.fetchByIntent(intent);
                } else {
                    console.log("ℹ️ Standard SAP RFC SDK not found. Skipping direct RFC call.");
                    console.log("👉 Switching to System Diagnostic Mode (HTTP Ping)...");

                    const diag = await this.checkSystemHealth();
                    if (diag) data = [diag];
                }

            } else {
                // Default to OData (if configured) or if AI explicitly asked for it and we have config
                console.log("Using OData Data Source...");
                try {
                    data = await sapOData.fetchByIntent(intent);
                } catch (odataErr) {
                    console.error("OData fetch failed, trying RFC fallback...", odataErr.message);

                    if (sapRfc.isSdkInstalled()) {
                        data = await sapRfc.fetchByIntent(intent);
                    } else {
                        console.log("RFC fallback skipped (No SDK). Checking System Diagnostic...");
                        const diag = await this.checkSystemHealth();
                        if (diag) data = [diag];
                    }
                }
            }

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
3. If the data shows "SystemID" and "Status": "ONLINE", this means connection is SUCCESSFUL. Confirm this to the user with enthusiasm (e.g., "✅ Yes, the system is connected!").

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

    async checkSystemHealth() {
        const axios = require('axios');
        const config = require('../config/sap_config');

        try {
            const host = config.sapRfc.ashost || 'localhost';
            const sysnr = config.sapRfc.sysnr || '00';
            const client = config.sapRfc.client || '800';
            const port = 8000 + parseInt(sysnr, 10);
            const pingUrl = `http://${host}:${port}/sap/public/ping?sap-client=${client}`;

            const auth = {
                username: config.sapRfc.user,
                password: config.sapRfc.passwd
            };

            const startTime = Date.now();
            const res = await axios.get(pingUrl, { auth, timeout: 5000 });
            const duration = Date.now() - startTime;

            return {
                SystemID: "SAP ECC",
                Status: "ONLINE ✅",
                Host: host,
                Port: port,
                Client: client,
                ResponseTime: `${duration}ms`,
                Message: "Connection Established (HTTP)"
            };
        } catch (e) {
            console.error("System Health Check Failed:", e.message);
            return {
                SystemID: "SAP ECC",
                Status: "OFFLINE ❌",
                Error: e.message
            };
        }
    }
}

module.exports = new GeminiService();
