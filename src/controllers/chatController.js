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

        // 1. Try OData Metadata (Best for data access)
        try {
            const result = await sapOData.get('/$metadata');
            return res.json({
                success: true,
                message: "Successfully connected to SAP OData Service.",
                method: "OData $metadata",
                dataPreview: "Service Metadata Received"
            });
        } catch (odataError) {
            console.warn("OData metadata fetch failed, trying HTTP Ping fallback...", odataError.message);
        }

        // 2. Fallback: HTTP Ping (Tests basic connectivity & credentials)
        // We use axios directly here for the specific ping path
        const axios = require('axios');
        const config = require('../config/sap_config');

        // Construct Ping URL
        const host = config.sapRfc.ashost || 'localhost';
        const sysnr = config.sapRfc.sysnr || '00';
        const client = config.sapRfc.client || '800';
        const port = 8000 + parseInt(sysnr, 10);
        const pingUrl = `http://${host}:${port}/sap/public/ping?sap-client=${client}`;

        const auth = {
            username: config.sapRfc.user,
            password: config.sapRfc.passwd
        };

        const pingRes = await axios.get(pingUrl, { auth, timeout: 5000 });

        res.json({
            success: true,
            message: "Successfully connected to SAP System (HTTP Layer).",
            method: "HTTP Ping",
            details: {
                status: pingRes.status,
                text: pingRes.statusText,
                note: "Basic connectivity and credentials are valid. OData service might not be active or configured."
            }
        });

    } catch (error) {
        console.error('SAP Connection Test Failed:', error.message);
        res.status(502).json({
            success: false,
            message: "Failed to connect to SAP.",
            error: error.message,
            hint: "Check VPN, Host/Port, or Credentials."
        });
    }
};

exports.testRfcConnection = async (req, res) => {
    try {
        console.log('Testing SAP RFC Connection...');
        // Try to connect
        await sapRfc.connect();

        // Try to ping
        let pingResult = { message: "Connected successfully" };
        try {
            // RFC_PING is a standard function
            await sapRfc.executeFunction('RFC_PING', {});
            pingResult.ping = "RFC_PING successful";
        } catch (e) {
            console.warn("RFC_PING failed, but connection open:", e.message);
        }

        res.json({
            success: true,
            message: "Successfully connected to SAP via RFC.",
            data: pingResult
        });
    } catch (error) {
        console.error('SAP RFC Connection Test Failed:', error.message);
        res.status(502).json({
            success: false,
            message: "Failed to connect to SAP via RFC.",
            error: error.message,
            hint: error.message.includes('node-rfc') ? "node-rfc module missing. Install SAP SDK and run 'npm install node-rfc'" : "Check connection parameters in .env"
        });
    }
};

exports.healthCheck = (req, res) => {
    res.json({ status: 'OK', message: 'Backend is running' });
};
