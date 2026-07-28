export const programCodes = ["CSS", "ATS"] as const;
export const weekDays = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

export type ProgramCode = (typeof programCodes)[number];
export type WeekDay = (typeof weekDays)[number];

export type ScheduleGroup = {
  time: string;
  timeValue: string;
  topic: string;
  facilitator: string;
};

export type ProgramSchedule = {
  id: Lowercase<ProgramCode>;
  label: "Program schedule";
  title: ProgramCode;
  groups: ScheduleGroup[];
};

export type MenuDay = {
  day: WeekDay;
  date: string;
  breakfast: string;
  lunch: string;
  dinner: string;
  snack: string;
};

export type HillsidePublicData = {
  generatedAt: string;
  scheduleDate: string;
  weekLabel: string;
  schedules: ProgramSchedule[];
  menu: MenuDay[];
};

export type HillsideDataResult =
  | {
      status: "available";
      data: HillsidePublicData;
    }
  | {
      status: "not-configured" | "unavailable";
      data: null;
    };
