import Image from "next/image";

export const KANG_CAGEUR_POSES = {
  clipboard: "/kang-cageur-clipboard.svg",
  welcome: "/kang-cageur-welcome.svg",
  map: "/kang-cageur-map.svg",
  scanner: "/kang-cageur-scanner.svg",
  magnifier: "/kang-cageur-magnifier.svg",
  budget: "/kang-cageur-budget.svg",
  "phone-hold": "/kang-cageur-phone-hold.svg",
  thumbsup: "/kang-cageur-thumbsup.svg",
  "misi-baru": "/kang-cageur-misi-baru.svg",
} as const;

export type KangCageurPose = keyof typeof KANG_CAGEUR_POSES;

export function KangCageur({
  pose,
  size = 140,
  className = "",
}: {
  pose: KangCageurPose;
  size?: number;
  className?: string;
}) {
  return (
    <Image
      src={KANG_CAGEUR_POSES[pose]}
      alt="Kang Cageur"
      width={size}
      height={size}
      className={`select-none ${className}`}
      priority={false}
    />
  );
}
