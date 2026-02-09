
const sapODataService = require('../services/sap_odata');
require('dotenv').config();

async function testConnection() {
    console.log('--- Starting SAP OData Connection Test ---');
    console.log(`Target URL: ${process.env.SAP_SERVICE_URL}`);

    if (!process.env.SAP_SERVICE_URL) {
        console.error('ERROR: SAP_SERVICE_URL is not defined in .env file.');
        return;
    }

    try {
        console.log('Attempting to fetch service metadata ($metadata)...');
        // OData services usually expose a $metadata endpoint
        // We try to fetch the root or $metadata. 
        // If the user pasted a full URL to an entity set, we might just try that.
        // Let's try appending $metadata first.

        let testUrl = '/$metadata';

        // If the URL already ends in specific query, we might need to adjust.
        // For this basic test, we assume the user provides the base service URL.

        const responseData = await sapODataService.get(testUrl);

        console.log('\n--- Connection SUCCESSFUL! ---');
        console.log('Successfully received data from SAP.');
        console.log('Preview of data received (first 500 chars):');
        console.log(JSON.stringify(responseData).substring(0, 500));
        console.log('...');

    } catch (metadataError) {
        // If $metadata fails (common if testing with non-SAP APIs like jsonplaceholder), try the base URL
        console.log('Metadata check failed (404 or other). Trying base URL...');

        try {
            const fallbackResponse = await sapODataService.get('');
            console.log('\n--- Connection SUCCESSFUL! (Base URL) ---');
            console.log('Successfully received data from the service.');
            console.log('Preview of data received (first 500 chars):');
            console.log(JSON.stringify(fallbackResponse).substring(0, 500));
            console.log('...');
        } catch (baseError) {
            console.log('\n--- Connection FAILED ---');
            console.error('Metadata Error:', metadataError.message);
            console.error('Base URL Error:', baseError.message);

            if (baseError.response) {
                console.error('Status Code:', baseError.response.status);
            } else {
                console.error('This might be a network issue or the URL is incorrect.');
            }
        }
    }
}

testConnection();
