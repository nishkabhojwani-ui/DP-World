"use client";

import { useState } from "react";
import Link from "next/link";
import AIBadge from "@/components/AIBadge";
import AIInsightCard from "@/components/AIInsightCard";

interface CrewChange { id: string; vessel_id: string; rank: string; outgoing_crew_id: string | null; incoming_crew_id: string | null; change_port: string; planned_date: string; status: string; port_agent: string; flight_details: unknown; hotel_details: unknown; joining_instructions_sent: string; ok_to_board_issued: string; }
interface Checklist { crew_change_id: string; passport_valid: string; cdc_valid: string; coc_valid: string; stcw_bst_valid: string; medical_valid: string; flag_endorsement_valid: string; visa_ok: string; yellow_fever_valid: string; sea_signed: string; ok_to_board: string; notes: string | null; }
interface CrewMember { id: string; full_name: string; }
interface Vessel { id: string; name: string; }

const SAMPLE_CHANGES: CrewChange[] = [
  {"id":"6ec0e6e9-5bf2-4462-b2ad-73c94e350c08","vessel_id":"38da2067-afe3-4aaa-b8b7-ad6e1ba08c98","rank":"Master","outgoing_crew_id":"1c5dfefa-883f-463f-8ec4-919121f66730","incoming_crew_id":"ff7d2d77-95c2-4cfc-9b92-106d69a688a1","change_port":"Jebel Ali","planned_date":"2024-06-18","status":"planned","port_agent":"Inchcape Shipping Jebel Ali","flight_details":{"flight":"EK300","departure":"2024-06-17","arrival":"2024-06-18","airline":"Emirates"},"hotel_details":{"hotel":"Radisson Blu","city":"Jebel Ali","checkin":"2024-06-17","checkout":"2024-06-18"},"joining_instructions_sent":"false","ok_to_board_issued":"false"},
  {"id":"9f537bae-6bba-4365-a4e6-85eb31b2389a","vessel_id":"cd4e84a2-d089-4d2b-8812-d06a0c21f87d","rank":"Master","outgoing_crew_id":"3a5723a6-2cd4-4d22-8ecf-070b982d8a31","incoming_crew_id":"a7015549-6201-4d25-bb1d-9fb8f088ac7f","change_port":"Dubai","planned_date":"2024-06-22","status":"docs_check","port_agent":"GAC Shipping Dubai","flight_details":{"flight":"EK301","departure":"2024-06-21","arrival":"2024-06-22","airline":"Emirates"},"hotel_details":{"hotel":"Radisson Blu","city":"Dubai","checkin":"2024-06-21","checkout":"2024-06-22"},"joining_instructions_sent":"false","ok_to_board_issued":"false"},
  {"id":"dde27882-05e6-47a1-b695-df367e217606","vessel_id":"0ba534db-ff49-4e83-904d-859105c472f4","rank":"Chief Officer","outgoing_crew_id":"6711b357-6d09-47ea-8917-2bf1cdaf1eac","incoming_crew_id":"52bffd8e-32c5-4fee-b30c-dfdf43062ca2","change_port":"Abu Dhabi","planned_date":"2024-06-26","status":"travel_arranged","port_agent":"Wilhelmsen Ship Services Singapore","flight_details":{"flight":"EK302","departure":"2024-06-25","arrival":"2024-06-26","airline":"Emirates"},"hotel_details":{"hotel":"Radisson Blu","city":"Abu Dhabi","checkin":"2024-06-25","checkout":"2024-06-26"},"joining_instructions_sent":"false","ok_to_board_issued":"false"},
];

const SAMPLE_CREW: CrewMember[] = [
  {"id":"1c5dfefa-883f-463f-8ec4-919121f66730","full_name":"Jose Santos"},
  {"id":"ff7d2d77-95c2-4cfc-9b92-106d69a688a1","full_name":"Sultan Al Shamsi"},
  {"id":"3a5723a6-2cd4-4d22-8ecf-070b982d8a31","full_name":"Eduardo Reyes"},
  {"id":"a7015549-6201-4d25-bb1d-9fb8f088ac7f","full_name":"Omar Al Marzouqi"},
];

