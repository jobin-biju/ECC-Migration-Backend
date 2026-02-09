
# ECC Migration Backend

This is a basic Node.js backend for the ECC Migration project. It is designed to connect to an SAP system (via Mock RFC or OData/HTTP) and serve data to a chat-like frontend.

## Project Structure

- `src/server.js`: Main entry point.
- `src/config/sap_config.js`: Configuration for SAP connections.
- `src/services/`: Contains connector logic.
  - `sap_odata.js`: Handles HTTP/OData calls (Primary for now).
  - `sap_rfc.js`: Template for RFC calls (requires SAP SDK).
- `src/controllers/chatController.js`: Logic to process prompts and fetch data.

## Setup

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Environment Configuration:**
    - Create a `.env` file in the root directory (copy from `.env.example` if available, or use the provided template).
    - Fill in your SAP details in `.env`.
    
    Example `.env`:
    ```env
    PORT=5000
    SAP_SERVICE_URL=https://your-sap-system.com/sap/opu/odata/...
    SAP_SERVICE_USER=your_user
    SAP_SERVICE_PASSWD=your_password
    ```

3.  **Run the Server:**
    ```bash
    npm start
    ```
    OR
    ```bash
    node src/server.js
    ```

## Connecting to SAP

### Option 1: HTTP / OData (Recommended for standard services)
If you have a URL (like the "PD7 service url"), configure `SAP_SERVICE_URL` in `.env`. The `sap_odata.js` service will use `axios` to make requests.

### Option 2: RFC (Advanced)
If you need direct RFC calls:
1.  Ensure SAP NW RFC SDK is installed on your machine.
2.  Uncomment the `node-rfc` require and logic in `src/services/sap_rfc.js`.
3.  Install the package: `npm install node-rfc`.

## API Endpoints

- **POST /api/chat**
  - Body: `{ "prompt": "Show me material data" }` (or send specific keywords like `users`, `products`, `orders`, `table`)
  - Returns: JSON data from SAP (or structured mock data for the above keywords).

- **GET /api/health**
  - Checks if the server is running.
