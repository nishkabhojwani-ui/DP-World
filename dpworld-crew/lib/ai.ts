import { readSheet } from "./excel";

const STCW_MATRIX: Record<string, string[]> = {
  Master: ["CoC Class I","GMDSS GOC","STCW BST","PSCRB","Advanced Firefighting","BRM","ECDIS","Medical ENG1"],
  "Chief Officer": ["CoC Class II","GMDSS GOC","STCW BST","PSCRB","Advanced Firefighting","BRM","ECDIS","Medical ENG1"],
  "2nd Officer": ["CoC OOW Deck","GMDSS ROC","STCW BST","PSCRB","Advanced Firefighting","BRM","Medical ENG1"],
  "3rd Officer": ["CoC OOW Deck","GMDSS ROC","STCW BST","PSCRB","Advanced Firefighting","Medical ENG1"],
  "Chief Engineer": ["CoC Class I Eng","STCW BST","PSCRB","Advanced Firefighting","ERM","Medical ENG1"],
  "2nd Engineer": ["CoC OOW Eng","STCW BST","PSCRB","Advanced Firefighting","ERM","Medical ENG1"],
  "3rd Engineer": ["CoC OOW Eng","STCW BST","PSCRB","Advanced Firefighting","ERM","Medical ENG1"],
  Bosun: ["STCW BST","PSCRB","Medical ENG1"],
  AB: ["STCW BST","PSCRB","Medical ENG1"],
  Oiler: ["STCW BST","Medical ENG1"],
  Cook: ["STCW BST","Medical ENG1"],
  Electrician: ["CoC Electro-Technical Officer","STCW BST","PSCRB","Medical ENG1"],
  Pumpman: ["STCW BST","Advanced Tanker Training","Medical ENG1"],
};

