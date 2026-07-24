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

/**
 * Ilustrasi Kang Cageur punya rasio tinggi:lebar berbeda-beda per pose, jadi
 * dipakai lewat <img> biasa (bukan next/image) dengan tinggi tetap dan lebar
 * menyesuaikan supaya tidak gepeng/melar.
 */
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
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={KANG_CAGEUR_POSES[pose]}
      alt="Kang Cageur"
      height={size}
      style={{ height: size, width: "auto" }}
      className={`select-none ${className}`}
    />
  );
}
