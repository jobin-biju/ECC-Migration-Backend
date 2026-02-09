const axios = require('axios');
const config = require('../config/sap_config');

// This service handles HTTP/OData calls to SAP
class SapODataService {
    constructor() {
        this.client = axios.create({
            baseURL: config.sapOdata.baseUrl,
            auth: {
                username: config.sapOdata.auth.username,
                password: config.sapOdata.auth.password
            },
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        if (config.sapOdata.proxy && config.sapOdata.proxy.host) {
            console.log(`Using Proxy: ${config.sapOdata.proxy.host}:${config.sapOdata.proxy.port}`);

            const proxyConfig = {
                host: config.sapOdata.proxy.host,
                port: parseInt(config.sapOdata.proxy.port)
            };

            if (config.sapOdata.proxy.auth.username) {
                proxyConfig.auth = {
                    username: config.sapOdata.proxy.auth.username,
                    password: config.sapOdata.proxy.auth.password
                };
            }

            this.client.defaults.proxy = proxyConfig;
        }

        console.log('Using OData Base URL:', config.sapOdata.baseUrl || '(Not set)');
    }

    // Example method to fetch data based on a prompt or query
    // This is a placeholder. In a real scenario, you'd map the prompt to a specific OData filter or entity.
    async executeQuery(prompt) {
        try {
            console.log(`Executing OData query for prompt: "${prompt}"`);
            const lowerPrompt = prompt.toLowerCase();
            // ---------------------------------------------------------
            // 2. SMART FILTERING LOGIC
            // ---------------------------------------------------------

            // Filter USERS
            if (lowerPrompt.includes("user") || lowerPrompt.includes("kna1")) {
                const results = mockUsers.filter(u => {
                    // Check if prompt contains specific ID or Name or Department
                    const terms = lowerPrompt.split(' ');
                    // If user just says "users", return all
                    if (lowerPrompt === "users" || lowerPrompt === "show users" || lowerPrompt === "list users") return true;

                    // Otherwise, check for matches
                    return terms.some(term =>
                        u.UserID.toLowerCase().includes(term) ||
                        u.Name.toLowerCase().includes(term) ||
                        u.Department.toLowerCase().includes(term)
                    );
                });
                return results.length > 0 ? results : mockUsers; // Default to all if no specific match
            }

            // Filter PRODUCTS
            if (lowerPrompt.includes("product") || lowerPrompt.includes("material") || lowerPrompt.includes("mara")) {
                const results = mockProducts.filter(p => {
                    const terms = lowerPrompt.split(' ');
                    if (lowerPrompt === "products" || lowerPrompt === "list products") return true;

                    return terms.some(term =>
                        p.MaterialID.toLowerCase().includes(term) ||
                        p.Description.toLowerCase().includes(term) ||
                        p.Type.toLowerCase().includes(term)
                    );
                });
                return results.length > 0 ? results : mockProducts;
            }

            // Filter ORDERS
            if (lowerPrompt.includes("order") || lowerPrompt.includes("sales") || lowerPrompt.includes("vbak")) {
                const results = mockOrders.filter(o => {
                    const terms = lowerPrompt.split(' ');
                    if (lowerPrompt === "orders") return true;

                    return terms.some(term =>
                        o.OrderID.toLowerCase().includes(term) ||
                        o.Customer.toLowerCase().includes(term) ||
                        o.Status.toLowerCase().includes(term)
                    );
                });
                return results.length > 0 ? results : mockOrders;
            }

            // ---------------------------------------------------------
            // 3. FALLBACK TO REAL SAP FETCH (If configured)
            // ---------------------------------------------------------
            if (config.sapOdata.baseUrl) {
                try {
                    console.log(`No mock match. Fetching from SAP URL: ${config.sapOdata.baseUrl}`);
                    const response = await this.client.get(config.sapOdata.baseUrl);
                    let data = response.data;
                    let results = [];

                    // Normalize Data
                    if (data.d && data.d.results) results = data.d.results;
                    else if (data.value) results = data.value;
                    else if (Array.isArray(data)) results = data;
                    else results = [data];


                    // ---------------------------------------------------------
                    // INTELLIGENT DATA FILTERING (COLUMN & ROW)
                    // ---------------------------------------------------------

                    if (results.length > 0 && lowerPrompt) {
                        const sampleItem = results[0];
                        const keys = Object.keys(sampleItem).map(k => k.toLowerCase());
                        const promptKey = lowerPrompt.trim();

                        // 1. COLUMN SCENARIO: Check if prompt matches a column name (e.g. "name", "email")
                        // We check if the prompt exactly matches a key
                        const matchingKeyOriginal = Object.keys(sampleItem).find(k => k.toLowerCase() === promptKey);

                        if (matchingKeyOriginal) {
                            console.log(`Prompt "${prompt}" matches column "${matchingKeyOriginal}". Returning only this column.`);
                            return results.map(item => ({
                                [matchingKeyOriginal]: item[matchingKeyOriginal]
                            }));
                        }

                        // 2. ROW SCENARIO: Filter rows based on value matches
                        // If it's not a column name, treat it as a search term
                        const terms = lowerPrompt.split(' ').filter(t => t.trim().length > 0);

                        if (terms.length > 0) {
                            const filtered = results.filter(item => {
                                // Recursively get all leaf values to avoid matching keys (e.g. searching for "name" shouldn't match the key "name")
                                const getLeafValues = (obj) => {
                                    let vals = [];
                                    if (obj === null || obj === undefined) return [];
                                    if (typeof obj === 'object') {
                                        Object.values(obj).forEach(v => {
                                            vals = vals.concat(getLeafValues(v));
                                        });
                                    } else {
                                        vals.push(String(obj).toLowerCase());
                                    }
                                    return vals;
                                };

                                const allValues = getLeafValues(item).join(' ');
                                return terms.every(term => allValues.includes(term));
                            });

                            if (filtered.length > 0) {
                                return filtered;
                            } else {
                                // 3. NO DATA SCENARIO
                                // User said: "if other than anything is typed it should show no data"
                                return [{ Message: `No data found matching "${prompt}".` }];
                            }
                        }
                    }

                    // Default return (if no logic applied): return full list (or empty if we want strictness)
                    // Given the user constraint "not all data", we should perhaps default to empty if prompt exists but didn't trigger above?
                    // But effectively the 'terms' check covers most inputs.
                    return results;

                } catch (fetchError) {
                    console.error("Real SAP fetch failed:", fetchError.message);
                }
            }

            // 4. Fallback if nothing else worked
            return [
                { Message: "No specific data found for your query. Try 'users', 'sales', 'products', or 'Order 9001'." }
            ];

        } catch (error) {
            console.error('Error connecting to SAP OData:', error.message);
            return {
                error: true,
                message: `Backend Error: ${error.message}`
            };
        }
    }

    // Generic method to call any endpoint
    async get(endpoint) {
        try {
            const response = await this.client.get(endpoint);
            return response.data;
        } catch (error) {
            console.error('Error in SAP GET request:', error.message);
            throw error;
        }
    }
    // Method to get all available data (mock or real) to provide context to AI
    async getAllData() {
        // Concatenate all mock data for context
        const mockUsers = [
            { UserID: "U1001", Name: "Alice Smith", Department: "Sales", Role: "Manager", Status: "Active" },
            { UserID: "U1002", Name: "Bob Johnson", Department: "IT", Role: "Developer", Status: "Active" },
            { UserID: "U1003", Name: "Charlie Brown", Department: "HR", Role: "Specialist", Status: "On Leave" },
            { UserID: "U1004", Name: "Diana Prince", Department: "Finance", Role: "Analyst", Status: "Active" },
            { UserID: "U1005", Name: "Evan Wright", Department: "Logistics", Role: "Coordinator", Status: "Inactive" }
        ];

        const mockProducts = [
            { MaterialID: "M-5001", Description: "Steel Pipe 10mm", Type: "Raw Material", Stock: 1500, Unit: "M" },
            { MaterialID: "M-5002", Description: "Copper Wire 5mm", Type: "Raw Material", Stock: 800, Unit: "M" },
            { MaterialID: "M-5003", Description: "Plastic Casing A", Type: "Component", Stock: 5000, Unit: "PCS" },
            { MaterialID: "M-5004", Description: "Control Unit V2", Type: "Finished Good", Stock: 120, Unit: "PCS" },
            { MaterialID: "M-5005", Description: "Packaging Box L", Type: "Packaging", Stock: 2000, Unit: "PCS" }
        ];

        const mockOrders = [
            { OrderID: "SO-9001", Customer: "TechCorp Inc.", Amount: 15000.00, Currency: "USD", Date: "2023-10-01", Status: "Shipped" },
            { OrderID: "SO-9002", Customer: "Global Solutions", Amount: 8500.50, Currency: "USD", Date: "2023-10-02", Status: "Processing" },
            { OrderID: "SO-9003", Customer: "Retail Giants", Amount: 4200.00, Currency: "EUR", Date: "2023-10-03", Status: "Pending" },
            { OrderID: "SO-9004", Customer: "Local Partners", Amount: 1200.00, Currency: "USD", Date: "2023-10-05", Status: "Delivered" }
        ];

        // If real SAP URL is configured, try to fetch from there instead/also
        if (config.sapOdata.baseUrl) {
            try {
                const response = await this.client.get(config.sapOdata.baseUrl);
                let data = response.data;
                let results = [];
                if (data.d && data.d.results) results = data.d.results;
                else if (data.value) results = data.value;
                else if (Array.isArray(data)) results = data;
                else results = [data];

                // For now, return real data if available, otherwise fallback to mocks
                if (results.length > 0) return results;
            } catch (e) {
                console.error("Failed to fetch all data from SAP, falling back to mocks", e.message);
            }
        }

        // Return combined mock data for context
        return [...mockUsers, ...mockProducts, ...mockOrders];
    }
}

module.exports = new SapODataService();
