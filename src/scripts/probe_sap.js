
const axios = require('axios');
require('dotenv').config();

const host = process.env.SAP_ASHOST;
const port = 8000; // Common HTTP port for SAP (80 + sysnr 00)
// If sysnr is 00, port is 8000. If 01 -> 8001.
// We can try to infer from SAP_SYSNR
const sysnr = process.env.SAP_SYSNR || '00';
const calcPort = 8000 + parseInt(sysnr, 10);

const baseUrl = `http://${host}:${calcPort}`;
const pingPath = '/sap/public/ping'; // Common ping service
const metadataPath = '/sap/opu/odata/IWFND/CATALOGSERVICE;v=2/$metadata'; // Service catalog

async function probe() {
    console.log(`Probing SAP HTTP at ${baseUrl}...`);

    try {
        console.log(`Trying ${pingPath}...`);
        await axios.get(baseUrl + pingPath, { timeout: 3000 });
        console.log('SUCCESS: SAP HTTP service is reachable!');
        console.log(`You can probably use OData with URL: ${baseUrl}/sap/opu/odata/...`);
    } catch (err) {
        console.log(`Ping failed: ${err.message}`);
        if (err.response) {
            console.log(`Response Status: ${err.response.status}`);
            if (err.response.status === 401) {
                console.log('SUCCESS (Auth Required): Service is reachable but requires login.');
            }
        }
    }
}

probe();
