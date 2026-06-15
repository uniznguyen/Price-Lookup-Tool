from flask import Flask, request, jsonify
from flask_cors import CORS
import pyodbc
import os
import logging
from dotenv import load_dotenv
from datetime import datetime, date
from decimal import Decimal
import json

load_dotenv()

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Custom JSON Encoder for Decimal and date types (compatible with Flask 2.3+)
class CustomJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        elif isinstance(obj, (date, datetime)):
            return obj.isoformat()
        return super().default(obj)

# Support both old and new Flask versions
try:
    app.json_encoder = CustomJSONEncoder
except AttributeError:
    # Flask 2.3+ uses a different approach
    app.json.encoder = CustomJSONEncoder

# Database configuration
SERVER = os.getenv('DB_SERVER', 'svr_sql_lstnr.valin.com')
DATABASE = os.getenv('DB_NAME', 'CommerceCenter')

logger.info(f"🔧 Server Configuration - Server: {SERVER}, Database: {DATABASE}")

# Connection string using Windows Authentication (Integrated Security)
conn_string = f'Driver={{ODBC Driver 17 for SQL Server}};Server={SERVER};Database={DATABASE};Trusted_Connection=yes;'

def convert_row_types(row_dict):
    """Convert pyodbc result types to JSON-serializable Python types"""
    converted = {}
    for key, value in row_dict.items():
        if value is None:
            converted[key] = None
        elif isinstance(value, Decimal):
            # Convert Decimal to float, preserving precision
            converted[key] = float(value)
        elif isinstance(value, (date, datetime)):
            # Convert dates/datetimes to ISO format strings
            converted[key] = value.isoformat()
        elif isinstance(value, bool):
            # Keep booleans as is
            converted[key] = value
        elif isinstance(value, (int, float, str)):
            # Keep basic types as is
            converted[key] = value
        else:
            # For any other type, convert to string
            logger.debug(f"Converting unexpected type {type(value).__name__} to string: {key}={value}")
            converted[key] = str(value)
    return converted

def get_db_connection():
    """Create and return a database connection"""
    try:
        logger.debug("📡 Attempting database connection...")
        conn = pyodbc.connect(conn_string)
        logger.info("✅ Database connection successful")
        return conn
    except Exception as e:
        logger.error(f"❌ Database connection error: {e}", exc_info=True)
        return None

def get_customer_name(cursor, customer_id):
    """Look up customer_name from p21_view_customer"""
    try:
        logger.debug(f"🔍 Looking up customer_name for customer_id: {customer_id}")
        query = "SELECT customer_name FROM p21_view_customer WHERE customer_id = ?"
        cursor.execute(query, (customer_id,))
        result = cursor.fetchone()
        if result:
            customer_name = result[0]
            logger.debug(f"✓ Found customer_name: {customer_name}")
            return customer_name
        else:
            logger.warning(f"⚠️  Customer not found: {customer_id}")
            return None
    except Exception as e:
        logger.error(f"❌ Error looking up customer: {e}", exc_info=True)
        return None

def get_price_page_details(cursor, price_page_uid):
    """Look up price page details from p21_view_price_page with category from p21_view_price_page_ud"""
    try:
        logger.debug(f"🔍 Looking up price page details for price_page_uid: {price_page_uid}")
        # Query with JOIN to get price_page_category from price_page_ud
        query = """
            SELECT 
                price_page.description, 
                price_page.contract_number, 
                price_page.effective_date, 
                price_page.expiration_date,
                price_page_ud.price_page_category
            FROM p21_view_price_page price_page
            LEFT JOIN p21_view_price_page_ud price_page_ud
                ON price_page.price_page_uid = price_page_ud.price_page_uid
            WHERE price_page.price_page_uid = ?
        """
        cursor.execute(query, (price_page_uid,))
        result = cursor.fetchone()
        if result:
            details = {
                'price_page_description': result[0],
                'contract_number': result[1],
                'effective_date': result[2],
                'expiration_date': result[3],
                'price_page_category': result[4]
            }
            logger.debug(f"✓ Found price page details: {details}")
            return details
        else:
            logger.debug(f"⚠️  No price page found with price_page_uid: {price_page_uid}, trying with price_page column")
            # Try alternate query using price_page column
            query_alt = """
                SELECT 
                    description, 
                    contract_number, 
                    effective_date, 
                    expiration_date,
                    NULL
                FROM p21_view_price_page 
                WHERE price_page = ?
            """
            cursor.execute(query_alt, (price_page_uid,))
            result = cursor.fetchone()
            if result:
                details = {
                    'price_page_description': result[0],
                    'contract_number': result[1],
                    'effective_date': result[2],
                    'expiration_date': result[3],
                    'price_page_category': result[4]
                }
                logger.debug(f"✓ Found price page details with price_page: {details}")
                return details
            else:
                logger.warning(f"⚠️  Price page not found: {price_page_uid}")
                return {}
    except Exception as e:
        logger.error(f"❌ Error looking up price page: {e}", exc_info=True)
        logger.error(f"   This usually means the view name or column names don't match")
        return {}

