/**
 * KCA monogram — K, C and A overlapping, with a small keystone wedge
 * (wide at the top, narrow at the bottom, like a real arch keystone)
 * inlaid in the negative space between C and A.
 */
export function KeystoneMonogram({
  size = 40,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <div
      className={`relative inline-flex items-baseline font-display font-semibold ${className ?? ""}`}
      style={{ fontSize: size, lineHeight: 1 }}
      aria-hidden
    >
      <span className="relative z-[3] -mr-[0.14em] text-gold">K</span>
      <span className="relative z-[2] -mr-[0.30em] text-gold-light/90">C</span>
      <span className="relative z-[1] text-gold">A</span>
      <span
        className="absolute z-[4] bg-navy"
        style={{
          left: "55.5%",
          top: "33%",
          width: "0.185em",
          height: "0.23em",
          clipPath: "polygon(0 0, 100% 0, 74% 100%, 26% 100%)",
          boxShadow: "0 0 0 1.5px var(--gold-light)",
        }}
      />
    </div>
  );
}