const SAMPLE_VESSELS: Vessel[] = [
  {"id":"38da2067-afe3-4aaa-b8b7-ad6e1ba08c98","name":"MV-Alpha"},
  {"id":"cd4e84a2-d089-4d2b-8812-d06a0c21f87d","name":"MV-Beta"},
  {"id":"0ba534db-ff49-4e83-904d-859105c472f4","name":"MV-Gamma"},
];

const STAGES = ["planned","docs_check","travel_arranged","in_transit","signed_on","completed"];
const STAGE_LABELS: Record<string,string> = { planned:"Planned", docs_check:"Docs Check", travel_arranged:"Travel Arranged", in_transit:"In Transit", signed_on:"Signed On", completed:"Completed" };
const STAGE_ACCENT: Record<string,string> = { planned:"var(--muted2)", docs_check:"#3B82F6", travel_arranged:"#8B5CF6", in_transit:"var(--amber)", signed_on:"var(--teal)", completed:"#22C55E" };

function checklistCount(cl: Checklist | undefined): number {
  if (!cl) return 0;
  return ["passport_valid","cdc_valid","coc_valid","stcw_bst_valid","medical_valid","flag_endorsement_valid","visa_ok","yellow_fever_valid","sea_signed","ok_to_board"].filter(f => cl[f as keyof Checklist] === "true").length;
}

const CHECK_ITEMS = [
  { key: "passport_valid", label: "Valid Passport (6mo+)" },
  { key: "cdc_valid", label: "Valid CDC / Seaman Book" },
  { key: "coc_valid", label: "CoC valid for rank" },
  { key: "stcw_bst_valid", label: "STCW BST valid" },
  { key: "medical_valid", label: "Medical ENG1 valid" },
  { key: "flag_endorsement_valid", label: "Flag state endorsement" },
  { key: "visa_ok", label: "Visa cleared" },
  { key: "yellow_fever_valid", label: "Yellow fever vaccination" },
  { key: "sea_signed", label: "SEA signed by both parties" },
  { key: "ok_to_board", label: "OK-to-Board letter issued" },
  { key: "joining_instructions_sent", label: "Joining instructions sent" },
];

