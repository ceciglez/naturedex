"use client";

import { useRouter } from "next/navigation";
import { requestHeadingPermission } from "@/hooks/useHeading";

/** START SCAN: asks for compass access (iOS needs a tap for it), then opens the map. */
export function StartButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={async () => {
        await requestHeadingPermission();
        router.push("/map");
      }}
      className="mt-[77px] flex w-60 items-center justify-center border-[3px] border-ink bg-sun px-[22px] py-[15px] font-display text-base text-ink shadow-[4px_4px_0_#45243555] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_#45243555]"
    >
      START SCAN
    </button>
  );
}
