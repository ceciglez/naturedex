"use client";

import { useState } from "react";

export function SoundToggle() {
  const [on, setOn] = useState(true);

  const option = (value: boolean, label: string) => {
    const selected = on === value;
    return (
      <button
        type="button"
        aria-pressed={selected}
        onClick={() => setOn(value)}
        className={`min-h-7 border-2 border-ink px-2.5 py-[7px] font-ui text-[11px] leading-none tracking-[1px] ${
          selected ? "bg-ink text-sun" : "bg-paper text-stone"
        }`}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="flex flex-col items-center gap-2.5" role="group" aria-label="Sound">
      <p className="font-display text-[13px] leading-none text-ink">SOUND</p>
      <div className="flex gap-2">
        {option(true, "ON")}
        {option(false, "OFF")}
      </div>
    </div>
  );
}
