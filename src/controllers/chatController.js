const sapOData = require('../services/sap_odata');
const sapRfc = require('../services/sap_rfc');
const geminiService = require('../services/gemini.service');

// Basic controller to handle the chat/query request
exports.handleChat = async (req, res) => {
    try {
        const { prompt, query, connectionType } = req.body;
        const userPrompt = prompt || query;

        if (!userPrompt) {
            return res.status(400).json({ error: 'Prompt/Query is required' });
        }

        // console.log(`Received prompt: ${userPrompt}, Connection Type: ${connectionType || 'DEFAULT'}`);

        let result;

        // Simple logic to choose connector
        // If the user specifically asks for RFC or OData, or we can default to one.
        if (connectionType === 'RFC') {
            // Example: Map prompt keywords to an RFC function module
            // e.g., if prompt contains "order", call BAPI_SALESORDER_GETLIST
            const functionName = "BAPI_MOCK_GETLIST";
            result = await sapRfc.executeFunction(functionName, { PROMPT: userPrompt });
        } else {
            // Use Gemini AI for intelligent processing
            // Gemini will fetch data from SAP OData service internally
            result = await geminiService.processQuery(userPrompt);
        }

        res.json({
            success: true,
            prompt: userPrompt,
            data: result
        });

    } catch (error) {
        console.error('Chat Controller Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
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
