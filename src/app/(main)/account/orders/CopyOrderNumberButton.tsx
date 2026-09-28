"use client";

import { useState } from "react";

type Props = {
  valueToCopy: string;
  className?: string;
};

export default function CopyOrderNumberButton({ valueToCopy, className }: Props) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!valueToCopy) return;
    try {
      await navigator.clipboard.writeText(valueToCopy);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch (err) {
      // Fallback for older browsers / non-secure contexts.
      try {
        const textarea = document.createElement("textarea");
        textarea.value = valueToCopy;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        textarea.style.top = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1200);
      } catch (fallbackErr) {
        console.error("Failed to copy order number:", err, fallbackErr);
      }
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      disabled={!valueToCopy}
      className={
        className ??
        "px-2 py-1 rounded-md border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed w-fit font-open-sans font-extrabold text-sm cursor-pointer"
      }
    >
      {copied ? "Copied!" : "Click to copy order number"}
    </button>
  );
}

