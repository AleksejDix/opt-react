/**
 * Local shim replacing the library's i18n-backed translation hook so this repro
 * stays free of the i18next / react-i18next dependency chain. Strings mirror the
 * component's English bundle (locales/en/InputSegmented.json).
 */
export const useInputSegmentedTranslation = (_namespace: string) => {
  const t = (key: string, vars?: Record<string, unknown>) => {
    const fill = (template: string) =>
      template.replace(/\{\{(\w+)\}\}/g, (_match, name: string) => String(vars?.[name] ?? ""))
    switch (key) {
      case "status.empty":
        return fill("{{maxLength}}-character code, empty.")
      case "status.progress":
        return fill("{{filledCount}} of {{maxLength}} characters entered.")
      case "status.complete":
        return fill("Code complete: {{maxLength}} of {{maxLength}} characters entered.")
      default:
        return key
    }
  }
  return { t }
}
