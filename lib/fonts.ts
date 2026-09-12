import { Plus_Jakarta_Sans } from "next/font/google";

// Single family for both surfaces. Exposed as a CSS variable that
// `--font-sans` in globals.css reads.
export const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
  display: "swap",
  variable: "--font-jakarta",
});
