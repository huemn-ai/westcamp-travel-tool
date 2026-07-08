const https = require("https");
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const BEDROCK_REGION  = process.env.AWS_REGION || "us-east-1";
const BEDROCK_API_KEY = process.env.BEDROCK_API_KEY;
const BEDROCK_MODEL   = process.env.BEDROCK_MODEL_ID || "minimax.minimax-m2.5";

// MiniMax on Bedrock uses the bedrock-mantle endpoint (recommended by AWS docs).
// The Converse API path and payload shape are identical to bedrock-runtime.
function bedrockRequest(body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const hostname = `bedrock-mantle.${BEDROCK_REGION}.api.aws`;
    const path     = `/v1/model/${encodeURIComponent(BEDROCK_MODEL)}/converse`;

    const req = https.request(
      {
        hostname,
        path,
        method: "POST",
        headers: {
          "Content-Type":  "application/json",
          "Content-Length": Buffer.byteLength(payload),
          "Authorization": `Bearer ${BEDROCK_API_KEY}`,
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const parsed = JSON.parse(data);
            if (res.statusCode >= 400) {
              reject(new Error(parsed.message || parsed.error || `HTTP ${res.statusCode}`));
            } else {
              resolve(parsed);
            }
          } catch {
            reject(new Error(`Non-JSON response (${res.statusCode}): ${data.slice(0, 200)}`));
          }
        });
      }
    );

    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

// ─── Time helpers (mirror of what the frontend uses) ────────────────────────
// "minutes from 10 AM" is what the DB stores.
// 0 = 10:00 AM, 60 = 11:00 AM, 480 = 6:00 PM, 840 = midnight (max)
const CAL_MINUTES = 840; // 10 AM – midnight

function minFrom10(h, m = 0) {
  return h * 60 + m - 600;
}

function minToTime(m) {
  const abs = m + 600;
  const h = Math.floor(abs / 60) % 24;
  const min = abs % 60;
  const hr = h === 0 ? 12 : h > 12 ? h - 12 : h;
  const ampm = h < 12 || h === 0 ? "AM" : "PM";
  return `${hr}:${min.toString().padStart(2, "0")} ${ampm}`;
}

// Parse "3:30 PM" or "15:30" → minutes from 10 AM.
// Returns null if unparseable.
function parseTimeToMin(str) {
  if (str == null) return null;
  str = String(str).trim();

  // "HH:MM AM/PM"
  const ampm = str.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (ampm) {
    let h = parseInt(ampm[1], 10);
    const m = parseInt(ampm[2], 10);
    const period = ampm[3].toUpperCase();
    if (period === "PM" && h !== 12) h += 12;
    if (period === "AM" && h === 12) h = 0;
    const result = h * 60 + m - 600;
    return result >= 0 && result <= CAL_MINUTES ? result : null;
  }

  // "HH:MM" (24-hour)
  const h24 = str.match(/^(\d{1,2}):(\d{2})$/);
  if (h24) {
    const h = parseInt(h24[1], 10);
    const m = parseInt(h24[2], 10);
    const result = h * 60 + m - 600;
    return result >= 0 && result <= CAL_MINUTES ? result : null;
  }

  // Plain hour "3 PM" or "15"
  const hourOnly = str.match(/^(\d{1,2})\s*(AM|PM)?$/i);
  if (hourOnly) {
    let h = parseInt(hourOnly[1], 10);
    const period = (hourOnly[2] || "").toUpperCase();
    if (period === "PM" && h !== 12) h += 12;
    if (period === "AM" && h === 12) h = 0;
    const result = h * 60 - 600;
    return result >= 0 && result <= CAL_MINUTES ? result : null;
  }

  return null;
}

