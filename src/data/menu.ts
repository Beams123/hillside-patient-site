export type AlternativeMenuOption = {
  value: string;
  label: string;
  note?: string;
};

export type AlternativeMenuSection = {
  id: string;
  title: string;
  options: readonly AlternativeMenuOption[];
};

export const alternativeMenuSections = [
  {
    id: "entrees",
    title: "Entrées",
    options: [
      {
        value: "Hamburger",
        label: "Hamburger",
        note: "Served on a brioche bun",
      },
      {
        value: "Cheeseburger",
        label: "Cheeseburger",
        note: "Served on a brioche bun",
      },
      {
        value: "All-beef hot dog",
        label: "All-beef hot dog",
        note: "Served on a toasted New England-style bun",
      },
      {
        value: "Grilled cheese",
        label: "Grilled cheese",
        note: "Choose a cheese and bread below",
      },
      {
        value: "Flat grilled chicken breast",
        label: "Flat grilled chicken breast",
      },
      {
        value: "Baked cod loin",
        label: "Baked cod loin",
      },
      {
        value: "Chicken fingers (3)",
        label: "Chicken fingers (3)",
      },
    ],
  },
  {
    id: "sides",
    title: "Sides",
    options: [
      {
        value: "Mozzarella sticks (5)",
        label: "Mozzarella sticks (5)",
      },
      {
        value: "French fries",
        label: "French fries",
      },
    ],
  },
  {
    id: "vegetarian",
    title: "Vegetarian options",
    options: [
      {
        value: "Veggie burger",
        label: "Veggie burger",
      },
      {
        value: "Lentils",
        label: "Lentils",
      },
      {
        value: "Fresh fruit cup",
        label: "Fresh fruit cup",
      },
    ],
  },
] as const satisfies readonly AlternativeMenuSection[];

export const alternativeMenuMainItems = alternativeMenuSections.flatMap(
  (section) => section.options.map((option) => option.value),
);

export const burgerBaconSelection = "Burger add-on: Bacon";

export const grilledCheeseCheeseOptions = [
  "American",
  "Cheddar",
  "Provolone",
  "Swiss",
].map((label) => ({
  label,
  value: `Grilled cheese cheese: ${label}`,
}));

export const grilledCheeseBreadOptions = [
  "Texas Toast",
  "Wheat Bread",
].map((label) => ({
  label,
  value: `Grilled cheese bread: ${label}`,
}));

export const grilledCheeseAddOnOptions = [
  "Bacon",
  "Ham",
  "Turkey",
  "Tomato",
].map((label) => ({
  label,
  value: `Grilled cheese add-on: ${label}`,
}));

export const glutenFreeRequestOptions = [
  {
    label: "Gluten-free bread",
    value: "Gluten-free bread requested",
  },
  {
    label: "Gluten-free snack",
    value: "Gluten-free snack requested",
  },
] as const;

export const alternativeMenuSelections = [
  ...alternativeMenuMainItems,
  burgerBaconSelection,
  ...grilledCheeseCheeseOptions.map((option) => option.value),
  ...grilledCheeseBreadOptions.map((option) => option.value),
  ...grilledCheeseAddOnOptions.map((option) => option.value),
  ...glutenFreeRequestOptions.map((option) => option.value),
];

const alternativeMenuMainItemSet = new Set<string>(
  alternativeMenuMainItems,
);
const alternativeMenuSelectionSet = new Set<string>(
  alternativeMenuSelections,
);
const grilledCheeseCheeseSet = new Set<string>(
  grilledCheeseCheeseOptions.map((option) => option.value),
);
const grilledCheeseBreadSet = new Set<string>(
  grilledCheeseBreadOptions.map((option) => option.value),
);
const grilledCheeseAddOnSet = new Set<string>(
  grilledCheeseAddOnOptions.map((option) => option.value),
);

export function getAlternativeMenuSelectionError(
  selections: readonly string[],
): string | null {
  if (
    selections.length === 0 ||
    !selections.some((selection) =>
      alternativeMenuMainItemSet.has(selection),
    )
  ) {
    return "Choose at least one alternative-menu item.";
  }

  if (
    selections.length > alternativeMenuSelections.length ||
    selections.some(
      (selection) => !alternativeMenuSelectionSet.has(selection),
    ) ||
    new Set(selections).size !== selections.length
  ) {
    return "Review the requested menu choices, then try again.";
  }

  const hasBurger =
    selections.includes("Hamburger") ||
    selections.includes("Cheeseburger");

  if (selections.includes(burgerBaconSelection) && !hasBurger) {
    return "Bacon can be added to a hamburger or cheeseburger.";
  }

  const hasGrilledCheese = selections.includes("Grilled cheese");
  const selectedCheeses = selections.filter((selection) =>
    grilledCheeseCheeseSet.has(selection),
  );
  const selectedBreads = selections.filter((selection) =>
    grilledCheeseBreadSet.has(selection),
  );
  const selectedGrilledCheeseAddOns = selections.filter((selection) =>
    grilledCheeseAddOnSet.has(selection),
  );

  if (
    hasGrilledCheese &&
    (selectedCheeses.length !== 1 || selectedBreads.length !== 1)
  ) {
    return "Choose one cheese and one bread for the grilled cheese.";
  }

  if (
    !hasGrilledCheese &&
    (selectedCheeses.length > 0 ||
      selectedBreads.length > 0 ||
      selectedGrilledCheeseAddOns.length > 0)
  ) {
    return "Choose grilled cheese before adding its cheese, bread, or add-ons.";
  }

  return null;
}

export function getAlternativeMenuSelectionLabel(
  selection: string,
): string {
  const grilledCheeseLabels = [
    ["Grilled cheese cheese: ", "Cheese: "],
    ["Grilled cheese bread: ", "Bread: "],
    ["Grilled cheese add-on: ", "Add-on: "],
  ] as const;

  for (const [storedPrefix, visiblePrefix] of grilledCheeseLabels) {
    if (selection.startsWith(storedPrefix)) {
      return `${visiblePrefix}${selection.slice(storedPrefix.length)}`;
    }
  }

  return selection;
}
