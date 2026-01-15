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

### Configure API Keys

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

Your API keys are now stored in a separate database file for easy management.

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

### Storage

- API keys are stored in plain text in separate database files (`finance-secrets.db` and `demo-secrets.db`)
- Secrets databases are excluded from version control
- Keys are never logged or exposed in API responses
- You can directly edit the secrets databases if needed

### Data Privacy

- Your financial data is sent only to the AI provider you select
- No third-party services except the chosen LLM (Claude or Gemini)
- All data stays in your local database
- API keys remain on your server (never transmitted to other services)

## Troubleshooting

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

## Database Structure

The feature uses separate databases for different purposes:

### Secrets Databases
- `finance-secrets.db` - Stores API keys for live mode (in plain text)
- `demo-secrets.db` - Stores API keys for demo mode (in plain text)

**Table: `llm_settings`**
- `anthropic_api_key` - Anthropic API key (plain text)
- `gemini_api_key` - Gemini API key (plain text)
- `preferred_llm` - User's preferred provider

### Analysis Databases
- `finance-analysis.db` - Stores analysis reports for live mode
- `demo-analysis.db` - Stores analysis reports for demo mode

**Table: `llm_analysis_reports`**
- `llm_provider` - Which AI was used (claude/gemini)
- `recommendation` - Buy, sell, or hold
- `reasoning` - Detailed explanation
- `confidence_level` - High, medium, or low
- `risk_factors` - JSON array of risks
- `opportunities` - JSON array of opportunities
- `is_read` - Whether notification was read

**Note**: All secrets and analysis databases are excluded from version control via `.gitignore`.

## Verification

To verify everything is working:

1. **Check database files exist**:
   ```bash
   ls -la app/data/*-secrets.db app/data/*-analysis.db
   # Should show: finance-secrets.db, demo-secrets.db, finance-analysis.db, demo-analysis.db
   ```

2. **Check secrets database table**:
   ```bash
   sqlite3 app/data/finance-secrets.db "SELECT name FROM sqlite_master WHERE type='table';"
   # Should show: llm_settings
   ```

3. **Verify API key is stored** (check without exposing the key):
   ```bash
   sqlite3 app/data/finance-secrets.db "SELECT preferred_llm, anthropic_api_key IS NOT NULL, gemini_api_key IS NOT NULL FROM llm_settings;"
   # Should show your preferred LLM and which keys are configured (1 = configured, 0 = not configured)
   ```

## Support

If you encounter issues not covered in this guide:

1. Check browser console for error messages (F12 → Console)
2. Check server logs for API errors
3. Verify your API keys are valid in the provider's dashboard
4. Verify secrets database files exist in `app/data/` directory

## Future Enhancements

Possible future features (not yet implemented):
- Scheduled automatic analysis (daily/weekly)
- Email notifications for critical recommendations
- Export reports as PDF
- Historical trend analysis
- Custom analysis prompts
- Multi-currency support in LLM prompts