// ─── Block catalog (matches dayBlocks() in index.html) ──────────────────────
// Used so the agent knows what blocks exist and their default times.
const BLOCK_CATALOG = {
  thu: [
    { id: "arrival",      label: "Arrival & Unpack",        type: "fixed",    defaultStart: minFrom10(14),     duration: 120 },
    { id: "thu-dinner",   label: "Thursday Dinner",          type: "meal",     defaultStart: minFrom10(20, 0),  duration: 90  },
    { id: "thu-snack",    label: "Fire-Pit Snack",           type: "snack",    defaultStart: minFrom10(21, 45), duration: 45  },
    { id: "thu-winddown", label: "Evening Wind-Down",        type: "personal", defaultStart: minFrom10(22, 30), duration: 60  },
  ],
  fri: [
    { id: "fri-breakfast",  label: "Friday Breakfast",              type: "meal",     defaultStart: minFrom10(10),     duration: 60  },
    { id: "fri-physical",   label: "Friday Activity (hike/swim)",   type: "activity", defaultStart: minFrom10(10, 30), duration: 180 },
    { id: "fri-freshen",    label: "Drive Back + Freshen Up",       type: "personal", defaultStart: minFrom10(13),     duration: 60  },
    { id: "fri-lunch",      label: "Friday Lunch",                  type: "meal",     defaultStart: minFrom10(13, 30), duration: 60  },
    { id: "fri-leisure",    label: "Friday Leisure",                type: "activity", defaultStart: minFrom10(15),     duration: 120 },
    { id: "fri-dinner",     label: "Friday Dinner",                 type: "meal",     defaultStart: minFrom10(18, 30), duration: 90  },
    { id: "fri-backgammon", label: "🎲 Backgammon Tournament",      type: "fixed",    defaultStart: minFrom10(20),     duration: 90  },
    { id: "fri-snack",      label: "Fire-Pit Snack",                type: "snack",    defaultStart: minFrom10(21, 30), duration: 45  },
    { id: "fri-winddown",   label: "Evening Wind-Down",             type: "personal", defaultStart: minFrom10(22, 30), duration: 60  },
  ],
  sat: [
    { id: "sat-breakfast",  label: "Saturday Breakfast",            type: "meal",     defaultStart: minFrom10(10),     duration: 60  },
    { id: "sat-physical",   label: "Saturday Activity (hike/etc.)", type: "activity", defaultStart: minFrom10(10, 30), duration: 150 },
    { id: "sat-freshen",    label: "Drive Back + Freshen Up",       type: "personal", defaultStart: minFrom10(13),     duration: 60  },
    { id: "sat-lunch",      label: "Saturday Lunch",                type: "meal",     defaultStart: minFrom10(13, 30), duration: 60  },
    { id: "sat-leisure",    label: "Saturday Leisure",              type: "activity", defaultStart: minFrom10(15),     duration: 120 },
    { id: "sat-dinner",     label: "Saturday Dinner",               type: "meal",     defaultStart: minFrom10(18, 30), duration: 90  },
    { id: "sat-snack",      label: "Fire-Pit Snack",                type: "snack",    defaultStart: minFrom10(20, 30), duration: 45  },
    { id: "sat-winddown",   label: "Evening Wind-Down",             type: "personal", defaultStart: minFrom10(22),     duration: 60  },
  ],
};

// ─── Trip constants ───────────────────────────────────────────────────────────
const TRIP_DATA = {
  dates: "Thursday July 9 – Saturday July 11, 2026",
  location: "Catskills, NY — staying in Saugerties area",
  groupSize: 7,
  attendees: ["Amanda", "Belal", "Luke", "Mina", "Nada", "Stefano", "Yehia"],
  weather: {
    thu: { high: 86.7, precip: 35, summary: "Warm, 35% rain chance" },
    fri: { high: 81.9, precip: 35, summary: "Warm, 35% rain chance" },
    sat: { high: 81.4, precip: 0,  summary: "Nice, no rain expected" },
  },
};

