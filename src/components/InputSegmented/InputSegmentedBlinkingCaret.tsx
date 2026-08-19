/**
 * A blinking caret painted on an empty active slot. The real input is hidden,
 * so we paint our own caret to tell the user where the next keystroke will land.
 *
 * Honors `prefers-reduced-motion`: the blink animation is replaced with a
 * static caret to comply with WCAG 2.3.3 (no motion the user can't pause).
 */
export function InputSegmentedBlinkingCaret() {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <div className="h-4 w-px animate-caret-blink bg-foreground duration-1000 motion-reduce:animate-none" />
    </div>
  )
}
