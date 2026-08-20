"use client";

import { useRef } from "react";
import MicButton from "@/components/ui/MicButton";

// The homepage search is a plain `<form action="/vehicles">` (no JS
// submission) so it works with JS disabled. Only this input needs to be a
// client island — the mic writes into an uncontrolled field via ref, then
// submits the surrounding form natively through `input.form`.
export default function HeroSearchInput({ placeholder }) {
  const inputRef = useRef(null);

  return (
    <div className="relative">
      <input
        ref={inputRef}
        name="q"
        className="h-11 w-full rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-input)] px-3.5 pe-11 text-sm text-[var(--hw-text-primary)] outline-none focus:border-[var(--hw-orange)] sm:h-12 sm:px-4"
        placeholder={placeholder}
      />
      <MicButton
        className="absolute inset-y-0 end-2 my-auto"
        onResult={(text) => {
          if (inputRef.current) inputRef.current.value = text;
        }}
        onFinal={() => {
          setTimeout(() => inputRef.current?.form?.requestSubmit(), 350);
        }}
      />
    </div>
  );
}
