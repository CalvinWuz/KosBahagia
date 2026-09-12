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
      <path d="M3 7h15a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M3 7V5.5A1.5 1.5 0 0 1 4.5 4H16v3" />
      <circle cx="16" cy="14" r="1.2" />
    </Svg>
  );
}

export function IconDaun(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M5 19c0-8 5-13 14-13-1 8-5 13-13 13" />
      <path d="M6 18c2-4 5-7 9-9" />
    </Svg>
  );
}

export function IconPasangan(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="9" cy="8" r="3" />
      <circle cx="16.5" cy="9" r="2.5" />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
      <path d="M14.5 19a4 4 0 0 1 6.5-3" />
    </Svg>
  );
}

export function IconKampus(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m2 9 10-5 10 5-10 5z" />
      <path d="M6 11.5V16c0 1.5 3 3 6 3s6-1.5 6-3v-4.5" />
      <path d="M22 9v6" />
    </Svg>
  );
}

export function IconShower(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 20V6a3 3 0 0 1 3-3h1a3 3 0 0 1 3 3v1" />
      <path d="M8 7h6" />
      <path d="M11 6v3" />
      <path d="M8 13v1M11 13v1M14 13v1M9.5 17v1M12.5 17v1" />
    </Svg>
  );
}

export function IconBulan(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
      <path d="m3 3 18 18" />
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
      <circle cx="13" cy="4" r="1.5" />
      <path d="m9 21 2-6 3 2v4" />
      <path d="m9 12 2-4 3 1 2 3h2" />
      <path d="m11 8-3 2-1 4" />
    </Svg>
  );
}

export function IconPengukur(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3 17 17 3l4 4L7 21z" />
      <path d="m8 8 2 2M11 5l2 2M14 8l2 2M5 11l2 2" />
    </Svg>
  );
}

export function IconCatatan(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6 3h9l4 4v14H6z" />
      <path d="M15 3v4h4" />
      <path d="M9 12h7M9 16h7" />
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
