import React from 'react';

/** Document/page icon */
export function PageIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="14" y2="17" />
    </svg>
  );
}

/** Checklist/task icon */
export function TaskIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <path d="M5 6.5l1.5 1.5L9 5" />
      <line x1="13" y1="6" x2="21" y2="6" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <line x1="13" y1="17" x2="21" y2="17" />
    </svg>
  );
}

/** Check mark icon */
export function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <polyline points="5 12 10 17 19 7" />
    </svg>
  );
}

/** Plus icon */
export function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

/** Sun icon (light mode) */
export function SunIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

/** Moon icon (dark mode) */
export function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

/** Graph/network icon */
export function GraphIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <circle cx="6" cy="6" r="3" />
      <circle cx="18" cy="6" r="3" />
      <circle cx="12" cy="18" r="3" />
      <line x1="8.5" y1="7.5" x2="10" y2="16" />
      <line x1="15.5" y1="7.5" x2="14" y2="16" />
      <line x1="9" y1="6" x2="15" y2="6" />
    </svg>
  );
}

/** Calendar icon */
export function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

/** Drag handle icon */
export function DragIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <circle cx="9" cy="6" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="15" cy="6" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="9" cy="12" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="15" cy="12" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="9" cy="18" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="15" cy="18" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Heading block icon */
export function HeadingIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M6 4v16M18 4v16M6 12h12" />
    </svg>
  );
}

/** Quote block icon */
export function QuoteIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21z" />
      <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3z" />
    </svg>
  );
}

/** Code block icon */
export function CodeIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

/** Divider/line icon */
export function DividerIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <line x1="4" y1="12" x2="20" y2="12" />
    </svg>
  );
}

/** Text/paragraph icon */
export function TextIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <line x1="4" y1="7" x2="20" y2="7" />
      <line x1="4" y1="12" x2="16" y2="12" />
      <line x1="4" y1="17" x2="12" y2="17" />
    </svg>
  );
}

/** Todo/checklist block icon */
export function TodoIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <rect x="3" y="5" width="14" height="14" rx="2" />
      <path d="M7 12l2.5 2.5L14 9" />
    </svg>
  );
}
