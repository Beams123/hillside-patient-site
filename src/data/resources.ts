export const resourceCategories = [
  "Facility information",
  "Daily living",
  "Recovery education",
  "Planning ahead",
] as const;

export type ResourceCategory = (typeof resourceCategories)[number];

export type PatientResource = {
  slug: string;
  title: string;
  description: string;
  category: ResourceCategory;
  icon:
    | "facility"
    | "personal-items"
    | "daily-living"
    | "reading"
    | "support"
    | "wellness"
    | "next-steps"
    | "transportation";
  previewSections: string[];
};

/**
 * Mock content for interface development only.
 *
 * Replace each entry with reviewed Hillside information before public launch.
 * Do not add patient-specific, clinical, or confidential information here.
 */
export const patientResources: PatientResource[] = [
  {
    slug: "facility-guide",
    title: "Facility guide",
    description:
      "A sample home for approved information about shared spaces, routines, and common facility questions.",
    category: "Facility information",
    icon: "facility",
    previewSections: [
      "Shared spaces and wayfinding",
      "Daily routines",
      "Where to ask questions",
    ],
  },
  {
    slug: "personal-items-guide",
    title: "Personal items guide",
    description:
      "A sample checklist location for reviewed guidance about personal items and everyday essentials.",
    category: "Facility information",
    icon: "personal-items",
    previewSections: [
      "Suggested items",
      "Items requiring staff guidance",
      "Common questions",
    ],
  },
  {
    slug: "laundry-and-essentials",
    title: "Laundry and essentials",
    description:
      "A sample page for practical, approved information about laundry and basic daily needs.",
    category: "Daily living",
    icon: "daily-living",
    previewSections: [
      "Laundry guidance",
      "Everyday essentials",
      "Getting help from staff",
    ],
  },
  {
    slug: "wellness-and-recreation",
    title: "Wellness and recreation",
    description:
      "A sample location for reviewed general information about available wellness and recreation options.",
    category: "Daily living",
    icon: "wellness",
    previewSections: [
      "Available activities",
      "General participation guidance",
      "Questions for staff",
    ],
  },
  {
    slug: "recovery-reading-library",
    title: "Recovery reading library",
    description:
      "A sample collection for educational handouts, reading suggestions, and other reviewed materials.",
    category: "Recovery education",
    icon: "reading",
    previewSections: [
      "Educational handouts",
      "Suggested reading",
      "Additional reviewed materials",
    ],
  },
  {
    slug: "community-support-links",
    title: "Community support links",
    description:
      "A sample place for approved public support links and general meeting-finder information.",
    category: "Recovery education",
    icon: "support",
    previewSections: [
      "Public support directories",
      "Meeting-finder information",
      "How to ask for guidance",
    ],
  },
  {
    slug: "preparing-for-next-steps",
    title: "Preparing for next steps",
    description:
      "A sample page for reviewed general guidance that may help patients prepare for upcoming transitions.",
    category: "Planning ahead",
    icon: "next-steps",
    previewSections: [
      "Questions to consider",
      "General preparation checklist",
      "Who to speak with",
    ],
  },
  {
    slug: "transportation-planning",
    title: "Transportation planning",
    description:
      "A sample location for approved general transportation guidance without personal appointment details.",
    category: "Planning ahead",
    icon: "transportation",
    previewSections: [
      "General planning guidance",
      "Information to have ready",
      "Where to ask questions",
    ],
  },
];
