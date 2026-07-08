# Trip Planning Agent Setup Guide

The West Camp Debrief app now includes an AI-powered trip planning agent that can answer questions, retrieve preferences, and make recommendations.

## Architecture

```
Frontend (Chat Widget)
    ↓
Netlify Function (trip-agent.js)
    ↓
AWS Bedrock Agent Runtime
    ↓
Tool Execution (Supabase, Web Search)
```

## Prerequisites

1. **AWS Account** with Bedrock access
2. **Bedrock Agent** created in your AWS account
3. **Environment variables** configured in Netlify

## Step 1: Create a Bedrock Agent

### Via AWS Console:

1. Go to **AWS Bedrock** → **Agents**
2. Click **Create Agent**
3. Configure:
   - **Agent name**: `west-camp-trip-planner`
   - **Model**: Claude 3 Sonnet (or your preferred model)
   - **Instructions**: 
     ```
     You are a helpful trip planning assistant for the West Camp Debrief trip 
     (July 9-12, 2026 in the Catskills, NY). You have access to:
     - Trip information (dates, location, attendees, weather)
     - Current voting preferences and poll results
     - Trip schedule and activities
     - Recipes and restaurant information
     - Web search capabilities
     
     Help users plan meals, activities, and logistics. You can:
     - Answer questions about the trip
     - Show current voting status
     - Update preferences when requested
     - Search for recommendations
     - Provide weather and activity suggestions
     ```

4. **Add Action Groups** (Tools):
   - Create an action group called "trip-tools"
   - Add the following API operations:
     - `GET /preferences` - Get voting preferences
     - `POST /preferences` - Update preferences
     - `GET /trip-info` - Get trip information
     - `GET /schedule` - Get schedule
     - `POST /search` - Search the web

5. **Save and Deploy**
   - Click **Prepare Agent**
   - Click **Deploy**
   - Note the **Agent ID** and **Agent Alias ID**

## Step 2: Configure Environment Variables

In your Netlify site settings, add:

```
BEDROCK_AGENT_ID=<your-agent-id>
BEDROCK_AGENT_ALIAS_ID=<your-agent-alias-id>
SUPABASE_URL=https://xstcdokwuhivywqedkni.supabase.co
SUPABASE_SERVICE_KEY=<your-supabase-service-key>
AWS_REGION=us-east-1
```

### Getting Supabase Service Key:

1. Go to Supabase Dashboard
2. Project Settings → API
3. Copy the **Service Role Key** (not the anon key)

### AWS Credentials:

Option A: **Use IAM Role** (Recommended for Netlify)
- Netlify Functions automatically use the IAM role if deployed on AWS

Option B: **Use Environment Variables**
```
AWS_ACCESS_KEY_ID=<your-key>
AWS_SECRET_ACCESS_KEY=<your-secret>
```

## Step 3: Install Dependencies

The Netlify Function uses:
- `@aws-sdk/client-bedrock-agent-runtime` - Bedrock Agent API
- `@aws-sdk/client-bedrock-runtime` - Bedrock Model API
- `@supabase/supabase-js` - Supabase client

These are already in `netlify/functions/package.json`.

## Step 4: Deploy

```bash
git push origin main
```

Netlify will automatically:
1. Install dependencies
2. Deploy the function to `/.netlify/functions/trip-agent`
3. Use environment variables from site settings

## Testing the Agent

1. Open the app in your browser
2. Look for the **🤖 Trip Agent** widget in the bottom-right corner
3. Try asking:
   - "What's the weather forecast?"
   - "Who's voting for the Friday dinner?"
   - "What activities are available?"
   - "Can you update my vote for Friday lunch to the shakshuka?"
   - "Search for good breweries near Saugerties"

## Agent Capabilities

### Information Retrieval
- Trip dates, location, attendees
- Current weather forecast
- Voting preferences and poll results
- Schedule and activities
- Recipes and restaurant options

### Database Operations
- Read all preferences and votes
- Update individual user preferences
- Retrieve schedule changes
- Access shopping list status

### Web Search
- Search for activities, restaurants, recipes
- Get recommendations based on preferences
- Find local attractions and dining options

### Conversation
- Multi-turn conversations with session persistence
- Context-aware responses
- Natural language understanding

## Troubleshooting

### "Agent not found" error
- Verify `BEDROCK_AGENT_ID` and `BEDROCK_AGENT_ALIAS_ID` are correct
- Check agent is deployed in AWS Bedrock console

### "Access denied" error
- Verify AWS credentials/IAM role has Bedrock permissions
- Check `SUPABASE_SERVICE_KEY` is correct

### "Function not found" error
- Verify function deployed: check Netlify Functions dashboard
- Check `netlify/functions/trip-agent.js` exists
- Redeploy: `git push origin main`

### Agent not responding
- Check browser console for errors
- Check Netlify Function logs
- Verify all environment variables are set

## Advanced: Customizing the Agent

### Add More Tools

Edit `netlify/functions/trip-agent.js` to add new tools:

```javascript
const TOOLS = [
  {
    name: "your_new_tool",
    description: "What this tool does",
    parameters: {
      type: "object",
      properties: {
        param1: { type: "string", description: "..." }
      }
    }
  }
];

async function executeTool(toolName, toolInput) {
  switch (toolName) {
    case "your_new_tool":
      return await yourNewTool(toolInput);
    // ...
  }
}
```

### Modify Agent Instructions

Update the agent instructions in AWS Bedrock console to change behavior.

### Change Model

In AWS Bedrock console, select a different model (Claude 3 Opus, Haiku, etc.)

## Cost Considerations

- **Bedrock Agent**: ~$0.25 per 1K input tokens, ~$1.25 per 1K output tokens
- **Supabase**: Included in free tier for this usage
- **Netlify Functions**: Included in Netlify plan

Typical conversation: 2-5 cents per message

## Security Notes

- Service key is only used server-side (Netlify Function)
- Never expose service key in frontend code
- RLS policies on Supabase tables control data access
- Agent can only perform actions defined in tool definitions

## Next Steps

1. Create the Bedrock Agent in AWS
2. Deploy agent and get IDs
3. Add environment variables to Netlify
4. Deploy the app
5. Test the agent chat widget
6. Customize agent instructions as needed