// ─── Tool definitions (Converse API format) ──────────────────────────────────
const TOOL_CONFIG = {
  tools: [
    {
      toolSpec: {
        name: "get_full_schedule",
        description:
          "Get the current trip schedule for one or all days. Returns each block with its ID, label, current start time (as clock time and as minutes-from-10am), duration, and type. Always call this before moving a block so you have the block IDs.",
        inputSchema: {
          json: {
            type: "object",
            properties: {
              day: {
                type: "string",
                enum: ["thu", "fri", "sat", "all"],
                description: "Day to retrieve. Use 'all' for the full three-day schedule.",
              },
            },
            required: ["day"],
          },
        },
      },
    },
    {
      toolSpec: {
        name: "move_block",
        description:
          "Move a calendar block to a new start time on its day. Use get_full_schedule first to find the block_id. The new_time should be a clock time like '3:30 PM' or '15:30'. The block's duration stays the same. Returns the updated schedule row.",
        inputSchema: {
          json: {
            type: "object",
            properties: {
              day: {
                type: "string",
                enum: ["thu", "fri", "sat"],
                description: "Day the block lives on.",
              },
              block_id: {
                type: "string",
                description: "Block ID from get_full_schedule (e.g. 'fri-dinner', 'sat-physical').",
              },
              new_time: {
                type: "string",
                description:
                  "New start time in 12-hour or 24-hour format, e.g. '6:30 PM', '18:30', '7 PM'. Must be between 10:00 AM and 11:59 PM.",
              },
            },
            required: ["day", "block_id", "new_time"],
          },
        },
      },
    },
    {
      toolSpec: {
        name: "reset_block",
        description: "Reset a calendar block to its default auto-placed time by removing any manual override.",
        inputSchema: {
          json: {
            type: "object",
            properties: {
              day: { type: "string", enum: ["thu", "fri", "sat"] },
              block_id: { type: "string", description: "Block ID to reset." },
            },
            required: ["day", "block_id"],
          },
        },
      },
    },
    {
      toolSpec: {
        name: "get_preferences",
        description:
          "Get current voting preferences from the database. Returns each guest's first and second choice for each poll.",
        inputSchema: {
          json: {
            type: "object",
            properties: {
              poll_id: {
                type: "string",
                description:
                  "Optional: filter to one poll ID (e.g. 'poll-fri-dinner'). Omit to get all preferences.",
              },
            },
          },
        },
      },
    },
    {
      toolSpec: {
        name: "update_preferences",
        description: "Update or cast a vote for a guest on a specific poll.",
        inputSchema: {
          json: {
            type: "object",
            properties: {
              guest_name: {
                type: "string",
                enum: ["Amanda", "Belal", "Luke", "Mina", "Nada", "Stefano", "Yehia"],
              },
              poll_id: { type: "string", description: "Poll ID, e.g. 'poll-fri-dinner'." },
              first_choice: { type: "string", description: "Option ID for first choice." },
              second_choice: { type: "string", description: "Option ID for second choice (optional)." },
            },
            required: ["guest_name", "poll_id", "first_choice"],
          },
        },
      },
    },
    {
      toolSpec: {
        name: "get_trip_info",
        description: "Get general trip information: dates, location, attendees, or weather forecast.",
        inputSchema: {
          json: {
            type: "object",
            properties: {
              info_type: {
                type: "string",
                enum: ["dates", "location", "attendees", "weather", "all"],
              },
            },
            required: ["info_type"],
          },
        },
      },
    },
  ],
};

// ─── Tool implementations ─────────────────────────────────────────────────────

async function getFullSchedule({ day }) {
  // Fetch any manual overrides from DB
  let query = supabase.from("schedule_changes").select("*");
  if (day !== "all") query = query.eq("day_key", day);
  const { data: overrides, error } = await query;
  if (error) return { error: error.message };

  const overrideMap = {};
  for (const row of overrides || []) {
    if (!overrideMap[row.day_key]) overrideMap[row.day_key] = {};
    overrideMap[row.day_key][row.block_id] = row;
  }

  const days = day === "all" ? ["thu", "fri", "sat"] : [day];
  const result = {};

  for (const d of days) {
    result[d] = BLOCK_CATALOG[d].map((block) => {
      const override = overrideMap[d]?.[block.id];
      const startMin = override ? override.start_minutes : block.defaultStart;
      return {
        block_id:     block.id,
        label:        block.label,
        type:         block.type,
        start_time:   minToTime(startMin),
        start_min:    startMin,
        duration_min: override ? override.duration : block.duration,
        end_time:     minToTime(startMin + (override ? override.duration : block.duration)),
        manually_set: !!override,
      };
    });
  }

  return { success: true, schedule: result };
}

