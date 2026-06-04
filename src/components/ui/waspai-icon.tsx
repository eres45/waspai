export function WaspAIIcon({ className }: { className?: string }) {
  return (
    <svg
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className={className}
    >
      {/* Left Wing */}
      <path
        d="M9 11C6 8 3.5 8.5 3 10.5c-.5 2 2 3.5 6 1.5"
        fill="url(#wasp-wing-grad)"
        stroke="#1E1B4B"
        strokeWidth="1"
        strokeLinejoin="round"
        opacity="0.8"
      />
      {/* Right Wing */}
      <path
        d="M15 11C18 8 20.5 8.5 21 10.5c.5 2-2 3.5-6 1.5"
        fill="url(#wasp-wing-grad)"
        stroke="#1E1B4B"
        strokeWidth="1"
        strokeLinejoin="round"
        opacity="0.8"
      />
      {/* Abdomen / Stinger */}
      <path
        d="M12 21.5l-1.8-5h3.6l-1.8 5z"
        fill="#FBBF24"
        stroke="#1E1B4B"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      {/* Thorax */}
      <ellipse
        cx="12"
        cy="12.5"
        rx="3"
        ry="3.8"
        fill="#1E1B4B"
        stroke="#FBBF24"
        strokeWidth="1"
      />
      {/* Stripes on Thorax */}
      <path
        d="M9.8 11.5h4.4M9.5 13.5h5"
        stroke="#FBBF24"
        strokeWidth="1"
        strokeLinecap="round"
      />
      {/* Head */}
      <circle
        cx="12"
        cy="7"
        r="2.2"
        fill="#FBBF24"
        stroke="#1E1B4B"
        strokeWidth="1"
      />
      {/* Eyes */}
      <circle cx="11.2" cy="6.6" r="0.5" fill="#1E1B4B" />
      <circle cx="12.8" cy="6.6" r="0.5" fill="#1E1B4B" />
      {/* Antennae */}
      <path
        d="M11 5C10.5 3.5 9.5 3.2 8.5 3.5M13 5C13.5 3.5 14.5 3.2 15.5 3.5"
        stroke="#1E1B4B"
        strokeWidth="0.8"
        strokeLinecap="round"
      />
      <defs>
        <linearGradient id="wasp-wing-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FDE047" stopOpacity="0.8" />
          <stop offset="50%" stopColor="#38BDF8" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#0284C7" stopOpacity="0.3" />
        </linearGradient>
      </defs>
    </svg>
  );
}
