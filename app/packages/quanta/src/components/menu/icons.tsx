import type { SVGProps } from 'react'

/** Compact stroke icons, sized/colored by the consumer via className. */

export function ChevronRightIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M6 4l4 4-4 4" />
    </svg>
  )
}

export function ChevronLeftIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M10 4 6 8l4 4" />
    </svg>
  )
}

export function CheckIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M3.5 8.5l3 3 6-6.5" />
    </svg>
  )
}

export function SearchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <circle cx="7" cy="7" r="4.25" />
      <path d="m10.25 10.25 3 3" />
    </svg>
  )
}

export function ImageIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <rect x="2.5" y="3" width="11" height="10" rx="2" />
      <circle cx="6" cy="6.25" r="1.25" />
      <path d="m4.25 11 2.6-2.6a1 1 0 0 1 1.42 0L11.5 11.6" />
      <path d="m9.75 9.75.65-.65a1 1 0 0 1 1.42 0l1.68 1.68" />
    </svg>
  )
}

export function HeartIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      <path d="M8 13.55 6.95 12.6C3.2 9.2 1.25 7.43 1.25 5.22A3.08 3.08 0 0 1 4.38 2.1c1.28 0 2.51.74 3.12 1.88A3.55 3.55 0 0 1 10.62 2.1a3.08 3.08 0 0 1 3.13 3.12c0 2.21-1.95 3.98-5.7 7.38L8 13.55Z" />
    </svg>
  )
}

export function CircleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
      {...props}
    >
      <circle cx="8" cy="8" r="4.75" />
    </svg>
  )
}

export function SparklesIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      <path d="M6.95 1.85a.55.55 0 0 1 1.1 0c.23 2.67 1.43 3.87 4.1 4.1a.55.55 0 0 1 0 1.1c-2.67.23-3.87 1.43-4.1 4.1a.55.55 0 0 1-1.1 0c-.23-2.67-1.43-3.87-4.1-4.1a.55.55 0 0 1 0-1.1c2.67-.23 3.87-1.43 4.1-4.1Z" />
      <path d="M12.32 10.2a.38.38 0 0 1 .76 0c.11 1.25.67 1.81 1.92 1.92a.38.38 0 0 1 0 .76c-1.25.11-1.81.67-1.92 1.92a.38.38 0 0 1-.76 0c-.11-1.25-.67-1.81-1.92-1.92a.38.38 0 0 1 0-.76c1.25-.11 1.81-.67 1.92-1.92Z" />
    </svg>
  )
}

export function SunburstIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M8 1.75v3M8 11.25v3M1.75 8h3M11.25 8h3" />
      <path d="M3.58 3.58L5.7 5.7M10.3 10.3l2.12 2.12M12.42 3.58L10.3 5.7M5.7 10.3l-2.12 2.12" />
      <path d="M5.4 2.45l.8 1.9M9.8 11.65l.8 1.9M13.55 5.4l-1.9.8M4.35 9.8l-1.9.8" />
      <path d="M10.6 2.45l-.8 1.9M6.2 11.65l-.8 1.9M13.55 10.6l-1.9-.8M4.35 6.2l-1.9-.8" />
    </svg>
  )
}

export function MinusIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M3.5 8h9" />
    </svg>
  )
}

export function CloseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M4 4l8 8M12 4l-8 8" />
    </svg>
  )
}

export function FolderIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M2 5.25a1.5 1.5 0 0 1 1.5-1.5h2.3a1 1 0 0 1 .7.3l.9.9a1 1 0 0 0 .7.3h3.7A1.5 1.5 0 0 1 14 6.75v4.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 11.25v-6Z" />
    </svg>
  )
}
