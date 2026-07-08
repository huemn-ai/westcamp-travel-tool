/* expose hoisted function declarations to window immediately — safe because
   function declarations are hoisted before any code runs */
/* Capture originals before the wrapper assignments below overwrite window.X */
var _fnOpenLunaChat    = openLunaChat;
var _fnCloseLunaChat   = closeLunaChat;
var _fnSendAgentMsg    = sendAgentMessage;
var _fnOpenVoteModal   = openVoteModal;
var _fnCloseVoteModal  = closeVoteModal;
var _fnCastVote        = castVote;
var _fnWriteinChange   = onWriteinChange;
var _fnToggleShopItem  = toggleShopItem;
var _fnOpenNameModal   = openNameModal;
var _fnConfirmName     = confirmName;
var _fnCloseWizard     = closeWizard;
var _fnWizardNext      = wizardNext;
var _fnWizardBack      = wizardBack;
var _fnWizardSkip      = wizardSkip;
var _fnDoRefresh       = doRefresh;
window.openLunaChat    = function(){ openLunaChat(); };
window.closeLunaChat   = function(){ closeLunaChat(); };
window.sendAgentMessage= function(){ sendAgentMessage(); };
window.openVoteModal   = function(p){ openVoteModal(p); };
window.closeVoteModal  = function(){ closeVoteModal(); };
window.castVote        = function(p,r,v){ castVote(p,r,v); };
window.onWriteinChange = function(e){ onWriteinChange(e); };
window.toggleShopItem  = function(id){ toggleShopItem(id); };
window.openNameModal   = function(){ openNameModal(); };
window.confirmName     = function(){ confirmName(); };
window.closeWizard     = function(){ closeWizard(); };
window.wizardNext      = function(){ wizardNext(); };
window.wizardBack      = function(){ wizardBack(); };
window.wizardSkip      = function(){ wizardSkip(); };
window.doRefresh       = function(){ doRefresh(); };
/* Re-point window.X to the captured originals so inline onclick handlers
   call real implementations without infinite recursion. */
window.openLunaChat    = function(){ _fnOpenLunaChat(); };
window.closeLunaChat   = function(){ _fnCloseLunaChat(); };
window.sendAgentMessage= function(){ _fnSendAgentMsg(); };
window.openVoteModal   = function(p){ _fnOpenVoteModal(p); };
window.closeVoteModal  = function(){ _fnCloseVoteModal(); };
window.castVote        = function(p,r,v){ _fnCastVote(p,r,v); };
window.onWriteinChange = function(e){ _fnWriteinChange(e); };
window.toggleShopItem  = function(id){ _fnToggleShopItem(id); };
window.openNameModal   = function(){ _fnOpenNameModal(); };
window.confirmName     = function(){ _fnConfirmName(); };
window.closeWizard     = function(){ _fnCloseWizard(); };
window.wizardNext      = function(){ _fnWizardNext(); };
window.wizardBack      = function(){ _fnWizardBack(); };
window.wizardSkip      = function(){ _fnWizardSkip(); };
window.doRefresh       = function(){ _fnDoRefresh(); };

/* ═══════════════════════════════════════════════════════════
   SUPABASE INITIALIZATION
═══════════════════════════════════════════════════════════ */
const SUPABASE_URL = 'https://xstcdokwuhivywqedkni.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhzdGNkb2t3dWhpdnl3cWVka25pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1MTQzOTgsImV4cCI6MjA5OTA5MDM5OH0.5N2cPOrj7REhUc0rz3wat6eAZ_k9vFlnoLRJRdbZKtg';
let _db;
try {
  _db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  });
} catch(e) {
  console.warn('Supabase init failed:', e);
  _db = null;
}

/* ═══════════════════════════════════════════════════════════
   ALL BAKED-IN TRIP DATA
═══════════════════════════════════════════════════════════ */
const WEATHER = {
  thu: { high: 86.7, precip: 35, label: 'Thu 7/9' },
  fri: { high: 81.9, precip: 35, label: 'Fri 7/10' },
  sat: { high: 81.4, precip: 0,  label: 'Sat 7/11' },
};
const HOURS = [10,11,12,13,14,15,16,17,18,19,20,21,22,23];
const TEMP_OFFSET  = [-8,-6,-4,-2,-1,0,0,-2,-4,-6,-8,-10,-11,-12];
const PRECIP_MULT  = [0.5,0.6,0.7,0.9,1.0,1.1,1.1,1.0,0.8,0.7,0.6,0.5,0.4,0.4];
function hourlyWeather(dayKey) {
  const d = WEATHER[dayKey];
  return HOURS.map((h,i)=>({
    hour: h,
    temp: Math.round(d.high + TEMP_OFFSET[i]),
    precip: Math.min(95, Math.max(0, Math.round(d.precip * PRECIP_MULT[i])))
  }));
}

const RESTAURANTS = {
  breakfast:[
    {name:'Village Diner', price:'$', addr:'140 Main St, Saugerties', why:'Classic all-day diner, seats 7 easily, opens 6 AM.'},
    {name:'Bleu Collar Sammies', price:'$$', addr:'239 Ulster Ave, Saugerties', why:'Best breakfast sandwiches in town, fast grab-and-go.'},
    {name:'Ohana Café', price:'$$', addr:'117 Partition St, Saugerties', why:'Sit-down crepes and egg dishes for a slower morning.'},
  ],
  lunch:[
    {name:'Little Cinco De Mayo', price:'$$', addr:'12 Market St, Saugerties', why:'House-made corn tortillas, casual, no reservation needed.'},
    {name:"Stella's Station", price:'$$', addr:'150 Partition St, Saugerties', why:'Patio and easy bar food, good post-activity landing spot.'},
    {name:'Rose 32 (food truck)', price:'$', addr:'2969 NY-32, Saugerties', why:'Big sandwiches, picnic tables, fast.'},
  ],
  dinner:[
    {name:"Miss Lucy's Kitchen", price:'$$', addr:'90 Partition St, Saugerties', why:"Strongest all-around dinner in town; call ahead for 7."},
    {name:'The Dutch', price:'$$', addr:'253 Main St, Saugerties', why:'Gastropub, casual enough straight off the trail.'},
    {name:"Sue's", price:'$$', addr:'3101 US-9W, Saugerties', why:'Old-school Italian/pizza bar-and-grill, generous portions.'},
  ],
};
const SPLURGE = "Want one nicer night? Maestri's Prime Italian Steakhouse and BLACKBARN Hudson Valley are above the everyday budget but worth it for a single splurge — reserve well ahead for 7.";

const RECIPES = {
  'nyt-sheetpan-chicken': { name:'Sheet-Pan Chicken w/ Potatoes, Arugula & Garlic Yogurt', source:'NYT Cooking', rating:5, reviews:9780, url:'https://cooking.nytimes.com/recipes/1017359-sheet-pan-chicken-with-potatoes-arugula-and-garlic-yogurt', sides:'Built in (arugula + garlic yogurt); add crusty bread.' },
  'ar-sausage-orzo':      { name:'One-Pot Chicken & Sausage Orzo', source:'Allrecipes', rating:4.7, reviews:168, url:'https://www.allrecipes.com/recipe/246126/one-pot-chicken-and-sausage-orzo/', sides:'Simple green salad.', note:'Add sun-dried tomatoes + wilt in spinach at the end.' },
  'lcc-flank-steak':      { name:'Grilled Flank Steak with Chimichurri', source:'Le Crème de la Crumb', rating:4.95, reviews:344, url:'https://www.lecremedelacrumb.com/flank-steak-with-chimichurri-sauce/', sides:'Tomato-cucumber salad + crusty bread.' },
  'nyt-dutch-baby':       { name:'Dutch Baby w/ Macerated Stone Fruit', source:'NYT Cooking', rating:5, reviews:18609, url:'https://cooking.nytimes.com/recipes/6648-dutch-baby', sides:'Macerated peaches/plums (sugar + lemon, 30 min).' },
  'ds-shakshuka':         { name:'Shakshuka', source:'Downshiftology', rating:4.94, reviews:529, url:'https://downshiftology.com/recipes/shakshuka/', sides:'Crusty bread, feta.' },
  'ar-strata':            { name:'Sausage Strata', source:'Allrecipes', rating:4.6, reviews:435, url:'https://www.allrecipes.com/recipe/20913/easy-sausage-strata/', sides:'', note:'Assemble the night before, bake in the morning.' },
  'hbh-peach-burrata':    { name:'Tomato, Peach & Burrata Salad', source:'Half Baked Harvest', rating:4.71, reviews:327, url:'https://www.halfbakedharvest.com/tomato-peach-and-burrata-salad/', sides:'Grilled bread.' },
  'nyt-nicoise':          { name:'Sheet-Pan Salmon Niçoise Salad', source:'NYT Cooking', rating:5, reviews:2569, url:'https://cooking.nytimes.com/recipes/1020220-sheet-pan-roasted-salmon-nicoise-salad', sides:'' },
  'tesco-orzo':           { name:'Baked Mediterranean Orzo', source:'Tesco Real Food', rating:null, reviews:223, url:'https://realfood.tesco.com/recipes/baked-mediterranean-orzo.html', sides:'' },
  'nyt-short-ribs':       { name:'Garlic-Braised Short Ribs w/ Red Wine', source:'NYT Cooking', rating:5, reviews:10326, url:'https://cooking.nytimes.com/recipes/1019034-garlic-braised-short-ribs-with-red-wine', sides:'Polenta, arugula-parmesan-lemon salad, garlic bread.' },
  'ar-shish-tawook':      { name:'Shish Tawook', source:'Allrecipes', rating:4.8, reviews:234, url:'https://www.allrecipes.com/recipe/150251/shish-tawook-grilled-chicken/', sides:'Fattoush + rice pilaf.' },
  'rtk-tritip':           { name:'Reverse Sear Tri-Tip w/ Chimichurri', source:'Running to the Kitchen', rating:4.75, reviews:48, url:'https://www.runningtothekitchen.com/reverse-sear-tri-tip/', sides:'Grilled corn & tomato salad + crusty bread.' },
  'ar-crepes':            { name:'Crepes Bar (Savory + Sweet)', source:'Allrecipes', rating:4.8, reviews:3014, url:'https://www.allrecipes.com/recipe/16383/basic-crepes/', sides:'', note:'Set out ham/cheese/spinach + Nutella/fruit/lemon-sugar.' },
  'cg-sucuklu':           { name:'Sucuklu Yumurta (Turkish Sausage & Eggs)', source:'Cooking Gorgeous', rating:5, reviews:1, url:'https://cookingorgeous.com/blog/sucuklu-yumurta-turkish-sausage-and-eggs/', sides:'', note:'Serve spread-style: olives, feta, cucumber-tomato, honey, warm bread.' },
  'rte-bibimbap':         { name:'Bibimbap Bowls', source:'RecipeTin Eats', rating:4.99, reviews:100, url:'https://www.recipetineats.com/bibimbap/', sides:'', note:'Breakfast version — fried egg on top.' },
  'ar-cubano':            { name:"Chef John's Cuban Sandwich", source:'Allrecipes', rating:4.9, reviews:96, url:'https://www.allrecipes.com/recipe/256968/chef-johns-cuban-sandwich/', sides:'' },
  'ar-quesadillas':       { name:'Chicken Quesadillas', source:'Allrecipes', rating:4.6, reviews:1205, url:'https://www.allrecipes.com/recipe/21659/chicken-quesadillas/', sides:'' },
  'diy-kale-caesar':      { name:'Kale Caesar w/ Grilled Chicken', source:'house recipe', rating:null, reviews:null, url:null, sides:'', note:"Bottled Caesar dressing brightened with fresh lemon juice; lacinato kale, grilled chicken, parmesan, croutons." },
  'nyt-bolognese':        { name:"Marcella Hazan's Bolognese w/ Pappardelle", source:'NYT Cooking', rating:5, reviews:30745, url:'https://cooking.nytimes.com/recipes/1015181-marcella-hazans-bolognese-sauce', sides:'Radicchio-fennel salad + crusty bread.', note:'Starts 3+ hrs before dinner — begin by 3 PM.' },
  'zz-lamb-chops':        { name:'Lebanese Grilled Lamb Chops', source:'Zaatar & Zaytoun', rating:5, reviews:6, url:'https://zaatarandzaytoun.com/lamb-chops/', sides:'Fattoush + rice pilaf.' },
  'rte-eggplant-parm':    { name:'Eggplant Parmigiana', source:'RecipeTin Eats', rating:4.96, reviews:83, url:'https://www.recipetineats.com/eggplant-parmigiana/', sides:'Simple green salad + garlic bread.', veg:true },
  'hershey-smores':       { name:"Elevated S'mores", source:"Hershey's", rating:null, reviews:null, url:'https://www.hersheyland.com/recipes/hersheys-smores.html', sides:'', note:'Dark chocolate + flaky salt.' },
  'tbfs-brie':            { name:'Baked Brie w/ Honey & Rosemary', source:'Tastes Better From Scratch', rating:5, reviews:85, url:'https://tastesbetterfromscratch.com/baked-brie/', sides:'' },
  'ft-grilled-peaches':   { name:'Grilled Peaches w/ Mascarpone & Cinnamon Sugar', source:'The Floured Table', rating:null, reviews:null, url:'https://www.theflouredtable.com/grilled-peaches-with-mascarpone/', sides:'' },
};

