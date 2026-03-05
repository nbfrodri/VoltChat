"use client";

import { useState, useEffect } from "react";
import { ShieldAlert, ExternalLink } from "lucide-react";

const STORAGE_KEY = "voltchat-safety-acknowledged";

export default function SafetyDisclaimer() {
  const [mounted, setMounted] = useState(false);
  const [accepted, setAccepted] = useState(true); // assume accepted until we check

  useEffect(() => {
    setMounted(true);
    setAccepted(!!localStorage.getItem(STORAGE_KEY));
  }, []);

  function handleAccept() {
    localStorage.setItem(STORAGE_KEY, "true");
    setAccepted(true);
  }

  // Don't render anything until mounted (prevents hydration mismatch)
  // and don't render if already accepted
  if (!mounted || accepted) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <ShieldAlert className="h-7 w-7 text-amber-400 shrink-0" />
          <h2 className="text-xl font-medium text-gray-100">Before you enter</h2>
        </div>

        <div className="space-y-3 text-base text-gray-400 mb-6">
          <p>
            VoltChat is an <strong className="text-gray-200">anonymous, ephemeral</strong> chat platform.
            Messages are never stored and disappear when you leave.
          </p>
          <p>
            While anonymity enables open expression, it also carries risks:
          </p>
          <ul className="space-y-1.5 pl-4">
            <li className="flex items-start gap-2">
              <span className="text-amber-400 mt-0.5">&#8226;</span>
              <span>Users are anonymous — there is no way to verify identity</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400 mt-0.5">&#8226;</span>
              <span>Messages cannot be recovered once a room is closed</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400 mt-0.5">&#8226;</span>
              <span>Do not share personal information (real name, address, phone, etc.)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400 mt-0.5">&#8226;</span>
              <span>Room creators can kick/mute users but there is no global moderation</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400 mt-0.5">&#8226;</span>
              <span>Messages pass through third-party servers and are <strong className="text-gray-300">not</strong> end-to-end encrypted</span>
            </li>
          </ul>
          <p className="text-xs text-gray-500">
            By continuing, you acknowledge these limitations and agree to use VoltChat responsibly.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={handleAccept}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl px-4 py-3.5 text-base font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          >
            I understand, continue
          </button>
          <a
            href="/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 py-2 transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Read Terms & Conditions
          </a>
        </div>
      </div>
    </div>
  );
}
