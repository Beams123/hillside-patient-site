export type ResourcePreview = {
  id: string;
  title: string;
  description: string;
  status: "Available" | "Planned";
  href?: string;
  icon:
    | "menu"
    | "directory"
    | "forms"
    | "appointments"
    | "facility"
    | "resources";
};

export const navigationItems = [
  { label: "Today", href: "/" },
  { label: "Schedule", href: "/#schedule" },
  { label: "Menu", href: "/menu" },
  { label: "Resources", href: "/#resources" },
] as const;

export const homepageContent = {
  eyebrow: "Welcome to Hillside",
  title: "Today at Hillside",
  previewLabel: "Site preview",
  introduction:
    "A simple, welcoming place to see the day ahead and find useful facility information.",
  quickLook: [
    "Review today’s CSS or ATS group schedule.",
    "Check the weekly menu and available patient resources.",
    "Ask a staff member whenever you need help finding information.",
  ],
} as const;

export const resourcePreviews: ResourcePreview[] = [
  {
    id: "weekly-menu",
    title: "Weekly menu",
    description: "See breakfast, lunch, dinner, and snack information by day.",
    status: "Available",
    href: "/menu",
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