const SNACK_IDS = ['hershey-smores','tbfs-brie','ft-grilled-peaches'];

const ACTIVITIES = {
  // Thursday walks
  'thu-lighthouse':   { name:'Saugerties Lighthouse Trail',    addr:'168 Lighthouse Dr, Saugerties',    tip:'Flat half-mile along the Hudson; check the tide table, the path floods at high tide.', type:'flexible', durationMin:90 },
  'thu-falling':      { name:'Falling Waters Preserve',        addr:'Dominican Ln, Saugerties',          tip:'Under a mile, gently sloping, Hudson views.', type:'flexible', durationMin:90 },
  'thu-esopus':       { name:'Esopus Bend Nature Preserve',    addr:'Saugerties',                        tip:'Quiet creekside loop, easy walking.', type:'flexible', durationMin:90 },
  // Friday physical
  'fri-kaaterskill':  { name:'Kaaterskill Falls Hike',          addr:'NY-23A, Haines Falls',              tip:'~2 mi round trip; go early for parking.', type:'hike', durationMin:180 },
  'fri-overlook':     { name:'Overlook Mountain Hike',          addr:'Meads Mountain Rd, Woodstock',      tip:'Fire tower + hotel ruins at top.', type:'hike', durationMin:240 },
  'fri-rail-trail':   { name:'Ashokan Rail Trail',              addr:'West Hurley trailhead',             tip:'Flat and easy, best rain-friendly option.', type:'flexible', durationMin:150 },
  'fri-ns-lake':      { name:'North–South Lake Swim',           addr:'874 N Lake Rd, Haines Falls',       tip:'Day-use fee, bathhouse and picnic tables.', type:'swim', durationMin:180 },
  // Friday leisure
  'fri-lasting-joy':  { name:'Lasting Joy Brewery',             addr:'485 Lasher Rd, Tivoli',             tip:'Full food, farm fields, fire pits, dog-friendly.', type:'flexible', durationMin:120 },
  'fri-woodstock':    { name:'Woodstock Town Exploration',      addr:'Tinker Street, Woodstock',          tip:'Shops, galleries, flea market (Saturdays only).', type:'flexible', durationMin:120 },
  'fri-hangout':      { name:'Indoor Hangout at the House',     addr:'',                                  tip:'Games, music, pool.', type:'flexible', durationMin:120 },
  'fri-blue-duck':    { name:'Blue Duck Brewing Co.',           addr:'79 Hurley Ave, Kingston',           tip:'Full food, fire pit patio, garage doors open to outside.', type:'flexible', durationMin:120 },
  'fri-keegan':       { name:'Keegan Ales',                     addr:'20 St James St, Kingston',          tip:'Kingston institution, live music, pub food, open from noon Fri.', type:'flexible', durationMin:120 },
  // Saturday physical
  'sat-arboretum':    { name:'Mountain Top Arboretum + Five State Lookout', addr:'4 Maude Adams Rd, Tannersville', tip:'Easy marked trails, short drive to lookout after.', type:'flexible', durationMin:150 },
  'sat-opus40':       { name:'Opus 40',                         addr:'Fite Rd, Saugerties',               tip:'Bluestone sculpture park, partly shaded, rotating art exhibits.', type:'flexible', durationMin:120 },
  'sat-village':      { name:'Woodstock Village Stroll + Shops', addr:'Tinker Street, Woodstock',         tip:'Best bad-weather fallback.', type:'flexible', durationMin:120 },
  // Saturday leisure
  'sat-lasting-joy':  { name:'Lasting Joy Brewery',             addr:'485 Lasher Rd, Tivoli',             tip:'Full food, farm fields, fire pits.', type:'flexible', durationMin:120 },
  'sat-rose-hill':    { name:'Rose Hill Winery & Cidery',       addr:'14 Rose Hill, Red Hook',            tip:'Snacks + drinks, lawn seating, beautiful barn.', type:'flexible', durationMin:120 },
  'sat-flea-market':  { name:'Woodstock Flea Market + Tinker St', addr:'Behind Bread Alone Bakery, Woodstock', tip:'Vintage, crafts, vinyl, art — Saturdays only, free to browse.', type:'flexible', durationMin:120 },
  'sat-blue-duck':    { name:'Blue Duck Brewing Co.',           addr:'79 Hurley Ave, Kingston',           tip:'Full food, fire pit patio, garage doors.', type:'flexible', durationMin:120 },
  'sat-keegan':       { name:'Keegan Ales',                     addr:'20 St James St, Kingston',          tip:'Kingston institution, live music, pub food.', type:'flexible', durationMin:120 },
  // Lunch eat-out options
  'eo-cinco':         { name:'Little Cinco De Mayo',            addr:'12 Market St, Saugerties',          tip:'House-made corn tortillas, casual, no reservation needed · open Tue–Sat 11 AM–7 PM.', type:'restaurant', price:'$$', rating:4.8, reviews:73, durationMin:90 },
  'eo-stella':        { name:"Stella's Station",                addr:'150 Partition St, Saugerties',      tip:'Patio bar food, good post-activity landing spot.', type:'restaurant', price:'$$', rating:null, reviews:null, durationMin:90 },
  'eo-tinker-taco':   { name:'Tinker Taco Lab',                 addr:'261 Tinker St, Woodstock',          tip:'Daily-made corn tortillas, outdoor seating, mezcal bar next door · ~15 min.', type:'restaurant', price:'$', rating:null, reviews:null, durationMin:90 },
  'eo-kingston-brew': { name:'Kingston Standard Brewing Co.',   addr:'22 Jansen Ave, Kingston',           tip:'Pizza + craft beer, outdoor seating · open Thu–Sun from noon · ~25 min.', type:'restaurant', price:'$', rating:4.7, reviews:142, durationMin:90 },
  'eo-lasting-lunch': { name:'Lasting Joy Brewery',             addr:'485 Lasher Rd, Tivoli',             tip:'Full food menu, burgers, hummus, vegetarian options · open Sat from noon · ~30 min.', type:'restaurant', price:'$', rating:4.7, reviews:189, durationMin:90 },
  // Dinner eat-out options
  'eo-pearl-moon':    { name:'Pearl Moon Woodstock',            addr:'52 Mill Hill Rd, Woodstock',        tip:'Farm-to-table comfort food, live music Fri/Sat, outdoor seating · ~15 min.', type:'restaurant', price:'$$', rating:4.5, reviews:684, durationMin:120 },
  'eo-shelter':       { name:'Shelter Woodstock',               addr:'21 Mill Hill Rd, Woodstock',        tip:'Eclectic/empanadas, live music from 7 PM Fri/Sat · ~15 min.', type:'restaurant', price:'$$', rating:4.6, reviews:314, durationMin:120 },
  'eo-ship-to-shore': { name:'Ship to Shore',                   addr:'15 W Strand St, Kingston',          tip:'American waterfront, highest review count in region · ~25 min.', type:'restaurant', price:'$$$', rating:4.6, reviews:928, durationMin:120 },
  'eo-partition':     { name:'The Partition',                   addr:'124 Partition St, Saugerties',      tip:'Bar & grill, live DJ, open until midnight Fri/Sat · ~5 min.', type:'restaurant', price:'$$', rating:4.5, reviews:221, durationMin:120 },

  // Drinks
  'drink-martini':    { name:'Martini',  tip:'Classic gin or vodka martini — shaken or stirred.', type:'drink', desc:'Gin or vodka · dry vermouth · olive or twist' },
  'drink-negroni':    { name:'Negroni',  tip:'Equal parts gin, Campari, sweet vermouth — stirred.', type:'drink', desc:'Gin · Campari · sweet vermouth · orange peel' },
  'drink-spritz':     { name:'Spritz',   tip:'Aperol or Campari with prosecco and a splash of soda.', type:'drink', desc:'Aperol or Campari · prosecco · soda · orange slice' },
  'drink-beer':       { name:'Beer',     tip:"Whatever's cold and local.", type:'drink', desc:"Craft cans, bottles, or whatever's in the cooler" },
  'drink-wine':       { name:'Wine',     tip:"Red, white, or rosé — your call.", type:'drink', desc:'Red · white · rosé' },
};

/* Poll definitions */
const POLLS = {
  'poll-thu-dinner':   { label:'Thursday Dinner',   type:'meal',     options:['nyt-sheetpan-chicken','ar-sausage-orzo','lcc-flank-steak','_writein'], day:'thu' },
  'poll-thu-snack':    { label:'Thursday Fire-Pit Snack', type:'snack', options:['hershey-smores','tbfs-brie','ft-grilled-peaches'], day:'thu' },
  'poll-fri-breakfast':{ label:'Friday Breakfast',   type:'meal',     options:['nyt-dutch-baby','ds-shakshuka','ar-strata'], day:'fri' },
  'poll-fri-lunch':    { label:'Friday Lunch',       type:'meal',     options:['hbh-peach-burrata','nyt-nicoise','tesco-orzo','eo-cinco','eo-stella','eo-tinker-taco','eo-kingston-brew','eo-lasting-lunch'], day:'fri' },
  'poll-fri-dinner':   { label:'Friday Dinner',      type:'meal',     options:['nyt-short-ribs','ar-shish-tawook','rtk-tritip','eo-pearl-moon','eo-shelter','eo-ship-to-shore','eo-partition'], day:'fri' },
  'poll-fri-physical': { label:'Friday Activity',    type:'activity', options:['fri-kaaterskill','fri-overlook','fri-rail-trail','fri-ns-lake'], day:'fri' },
  'poll-fri-leisure':  { label:'Friday Leisure',     type:'activity', options:['fri-lasting-joy','fri-woodstock','fri-hangout','fri-blue-duck','fri-keegan'], day:'fri' },
  'poll-fri-evening-walk': { label:'Friday Evening Walk', type:'activity', options:['thu-lighthouse','thu-falling','thu-esopus'], day:'fri' },
  'poll-fri-snack':    { label:'Friday Fire-Pit Snack', type:'snack', options:['hershey-smores','tbfs-brie','ft-grilled-peaches'], day:'fri' },
  'poll-sat-breakfast':{ label:'Saturday Breakfast', type:'meal',     options:['ar-crepes','cg-sucuklu','rte-bibimbap'], day:'sat' },
  'poll-sat-lunch':    { label:'Saturday Lunch',     type:'meal',     options:['ar-cubano','ar-quesadillas','diy-kale-caesar','eo-cinco','eo-stella','eo-tinker-taco','eo-kingston-brew','eo-lasting-lunch'], day:'sat' },
  'poll-sat-dinner':   { label:'Saturday Dinner',    type:'meal',     options:['nyt-bolognese','zz-lamb-chops','rte-eggplant-parm','eo-pearl-moon','eo-shelter','eo-ship-to-shore','eo-partition'], day:'sat' },
  'poll-sat-physical': { label:'Saturday Activity',  type:'activity', options:['sat-arboretum','sat-opus40','sat-village'], day:'sat' },
  'poll-sat-leisure':  { label:'Saturday Leisure',   type:'activity', options:['sat-lasting-joy','sat-rose-hill','sat-flea-market','sat-blue-duck','sat-keegan'], day:'sat' },
  'poll-sat-snack':    { label:'Saturday Fire-Pit Snack', type:'snack', options:['hershey-smores','tbfs-brie','ft-grilled-peaches'], day:'sat' },
  'poll-drinks':       { label:'Drink of Choice',        type:'drink', options:['drink-martini','drink-negroni','drink-spritz','drink-beer','drink-wine'], day:'trip' },
};

