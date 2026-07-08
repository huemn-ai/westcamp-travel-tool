import { BedrockAgentRuntimeClient, InvokeAgentCommand } = require("@aws-sdk/client-bedrock-agent-runtime");
import { BedrockRuntimeClient, InvokeModelCommand } = require("@aws-sdk/client-bedrock-runtime");
import { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const bedrockAgent = new BedrockAgentRuntimeClient({ region: "us-east-1" });
const bedrock = new BedrockRuntimeClient({ region: "us-east-1" });

// Trip data embedded in the function
const TRIP_DATA = {
  dates: "Thursday July 9 – Saturday July 11, 2026",
  location: "Catskills, NY",
  groupSize: 7,
  attendees: ["Amanda", "Belal", "Luke", "Mina", "Nada", "Stefano", "Yehia"],
  weather: {
    thu: { high: 86.7, precip: 35, label: "Thu 7/9" },
    fri: { high: 81.9, precip: 35, label: "Fri 7/10" },
    sat: { high: 81.4, precip: 0, label: "Sat 7/11" }
  }
};

// Tool definitions for the agent
const TOOLS = [
  {
    name: "get_preferences",
    description: "Get current voting preferences and schedule from the database",
    parameters: {
      type: "object",
      properties: {
        poll_id: {
          type: "string",
          description: "Optional: specific poll ID to get preferences for"
        }
      }
    }
  },
  {
    name: "update_preferences",
    description: "Update voting preferences in the database",
    parameters: {
      type: "object",
      properties: {
        guest_name: { type: "string", description: "Name of the guest" },
        poll_id: { type: "string", description: "Poll ID to update" },
        first_choice: { type: "string", description: "First choice option ID" },
        second_choice: { type: "string", description: "Second choice option ID" }
      },
      required: ["guest_name", "poll_id", "first_choice"]
    }
  },
  {
    name: "get_trip_info",
    description: "Get information about the trip (dates, location, attendees, weather)",
    parameters: {
      type: "object",
      properties: {
        info_type: {
          type: "string",
          enum: ["dates", "location", "attendees", "weather", "all"],
          description: "Type of trip information to retrieve"
        }
      }
    }
  },
  {
    name: "search_web",
    description: "Search the web for information about activities, restaurants, or recipes",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query" },
        category: {
          type: "string",
          enum: ["restaurant", "activity", "recipe", "general"],
          description: "Category of search"
        }
      },
      required: ["query"]
    }
  },
  {
    name: "get_schedule",
    description: "Get the current trip schedule with all activities and meals",
    parameters: {
      type: "object",
      properties: {
        day: {
          type: "string",
          enum: ["thu", "fri", "sat"],
          description: "Day to get schedule for"
        }
      }
    }
  }
];

// Tool execution functions
async function executeTool(toolName, toolInput) {
  console.log(`Executing tool: ${toolName}`, toolInput);

  switch (toolName) {
    case "get_preferences":
      return await getPreferences(toolInput);
    case "update_preferences":
      return await updatePreferences(toolInput);
    case "get_trip_info":
      return await getTripInfo(toolInput);
    case "search_web":
      return await searchWeb(toolInput);
    case "get_schedule":
      return await getSchedule(toolInput);
    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}

async function getPreferences(input) {
  try {
    let query = supabase.from("preferences").select("*");
    if (input.poll_id) {
      query = query.eq("poll_id", input.poll_id);
    }
    const { data, error } = await query;
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    return { error: error.message };
  }
}

async function updatePreferences(input) {
  try {
    const { data, error } = await supabase.from("preferences").upsert(
      {
        guest_name: input.guest_name,
        poll_id: input.poll_id,
        first_choice: input.first_choice,
        second_choice: input.second_choice || null
      },
      { onConflict: "guest_name,poll_id" }
    );
    if (error) throw error;
    return { success: true, message: "Preferences updated", data };
  } catch (error) {
    return { error: error.message };
  }
}

async function getTripInfo(input) {
  const infoType = input.info_type || "all";
  const info = {};

  if (infoType === "all" || infoType === "dates") {
    info.dates = TRIP_DATA.dates;
  }
  if (infoType === "all" || infoType === "location") {
    info.location = TRIP_DATA.location;
  }
  if (infoType === "all" || infoType === "attendees") {
    info.attendees = TRIP_DATA.attendees;
    info.groupSize = TRIP_DATA.groupSize;
  }
  if (infoType === "all" || infoType === "weather") {
    info.weather = TRIP_DATA.weather;
  }

  return { success: true, data: info };
}

async function searchWeb(input) {
  // This would integrate with a web search API (e.g., Tavily, SerpAPI)
  // For now, return a placeholder that the agent can work with
  return {
    success: true,
    message: `Web search for "${input.query}" in category "${input.category || "general"}" would be performed here`,
    note: "Integrate with web search API (Tavily, SerpAPI, etc.)"
  };
}

async function getSchedule(input) {
  // This would fetch from the schedule_changes table
  try {
    const { data, error } = await supabase
      .from("schedule_changes")
      .select("*")
      .eq("day_key", input.day || "fri");
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    return { error: error.message };
  }
}

// Main handler
export async function handler(event, context) {
  try {
    const { message, sessionId } = JSON.parse(event.body);

    if (!message) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Message is required" })
      };
    }

    // Prepare the agent invocation
    const params = {
      agentId: process.env.BEDROCK_AGENT_ID,
      agentAliasId: process.env.BEDROCK_AGENT_ALIAS_ID,
      sessionId: sessionId || `session-${Date.now()}`,
      inputText: message
    };

    // Invoke the Bedrock agent
    const command = new InvokeAgentCommand(params);
    const response = await bedrockAgent.send(command);

    // Process the response stream
    let result = "";
    for await (const event of response.output) {
      if (event.trace?.orchestrationTrace?.invocationInput?.actionGroupInvocationInput) {
        const toolCall = event.trace.orchestrationTrace.invocationInput.actionGroupInvocationInput;
        const toolResult = await executeTool(toolCall.actionGroupName, JSON.parse(toolCall.apiPath));
        // The agent will handle the tool result in the next iteration
      }
      if (event.contentBlockDelta?.delta?.text) {
        result += event.contentBlockDelta.delta.text;
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: result,
        sessionId: params.sessionId
      })
    };
  } catch (error) {
    console.error("Agent error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
}
