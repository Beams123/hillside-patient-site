type WeekEntry = {
  day: string;
};

export function orderWeekSundayFirst<T extends WeekEntry>(
  days: readonly T[],
): T[] {
  const sundayIndex = days.findIndex((day) => day.day === "Sunday");

  if (sundayIndex <= 0) {
    return [...days];
  }

  return [...days.slice(sundayIndex), ...days.slice(0, sundayIndex)];
}
