/** Stessa logica di BracketSeeder.nextPowerOfTwo lato backend: la più piccola potenza di 2 >= n. */
export function nextPowerOfTwo(n: number): number {
  let size = 1;
  while (size < n) {
    size *= 2;
  }
  return size;
}
