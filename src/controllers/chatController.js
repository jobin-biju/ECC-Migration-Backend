const sapOData = require('../services/sap_odata');
const sapRfc = require('../services/sap_rfc');
const geminiService = require('../services/gemini.service');

// Basic controller to handle the chat/query request
exports.handleChat = async (req, res) => {
    try {
        const { prompt, query } = req.body;
        const userPrompt = prompt || query;

        if (!userPrompt) {
            return res.status(400).json({ error: "Prompt is required" });
        }

        const result = await geminiService.processQuery(userPrompt);

        res.json({
            success: true,
            prompt: userPrompt,
            data: result
        });

    } catch (error) {
        console.error("Chat Controller Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.testConnection = async (req, res) => {
    try {
        console.log('Testing SAP Connection via API...');
        // Try to fetch metadata or root
        const result = await sapOData.get('/$metadata');

        res.json({
            success: true,
            message: "Successfully connected to SAP.",
            dataPreview: result ? "Data Received" : "No Data"
        });
    } catch (error) {
        console.error('SAP Connection Test Failed:', error.message);
        res.status(502).json({
            success: false,
            message: "Failed to connect to SAP.",
            error: error.message
        });
    }
};

exports.healthCheck = (req, res) => {
    res.json({ status: 'OK', message: 'Backend is running' });
};
