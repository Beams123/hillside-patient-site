import type { MenuDay, ProgramCode } from "@/types/hillside-data";

export type MealKey = Extract<
  keyof MenuDay,
  "breakfast" | "lunch" | "dinner"
>;

export type ProgramMealTime = {
  key: MealKey;
  label: "Breakfast" | "Lunch" | "Dinner";
  time: string;
  timeValue: string;
};

export const programMealTimes: Record<
  ProgramCode,
  readonly ProgramMealTime[]
> = {
  ATS: [
    {
      key: "breakfast",
      label: "Breakfast",
      time: "8:30 AM",
      timeValue: "08:30",
    },
    {
      key: "lunch",
      label: "Lunch",
      time: "12:30 PM",
      timeValue: "12:30",
    },
    {
      key: "dinner",
      label: "Dinner",
      time: "5:30 PM",
      timeValue: "17:30",
    },
  ],
  CSS: [
    {
      key: "breakfast",
      label: "Breakfast",
      time: "8:00 AM",
      timeValue: "08:00",
    },
    {
      key: "lunch",
      label: "Lunch",
      time: "12:00 PM",
      timeValue: "12:00",
    },
    {
      key: "dinner",
      label: "Dinner",
      time: "5:00 PM",
      timeValue: "17:00",
    },
  ],
};
