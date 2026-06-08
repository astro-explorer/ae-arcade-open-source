/** Sleeps for a given number of milliseconds. */
export async function sleep(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
