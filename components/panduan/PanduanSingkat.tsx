import { TawaranTutorial } from "./TutorialBagian";

// Homepage: one small line pointing to the guide, offered once on this
// browser (it replaced the three-step card). The search above stays first;
// the steps themselves live on /cara-menggunakan, and each main section has
// its own short tutorial (TutorialBagian).
export function PanduanSingkat() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4">
      <TawaranTutorial kelompok="beranda" href="/cara-menggunakan" />
    </div>
  );
}
