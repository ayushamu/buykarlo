interface BuyKarloMarkProps {
  className?: string
  title?: string
}

export function BuyKarloMark({ className, title = "BuyKarlo" }: BuyKarloMarkProps) {
  return (
    <svg
      viewBox="0 0 128 128"
      role="img"
      aria-label={title}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="buykarlo-blue" x1="30" y1="18" x2="104" y2="108" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1266FF" />
          <stop offset="1" stopColor="#1C16CF" />
        </linearGradient>
        <linearGradient id="buykarlo-orange" x1="26" y1="74" x2="82" y2="118" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFB000" />
          <stop offset="1" stopColor="#FF7A00" />
        </linearGradient>
        <filter id="buykarlo-shadow" x="8" y="6" width="112" height="116" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="10" stdDeviation="9" floodColor="#1C16CF" floodOpacity="0.18" />
        </filter>
      </defs>

      <rect x="8" y="8" width="112" height="112" rx="30" fill="white" />
      <g filter="url(#buykarlo-shadow)">
        <path
          d="M46 36c0-14.36 11.64-26 26-26s26 11.64 26 26v13.5h-12V36c0-7.73-6.27-14-14-14s-14 6.27-14 14v13.5H46V36Z"
          fill="url(#buykarlo-blue)"
        />
        <path
          d="M30 45c0-7.18 5.82-13 13-13h39c20.43 0 37 16.57 37 37v13c0 20.43-16.57 37-37 37H43c-7.18 0-13-5.82-13-13V45Z"
          fill="url(#buykarlo-blue)"
        />
        <path
          d="M30 72h50.22c13.68 0 24.78 11.09 24.78 24.78C105 109.05 95.05 119 82.78 119H43c-7.18 0-13-5.82-13-13V72Z"
          fill="url(#buykarlo-orange)"
        />
        <path d="M30 72h78" stroke="white" strokeWidth="10" strokeLinecap="round" />
        <path
          d="M50 78.5h7.5l8 24.5h30l8.5-19H66"
          fill="none"
          stroke="white"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="72" cy="111" r="6" fill="white" />
        <circle cx="96" cy="111" r="6" fill="white" />
      </g>
    </svg>
  )
}