async function moveBlock({ day, block_id, new_time }) {
  const startMin = parseTimeToMin(new_time);
  if (startMin === null) {
    return { error: `Could not parse time "${new_time}". Use a format like "3:30 PM" or "15:30".` };
  }

  // Look up duration — use existing override or catalog default
  const catalogBlock = BLOCK_CATALOG[day]?.find((b) => b.id === block_id);
  if (!catalogBlock) {
    return { error: `Block "${block_id}" not found on day "${day}". Call get_full_schedule to see valid block IDs.` };
  }

  const { data: existing } = await supabase
    .from("schedule_changes")
    .select("duration")
    .eq("day_key", day)
    .eq("block_id", block_id)
    .maybeSingle();

  const duration = existing?.duration ?? catalogBlock.duration;

  if (startMin + duration > CAL_MINUTES) {
    return {
      error: `"${new_time}" would push the block past midnight. Latest start for a ${duration}-min block is ${minToTime(CAL_MINUTES - duration)}.`,
    };
  }

  const { error } = await supabase.from("schedule_changes").upsert(
    { day_key: day, block_id, start_minutes: startMin, duration, manual: true },
    { onConflict: "day_key,block_id" }
  );

  if (error) return { error: error.message };

  return {
    success: true,
    message: `Moved "${catalogBlock.label}" to ${minToTime(startMin)} – ${minToTime(startMin + duration)} on ${day}.`,
    day, block_id,
    new_start_time: minToTime(startMin),
    new_end_time:   minToTime(startMin + duration),
    schedule_changed: true,
  };
}

async function resetBlock({ day, block_id }) {
  const catalogBlock = BLOCK_CATALOG[day]?.find((b) => b.id === block_id);
  if (!catalogBlock) {
    return { error: `Block "${block_id}" not found on day "${day}".` };
  }

  const { error } = await supabase
    .from("schedule_changes")
    .delete()
    .eq("day_key", day)
    .eq("block_id", block_id);

  if (error) return { error: error.message };

  return {
    success: true,
    message: `Reset "${catalogBlock.label}" to its default time of ${minToTime(catalogBlock.defaultStart)}.`,
    day, block_id,
    default_start_time: minToTime(catalogBlock.defaultStart),
    schedule_changed: true,
  };
}

async function getPreferences({ poll_id } = {}) {
  let query = supabase.from("preferences").select("guest_name, poll_id, first_choice, second_choice");
  if (poll_id) query = query.eq("poll_id", poll_id);
  const { data, error } = await query;
  if (error) return { error: error.message };
  return { success: true, data };
}

async function updatePreferences({ guest_name, poll_id, first_choice, second_choice }) {
  const { error } = await supabase.from("preferences").upsert(
    { guest_name, poll_id, first_choice, second_choice: second_choice || null },
    { onConflict: "guest_name,poll_id" }
  );
  if (error) return { error: error.message };
  return { success: true, message: `Updated ${guest_name}'s vote on ${poll_id}.` };
}

function getTripInfo({ info_type }) {
  const all = info_type === "all";
  const info = {};
  if (all || info_type === "dates")     info.dates     = TRIP_DATA.dates;
  if (all || info_type === "location")  info.location  = TRIP_DATA.location;
  if (all || info_type === "attendees") { info.attendees = TRIP_DATA.attendees; info.groupSize = TRIP_DATA.groupSize; }
  if (all || info_type === "weather")   info.weather   = TRIP_DATA.weather;
  return { success: true, data: info };
}

// ─── Tool router ──────────────────────────────────────────────────────────────
async function executeTool(name, input) {
  console.log("Tool call:", name, JSON.stringify(input));
  switch (name) {
    case "get_full_schedule":   return await getFullSchedule(input);
    case "move_block":          return await moveBlock(input);
    case "reset_block":         return await resetBlock(input);
    case "get_preferences":     return await getPreferences(input);
    case "update_preferences":  return await updatePreferences(input);
    case "get_trip_info":       return getTripInfo(input);
    default:                    return { error: `Unknown tool: ${name}` };
  }
}

