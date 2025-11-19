# Update Newcomer Badges Function

This Edge Function checks and verifies the "Новый исполнитель" (Newcomer) badge status for all freelancers.

## How it works

The badge logic is implemented in the frontend based on the `created_at` field:
- Users registered within the last 7 days automatically get the "Недавно на бирже" badge
- The badge automatically disappears after 7 days (calculated in real-time in the UI)

This function serves as a verification system and can be extended for:
- Sending notifications when badge status changes
- Updating statistics
- Logging badge transitions
- Triggering other automated actions

## Setup Automatic Execution (Every Hour)

### Option 1: Using Supabase Cron Jobs (Recommended)

In your Supabase Dashboard:

1. Go to Database → Functions
2. Create a new function to schedule the Edge Function call:

\`\`\`sql
-- Create a function to call the edge function
CREATE OR REPLACE FUNCTION call_update_badges()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result text;
BEGIN
  SELECT content::text INTO result
  FROM http((
    'POST',
    current_setting('app.settings.supabase_url') || '/functions/v1/update-newcomer-badges',
    ARRAY[http_header('Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'))],
    'application/json',
    '{}'
  )::http_request);
END;
$$;

-- Schedule it to run every hour
SELECT cron.schedule(
  'update-newcomer-badges-hourly',
  '0 * * * *', -- Every hour at minute 0
  $$SELECT call_update_badges();$$
);
\`\`\`

### Option 2: Using External Cron Service

Use a service like:
- **Cron-job.org**
- **EasyCron**
- **GitHub Actions**

Set up a scheduled request to:
\`\`\`
POST https://your-project.supabase.co/functions/v1/update-newcomer-badges
Authorization: Bearer YOUR_ANON_KEY
\`\`\`

### Option 3: Using GitHub Actions

Create `.github/workflows/update-badges.yml`:

\`\`\`yaml
name: Update Newcomer Badges

on:
  schedule:
    - cron: '0 * * * *'  # Every hour
  workflow_dispatch:  # Allow manual trigger

jobs:
  update-badges:
    runs-on: ubuntu-latest
    steps:
      - name: Call Edge Function
        run: |
          curl -X POST \\
            -H "Authorization: Bearer \${{ secrets.SUPABASE_ANON_KEY }}" \\
            -H "Content-Type: application/json" \\
            https://\${{ secrets.SUPABASE_URL }}/functions/v1/update-newcomer-badges
\`\`\`

## Manual Execution

You can manually trigger the function:

\`\`\`bash
curl -X POST \\
  -H "Authorization: Bearer YOUR_ANON_KEY" \\
  https://your-project.supabase.co/functions/v1/update-newcomer-badges
\`\`\`

## Response Format

\`\`\`json
{
  "success": true,
  "message": "Badge verification completed",
  "stats": {
    "checkedCount": 150,
    "updatedCount": 12,
    "timestamp": "2025-11-12T15:30:00.000Z"
  }
}
\`\`\`