/* Shopping list condensed buy-lists (7 people, original writing) */
const SHOPPING_LISTS = {
  'nyt-sheetpan-chicken':  ['Bone-in chicken thighs × 14 (or ~7 lb)', 'Baby potatoes 3 lb', 'Arugula 10 oz', 'Greek yogurt 2 cups', 'Garlic 2 heads', 'Lemons × 3', 'Olive oil, red pepper flakes, dried oregano', 'Crusty baguettes × 2'],
  'ar-sausage-orzo':       ['Boneless chicken thighs 3 lb', 'Italian sausage links × 4', 'Orzo 2 lb', 'Sun-dried tomatoes (oil-packed) 1 jar', 'Fresh spinach 6 oz', 'Chicken broth 48 oz', 'Onion, garlic, canned diced tomatoes', 'Parmesan block, green salad greens'],
  'lcc-flank-steak':       ['Flank steak 3–3.5 lb', 'Flat-leaf parsley 2 bunches', 'Fresh oregano, garlic, red wine vinegar', 'Red chili flakes, olive oil', 'Roma tomatoes × 4, English cucumber', 'Crusty baguettes × 2'],
  'nyt-dutch-baby':        ['Eggs × 12', 'All-purpose flour 2 cups', 'Whole milk 2 cups', 'Butter (unsalted)', 'Ripe peaches × 6 and/or plums × 6', 'Sugar, lemons × 2, vanilla extract', 'Powdered sugar for serving'],
  'ds-shakshuka':          ['Canned whole tomatoes × 4 (28 oz)', 'Eggs × 12', 'Onion × 2, red bell peppers × 2', 'Garlic, cumin, smoked paprika, cayenne', 'Feta 6 oz', 'Crusty baguettes × 2, fresh parsley'],
  'ar-strata':             ['Italian sausage 1.5 lb', 'Day-old bread (sourdough) 1 loaf', 'Eggs × 12', 'Whole milk 3 cups', 'Gruyère or cheddar 8 oz', 'Dijon mustard, garlic, onion, fresh herbs'],
  'hbh-peach-burrata':     ['Ripe tomatoes assorted 3 lb', 'Ripe peaches × 5', 'Burrata 3–4 balls (4 oz each)', 'Prosciutto 4 oz (optional)', 'Basil 1 bunch, balsamic glaze', 'Sourdough for grilling'],
  'nyt-nicoise':           ['Salmon fillets 3.5 lb', 'Fingerling potatoes 2 lb', 'Green beans 1 lb', 'Eggs × 8, Niçoise olives 1 cup', 'Cherry tomatoes 1 pint', 'Dijon mustard, anchovy paste, capers', 'Arugula or mixed greens 10 oz'],
  'tesco-orzo':            ['Orzo 2 lb', 'Cherry tomatoes 2 pints', 'Zucchini × 3, eggplant × 2', 'Kalamata olives 1 cup, capers', 'Feta 8 oz, vegetable broth 32 oz', 'Fresh basil, olive oil, garlic'],
  'nyt-short-ribs':        ['Bone-in short ribs 7–8 lb', 'Red wine (full bottle)', 'Beef broth 32 oz', 'Polenta 1 lb, parmesan block', 'Onion × 2, carrot × 2, celery × 3, garlic 2 heads', 'Arugula 8 oz, fennel × 1, radicchio × 1, lemon', 'Crusty baguettes × 2'],
  'ar-shish-tawook':       ['Boneless chicken thighs 3.5 lb', 'Plain yogurt 1 cup, lemon × 3', 'Garlic, tomato paste, cumin, paprika, cinnamon', 'Pita breads × 14', 'Rice 3 cups, pine nuts (optional)', 'Romaine, cucumber, tomato, radishes, sumac for fattoush'],
  'rtk-tritip':            ['Tri-tip roast 4.5–5 lb', 'Flat-leaf parsley 2 bunches, fresh oregano', 'Red wine vinegar, garlic, olive oil, red chili flakes', 'Corn on the cob × 7', 'Cherry tomatoes 2 pints, basil', 'Crusty baguettes × 2'],
  'ar-crepes':             ['Eggs × 6', 'All-purpose flour 2 cups', 'Whole milk 3 cups', 'Butter (unsalted)', 'Ham slices, Swiss cheese, fresh spinach', 'Nutella 1 jar, strawberries + bananas', 'Lemons × 2, powdered sugar'],
  'cg-sucuklu':            ['Sucuk (Turkish sausage) 1–1.5 lb', 'Eggs × 12', 'Kalamata olives 1 cup', 'Feta 6 oz, cucumber × 2, tomatoes × 4', 'Honey jar, fresh flatbreads or pita × 14'],
  'rte-bibimbap':          ['Short-grain rice 4 cups', 'Eggs × 7', 'Ground beef or turkey 1.5 lb', 'Spinach 10 oz, bean sprouts 1 bag', 'Zucchini × 2, carrots × 3, shiitake mushrooms 8 oz', 'Gochujang 1 jar, sesame oil, soy sauce, garlic'],
  'ar-cubano':             ['Cuban or soft hoagie rolls × 7', 'Pulled pork shoulder 3 lb (or cooked pork loin)', 'Deli ham 1 lb', 'Swiss cheese 12 oz', 'Yellow mustard, dill pickles', 'Butter for pressing'],
  'ar-quesadillas':        ['Flour tortillas × 20', 'Boneless chicken breasts 3 lb', 'Shredded Mexican cheese blend 2 lb', 'Bell peppers × 3, onion × 2', 'Cumin, chili powder, salsa, sour cream, guacamole'],
  'diy-kale-caesar':       ['Lacinato (dinosaur) kale 2 large bunches', 'Boneless chicken breasts 3.5 lb for grilling', 'Caesar dressing (bottled) + lemons × 2', 'Parmesan block, croutons 1 large bag'],
  'nyt-bolognese':         ['Ground beef/pork mix 2.5 lb', 'Pappardelle 2 lb', 'Canned whole tomatoes × 2 (28 oz)', 'Onion × 2, carrot × 2, celery × 3', 'Whole milk 1 cup, dry white wine 1 cup', 'Radicchio, fennel bulb', 'Parmesan block, crusty baguettes × 2'],
  'zz-lamb-chops':         ['Lamb loin chops 14 pieces (~4.5 lb)', 'Garlic 2 heads, olive oil, lemon × 2', 'Dried oregano, cumin, coriander, cinnamon', 'Rice 3 cups, pine nuts, golden raisins (optional)', 'Romaine, cucumber, tomato, sumac, pita for fattoush'],
  'rte-eggplant-parm':     ['Large eggplants × 4–5', 'Canned crushed tomatoes × 3 (28 oz)', 'Mozzarella 1.5 lb, parmesan block', 'Eggs × 4, breadcrumbs 2 cups, flour 1 cup', 'Garlic × 1 head, fresh basil, olive oil', 'Mixed greens 10 oz, garlic cloves + baguette for bread'],
  'hershey-smores':        ['Graham crackers 2 boxes', 'Dark chocolate bars × 4 (70%+)', 'Flaky sea salt (Maldon)', 'Marshmallows 2 bags, skewers × 14'],
  'tbfs-brie':             ['Brie wheel × 2 (8 oz each)', 'Honey jar, fresh rosemary 2 sprigs', 'Mixed nuts, crackers/baguette for serving'],
  'ft-grilled-peaches':    ['Ripe peaches × 8', 'Mascarpone 8 oz', 'Cinnamon, brown sugar, vanilla extract', 'Honey jar for drizzling'],
};
/* ═══════════════════════════════════════════════════════════
   STATE & STORAGE WRAPPER
═══════════════════════════════════════════════════════════ */
const ST = {
  votes:    {},   // { [pollId]: { [guestName]: { first, second } } }
  schedule: {},   // { [dayId]: { [blockId]: { start, duration, manual } } }
  writein:  { text:'', updatedBy:'' },
  shopping: {},   // { [itemId]: true }
  guestName: '',
  storageOk: true,
};

async function storageGet(key) {
  if (!_db) return null;
  try {
    if (key === 'wcd-votes') {
      const { data, error } = await _db
        .from('preferences')
        .select('guest_name, poll_id, first_choice, second_choice');
      if (error) throw error;
      
      // Transform database rows into the expected format
      const votes = {};
      for (const row of data) {
        if (!votes[row.poll_id]) votes[row.poll_id] = {};
        votes[row.poll_id][row.guest_name] = {
          first: row.first_choice,
          second: row.second_choice
        };
      }
      return Object.keys(votes).length > 0 ? votes : null;
    }
    
    if (key === 'wcd-writein') {
      const { data, error } = await _db
        .from('write_ins')
        .select('text, updated_by')
        .limit(1);
      if (error) throw error;
      return data && data.length > 0 ? data[0] : null;
    }
    
    if (key === 'wcd-schedule') {
      const { data, error } = await _db
        .from('schedule_changes')
        .select('day_key, block_id, start_minutes, duration, manual');
      if (error) throw error;
      
      // Transform database rows into the expected format
      const schedule = {};
      for (const row of data) {
        if (!schedule[row.day_key]) schedule[row.day_key] = {};
        schedule[row.day_key][row.block_id] = {
          start: row.start_minutes,
          duration: row.duration,
          manual: row.manual
        };
      }
      return Object.keys(schedule).length > 0 ? schedule : null;
    }
    
    if (key === 'wcd-shopping') {
      const { data, error } = await _db
        .from('shopping_items')
        .select('item_id')
        .eq('checked', true);
      if (error) throw error;
      
      // Transform database rows into the expected format
      const shopping = {};
      for (const row of data) {
        shopping[row.item_id] = true;
      }
      return Object.keys(shopping).length > 0 ? shopping : null;
    }
    
    return null;
  } catch(e) {
    console.error('storageGet error', key, e);
    return null;
  }
}

async function storageSet(key, value) {
  if (!_db) return;
  try {
    if (key === 'wcd-votes') {
      // Clear existing votes and insert new ones
      await _db.from('preferences').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      // Insert all votes
      const rows = [];
      for (const [pollId, guestVotes] of Object.entries(value)) {
        for (const [guestName, votes] of Object.entries(guestVotes)) {
          rows.push({
            guest_name: guestName,
            poll_id: pollId,
            first_choice: votes.first,
            second_choice: votes.second
          });
        }
      }
      
      if (rows.length > 0) {
        const { error } = await _db.from('preferences').upsert(rows, { onConflict: 'guest_name,poll_id' });
        if (error) throw error;
      }
    }
    
    if (key === 'wcd-writein') {
      const { error } = await _db
        .from('write_ins')
        .upsert({ poll_id: 'writein', text: value.text, updated_by: value.updatedBy }, { onConflict: 'poll_id' });
      if (error) throw error;
    }
    
    if (key === 'wcd-schedule') {
      // Clear existing schedule and insert new ones
      await _db.from('schedule_changes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      // Insert all schedule changes
      const rows = [];
      for (const [dayKey, blocks] of Object.entries(value)) {
        for (const [blockId, schedule] of Object.entries(blocks)) {
          rows.push({
            day_key: dayKey,
            block_id: blockId,
            start_minutes: schedule.start,
            duration: schedule.duration,
            manual: schedule.manual
          });
        }
      }
      
      if (rows.length > 0) {
        const { error } = await _db.from('schedule_changes').upsert(rows, { onConflict: 'day_key,block_id' });
        if (error) throw error;
      }
    }
    
    if (key === 'wcd-shopping') {
      // Get all shopping items first
      const { data: allItems, error: fetchError } = await _db
        .from('shopping_items')
        .select('item_id');
      if (fetchError) throw fetchError;
      
      // Update checked status for all items
      const rows = [];
      for (const item of allItems) {
        rows.push({
          item_id: item.item_id,
          checked: !!value[item.item_id]
        });
      }
      
      if (rows.length > 0) {
        const { error } = await _db.from('shopping_items').upsert(rows, { onConflict: 'item_id' });
        if (error) throw error;
      }
    }
  } catch(e) {
    console.warn('storage.set failed', key, e);
    ST.storageOk = false;
    document.getElementById('storage-banner').classList.add('visible');
  }
}
async function loadAllShared() {
  const TIMEOUT_MS = 5000;
  const withTimeout = (p) => Promise.race([p, new Promise(res => setTimeout(() => res(null), TIMEOUT_MS))]);
  try {
    const [votes, schedule, writein, shopping] = await Promise.all([
      withTimeout(storageGet('wcd-votes')),
      withTimeout(storageGet('wcd-schedule')),
      withTimeout(storageGet('wcd-writein')),
      withTimeout(storageGet('wcd-shopping')),
    ]);
    if (votes)    ST.votes    = votes;
    if (schedule) ST.schedule = schedule;
    if (writein)  ST.writein  = writein;
    if (shopping) ST.shopping = shopping;
  } catch(e) {
    console.warn('loadAllShared error', e);
    ST.storageOk = false;
    const banner = document.getElementById('storage-banner');
    if (banner) banner.classList.add('visible');
  }
}

// Subscribe to real-time changes from Supabase
function subscribeToChanges() {
  if (!_db) return;
  // Subscribe to preference changes
  _db
    .channel('preferences-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'preferences' }, async (payload) => {
      console.log('Preferences updated:', payload);
      await loadAllShared();
      // Rebuild visible calendars to show updated votes
      ['thu','fri','sat'].forEach(d=>{
        const el = document.getElementById('cal-'+d);
        if(el) buildCalendar(d, el);
      });
      renderShoppingList();
    })
    .subscribe();

  // Subscribe to write-in changes
  _db
    .channel('writein-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'write_ins' }, async (payload) => {
      console.log('Write-in updated:', payload);
      await loadAllShared();
      ['thu','fri','sat'].forEach(d=>{
        const el = document.getElementById('cal-'+d);
        if(el) buildCalendar(d, el);
      });
    })
    .subscribe();

  // Subscribe to schedule changes
  _db
    .channel('schedule-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'schedule_changes' }, async (payload) => {
      console.log('Schedule updated:', payload);
      await loadAllShared();
      ['thu','fri','sat'].forEach(d=>{
        const el = document.getElementById('cal-'+d);
        if(el) buildCalendar(d, el);
      });
    })
    .subscribe();

  // Subscribe to shopping list changes
  _db
    .channel('shopping-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'shopping_items' }, async (payload) => {
      console.log('Shopping list updated:', payload);
      await loadAllShared();
      renderShoppingList();
    })
    .subscribe();
}

/* ═══════════════════════════════════════════════════════════
   VOTING LOGIC
═══════════════════════════════════════════════════════════ */
function getVotes(pollId) { return ST.votes[pollId] || {}; }

