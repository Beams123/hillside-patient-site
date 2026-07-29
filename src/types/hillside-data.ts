export const programCodes = ["CSS", "ATS"] as const;
export const staffDirectoryGroups = [
  "Leadership",
  "Counselors",
  "Case Managers",
  "Staff",
] as const;
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
export type StaffDirectoryGroup = (typeof staffDirectoryGroups)[number];
export type WeekDay = (typeof weekDays)[number];

export type ScheduleGroup = {
  time: string;
  timeValue: string;
  topic: string;
  facilitator: string;
  location: string;
};

export type ScheduleActivity = {
  time: string;
  timeValue: string;
  title: string;
};

export type ScheduleDay = {
  day: WeekDay;
  date: string;
  groups: ScheduleGroup[];
  activities: ScheduleActivity[];
};

export type WeeklyProgramSchedule = {
  id: Lowercase<ProgramCode>;
  label: "Program schedule";
  title: ProgramCode;
  days: ScheduleDay[];
};

export type MenuDay = {
  day: WeekDay;
  date: string;
  breakfast: string[];
  lunch: string[];
  dinner: string[];
  soupOfTheDay: string[];
};

export type StaffMember = {
  slug: string;
  name: string;
  title: string;
  departments: string[];
  bio: string;
  directoryGroup: StaffDirectoryGroup;
  displayOrder: number;
  email: string;
  portraitUrl: string;
};

export type HillsidePublicData = {
  generatedAt: string;
  scheduleDate: string;
  weekLabel: string;
  schedules: WeeklyProgramSchedule[];
  menu: MenuDay[];
  staff: StaffMember[];
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
