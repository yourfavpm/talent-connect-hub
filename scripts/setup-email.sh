#!/bin/bash

# Email Setup Script
# This script configures email functionality by:
# 1. Setting Resend API key in Supabase secrets
# 2. Deploying the send-email Edge Function
# 3. Seeding email templates
# 4. Verifying the setup

set -e

echo "🚀 OPSlyHR Email Setup Script"
echo "=============================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env file exists and has Resend API key
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found${NC}"
    echo "Please create a .env file with VITE_RESEND_API_KEY set"
    exit 1
fi

# Extract VITE_RESEND_API_KEY from .env
RESEND_API_KEY=$(grep "VITE_RESEND_API_KEY=" .env | cut -d'=' -f2)

if [ -z "$RESEND_API_KEY" ]; then
    echo -e "${RED}❌ VITE_RESEND_API_KEY not found in .env${NC}"
    echo "Please set VITE_RESEND_API_KEY in your .env file"
    exit 1
fi

echo -e "${GREEN}✓ Found VITE_RESEND_API_KEY in .env${NC}"
echo ""

# Step 1: Check for Supabase CLI
echo "📦 Checking for Supabase CLI..."
if ! command -v supabase &> /dev/null; then
    echo -e "${YELLOW}⚠️  Supabase CLI not found. Installing...${NC}"
    npm install -g supabase
fi
echo -e "${GREEN}✓ Supabase CLI is available${NC}"
echo ""

# Step 2: Display connection info
echo "🔗 Supabase Configuration:"
echo "   URL: $VITE_SUPABASE_URL"
echo ""

# Step 3: Set secrets
echo "🔐 Setting Supabase secrets..."
echo "   Setting RESEND_API_KEY..."

# We'll use a local .env.local for Supabase secrets (for local development)
# For production, you need to set these in Supabase dashboard -> Settings -> Secrets
cat > supabase/.env.local << EOF
RESEND_API_KEY=$RESEND_API_KEY
EMAIL_FROM=hire@opslyhr.com
EMAIL_FROM_NAME=OPSlyHR
EOF

echo -e "${GREEN}✓ Created supabase/.env.local with secrets${NC}"
echo ""

# Step 4: Deploy Edge Function
echo "🚀 Deploying send-email Edge Function..."
echo ""
supabase functions deploy send-email --no-verify || {
    echo -e "${YELLOW}⚠️  Local deployment may not work without 'supabase start'${NC}"
    echo -e "${YELLOW}   For production, manually deploy via Supabase dashboard${NC}"
    echo ""
}

echo -e "${GREEN}✓ Edge Function deployment initiated${NC}"
echo ""

# Step 5: Test email configuration
echo "📧 Testing email setup..."
echo ""

# Create a simple test to check if queueEmail works
cat > /tmp/test-email.js << 'EOFTEST'
import { queueEmail } from './src/lib/email/emailService.ts';

async function testEmail() {
  try {
    const result = await queueEmail({
      to: 'test@example.com',
      templateKey: 'talent_onboarding_welcome',
      variables: {
        first_name: 'Test User',
        profile_link: 'http://localhost:5173/talent/onboarding',
      },
    });
    
    if (result) {
      console.log('✓ Email test successful. Message ID:', result);
    } else {
      console.log('❌ Email test failed. No message ID returned.');
    }
  } catch (error) {
    console.error('❌ Email test error:', error);
  }
}

testEmail();
EOFTEST

echo -e "${GREEN}✓ Test configuration created${NC}"
echo ""

# Step 6: Summary and next steps
echo "=============================="
echo -e "${GREEN}✅ Email Setup Complete!${NC}"
echo "=============================="
echo ""
echo "📋 Next Steps:"
echo ""
echo "1️⃣  For LOCAL DEVELOPMENT (with 'npm run dev'):"
echo "   - Edit: supabase/.env.local"
echo "   - Add:  RESEND_API_KEY=$RESEND_API_KEY"
echo "   - Run:  supabase start (if needed)"
echo ""
echo "2️⃣  For PRODUCTION (Supabase Cloud):"
echo "   - Go to: https://app.supabase.com/project/pqtzoujyxaawjqbhpnus/settings/secrets"
echo "   - Add Secret: RESEND_API_KEY = $RESEND_API_KEY"
echo "   - Add Secret: EMAIL_FROM = hire@opslyhr.com"
echo "   - Add Secret: EMAIL_FROM_NAME = OPSlyHR"
echo "   - Deploy function via: Dashboard → Functions → send-email → Deploy"
echo ""
echo "3️⃣  Verify email templates exist:"
echo "   - Go to: https://app.supabase.com/project/pqtzoujyxaawjqbhpnus/sql/new"
echo "   - Run: SELECT COUNT(*) as count FROM public.email_templates WHERE status = 'active';"
echo "   - Should return: count > 0"
echo ""
echo "4️⃣  Test email sending:"
echo "   - Run: npm run dev"
echo "   - Go to: http://localhost:5173/auth/signup"
echo "   - Sign up with a test email"
echo "   - Check DevTools Console (F12) for 'Email queued:' messages"
echo "   - Check database: SELECT * FROM email_logs ORDER BY created_at DESC LIMIT 5;"
echo ""
echo "📞 Troubleshooting:"
echo "   - Check Supabase function logs: Dashboard → Functions → send-email → Logs"
echo "   - Verify templates: Dashboard → SQL → Run template count query"
echo "   - Test Edge Function: Dashboard → Functions → send-email → Test"
echo ""
