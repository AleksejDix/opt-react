import { useInputSegmentedTranslation } from "./InputSegmented.translation"

const NAMESPACE = "mdc-ui-components"

/**
 * Visually hidden aria-live region announcing typing progress to screen reader
 * users. The visible slot divs are aria-hidden (they're presentational), so
 * without this region a screen reader user gets no feedback while typing.
 */
type Props = {
  filledCount: number
  maxLength: number
  isComplete: boolean
}

export function InputSegmentedLiveRegion({ filledCount, maxLength, isComplete }: Props) {
  const { t } = useInputSegmentedTranslation(NAMESPACE)

  const message = isComplete
    ? t("status.complete", { maxLength })
    : filledCount === 0
      ? t("status.empty", { maxLength })
      : t("status.progress", { filledCount, maxLength })

  return (
    <div role="status" aria-live="polite" className="sr-only">
      {message}
    </div>
  )
}
