/** 補成兩位數，如 3 → '03' */
export function padNumber(n: number) {
  return String(n).padStart(2, '0')
}
