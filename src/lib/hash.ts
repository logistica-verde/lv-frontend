const HEAD_LENGTH = 6
const TAIL_LENGTH = 4

export function truncateMiddle(value: string, head = HEAD_LENGTH, tail = TAIL_LENGTH): string {
  if (value.length <= head + tail + 1) {
    return value
  }
  return `${value.slice(0, head)}…${value.slice(-tail)}`
}
