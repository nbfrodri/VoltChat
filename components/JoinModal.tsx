"use client";

import { useState, useRef, useEffect } from "react";
import { User, ArrowRight } from "lucide-react";

interface JoinModalProps {
  roomId: string;
  onJoin: (username: string) => void;
}

export default function JoinModal({ roomId, onJoin }: JoinModalProps) {
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = username.trim();
    if (!trimmed) {
      setError("Please enter a name to enter the void.");
      return;
    }
    if (trimmed.toLowerCase() === "system") {
      setError("That name is reserved.");
      return;
    }
    onJoin(trimmed);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm bg-gray-900 border border-gray-800 rounded-2xl p-8">
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-full bg-emerald-900/40 border border-emerald-700/30 flex items-center justify-center">
            <User className="h-7 w-7 text-emerald-400" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-lg font-medium text-gray-100 text-center mb-1">
          Enter the room
        </h2>
        <p className="text-sm text-center mb-6">
          <span className="text-gray-500">Room: </span>
          <span className="text-emerald-400">{roomId}</span>
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Your name in the void..."
            maxLength={24}
            aria-invalid={!!error}
            aria-describedby={error ? "username-error" : undefined}
            className={`w-full bg-gray-800 border rounded-xl px-4 py-3 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-1 transition-colors ${
              error !== null
                ? "border-red-500 focus:border-red-500 focus:ring-red-500/50"
                : "border-gray-700 focus:border-emerald-500 focus:ring-emerald-500/50"
            }`}
          />
          {error && (
            <p id="username-error" className="text-red-400 text-xs mt-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={!username.trim()}
            className="w-full mt-4 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl px-4 py-3 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          >
            Enter Room
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
