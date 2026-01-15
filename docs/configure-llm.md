# LLM Integration Setup

[← Back to README](../README.md) | [Development Guide](./getting-started-development.md)

This guide explains how to set up and use the AI-powered portfolio analysis feature in your Finance Manager application.

## Overview

The LLM integration allows you to get AI-powered insights and recommendations about your portfolio. The system supports:
- **Claude** (Anthropic) - Advanced reasoning and analysis
- **Gemini** (Google) - Fast, efficient analysis

## Prerequisites

You'll need at least one API key:
- **Anthropic API key** (optional): Get it from [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys)
- **Gemini API key** (optional): Get it from [makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)

## Setup Instructions

### Step 1: Generate Encryption Secret

The encryption secret is used to securely store your API keys in the database.

```bash
# Generate a secure random secret
openssl rand -base64 32
```

This should already be done in your `.env.local` file located at `app/.env.local`. If not, create the file:

```bash
# app/.env.local
APP_SECRET=your_generated_secret_here
```

**Important**: Never commit `.env.local` to version control. It's already in `.gitignore`.

### Step 2: Configure API Keys

1. Start your application:
   ```bash
   cd app
   bun run dev
   ```

2. Navigate to **Settings** page (http://localhost:3000/settings)

3. Scroll to the **AI Analysis Settings** section

4. Enter your API key(s):
   - **Anthropic API Key**: Starts with `sk-ant-...`
   - **Gemini API Key**: Usually starts with `AIza...`

5. Select your **Preferred AI Provider** (Claude or Gemini)

6. Click **Save Settings**

Your API keys are now encrypted and stored securely in the database.

## Usage

### Running Portfolio Analysis

1. Navigate to the **Dashboard** (home page)

2. Click the **"Analyze Portfolio"** button (with sparkles icon ✨)

3. Wait 5-10 seconds while the AI analyzes your data

4. A success message will appear: "✓ Analysis complete! Check notifications."

### Viewing Analysis Reports

1. Look for the **bell icon** 🔔 in the top-right corner of the navigation bar

2. If there are unread reports, you'll see a red badge with the count

3. Click the bell icon to open the notifications dropdown

4. Each report shows:
   - **Recommendation**: BUY, SELL, or HOLD
   - **Confidence Level**: High, Medium, or Low
   - **AI Provider**: Claude or Gemini
   - **Reasoning**: Detailed explanation
   - **Risk Factors**: Identified risks
   - **Opportunities**: Potential advantages

5. Click on a report to mark it as read

## What Gets Analyzed?

The AI analyzes your complete financial picture:
- **All Transactions**: Buy, sell, vest events, and more
- **Current Holdings**: What you own and current values
- **Tax Calculations**: Danish tax implications and rates
- **Portfolio Metrics**: Gains, losses, concentration risk

## How It Works

1. **On-Demand Analysis**: You trigger the analysis manually (no automatic background jobs)

2. **Data Gathering**: The system collects your transactions, holdings, and tax data

3. **AI Processing**: Your preferred LLM (Claude or Gemini) analyzes the data and provides:
   - Investment recommendation (Buy/Sell/Hold)
   - Detailed reasoning
   - Risk assessment
   - Opportunities identification

4. **Notification**: Results are saved to the database and displayed in the notification bell

5. **Polling**: The bell icon checks for new reports every 30 seconds

## Security

### Encryption

- API keys are encrypted using **AES-256-GCM** before storage
- Encryption key is derived from `APP_SECRET` environment variable
- Keys are never logged or exposed in API responses
- Database stores only encrypted data

### Data Privacy

- Your financial data is sent only to the AI provider you select
- No third-party services except the chosen LLM (Claude or Gemini)
- All data stays in your local database
- API keys remain on your server (never transmitted to other services)

## Troubleshooting

### "APP_SECRET environment variable not set"

**Solution**: Create `app/.env.local` with a valid `APP_SECRET`:
```bash
cd app
echo "APP_SECRET=$(openssl rand -base64 32)" > .env.local
```

### "LLM not configured. Please add API keys in settings."

**Solution**:
1. Go to Settings page
2. Enter at least one API key
3. Click Save Settings

### "No API key configured for [provider]"

**Solution**:
1. You selected Claude/Gemini as preferred provider, but didn't add its API key
2. Either add the missing key, or change preferred provider to the one you have configured

### "Invalid Anthropic/Gemini API key format"

**Solution**: Check your API key:
- **Anthropic keys** must start with `sk-ant-` and be at least 30 characters
- **Gemini keys** must be at least 20 characters and contain only alphanumeric characters, dashes, and underscores

### Analysis Times Out

**Possible causes**:
- Invalid API key (check account status)
- API rate limit exceeded
- Network connectivity issues

**Solution**:
1. Verify API key is valid and active
2. Check your API provider's dashboard for quota/limits
3. Wait a few minutes and try again

### No Notifications Appearing

**Solution**:
1. Check that the analysis completed successfully (look for success message)
2. Click the bell icon to manually refresh notifications
3. Check browser console for errors (F12 → Console tab)

## API Costs

Each analysis incurs API costs from your chosen provider:

| Provider | Model | Approximate Cost per Analysis |
|----------|-------|------------------------------|
| Claude | Claude 3.5 Sonnet | ~$0.01-0.05 |
| Gemini | Gemini 1.5 Flash | ~$0.005-0.02 |

Costs depend on:
- Amount of transaction data
- Number of holdings
- Length of AI response

**Tip**: Monitor your API usage in the provider's dashboard.

## Database Tables

The feature adds two new tables to your SQLite database:

### `llm_settings`
Stores encrypted API keys and preferences:
- `anthropic_api_key_encrypted` - Encrypted Anthropic key
- `gemini_api_key_encrypted` - Encrypted Gemini key
- `preferred_llm` - User's preferred provider
- `encryption_iv` - Initialization vector for encryption

### `llm_analysis_reports`
Stores analysis results:
- `llm_provider` - Which AI was used (claude/gemini)
- `recommendation` - Buy, sell, or hold
- `reasoning` - Detailed explanation
- `confidence_level` - High, medium, or low
- `risk_factors` - JSON array of risks
- `opportunities` - JSON array of opportunities
- `is_read` - Whether notification was read

## Verification

To verify everything is working:

1. **Check environment**:
   ```bash
   cat app/.env.local
   # Should show APP_SECRET=...
   ```

2. **Check database tables**:
   ```bash
   sqlite3 app/data/finance.db "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'llm%';"
   # Should show: llm_settings and llm_analysis_reports
   ```

3. **Check encrypted keys** (should NOT see plaintext):
   ```bash
   sqlite3 app/data/finance.db "SELECT length(anthropic_api_key_encrypted) FROM llm_settings;"
   # Should show a number (hex string length), not your actual key
   ```

## Support

If you encounter issues not covered in this guide:

1. Check browser console for error messages (F12 → Console)
2. Check server logs for API errors
3. Verify your API keys are valid in the provider's dashboard
4. Ensure `.env.local` exists and contains `APP_SECRET`

## Future Enhancements

Possible future features (not yet implemented):
- Scheduled automatic analysis (daily/weekly)
- Email notifications for critical recommendations
- Export reports as PDF
- Historical trend analysis
- Custom analysis prompts
- Multi-currency support in LLM prompts
