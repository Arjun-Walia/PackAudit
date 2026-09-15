import type { ReactNode } from "react";

type IconProps = { title?: string };

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function Svg({ title, children }: IconProps & { children: ReactNode }) {
  const decorative = !title;
  return (
    <svg {...base} aria-hidden={decorative} role={decorative ? undefined : "img"}>
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

export function IconCamera({ title }: IconProps) {
  return (
    <Svg title={title}>
      <path d="M4.5 8.25h2.1l1.2-2.1h8.4l1.2 2.1h2.1A1.5 1.5 0 0 1 21 9.75v8.25a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18V9.75a1.5 1.5 0 0 1 1.5-1.5Z" />
      <circle cx="12" cy="13.75" r="3.1" />
    </Svg>
  );
}

export function IconRuler({ title }: IconProps) {
  return (
    <Svg title={title}>
      <path d="M4 8.5h16v7H4z" />
      <path d="M7 8.5v3M10 8.5v2M13 8.5v3M16 8.5v2M19 8.5v3" />
    </Svg>
  );
}

export function IconBarcode({ title }: IconProps) {
  return (
    <Svg title={title}>
      <path d="M4 7v10M7 7v10M8.5 7v10M11 7v10M14.5 7v10M16 7v10M20 7v10" />
    </Svg>
  );
}

export function IconDocument({ title }: IconProps) {
  return (
    <Svg title={title}>
      <path d="M7 3.75h7.5L19 8.25V20.25H7z" />
      <path d="M14.5 3.75V8.25H19" />
      <path d="M9.5 12h5M9.5 15.5h5" />
    </Svg>
  );
}

export function IconStorefront({ title }: IconProps) {
  return (
    <Svg title={title}>
      <path d="M4 10.5 5.5 6h13L20 10.5" />
      <path d="M5 10.5V19h14v-8.5" />
      <path d="M10 19v-5h4v5" />
    </Svg>
  );
}

export function IconListing({ title }: IconProps) {
  return (
    <Svg title={title}>
      <path d="M4.5 6.5h15v11h-15z" />
      <path d="M8 10h8M8 13h5" />
    </Svg>
  );
}

export function IconOfficer({ title }: IconProps) {
  return (
    <Svg title={title}>
      <circle cx="12" cy="8" r="3" />
      <path d="M5.5 19c1.2-3 3.4-4.5 6.5-4.5s5.3 1.5 6.5 4.5" />
      <path d="m16.5 12.5 1.6 1.6 3.2-3.2" />
    </Svg>
  );
}

export function IconAlert({ title }: IconProps) {
  return (
    <Svg title={title}>
      <path d="M7.8 4h8.4L21 9.8v8.4L16.2 23H7.8L3 18.2V9.8L7.8 4Z" />
      <path d="M12 9v5" />
      <circle cx="12" cy="17.2" r="0.7" fill="currentColor" stroke="none" />
    </Svg>
  );
}
