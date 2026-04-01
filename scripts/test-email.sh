#!/bin/bash

# Quick Email Testing Script
# Run this to test if emails are working

echo "📧 Email System Testing"
echo "======================="
echo ""

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "❌ npm not found"
    exit 1
fi

echo "1️⃣  Running email tests..."
npm test -- src/test/emailService.test.ts src/test/triggers.test.ts --run

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ All email tests passed!"
    echo ""
    echo "Next steps to receive actual emails:"
    echo "1. supabase start"
    echo "2. supabase functions deploy send-email"
    echo "3. npm run dev"
    echo "4. Sign up at http://localhost:5173/auth/signup"
    echo "5. Check DevTools Console (F12) for 'Email queued:' confirmation"
    echo ""
else
    echo ""
    echo "❌ Some tests failed. Check the output above."
    exit 1
fi
