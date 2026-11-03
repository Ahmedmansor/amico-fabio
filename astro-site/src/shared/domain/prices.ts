/** One final amount: a supplied final price wins, including explicit zero. */
export function finalPrice(base: string | undefined, final: string | undefined, context: string, allowFree = false): number {
  const value = final?.trim() || base?.trim() || (allowFree ? '0' : '');
  if (!value) throw new Error(`[${context}] Missing required price (both final and base are blank).`);
  if (!/^\d+(?:\.\d+)?$/.test(value) || !Number.isFinite(Number(value))) {
    throw new Error(`[${context}] Invalid price: ${JSON.stringify(value)}.`);
  }
  return Number(value);
}