function tallyPoll(pollId) {
  const poll = POLLS[pollId];
  const pVotes = getVotes(pollId);
  const scores = {};
  const firsts = {};
  const seconds = {};
  for (const opt of poll.options) { scores[opt]=0; firsts[opt]=0; seconds[opt]=0; }
  for (const guest of Object.values(pVotes)) {
    if (guest.first  && scores[guest.first]  !== undefined) { scores[guest.first]  += 2; firsts[guest.first]++; }
    if (guest.second && scores[guest.second] !== undefined) { scores[guest.second] += 1; seconds[guest.second]++; }
  }
  let maxScore = -1, winner = null;
  for (const opt of poll.options) { if (scores[opt] > maxScore) { maxScore=scores[opt]; winner=opt; } }
  // Tie detection
  const tied = poll.options.filter(o => scores[o]===maxScore && maxScore>0);
  let isTied = tied.length > 1;
  if (isTied) {
    // Tie-break by first-choice count
    const maxFirst = Math.max(...tied.map(o=>firsts[o]));
    const stillTied = tied.filter(o=>firsts[o]===maxFirst);
    if (stillTied.length===1) { winner=stillTied[0]; isTied=false; }
    else { winner=tied[0]; } // first listed wins in display
  }
  if (maxScore <= 0) winner = null;
  return { scores, firsts, seconds, winner, isTied, tied };
}

async function castVote(pollId, optionId, rank) {
  const name = ST.guestName;
  if (!name) return;
  if (!ST.votes[pollId]) ST.votes[pollId] = {};
  if (!ST.votes[pollId][name]) ST.votes[pollId][name] = { first:null, second:null };
  const g = ST.votes[pollId][name];
  if (rank === 1) {
    if (g.first === optionId) { g.first = null; }
    else if (g.second === optionId) { const old=g.first; g.first=optionId; g.second=old; }
    else { g.first = optionId; if (g.second===optionId) g.second=null; }
  } else {
    if (g.second === optionId) { g.second = null; }
    else if (g.first === optionId) { const old=g.second; g.second=optionId; g.first=old; }
    else { g.second = optionId; if (g.first===optionId) g.first=null; }
  }
  await storageSet('wcd-votes', ST.votes);
  // Update tallies in-place without rebuilding the calendar (preserves open panels)
  updateTalliesInPlace(pollId);
  renderShoppingList();
}

function getGuestVote(pollId) {
  const name = ST.guestName;
  if (!name || !ST.votes[pollId]) return {first:null,second:null};
  return ST.votes[pollId][name] || {first:null,second:null};
}

/* ═══════════════════════════════════════════════════════════
   AUTO-PLACEMENT ALGORITHM
═══════════════════════════════════════════════════════════ */
// Returns minutes from midnight (10am=600, noon=720, etc.) → minutes from 10AM for positioning
function minFromMidnight(h,m=0){ return h*60+m; }
function minFrom10(h,m=0){ return minFromMidnight(h,m)-600; }

function getHourlyWeather(dayKey){
  return hourlyWeather(dayKey); // array of {hour,temp,precip}
}
function weatherAt(dayKey,minutesFrom10){
  const hw=getHourlyWeather(dayKey);
  const absMin=minutesFrom10+600;
  const h=Math.floor(absMin/60);
  const entry=hw.find(x=>x.hour===h)||hw[hw.length-1];
  return entry;
}
function avgWeatherOver(dayKey,startMin,durationMin){
  const hw=getHourlyWeather(dayKey);
  let temps=0,precips=0,count=0;
  const startAbs=startMin+600;
  const endAbs=startAbs+durationMin;
  for(const w of hw){
    const hAbs=w.hour*60;
    if(hAbs>=startAbs-30&&hAbs<=endAbs+30){temps+=w.temp;precips+=w.precip;count++;}
  }
  if(!count)return{temp:75,precip:20};
  return{temp:temps/count,precip:precips/count};
}

function scoreWindow(dayKey,actType,startMin,durationMin){
  const{temp,precip}=avgWeatherOver(dayKey,startMin,durationMin);
  if(actType==='hike')    return -(precip*2+Math.max(0,temp-82));
  if(actType==='swim')    return temp-precip*1.5;
  return -precip; // flexible
}

function bestStart(dayKey,actType,rangeStartH,rangeEndH,durationMin){
  const rangeStart=minFrom10(rangeStartH);
  const rangeEnd=minFrom10(rangeEndH);
  let best=rangeStart,bestScore=-Infinity;
  for(let s=rangeStart;s<=rangeEnd-durationMin;s+=15){
    const score=scoreWindow(dayKey,actType,s,durationMin);
    if(score>bestScore){bestScore=score;best=s;}
  }
  return best;
}

function autoPlaceDay(dayKey){
  const schedule = {};
  // Helper to check overlap and nudge
  const placed = [];
  function noOverlap(start,dur){
    for(const p of placed){
      if(start<p.end&&start+dur>p.start)return false;
    }
    return true;
  }
  function placeBlock(id,start,dur){
    let s=start;
    // Nudge if overlapping (up to 60 min shift)
    for(let attempt=0;attempt<8;attempt++){
      if(noOverlap(s,dur)){placed.push({id,start:s,end:s+dur});schedule[id]={start:s,duration:dur};return s;}
      s+=15;
    }
    // fallback
    placed.push({id,start,end:start+dur});
    schedule[id]={start,duration:dur};
    return start;
  }

  if(dayKey==='thu'){
    // Arrival 2PM–4PM = minFrom10(14)=240
    placeBlock('arrival',minFrom10(14),120);
    // Dinner 6:30PM = minFrom10(18,30)=510
    placeBlock('thu-dinner',minFrom10(20,0),90);
    // Fire-pit snack 9:45PM = minFrom10(21,45)=705
    placeBlock('thu-snack',minFrom10(21,45),45);
    // Wind-down 10:30PM
    placeBlock('thu-winddown',minFrom10(22,30),60);
  }

  if(dayKey==='fri'){
    // Breakfast 10AM
    placeBlock('fri-breakfast',minFrom10(10),60);
    // Physical activity
    const physWinner=tallyPoll('poll-fri-physical').winner||'fri-kaaterskill';
    const physAct=ACTIVITIES[physWinner];
    const physStart=bestStart(dayKey,physAct.type,10,16,physAct.durationMin);
    placeBlock('fri-physical',physStart,physAct.durationMin);
    // Freshen up after physical
    const physEnd=physStart+physAct.durationMin;
    placeBlock('fri-freshen',physEnd,60);
    // Lunch after freshen up, target 1-3PM range
    const lunchMin=Math.max(physEnd+60,minFrom10(13));
    placeBlock('fri-lunch',lunchMin,60);
    // Leisure
    const leisureWinner=tallyPoll('poll-fri-leisure').winner||'fri-brewery';
    const leisureAct=ACTIVITIES[leisureWinner];
    const leisureStart=Math.max(lunchMin+60,minFrom10(15));
    placeBlock('fri-leisure',Math.min(leisureStart,minFrom10(18)),leisureAct.durationMin);
    // Dinner 6:30PM
    placeBlock('fri-dinner',minFrom10(18,30),90);
    // Evening walk (optional, after dinner)
    const ewWinner=tallyPoll('poll-fri-evening-walk').winner;
    if(ewWinner){
      const ewAct=ACTIVITIES[ewWinner];
      const ewStart=bestStart(dayKey,ewAct.type,19,21,ewAct.durationMin);
      placeBlock('fri-evening-walk',ewStart,ewAct.durationMin);
    }
    // Backgammon Tournament 8PM fixed
    placeBlock('fri-backgammon',minFrom10(20),90);
    // Snack 9:30PM
    placeBlock('fri-snack',minFrom10(21,30),45);
    // Wind-down 10:30PM
    placeBlock('fri-winddown',minFrom10(22,30),60);
  }

  if(dayKey==='sat'){
    // Breakfast 10AM
    placeBlock('sat-breakfast',minFrom10(10),60);
    // Physical activity
    const physWinner=tallyPoll('poll-sat-physical').winner||'sat-arboretum';
    const physAct=ACTIVITIES[physWinner];
    const physStart=bestStart(dayKey,physAct.type,10,16,physAct.durationMin);
    placeBlock('sat-physical',physStart,physAct.durationMin);
    // Freshen up
    const physEnd=physStart+physAct.durationMin;
    placeBlock('sat-freshen',physEnd,60);
    // Lunch
    const lunchMin=Math.max(physEnd+60,minFrom10(13));
    placeBlock('sat-lunch',lunchMin,60);
    // Leisure
    const leisureWinner=tallyPoll('poll-sat-leisure').winner||'sat-brewery';
    const leisureAct=ACTIVITIES[leisureWinner];
    const leisureStart=Math.max(lunchMin+60,minFrom10(15));
    placeBlock('sat-leisure',Math.min(leisureStart,minFrom10(18)),leisureAct.durationMin);
    // Dinner 6:30PM
    placeBlock('sat-dinner',minFrom10(18,30),90);
    // Snack 8:30PM
    placeBlock('sat-snack',minFrom10(20,30),45);
    // Wind-down 10PM
    placeBlock('sat-winddown',minFrom10(22),60);
  }

  return schedule;
}

function getSchedule(dayKey){
  const stored = ST.schedule[dayKey]||{};
  const auto   = autoPlaceDay(dayKey);
  const merged = {...auto};
  for(const[id,val]of Object.entries(stored)){
    if(val.manual) merged[id]={...merged[id],...val};
  }
  return merged;
}
/* ═══════════════════════════════════════════════════════════
   RENDERING HELPERS
═══════════════════════════════════════════════════════════ */
const CAL_MINUTES = 840; // 10AM–12AM
const HOURS_LIST  = [10,11,12,13,14,15,16,17,18,19,20,21,22,23,24];

function fmtHour(h){ if(h===0||h===24)return'12 AM'; if(h<12)return h+' AM'; if(h===12)return'12 PM'; return(h-12)+' PM'; }
function minToTime(m){ // m = minutes from 10AM
  const abs=m+600; const h=Math.floor(abs/60)%24; const min=abs%60;
  const hr=h===0?12:(h>12?h-12:h); const ampm=h<12||h===0?'AM':'PM';
  return `${hr}:${min.toString().padStart(2,'0')} ${ampm}`;
}
function fmtRating(r, rev, name){
  if(r===null && rev===null) return name==='diy-kale-caesar'?'house recipe':name==='hershey-smores'?'community classic':'chef\'s recipe';
  if(r===null) return `${rev} ratings`;
  const stars = r==='5'||r===5 ? '5★' : `${r}★`;
  if(rev===null) return stars;
  const k = rev>=1000 ? `~${(rev/1000).toFixed(rev>=10000?0:1)}k` : rev;
  return `${stars} · ${k} ratings`;
}

function buildWeatherSVG(dayKey, totalH){
  const hw = getHourlyWeather(dayKey);
  const showPrecip = dayKey !== 'sat';

  // Y: hour → percent of calendar height (10AM=0%, midnight=100%)
  function hToY(h){ return ((h*60-600)/840)*100; }

  // Temp curve: mapped to right 55%–95% of width so it doesn't clash with blocks
  const tMin = Math.min(...hw.map(x=>x.temp))-3;
  const tMax = Math.max(...hw.map(x=>x.temp))+3;
  function tToX(t){ return 55+(t-tMin)/(tMax-tMin)*38; }

  // Build smooth cubic bezier path for temp
  const pts = hw.map(w=>({ x: tToX(w.temp), y: hToY(w.hour) }));
  let tempPath = `M ${pts[0].x.toFixed(2)},${pts[0].y.toFixed(2)}`;
  for(let i=1;i<pts.length;i++){
    const cp1y = pts[i-1].y + (pts[i].y-pts[i-1].y)*0.4;
    const cp2y = pts[i].y   - (pts[i].y-pts[i-1].y)*0.4;
    tempPath += ` C ${pts[i-1].x.toFixed(2)},${cp1y.toFixed(2)} ${pts[i].x.toFixed(2)},${cp2y.toFixed(2)} ${pts[i].x.toFixed(2)},${pts[i].y.toFixed(2)}`;
  }
  // Area fill under temp curve (down to right edge)
  const tempArea = tempPath
    + ` L 95,${pts[pts.length-1].y.toFixed(2)} L 95,${pts[0].y.toFixed(2)} Z`;

  // Precip bars: left-anchored horizontal bands, width = precip% * 0.28 of total width
  let precipBars = '';
  if(showPrecip){
    for(let i=0;i<hw.length-1;i++){
      const y1 = hToY(hw[i].hour);
      const y2 = hToY(hw[i+1].hour);
      const w  = (hw[i].precip/100)*28;
      if(w>0.2){
        precipBars += `<rect x="0" y="${y1.toFixed(2)}" width="${w.toFixed(2)}" height="${(y2-y1+0.1).toFixed(2)}" fill="rgba(60,107,120,0.18)"/>`;
      }
    }
    // Precip stroke line on right edge of bars
    const precipLinePts = hw.map(w=>`${((w.precip/100)*28).toFixed(2)},${hToY(w.hour).toFixed(2)}`).join(' ');
    precipBars += `<polyline points="${precipLinePts}" fill="none" stroke="rgba(60,107,120,0.45)" stroke-width="0.5" vector-effect="non-scaling-stroke"/>`;
  }

  // Temp labels at peak and trough
  const peakW = hw.reduce((a,b)=>a.temp>b.temp?a:b);
  const troughW = hw.reduce((a,b)=>a.temp<b.temp?a:b);

  return `<svg class="cal-weather-svg" viewBox="0 0 100 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="tempgrad-${dayKey}" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="rgba(198,138,46,0)" />
        <stop offset="100%" stop-color="rgba(198,138,46,0.12)" />
      </linearGradient>
    </defs>
    ${precipBars}
    <path d="${tempArea}" fill="url(#tempgrad-${dayKey})" stroke="none"/>
    <path d="${tempPath}" fill="none" stroke="rgba(198,138,46,0.55)" stroke-width="0.7" vector-effect="non-scaling-stroke" stroke-linejoin="round"/>
  </svg>`;
}

