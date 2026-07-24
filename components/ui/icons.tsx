import type { SVGProps } from "react";

export interface IconProps extends SVGProps<SVGSVGElement> {
  size?: number;
}

function base({ size = 20, strokeWidth = 1.7, className = "", ...rest }: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none" as const,
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
    "aria-hidden": true,
    ...rest,
  };
}

/**
 * Set ikon inline (bukan file .svg terpisah) supaya warnanya mengikuti
 * `currentColor` dari className teks di sekitarnya, dan pixel-perfect sesuai
 * design system Cageur Rekening Quest (bagian 6 pada brief desain).
 */
export function IconDompet(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3" y="6" width="18" height="13" rx="3" />
      <path d="M3 10h18" />
      <circle cx="16.5" cy="14" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconKoin(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="9" />
      <text x="12" y="15.5" fontSize="8.5" textAnchor="middle" fill="currentColor" stroke="none" fontFamily="inherit" fontWeight={800}>
        Rp
      </text>
    </svg>
  );
}

export function IconKeranjang(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 8h16l-2 9a2 2 0 0 1-2 1.6H8A2 2 0 0 1 6 17z" />
      <path d="M8 8l2-4h4l2 4" />
      <circle cx="9" cy="21" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="16" cy="21" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconSmartphone(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="6" y="2" width="12" height="20" rx="3" />
      <line x1="10" y1="19" x2="14" y2="19" />
    </svg>
  );
}

export function IconKacaPembesar(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <line x1="15.5" y1="15.5" x2="21" y2="21" />
    </svg>
  );
}

export function IconTarget(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5.2" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconChecklist(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <path d="M8 12.5l2.5 2.5L16 9.5" />
    </svg>
  );
}

export function IconBadge(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 2l3 6 6 1-4.5 4.5L17.5 21 12 17.5 6.5 21l1-7.5L3 9l6-1z" strokeLinejoin="round" />
    </svg>
  );
}

export function IconKalender(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <line x1="8" y1="2.5" x2="8" y2="6" />
      <line x1="16" y1="2.5" x2="16" y2="6" />
    </svg>
  );
}

export function IconTimer(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="13" r="8" />
      <line x1="12" y1="13" x2="12" y2="9" />
      <line x1="12" y1="13" x2="15" y2="14.5" />
      <line x1="10" y1="2.5" x2="14" y2="2.5" />
    </svg>
  );
}

export function IconTanaman(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M6 21h12" />
      <path d="M12 21v-8" />
      <path d="M12 13c-3 0-5-2-5-5 3 0 5 1 5 3 0-2 2-3 5-3 0 3-2 5-5 5z" />
    </svg>
  );
}

export function IconStruk(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M6 3h12v17l-2-1.4L14 20l-2-1.4L10 20l-2-1.4L6 20z" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="9" y1="12" x2="15" y2="12" />
    </svg>
  );
}

export function IconDashboard(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3" y="4" width="18" height="16" rx="3" />
      <rect x="6" y="13" width="3" height="4" fill="currentColor" stroke="none" />
      <rect x="10.5" y="10" width="3" height="7" fill="currentColor" stroke="none" />
      <rect x="15" y="7" width="3" height="10" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconGembok(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

export function IconCampaign(props: IconProps) {
  return (
    <svg {...base(props)}>
      <line x1="6" y1="21" x2="6" y2="3" />
      <path d="M6 4h11l-2.5 3.5L17 11H6" />
    </svg>
  );
}

export function IconPodium(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3" y="14" width="5" height="7" rx="1" />
      <rect x="9.5" y="9" width="5" height="12" rx="1" />
      <rect x="16" y="12" width="5" height="9" rx="1" />
    </svg>
  );
}

export function IconSpeaker(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 10v4h3l4 4V6l-4 4z" />
      <path d="M16 9a4 4 0 0 1 0 6" />
    </svg>
  );
}

export function IconSpeakerOff(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 10v4h3l4 4V6l-4 4z" />
      <line x1="15.5" y1="9.5" x2="20.5" y2="14.5" />
      <line x1="20.5" y1="9.5" x2="15.5" y2="14.5" />
    </svg>
  );
}

export function IconShare(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="6" cy="12" r="2.4" />
      <circle cx="18" cy="6" r="2.4" />
      <circle cx="18" cy="18" r="2.4" />
      <line x1="8.1" y1="11" x2="15.9" y2="7" />
      <line x1="8.1" y1="13" x2="15.9" y2="17" />
    </svg>
  );
}

export function IconExport(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M7 3h7l4 4v14H7z" />
      <line x1="12" y1="12" x2="12" y2="18" />
      <path d="M9 15.5l3 3 3-3" />
    </svg>
  );
}

export function IconPanah(props: IconProps) {
  return (
    <svg {...base({ strokeWidth: 2, ...props })}>
      <path d="M9 5l7 7-7 7" />
    </svg>
  );
}

export function IconMusicNote(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="9" cy="18" r="3" />
      <path d="M12 18V4l6 2v4" />
    </svg>
  );
}

export function IconMusicNoteOff(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="9" cy="18" r="3" />
      <path d="M12 18V4l6 2v4" />
      <line x1="4" y1="4" x2="20" y2="20" />
    </svg>
  );
}
