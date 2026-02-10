
const axios = require('axios');
require('dotenv').config();

const { SAP_ASHOST, SAP_SYSNR, SAP_CLIENT, SAP_USER, SAP_PASSWD } = process.env;

if (!SAP_ASHOST || !SAP_USER || !SAP_PASSWD) {
    console.error("Missing SAP credentials in .env file.");
    process.exit(1);
}

// Calculate HTTP Port: 8000 + SYSNR
const httpPort = 8000 + parseInt(SAP_SYSNR || '00', 10);
const baseUrl = `http://${SAP_ASHOST}:${httpPort}`;

// Standard generic SAP ping service
// Note: sap-client param instructs SAP which client to login to.
const testUrl = `${baseUrl}/sap/public/ping?sap-client=${SAP_CLIENT}`;

console.log(`\nTesting connection to SAP System...`);
console.log(`Host: ${SAP_ASHOST}`);
console.log(`Port: ${httpPort} (Derived from SysNr ${SAP_SYSNR})`);
console.log(`Client: ${SAP_CLIENT}`);
console.log(`User: ${SAP_USER}`);
console.log(`URL: ${testUrl}`);

async function checkConnection() {
    try {
        const response = await axios.get(testUrl, {
            auth: {
                username: SAP_USER,
                password: SAP_PASSWD
            },
            timeout: 5000 // 5 seconds timeout
        });

        console.log(`\n✅ CONNECTION SUCCESSFUL!`);
        console.log(`Status Code: ${response.status} ${response.statusText}`);
        console.log(`Response Data:`, response.data);
        console.log(`\nThis confirms that:`);
        console.log(`1. The SAP Host (${SAP_ASHOST}) is reachable.`);
        console.log(`2. The System Number (${SAP_SYSNR}) corresponds to an active HTTP port.`);
        console.log(`3. The Username and Password are CORRECT.`);
        console.log(`4. The Client (${SAP_CLIENT}) is valid.`);

    } catch (error) {
        console.error(`\n❌ CONNECTION FAILED`);
        if (error.response) {
            console.error(`Status Code: ${error.response.status} ${error.response.statusText}`);
            if (error.response.status === 401) {
                console.error(`Reason: Authentication Failed. Please check SAP_USER and SAP_PASSWD.`);
            } else if (error.response.status === 403) {
                console.error(`Reason: Forbidden. User might be locked or lacks permissions.`);
            } else if (error.response.status === 404) {
                console.error(`Reason: Service not found. The /sap/public/ping service might be disabled.`);
            } else {
                console.error(`Reason: Server returned an error.`);
            }
        } else if (error.request) {
            console.error(`Reason: No response received. Host might be unreachable or firewall is blocking port ${httpPort}.`);
        } else {
            console.error(`Error: ${error.message}`);
        }
    }
}

checkConnection();
