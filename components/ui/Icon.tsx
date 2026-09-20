import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

// Hand-drawn 24px stroke icons. Decorative by default (aria-hidden);
// the surrounding control carries the accessible name.
function Svg({ children, ...props }: IconProps) {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export function IconSearch(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </Svg>
  );
}

export function IconBookmark(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6 4h12v17l-6-4-6 4z" />
    </Svg>
  );
}

export function IconCheck(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m5 12 5 5 9-10" />
    </Svg>
  );
}

export function IconChevronDown(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m6 9 6 6 6-6" />
    </Svg>
  );
}

export function IconClose(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6 6l12 12M18 6 6 18" />
    </Svg>
  );
}

export function IconSpinner(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3a9 9 0 1 0 9 9" />
    </Svg>
  );
}

// ---- preset / homepage icons
export function IconDompet(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3 8.5A2.5 2.5 0 0 1 5.5 6H19a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="currentColor" fillOpacity={0.15} stroke="none" />
      <path d="M3 8.5A2.5 2.5 0 0 1 5.5 6H19a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M3 8.5V6a2 2 0 0 1 2-2h11v2" />
      <path d="M15 11h6v5h-6a2.5 2.5 0 0 1 0-5z" fill="currentColor" fillOpacity={0.15} stroke="none" />
      <path d="M15 11h6v5h-6a2.5 2.5 0 0 1 0-5z" />
      <circle cx="17.5" cy="13.5" r="0.9" fill="currentColor" stroke="none" />
    </Svg>
  );
}

export function IconDaun(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4.5 19.5C4.5 11 10.5 5 20 4.5c-.6 9.5-6 15.5-15.5 15z" fill="currentColor" fillOpacity={0.15} stroke="none" />
      <path d="M4.5 19.5C4.5 11 10.5 5 20 4.5c-.6 9.5-6 15.5-15.5 15z" />
      <path d="M4.5 19.5c3-5 7-9 12-11.5" />
    </Svg>
  );
}

export function IconPasangan(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0z" fill="currentColor" fillOpacity={0.15} stroke="none" />
      <path d="M14.5 19a4 4 0 0 1 6.5-3.1V19z" fill="currentColor" fillOpacity={0.15} stroke="none" />
      <circle cx="9" cy="8" r="3.2" />
      <circle cx="16.5" cy="9" r="2.4" />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
      <path d="M14.5 19a4 4 0 0 1 6.5-3.1" />
      <path d="M13.5 5.2c.8-1.4 3-1.4 3.2.4-.2 1.3-1.5 2.1-1.6 2.2-.1-.1-1.4-.9-1.6-2.2" fill="currentColor" stroke="none" transform="translate(4.5 -2.6) scale(0.8)" />
    </Svg>
  );
}

export function IconKampus(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m2 9 10-5 10 5-10 5z" fill="currentColor" fillOpacity={0.15} stroke="none" />
      <path d="m2 9 10-5 10 5-10 5z" />
      <path d="M6 11.5V16c0 1.7 2.7 3 6 3s6-1.3 6-3v-4.5" />
      <path d="M22 9v5.5" />
      <circle cx="22" cy="16" r="0.9" fill="currentColor" stroke="none" />
    </Svg>
  );
}

export function IconShower(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M7.5 7h6.5a1 1 0 0 1 1 1v1.5H6.5V8a1 1 0 0 1 1-1z" fill="currentColor" fillOpacity={0.15} stroke="none" />
      <path d="M4 20V7.5A3.5 3.5 0 0 1 7.5 4h1A2.5 2.5 0 0 1 11 6.5V7" />
      <path d="M7.5 7h6.5a1 1 0 0 1 1 1v1.5H6.5V8a1 1 0 0 1 1-1z" />
      <path d="M8 13v1.5M11 13v1.5M14 13v1.5M9.5 17.5V19M12.5 17.5V19" />
    </Svg>
  );
}

export function IconBulan(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M19.5 15.2A8 8 0 0 1 8.8 4.5a8 8 0 1 0 10.7 10.7z" fill="currentColor" fillOpacity={0.15} stroke="none" />
      <path d="M19.5 15.2A8 8 0 0 1 8.8 4.5a8 8 0 1 0 10.7 10.7z" />
      <path d="m17 2.5.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z" fill="currentColor" stroke="none" />
    </Svg>
  );
}

export function IconPin(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 21s-6-5.5-6-11a6 6 0 0 1 12 0c0 5.5-6 11-6 11z" />
      <circle cx="12" cy="10" r="2" />
    </Svg>
  );
}

export function IconJalanKaki(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="13.5" cy="4" r="1.8" fill="currentColor" stroke="none" />
      <path d="M12.5 8.2 10 13l2.8 2.3V21" />
      <path d="M10 13l-2.6 3.4" />
      <path d="M12.5 8.2c1.4-.4 2.6.2 3.2 1.5l1 2 2.3.6" />
      <path d="M12.5 8.2 9.6 9.8 8.5 13" />
    </Svg>
  );
}

export function IconPengukur(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 18a8 8 0 0 1 16 0z" fill="currentColor" fillOpacity={0.15} stroke="none" />
      <path d="M4 18a8 8 0 0 1 16 0" />
      <path d="M12 18l4.2-5.6" />
      <circle cx="12" cy="18" r="1.4" fill="currentColor" stroke="none" />
      <path d="M6.2 13.2l1 .7M12 10v1.2M17.8 13.2l-1 .7" />
      <path d="M3 21h18" />
    </Svg>
  );
}

export function IconCatatan(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6 3h9l4 4v14H6z" fill="currentColor" fillOpacity={0.15} stroke="none" />
      <path d="M6 3h9l4 4v14H6z" />
      <path d="M15 3v4h4" />
      <path d="M9 12h6M9 16h4" />
      <circle cx="16" cy="16.5" r="2.6" fill="currentColor" stroke="none" />
      <path d="M16 15.2v1.6M16 18.1v.1" className="stroke-putih" strokeWidth={1.4} />
    </Svg>
  );
}

export function IconJam(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l3 2" />
    </Svg>
  );
}

// ---- search page icons
export function IconSuara(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 10v4h4l5 4V6l-5 4z" />
      <path d="m17 9 4 6M21 9l-4 6" />
    </Svg>
  );
}

export function IconHati(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z" />
    </Svg>
  );
}

export function IconBanding(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 8h13l-3-3M20 16H7l3 3" />
    </Svg>
  );
}

export function IconPeta(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m3 6 6-2 6 2 6-2v14l-6 2-6-2-6 2z" />
      <path d="M9 4v14M15 6v14" />
    </Svg>
  );
}

export function IconDaftar(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </Svg>
  );
}

export function IconKembali(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M19 12H5M11 6l-6 6 6 6" />
    </Svg>
  );
}

export function IconFilter(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 6h16M7 12h10M10 18h4" />
    </Svg>
  );
}

export function IconPutar(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M20 12a8 8 0 1 1-2.3-5.7" />
      <path d="M20 4v5h-5" />
    </Svg>
  );
}
