import type { Metadata, Viewport } from "next";
import { DotGothic16, Press_Start_2P, Silkscreen } from "next/font/google";
import "./globals.css";
import { TONE_KEY } from "@/lib/tone";

const pressStart = Press_Start_2P({
  variable: "--font-press-start",
  weight: "400",
  subsets: ["latin"],
});

const silkscreen = Silkscreen({
  variable: "--font-silkscreen",
  weight: ["400", "700"],
  subsets: ["latin"],
});

const dotGothic = DotGothic16({
  variable: "--font-dotgothic",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Naturedex",
  description: "Catch what's really out there — a nature radar built on iNaturalist and OpenStreetMap.",
  appleWebApp: { capable: true, title: "Naturedex", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#452435",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-tone="color"
      suppressHydrationWarning
      className={`${pressStart.variable} ${silkscreen.variable} ${dotGothic.variable} h-full`}
    >
      <head>
        {/* Apply the remembered colour / 1-bit tone before first paint. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem("${TONE_KEY}")==="mono")document.documentElement.dataset.tone="mono"}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-full">
        {/* Phone-sized stage: full-bleed on phones, centred 390px column on larger screens. */}
        <div className="relative mx-auto min-h-dvh w-full max-w-[390px] overflow-hidden">{children}</div>
      </body>
    </html>
  );
}
