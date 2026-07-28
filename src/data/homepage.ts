export type ScheduleGroup = {
  time: string;
  timeValue: string;
  topic: string;
  facilitator: string;
};

export type ProgramSchedule = {
  id: string;
  label: string;
  title: string;
  location: string;
  groups: ScheduleGroup[];
};

export type ResourcePreview = {
  id: string;
  title: string;
  description: string;
  status: "Planned";
  icon:
    | "menu"
    | "directory"
    | "forms"
    | "appointments"
    | "facility"
    | "resources";
};

export const navigationItems = [
  { label: "Today", href: "#top" },
  { label: "Schedule", href: "#schedule" },
  { label: "Resources", href: "#resources" },
  { label: "Info", href: "#information" },
] as const;

export const homepageContent = {
  eyebrow: "Welcome to Hillside",
  title: "Today at Hillside",
  previewLabel: "Site preview",
  introduction:
    "A simple, welcoming place to see the day ahead and find useful facility information.",
  scheduleNote:
    "The times, topics, locations, and facilitator labels below are placeholders for design review—not an active Hillside schedule.",
  quickLook: [
    "Review the sample schedule for your program area.",
    "See which patient resource pages are planned next.",
    "Ask a staff member whenever you need help finding information.",
  ],
} as const;

export const programSchedules: ProgramSchedule[] = [
  {
    id: "asam-37",
    label: "Program area",
    title: "ASAM 3.7",
    location: "Location to be confirmed",
    groups: [
      {
        time: "9:00 AM",
        timeValue: "09:00",
        topic: "Morning check-in",
        facilitator: "Program staff",
      },
      {
        time: "10:30 AM",
        timeValue: "10:30",
        topic: "Wellness discussion",
        facilitator: "Team member",
      },
      {
        time: "1:00 PM",
        timeValue: "13:00",
        topic: "Daily skills group",
        facilitator: "Program staff",
      },
      {
        time: "3:00 PM",
        timeValue: "15:00",
        topic: "Afternoon reflection",
        facilitator: "Team member",
      },
    ],
  },
  {
    id: "asam-35",
    label: "Program area",
    title: "ASAM 3.5",
    location: "Location to be confirmed",
    groups: [
      {
        time: "9:30 AM",
        timeValue: "09:30",
        topic: "Daily planning",
        facilitator: "Program staff",
      },
      {
        time: "11:00 AM",
        timeValue: "11:00",
        topic: "Community discussion",
        facilitator: "Team member",
      },
      {
        time: "1:30 PM",
        timeValue: "13:30",
        topic: "Guided activity",
        facilitator: "Program staff",
      },
      {
        time: "3:30 PM",
        timeValue: "15:30",
        topic: "Community wrap-up",
        facilitator: "Team member",
      },
    ],
  },
];

export const resourcePreviews: ResourcePreview[] = [
  {
    id: "weekly-menu",
    title: "Weekly menu",
    description: "See breakfast, lunch, dinner, and snack information by day.",
    status: "Planned",
    icon: "menu",
  },
  {
    id: "staff-directory",
    title: "Staff directory",
    description: "Find staff names, roles, and general contact guidance.",
    status: "Planned",
    icon: "directory",
  },
  {
    id: "request-forms",
    title: "Request forms",
    description:
      "Find common facility requests in one place after privacy review.",
    status: "Planned",
    icon: "forms",
  },
  {
    id: "appointments",
    title: "Appointments",
    description: "Review general appointment guidance and what to bring.",
    status: "Planned",
    icon: "appointments",
  },
  {
    id: "facility-guide",
    title: "Facility guide",
    description: "Find shared spaces, daily expectations, and useful contacts.",
    status: "Planned",
    icon: "facility",
  },
  {
    id: "patient-resources",
    title: "Other resources",
    description: "Explore helpful information selected for the Hillside site.",
    status: "Planned",
    icon: "resources",
  },
];
