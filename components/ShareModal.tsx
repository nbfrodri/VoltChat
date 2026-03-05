"use client";

import { useState, useEffect } from "react";
import { X, Copy, Check, Mail, QrCode, Share2, Hash } from "lucide-react";
import { generateQRCodeSVG } from "@/lib/qrcode";

interface ShareModalProps {
  roomId: string;
  isOpen: boolean;
  onClose: () => void;
}

const SHARE_METHODS = [
  {
    id: "copy",
    label: "Copy Link",
    icon: "copy",
    color: "#10b981",
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    icon: "whatsapp",
    color: "#25D366",
  },
  {
    id: "telegram",
    label: "Telegram",
    icon: "telegram",
    color: "#0088cc",
  },
  {
    id: "twitter",
    label: "X / Twitter",
    icon: "twitter",
    color: "#e5e7eb",
  },
  {
    id: "email",
    label: "Email",
    icon: "email",
    color: "#f59e0b",
  },
  {
    id: "qr",
    label: "QR Code",
    icon: "qr",
    color: "#a855f7",
  },
] as const;

export default function ShareModal({ roomId, isOpen, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [supportsShare, setSupportsShare] = useState(false);

  useEffect(() => {
    setSupportsShare(typeof navigator !== "undefined" && !!navigator.share);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setCopied(false);
      setCodeCopied(false);
      setShowQR(false);
      setQrDataUrl(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Use current full URL to preserve query params (v=public, e2ee=1) and hash (encryption key)
  const shareUrl = typeof window !== "undefined"
    ? window.location.href
    : `/room/${roomId}`;
  const shareText = "Join the conversation — anonymous, ephemeral, zero trace.";

  async function handleNativeShare() {
    try {
      await navigator.share({
        title: "Join my VoltChat room",
        text: shareText,
        url: shareUrl,
      });
    } catch {
      // User cancelled or not supported
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard not available
    }
  }

  function handleShare(id: string) {
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedText = encodeURIComponent(`${shareText} ${shareUrl}`);

    switch (id) {
      case "copy":
        handleCopy();
        break;
      case "whatsapp":
        window.open(`https://wa.me/?text=${encodedText}`, "_blank");
        break;
      case "telegram":
        window.open(`https://t.me/share/url?url=${encodedUrl}&text=${encodeURIComponent(shareText)}`, "_blank");
        break;
      case "twitter":
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodedUrl}`, "_blank");
        break;
      case "email":
        window.open(`mailto:?subject=${encodeURIComponent("Join my VoltChat room")}&body=${encodedText}`, "_self");
        break;
      case "qr":
        if (!showQR) {
          setShowQR(true);
          generateQRCodeSVG(shareUrl, 180).then(setQrDataUrl).catch(() => setQrDataUrl(null));
        } else {
          setShowQR(false);
          setQrDataUrl(null);
        }
        break;
    }
  }

  function renderIcon(icon: string, color: string) {
    const cls = "h-5 w-5";
    switch (icon) {
      case "copy":
        return copied ? <Check className={cls} style={{ color }} /> : <Copy className={cls} style={{ color }} />;
      case "whatsapp":
        return (
          <svg className={cls} viewBox="0 0 24 24" fill={color}>
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.025.504 3.935 1.393 5.612L0 24l6.588-1.353C8.168 23.511 10.034 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.82 0-3.543-.468-5.043-1.29l-.36-.214-3.742.768.797-3.612-.236-.375A9.935 9.935 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
          </svg>
        );
      case "telegram":
        return (
          <svg className={cls} viewBox="0 0 24 24" fill={color}>
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
          </svg>
        );
      case "twitter":
        return (
          <svg className={cls} viewBox="0 0 24 24" fill={color}>
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        );
      case "email":
        return <Mail className={cls} style={{ color }} />;
      case "qr":
        return <QrCode className={cls} style={{ color }} />;
      default:
        return null;
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Share room"
    >
      <div className="w-full max-w-sm bg-gray-800 border border-gray-700 rounded-xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-gray-200">Share Room</span>
          <button
            onClick={onClose}
            className="p-0.5 text-gray-500 hover:text-gray-300"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Room URL preview */}
        <div className="bg-gray-900 rounded-lg px-3 py-2 mb-3 text-xs text-gray-400 truncate border border-gray-700">
          {shareUrl}
        </div>

        {/* Copy code button */}
        <button
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(roomId);
              setCodeCopied(true);
              setTimeout(() => setCodeCopied(false), 1500);
            } catch { /* noop */ }
          }}
          className="w-full flex items-center justify-center gap-2 bg-gray-900 border border-gray-700 hover:border-gray-600 text-gray-300 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors mb-4"
        >
          {codeCopied ? <Check className="h-4 w-4 text-emerald-400" /> : <Hash className="h-4 w-4" />}
          {codeCopied ? "Code copied!" : `Copy room code: ${roomId}`}
        </button>

        {/* Native share (mobile) */}
        {supportsShare && (
          <button
            onClick={handleNativeShare}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg px-4 py-2.5 text-sm font-medium transition-colors mb-4"
          >
            <Share2 className="h-4 w-4" />
            Share
          </button>
        )}

        {/* Share methods grid */}
        <div className="grid grid-cols-3 gap-2">
          {SHARE_METHODS.map((method) => (
            <button
              key={method.id}
              onClick={() => handleShare(method.id)}
              className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-gray-900 border border-gray-700 hover:border-gray-600 hover:bg-gray-800 transition-all"
              aria-label={method.id === "copy" && copied ? "Copied!" : method.label}
            >
              {renderIcon(method.icon, method.color)}
              <span className="text-[10px] text-gray-400">
                {method.id === "copy" && copied ? "Copied!" : method.label}
              </span>
            </button>
          ))}
        </div>

        {/* QR Code display */}
        {showQR && (
          <div className="mt-4 flex justify-center">
            {qrDataUrl ? (
              <div className="bg-white p-3 rounded-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrDataUrl}
                  alt="QR Code for room link"
                  width={180}
                  height={180}
                />
              </div>
            ) : (
              <div className="w-[180px] h-[180px] bg-gray-800 rounded-lg animate-pulse flex items-center justify-center">
                <span className="text-xs text-gray-500">Generating...</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
