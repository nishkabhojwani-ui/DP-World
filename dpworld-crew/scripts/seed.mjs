import ExcelJS from "exceljs";
import path from "path";
import { fileURLToPath } from "url";
import { mkdirSync } from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "../data");
mkdirSync(DATA_DIR, { recursive: true });

function uuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function dateStr(d) {
  return d.toISOString().split("T")[0];
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

async function writeSheet(filename, data) {
  if (!data.length) return;
  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet("Sheet1");
  const headers = Object.keys(data[0]);
  ws.addRow(headers);
  for (const row of data) {
    const values = headers.map((h) => {
      const v = row[h];
      if (v !== null && typeof v === "object") return JSON.stringify(v);
      return v;
    });
    ws.addRow(values);
  }
  const hr = ws.getRow(1);
  hr.font = { bold: true, color: { argb: "FFFFFFFF" } };
  hr.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0A1F44" } };
  hr.height = 20;
  ws.columns.forEach((col) => { col.width = 22; });
  await workbook.xlsx.writeFile(path.join(DATA_DIR, filename));
  console.log(`✓ ${filename} (${data.length} rows)`);
}

// ─── VESSELS ─────────────────────────────────────────────────────────────────
const vessels = [
  { id: uuid(), name: "MV Dubai Star",         imo_number: "IMO9123456", flag_state: "Panama",          vessel_type: "container",        home_port: "Jebel Ali",  gross_tonnage: 45000, required_manning: JSON.stringify({total:24,master:1,chief_officer:1,second_officer:1,third_officer:1,chief_engineer:1,second_engineer:1,third_engineer:1,bosun:1,ab:6,oiler:4,cook:2,steward:1,electrician:1,pumpman:1}), current_port: "Jebel Ali",    status: "operational", trading_area: "Middle East / Far East" },
  { id: uuid(), name: "MV Jebel Ali Express",  imo_number: "IMO9234567", flag_state: "Marshall Islands", vessel_type: "container",        home_port: "Jebel Ali",  gross_tonnage: 42000, required_manning: JSON.stringify({total:22,master:1,chief_officer:1,second_officer:1,third_officer:1,chief_engineer:1,second_engineer:1,third_engineer:1,bosun:1,ab:5,oiler:3,cook:2,steward:1,electrician:1,pumpman:1}), current_port: "Singapore",   status: "operational", trading_area: "Asia / Middle East" },
  { id: uuid(), name: "MV Emirates Trader",    imo_number: "IMO9345678", flag_state: "Bahamas",          vessel_type: "container",        home_port: "Southampton", gross_tonnage: 39000, required_manning: JSON.stringify({total:22}), current_port: "Southampton",  status: "operational", trading_area: "Europe / Middle East" },
  { id: uuid(), name: "MV Cargoes Pioneer",    imo_number: "IMO9456789", flag_state: "Panama",           vessel_type: "container",        home_port: "Rotterdam",   gross_tonnage: 38000, required_manning: JSON.stringify({total:20}), current_port: "Rotterdam",    status: "operational", trading_area: "Europe / Americas" },
  { id: uuid(), name: "MT Arabian Gulf",       imo_number: "IMO9567890", flag_state: "Marshall Islands", vessel_type: "tanker",           home_port: "Fujairah",    gross_tonnage: 62000, required_manning: JSON.stringify({total:28}), current_port: "Fujairah",     status: "operational", trading_area: "Middle East / Asia" },
  { id: uuid(), name: "MT Khalifa Bay",        imo_number: "IMO9678901", flag_state: "UAE",              vessel_type: "tanker",           home_port: "Abu Dhabi",   gross_tonnage: 58000, required_manning: JSON.stringify({total:26}), current_port: "Abu Dhabi",    status: "drydock",     trading_area: "Middle East" },
  { id: uuid(), name: "OSV Al Maktoum",        imo_number: "IMO9789012", flag_state: "UAE",              vessel_type: "offshore_support", home_port: "Dubai",       gross_tonnage: 3200,  required_manning: JSON.stringify({total:18}), current_port: "Dubai",        status: "operational", trading_area: "UAE Offshore" },
  { id: uuid(), name: "OSV Hamdan",            imo_number: "IMO9890123", flag_state: "UAE",              vessel_type: "offshore_support", home_port: "Sharjah",     gross_tonnage: 2800,  required_manning: JSON.stringify({total:16}), current_port: "Sharjah",      status: "operational", trading_area: "UAE Offshore" },
  { id: uuid(), name: "OSV Rashid",            imo_number: "IMO9901234", flag_state: "Panama",           vessel_type: "offshore_support", home_port: "Dubai",       gross_tonnage: 2600,  required_manning: JSON.stringify({total:16}), current_port: "Dubai",        status: "standby",     trading_area: "UAE Offshore" },
  { id: uuid(), name: "TUG Port Falcon",       imo_number: "IMO9012345", flag_state: "UAE",              vessel_type: "tug",              home_port: "Jebel Ali",   gross_tonnage: 450,   required_manning: JSON.stringify({total:8}),  current_port: "Jebel Ali",    status: "operational", trading_area: "Port Operations" },
  { id: uuid(), name: "TUG Gateway",           imo_number: "IMO9112233", flag_state: "UAE",              vessel_type: "tug",              home_port: "Jebel Ali",   gross_tonnage: 420,   required_manning: JSON.stringify({total:8}),  current_port: "Jebel Ali",    status: "operational", trading_area: "Port Operations" },
  { id: uuid(), name: "FSRU Al Shindagha",     imo_number: "IMO9223344", flag_state: "Marshall Islands", vessel_type: "fsru",             home_port: "Dubai",       gross_tonnage: 95000, required_manning: JSON.stringify({total:28}), current_port: "Dubai",        status: "operational", trading_area: "UAE Energy" },
];
await writeSheet("vessels.xlsx", vessels);

// ─── CREW MEMBERS ─────────────────────────────────────────────────────────────
const ranks = ["Master","Chief Officer","2nd Officer","3rd Officer","Chief Engineer","2nd Engineer","3rd Engineer","Bosun","AB","Oiler","Cook","Electrician","Pumpman"];
const rankCategories = { Master:"officer", "Chief Officer":"officer", "2nd Officer":"officer", "3rd Officer":"officer", "Chief Engineer":"engineer", "2nd Engineer":"engineer", "3rd Engineer":"engineer", Bosun:"rating", AB:"rating", Oiler:"rating", Cook:"rating", Electrician:"engineer", Pumpman:"rating" };

const filipinoNames = ["Jose Santos","Eduardo Reyes","Roberto Cruz","Antonio Garcia","Mario Gonzales","Fernando Lopez","Carlos Villanueva","Ricardo Dela Cruz","Bernardo Aquino","Ernesto Bautista","Rodrigo Diaz","Miguel Fernandez","Alfredo Ramos","Pedro Castro","Jorge Navarro","Emmanuel Pascual","Danilo Soriano","Nelson Aguilar","Vicente Rivera","Nestor Torres","Ramon Mendoza","Arsenio Flores","Agustin Morales","Bartolome Espiritu","Celestino Reyes","Domingo Macapagal","Edgardo Villanueva","Fidel Corpuz"];
const indianNames = ["Rajesh Kumar","Suresh Patel","Anil Sharma","Vikram Singh","Pradeep Nair","Ramesh Menon","Sanjay Gupta","Deepak Joshi","Arun Pillai","Manoj Tiwari","Venkat Reddy","Ashok Rao","Sundar Krishnan","Pramod Bhat","Ravi Iyer","Dinesh Kamath","Mohan Shetty","Santosh Hegde"];
const ukrainianNames = ["Ivan Kovalenko","Mykola Shevchenko","Dmytro Bondarenko","Oleksiy Marchenko","Vasyl Petrenko","Serhiy Savchenko","Andriy Kravchenko","Ruslan Morozenko","Taras Lysenko","Yuriy Tkachenko"];
const egyptianNames = ["Ahmed Hassan","Mohamed Ali","Mahmoud Kamel","Ibrahim Said","Youssef Omar","Khaled Nasser","Tarek Farouk","Amr Salah"];
const arabNames = ["Abdullah Al Rashid","Khalid Al Mansoori","Sultan Al Shamsi","Omar Al Marzouqi","Saeed Al Kaabi","Hamdan Al Falasi"];
const croatianNames = ["Ivan Horvat","Marko Kovacic","Ante Novak","Luka Juric"];
const britishNames = ["James Wilson","Robert Thompson","William Davies","David Evans"];

const allCrewData = [
  ...filipinoNames.map(n=>({name:n,nat:"Filipino",homeAirport:"MNL"})),
  ...indianNames.map(n=>({name:n,nat:"Indian",homeAirport:"BOM"})),
  ...ukrainianNames.map(n=>({name:n,nat:"Ukrainian",homeAirport:"KBP"})),
  ...egyptianNames.map(n=>({name:n,nat:"Egyptian",homeAirport:"CAI"})),
  ...arabNames.map(n=>({name:n,nat:"UAE",homeAirport:"DXB"})),
  ...croatianNames.map(n=>({name:n,nat:"Croatian",homeAirport:"ZAG"})),
  ...britishNames.map(n=>({name:n,nat:"British",homeAirport:"LHR"})),
];

// Assign ranks and statuses
const rankDist = ["Master","Master","Chief Officer","Chief Officer","2nd Officer","2nd Officer","3rd Officer","3rd Officer","Chief Engineer","Chief Engineer","2nd Engineer","2nd Engineer","3rd Engineer","3rd Engineer","Bosun","AB","AB","AB","AB","AB","AB","Oiler","Oiler","Oiler","Cook","Cook","Electrician","Pumpman","Bosun","AB","AB","AB","AB","AB","Oiler","Oiler","Cook","Electrician","Pumpman","Master","Chief Officer","2nd Officer","3rd Officer","Chief Engineer","2nd Engineer","3rd Engineer","Bosun","AB","AB","AB","Oiler","Cook","Master","Chief Officer","2nd Officer","3rd Officer","Chief Engineer","2nd Engineer","AB","AB","AB","Oiler","Cook","Electrician","Master","Chief Officer","2nd Officer","Chief Engineer","2nd Engineer","Bosun","AB","AB","Oiler","Cook","Master","Chief Officer","Chief Engineer","2nd Engineer","AB","AB"];

const statuses42 = Array(42).fill("onboard");
const statusRest = [...Array(24).fill("leave"), ...Array(8).fill("available"), ...Array(6).fill("training")];
const allStatuses = [...statuses42, ...statusRest];

const today = new Date("2024-06-15");
const crewMembers = allCrewData.map((c, i) => {
  const rank = rankDist[i] || "AB";
  const status = allStatuses[i] || "leave";
  const vesselIdx = i < 42 ? (i % 12) : null;
  const vesselId = vesselIdx !== null ? vessels[vesselIdx].id : null;
  const dob = new Date(1970 + Math.floor(Math.random() * 25), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
  const seamanExpiry = dateStr(addDays(today, 365 + Math.floor(Math.random() * 730)));
  const passportExpiry = dateStr(addDays(today, 365 + Math.floor(Math.random() * 1460)));
  const nextAvailable = status === "onboard" ? dateStr(addDays(today, 60 + Math.floor(Math.random() * 120))) : dateStr(addDays(today, Math.floor(Math.random() * 60)));

  return {
    id: uuid(),
    full_name: c.name,
    rank,
    rank_category: rankCategories[rank] || "rating",
    nationality: c.nat,
    date_of_birth: dateStr(dob),
    seaman_book_no: `SB${100000 + i}`,
    seaman_book_expiry: seamanExpiry,
    passport_no: `P${200000 + i}${c.nat.substring(0,2).toUpperCase()}`,
    passport_expiry: passportExpiry,
    status,
    current_vessel_id: vesselId,
    home_airport: c.homeAirport,
    next_available_date: nextAvailable,
    photo_url: null,
    emergency_contact: JSON.stringify({ name: "Family Contact", phone: "+9715000000" + i }),
    bank_details: JSON.stringify({ bank: "Emirates NBD", iban: "AE" + (100000000000000 + i) }),
  };
});
await writeSheet("crew_members.xlsx", crewMembers);

// ─── CERTIFICATIONS ──────────────────────────────────────────────────────────
const certTypesByRank = {
  Master: ["CoC Class I","GMDSS GOC","STCW BST","PSCRB","Advanced Firefighting","BRM","ECDIS","Medical ENG1"],
  "Chief Officer": ["CoC Class II","GMDSS GOC","STCW BST","PSCRB","Advanced Firefighting","BRM","ECDIS","Medical ENG1"],
  "2nd Officer": ["CoC OOW Deck","GMDSS ROC","STCW BST","PSCRB","Advanced Firefighting","BRM","ECDIS","Medical ENG1"],
  "3rd Officer": ["CoC OOW Deck","GMDSS ROC","STCW BST","PSCRB","Advanced Firefighting","BRM","Medical ENG1"],
  "Chief Engineer": ["CoC Class I Eng","STCW BST","PSCRB","Advanced Firefighting","ERM","Medical ENG1"],
  "2nd Engineer": ["CoC OOW Eng","STCW BST","PSCRB","Advanced Firefighting","ERM","Medical ENG1"],
  "3rd Engineer": ["CoC OOW Eng","STCW BST","PSCRB","Advanced Firefighting","ERM","Medical ENG1"],
  Bosun: ["STCW BST","PSCRB","Medical ENG1"],
  AB: ["STCW BST","PSCRB","Medical ENG1"],
  Oiler: ["STCW BST","Medical ENG1"],
  Cook: ["STCW BST","Medical ENG1","Ship Cook Certificate"],
  Electrician: ["CoC Electro-Technical Officer","STCW BST","PSCRB","Medical ENG1"],
  Pumpman: ["STCW BST","Advanced Tanker Training","Medical ENG1"],
};

const issuers = ["Panama Maritime Authority","Marshall Islands Registry","UAE Flag State Authority","Bahamas Maritime Authority","MARINA Philippines","DG Shipping India","Ukrainian State Inspection for Safety","Egyptian Maritime Safety","MCA United Kingdom","Croatian Register of Shipping"];

const certifications = [];
let certIdx = 0;

// First 15 crew members will have some expired certs, next 20 will have expiring soon
crewMembers.forEach((crew, ci) => {
  const certs = certTypesByRank[crew.rank] || ["STCW BST","Medical ENG1"];
  certs.forEach((certType, cj) => {
    certIdx++;
    let issuedDate, expiryDate, status;

    if (ci < 5 && cj === 0) {
      // EXPIRED: first 5 crew, first cert
      issuedDate = addDays(today, -1500);
      expiryDate = addDays(today, -30 - Math.floor(Math.random() * 90));
      status = "expired";
    } else if (ci >= 5 && ci < 15 && cj === 1) {
      // EXPIRED: crew 5-14, second cert
      issuedDate = addDays(today, -1200);
      expiryDate = addDays(today, -10 - Math.floor(Math.random() * 60));
      status = "expired";
    } else if (ci >= 15 && ci < 35 && cj === 0) {
      // EXPIRING SOON (within 60 days): crew 15-34
      issuedDate = addDays(today, -700);
      expiryDate = addDays(today, 15 + Math.floor(Math.random() * 45));
      status = "expiring";
    } else {
      // VALID
      issuedDate = addDays(today, -365 - Math.floor(Math.random() * 730));
      expiryDate = addDays(today, 180 + Math.floor(Math.random() * 730));
      status = "valid";
    }

    const isFlagEndorsement = certType.includes("CoC") && Math.random() > 0.5;
    const flagState = crew.current_vessel_id ? (vessels.find(v => v.id === crew.current_vessel_id)?.flag_state || null) : null;

    certifications.push({
      id: uuid(),
      crew_id: crew.id,
      cert_type: certType,
      cert_number: `CERT${100000 + certIdx}`,
      issuing_authority: issuers[ci % issuers.length],
      issued_date: dateStr(issuedDate),
      expiry_date: dateStr(expiryDate),
      is_flag_endorsement: isFlagEndorsement ? "true" : "false",
      flag_state: isFlagEndorsement ? flagState : null,
      file_url: null,
      ai_verified: "false",
      ai_extracted_data: null,
      status,
    });
  });
});
await writeSheet("certifications.xlsx", certifications);

// ─── SEA CONTRACTS ───────────────────────────────────────────────────────────
const rotationTypes = ["3_2","1_1","short","emergency"];
const ports = ["Jebel Ali","Dubai","Abu Dhabi","Fujairah","Singapore","Rotterdam","Southampton","Hamburg","Shanghai","Colombo"];

const seaContracts = [];
// 42 active contracts for onboard crew
const onboardCrew = crewMembers.filter(c => c.status === "onboard");
onboardCrew.forEach((crew, i) => {
  const startDate = addDays(today, -30 - Math.floor(Math.random() * 150));
  const rotation = rotationTypes[i % 4];
  const durationDays = rotation === "3_2" ? 90 : rotation === "1_1" ? 30 : rotation === "short" ? 21 : 14;
  const endDate = addDays(startDate, durationDays + Math.floor(Math.random() * 60));
  const vessel = vessels[i % 12];
  const wage = crew.rank_category === "officer" ? 3500 + Math.floor(Math.random() * 2000) :
               crew.rank_category === "engineer" ? 3000 + Math.floor(Math.random() * 2500) : 1200 + Math.floor(Math.random() * 800);

  seaContracts.push({
    id: uuid(),
    crew_id: crew.id,
    vessel_id: vessel.id,
    rank_on_vessel: crew.rank,
    start_date: dateStr(startDate),
    end_date: dateStr(endDate),
    rotation_type: rotation,
    joining_port: ports[i % ports.length],
    sign_off_port: ports[(i + 3) % ports.length],
    status: "active",
    monthly_wage_usd: wage,
    overtime_rate_usd: Math.round(wage * 0.4 / 208),
    sea_contract_signed: "true",
  });
});

// 12 completed contracts (last 6 months)
const leaveCrew = crewMembers.filter(c => c.status === "leave").slice(0, 12);
leaveCrew.forEach((crew, i) => {
  const endDate = addDays(today, -10 - Math.floor(Math.random() * 150));
  const startDate = addDays(endDate, -90 - Math.floor(Math.random() * 60));
  const vessel = vessels[i % 12];
  seaContracts.push({
    id: uuid(),
    crew_id: crew.id,
    vessel_id: vessel.id,
    rank_on_vessel: crew.rank,
    start_date: dateStr(startDate),
    end_date: dateStr(endDate),
    rotation_type: rotationTypes[i % 4],
    joining_port: ports[i % ports.length],
    sign_off_port: ports[(i + 2) % ports.length],
    status: "completed",
    monthly_wage_usd: 2500 + Math.floor(Math.random() * 2000),
    overtime_rate_usd: 15 + Math.floor(Math.random() * 10),
    sea_contract_signed: "true",
  });
});

// 6 upcoming
const availCrew = crewMembers.filter(c => c.status === "available").slice(0, 6);
availCrew.forEach((crew, i) => {
  const startDate = addDays(today, 10 + Math.floor(Math.random() * 30));
  const vessel = vessels[i % 12];
  seaContracts.push({
    id: uuid(),
    crew_id: crew.id,
    vessel_id: vessel.id,
    rank_on_vessel: crew.rank,
    start_date: dateStr(startDate),
    end_date: dateStr(addDays(startDate, 90)),
    rotation_type: "3_2",
    joining_port: ports[i % ports.length],
    sign_off_port: ports[(i + 4) % ports.length],
    status: "active",
    monthly_wage_usd: 2800 + Math.floor(Math.random() * 1500),
    overtime_rate_usd: 14,
    sea_contract_signed: "true",
  });
});
await writeSheet("sea_contracts.xlsx", seaContracts);

// ─── CREW CHANGES ─────────────────────────────────────────────────────────────
const changeStatuses = ["planned","docs_check","travel_arranged","in_transit","signed_on","planned","docs_check","travel_arranged"];
const portAgents = ["Inchcape Shipping Jebel Ali","GAC Shipping Dubai","Wilhelmsen Ship Services Singapore","GAC Shipping Rotterdam","Inchcape Southampton","Gulf Agency Company Fujairah","Svitzer Marine Dubai","Port Link Services Abu Dhabi"];

const crewChanges = [];
for (let i = 0; i < 8; i++) {
  const vessel = vessels[i % 12];
  const outgoing = onboardCrew[i];
  const incoming = availCrew[i % availCrew.length] || onboardCrew[i + 10];
  const plannedDate = addDays(today, 3 + i * 4);
  crewChanges.push({
    id: uuid(),
    vessel_id: vessel.id,
    rank: outgoing?.rank || "AB",
    outgoing_crew_id: outgoing?.id || null,
    incoming_crew_id: incoming?.id || null,
    change_port: ports[i % ports.length],
    planned_date: dateStr(plannedDate),
    actual_date: changeStatuses[i] === "signed_on" ? dateStr(addDays(plannedDate, -1)) : null,
    status: changeStatuses[i],
    port_agent: portAgents[i % portAgents.length],
    flight_details: JSON.stringify({ flight: `EK${300 + i}`, departure: dateStr(addDays(plannedDate, -1)), arrival: dateStr(plannedDate), airline: "Emirates" }),
    hotel_details: JSON.stringify({ hotel: "Radisson Blu", city: ports[i % ports.length], checkin: dateStr(addDays(plannedDate, -1)), checkout: dateStr(plannedDate) }),
    joining_instructions_sent: i >= 4 ? "true" : "false",
    ok_to_board_issued: i >= 5 ? "true" : "false",
  });
}
await writeSheet("crew_changes.xlsx", crewChanges);

// ─── PRE-JOINING CHECKLISTS ───────────────────────────────────────────────────
const checklists = crewChanges.map((cc, i) => {
  const allTrue = i >= 5; // last 3 fully complete
  const partial = i >= 2 && i < 5; // 3 partially complete
  const blocked = i < 2; // 2 with missing items

  return {
    id: uuid(),
    crew_change_id: cc.id,
    crew_id: cc.incoming_crew_id,
    passport_valid: allTrue || partial ? "true" : "false",
    cdc_valid: allTrue || partial ? "true" : "false",
    coc_valid: allTrue || partial ? "true" : blocked ? "false" : "true",
    stcw_bst_valid: allTrue || partial ? "true" : "false",
    medical_valid: allTrue ? "true" : partial ? (i === 3 ? "true" : "false") : "false",
    flag_endorsement_valid: allTrue ? "true" : partial ? "true" : "false",
    visa_ok: allTrue ? "true" : partial ? (i === 4 ? "true" : "false") : "false",
    yellow_fever_valid: allTrue || partial ? "true" : "false",
    sea_signed: allTrue || partial ? "true" : "false",
    ok_to_board: allTrue ? "true" : "false",
    checked_by: allTrue ? "Crewing Officer" : null,
    checked_at: allTrue ? dateStr(addDays(today, i - 2)) : null,
    notes: blocked ? "Pending flag endorsement and medical clearance" : null,
  };
});
await writeSheet("pre_joining_checklists.xlsx", checklists);

// ─── RECRUITMENT REQUISITIONS ─────────────────────────────────────────────────
const reqPriorities = ["normal","normal","urgent","urgent","critical","normal"];
const reqStatuses = ["open","in_progress","open","in_progress","open","filled"];
const requisitions = [];
for (let i = 0; i < 6; i++) {
  const vessel = vessels[i % 12];
  const rankNeeded = ["Master","Chief Officer","2nd Officer","Chief Engineer","2nd Engineer","3rd Officer"][i];
  const certTypes = certTypesByRank[rankNeeded] || ["STCW BST","Medical ENG1"];
  requisitions.push({
    id: uuid(),
    vessel_id: vessel.id,
    rank_required: rankNeeded,
    required_cert_types: JSON.stringify(certTypes),
    joining_port: ports[i % ports.length],
    joining_date: dateStr(addDays(today, 14 + i * 7)),
    rotation_type: rotationTypes[i % 4],
    salary_band_usd_min: 3000 + i * 500,
    salary_band_usd_max: 5000 + i * 600,
    status: reqStatuses[i],
    priority: reqPriorities[i],
    raised_by: "Fleet Manager",
    notes: i === 4 ? "URGENT: vessel short-handed, immediate relief needed" : null,
  });
}
await writeSheet("recruitment_requisitions.xlsx", requisitions);

// ─── CANDIDATES ───────────────────────────────────────────────────────────────
const pipelineStages = ["applied","screening","docs_verification","interview","medical","offer","joining","rejected"];
const candidateData = [
  {name:"Paulo Reyes",nat:"Filipino"},{name:"Arjun Mehta",nat:"Indian"},{name:"Vasyl Kovalev",nat:"Ukrainian"},
  {name:"Sameer Hassan",nat:"Egyptian"},{name:"Marko Novak",nat:"Croatian"},{name:"Rajiv Nair",nat:"Indian"},
  {name:"Jose Dela Cruz",nat:"Filipino"},{name:"Ivan Bondar",nat:"Ukrainian"},{name:"Amr Khalil",nat:"Egyptian"},
  {name:"Ben Clarke",nat:"British"},{name:"Rodrigo Manzano",nat:"Filipino"},{name:"Deepak Sharma",nat:"Indian"},
  {name:"Oleksiy Kuz",nat:"Ukrainian"},{name:"Khaled Hamdan",nat:"UAE"},{name:"Santos Ramos",nat:"Filipino"},
  {name:"Suresh Iyer",nat:"Indian"},{name:"Mykhail Petr",nat:"Ukrainian"},{name:"Tarek Amin",nat:"Egyptian"},
];

const candidates = candidateData.map((c, i) => {
  const req = requisitions[Math.floor(i / 3)];
  const stage = pipelineStages[i % pipelineStages.length];
  const score = 62 + Math.floor(Math.random() * 32);
  return {
    id: uuid(),
    requisition_id: req?.id || requisitions[0].id,
    full_name: c.name,
    rank: req?.rank_required || "AB",
    nationality: c.nat,
    date_of_birth: dateStr(new Date(1978 + Math.floor(Math.random() * 20), Math.floor(Math.random()*12), Math.floor(Math.random()*28)+1)),
    email: c.name.toLowerCase().replace(/ /g, ".") + "@seafarer.com",
    phone: "+639" + (100000000 + i),
    cv_url: null,
    ai_parsed_data: null,
    ai_match_score: score,
    ai_match_notes: score > 85 ? "All required certs valid, strong match" : score > 70 ? "Most certs valid, 1-2 expiring soon" : "Missing 2 required certifications",
    pipeline_stage: stage,
    interview_date: ["interview","medical","offer","joining"].includes(stage) ? dateStr(addDays(today, -5)) : null,
    interview_notes: stage === "interview" ? "Strong candidate, good communication" : null,
    offer_sent_date: ["offer","joining"].includes(stage) ? dateStr(addDays(today, -3)) : null,
    offer_accepted: stage === "joining" ? "true" : null,
    rejection_reason: stage === "rejected" ? "Certificate expired, not renewable in time" : null,
    go_to_talent_pool: stage === "rejected" ? "true" : "false",
  };
});
await writeSheet("candidates.xlsx", candidates);

// ─── REST HOURS LOG ────────────────────────────────────────────────────────────
const restHoursLog = [];
const onboardCrewIds = onboardCrew.map(c => c.id);
const violationCrewIndices = [0, 1, 5, 8, 12, 18, 22, 27, 31, 35]; // 10 violations across 3 vessels

for (let day = 29; day >= 0; day--) {
  const logDate = dateStr(addDays(today, -day));
  onboardCrewIds.forEach((crewId, ci) => {
    const crew = onboardCrew[ci];
    const vessel = vessels[ci % 12];
    let workHours = 8 + Math.random() * 3;
    let restHours = 24 - workHours;
    let violationFlag = false;
    let violationType = null;
    let forceMajeure = false;

    // Plant violations
    const vIdx = violationCrewIndices.indexOf(ci);
    if (vIdx !== -1 && day < 5) {
      if (vIdx % 2 === 0) {
        workHours = 15.5; // exceeds 14hr daily max
        restHours = 8.5;
        violationFlag = true;
        violationType = "daily_max";
        forceMajeure = vIdx === 0; // first one is force majeure
      } else {
        workHours = 14.5;
        restHours = 9.5;
        violationFlag = true;
        violationType = "min_rest";
      }
    }

    restHoursLog.push({
      id: uuid(),
      crew_id: crewId,
      vessel_id: vessel.id,
      log_date: logDate,
      scheduled_work_hours: 8,
      actual_work_hours: parseFloat(workHours.toFixed(1)),
      rest_hours: parseFloat(restHours.toFixed(1)),
      violation_flag: violationFlag ? "true" : "false",
      violation_type: violationType,
      force_majeure: forceMajeure ? "true" : "false",
      compensatory_rest_scheduled: violationFlag ? "true" : "false",
      entered_by: "Master",
      verified_by_master: "true",
    });
  });
}
await writeSheet("rest_hours_log.xlsx", restHoursLog);

console.log("\n✅ All seed Excel files generated successfully!");
console.log(`📁 Location: ${DATA_DIR}`);
