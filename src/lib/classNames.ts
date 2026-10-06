type ClassName = string | false | null | undefined

export function classNames(...names: ClassName[]): string {
  return names.filter(Boolean).join(' ')
}
