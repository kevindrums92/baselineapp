type Props = {
  size?: number;
  className?: string;
};

export default function LogoMark({ size = 22, className }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="ssg" x1="20" y1="0" x2="80" y2="0" gradientUnits="userSpaceOnUse">
          <stop stopColor="#63E691" />
          <stop offset="1" stopColor="#36D089" />
        </linearGradient>
      </defs>

      {/* top bar */}
      <g className="ss-bar ss-top">
        <rect x="18" y="28" width="64" height="18" rx="9" fill="url(#ssg)" transform="rotate(-6 50 37)" />
      </g>

      {/* bottom bar */}
      <g className="ss-bar ss-bottom">
        <rect x="18" y="54" width="64" height="18" rx="9" fill="url(#ssg)" transform="rotate(-6 50 63)" />
      </g>
    </svg>
  );
}
