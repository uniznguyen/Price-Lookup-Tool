# Price Inquiry Web Application

A web application for querying product pricing information from a MSSQL database using a stored procedure.

## Project Structure

```
Price Inquiry/
├── backend/          # Flask REST API
│   ├── app.py       # Main Flask application
│   ├── requirements.txt
│   ├── .env.example
│   └── .gitignore
├── frontend/        # React SPA with Vite
│   ├── src/
│   │   ├── components/
│   │   │   ├── PriceQueryForm.jsx
│   │   │   └── ResultsDisplay.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── .gitignore
│   └── .env.example
└── README.md
```

## Features

- **React Frontend** with Tailwind CSS styling
- **Flask REST API** backend
- **Windows Authentication** for MSSQL database connections
- **Stored Procedure Integration** with MSSQL database
- **Form Validation** for user inputs
- **Result Display** in table and JSON formats
- **Error Handling** with user-friendly messages
- **Loading States** during API calls

## Prerequisites

- Node.js 16+ (for frontend)
- Python 3.8+ (for backend)
- [uv](https://docs.astral.sh/uv/getting-started/installation/) (Python package manager)
- MSSQL Server ODBC Driver 17
- Windows user account with access to the MSSQL database

## Authentication

This application uses **Windows Authentication (Integrated Security)** to connect to the MSSQL database. This means:
- No username/password credentials are stored
- Your Windows user account credentials are used automatically
- Your computer must be on a domain-connected network
- Your Windows user must have appropriate permissions on the MSSQL database

## Setup & Installation

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a Python virtual environment with uv:
   ```bash
   uv venv
   ```

3. Activate the virtual environment:
   - Windows (CMD):
     ```cmd
     .venv\Scripts\activate.bat
     ```
   - Windows (PowerShell):
     ```powershell
     .venv\Scripts\Activate.ps1
     ```
   - macOS/Linux:
     ```bash
     source .venv/bin/activate
     ```

4. Install dependencies with uv:
   ```bash
   uv pip install -r requirements.txt
   ```

5. Configure `.env` file (optional - only if server/database names differ):
   ```bash
   copy .env.example .env
   ```
   The app uses **Windows Authentication**, so no username/password is needed.

6. Run the Flask application:
   ```bash
   python app.py
   ```
   The API will be available at `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install Node dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:3000`

## Usage

1. Open the application in your browser at `http://localhost:3000`
2. Fill in the query parameters:
   - **Customer ID**: The customer identifier
   - **Item ID**: The product/item identifier
   - **Location ID**: The source location
   - **Quantity**: The quantity to query for
3. Click "Query Price" to submit the request
4. Results will be displayed in both table and JSON formats

## API Endpoints

### POST /api/query-price
Executes the `p21_quick_price` stored procedure.

**Request Body:**
```json
{
  "customer_id": "CUST001",
  "item_id": "ITEM123",
  "location_id": "LOC001",
  "qty": 10
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": [
    {
      "column1": "value1",
      "column2": "value2"
    }
  ],
  "count": 1
}
```

**Response (Error):**
```json
{
  "error": "Error message"
}
```

### GET /api/health
Health check endpoint.

**Response:**
```json
{
  "status": "ok"
}
```

## Development

### Frontend Development
- Modify React components in `frontend/src/components/`
- Update styles in `frontend/src/index.css`
- Vite will hot-reload changes automatically

### Backend Development
- Modify Flask routes in `backend/app.py`
- Restart the Flask server to apply changes
- Use Flask's debug mode for development

## Production Build

### Frontend
```bash
cd frontend
npm run build
```
Output will be in `frontend/dist/`

### Backend
For production deployment, consider using a WSGI server like Gunicorn:
```bash
pip install gunicorn
gunicorn app:app
```

## Notes

- The stored procedure `p21_quick_price` is called with fixed parameters:
  - `@company_id = 'VALIN'`
  - `@customer_part_no = ''`
  - `@oe_sales_unit_size = 1`
  - `@oe_pricing_unit_size = 1`
- You may need to adjust the parameter mapping based on your actual table structure
- Ensure MSSQL Server ODBC Driver 17 is installed on your system

## Troubleshooting

### Database Connection Issues
- Verify your Windows user has database access on the MSSQL server
- Ensure your computer is domain-connected
- Verify ODBC Driver 17 is installed: `odbcconf.exe` (Windows)
- Test connection: `telnet svr_sql_lstnr.valin.com 1433`
- Windows Authentication requires the app to run with your user credentials

### CORS Issues
- The Flask app has CORS enabled for all origins
- For production, configure specific allowed origins in `app.py`

### Port Already in Use
- Change ports in `frontend/vite.config.js` or `backend/app.py`
- Or kill existing processes using the ports

## Future Enhancements

- [ ] Add authentication/authorization
- [ ] Implement caching for frequently accessed data
- [ ] Add export to CSV/Excel functionality
- [ ] Implement pagination for large result sets
- [ ] Add advanced filtering options
- [ ] Setup unit and integration tests
