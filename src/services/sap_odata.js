const axios = require("axios");
const config = require("../config/sap_config");

/**
 * HARD RULE:
 * - If requestedFields is empty → NO TABLE DATA
 * - If requestedFields exists → RETURN ONLY THOSE FIELDS
 */
class SapODataService {
    constructor() {
        this.baseUrl = config.sapOdata.baseUrl;

        this.client = axios.create({
            baseURL: this.baseUrl,
            auth: config.sapOdata.auth || undefined,
            headers: { Accept: "application/json" }
        });

        console.log("SAP SERVICE URL:", this.baseUrl);
    }

    async fetchByIntent(intent) {
        const { searchText, requestedFields } = intent;

        if (!this.baseUrl) {
            throw new Error("SAP_SERVICE_URL is not configured");
        }

        // 1️⃣ Fetch real API data
        let response;
        try {
            response = await this.client.get("/");
        } catch (err) {
            console.error("API Fetch failed:", err.message);
            return [];
        }

        // 2️⃣ Normalize ANY API response
        let data = response.data;
        if (data?.d?.results) data = data.d.results;      // OData v2
        else if (data?.value) data = data.value;          // OData v4
        else if (!Array.isArray(data)) data = [data];     // REST object

        if (!Array.isArray(data)) return [];

        // 3️⃣ Optional row filtering
        let results = data;
        if (searchText) {
            const lower = searchText.toLowerCase();
            results = results.filter(row =>
                Object.values(row).some(v =>
                    String(v).toLowerCase().includes(lower)
                )
            );
        }

        // 4️⃣ FIELD PROJECTION (Optional)
        // If fields requested -> Return only those
        // If NO fields requested -> Return ALL (Default)
        if (Array.isArray(requestedFields) && requestedFields.length > 0 && results.length > 0) {
            // Create a map of lowercase keys to actual keys from the first row
            const availableKeys = Object.keys(results[0]);
            const keyMap = availableKeys.reduce((acc, k) => {
                acc[k.toLowerCase()] = k;
                return acc;
            }, {});

            // Map requested fields to actual keys
            const validFields = requestedFields
                .map(req => keyMap[req.toLowerCase()])
                .filter(k => k); // Only keep fields that exist in data

            if (validFields.length > 0) {
                results = results.map(row =>
                    Object.fromEntries(
                        validFields.map(k => [k, row[k]])
                    )
                );
            }
        }

        return results;
    }
}

module.exports = new SapODataService();
