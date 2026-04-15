"use client";

import { useEffect, useState } from "react";

interface Requisition { id: string; vessel_id: string; rank_required: string; required_cert_types: unknown; joining_port: string; joining_date: string; rotation_type: string; salary_band_usd_min: number; salary_band_usd_max: number; status: string; priority: string; raised_by: string; notes: string | null; }
interface Candidate { id: string; requisition_id: string; full_name: string; rank: string; nationality: string; ai_match_score: number; pipeline_stage: string; date_of_birth: string; email: string; interview_notes: string | null; offer_accepted: string | null; rejection_reason: string | null; }
interface Vessel { id: string; name: string; }

const PIPELINE = ["applied","screening","docs_verification","interview","medical","offer","joining","rejected"];
const PIPELINE_LABELS: Record<string,string> = {
  applied:"Applied", screening:"Screening", docs_verification:"Docs Verify",
  interview:"Interview", medical:"Medical", offer:"Offer Sent", joining:"Joining", rejected:"Rejected",
};
const PRIORITY_COLORS: Record<string,string> = { normal: "bg-gray-100 text-gray-700", urgent: "bg-amber-100 text-amber-700", critical: "bg-red-100 text-red-700" };

export default function RecruitmentPage() {
  const [reqs, setReqs] = useState<Requisition[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [selectedReq, setSelectedReq] = useState<Requisition | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/requisitions").then(r=>r.json()),
      fetch("/api/candidates").then(r=>r.json()),
      fetch("/api/vessels").then(r=>r.json()),
    ]).then(([r,c,v]) => {
      setReqs(r); setCandidates(c); setVessels(v);
      setSelectedReq(r[0] || null);
      setLoading(false);
    });
  }, []);

  const moveStage = async (candidateId: string, newStage: string) => {
    await fetch("/api/candidates", { method: "PATCH", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ id: candidateId, pipeline_stage: newStage }) });
    setCandidates(prev => prev.map(c => c.id === candidateId ? { ...c, pipeline_stage: newStage } : c));
  };

  const vesselName = (id: string) => vessels.find(v => v.id === id)?.name || "—";
  const reqCandidates = selectedReq ? candidates.filter(c => c.requisition_id === selectedReq.id) : [];

  if (loading) return <div className="flex items-center justify-center h-96"><div className="text-[var(--muted)] text-sm">Loading recruitment data...</div></div>;

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[var(--navy)]">Recruitment</h1>
        <p className="text-[var(--muted)] text-sm mt-1">{reqs.filter(r=>r.status==="open"||r.status==="in_progress").length} open positions · {candidates.length} candidates</p>
      </div>

      {/* Requisition List */}
      <div className="bg-white rounded-xl shadow-sm border border-[var(--border)]">
        <div className="px-5 py-4 border-b border-[var(--border)]">
          <h2 className="font-semibold text-[var(--navy)] text-sm">Open Requisitions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--light)]">
                <th className="px-4 py-2.5 text-left text-xs text-[var(--muted)] font-medium">Vessel</th>
                <th className="px-4 py-2.5 text-left text-xs text-[var(--muted)] font-medium">Rank</th>
                <th className="px-4 py-2.5 text-left text-xs text-[var(--muted)] font-medium">Priority</th>
                <th className="px-4 py-2.5 text-left text-xs text-[var(--muted)] font-medium">Joining Date</th>
                <th className="px-4 py-2.5 text-left text-xs text-[var(--muted)] font-medium">Salary (USD/mo)</th>
                <th className="px-4 py-2.5 text-left text-xs text-[var(--muted)] font-medium">Candidates</th>
                <th className="px-4 py-2.5 text-left text-xs text-[var(--muted)] font-medium">Status</th>
                <th className="px-4 py-2.5 text-left text-xs text-[var(--muted)] font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {reqs.map(req => {
                const cCount = candidates.filter(c => c.requisition_id === req.id).length;
                const daysUntil = Math.round((new Date(req.joining_date).getTime() - new Date().getTime()) / 86400000);
                return (
                  <tr key={req.id} className={`border-t border-[var(--border)] hover:bg-[var(--light)] transition-colors ${selectedReq?.id === req.id ? "bg-blue-50" : ""}`}>
                    <td className="px-4 py-3 font-medium">{vesselName(req.vessel_id)}</td>
                    <td className="px-4 py-3">{req.rank_required}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${PRIORITY_COLORS[req.priority]}`}>{req.priority}</span>
                    </td>
                    <td className="px-4 py-3 text-[var(--muted)]">
                      {req.joining_date}
                      <span className={`ml-1 text-xs ${daysUntil < 14 ? "text-red-500 font-medium" : "text-[var(--muted)]"}`}>({daysUntil}d)</span>
                    </td>
                    <td className="px-4 py-3 text-[var(--muted)]">${req.salary_band_usd_min?.toLocaleString()} – ${req.salary_band_usd_max?.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className="bg-[var(--navy)] text-white text-xs px-2 py-0.5 rounded-full font-medium">{cCount}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${req.status === "open" ? "bg-teal-100 text-teal-700" : req.status === "in_progress" ? "bg-blue-100 text-blue-700" : req.status === "filled" ? "bg-gray-100 text-gray-600" : "bg-gray-100 text-gray-400"}`}>
                        {req.status?.toUpperCase().replace(/_/g," ")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => setSelectedReq(req)}
                        className="text-xs px-2.5 py-1 bg-[var(--navy)] text-white rounded-lg hover:bg-[var(--navy2)] transition-colors">
                        View Pipeline
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {reqs[0] && reqs[0].notes && (
          <div className="px-5 py-2 bg-red-50 text-red-700 text-xs border-t border-red-200 rounded-b-xl">Alert: {reqs.find(r=>r.priority==="critical")?.notes}</div>
        )}
      </div>

      {/* Candidate Pipeline Kanban */}
      {selectedReq && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-[var(--navy)]">Candidate Pipeline — {selectedReq.rank_required} for {vesselName(selectedReq.vessel_id)}</h2>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${PRIORITY_COLORS[selectedReq.priority]}`}>{selectedReq.priority}</span>
          </div>

          <div className="grid grid-cols-8 gap-2 overflow-x-auto">
            {PIPELINE.map(stage => {
              const stageCandidates = reqCandidates.filter(c => c.pipeline_stage === stage);
              return (
                <div key={stage} className={`rounded-xl border p-2.5 min-w-32 ${stage === "rejected" ? "bg-red-50 border-red-200" : "bg-white border-[var(--border)]"}`}>
                  <div className="text-xs font-bold text-[var(--navy)] mb-2 flex items-center justify-between">
                    <span>{PIPELINE_LABELS[stage]}</span>
                    <span className="text-[var(--muted)]">{stageCandidates.length}</span>
                  </div>
                  <div className="space-y-2">
                    {stageCandidates.map(c => {
                      const scoreColor = c.ai_match_score >= 85 ? "bg-teal-100 text-teal-700" : c.ai_match_score >= 70 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700";
                      return (
                        <div key={c.id}
                          onClick={() => setSelectedCandidate(selectedCandidate?.id === c.id ? null : c)}
                          className="bg-white border border-[var(--border)] rounded-lg p-2 cursor-pointer hover:shadow-sm transition-shadow text-xs">
                          <div className="font-semibold text-[var(--navy)] truncate">{c.full_name}</div>
                          <div className="text-[var(--muted)]">{c.nationality}</div>
                          <div className="mt-1 flex items-center justify-between">
                            <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${scoreColor}`}>{c.ai_match_score}%</span>
                            {stage !== "applied" && stage !== "rejected" && (
                              <button onClick={(e) => { e.stopPropagation(); const idx = PIPELINE.indexOf(stage); if (idx < PIPELINE.length - 2) moveStage(c.id, PIPELINE[idx+1]); }}
                                className="text-[var(--muted)] hover:text-[var(--navy)] text-xs px-1">→</button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Candidate Detail Panel */}
          {selectedCandidate && (
            <div className="bg-white rounded-xl shadow-sm border border-[var(--border)] p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-[var(--navy)] text-lg">{selectedCandidate.full_name}</h3>
                  <div className="text-sm text-[var(--muted)]">{selectedCandidate.rank} · {selectedCandidate.nationality}</div>
                </div>
                <div className="flex gap-2 items-center">
                  <span className={`text-lg font-bold px-3 py-1 rounded-full ${selectedCandidate.ai_match_score >= 85 ? "bg-teal-100 text-teal-700" : selectedCandidate.ai_match_score >= 70 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                    AI Score: {selectedCandidate.ai_match_score}%
                  </span>
                  <button onClick={() => setSelectedCandidate(null)} className="text-[var(--muted)] hover:text-[var(--text)] text-xl">×</button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
                <div>
                  <div className="text-xs font-semibold text-[var(--muted)] uppercase mb-2">Contact</div>
                  <div className="text-[var(--text)]">{selectedCandidate.email}</div>
                  <div className="text-[var(--muted)] text-xs mt-1">DOB: {selectedCandidate.date_of_birth}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-[var(--muted)] uppercase mb-2">Interview</div>
                  <div className="text-[var(--muted)]">{selectedCandidate.interview_notes || "Not yet interviewed"}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-[var(--muted)] uppercase mb-2">Offer Status</div>
                  <div className={`font-medium ${selectedCandidate.offer_accepted === "true" ? "text-teal-600" : "text-[var(--muted)]"}`}>
                    {selectedCandidate.offer_accepted === "true" ? "Offer Accepted" : "Pending"}
                  </div>
                  {selectedCandidate.rejection_reason && <div className="text-xs text-red-600 mt-1">{selectedCandidate.rejection_reason}</div>}
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                {PIPELINE.indexOf(selectedCandidate.pipeline_stage) < PIPELINE.length - 2 && (
                  <button onClick={() => { const idx = PIPELINE.indexOf(selectedCandidate.pipeline_stage); moveStage(selectedCandidate.id, PIPELINE[idx+1]); setSelectedCandidate(prev => prev ? {...prev, pipeline_stage: PIPELINE[idx+1]} : null); }}
                    className="px-4 py-2 bg-[var(--navy)] text-white text-sm rounded-lg hover:bg-[var(--navy2)] transition-colors font-medium">
                    Move to {PIPELINE_LABELS[PIPELINE[PIPELINE.indexOf(selectedCandidate.pipeline_stage)+1]]} →
                  </button>
                )}
                <button onClick={() => { moveStage(selectedCandidate.id, "rejected"); setSelectedCandidate(prev => prev ? {...prev, pipeline_stage: "rejected"} : null); }}
                  className="px-4 py-2 bg-gray-100 text-gray-600 text-sm rounded-lg hover:bg-gray-200 transition-colors">
                  Reject
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
