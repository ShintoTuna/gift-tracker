// Realistic seed data for dev testing. Touch this file to tweak what
// the design-system "Seed dev data" button populates — no need to
// edit mutation logic.

export type PersonSeed = {
  name: string;
  nickname?: string;
  relationship?: string;
  interests: string[];
};

export type OccasionSeed = {
  title: string;
  date?: number;
  recurrence?: "yearly" | "one_off";
};

export type GiftIdeaSeed = {
  title: string;
  description?: string;
  sourceUrl?: string;
  priceEstimate?: number;
  currency?: string;
  taggedPersonNames: string[];
  status: "active" | "archived";
  // Optional list of givings to seed alongside the idea. Matches
  // against the seeded occasions by `(personName, occasionTitle)`
  // for the recipient lookup.
  givings?: GiftIdeaGivingSeed[];
};

export type GiftIdeaGivingSeed = {
  personName: string;
  givenAt: number;
  occasionTitle?: string;
};

const ms = (iso: string): number => new Date(iso).getTime();

export const SEED_PEOPLE: PersonSeed[] = [
  {
    name: "Sarah",
    relationship: "mom",
    interests: ["gardening", "audiobooks", "tea"],
  },
  {
    name: "Alex",
    nickname: "Al",
    relationship: "best friend",
    interests: ["climbing", "espresso", "dogs"],
  },
  {
    name: "Jordan",
    relationship: "partner",
    interests: ["cooking", "running", "travel"],
  },
  {
    name: "Tom",
    relationship: "brother",
    interests: ["whiskey", "watches", "vinyl"],
  },
  {
    name: "Priya",
    relationship: "colleague",
    interests: ["board games", "specialty coffee", "puzzles"],
  },
];

export const SEED_OCCASIONS: Record<string, OccasionSeed[]> = {
  Sarah: [
    { title: "Birthday", date: ms("1962-05-15"), recurrence: "yearly" },
    { title: "Mother's Day", date: ms("2026-05-10"), recurrence: "yearly" },
    { title: "Christmas", date: ms("2026-12-25"), recurrence: "yearly" },
  ],
  Alex: [
    { title: "Birthday", date: ms("1991-05-03"), recurrence: "yearly" },
    { title: "Christmas", date: ms("2026-12-25"), recurrence: "yearly" },
  ],
  Jordan: [
    { title: "Birthday", date: ms("1992-11-23"), recurrence: "yearly" },
    { title: "Anniversary", date: ms("2022-09-05"), recurrence: "yearly" },
    { title: "Christmas", date: ms("2026-12-25"), recurrence: "yearly" },
  ],
  Tom: [
    { title: "Birthday", date: ms("1989-02-08"), recurrence: "yearly" },
    { title: "Christmas", date: ms("2026-12-25"), recurrence: "yearly" },
  ],
  Priya: [
    { title: "Birthday", date: ms("1990-10-18"), recurrence: "yearly" },
    // Dateless: friend bought a house, will throw a housewarming
    // eventually but the date isn't known yet.
    { title: "Housewarming" },
  ],
};

export const SEED_GIFT_IDEAS: GiftIdeaSeed[] = [
  {
    title: "Cordless gardening shears",
    description: "Stihl GTA 26 — battery powered, lightweight",
    sourceUrl: "https://www.stihl.com/gta-26",
    priceEstimate: 129,
    currency: "USD",
    taggedPersonNames: ["Sarah"],
    status: "active",
  },
  {
    title: "Climbing chalk bag",
    description: "Black Diamond Mojo — wide opening",
    priceEstimate: 30,
    currency: "USD",
    taggedPersonNames: ["Alex"],
    status: "active",
  },
  {
    title: "Pasta-making class for two",
    sourceUrl: "https://www.eataly.com/classes",
    priceEstimate: 180,
    currency: "USD",
    taggedPersonNames: ["Jordan"],
    status: "active",
  },
  {
    title: "Whiskey decanter set",
    description: "Crystal, with four matched glasses",
    priceEstimate: 145,
    currency: "USD",
    taggedPersonNames: ["Tom"],
    status: "active",
  },
  {
    title: "Blue Note vinyl reissue collection",
    sourceUrl: "https://store.bluenote.com/reissues",
    priceEstimate: 220,
    currency: "USD",
    taggedPersonNames: ["Tom"],
    status: "active",
  },
  {
    title: "Audiobook subscription (annual)",
    priceEstimate: 80,
    currency: "USD",
    taggedPersonNames: ["Sarah"],
    status: "active",
    givings: [
      {
        personName: "Sarah",
        givenAt: ms("2025-05-15"),
        occasionTitle: "Birthday",
      },
    ],
  },
  {
    title: "Knife sharpening workshop",
    description: "Half-day, BYO knives",
    priceEstimate: 95,
    currency: "USD",
    taggedPersonNames: ["Jordan", "Sarah"],
    status: "active",
  },
  {
    title: "Wireless noise-cancelling headphones",
    description: "Sony WH-1000XM5",
    sourceUrl: "https://www.sony.com/wh1000xm5",
    priceEstimate: 350,
    currency: "USD",
    taggedPersonNames: ["Priya"],
    status: "active",
  },
  {
    title: "Wingspan board game expansion",
    description: "Asia expansion",
    priceEstimate: 45,
    currency: "USD",
    taggedPersonNames: ["Priya"],
    status: "active",
  },
  {
    title: "Acaia Pearl espresso scale",
    sourceUrl: "https://acaia.co/products/pearl",
    priceEstimate: 165,
    currency: "USD",
    taggedPersonNames: ["Alex"],
    status: "active",
  },
  {
    title: "Tea sampler — single estate",
    priceEstimate: 42,
    currency: "USD",
    taggedPersonNames: ["Sarah"],
    status: "active",
    givings: [
      {
        personName: "Sarah",
        givenAt: ms("2025-12-25"),
        occasionTitle: "Christmas",
      },
    ],
  },
  {
    title: "Leather travel journal",
    description: "Refillable, A5",
    priceEstimate: 55,
    currency: "USD",
    taggedPersonNames: ["Jordan"],
    status: "active",
  },
];
