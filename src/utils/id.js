/** Collision-safe-enough id generator (no uuid dependency). */
let counter = 0;

export function uid(prefix = 'id') {
  counter = (counter + 1) % 100000;
  const rand =
    typeof crypto !== 'undefined' && crypto.getRandomValues
      ? crypto.getRandomValues(new Uint32Array(1))[0].toString(36)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}${counter.toString(36)}${rand}`;
}