function buildOptionMeta(optId, pollType){
  if(optId==='_eatout') return '<span style="font-style:italic;color:var(--ink2)">Eat out instead — see top picks →</span>';
  if(optId==='_writein'){
    const txt=ST.writein.text||'';
    return `<span style="color:var(--ink1)">${txt?(txt.length>60?txt.slice(0,60)+'…':txt):'Cook\'s choice — type a dish'}</span>`;
  }
  const a=ACTIVITIES[optId];
  if(a && a.type==='drink'){
    return `<span class="opt-addr">${a.desc}</span>`;
  }
  if(a && a.type==='restaurant'){
    const stars=a.rating?`${a.rating}★`:'';
    const reviews=a.reviews?`/${a.reviews}`:'';
    const ratingStr=stars?`${stars}${reviews} · `:'';
    return `<span style="color:var(--ink2)">${a.price ? a.price+' · ':''} ${a.addr}${ratingStr||a.tip?` · ${ratingStr}${a.tip}`:''}</span>`;
  }
  if(pollType==='activity'){
    if(!a)return optId;
    const dur = a.durationMin ? `<span class="opt-duration">⏱ ${a.durationMin >= 60 ? (a.durationMin/60 % 1 === 0 ? a.durationMin/60 + ' hr' : (Math.floor(a.durationMin/60) + ' hr ' + (a.durationMin%60) + ' min')) : a.durationMin + ' min'}</span>` : '';
    const addr = a.addr ? `<span class="opt-addr">${a.addr}</span>` : '';
    const tip  = a.tip  ? `<span class="opt-tip">${a.tip}</span>`   : '';
    return [dur, addr, tip].filter(Boolean).join('<span class="opt-sep"> · </span>');
  }
  const r=RECIPES[optId];
  if(!r)return optId;
  const ratingStr=fmtRating(r.rating,r.reviews,optId);
  return `<span>${r.source} · ${ratingStr}</span>`;}

function buildVotePanel(pollId){
  const poll=POLLS[pollId];
  const tally=tallyPoll(pollId);
  const gVote=getGuestVote(pollId);
  const hasName=!!ST.guestName;

  // Determine whether this poll has both dine-in and dine-out options
  const isDineOut = id => id==='_eatout' || ACTIVITIES[id]?.type==='restaurant';
  const hasMix = poll.type==='meal' && poll.options.some(id=>!isDineOut(id)&&id!=='_writein') && poll.options.some(isDineOut);
  let html='<div class="block-vote-panel" id="vp-'+pollId+'">';
  let lastSection = null; // 'in' | 'out'
  for(const optId of poll.options){
    // Insert section headers for meal polls with mixed options
    if(hasMix){
      const section = isDineOut(optId) ? 'out' : 'in';
      if(section !== lastSection){
        lastSection = section;
        const label = section==='in' ? 'Cook at Home' : 'Dine Out';
        html += `<div class="vote-section-header">${label}</div>`;
      }
    }

    const isWinner=tally.winner===optId&&tally.winner!==null;
    const isTied=tally.isTied&&tally.tied&&tally.tied.includes(optId);
    const score=tally.scores[optId]||0;
    const f=tally.firsts[optId]||0;
    const s=tally.seconds[optId]||0;
    const pts=score;

    let optName='';
    if(optId==='_eatout')       optName='Eat Out Instead';
    else if(optId==='_writein') optName=ST.writein.text||(ST.writein.text===''?'Write-In Option':'');
    else if(poll.type==='activity') optName=ACTIVITIES[optId]?.name||optId;
    else {
      // Could be a recipe OR a restaurant eat-out option on a meal poll
      optName=RECIPES[optId]?.name || ACTIVITIES[optId]?.name || optId;
    }

    const veg=(poll.type==='meal'&&optId!=='_eatout'&&optId!=='_writein'&&RECIPES[optId]?.veg)?'<span class="badge-veg">Vegetarian</span>':'';
    const note=(poll.type==='meal'&&optId!=='_eatout'&&optId!=='_writein'&&RECIPES[optId]?.note)?`<div class="vote-option-tip">${RECIPES[optId].note}</div>`:'';
    const sides=(poll.type==='meal'&&optId!=='_eatout'&&optId!=='_writein'&&RECIPES[optId]?.sides)?`<div class="vote-option-sides">Sides: ${RECIPES[optId].sides}</div>`:'';
    const actTip=(poll.type==='activity'&&ACTIVITIES[optId]?.tip)?`<div class="vote-option-tip">${ACTIVITIES[optId].tip}</div>`:'';

    let writeinField='';
    if(optId==='_writein'){
      writeinField=`<input class="writein-input" id="writein-input-${pollId}" type="text" maxlength="200" placeholder="Cook's choice — type a dish" value="${escHtml(ST.writein.text||'')}" oninput="onWriteinChange(this.value,'${pollId}').catch(e=>console.error('Write-in save failed',e))">
      <div class="writein-saved" id="writein-saved-${pollId}">Saved ✓</div>`;
    }

    html+=`<div class="vote-option-row${isWinner?' is-winner':''}" id="vor-${pollId}-${optId.replace(/[^a-z0-9]/g,'_')}">
      <div class="vote-option-content">
        <div class="vote-option-name">
          ${escHtml(optName)}
          ${isWinner?'<span class="badge-plan">THE PLAN</span>':''}
          ${isTied?'<span class="tied-label">TIED</span>':''}
          ${veg}
        </div>
        <div class="vote-option-meta">${buildOptionMeta(optId,poll.type)}</div>
        ${sides}${note}${actTip}${writeinField}
        <div class="vote-tally" aria-live="polite">● ${f} &nbsp;○ ${s} &nbsp;· <span class="pts">${pts} pts</span></div>
      </div>
      <div class="vote-chips">
        <button class="chip ${gVote.first===optId?'selected-1':''}" 
          ${!hasName?'disabled title="Enter your name above to vote"':''}
          onclick="castVote('${pollId}','${optId}',1).catch(e=>console.error('Vote save failed',e))" 
          aria-pressed="${gVote.first===optId}"
          aria-label="Vote 1st choice for ${escHtml(optName)}">1st</button>
        <button class="chip ${gVote.second===optId?'selected-2':''}" 
          ${!hasName?'disabled title="Enter your name above to vote"':''}
          onclick="castVote('${pollId}','${optId}',2).catch(e=>console.error('Vote save failed',e))"
          aria-pressed="${gVote.second===optId}"
          aria-label="Vote 2nd choice for ${escHtml(optName)}">2nd</button>
      </div>
    </div>`;
  }
  html+='</div>';
  return html;
}

function buildEatOutCard(mealType){
  const list=RESTAURANTS[mealType]||RESTAURANTS.dinner;
  let html='<div class="restaurant-list">';
  for(const r of list){
    html+=`<div class="restaurant-item">
      <span class="restaurant-name">${escHtml(r.name)}</span> <span class="restaurant-price">${r.price}</span>
      <div class="restaurant-addr">${escHtml(r.addr)}</div>
      <div class="restaurant-why">${escHtml(r.why)}</div>
    </div>`;
  }
  html+=`<div class="splurge-note">${escHtml(SPLURGE)}</div>`;
  html+='</div>';
  return html;
}

