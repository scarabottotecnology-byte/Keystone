export function LogoMark({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 44 44"
      fill="none"
      aria-hidden
      className="shrink-0"
    >
      <g style={{ transformOrigin: "22px 22px", animation: "rotSlow 22s linear infinite" }}>
        <path
          d="M22,3 A19,19 0 0,1 22,41 A9.5,9.5 0 0,1 22,22 A9.5,9.5 0 0,0 22,3 Z"
          fill="var(--cream)"
        />
        <path
          d="M22,41 A19,19 0 0,1 22,3 A9.5,9.5 0 0,1 22,22 A9.5,9.5 0 0,0 22,41 Z"
          fill="var(--gold)"
        />
      </g>
    </svg>
  );
}
