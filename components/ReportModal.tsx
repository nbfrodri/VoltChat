"use client";

import { useState } from "react";
import { X, Flag, Check, Loader2 } from "lucide-react";

interface ReportModalProps {
  roomId: string;
  isOpen: boolean;
  onClose: () => void;
  onTerminate?: () => void;
}

const REASONS = [
  { id: "harassment", label: "Harassment or bullying" },
  { id: "illegal", label: "Illegal content" },
  { id: "spam", label: "Spam or flooding" },
  { id: "other", label: "Other" },
] as const;

export default function ReportModal({ roomId, isOpen, onClose, onTerminate }: ReportModalProps) {
  const [reason, setReason] = useState<string>("");
  const [details, setDetails] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  async function handleSubmit() {
    if (!reason) return;
    setStatus("sending");
    setErrorMsg("");

    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, reason, details: details.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        setStatus("success");
        if (data.terminated && onTerminate) {
          // Room has been reported enough times — terminate it
          setTimeout(() => onTerminate(), 1500);
        }
      } else {
        const data = await res.json();
        setErrorMsg(data.error || "Failed to submit report.");
        setStatus("error");
      }
    } catch {
      setErrorMsg("Network error. Try again.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div className="w-full max-w-sm bg-gray-800 border border-gray-700 rounded-2xl p-6 shadow-lg text-center">
          <Check className="h-10 w-10 text-emerald-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-100 mb-2">Report submitted</h3>
          <p className="text-sm text-gray-400 mb-5">Thank you for helping keep VoltChat safe.</p>
          <button
            onClick={onClose}
            className="w-full bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-xl px-4 py-3 text-sm font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Report room"
    >
      <div className="w-full max-w-sm bg-gray-800 border border-gray-700 rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-red-400" />
            <span className="text-base font-medium text-gray-200">Report Room</span>
          </div>
          <button onClick={onClose} className="p-1 text-gray-500 hover:text-gray-300">
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="text-sm text-gray-400 mb-4">
          No message content is included in reports — only the room ID and your selected reason.
        </p>

        <div className="space-y-2 mb-4">
          {REASONS.map((r) => (
            <button
              key={r.id}
              onClick={() => setReason(r.id)}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm border transition-all ${
                reason === r.id
                  ? "bg-red-900/20 border-red-800/50 text-red-300"
                  : "bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-600"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="Additional details (optional)..."
          maxLength={200}
          rows={2}
          className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/50 resize-none mb-4"
        />

        {errorMsg && <p className="text-red-400 text-sm mb-3">{errorMsg}</p>}

        <button
          onClick={handleSubmit}
          disabled={!reason || status === "sending"}
          className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white rounded-xl px-4 py-3 text-sm font-medium transition-colors"
        >
          {status === "sending" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Flag className="h-4 w-4" />
          )}
          Submit Report
        </button>
      </div>
    </div>
  );
}