def get_inv_mast_uid(cursor, item_id):
    """Look up inv_mast_uid from p21_view_inv_mast using item_id"""
    try:
        logger.debug(f"🔍 Looking up inv_mast_uid for item_id: {item_id}")
        query = "SELECT inv_mast_uid FROM p21_view_inv_mast WHERE item_id = ?"
        cursor.execute(query, (item_id,))
        result = cursor.fetchone()
        if result:
            inv_mast_uid = result[0]
            logger.debug(f"✓ Found inv_mast_uid: {inv_mast_uid}")
            return inv_mast_uid
        else:
            logger.error(f"❌ Item not found: {item_id}")
            return None
    except Exception as e:
        logger.error(f"❌ Error looking up item: {e}", exc_info=True)
        return None

@app.route('/api/query-price-batch', methods=['POST'])
def query_price_batch():
    """
    Execute batch price queries for multiple items
    Expected JSON body:
    {
        "customer_id": "CUST001",
        "items": [
            {"item_id": "ITEM1", "location_id": "LOC1", "qty": 10},
            {"item_id": "ITEM2", "location_id": "LOC2", "qty": 5}
        ]
    }
    """
    try:
        logger.info("=" * 60)
        logger.info("🔍 Batch Price Query Request Received")
        logger.info("=" * 60)
        
        data = request.json
        logger.debug(f"📥 Request Data: {data}")
        
        # Validate input
        if 'customer_id' not in data or 'items' not in data:
            logger.warning("⚠️  Missing required fields")
            return jsonify({'error': 'Missing customer_id or items'}), 400
        
        customer_id = data.get('customer_id')
        items = data.get('items', [])
        
        if not items or len(items) == 0:
            logger.warning("⚠️  No items provided")
            return jsonify({'error': 'Items array is empty'}), 400
        
        logger.info(f"📦 Processing {len(items)} item(s) for customer {customer_id}")
        
        # Get main database connection for stored procedure calls
        logger.debug("🔌 Establishing database connection...")
        conn = get_db_connection()
        if not conn:
            logger.error("❌ Failed to establish database connection")
            return jsonify({'error': 'Database connection failed'}), 500
        
        # Create separate connection for lookups
        logger.debug("🔌 Creating separate connection for lookups...")
        lookup_conn = get_db_connection()
        if not lookup_conn:
            logger.error("❌ Failed to establish lookup connection")
            conn.close()
            return jsonify({'error': 'Failed to establish lookup connection'}), 500
        
        lookup_cursor = lookup_conn.cursor()
        logger.debug("✓ Lookup connection established")
        
        # Look up customer name once (shared for all items)
        logger.debug("🔎 Fetching customer details...")
        # Cache for price page details to avoid N+1 lookups
        price_page_cache = {}
        
        customer_name = get_customer_name(lookup_cursor, customer_id)
        
        # Validate customer exists
        if customer_name is None:
            logger.error(f"❌ Customer not found: {customer_id}")
            conn.close()
            lookup_cursor.close()
            lookup_conn.close()
            return jsonify({'error': f'Customer ID {customer_id} not found in the database'}), 404
        
        logger.debug(f"✓ Customer validated: {customer_name}")
        
        # VALIDATION PHASE: Validate all items before querying prices
        logger.info(f"🔍 Validating {len(items)} item(s)...")
        invalid_items = []
        item_cache = {}  # Cache inv_mast_uid lookups during validation
        
        for item_index, item in enumerate(items, 1):
            item_id = str(item.get('item_id')).strip()
            if not item_id:
                invalid_items.append({'index': item_index, 'item_id': item_id, 'error': 'Item ID is empty'})
                continue
            
            # Look up inv_mast_uid
            validation_cursor = lookup_conn.cursor()
            inv_mast_uid = get_inv_mast_uid(validation_cursor, item_id)
            validation_cursor.close()
            
            if inv_mast_uid is None:
                invalid_items.append({'index': item_index, 'item_id': item_id, 'error': f'Item ID {item_id} not found in inventory'})
            else:
                item_cache[item_id] = inv_mast_uid
        
        # If any items are invalid, return error without querying prices
        if invalid_items:
            logger.error(f"❌ Validation failed - {len(invalid_items)} invalid item(s)")
            conn.close()
            lookup_cursor.close()
            lookup_conn.close()
            return jsonify({
                'error': 'Validation failed - some items not found',
                'invalid_items': invalid_items
            }), 400
        
        logger.info(f"✅ All items validated successfully")
        
        all_results = []
        
        # Process each item
        for item_index, item in enumerate(items, 1):
            try:
                logger.info(f"📦 Processing item {item_index}/{len(items)}")
                
                item_id = str(item.get('item_id')).strip()
                location_id = item.get('location_id')
                qty = float(item.get('qty', 1))
                
                logger.debug(f"   Item ID: {item_id}, Location: {location_id}, Qty: {qty}")
                
                # Get a new cursor for each item's stored procedure call
                cursor = conn.cursor()
                
                # Use cached inv_mast_uid from validation phase
                inv_mast_uid = item_cache.get(item_id)
                logger.debug(f"✓ Using cached inv_mast_uid: {inv_mast_uid}")
                
                # Execute stored procedure
                logger.debug(f"🚀 Executing stored procedure for item {item_index}")
                try:
                    cursor.execute('''
                        EXEC dbo.p21_quick_price
                            @customer_id = ?,
                            @company_id = 'VALIN',
                            @inv_mast_uid = ?,
                            @customer_part_no = '',
                            @oe_sales_unit_size = 1,
                            @oe_qty_ordered = ?,
                            @source_location_id = ?,
                            @oe_pricing_unit_size = 1
                    ''', (customer_id, inv_mast_uid, qty, location_id))
                    logger.debug(f"✓ Stored procedure executed for item {item_index}")
                except Exception as e:
                    logger.error(f"❌ Stored procedure error for item {item_index}: {e}")
                    cursor.close()
                    continue
                
                # Fetch results
                columns = [description[0] for description in cursor.description]
                item_rows = cursor.fetchall()
                logger.debug(f"✓ Retrieved {len(item_rows)} result(s) for item {item_index}")
                
                # Process results for this item
                for row in item_rows:
                    row_dict = dict(zip(columns, row))
                    row_dict['customer_id'] = customer_id
                    row_dict['customer_name'] = customer_name
                    row_dict['item_id'] = item_id
                    if 'price_page_uid' in row_dict and row_dict['price_page_uid']:
                        uid = row_dict['price_page_uid']
                        if uid not in price_page_cache:
                            logger.debug(f"🔎 Caching price page details for uid: {uid}")
                            price_page_cache[uid] = get_price_page_details(lookup_cursor, uid)
                        row_dict.update(price_page_cache[uid])
                    
                    converted_row = convert_row_types(row_dict)
                    all_results.append(converted_row)
                
                cursor.close()
                
            except Exception as e:
                logger.error(f"❌ Error processing item {item_index}: {e}", exc_info=True)
                continue
        
        conn.close()
        lookup_cursor.close()
        lookup_conn.close()
        logger.debug("✓ All connections closed")
        
        logger.info(f"✅ Batch query completed - {len(all_results)} total results")
        logger.info("=" * 60)
        
        return jsonify({
            'success': True,
            'data': all_results,
            'count': len(all_results),
            'items_processed': len(items)
        }), 200
    
    except Exception as e:
        logger.error(f"❌ Unexpected error in batch query: {e}", exc_info=True)
        logger.info("=" * 60)
        return jsonify({'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    logger.debug("💚 Health check request received")
    return jsonify({'status': 'ok', 'timestamp': datetime.now().isoformat()}), 200

if __name__ == '__main__':
    logger.info("🚀 Starting Price Inquiry Flask Application")
    logger.info(f"📍 Server: http://0.0.0.0:5000")
    logger.info("🔐 Using Windows Authentication (Integrated Security)")
    app.run(debug=True, host='0.0.0.0', port=5000)
