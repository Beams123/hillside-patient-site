export type PatientRequestKind =
  | "grievance"
  | "package"
  | "visitor";

export type PatientRequestMode = "live" | "test" | "unavailable";

export const patientRequestRetentionPolicy =
  "Management must apply Hillside’s approved records-retention schedule.";

export const visitationWindow = "2:00–5:00 PM";

export const allowedVisitationDays = [
  "Tuesday",
  "Thursday",
  "Saturday",
  "Sunday",
] as const;
