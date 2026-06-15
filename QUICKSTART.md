# Quick Start Guide

Get the Price Inquiry application running in 5 minutes.

## Prerequisites

Make sure you have installed:
- [Node.js 16+](https://nodejs.org/)
- [Python 3.8+](https://www.python.org/)
- [uv](https://docs.astral.sh/uv/getting-started/installation/) (Python package manager)
- MSSQL Server ODBC Driver 17 (for database connection)

## Windows Quick Start

### Terminal 1: Backend Setup & Run

```cmd
REM Navigate to backend
cd backend

REM Create virtual environment with uv using Python 3.11
uv venv --python 3.11

REM Activate virtual environment
.venv\Scripts\activate.bat

REM Install dependencies with uv
uv pip install -r requirements.txt

REM Run Flask server
python app.py
```

Backend will be running at: **http://localhost:5000**

### Terminal 2: Frontend Setup & Run

```powershell
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will be running at: **http://localhost:3000**

## Testing the Application

1. Open your browser to **http://localhost:3000**
2. Fill in the form with test data:
   - Customer ID: `CUST001` (or your test value)
   - Item ID: `ITEM123` (or your test value)
   - Location ID: `LOC001` (or your test value)
   - Quantity: `10`
3. Click "Query Price"
4. You should see results from the stored procedure

## Deactivating Virtual Environment

To deactivate the virtual environment, use:

```cmd
.venv\Scripts\deactivate.bat
```

Or simply close the terminal and open a new one.

## Troubleshooting

### "ModuleNotFoundError: No module named 'pyodbc'"
```bash
uv pip install -r requirements.txt
```

### "npm: command not found"
- Node.js is not installed. Install from https://nodejs.org/

### "Database connection failed"
- The app uses Windows Authentication. Make sure:
  - Your Windows user account has access to the MSSQL database
  - You're running the app on a domain-connected machine
  - Ensure server is accessible: `ping svr_sql_lstnr.valin.com`
  - Check MSSQL Server ODBC Driver 17 is installed

### \"Port 3000 already in use\"
Edit `frontend/vite.config.js`:
```javascript
server: {
  port: 3001,  // Change to another port
}
```

### \"Port 5000 already in use\"
Edit `backend/app.py`:
```python
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)  # Change to another port
```

## Next Steps

- Read [README.md](./README.md) for complete documentation
- Check [stored_procedure.md](./stored_procedure.md) for database details
- Customize the form fields to match your actual stored procedure parameters
- Add authentication/authorization for production use

## Support

For issues or questions, refer to the main README.md file or check the browser console for error messages.