function escHtml(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

/* Block definitions per day */
function dayBlocks(dayKey){
  const s=getSchedule(dayKey);
  const blocks=[];

  const addBlock=(id,title,type,pollId,start,dur,sub,mealType,activityType)=>{
    if(s[id]){start=s[id].start;dur=s[id].duration;}
    const manual=ST.schedule[dayKey]&&ST.schedule[dayKey][id]&&ST.schedule[dayKey][id].manual;
    blocks.push({id,title,type,pollId,start,dur,sub,mealType,activityType,manual});
  };

  if(dayKey==='thu'){
    addBlock('arrival','Arrival & Unpack','fixed',null,minFrom10(14),120,'Get settled, claim rooms','','');
    // Dinner
    const dWin=tallyPoll('poll-thu-dinner').winner;
    const dTitle=dWin&&dWin!=='_eatout'&&dWin!=='_writein'?RECIPES[dWin]?.name:dWin==='_eatout'?'Dinner':dWin==='_writein'?(ST.writein.text||'Cook\'s Choice'):'Dinner';
    addBlock('thu-dinner',dTitle,'meal','poll-thu-dinner',minFrom10(20,0),90,'','dinner','');
    const sWin=tallyPoll('poll-thu-snack').winner;
    const sTitle=sWin?RECIPES[sWin]?.name:'Fire-Pit Snack';
    addBlock('thu-snack',sTitle,'snack','poll-thu-snack',minFrom10(21,45),45,'Fire pit','','');
    addBlock('thu-winddown','Evening Wind-Down','personal',null,minFrom10(22,30),60,'','','');
  }
  if(dayKey==='fri'){
    const bWin=tallyPoll('poll-fri-breakfast').winner;
    const bTitle=bWin&&bWin!=='_eatout'?RECIPES[bWin]?.name:bWin==='_eatout'?'Breakfast':'Breakfast';
    addBlock('fri-breakfast',bTitle,'meal','poll-fri-breakfast',minFrom10(10),60,'','breakfast','');
    const phWin=tallyPoll('poll-fri-physical').winner;
    const phAct=ACTIVITIES[phWin]||ACTIVITIES['fri-kaaterskill'];
    addBlock('fri-physical',phWin?phAct.name:'Friday Activity','activity','poll-fri-physical',minFrom10(10,30),phAct.durationMin,phAct.addr,'',phAct.type);
    addBlock('fri-freshen','Drive Back + Freshen Up','personal',null,0,60,'','','');
    const lWin=tallyPoll('poll-fri-lunch').winner;
    const lTitle=lWin&&lWin!=='_eatout'?RECIPES[lWin]?.name:lWin==='_eatout'?'Lunch':'Lunch';
    addBlock('fri-lunch',lTitle,'meal','poll-fri-lunch',minFrom10(13,30),60,'','lunch','');
    const leWin=tallyPoll('poll-fri-leisure').winner;
    const leAct=ACTIVITIES[leWin]||ACTIVITIES['fri-lasting-joy'];
    addBlock('fri-leisure',leWin?leAct.name:'Leisure','activity','poll-fri-leisure',minFrom10(15),leAct.durationMin,leAct.addr,'','flexible');
    const dWin=tallyPoll('poll-fri-dinner').winner;
    const dTitle=dWin&&dWin!=='_eatout'?RECIPES[dWin]?.name:dWin==='_eatout'?'Dinner':'Dinner';
    addBlock('fri-dinner',dTitle,'meal','poll-fri-dinner',minFrom10(18,30),90,'','dinner','');
    addBlock('fri-backgammon','🎲 Backgammon Tournament','fixed',null,minFrom10(20),90,'Winner cooks nothing Saturday','','');
    const sWin=tallyPoll('poll-fri-snack').winner;
    const sTitle=sWin?RECIPES[sWin]?.name:'Fire-Pit Snack';
    addBlock('fri-snack',sTitle,'snack','poll-fri-snack',minFrom10(21,30),45,'Fire pit','','');
    addBlock('fri-winddown','Evening Wind-Down','personal',null,minFrom10(22,30),60,'','','');
  }
  if(dayKey==='sat'){
    const bWin=tallyPoll('poll-sat-breakfast').winner;
    const bTitle=bWin&&bWin!=='_eatout'?RECIPES[bWin]?.name:bWin==='_eatout'?'Breakfast':'Breakfast';
    addBlock('sat-breakfast',bTitle,'meal','poll-sat-breakfast',minFrom10(10),60,'','breakfast','');
    const phWin=tallyPoll('poll-sat-physical').winner;
    const phAct=ACTIVITIES[phWin]||ACTIVITIES['sat-arboretum'];
    addBlock('sat-physical',phWin?phAct.name:'Saturday Activity','activity','poll-sat-physical',minFrom10(10,30),phAct.durationMin,phAct.addr,'',phAct.type);
    addBlock('sat-freshen','Drive Back + Freshen Up','personal',null,0,60,'','','');
    const lWin=tallyPoll('poll-sat-lunch').winner;
    const lTitle=lWin&&lWin!=='_eatout'?RECIPES[lWin]?.name:lWin==='_eatout'?'Lunch':'Lunch';
    addBlock('sat-lunch',lTitle,'meal','poll-sat-lunch',minFrom10(13,30),60,'','lunch','');
    const leWin=tallyPoll('poll-sat-leisure').winner;
    const leAct=ACTIVITIES[leWin]||ACTIVITIES['sat-lasting-joy'];
    addBlock('sat-leisure',leWin?leAct.name:'Leisure','activity','poll-sat-leisure',minFrom10(15),leAct.durationMin,leAct.addr,'','flexible');
    const dWin=tallyPoll('poll-sat-dinner').winner;
    const dTitle=dWin&&dWin!=='_eatout'?RECIPES[dWin]?.name:dWin==='_eatout'?'Dinner':'Dinner';
    addBlock('sat-dinner',dTitle,'meal','poll-sat-dinner',minFrom10(18,30),90,'','dinner','');
    const sWin=tallyPoll('poll-sat-snack').winner;
    const sTitle=sWin?RECIPES[sWin]?.name:'Fire-Pit Snack';
    addBlock('sat-snack',sTitle,'snack','poll-sat-snack',minFrom10(20,30),45,'Fire pit','','');
    addBlock('sat-winddown','Evening Wind-Down','personal',null,minFrom10(22),60,'','','');
  }
  // Apply schedule overrides for fresh/physical blocks
  for(const b of blocks){
    if(ST.schedule[dayKey]&&ST.schedule[dayKey][b.id]&&ST.schedule[dayKey][b.id].manual){
      b.start=ST.schedule[dayKey][b.id].start;
      b.manual=true;
    }
  }
  // Fix freshen-up to be after physical
  for(const b of blocks){
    if(b.id===dayKey+'-freshen'){
      const phys=blocks.find(x=>x.id===dayKey+'-physical');
      if(phys&&!b.manual) b.start=phys.start+phys.dur;
    }
  }
  return blocks;
}

function buildCalendar(dayKey, containerEl){
  const blocks=dayBlocks(dayKey);
  const rowH=window.innerWidth<=768?48:56;
  const totalH=CAL_MINUTES/60*rowH; // 14 hours
  const CAL_PAD_TOP = 10; // matches padding-top on .cal-outer

  // Axis + gridlines
  let axisHtml='<div class="cal-axis">';
  for(const h of HOURS_LIST){
    const top=((h-10)/14)*totalH + CAL_PAD_TOP;
    axisHtml+=`<div class="cal-axis-label" style="top:${top}px">${fmtHour(h)}</div>`;
    axisHtml+=`<div class="cal-axis-tick" style="top:${top}px"></div>`;
  }
  axisHtml+='</div>';

  let gridHtml='<div class="cal-grid">';
  for(const h of HOURS_LIST){
    const top=((h-10)/14)*totalH + CAL_PAD_TOP;
    const isNoon = h===12;
    gridHtml+=`<div class="cal-gridline${isNoon?' noon':''}" style="top:${top}px"></div>`;
  }
  gridHtml+='</div>';

  const weatherSVG=buildWeatherSVG(dayKey,totalH);

  // Weather summary
  const hw=getHourlyWeather(dayKey);
  const wd=WEATHER[dayKey];
  document.getElementById('weather-'+dayKey).textContent=
    `High ${wd.high}°F · ${wd.precip}% precip chance`;

  // Detect overlaps
  const sorted=[...blocks].sort((a,b)=>a.start-b.start);
  const cols=[];
  for(const b of sorted){
    let placed=false;
    for(let c=0;c<cols.length;c++){
      const last=cols[c][cols[c].length-1];
      if(last.start+last.dur<=b.start){cols[c].push(b);placed=true;break;}
    }
    if(!placed)cols.push([b]);
  }
  const blockCol={};
  const totalCols=cols.length||1;
  cols.forEach((col,ci)=>col.forEach(b=>blockCol[b.id]=ci));

  let blocksHtml='<div class="cal-blocks" id="calblocks-'+dayKey+'" style="position:absolute;left:56px;right:8px;top:'+CAL_PAD_TOP+'px;bottom:0;">';
  for(const b of blocks){
    const top=(b.start/CAL_MINUTES)*totalH;
    const height=Math.max(40,(b.dur/CAL_MINUTES)*totalH);
    const ci=blockCol[b.id]||0;
    const colW=100/totalCols;
    const leftPct=ci*colW;
    const w=`calc(${colW}% - 4px)`;
    const weather=weatherAt(dayKey,b.start);
    const chipTxt=`${weather.temp}° · ${weather.precip}% rain`;
    const winnerBadge=(b.pollId&&tallyPoll(b.pollId).winner)?'🏆 ':'';

    // Build inner content
    let inner=`<div class="block-inner">
      <div class="block-header">
        <span class="block-title">${winnerBadge}${escHtml(b.title)}</span>
        ${b.pollId?`<button class="block-vote-toggle" onclick="openVoteModal('${b.pollId}')" aria-haspopup="dialog"><span class="vt-icon-circle"><svg width="6" height="6" viewBox="0 0 8 8" fill="currentColor"><polygon points="4,5 1,2 7,2"/></svg></span>Vote</button>`:''}
        ${b.type!=='fixed'?`<span class="block-weather-chip">${chipTxt}</span>`:''}
      </div>
      ${b.sub?`<div class="block-sub">${escHtml(b.sub)}</div>`:''}`;
    inner+='</div>'; // block-inner

    blocksHtml+=`<div class="cal-block type-${b.type}" 
      id="cb-${dayKey}-${b.id}"
      data-day="${dayKey}" data-block="${b.id}" data-start="${b.start}" data-dur="${b.dur}"
      style="position:absolute;top:${top}px;height:${height}px;left:calc(${leftPct}% + 2px);width:${w};z-index:10;"
      tabindex="0" role="button"
      aria-label="${escHtml(b.title)}, ${minToTime(b.start)}–${minToTime(b.start+b.dur)}, arrow keys to move"
      onkeydown="onBlockKeydown(event,'${dayKey}','${b.id}')">
      ${inner}
    </div>`;
  }
  blocksHtml+='</div>';

  containerEl.style.height=(totalH + CAL_PAD_TOP)+'px';
  containerEl.style.position='relative';
  containerEl.innerHTML=axisHtml+gridHtml+weatherSVG+blocksHtml;

  // Attach drag handlers
  for(const b of blocks){
    const el=document.getElementById(`cb-${dayKey}-${b.id}`);
    if(el) attachDrag(el,dayKey,b.id);
  }
}

/* ═══════════════════════════════════════════════════════════
   VOTE MODAL
═══════════════════════════════════════════════════════════ */
let _openPollId = null;

function openVoteModal(pollId) {
  const poll = POLLS[pollId];
  if (!poll) return;
  _openPollId = pollId;

  const modal    = document.getElementById('vote-modal');
  const titleEl  = document.getElementById('vmodal-title');
  const bodyEl   = document.getElementById('vmodal-body');

  titleEl.textContent = poll.label;

  // Build body: name hint if needed, then vote rows
  const hasName = !!ST.guestName;
  let html = '';
  if (!hasName) {
    html += `<div class="vmodal-name-hint">Enter your name in the header to cast votes.</div>`;
  }
  html += buildVotePanel(pollId).replace(/<div class="block-vote-panel[^"]*"[^>]*>/,'').replace(/<\/div>\s*$/,'');

  // If meal and winner is eat-out, append restaurant card
  if (poll.type === 'meal') {
    const winner = tallyPoll(pollId).winner;
    if (winner === '_eatout') {
      const mealType = pollId.includes('breakfast') ? 'breakfast' : pollId.includes('lunch') ? 'lunch' : 'dinner';
      html += buildEatOutCard(mealType);
    }
  }

  bodyEl.innerHTML = html;

  modal.style.display = 'flex';
  modal.classList.remove('exiting');
  modal.classList.add('entering');
  document.body.style.overflow = 'hidden';

  // Focus the modal for keyboard users
  setTimeout(() => modal.querySelector('.vmodal-close')?.focus(), 50);
}

function closeVoteModal() {
  const modal = document.getElementById('vote-modal');
  modal.classList.remove('entering');
  modal.classList.add('exiting');
  document.body.style.overflow = '';
  setTimeout(() => {
    modal.style.display = 'none';
    modal.classList.remove('exiting');
    _openPollId = null;
  }, 160);
}

// Close on Escape
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && _openPollId) closeVoteModal();
});

function toggleVotePanel(pollId, btn) {
  // Legacy — now opens the modal instead
  openVoteModal(pollId);
}

function renderAllPolls(){
  // Re-render vote panels that are currently open
  document.querySelectorAll('.block-vote-panel.open').forEach(panel=>{
    const pollId=panel.id.replace('vp-','');
    if(!POLLS[pollId])return;
    panel.outerHTML=buildVotePanel(pollId).replace('class="block-vote-panel"','class="block-vote-panel open"');
    // Actually we need to re-render entire block; do it by day
  });
  // Simpler: re-render all calendars
  ['thu','fri','sat'].forEach(d=>{
    const container=document.getElementById('cal-'+d);
    if(container&&container.children.length>0) buildCalendar(d,container);
  });
}

function updateTalliesInPlace(pollId) {
  const poll = POLLS[pollId];
  if (!poll) return;
  const tally = tallyPoll(pollId);
  const gVote = getGuestVote(pollId);
  const hasName = !!ST.guestName;

  // Determine search scope — check open modal/wizard body first, then full doc
  const scope = (_openPollId === pollId)
    ? (document.getElementById('vmodal-body') || document.getElementById('wizard-body') || document)
    : document;
  if (!scope) return;

  for (const optId of poll.options) {
    const safeId = optId.replace(/[^a-z0-9]/g, '_');
    const row = scope.querySelector(`#vor-${pollId}-${safeId}`) || document.getElementById(`vor-${pollId}-${safeId}`);
    if (!row) continue;

    row.classList.toggle('is-winner', tally.winner === optId && tally.winner !== null);

    const tallyEl = row.querySelector('.vote-tally');
    if (tallyEl) {
      const f = tally.firsts[optId] || 0;
      const s = tally.seconds[optId] || 0;
      const pts = tally.scores[optId] || 0;
      tallyEl.innerHTML = `● ${f} &nbsp;○ ${s} &nbsp;· <span class="pts">${pts} pts</span>`;
    }

    const chips = row.querySelectorAll('.chip');
    if (chips[0]) {
      chips[0].classList.toggle('selected-1', gVote.first === optId);
      chips[0].setAttribute('aria-pressed', gVote.first === optId);
      chips[0].disabled = !hasName;
    }
    if (chips[1]) {
      chips[1].classList.toggle('selected-2', gVote.second === optId);
      chips[1].setAttribute('aria-pressed', gVote.second === optId);
      chips[1].disabled = !hasName;
    }

    const nameLine = row.querySelector('.vote-option-name');
    if (nameLine) {
      nameLine.querySelector('.badge-plan')?.remove();
      nameLine.querySelector('.tied-label')?.remove();
      if (tally.winner === optId && tally.winner !== null) {
        const b = document.createElement('span');
        b.className = 'badge-plan'; b.textContent = 'THE PLAN';
        nameLine.appendChild(b);
      } else if (tally.isTied && tally.tied?.includes(optId)) {
        const t = document.createElement('span');
        t.className = 'tied-label'; t.textContent = 'TIED';
        nameLine.appendChild(t);
      }
    }
  }

  // Update block title on the calendar
  document.querySelectorAll('.cal-block').forEach(blk => {
    if (blk.innerHTML.includes(`openVoteModal('${pollId}'`) || blk.innerHTML.includes(`toggleVotePanel('${pollId}'`)) {
      const titleEl = blk.querySelector('.block-title');
      if (titleEl) {
        const winner = tally.winner;
        let newTitle = '';
        if (!winner) newTitle = poll.label;
        else if (winner === '_eatout') newTitle = poll.label.split(' ')[0];
        else if (winner === '_writein') newTitle = ST.writein.text || "Cook's Choice";
        else if (poll.type === 'activity') newTitle = '🏆 ' + (ACTIVITIES[winner]?.name || winner);
        else newTitle = '🏆 ' + (RECIPES[winner]?.name || winner);
        if (newTitle) titleEl.textContent = newTitle;
      }
    }
  });
}

function updateCalendarWinners(){
  ['thu','fri','sat'].forEach(d=>{
    const container=document.getElementById('cal-'+d);
    if(container&&container.children.length>0) buildCalendar(d,container);
  });
  renderShoppingList();
}
/* ═══════════════════════════════════════════════════════════
   DRAG & DROP — Pointer Events, 15-min snap, touch-friendly
═══════════════════════════════════════════════════════════ */
let _dragState = null;
const tooltip = ()=>document.getElementById('drag-tooltip');

