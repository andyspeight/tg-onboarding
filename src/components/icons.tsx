/**
 * Small inline icon set. Inline SVG keeps the dependency surface at zero and
 * lets every icon inherit `currentColor`. All accept standard SVG props.
 * One family, one stroke weight (1.75) — never mix in emoji or other sets.
 */
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function CheckIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m20 6-11 11-5-5" />
    </svg>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

export function PlayIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M7 5.5v13l11-6.5-11-6.5Z" />
    </svg>
  );
}

export function ArticleIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6 3h9l5 5v13a0 0 0 0 1 0 0H6a0 0 0 0 1 0 0V3Z" />
      <path d="M14 3v6h6" />
      <path d="M9 13h6M9 17h6" />
    </svg>
  );
}

export function LockIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}

export function SunIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

export function MoonIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
    </svg>
  );
}

export function SparkleIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3.5 13.6 9 19 10.5 13.6 12 12 17.5 10.4 12 5 10.5 10.4 9 12 3.5Z" />
      <path d="M18.5 4.5 19 6l1.5.5L19 7l-.5 1.5L18 7l-1.5-.5L18 6l.5-1.5Z" />
    </svg>
  );
}

export function BellIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </svg>
  );
}

export function AlertTriangleIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M10.3 4.2 2.6 18a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4M12 17h.01" />
    </svg>
  );
}

export function ClipboardCheckIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1H9V4Z" />
      <path d="m9 13 2 2 4-4" />
    </svg>
  );
}

export function PencilIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z" />
    </svg>
  );
}

export function FolderIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z" />
      <path d="M14 2v6h6" />
    </svg>
  );
}

export function BookIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2V3Z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7V3Z" />
    </svg>
  );
}

export function ChatIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10Z" />
    </svg>
  );
}

export function WrenchIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M14.7 6.3a4.5 4.5 0 0 0-6 5.6L3 17.6a2 2 0 1 0 2.8 2.8l5.7-5.7a4.5 4.5 0 0 0 5.6-6L14 11.8l-2.3-.6-.6-2.3 3.6-2.6Z" />
    </svg>
  );
}
