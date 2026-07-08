const https  = require("https");
const crypto = require("crypto");
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ─── Vertex AI — model IDs ────────────────────────────────────────────────────
const VERTEX_PROJECT       = process.env.GOOGLE_CLOUD_PROJECT    || "r41-prod";
const VERTEX_LOCATION      = process.env.VERTEX_LOCATION         || "us-central1";
const VERTEX_FAST_MODEL    = process.env.VERTEX_FAST_MODEL_ID    || "gemini-3.5-flash";
const VERTEX_THINK_MODEL   = process.env.VERTEX_THINKING_MODEL_ID || "gemini-2.5-pro-002";

// ─── Google Custom Search (web_search tool fallback) ─────────────────────────
const SEARCH_API_KEY = process.env.GOOGLE_SEARCH_API_KEY;
const SEARCH_CX      = process.env.GOOGLE_SEARCH_CX;

// ─── Generic HTTPS POST ───────────────────────────────────────────────────────
function httpsPost(hostname, path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const payload = typeof body === "string" ? body : JSON.stringify(body);
    const req = https.request(
      {
        hostname,
        path,
        method: "POST",
        headers: {
          "Content-Type":   "application/json",
          "Content-Length": Buffer.byteLength(payload),
          ...headers,
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const parsed = JSON.parse(data);
            if (res.statusCode >= 400) {
              reject(new Error(
                parsed.error?.message || parsed.message || `HTTP ${res.statusCode}: ${data.slice(0, 300)}`
              ));
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

// ─── Vertex AI request ───────────────────────────────────────────────────────
async function vertexRequest(contents, systemInstruction, tools, modelId) {
  const token    = await getVertexAccessToken();
  const hostname = `${VERTEX_LOCATION}-aiplatform.googleapis.com`;
  const path     = `/v1/projects/${VERTEX_PROJECT}/locations/${VERTEX_LOCATION}/publishers/google/models/${modelId}:generateContent`;

  const body = {
    contents,
    systemInstruction: { parts: [{ text: systemInstruction }] },
    // Both function declarations AND native Google Search grounding.
    // Gemini decides whether to call a function, search natively, or answer directly.
    tools: [
      { functionDeclarations: tools },
      { googleSearch: {} },
    ],
    generationConfig: { maxOutputTokens: 4096, temperature: 0.7 },
  };

  return httpsPost(hostname, path, body, { Authorization: `Bearer ${token}` });
}
let _vertexTokenCache = null; // { token, expiresAt }

async function getVertexAccessToken() {
  // Re-use cached token if still valid (with 60 s margin)
  if (_vertexTokenCache && Date.now() < _vertexTokenCache.expiresAt - 60_000) {
    return _vertexTokenCache.token;
  }

  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON env var is not set");
  const creds = JSON.parse(raw);

  const now = Math.floor(Date.now() / 1000);

  // Build JWT (header.payload.signature) signed with the SA private key
  const header  = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const claimset = Buffer.from(JSON.stringify({
    iss:   creds.client_email,
    scope: "https://www.googleapis.com/auth/cloud-platform",
    aud:   "https://oauth2.googleapis.com/token",
    exp:   now + 3600,
    iat:   now,
  })).toString("base64url");

  const unsigned  = `${header}.${claimset}`;
  const signer    = crypto.createSign("SHA256");
  signer.update(unsigned);
  const signature = signer.sign(creds.private_key, "base64url");
  const jwt       = `${unsigned}.${signature}`;

  // Exchange JWT for an OAuth2 access token
  const form = `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`;
  const tokenRes = await httpsPost(
    "oauth2.googleapis.com",
    "/token",
    form,
    { "Content-Type": "application/x-www-form-urlencoded" }
  );

  _vertexTokenCache = {
    token:     tokenRes.access_token,
    expiresAt: Date.now() + (tokenRes.expires_in || 3600) * 1000,
  };
  return _vertexTokenCache.token;
}

async function vertexRequest(contents, systemInstruction, tools) {
  const token    = await getVertexAccessToken();
  const hostname = `${VERTEX_LOCATION}-aiplatform.googleapis.com`;
  const path     = `/v1/projects/${VERTEX_PROJECT}/locations/${VERTEX_LOCATION}/publishers/google/models/${VERTEX_MODEL}:generateContent`;

  const body = {
    contents,
    systemInstruction: { parts: [{ text: systemInstruction }] },
    // Include both function declarations AND native Google Search grounding.
    // Gemini will decide whether to call a function, search natively, or answer directly.
    tools: [
      { functionDeclarations: tools },
      { googleSearch: {} },
    ],
    generationConfig: { maxOutputTokens: 4096, temperature: 0.7 },
  };

  return httpsPost(hostname, path, body, { Authorization: `Bearer ${token}` });
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

// ─── Gemini function declarations (Vertex AI format) ─────────────────────────
// Parallel structure to TOOL_CONFIG but using Gemini's functionDeclarations schema.
const GEMINI_TOOLS = [
  {
    name: "web_search",
    description:
      "Search the web for current information: restaurants, reviews, activities, recipes, local tips, weather, events, or anything not in the trip database. Returns a list of relevant results with titles, links, and summaries.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The search query, e.g. 'best restaurants near Saugerties NY' or 'Kaaterskill Falls hike difficulty'.",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "get_full_schedule",
    description:
      "Get the current trip schedule for one or all days. Returns each block with its ID, label, start time, duration, and type. Always call this before moving a block so you have the block IDs.",
    parameters: {
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
  {
    name: "move_block",
    description:
      "Move a calendar block to a new start time. Use get_full_schedule first to get the block_id. The block's duration stays the same.",
    parameters: {
      type: "object",
      properties: {
        day:      { type: "string", enum: ["thu", "fri", "sat"], description: "Day the block lives on." },
        block_id: { type: "string", description: "Block ID from get_full_schedule (e.g. 'fri-dinner')." },
        new_time: { type: "string", description: "New start time, e.g. '6:30 PM' or '18:30'." },
      },
      required: ["day", "block_id", "new_time"],
    },
  },
  {
    name: "reset_block",
    description: "Reset a calendar block to its default auto-placed time by removing any manual override.",
    parameters: {
      type: "object",
      properties: {
        day:      { type: "string", enum: ["thu", "fri", "sat"] },
        block_id: { type: "string", description: "Block ID to reset." },
      },
      required: ["day", "block_id"],
    },
  },
  {
    name: "get_preferences",
    description:
      "Get current voting preferences from the database. Returns each guest's first and second choice for each poll.",
    parameters: {
      type: "object",
      properties: {
        poll_id: {
          type: "string",
          description: "Optional: filter to one poll ID. Omit to get all preferences.",
        },
      },
    },
  },
  {
    name: "update_preferences",
    description: "Update or cast a vote for a guest on a specific poll.",
    parameters: {
      type: "object",
      properties: {
        guest_name:    { type: "string", enum: ["Amanda", "Belal", "Luke", "Mina", "Nada", "Stefano", "Yehia"] },
        poll_id:       { type: "string", description: "Poll ID, e.g. 'poll-fri-dinner'." },
        first_choice:  { type: "string", description: "Option ID for first choice." },
        second_choice: { type: "string", description: "Option ID for second choice (optional)." },
      },
      required: ["guest_name", "poll_id", "first_choice"],
    },
  },
  {
    name: "get_trip_info",
    description: "Get general trip information: dates, location, attendees, or weather forecast.",
    parameters: {
      type: "object",
      properties: {
        info_type: { type: "string", enum: ["dates", "location", "attendees", "weather", "all"] },
      },
      required: ["info_type"],
    },
  },
];

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

// ─── Web search (Google Custom Search JSON API) ───────────────────────────────
async function webSearch({ query }) {
  if (!SEARCH_API_KEY) {
    return { error: "Web search is not configured (GOOGLE_SEARCH_API_KEY missing)." };
  }
  if (!SEARCH_CX) {
    return { error: "Web search is not configured (GOOGLE_SEARCH_CX missing)." };
  }

  const encodedQuery = encodeURIComponent(query);
  const hostname     = "customsearch.googleapis.com";
  const path         = `/customsearch/v1?q=${encodedQuery}&key=${SEARCH_API_KEY}&cx=${SEARCH_CX}&num=5`;

  return new Promise((resolve) => {
    const req = require("https").request(
      { hostname, path, method: "GET" },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const parsed = JSON.parse(data);
            if (res.statusCode >= 400) {
              resolve({ error: parsed.error?.message || `HTTP ${res.statusCode}` });
              return;
            }
            const items = (parsed.items || []).map((item) => ({
              title:   item.title,
              link:    item.link,
              snippet: item.snippet,
            }));
            resolve({ success: true, query, results: items });
          } catch {
            resolve({ error: `Non-JSON response: ${data.slice(0, 200)}` });
          }
        });
      }
    );
    req.on("error", (err) => resolve({ error: err.message }));
    req.end();
  });
}

// ─── Tool router ──────────────────────────────────────────────────────────────
async function executeTool(name, input) {
  console.log("Tool call:", name, JSON.stringify(input));
  switch (name) {
    case "web_search":          return await webSearch(input);
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
const SYSTEM_PROMPT = `You are Luna — the West Camp Trip Planner AI for a group of 7 friends (${TRIP_DATA.attendees.join(", ")}) spending ${TRIP_DATA.dates} in the ${TRIP_DATA.location}.

You know everything about this trip: the schedule, meals being voted on, activities, restaurants nearby, recipes, and each person's preferences. You have direct read/write access to the trip database and can search the web for current information.

## Schedule
The trip calendar runs 10 AM – midnight each day. Times are stored internally as "minutes from 10 AM" (0 = 10:00 AM, 60 = 11:00 AM, 480 = 6:00 PM, etc.) but you should always display and accept clock times like "6:30 PM".

Days:
- Thursday July 9 (thu): Arrival day — lighter schedule
- Friday July 10 (fri): Full day — hike/swim in morning, leisure afternoon, dinner, backgammon tournament
- Saturday July 11 (sat): Full day — activity in morning, leisure afternoon, dinner, fire pit

## What you can do
- **Search the web** with web_search for restaurants, activities, recipes, reviews, weather, local tips — anything current
- **View the full schedule** for any day with get_full_schedule
- **Move blocks** to new times with move_block — always call get_full_schedule first so you have the block IDs
- **Reset blocks** to their default times with reset_block
- **Read and update voting preferences** for all polls

## Behavior
- Be concise and friendly. Your name is Luna.
- Use web_search proactively when asked about restaurants, activities, or local recommendations
- When moving blocks, confirm the change with the new time
- When you move a block, the frontend calendar will update automatically
- If asked to rearrange multiple blocks, do them in sequence
- Always verify block IDs with get_full_schedule before calling move_block
- Warn if a proposed time would cause obvious conflicts (e.g. dinner at 4 PM when lunch is at 3 PM)`;

// ─── Gemini agentic loop (Vertex AI generateContent) ─────────────────────────
// Gemini uses a different message shape:
//   user/model turns use "parts" arrays
//   tool calls come back as functionCall parts
//   tool results are sent back as functionResponse parts in a "user" turn
async function runGeminiLoop(contents, modelId) {
  const MAX_ROUNDS = 10;
  let scheduleChanged = false;

  for (let round = 0; round < MAX_ROUNDS; round++) {
    const response = await vertexRequest(contents, SYSTEM_PROMPT, GEMINI_TOOLS, modelId);

    // Gemini response shape: { candidates: [{ content: { role, parts }, finishReason }] }
    const candidate = response.candidates?.[0];
    if (!candidate) throw new Error("Empty response from Vertex AI");

    const modelContent = candidate.content; // { role: "model", parts: [...] }
    contents.push(modelContent);

    const finishReason = candidate.finishReason;

    // Check for function call parts
    const fnCalls = modelContent.parts.filter((p) => p.functionCall);

    if (fnCalls.length === 0 || finishReason === "STOP") {
      // Final text answer
      const text = modelContent.parts
        .filter((p) => p.text)
        .map((p) => p.text)
        .join("")
        .trim();
      return { text: text || "Done.", scheduleChanged };
    }

    // Execute all function calls and collect responses
    const responseParts = [];
    for (const part of fnCalls) {
      const { name, args } = part.functionCall;
      const result = await executeTool(name, args || {});
      if (result.schedule_changed) scheduleChanged = true;
      responseParts.push({
        functionResponse: { name, response: result },
      });
    }

    // Return tool results as a "user" turn (Gemini convention)
    contents.push({ role: "user", parts: responseParts });
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
    const { message, sessionId, model = "fast" } = JSON.parse(event.body || "{}");
    if (!message?.trim()) {
      return { statusCode: 400, body: JSON.stringify({ error: "message is required" }) };
    }

    const modelId = model === "thinking" ? VERTEX_THINK_MODEL : VERTEX_FAST_MODEL;
    const sid     = sessionId || `session-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    // Both models use Gemini message format — sessions are always compatible.
    let session = sessions.get(sid) || { model, history: [] };

    session.history.push({ role: "user", parts: [{ text: message }] });
    const result = await runGeminiLoop([...session.history], modelId);
    session.history.push({ role: "model", parts: [{ text: result.text }] });

    // Trim to last 20 messages to avoid token blowup
    session.history = session.history.slice(-20);
    sessions.set(sid, session);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        success: true,
        message: result.text,
        sessionId: sid,
        scheduleChanged: result.scheduleChanged,
        model,
      }),
    };
  } catch (err) {
    console.error("Agent error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message || "Internal error" }),
    };
  }
};