function attachDrag(el, dayKey, blockId){
  el.addEventListener('pointerdown', e=>{
    if(e.target.closest('.block-vote-toggle,.block-vote-panel,.writein-input,.chip,.restaurant-list,a'))return;
    e.preventDefault();
    el.setPointerCapture(e.pointerId);
    const rect=el.getBoundingClientRect();
    const calEl=document.getElementById('cal-'+dayKey);
    const calRect=calEl.getBoundingClientRect();
    const rowH=window.innerWidth<=768?48:56;
    const totalH=CAL_MINUTES/60*rowH;
    _dragState={
      el, dayKey, blockId,
      startY: e.clientY,
      origTop: parseFloat(el.style.top)||0,
      calTop: calRect.top,
      calH: totalH,
      dur: parseInt(el.dataset.dur),
      startMin: parseInt(el.dataset.start),
    };
    el.classList.add('dragging');
    el.style.zIndex=200;
    tooltip().style.display='block';
  });

  el.addEventListener('pointermove', e=>{
    if(!_dragState||_dragState.el!==el)return;
    const dy=e.clientY-_dragState.startY;
    const minsMoved=Math.round((dy/_dragState.calH)*CAL_MINUTES/15)*15;
    let newStart=_dragState.startMin+minsMoved;
    newStart=Math.max(0,Math.min(CAL_MINUTES-_dragState.dur,newStart));
    // Snap to 15-min
    newStart=Math.round(newStart/15)*15;
    const newTop=(_dragState.origTop+dy/_dragState.calH*_dragState.calH);
    const clampedTop=(newStart/CAL_MINUTES)*_dragState.calH;
    el.style.top=clampedTop+'px';
    _dragState.currentStart=newStart;
    // Tooltip
    const tt=tooltip();
    tt.textContent=`${minToTime(newStart)} – ${minToTime(newStart+_dragState.dur)}`;
    tt.style.left=(e.clientX+12)+'px';
    tt.style.top=(e.clientY-8)+'px';
  });

  el.addEventListener('pointerup', e=>{
    if(!_dragState||_dragState.el!==el)return;
    el.classList.remove('dragging');
    el.style.zIndex='';
    tooltip().style.display='none';
    const newStart=_dragState.currentStart??_dragState.startMin;
    // Persist
    if(!ST.schedule[_dragState.dayKey]) ST.schedule[_dragState.dayKey]={};
    ST.schedule[_dragState.dayKey][_dragState.blockId]={start:newStart,duration:_dragState.dur,manual:true};
    storageSet('wcd-schedule',ST.schedule).catch(e=>console.error('Schedule save failed',e));
    el.dataset.start=newStart;
    // Re-render this block's label in the DOM (settle animation)
    el.style.transition='top 120ms ease';
    setTimeout(()=>{ el.style.transition=''; },150);
    _dragState=null;
    // Rebuild calendar so manual pin and aria-label update
    setTimeout(()=>buildCalendar(_dragState2?.dayKey||_dragState?.dayKey||el.dataset.day,document.getElementById('cal-'+el.dataset.day)),160);
  });
  // Keyboard movement
}
// keep reference to clean rebuild
let _dragState2=null;

function onBlockKeydown(e, dayKey, blockId){
  if(e.key!=='ArrowUp'&&e.key!=='ArrowDown')return;
  e.preventDefault();
  const el=document.getElementById(`cb-${dayKey}-${blockId}`);
  if(!el)return;
  const rowH=window.innerWidth<=768?48:56;
  const totalH=CAL_MINUTES/60*rowH;
  let cur=parseInt(el.dataset.start);
  const dur=parseInt(el.dataset.dur);
  cur=e.key==='ArrowUp'?Math.max(0,cur-15):Math.min(CAL_MINUTES-dur,cur+15);
  el.dataset.start=cur;
  el.style.top=(cur/CAL_MINUTES)*totalH+'px';
  el.setAttribute('aria-label',`${el.getAttribute('aria-label').split(',')[0]}, ${minToTime(cur)}–${minToTime(cur+dur)}, arrow keys to move`);
  if(!ST.schedule[dayKey])ST.schedule[dayKey]={};
  ST.schedule[dayKey][blockId]={start:cur,duration:dur,manual:true};
  storageSet('wcd-schedule',ST.schedule).catch(e=>console.error('Schedule save failed',e));
}

async function onWriteinChange(val, pollId){
  ST.writein={text:val.trim(), updatedBy:ST.guestName||'anonymous'};
  await storageSet('wcd-writein',ST.writein);
  const saved=document.getElementById('writein-saved-'+pollId);
  if(saved){saved.classList.add('show');setTimeout(()=>saved.classList.remove('show'),1800);}
  // Update vote rows that show the write-in name
  document.querySelectorAll('[id^="vor-"][id$="_writein"],[id$="__writein"]').forEach(el=>{
    const nameEl=el.querySelector('.vote-option-name');
    if(nameEl){const badge=nameEl.querySelector('.badge-plan,.tied-label');nameEl.textContent=(val.trim()||"Write-In Option")+(badge?' ':'')+' ';if(badge)nameEl.appendChild(badge);}
  });
}
/* ═══════════════════════════════════════════════════════════
   SHOPPING LIST
═══════════════════════════════════════════════════════════ */
function shopItemId(prefix, label){
  return prefix+'-'+label.replace(/[^a-z0-9]/gi,'_').toLowerCase().slice(0,40);
}

function renderShoppingList(){
  const container=document.getElementById('shop-content');
  if(!container)return;
  let html='';
  let totalItems=0,checkedItems=0;

  const addItem=(id,label)=>{
    totalItems++;
    const checked=!!ST.shopping[id];
    if(checked)checkedItems++;
    html+=`<div class="shop-item-row${checked?' checked-item':''}" id="shoprow-${id}">
      <div class="shop-cb${checked?' checked':''}" role="checkbox" aria-checked="${checked}" tabindex="0"
        onclick="toggleShopItem('${id}',this.parentElement)" 
        onkeydown="if(event.key===' '||event.key==='Enter'){event.preventDefault();toggleShopItem('${id}',this.parentElement)}"></div>
      <div class="shop-item-label">${escHtml(label)}</div>
    </div>`;
  };

  const days=[
    {key:'thu',label:'Thursday July 9',meals:[{poll:'poll-thu-dinner',slot:'Dinner',mealType:'dinner'}]},
    {key:'fri',label:'Friday July 10', meals:[
      {poll:'poll-fri-breakfast',slot:'Breakfast',mealType:'breakfast'},
      {poll:'poll-fri-lunch',slot:'Lunch',mealType:'lunch'},
      {poll:'poll-fri-dinner',slot:'Dinner',mealType:'dinner'},
    ]},
    {key:'sat',label:'Saturday July 11',meals:[
      {poll:'poll-sat-breakfast',slot:'Breakfast',mealType:'breakfast'},
      {poll:'poll-sat-lunch',slot:'Lunch',mealType:'lunch'},
      {poll:'poll-sat-dinner',slot:'Dinner',mealType:'dinner'},
    ]},
  ];

  for(const day of days){
    html+=`<div class="shop-section-title">${day.label}</div>`;
    for(const meal of day.meals){
      const tally=tallyPoll(meal.poll);
      const winner=tally.winner;
      html+=`<div class="shop-meal-title">${meal.slot}`;
      if(winner){
        if(winner==='_eatout') html+=` <span class="badge-plan" style="background:var(--moss)">EAT OUT</span>`;
        else if(winner==='_writein') html+=` <span style="font-weight:400;font-size:12px">— ${escHtml(ST.writein.text||'Write-In')}</span>`;
        else {
          const r=RECIPES[winner];
          const recipeLink=r?.url?`<a href="${r.url}" target="_blank" rel="noopener" style="font-size:11px;color:var(--buoy);text-decoration:none;margin-left:6px">View recipe →</a>`:'';
          html+=` — <span style="font-weight:400">${escHtml(r?.name||winner)}</span>${recipeLink}`;
        }
      }
      html+='</div>';

      if(!winner||winner==='_eatout'){
        html+=`<div class="shop-eating-out">${winner==='_eatout'?'Eating out — nothing to buy.':'No votes yet — check back after voting.'}</div>`;
      } else {
        const itemPrefix=`${day.key}-${meal.slot.toLowerCase()}-${winner}`;
        if(winner==='_writein'){
          html+=`<div class="shop-eating-out" style="font-style:normal;color:var(--ink1)">Write-in dish — add your own items.</div>`;
        } else {
          const list=SHOPPING_LISTS[winner]||[];
          for(const item of list){ addItem(shopItemId(itemPrefix,item),item); }
        }
      }

      // Other options toggle
      const otherOpts=POLLS[meal.poll].options.filter(o=>o!==winner&&o!=='_eatout'&&o!=='_writein'&&SHOPPING_LISTS[o]);
      if(otherOpts.length){
        const togId=`shopother-${meal.poll}`;
        html+=`<button class="shop-other-toggle" onclick="document.getElementById('${togId}').classList.toggle('open');this.textContent=document.getElementById('${togId}').classList.contains('open')?'▲ Hide other options':'▼ Other options'">▼ Other options</button>`;
        html+=`<div class="shop-other-panel" id="${togId}">`;
        for(const optId of otherOpts){
          const r=RECIPES[optId];
          if(!r)continue;
          html+=`<div style="margin-left:16px;margin-top:8px">`;
          html+=`<div style="font-size:12px;font-weight:600;color:var(--ink2);margin-bottom:4px">${escHtml(r.name)}</div>`;
          const oPrefix=`${day.key}-other-${optId}`;
          for(const item of (SHOPPING_LISTS[optId]||[])){ addItem(shopItemId(oPrefix,item),item); }
          html+=`</div>`;
        }
        html+='</div>';
      }
    }
  }

  // Fire-pit snacks section
  html+=`<div class="shop-section-title">Fire-Pit Snacks</div>`;
  for(const sid of SNACK_IDS){
    const r=RECIPES[sid];
    html+=`<div class="shop-meal-title">${escHtml(r.name)}</div>`;
    for(const item of (SHOPPING_LISTS[sid]||[])){ addItem(shopItemId('snack-'+sid,item),item); }
  }

  // Sides & staples
  html+=`<div class="shop-section-title">Sides & Staples</div>`;
  const staples=['Olive oil (good quality, 1 L+)','Kosher salt, black pepper','Unsalted butter (2 lb)','Coffee + filters','Breakfast fruit bowl (berries, melon)','Crusty baguettes × 4 (replenish as needed)'];
  for(const s of staples){ addItem(shopItemId('staples',s),s); }

  // Drinks
  html+=`<div class="shop-section-title">Drinks</div>`;
  html+=`<div class="shop-placeholder-row">Add your group's drinks here:</div>`;
  const drinkPlaceholders=['Wine / beer / cider — your picks','Sparkling water (24-pack)','Juice, coffee creamer, etc.'];
  for(const d of drinkPlaceholders){ addItem(shopItemId('drinks',d),d); }

  container.innerHTML=html;
  document.getElementById('shop-count').textContent=`${checkedItems}/${totalItems} packed`;
}

function toggleShopItem(id, rowEl){
  if(ST.shopping[id]){ delete ST.shopping[id]; }
  else { ST.shopping[id]=true; }
  storageSet('wcd-shopping',ST.shopping).catch(e=>console.error('Shopping list save failed',e));
  const checked=!!ST.shopping[id];
  rowEl.classList.toggle('checked-item',checked);
  const cb=rowEl.querySelector('.shop-cb');
  if(cb){ cb.classList.toggle('checked',checked); cb.setAttribute('aria-checked',checked); }
  // Update count
  const total=document.querySelectorAll('.shop-cb').length;
  const chk=document.querySelectorAll('.shop-cb.checked').length;
  const cnt=document.getElementById('shop-count');
  if(cnt)cnt.textContent=`${chk}/${total} packed`;
}

/* ═══════════════════════════════════════════════════════════
   SUNDAY TAB
═══════════════════════════════════════════════════════════ */
function renderSundayTab(){
  const container=document.getElementById('sun-content');
  if(!container)return;

  const checkoutItems=[
    'Strip beds and gather all linens per house rules',
    'Pack coolers with leftover food',
    'Take out all trash and recycling',
    'Sweep / wipe fridge and toss anything that won\'t travel',
    'Final walkthrough — windows, doors, lights, AC/heat off',
    'Load cars and do a phone/charger sweep',
  ];

  let html=`<div class="sunday-card">
    <div class="sunday-card-title">Checkout & Travel</div>
    <ul class="checkout-list">
      ${checkoutItems.map(i=>`<li>${escHtml(i)}</li>`).join('')}
    </ul>
  </div>`;

  html+=`<div class="sunday-card">
    <div class="sunday-card-title">Food on the Road</div>
    <p style="font-size:14px;color:var(--ink1);line-height:1.6;margin-bottom:12px">
      No cooking today. Grab breakfast or lunch on the way out — 
      <strong>Abby's Restaurant &amp; Bar</strong> (2762 NY-32, Saugerties, opens 7 AM) is right on the route.
    </p>
    <div style="font-weight:600;font-size:13px;margin:12px 0 4px">Breakfast options nearby:</div>
    <div class="restaurant-list">`;
  for(const r of RESTAURANTS.breakfast){
    html+=`<div class="restaurant-item">
      <span class="restaurant-name">${escHtml(r.name)}</span> <span class="restaurant-price">${r.price}</span>
      <div class="restaurant-addr">${escHtml(r.addr)}</div>
      <div class="restaurant-why">${escHtml(r.why)}</div>
    </div>`;
  }
  html+=`</div>
    <div style="font-weight:600;font-size:13px;margin:12px 0 4px">Lunch options nearby:</div>
    <div class="restaurant-list">`;
  for(const r of RESTAURANTS.lunch){
    html+=`<div class="restaurant-item">
      <span class="restaurant-name">${escHtml(r.name)}</span> <span class="restaurant-price">${r.price}</span>
      <div class="restaurant-addr">${escHtml(r.addr)}</div>
      <div class="restaurant-why">${escHtml(r.why)}</div>
    </div>`;
  }
  html+=`</div><div class="splurge-note">${escHtml(SPLURGE)}</div>`;
  html+=`</div>`;

  html+=`<div class="sunday-card">
    <div class="sunday-card-title">Weather</div>
    <p style="font-size:14px;color:var(--ink1);line-height:1.6">
      Sunday is beyond the reliable forecast window — check a live forecast before the drive home.
    </p>
  </div>`;

  container.innerHTML=html;
}
/* ═══════════════════════════════════════════════════════════
   INIT & TABS
═══════════════════════════════════════════════════════════ */
let _activeTab = 'thu';

