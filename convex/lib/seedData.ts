// Realistic seed data for App Store screenshots and dev testing.
// Touch this file to tweak what the design-system "Seed dev data"
// button populates — no need to edit mutation logic.
//
// Photo URLs are fetched at seed time by the `seedDevData` action and
// uploaded into Convex storage; see `convex/seed.ts`. URLs are
// deliberately stable so repeated runs produce the same images:
// - People photos: randomuser.me/api/portraits/{gender}/{N}.jpg
// - Idea images: loremflickr.com/600/600/{tag}?lock={N} — returns a
//   Creative Commons Flickr photo matching the tag, deterministic by
//   the `lock` value. Tags are chosen so the photo matches the gift
//   type (a "tea" tag returns a tea photo, etc.). Swap any URL for
//   a hand-picked product shot when polishing for App Store.
//
// Dates anchored against 2026-05-02: Sarah's birthday (May 6) and
// Mother's Day (May 10) intentionally land in the "This Week" bucket
// so the claret accent appears on the People tab and Calendar.

export type PersonSeed = {
  name: string;
  nickname?: string;
  relationship?: string;
  interests: string[];
  photoUrl?: string;
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
  imageUrl?: string;
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
    photoUrl: "https://randomuser.me/api/portraits/women/65.jpg",
  },
  {
    name: "Alex",
    nickname: "Al",
    relationship: "best friend",
    interests: ["climbing", "espresso", "dogs"],
    photoUrl: "https://randomuser.me/api/portraits/men/32.jpg",
  },
  {
    name: "Jordan",
    relationship: "partner",
    interests: ["cooking", "running", "travel"],
    photoUrl: "https://randomuser.me/api/portraits/women/44.jpg",
  },
  {
    name: "Tom",
    relationship: "brother",
    interests: ["whiskey", "watches", "vinyl"],
    photoUrl: "https://randomuser.me/api/portraits/men/45.jpg",
  },
  {
    name: "Priya",
    relationship: "colleague",
    interests: ["board games", "specialty coffee", "puzzles"],
    photoUrl: "https://randomuser.me/api/portraits/women/68.jpg",
  },
];

export const SEED_OCCASIONS: Record<string, OccasionSeed[]> = {
  Sarah: [
    // Anchor: this birthday is 4 days from 2026-05-02, so it lands
    // in "This Week" with the claret accent.
    { title: "Birthday", date: ms("1962-05-06"), recurrence: "yearly" },
    { title: "Mother's Day", date: ms("2026-05-10"), recurrence: "yearly" },
    { title: "Christmas", date: ms("2026-12-25"), recurrence: "yearly" },
  ],
  Alex: [
    { title: "Birthday", date: ms("1991-07-18"), recurrence: "yearly" },
    { title: "Christmas", date: ms("2026-12-25"), recurrence: "yearly" },
  ],
  Jordan: [
    { title: "Birthday", date: ms("1992-11-23"), recurrence: "yearly" },
    { title: "Anniversary", date: ms("2022-06-12"), recurrence: "yearly" },
    { title: "Christmas", date: ms("2026-12-25"), recurrence: "yearly" },
  ],
  Tom: [
    { title: "Birthday", date: ms("1989-08-08"), recurrence: "yearly" },
    { title: "Christmas", date: ms("2026-12-25"), recurrence: "yearly" },
  ],
  Priya: [
    { title: "Birthday", date: ms("1990-10-18"), recurrence: "yearly" },
    // Dateless: friend bought a house, will throw a housewarming
    // eventually but the date isn't known yet. Exercises the
    // "Date TBD" pill on the profile + the "Pending dates" bucket
    // on the Calendar tab.
    { title: "Housewarming" },
    { title: "Christmas", date: ms("2026-12-25"), recurrence: "yearly" },
  ],
};

// Lorem Flickr URL builder. Tag(s) drive what the photo shows; the
// `lock` value pins it to a specific image so re-running the seed
// returns the same picture each time. Use comma-separated tags to
// narrow the match.
const flickr = (tag: string, lock: number): string =>
  `https://loremflickr.com/600/600/${tag}?lock=${lock}`;

