import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { readFile } from "fs/promises";
import { join } from "path";

export default async function TermsPage() {
  let content = "";
  try {
    content = await readFile(join(process.cwd(), "docs", "terms-and-conditions.md"), "utf-8");
  } catch {
    content = "Terms and conditions document not found.";
  }

  const lines = content.split("\n");
  const htmlLines: string[] = [];
  let inList = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith("# ")) {
      if (inList) { htmlLines.push("</ul>"); inList = false; }
      htmlLines.push(`<h1 class="text-2xl font-bold text-gray-100 mt-8 mb-4">${esc(trimmed.slice(2))}</h1>`);
    } else if (trimmed.startsWith("## ")) {
      if (inList) { htmlLines.push("</ul>"); inList = false; }
      htmlLines.push(`<h2 class="text-xl font-semibold text-gray-200 mt-6 mb-3">${esc(trimmed.slice(3))}</h2>`);
    } else if (trimmed.startsWith("### ")) {
      if (inList) { htmlLines.push("</ul>"); inList = false; }
      htmlLines.push(`<h3 class="text-lg font-medium text-gray-300 mt-4 mb-2">${esc(trimmed.slice(4))}</h3>`);
    } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      if (!inList) { htmlLines.push('<ul class="list-disc list-inside space-y-1 mb-3 text-gray-400">'); inList = true; }
      htmlLines.push(`<li>${formatInline(trimmed.slice(2))}</li>`);
    } else if (trimmed === "---") {
      if (inList) { htmlLines.push("</ul>"); inList = false; }
      htmlLines.push('<hr class="border-gray-800 my-6" />');
    } else if (trimmed === "") {
      if (inList) { htmlLines.push("</ul>"); inList = false; }
    } else if (trimmed.startsWith("> ")) {
      if (inList) { htmlLines.push("</ul>"); inList = false; }
      htmlLines.push(`<blockquote class="border-l-2 border-gray-700 pl-4 italic text-gray-500 my-3">${formatInline(trimmed.slice(2))}</blockquote>`);
    } else {
      if (inList) { htmlLines.push("</ul>"); inList = false; }
      htmlLines.push(`<p class="text-gray-400 mb-3 leading-relaxed">${formatInline(trimmed)}</p>`);
    }
  }
  if (inList) htmlLines.push("</ul>");

  return (
    <div className="min-h-dvh bg-gray-950 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to VoltChat
        </Link>
        <article
          className="prose prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: htmlLines.join("\n") }}
        />
      </div>
    </div>
  );
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function formatInline(s: string): string {
  let result = esc(s);
  result = result.replace(/\*\*(.+?)\*\*/g, '<strong class="text-gray-200">$1</strong>');
  result = result.replace(/\*(.+?)\*/g, '<em>$1</em>');
  result = result.replace(/`(.+?)`/g, '<code class="bg-gray-800 px-1 rounded text-xs">$1</code>');
  return result;
}
