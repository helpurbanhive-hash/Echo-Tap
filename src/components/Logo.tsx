export function Logo({
  className = "w-8 h-8",
  variant = "light",
}: {
  className?: string;
  variant?: "light" | "dark";
}) {
  const textColor = variant === "dark" ? "#f8fafc" : "#1e1b4b";
  const primaryColor = "#4f46e5"; // Indigo 600

  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Text Path */}
      <path id="textPath" d="M 30 110 A 70 70 0 0 1 170 110" fill="none" />
      <text
        fill={textColor}
        fontSize="22"
        fontWeight="900"
        letterSpacing="2"
        fontFamily="sans-serif"
      >
        <textPath href="#textPath" startOffset="50%" textAnchor="middle">
          ECHO MIC TAP
        </textPath>
      </text>

      {/* Thick Blue Arcs */}
      <path
        d="M 40 105 A 60 60 0 0 0 95 165"
        stroke={primaryColor}
        strokeWidth="14"
        strokeLinecap="round"
      />
      <path
        d="M 160 105 A 60 60 0 0 1 105 165"
        stroke={primaryColor}
        strokeWidth="14"
        strokeLinecap="round"
      />

      {/* Inner Mic */}
      <rect x="86" y="80" width="28" height="45" rx="14" fill={primaryColor} />
      <path
        d="M 74 110 A 26 26 0 0 0 126 110"
        stroke={primaryColor}
        strokeWidth="4"
        strokeLinecap="round"
      />
      <line
        x1="100"
        y1="136"
        x2="100"
        y2="150"
        stroke={primaryColor}
        strokeWidth="4"
        strokeLinecap="round"
      />
      <line
        x1="88"
        y1="150"
        x2="112"
        y2="150"
        stroke={primaryColor}
        strokeWidth="4"
        strokeLinecap="round"
      />

      {/* Sound Waves (Left) */}
      <path
        d="M 65 90 C 55 95, 75 105, 65 110 C 55 115, 75 125, 65 130"
        stroke={textColor}
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 57 93 C 47 98, 67 108, 57 113 C 47 118, 67 128, 57 133"
        stroke={textColor}
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 49 96 C 39 101, 59 111, 49 116 C 39 121, 59 131, 49 136"
        stroke={textColor}
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Sound Waves (Right) */}
      <path
        d="M 135 90 C 145 95, 125 105, 135 110 C 145 115, 125 125, 135 130"
        stroke={textColor}
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 143 93 C 153 98, 133 108, 143 113 C 153 118, 133 128, 143 133"
        stroke={textColor}
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 151 96 C 161 101, 141 111, 151 116 C 161 121, 141 131, 151 136"
        stroke={textColor}
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
