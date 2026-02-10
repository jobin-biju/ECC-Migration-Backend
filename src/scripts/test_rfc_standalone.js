
const sapRfc = require('../services/sap_rfc');
require('dotenv').config();

async function runTest() {
    console.log('--- Starting Standalone SAP RFC Connection Test ---');

    try {
        console.log('Attempting to connect via RFC...');
        await sapRfc.connect();
        console.log('Connect call successful.');

        console.log('Attempting RFC_PING...');
        try {
            await sapRfc.executeFunction('RFC_PING', {});
            console.log('RFC_PING successful!');
        } catch (pingErr) {
            console.warn('RFC_PING failed (this might be normal if permission denied):', pingErr.message);
        }

        console.log('\n--- CONNECTION SUCCESSFUL ---');
    } catch (err) {
        console.error('\n--- CONNECTION FAILED ---');
        console.error('Error:', err.message);
        if (err.message.includes('node-rfc')) {
            console.error('\nIMPORTANT: usage of SAP RFC requires the SAP NW RFC SDK.');
            console.error('1. Download SAP NW RFC SDK from SAP Support Portal.');
            console.error('2. Extract to a folder (e.g. C:\\nwrfcsdk).');
            console.error('3. Add the "lib" folder to your system PATH.');
            console.error('4. Run "npm install node-rfc" again.');
        }
    }
}

runTest();