export async function runComplianceCheck(crewId: string) {
  const [allCrew, allCerts, allContracts, allVessels, allRestLogs] = await Promise.all([
    readSheet<Record<string,unknown>>("crew_members.xlsx"),
    readSheet<Record<string,unknown>>("certifications.xlsx"),
    readSheet<Record<string,unknown>>("sea_contracts.xlsx"),
    readSheet<Record<string,unknown>>("vessels.xlsx"),
    readSheet<Record<string,unknown>>("rest_hours_log.xlsx"),
  ]);

  const crew = allCrew.find(c => c.id === crewId);
  if (!crew) throw new Error("Crew member not found");

  const certs = allCerts.filter(c => c.crew_id === crewId);
  const activeContract = allContracts.find(c => c.crew_id === crewId && c.status === "active");
  const vessel = activeContract ? allVessels.find(v => v.id === activeContract.vessel_id) : null;

  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentLogs = allRestLogs.filter(r =>
    r.crew_id === crewId && new Date(String(r.log_date)) >= thirtyDaysAgo
  );

  const requiredCerts = STCW_MATRIX[String(crew.rank)] || [];

  const payload = {
    crew_member: {
      rank: crew.rank,
      nationality: crew.nationality,
      date_of_birth: crew.date_of_birth,
    },
    certifications: certs.map(c => ({
      cert_type: c.cert_type,
      expiry_date: c.expiry_date,
      status: c.status,
      days_remaining: Math.round((new Date(String(c.expiry_date)).getTime() - today.getTime()) / 86400000),
    })),
    required_certs_for_rank: requiredCerts,
    active_contract: activeContract ? {
      vessel_name: vessel ? vessel.name : null,
      vessel_type: vessel ? vessel.vessel_type : null,
      flag_state: vessel ? vessel.flag_state : null,
      start_date: activeContract.start_date,
      end_date: activeContract.end_date,
      days_on_board: Math.round((today.getTime() - new Date(String(activeContract.start_date)).getTime()) / 86400000),
    } : null,
    rest_hours_last_30_days: {
      total_records: recentLogs.length,
      violations: recentLogs.filter(r => r.violation_flag === "true").length,
      violations_detail: recentLogs
        .filter(r => r.violation_flag === "true")
        .map(r => ({ date: r.log_date, work_hours: r.actual_work_hours, rest_hours: r.rest_hours, type: r.violation_type })),
    },
  };

  const systemPrompt = `You are a senior maritime compliance officer specialising in MLC 2006, STCW 2010 (Manila Amendments), and Port State Control (PSC) inspection readiness. You have been given the full crew record, certifications, contract details, and rest hours data for one seafarer. Perform a compliance audit and return a structured JSON response with these fields: "overall_status" (COMPLIANT | AT_RISK | NON_COMPLIANT), "cert_checks" (array: cert_type, status, expiry_date, days_remaining, finding), "missing_certs" (array of cert_types required for rank/vessel but not held), "rest_hours_summary" (violations_count, worst_violation_type, recommendation), "contract_check" (days_on_board, mlc_max_days, status, finding), "psc_risk_level" (LOW | MEDIUM | HIGH), "action_items" (array: priority, action, deadline), "recommendation" (one of: CLEAR_FOR_DUTY | CERT_RENEWAL_REQUIRED | RELIEF_RECOMMENDED | IMMEDIATE_RELIEF_REQUIRED). Be specific with dates and day counts. Reference MLC 2006 regulation numbers where relevant.`;

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    // Return a mock response when no API key is configured
    return mockComplianceCheck(crew, certs, recentLogs, requiredCerts, activeContract);
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://dpworld-crew.vercel.app",
    },
    body: JSON.stringify({
      model: "anthropic/claude-sonnet-4.6",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Perform a compliance audit for this seafarer:\n\n${JSON.stringify(payload, null, 2)}` },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenRouter API error: ${err}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  return JSON.parse(content);
}

function mockComplianceCheck(
  crew: Record<string,unknown>,
  certs: Record<string,unknown>[],
  restLogs: Record<string,unknown>[],
  requiredCerts: string[],
  contract: Record<string,unknown> | undefined
) {
  const expiredCerts = certs.filter(c => c.status === "expired");
  const expiringCerts = certs.filter(c => c.status === "expiring");
  const violations = restLogs.filter(r => r.violation_flag === "true");
  const heldCertTypes = certs.map(c => c.cert_type as string);
  const missingCerts = requiredCerts.filter(r => !heldCertTypes.some(h => h.includes(r.split(" ")[0])));

  let overallStatus = "COMPLIANT";
  if (expiredCerts.length > 0 || missingCerts.length > 0) overallStatus = "NON_COMPLIANT";
  else if (expiringCerts.length > 0 || violations.length > 2) overallStatus = "AT_RISK";

  const daysOnBoard = contract
    ? Math.round((new Date().getTime() - new Date(String(contract.start_date)).getTime()) / 86400000)
    : 0;

  return {
    overall_status: overallStatus,
    cert_checks: certs.slice(0, 6).map(c => ({
      cert_type: c.cert_type,
      status: c.status,
      expiry_date: c.expiry_date,
      days_remaining: Math.round((new Date(String(c.expiry_date)).getTime() - new Date().getTime()) / 86400000),
      finding: c.status === "expired" ? "EXPIRED — immediate renewal required per STCW Reg I/2" :
               c.status === "expiring" ? "Expiring within 60 days — schedule renewal" : "Valid",
    })),
    missing_certs: missingCerts,
    rest_hours_summary: {
      violations_count: violations.length,
      worst_violation_type: violations[0]?.violation_type || "none",
      recommendation: violations.length > 3 ? "Review duty schedule immediately per MLC 2006 Reg 2.3" : "No action required",
    },
    contract_check: {
      days_on_board: daysOnBoard,
      mlc_max_days: 335,
      status: daysOnBoard > 335 ? "EXCEEDS_MLC_LIMIT" : "COMPLIANT",
      finding: daysOnBoard > 335 ? "Contract exceeds MLC 2006 max 11 months continuous service (Reg 2.4)" : `${daysOnBoard} days on board, within MLC 2006 limit`,
    },
    psc_risk_level: expiredCerts.length > 0 ? "HIGH" : expiringCerts.length > 0 ? "MEDIUM" : "LOW",
    action_items: [
      ...expiredCerts.slice(0, 3).map(c => ({ priority: "HIGH", action: `Renew ${c.cert_type} immediately — expired ${c.expiry_date}`, deadline: "IMMEDIATE" })),
      ...expiringCerts.slice(0, 2).map(c => ({ priority: "MEDIUM", action: `Schedule renewal for ${c.cert_type} — expires ${c.expiry_date}`, deadline: String(c.expiry_date) })),
      ...(violations.length > 3 ? [{ priority: "MEDIUM", action: "Review rest hour schedule per MLC 2006 Reg 2.3", deadline: "Within 7 days" }] : []),
    ],
    recommendation: expiredCerts.length > 2 ? "IMMEDIATE_RELIEF_REQUIRED" :
                    expiredCerts.length > 0 ? "RELIEF_RECOMMENDED" :
                    expiringCerts.length > 0 ? "CERT_RENEWAL_REQUIRED" : "CLEAR_FOR_DUTY",
  };
}
