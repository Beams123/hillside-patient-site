export type RequestCategory = {
  id: string;
  title: string;
  description: string;
  icon: "nicotine" | "grievance" | "package" | "visitor" | "meal";
  statusLabel: string;
  actionLabel: string;
  href?: string;
};

export const requestCategories: RequestCategory[] = [
  {
    id: "nicotine-order",
    title: "Nicotine order form",
    description:
      "A draft online path for placing a nicotine order after Hillside approves the required information and secure routing.",
    icon: "nicotine",
    statusLabel: "Draft",
    actionLabel: "Form not connected",
  },
  {
    id: "grievance",
    title: "Grievance form",
    description:
      "A draft online path for submitting a patient grievance after privacy, access, and delivery requirements are approved.",
    icon: "grievance",
    statusLabel: "Draft",
    actionLabel: "Form not connected",
  },
  {
    id: "package-request",
    title: "Package request form",
    description:
      "A draft online path for package-related requests after Hillside confirms the review and notification process.",
    icon: "package",
    statusLabel: "Draft",
    actionLabel: "Form not connected",
  },
  {
    id: "visitor-request",
    title: "Visitor request form",
    description:
      "A draft online path for visitor requests after Hillside approves the necessary information and review workflow.",
    icon: "visitor",
    statusLabel: "Draft",
    actionLabel: "Form not connected",
  },
  {
    id: "alternative-meal",
    title: "Alternative meal request",
    description:
      "See the weekly menu and current instructions for requesting a meal from the alternative menu.",
    icon: "meal",
    statusLabel: "Current guidance",
    actionLabel: "View meal request guidance",
    href: "/menu#alternative-meal-request",
  },
];
