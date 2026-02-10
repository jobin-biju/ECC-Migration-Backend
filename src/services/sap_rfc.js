
const config = require('../config/sap_config');

// NOTE: To use this, you must install 'node-rfc': npm install node-rfc
// AND have the SAP NW RFC SDK libraries installed on your system.
let noderfc;
try {
    noderfc = require('node-rfc');
} catch (e) {
    console.warn("WARNING: 'node-rfc' module not found or failed to load. SAP RFC functionality will be limited.");
}

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
        if (!noderfc) {
            throw new Error("SAP RFC module (node-rfc) is not installed. Please install SAP NW RFC SDK and run 'npm install node-rfc'.");
        }

        // If client doesn't exist, create it
        if (!this.client) {
            this.client = new noderfc.Client(this.connectionParams);
        }

        // If already open (or we think it is), just return true
        // Note: node-rfc client doesn't have a simple 'isOpen' property in all versions, 
        // usually we try to open and catch 'already open' error or just track state.
        // For simplicity, we'll try to open and catch errors.
        try {
            await this.client.open();
            console.log('Connected to SAP RFC system');
            return true;
        } catch (err) {
            if (err.message && err.message.includes('ALREADY_LINKED')) {
                // Already connected
                return true;
            }
            console.error('Error connecting to SAP RFC:', err);
            throw err;
        }
    }

    async executeFunction(functionName, parameters) {
        if (!noderfc) {
            throw new Error("SAP RFC module (node-rfc) is not installed.");
        }

        try {
            // Ensure connection
            await this.connect();

            console.log(`Executing RFC Function: ${functionName}`, parameters);
            const result = await this.client.call(functionName, parameters || {});
            return result;
        } catch (err) {
            console.error(`Error calling function ${functionName}:`, err);
            // If connection was closed, maybe reset client?
            if (err.message && (err.message.includes('connection closed') || err.message.includes('NOT_LINKED'))) {
                this.client = null; // Force recreation on next call
            }
            throw err;
        }
    }
    async fetchByIntent(intent) {
        if (!noderfc) {
            console.warn("RFC Module not loaded. Returning empty list.");
            return [];
        }

        try {
            console.log("RFC Data Fetch Triggered with intent:", intent);
            await this.connect();

            const params = {
                MAX_ROWS: 100,
                WITH_USERNAME: "X"
            };

            const result = await this.client.call("BAPI_USER_GETLIST", params);
            let data = result.USERLIST || [];

            if (intent.searchText) {
                const lower = intent.searchText.toLowerCase();
                data = data.filter(u =>
                    (u.USERNAME && u.USERNAME.toLowerCase().includes(lower)) ||
                    (u.FULLNAME && u.FULLNAME.toLowerCase().includes(lower))
                );
            }

            if (Array.isArray(intent.requestedFields) && intent.requestedFields.length > 0) {
                data = data.map(u => {
                    let filtered = {};
                    intent.requestedFields.forEach(field => {
                        const upperField = field.toUpperCase();
                        if (u[upperField]) filtered[field] = u[upperField];
                        else filtered[field] = u[upperField] || u[field];
                    });
                    return filtered;
                });
            }

            return data;

        } catch (err) {
            console.error("RFC fetchByIntent failed:", err);
            return [];
        }
    }

    isSdkInstalled() {
        return !!noderfc;
    }
}

module.exports = new SapRfcService();
