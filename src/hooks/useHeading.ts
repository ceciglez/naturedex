"use client";

import { useEffect, useState } from "react";

type OrientationEvent = DeviceOrientationEvent & { webkitCompassHeading?: number };

/** Compass heading in degrees (0 = north), or null when the device doesn't report one. */
export function useHeading(): number | null {
  const [heading, setHeading] = useState<number | null>(null);

  useEffect(() => {
    const onOrient = (e: OrientationEvent) => {
      if (typeof e.webkitCompassHeading === "number") setHeading(e.webkitCompassHeading);
      else if (e.absolute && typeof e.alpha === "number") setHeading((360 - e.alpha) % 360);
    };
    const absolute = "ondeviceorientationabsolute" in window;
    const type = absolute ? "deviceorientationabsolute" : "deviceorientation";
    window.addEventListener(type, onOrient as EventListener);
    return () => window.removeEventListener(type, onOrient as EventListener);
  }, []);

  return heading;
}

/** iOS only reports orientation after a permission prompt, which must come from a tap. */
export async function requestHeadingPermission(): Promise<void> {
  const DOE = (globalThis as { DeviceOrientationEvent?: { requestPermission?: () => Promise<string> } }).DeviceOrientationEvent;
  try {
    await DOE?.requestPermission?.();
  } catch {}
}