export const SEED_GIFT_IDEAS: GiftIdeaSeed[] = [
  {
    title: "Indoor houseplant",
    description: "Something low-maintenance for the kitchen window",
    priceEstimate: 45,
    currency: "USD",
    taggedPersonNames: ["Sarah"],
    status: "active",
    imageUrl: flickr("houseplant,pot", 7),
  },
  {
    title: "Loose leaf tea set",
    description: "Sampler box, four single-estate selections",
    priceEstimate: 38,
    currency: "USD",
    taggedPersonNames: ["Sarah"],
    status: "active",
    imageUrl: flickr("teapot,cup", 3),
    givings: [
      {
        personName: "Sarah",
        givenAt: ms("2025-12-25"),
        occasionTitle: "Christmas",
      },
    ],
  },
  {
    title: "Audiobook subscription",
    description: "Annual, unlimited listening",
    priceEstimate: 80,
    currency: "USD",
    taggedPersonNames: ["Sarah"],
    status: "active",
    imageUrl: flickr("audiobook", 2),
    givings: [
      {
        personName: "Sarah",
        givenAt: ms("2025-05-06"),
        occasionTitle: "Birthday",
      },
    ],
  },
  {
    title: "Climbing chalk bag",
    description: "Wide opening, brush loop",
    priceEstimate: 30,
    currency: "USD",
    taggedPersonNames: ["Alex"],
    status: "active",
    imageUrl: flickr("chalkbag,climbing", 1),
  },
  {
    title: "Espresso scale",
    description: "0.1g precision, built-in timer",
    priceEstimate: 165,
    currency: "USD",
    taggedPersonNames: ["Alex"],
    status: "active",
    imageUrl: flickr("coffeescale,espresso", 1),
  },
  {
    title: "Cookbook",
    description: "From a chef Jordan follows",
    priceEstimate: 45,
    currency: "USD",
    taggedPersonNames: ["Jordan"],
    status: "active",
    imageUrl: flickr("cookbook,book", 1),
  },
  {
    title: "Leather travel notebook",
    description: "Refillable, A5",
    priceEstimate: 55,
    currency: "USD",
    taggedPersonNames: ["Jordan"],
    status: "active",
    imageUrl: flickr("notebook,leather", 17),
  },
  {
    title: "Cooking class for two",
    description: "Pasta-making, half-day with a chef",
    priceEstimate: 180,
    currency: "USD",
    taggedPersonNames: ["Jordan", "Sarah"],
    status: "active",
    imageUrl: flickr("pasta,homemade", 12),
  },
  {
    title: "Whiskey decanter",
    description: "Crystal, with four matched glasses",
    priceEstimate: 145,
    currency: "USD",
    taggedPersonNames: ["Tom"],
    status: "active",
    imageUrl: flickr("whiskey,decanter", 19),
  },
  {
    title: "Vinyl record",
    description: "An original pressing he's been hunting for",
    priceEstimate: 60,
    currency: "USD",
    taggedPersonNames: ["Tom"],
    status: "active",
    imageUrl: flickr("vinyl", 8),
  },
  {
    title: "Coffee bean subscription",
    description: "Single-origin, monthly delivery",
    priceEstimate: 75,
    currency: "USD",
    taggedPersonNames: ["Priya"],
    status: "active",
    imageUrl: flickr("coffee,beans", 21),
  },
  {
    title: "Strategy board game",
    description: "Two-player, ~60 minutes",
    priceEstimate: 50,
    currency: "USD",
    taggedPersonNames: ["Priya"],
    status: "active",
    imageUrl: flickr("boardgame", 22),
  },
  {
    title: "Vintage typewriter",
    description: "Considered for Jordan, ended up going with the journal",
    priceEstimate: 220,
    currency: "USD",
    taggedPersonNames: ["Jordan"],
    status: "archived",
    imageUrl: flickr("typewriter", 3),
  },
];
