export const SPOKEN_THRESHOLDS_M = [500, 200, 50] as const

export function isVoiceSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined'
}

export function speak(text: string): void {
  if (!isVoiceSupported()) {
    return
  }
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'pt-BR'
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(utterance)
}

export function stopSpeaking(): void {
  if (isVoiceSupported()) {
    window.speechSynthesis.cancel()
  }
}

export function crossedSpokenThreshold(distanceM: number, already: ReadonlySet<number>): number | null {
  const crossed = SPOKEN_THRESHOLDS_M.filter((limit) => distanceM <= limit && !already.has(limit))
  const smallest = Math.min(...crossed)
  return Number.isFinite(smallest) ? smallest : null
}

export function phraseFor(threshold: number, stopName: string): string {
  if (threshold <= 50) {
    return `Você chegou em ${stopName}.`
  }
  return `Em ${threshold} metros, chegada em ${stopName}.`
}