// ─── System prompt ────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are the West Camp Trip Planner — a helpful AI assistant for a group of 7 friends (${TRIP_DATA.attendees.join(", ")}) spending ${TRIP_DATA.dates} in the ${TRIP_DATA.location}.

You know everything about this trip: the schedule, meals being voted on, activities, restaurants nearby, recipes, and each person's preferences. You have direct read/write access to the trip database.

## Schedule
The trip calendar runs 10 AM – midnight each day. Times are stored internally as "minutes from 10 AM" (0 = 10:00 AM, 60 = 11:00 AM, 480 = 6:00 PM, etc.) but you should always display and accept clock times like "6:30 PM".

Days:
- Thursday July 9 (thu): Arrival day — lighter schedule
- Friday July 10 (fri): Full day — hike/swim in morning, leisure afternoon, dinner, backgammon tournament
- Saturday July 11 (sat): Full day — activity in morning, leisure afternoon, dinner, fire pit

## What you can do
- **View the full schedule** for any day with get_full_schedule
- **Move blocks** to new times with move_block — always call get_full_schedule first so you have the block IDs
- **Reset blocks** to their default times with reset_block
- **Read and update voting preferences** for all polls
- **Answer questions** about the trip, weather, activities, restaurants, and recipes

## Behavior
- Be concise and friendly
- When moving blocks, confirm the change with the new time
- When you move a block, the frontend calendar will update automatically
- If asked to rearrange multiple blocks, do them in sequence
- Always verify block IDs with get_full_schedule before calling move_block
- Warn if a proposed time would cause obvious conflicts (e.g. dinner at 4 PM when lunch is at 3 PM)`;

// ─── Agentic loop using Bedrock Converse API ─────────────────────────────────
async function runAgentLoop(messages) {
  const MAX_ROUNDS = 10;
  let scheduleChanged = false;

  for (let round = 0; round < MAX_ROUNDS; round++) {
    const response = await bedrockRequest({
      system: [{ text: SYSTEM_PROMPT }],
      messages,
      toolConfig: TOOL_CONFIG,
      inferenceConfig: { maxTokens: 2048, temperature: 0.3 },
    });

    const { stopReason, output } = response;
    const assistantMessage = output.message;
    messages.push(assistantMessage);

    // No tool use — we have the final answer.
    // MiniMax M2.5 prepends a reasoningContent block; skip it and extract text only.
    if (stopReason !== "tool_use") {
      const text = assistantMessage.content
        .filter((b) => b.text && !b.reasoningContent)
        .map((b) => b.text)
        .join("")
        .trim();
      return { text: text || "Done.", scheduleChanged };
    }

    // Execute all tool calls in this turn
    const toolResults = [];
    for (const block of assistantMessage.content) {
      if (block.toolUse) {
        const result = await executeTool(block.toolUse.name, block.toolUse.input);
        if (result.schedule_changed) scheduleChanged = true;
        toolResults.push({
          toolResult: {
            toolUseId: block.toolUse.toolUseId,
            content: [{ json: result }],
          },
        });
      }
    }

    messages.push({ role: "user", content: toolResults });
  }

  return { text: "I hit my reasoning limit. Please try a simpler request.", scheduleChanged };
}

// ─── Session store (in-memory; fine for short-lived functions) ───────────────
const sessions = new Map();

// ─── Netlify handler ──────────────────────────────────────────────────────────
exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  try {
    const { message, sessionId } = JSON.parse(event.body || "{}");
    if (!message?.trim()) {
      return { statusCode: 400, body: JSON.stringify({ error: "message is required" }) };
    }

    const sid = sessionId || `session-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const history = sessions.get(sid) || [];
    history.push({ role: "user", content: [{ text: message }] });

    const { text, scheduleChanged } = await runAgentLoop([...history]);

    // Persist history (trim to last 20 messages to avoid token blowup)
    history.push({ role: "assistant", content: [{ text }] });
    sessions.set(sid, history.slice(-20));

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: true, message: text, sessionId: sid, scheduleChanged }),
    };
  } catch (err) {
    console.error("Agent error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message || "Internal error" }),
    };
  }
};
