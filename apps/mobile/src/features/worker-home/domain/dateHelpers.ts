/** True when both ISO timestamps fall on the same local calendar day. */
export function isSameLocalCalendarDay(isoUtc: string, reference: Date): boolean {
  const value = new Date(isoUtc);
  return (
    value.getFullYear() === reference.getFullYear() &&
    value.getMonth() === reference.getMonth() &&
    value.getDate() === reference.getDate()
  );
}
