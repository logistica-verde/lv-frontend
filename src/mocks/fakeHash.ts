const WORDS_PER_HASH = 8

export function fakeHash(seed: number): string {
  let state = Math.imul(seed + 1, 2_654_435_761) >>> 0
  const words: string[] = []
  for (let index = 0; index < WORDS_PER_HASH; index++) {
    state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0
    words.push(state.toString(16).padStart(8, '0'))
  }
  return words.join('')
}
