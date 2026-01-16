#!/bin/bash

# DecoVentory Database Checker
# Run this script to view your database contents

DB_PATH="The DBBackend/database/decoventory.db"

echo "🗄️  DecoVentory Database Contents"
echo "=================================="
echo ""

# Check if database exists
if [ ! -f "$DB_PATH" ]; then
    echo "❌ Database not found at $DB_PATH"
    echo "Run 'npm run init-db' in The DBBackend folder first."
    exit 1
fi

# Materials
echo "📦 MATERIALS:"
echo "-------------"
sqlite3 "$DB_PATH" "SELECT id, name, category, total_quantity, available_quantity, condition FROM materials;" -header -column
echo ""

# Chapel Logs
echo "⛪ CHAPEL LOGS:"
echo "-------------"
CHAPEL_COUNT=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM chapel_logs;")
echo "Total chapel logs: $CHAPEL_COUNT"
if [ $CHAPEL_COUNT -gt 0 ]; then
    sqlite3 "$DB_PATH" "SELECT id, service_date, service_type FROM chapel_logs ORDER BY service_date DESC LIMIT 5;" -header -column
fi
echo ""

# Events
echo "🎉 EVENT DECORATIONS:"
echo "--------------------"
EVENT_COUNT=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM event_decorations;")
echo "Total events: $EVENT_COUNT"
if [ $EVENT_COUNT -gt 0 ]; then
    sqlite3 "$DB_PATH" "SELECT id, event_name, venue, event_date, returned FROM event_decorations ORDER BY event_date DESC LIMIT 5;" -header -column
fi
echo ""

# Borrowers
echo "👥 EXTERNAL BORROWERS:"
echo "---------------------"
BORROWER_COUNT=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM external_borrowers;")
echo "Total borrowers: $BORROWER_COUNT"
if [ $BORROWER_COUNT -gt 0 ]; then
    sqlite3 "$DB_PATH" "SELECT id, borrower_name, borrow_date, expected_return_date, returned FROM external_borrowers ORDER BY borrow_date DESC LIMIT 5;" -header -column
fi
echo ""

# Activity Logs (last 10)
echo "📝 RECENT ACTIVITY (Last 10):"
echo "-----------------------------"
ACTIVITY_COUNT=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM activity_logs;")
echo "Total activity logs: $ACTIVITY_COUNT"
if [ $ACTIVITY_COUNT -gt 0 ]; then
    sqlite3 "$DB_PATH" "SELECT id, material_id, action_type, quantity, created_at FROM activity_logs ORDER BY created_at DESC LIMIT 10;" -header -column
fi
echo ""

echo "✅ Database check complete!"
echo ""
echo "💡 TIP: To check specific tables, run:"
echo "   sqlite3 $DB_PATH \"SELECT * FROM table_name;\""
