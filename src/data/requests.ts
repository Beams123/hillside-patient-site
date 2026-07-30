export type RequestCategory = {
  id: string;
  title: string;
  description: string;
  icon: "nicotine" | "grievance" | "package" | "visitor" | "meal";
  statusLabel: string;
  actionLabel: string;
  href?: string;
};

export type RequestDetailSection = {
  title: string;
  description: string;
  items?: readonly string[];
  note?: string;
};

export type RequestDetail = {
  slug: string;
  title: string;
  summary: string;
  icon: Exclude<RequestCategory["icon"], "meal">;
  intendedRecipient: string;
  routingNote: string;
  sections: readonly RequestDetailSection[];
};

export const requestCategories: RequestCategory[] = [
  {
    id: "nicotine-order",
    title: "Nicotine order form",
    description:
      "A draft online path for placing a nicotine order after Hillside approves the required information and secure routing.",
    icon: "nicotine",
    statusLabel: "Draft",
    actionLabel: "Review draft workflow",
    href: "/requests/nicotine-order",
  },
  {
    id: "grievance",
    title: "Grievance form",
    description:
      "Submit a grievance to Hillside’s private management-review workflow.",
    icon: "grievance",
    statusLabel: "Private form",
    actionLabel: "Open grievance form",
    href: "/requests/grievance",
  },
  {
    id: "package-request",
    title: "Package request form",
    description:
      "Request clinical-leadership approval before ordering a package to Hillside.",
    icon: "package",
    statusLabel: "Private form",
    actionLabel: "Open package request",
    href: "/requests/package-request",
  },
  {
    id: "visitor-request",
    title: "Visitor request form",
    description:
      "Request an available family-visit date for management review.",
    icon: "visitor",
    statusLabel: "Private form",
    actionLabel: "Open visitor request",
    href: "/requests/visitor-request",
  },
];

export const requestDetails: RequestDetail[] = [
  {
    slug: "nicotine-order",
    title: "Nicotine order form",
    summary:
      "Plan a safer replacement for the current paper authorization and staff-assisted smoke-shop purchase process.",
    icon: "nicotine",
    intendedRecipient: "Designated purchasing staff",
    routingNote:
      "The responsible staff role, consent language, product list, and purchasing procedure still need formal approval.",
    sections: [
      {
        title: "Current paper process",
        description:
          "Patients currently write the requested nicotine product and payment information on a paper authorization. Staff then use that authorization to purchase the item from a smoke shop.",
      },
      {
        title: "Proposed online experience",
        description:
          "The patient-facing page could present an approved product menu and quantities, then show the reviewed financial-consent language before continuing.",
        items: [
          "Approved products and prices",
          "Quantity selections and order review",
          "Consent language reviewed by Hillside leadership and counsel",
          "A hosted, PCI-compliant payment step outside this website",
        ],
      },
      {
        title: "Payment boundary",
        description:
          "This Hillside website should never ask patients to type card or bank details into its own fields.",
        items: [
          "No card number",
          "No expiration date or security code",
          "No PIN or bank-account information",
          "No payment details in email or free-text request fields",
        ],
        note: "A payment provider and compliance review are required before an online version can be activated.",
      },
    ],
  },
  {
    slug: "grievance",
    title: "Grievance form",
    summary:
      "Submit a private grievance for review by Hillside’s designated management reviewer.",
    icon: "grievance",
    intendedRecipient: "Jackson Roux",
    routingNote:
      "Submissions are stored in a separate restricted grievance workbook. Share that workbook only with Jackson Roux and other specifically approved reviewers.",
    sections: [
      {
        title: "Management destination",
        description:
          "Completed grievances are recorded in a separate restricted workbook for Jackson Roux and other specifically approved reviewers.",
      },
      {
        title: "Information collected",
        description:
          "The form keeps the patient’s identity optional and provides one open text box for the grievance.",
        items: [
          "Patient first name and last initial · optional",
          "Grievance description · open text box",
          "Suggested details · date, time, and staff members involved when relevant",
          "Suggested details are not mandatory",
          "Attachments are not enabled in the first secure release",
        ],
        note: "A later attachment workflow requires a restricted Drive folder, file controls, access review, and an approved retention process.",
      },
      {
        title: "Receipt and follow-up",
        description:
          "Jackson Roux will follow up with the patient in person after reviewing the grievance.",
      },
      {
        title: "Retention period",
        description:
          "Management is responsible for reviewing and removing submissions under Hillside’s approved records-retention and secure-disposal process.",
      },
    ],
  },
  {
    slug: "package-request",
    title: "Package request form",
    summary:
      "Request clinical-leadership approval before ordering a package to Hillside.",
    icon: "package",
    intendedRecipient: "Kyle Medeiros and Sierra Skaza",
    routingNote:
      "Submissions are stored in a separate restricted package-request workbook for approved clinical-leadership reviewers.",
    sections: [
      {
        title: "Current process",
        description:
          "Patients must receive permission from clinical leadership before ordering a package to Hillside from an outside seller such as Amazon.",
      },
      {
        title: "Package approval criteria",
        description:
          "The following working criteria guide clinical-leadership review.",
        items: [
          "The item is necessary or meaningfully useful during the patient’s stay",
          "The request is not solely for entertainment",
          "The quantity and size are reasonable for the patient’s room and facility storage",
          "The item is permitted under Hillside’s approved-item rules",
          "Clinical leadership approves the request before the order is placed",
        ],
        note: "Clinical-leadership approval is required before the package is ordered.",
      },
    ],
  },
  {
    slug: "visitor-request",
    title: "Visitor request form",
    summary:
      "Request an available family-visit date and send the visitor list for management review.",
    icon: "visitor",
    intendedRecipient: "Approved management reviewers",
    routingNote:
      "Submissions are stored in a separate restricted visitor-request workbook. Hillside must approve exactly which management roles may access it.",
    sections: [
      {
        title: "Available visitation times",
        description:
          "The current paper form lists the following visitation windows.",
        items: [
          "Tuesday · 2:00–5:00 PM",
          "Thursday · 2:00–5:00 PM",
          "Saturday · 2:00–5:00 PM",
          "Sunday · 2:00–5:00 PM",
        ],
      },
      {
        title: "Information requested",
        description:
          "The current paper form asks the patient to list each visitor and the visitor’s relationship to the patient.",
        items: ["Visitor name", "Relationship to the patient"],
      },
      {
        title: "Family visit and family session",
        description:
          "A family visit is regular visitation during an available visitation window. A family session is a separate meeting involving the patient’s care team to discuss treatment progress and aftercare plans.",
        note: "Family sessions are arranged separately through the patient’s care team.",
      },
    ],
  },
];
