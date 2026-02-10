
const axios = require('axios');
require('dotenv').config();

const { SAP_ASHOST, SAP_SYSNR, SAP_CLIENT, SAP_USER, SAP_PASSWD } = process.env;

// Calculate HTTP Port
const httpPort = 8000 + parseInt(SAP_SYSNR || '00', 10);
const baseUrl = `http://${SAP_ASHOST}:${httpPort}`;

// Standard SAP Catalog Service (Lists all available OData services)
const catalogUrl = `${baseUrl}/sap/opu/odata/IWFND/CATALOGSERVICE;v=2/ServiceCollection`;

console.log(`\nTesting Standard OData Catalog Service...`);
console.log(`URL: ${catalogUrl}`);

async function checkCatalog() {
    try {
        const response = await axios.get(catalogUrl, {
            auth: {
                username: SAP_USER,
                password: SAP_PASSWD
            },
            params: {
                '$format': 'json',
                '$top': 5 // Just get 5 records
            },
            timeout: 10000
        });

        console.log(`\n✅ ODATA CATALOG ACCESSIBLE!`);
        console.log(`Status: ${response.status} ${response.statusText}`);

        const data = response.data?.d?.results || response.data?.value || [];
        console.log(`\nFound ${data.length} Services. Here is a sample:`);

        data.forEach(service => {
            console.log(`- ${service.TechnicalServiceName} (${service.ServiceVersion})`);
        });

        console.log(`\nRECOMMENDATION: Use this URL in your .env for SAP_SERVICE_URL to see real data.`);

    } catch (error) {
        console.error(`\n❌ ODATA CATALOG FAILED`);
        if (error.response) {
            console.error(`Status: ${error.response.status} ${error.response.statusText}`);
        } else {
            console.error(`Error: ${error.message}`);
        }
    }
}

checkCatalog();
