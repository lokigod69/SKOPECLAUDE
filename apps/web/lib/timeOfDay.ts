export type TimeOfDay = "dawn" | "day" | "dusk" | "night";

const dawnHours = { start: 5, end: 9 };
const dayHours = { start: 9, end: 17 };
const duskHours = { start: 17, end: 21 };

export function getTimeOfDay(date: Date = new Date()): TimeOfDay {
  const hour = date.getHours();

  if (hour >= dawnHours.start && hour < dawnHours.end) {
    return "dawn";
  }

  if (hour >= dayHours.start && hour < dayHours.end) {
    return "day";
  }

  if (hour >= duskHours.start && hour < duskHours.end) {
    return "dusk";
  }

  return "night";
}
