
const config = require('../config/sap_config');

// NOTE: To use this, you must install 'node-rfc': npm install node-rfc
// AND have the SAP NW RFC SDK libraries installed on your system.
// Otherwise, this file will cause errors if uncommented.

/*
const noderfc = require('node-rfc');
*/

class SapRfcService {
    constructor() {
        this.client = null;
        this.connectionParams = {
            ashost: config.sapRfc.ashost,
            sysnr: config.sapRfc.sysnr,
            client: config.sapRfc.client,
            user: config.sapRfc.user,
            passwd: config.sapRfc.passwd,
            lang: config.sapRfc.lang
        };
    }

    async connect() {
        /*
        if (!this.client) {
          this.client = new noderfc.Client(this.connectionParams);
        }
    
        try {
          await this.client.open();
          console.log('Connected to SAP RFC system');
        } catch (err) {
          console.error('Error connecting to SAP RFC:', err);
          throw err;
        }
        */
        console.log('RFC Connection method called (Mock). Uncomment code in sap_rfc.js to use real connection.');
        return true;
    }

    async executeFunction(functionName, parameters) {
        /*
        if (!this.client) {
            await this.connect();
        }
    
        try {
            const result = await this.client.call(functionName, parameters);
            return result;
        } catch (err) {
            console.error(`Error calling function ${functionName}:`, err);
            throw err;
        }
        */

        // Mock Response
        console.log(`Mocking RFC Call: ${functionName} with params`, parameters);
        return {
            FUNCTION: functionName,
            RESULT: "Success (Mock)",
            DATA: [
                { MOCK_FIELD: "Value 1" },
                { MOCK_FIELD: "Value 2" }
            ]
        };
    }
}

module.exports = new SapRfcService();
