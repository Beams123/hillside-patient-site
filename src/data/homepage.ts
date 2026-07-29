export type ResourcePreview = {
  id: string;
  title: string;
  description: string;
  status: "Available" | "Preview" | "Planned";
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
  { label: "Staff", href: "/staff" },
  { label: "Requests", href: "/requests" },
  { label: "Resources", href: "/resources" },
] as const;

export const homepageContent = {
  eyebrow: "Welcome to Hillside",
  title: "Today at Hillside",
  previewLabel: "Site preview",
  introduction:
    "A simple, welcoming place to see the day ahead and find useful facility information.",
} as const;

export const resourcePreviews: ResourcePreview[] = [
  {
    id: "weekly-menu",
    title: "Weekly menu",
    description:
      "See breakfast, lunch, dinner, and soup-of-the-day information.",
    status: "Available",
    href: "/menu",
    icon: "menu",
  },
  {
    id: "staff-directory",
    title: "Staff directory",
    description: "Find approved staff names, roles, and biographies.",
    status: "Available",
    href: "/staff",
    icon: "directory",
  },
  {
    id: "request-forms",
    title: "Request forms",
    description:
      "Preview draft request categories before a secure workflow is approved.",
    status: "Preview",
    href: "/requests",
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
    title: "Resource library",
    description:
      "Try the sample resource-library experience while approved content is gathered.",
    status: "Preview",
    href: "/resources",
    icon: "resources",
  },
];