export default function CrewChangesPage() {
  const [selected, setSelected] = useState<CrewChange | null>(null);

  const changes = SAMPLE_CHANGES;
  const checklists: Checklist[] = [];
  const crew = SAMPLE_CREW;
  const vessels = SAMPLE_VESSELS;

  const crewName = (id: string | null) => crew.find(c => c.id === id)?.full_name || "-";
  const vesselName = (id: string) => vessels.find(v => v.id === id)?.name || "-";
  const checklist = (changeId: string) => checklists.find(cl => cl.crew_change_id === changeId);

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <p className="section-label mb-1">Operations</p>
            <div className="flex items-center gap-3">
              <h1 className="page-title">Crew Change Management</h1>
              <div className="flex gap-2">
                <AIBadge type="flagged" size="sm" />
                <AIBadge type="generated" size="sm" />
              </div>
            </div>
            <p className="page-subtitle">{changes.filter(c => c.status !== "completed").length} active changes • AI doc verification, briefing generation & risk assessment</p>
          </div>
        </div>
      </div>

      {/* AI-Powered Insights */}
      {changes.length > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-4">
          <AIInsightCard
            icon="DR"
            title="Documentation Review"
            description="AI automatically verified all crew change documents and flagged missing certifications"
            type="alert"
            details={[
              { label: "Processed", value: `${changes.length} crew changes` },
              { label: "Issues Found", value: changes.filter(c => c.status !== "completed").length },
            ]}
          />
          <AIInsightCard
            icon="BM"
            title="Briefing Materials Generated"
            description="AI generated joining instructions and pre-embarkation briefings for all active crew changes"
            type="action"
            details={[
              { label: "Generated", value: `${Math.ceil(changes.length * 0.8)} briefings` },
              { label: "Status", value: "Ready for Review" },
            ]}
          />
        </div>
      )}

      {/* Kanban */}
      <div className="grid gap-3 mb-5" style={{ gridTemplateColumns: `repeat(${STAGES.length}, minmax(160px, 1fr))`, overflowX: "auto" }}>
        {STAGES.map(stage => {
          const stageChanges = changes.filter(c => c.status === stage);
          return (
            <div key={stage} className="kanban-col">
              <div className="kanban-col-header">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-sm" style={{ background: STAGE_ACCENT[stage] }} />
                  {STAGE_LABELS[stage]}
                </div>
                <span className="font-black" style={{ color: "var(--navy)", fontSize: "0.8125rem" }}>{stageChanges.length}</span>
              </div>
              {stageChanges.map(cc => {
                const cl = checklist(cc.id);
                const done = checklistCount(cl);
                const hasBlocker = cl && (cl.coc_valid !== "true" || cl.medical_valid !== "true");
                const allDone = done === 11;
                return (
                  <div key={cc.id}
                    onClick={() => setSelected(selected?.id === cc.id ? null : cc)}
                    className={`kanban-card ${selected?.id === cc.id ? "border-[var(--navy)]" : ""}`}
                    style={hasBlocker ? { borderLeftColor: "var(--red)", borderLeftWidth: "3px" } : allDone ? { borderLeftColor: "var(--teal)", borderLeftWidth: "3px" } : {}}>
                    <div className="font-bold" style={{ fontSize: "0.75rem", color: "var(--navy)" }}>{vesselName(cc.vessel_id)}</div>
                    <div className="font-medium" style={{ fontSize: "0.7rem", color: "var(--muted)", marginTop: "0.125rem" }}>{cc.rank}</div>
                    <div style={{ fontSize: "0.7rem", color: "var(--muted2)", marginTop: "0.125rem" }}>In: {crewName(cc.incoming_crew_id).split(" ")[0]}</div>
                    <div style={{ fontSize: "0.7rem", color: "var(--muted2)" }}>{cc.change_port} · {cc.planned_date}</div>
                    <div className="mt-2">
                      <div className="flex justify-between mb-1" style={{ fontSize: "0.65rem" }}>
                        <span style={{ color: "var(--muted)" }}>Checklist</span>
                        <span className="font-bold" style={{ color: allDone ? "var(--teal)" : hasBlocker ? "var(--red)" : "var(--amber)" }}>{done}/11</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${(done / 11) * 100}%`, background: allDone ? "var(--teal)" : hasBlocker ? "var(--red)" : "var(--amber)" }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Detail Panel */}
      {selected && (() => {
        const cl = checklist(selected.id);
        const done = checklistCount(cl);
        const flightDetails = typeof selected.flight_details === "object" && selected.flight_details ? selected.flight_details as Record<string, unknown> : null;
        const hotelDetails = typeof selected.hotel_details === "object" && selected.hotel_details ? selected.hotel_details as Record<string, unknown> : null;
        return (
          <div className="card">
            <div className="card-header">
              <div>
                <p className="section-label">Crew Change Detail</p>
                <h2 className="card-title mt-0.5">{vesselName(selected.vessel_id)} - {selected.rank}</h2>
              </div>
              <div className="flex items-center gap-3">
                <span className="badge" style={{ background: STAGE_ACCENT[selected.status] + "22", color: STAGE_ACCENT[selected.status], border: `1px solid ${STAGE_ACCENT[selected.status]}44` }}>
                  {STAGE_LABELS[selected.status]}
                </span>
                <button onClick={() => setSelected(null)} className="btn btn-ghost btn-sm">Close</button>
              </div>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-3 gap-6">
                {/* Crew & Change Info */}
                <div className="space-y-4">
                  <div>
                    <p className="section-label mb-2">Outgoing Crew</p>
                    <div className="font-semibold" style={{ color: "var(--navy)" }}>{crewName(selected.outgoing_crew_id)}</div>
                    <div className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>Sign-off · CDC stamp required</div>
                  </div>
                  <div>
                    <p className="section-label mb-2">Incoming Crew</p>
                    <div className="font-semibold" style={{ color: "var(--navy)" }}>{crewName(selected.incoming_crew_id)}</div>
                    {selected.incoming_crew_id && <Link href={`/crew-pool/${selected.incoming_crew_id}`} className="text-xs" style={{ color: "var(--teal)" }}>View profile</Link>}
                  </div>
                  <div>
                    <p className="section-label mb-2">Change Details</p>
                    <div className="space-y-1.5">
                      {[["Port", selected.change_port], ["Date", selected.planned_date], ["Port Agent", selected.port_agent]].map(([l, v]) => (
                        <div key={l} className="flex justify-between text-xs">
                          <span style={{ color: "var(--muted)" }}>{l}</span>
                          <span className="font-medium" style={{ color: "var(--text)", textAlign: "right", maxWidth: "60%" }}>{v}</span>
                        </div>
                      ))}
                      <div className="flex justify-between text-xs pt-1 border-t border-[var(--border)]">
                        <span style={{ color: "var(--muted)" }}>OK to Board</span>
                        <span className={`badge ${selected.ok_to_board_issued === "true" ? "badge-teal" : "badge-red"}`}>{selected.ok_to_board_issued === "true" ? "Issued" : "Pending"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Travel */}
                <div className="space-y-4">
                  {flightDetails && (
                    <div>
                      <p className="section-label mb-2">Flight Details</p>
                      <div className="rounded-lg p-3 space-y-1 text-xs" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
                        <div className="font-bold" style={{ color: "var(--navy)" }}>{String(flightDetails.flight)} · {String(flightDetails.airline)}</div>
                        <div style={{ color: "var(--muted)" }}>Dep: {String(flightDetails.departure)}</div>
                        <div style={{ color: "var(--muted)" }}>Arr: {String(flightDetails.arrival)}</div>
                      </div>
                    </div>
                  )}
                  {hotelDetails && (
                    <div>
                      <p className="section-label mb-2">Hotel / Layover</p>
                      <div className="rounded-lg p-3 space-y-1 text-xs" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
                        <div className="font-bold" style={{ color: "var(--navy)" }}>{String(hotelDetails.hotel)}</div>
                        <div style={{ color: "var(--muted)" }}>{String(hotelDetails.city)}</div>
                        <div style={{ color: "var(--muted)" }}>In: {String(hotelDetails.checkin)} · Out: {String(hotelDetails.checkout)}</div>
                      </div>
                    </div>
                  )}
                  <div>
                    <p className="section-label mb-2">Joining Instructions</p>
                    <div className="rounded-lg p-3 text-xs space-y-1" style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--muted)" }}>
                      <div>Vessel: <strong style={{ color: "var(--text)" }}>{vesselName(selected.vessel_id)}</strong></div>
                      <div>Port: <strong style={{ color: "var(--text)" }}>{selected.change_port}</strong></div>
                      <div>Date: <strong style={{ color: "var(--text)" }}>{selected.planned_date}</strong></div>
                      <div>Agent: <strong style={{ color: "var(--text)" }}>{selected.port_agent}</strong></div>
                    </div>
                  </div>
                </div>

                {/* Checklist */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="section-label">Pre-Joining Checklist</p>
                    <span className="font-black" style={{ color: done === 11 ? "var(--teal)" : "var(--amber)", fontSize: "1rem" }}>{done}/11</span>
                  </div>
                  <div className="space-y-1.5 mb-3">
                    {CHECK_ITEMS.map(item => {
                      const val = cl ? cl[item.key as keyof Checklist] : "false";
                      const checked = val === "true";
                      return (
                        <div key={item.key} className="flex items-center gap-2 text-xs">
                          <div className={`w-4 h-4 rounded flex-shrink-0 flex items-center justify-center font-bold ${checked ? "bg-teal-100 text-teal-700" : "bg-red-50 text-red-400"}`} style={{ fontSize: "0.625rem" }}>
                            {checked ? "Y" : "N"}
                          </div>
                          <span style={{ color: checked ? "var(--text2)" : "var(--muted)" }}>{item.label}</span>
                        </div>
                      );
                    })}
                  </div>
                  {cl?.notes && <div className="alert-banner warning text-xs">{cl.notes}</div>}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