async function switchTab(tabKey){
  _activeTab = tabKey;
  document.querySelectorAll('.tab-btn').forEach(b=>{
    const active=b.dataset.tab===tabKey;
    b.classList.toggle('active',active);
    b.setAttribute('aria-selected',active);
  });
  document.querySelectorAll('.tab-panel').forEach(p=>{
    p.classList.toggle('active',p.id==='tab-'+tabKey);
  });
  // Re-fetch shared state on tab switch
  await loadAllShared();
  if(tabKey==='thu'||tabKey==='fri'||tabKey==='sat'){
    buildCalendar(tabKey, document.getElementById('cal-'+tabKey));
  } else if(tabKey==='sun'){
    renderSundayTab();
  } else if(tabKey==='shop'){
    renderShoppingList();
  }
}

async function doRefresh(){
  const btn=document.getElementById('btn-refresh');
  btn.classList.add('spinning');
  await loadAllShared();
  btn.classList.remove('spinning');
  // Re-render active content
  await switchTab(_activeTab);
}

async function init(){
  // Show skeletons
  ['thu','fri','sat'].forEach(d=>{
    const el=document.getElementById('cal-'+d);
    if(el) el.innerHTML='<div style="padding:12px"><div class="skeleton-bar" style="height:48px;margin-bottom:6px"></div><div class="skeleton-bar" style="height:80px;margin-bottom:6px"></div><div class="skeleton-bar" style="height:56px"></div></div>';
  });

  // Load shared state (with 5s timeout so we always proceed)
  await loadAllShared();
  
  // Subscribe to real-time changes
  subscribeToChanges();

  try {
    // Name input — replaced by modal; wire up change-name button
    const changeName=document.getElementById('btn-change-name');
    if(changeName) changeName.addEventListener('click', openNameModal);

    // Show name modal on load if no name set
    if(!ST.guestName) {
      openNameModal();
    } else {
      updateNameButton();
    }

    // Wire up name-select enable/disable confirm
    const nameSelect = document.getElementById('name-select');
    if(nameSelect){
      nameSelect.addEventListener('change', ()=>{
        document.getElementById('nmodal-confirm').disabled = !nameSelect.value;
      });
      // Pre-select if name already known
      if(ST.guestName) nameSelect.value = ST.guestName;
    }

    // Tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn=>{
      btn.addEventListener('click',()=>switchTab(btn.dataset.tab));
    });

    // Refresh button
    const btnRefresh = document.getElementById('btn-refresh');
    if(btnRefresh) btnRefresh.addEventListener('click',doRefresh);
  } catch(e) {
    console.error('init setup error', e);
  }

  // Always build calendar regardless of any other errors
  try {
    buildCalendar('thu', document.getElementById('cal-thu'));
    renderSundayTab();
  } catch(e) {
    console.error('buildCalendar error', e);
  }
}

function openNameModal(){
  const modal = document.getElementById('name-modal');
  modal.style.display = 'flex';
  // Pre-select current name if set
  const sel = document.getElementById('name-select');
  if(sel && ST.guestName) { sel.value = ST.guestName; document.getElementById('nmodal-confirm').disabled = false; }
  setTimeout(()=> document.getElementById('name-select')?.focus(), 80);
}

function confirmName(){
  const sel = document.getElementById('name-select');
  const chosen = sel?.value?.trim();
  if(!chosen) return;
  ST.guestName = chosen;
  document.getElementById('name-modal').style.display = 'none';
  updateNameButton();
  
  // Check if user has already voted on all polls
  if (!hasUserCompletedSurvey(chosen)) {
    // Launch voting wizard only if they haven't voted yet
    openVotingWizard();
  }
}

function hasUserCompletedSurvey(guestName) {
  // Check if user has voted on all required polls
  const requiredPolls = WIZARD_POLLS.map(p => p.id);
  
  for (const pollId of requiredPolls) {
    const guestVotes = ST.votes[pollId]?.[guestName];
    // User must have at least a first choice to count as voted
    if (!guestVotes || !guestVotes.first) {
      return false;
    }
  }
  
  return true;
}

function updateNameButton(){
  const btn = document.getElementById('btn-change-name');
  if(btn) btn.textContent = ST.guestName ? `Voting as ${ST.guestName}` : 'Choose name';
}

/* ═══════════════════════════════════════════════════════════
   VOTING WIZARD
═══════════════════════════════════════════════════════════ */
const WIZARD_POLLS = [
  { id:'poll-drinks',       day:'The Trip'           },
  { id:'poll-thu-dinner',   day:'Thursday · July 9'  },
  { id:'poll-thu-snack',    day:'Thursday · July 9'   },
  { id:'poll-fri-breakfast',day:'Friday · July 10'    },
  { id:'poll-fri-lunch',    day:'Friday · July 10'    },
  { id:'poll-fri-dinner',   day:'Friday · July 10'    },
  { id:'poll-fri-physical', day:'Friday · July 10'    },
  { id:'poll-fri-leisure',  day:'Friday · July 10'    },
  { id:'poll-fri-evening-walk', day:'Friday · July 10' },
  { id:'poll-fri-snack',    day:'Friday · July 10'    },
  { id:'poll-sat-breakfast',day:'Saturday · July 11'  },
  { id:'poll-sat-lunch',    day:'Saturday · July 11'  },
  { id:'poll-sat-dinner',   day:'Saturday · July 11'  },
  { id:'poll-sat-physical', day:'Saturday · July 11'  },
  { id:'poll-sat-leisure',  day:'Saturday · July 11'  },
  { id:'poll-sat-snack',    day:'Saturday · July 11'  },
];
let _wizardStep = 0;

function openVotingWizard(){
  _wizardStep = 0;
  document.getElementById('wizard-modal').style.display = 'flex';
  renderWizardStep();
}

function renderWizardStep(){
  const total = WIZARD_POLLS.length;
  const { id: pollId, day } = WIZARD_POLLS[_wizardStep];
  const poll = POLLS[pollId];
  _openPollId = pollId;

  // Header
  document.getElementById('wizard-eyebrow').textContent = day;
  document.getElementById('wizard-title').textContent = poll.label;
  document.getElementById('wizard-step-label').textContent = `${_wizardStep + 1} of ${total}`;
  document.getElementById('wizard-progress').style.width = `${((_wizardStep + 1) / total) * 100}%`;

  // Next button label
  const nextBtn = document.getElementById('wizard-next');
  nextBtn.innerHTML = (_wizardStep === total - 1)
    ? `See the plan <span class="wizard-next-arrow">→</span>`
    : `Next <span class="wizard-next-arrow">→</span>`;

  // Back button visibility
  const backBtn = document.getElementById('wizard-back');
  if(backBtn) backBtn.disabled = (_wizardStep === 0);

  // Body — reuse buildVotePanel, strip outer wrapper div
  const hasName = !!ST.guestName;
  let html = '';
  if(!hasName) html += `<div class="vmodal-name-hint">Enter your name in the header to cast votes.</div>`;
  html += buildVotePanel(pollId).replace(/<div class="block-vote-panel[^"]*"[^>]*>/,'').replace(/<\/div>\s*$/,'');
  document.getElementById('wizard-body').innerHTML = html;
}

function wizardBack(){
  if(_wizardStep <= 0) return;
  _wizardStep--;
  renderWizardStep();
  document.getElementById('wizard-body').scrollTop = 0;
}

function wizardNext(){
  const total = WIZARD_POLLS.length;
  if(_wizardStep >= total - 1){
    closeWizard();
  } else {
    _wizardStep++;
    renderWizardStep();
    document.getElementById('wizard-body').scrollTop = 0;
  }
}

function wizardSkip(){
  wizardNext();
}

function closeWizard(){
  _openPollId = null;
  document.getElementById('wizard-modal').style.display = 'none';
  // Rebuild all visible calendars now that votes are in
  ['thu','fri','sat'].forEach(d=>{
    const el = document.getElementById('cal-'+d);
    if(el) buildCalendar(d, el);
  });
  renderShoppingList();
}

// Guard against DOMContentLoaded already having fired (bfcache, async load, mobile Safari)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  // DOM already ready — run immediately (covers bfcache restores and late script execution)
  setTimeout(init, 0);
}

// Scroll reveal via IntersectionObserver
(function(){
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');io.unobserve(e.target);}});
  },{threshold:0.08});
  function attachReveals(){
    document.querySelectorAll('.day-header,.cal-outer,.poll-section').forEach(el=>{
      if(!el.classList.contains('reveal')){el.classList.add('reveal');io.observe(el);}
    });
  }
  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded',()=>setTimeout(attachReveals,120));
  } else {
    setTimeout(attachReveals, 120);
  }
  // Re-run after tab switches (calendar renders async)
  const _orig = window.switchTab;
  if(typeof switchTab!=='undefined'){
    const _wrap=switchTab;
    window.switchTab=async function(k){await _wrap(k);setTimeout(attachReveals,160);};
  }
})();

/* ═══════════════════════════════════════════════════════════
   LUNA CHAT
═══════════════════════════════════════════════════════════ */
let agentSessionId = null;
let agentModel     = 'fast';

function openLunaChat() {
  const chip     = document.getElementById('luna-chip');
  const panel    = document.getElementById('luna-panel');
  const saberBar = document.getElementById('luna-saber-bar');
  if (!chip || !panel || !saberBar) return;

  // Toggle: if already open, close
  if (saberBar.classList.contains('open')) { closeLunaChat(); return; }

  chip.classList.add('active');

  // Step 1: ignite the saber bar (blade extends left)
  requestAnimationFrame(() => {
    saberBar.classList.add('open');
  });

  // Step 2: after blade is mostly extended, fade in messages panel
  // (panel CSS has transition-delay: 0.42s already built in)
  panel.classList.add('open');

  // Focus input after animations settle
  setTimeout(() => document.getElementById('luna-input')?.focus(), 600);
}

function closeLunaChat() {
  const chip     = document.getElementById('luna-chip');
  const panel    = document.getElementById('luna-panel');
  const saberBar = document.getElementById('luna-saber-bar');

  // Panel fades out immediately
  if (panel)    panel.classList.remove('open');
  // Saber retracts after a brief delay (so panel fades while blade retracts)
  setTimeout(() => {
    if (saberBar) saberBar.classList.remove('open');
  }, 120);
  if (chip) chip.classList.remove('active');
}

async function sendAgentMessage() {
  const input   = document.getElementById('luna-input');
  const sendBtn = document.getElementById('luna-send');
  const message = input.value.trim();
  if (!message) return;

  addAgentMessage(message, 'user');
  input.value = '';
  sendBtn.disabled = true;

  const typingEl = document.createElement('div');
  typingEl.className = 'luna-message assistant';
  typingEl.innerHTML = '<div class="luna-typing"><span></span><span></span><span></span></div>';
  document.getElementById('luna-messages').appendChild(typingEl);
  scrollLunaToBottom();

  try {
    const response = await fetch('/.netlify/functions/trip-agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, sessionId: agentSessionId, model: agentModel })
    });

    const data = await response.json();
    typingEl.remove();

    if (data.success) {
      agentSessionId = data.sessionId;
      addAgentMessage(data.message, 'assistant');
      if (data.scheduleChanged) {
        await loadAllShared();
        ['thu','fri','sat'].forEach(d => {
          const el = document.getElementById('cal-' + d);
          if (el) buildCalendar(d, el);
        });
      }
    } else {
      addAgentMessage('Sorry, something went wrong: ' + (data.error || 'Unknown error'), 'assistant');
    }
  } catch (err) {
    console.error('Luna error:', err);
    typingEl.remove();
    addAgentMessage("Couldn't reach Luna — check your connection.", 'assistant');
  }

  sendBtn.disabled = false;
  scrollLunaToBottom();
}

function addAgentMessage(text, role) {
  const messagesEl = document.getElementById('luna-messages');
  const msgEl      = document.createElement('div');
  msgEl.className  = `luna-message ${role}`;
  const bubble     = document.createElement('div');
  bubble.className = 'luna-bubble';
  bubble.textContent = text;
  msgEl.appendChild(bubble);
  messagesEl.appendChild(msgEl);
  scrollLunaToBottom();
}

function scrollLunaToBottom() {
  const el = document.getElementById('luna-messages');
  if (el) setTimeout(() => { el.scrollTop = el.scrollHeight; }, 0);
}

function setupLunaListeners() {
  const input = document.getElementById('luna-input');
  if (input) {
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendAgentMessage();
      }
    });
  }
  // Swipe down on the panel header to close
  let touchStartY = 0;
  const panel = document.getElementById('luna-panel');
  if (panel) {
    panel.addEventListener('touchstart', e => { touchStartY = e.touches[0].clientY; }, { passive: true });
    panel.addEventListener('touchend', e => {
      if (e.changedTouches[0].clientY - touchStartY > 60) closeLunaChat();
    }, { passive: true });
  }
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupLunaListeners);
} else {
  setupLunaListeners();
}

/* expose functions used in inline event handlers to window for all browser environments */