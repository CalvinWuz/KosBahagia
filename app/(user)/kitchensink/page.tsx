import type { Metadata } from "next";
import { Kitchensink } from "./Kitchensink";

// DEV ONLY. Renders every primitive in every state so the design system can
// be checked at 360px and 1440px. Delete this folder in task 09.
export const metadata: Metadata = {
  title: "Kitchensink",
  robots: { index: false, follow: false },
};

export default function KitchensinkPage() {
  return <Kitchensink />;
}
