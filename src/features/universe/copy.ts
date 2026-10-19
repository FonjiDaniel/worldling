// Universe copy (SPEC §2.5, §2.8), written to the 07 voice: warm, short, plain, no em dashes.
// 07 has no universe strings yet, so these are new and noted in docs/brand/README.md.

export const copy = {
  heading: "The universe",
  galaxyLabel:
    "The universe of worlds. Drag to look around and scroll to zoom. Arrow keys move, plus and minus zoom, Tab steps through nearby worlds and Enter visits one.",
  modeLabel: "How to explore",
  modeGalaxy: "Universe",
  modeList: "List",
  searchLabel: "Find a world by username",
  searchPlaceholder: "Search @username",
  searchEmpty: "No world by that name yet.",
  searchOffline: "Search needs a connection. Your view keeps working.",
  searchResults: (count: number) =>
    count === 1 ? "1 world found." : `${String(count)} worlds found.`,
  zoomIn: "Zoom in",
  zoomOut: "Zoom out",
  overview: "See the whole universe",
  skip: "Skip flight",
  justBorn: "Just born",
  featured: "Featured",
  railsLabel: "Worlds to visit",
  visit: "Visit this world",
  byUser: (username: string) => `by @${username}`,
  level: (level: number) => `Bloom level ${String(level)}`,
  focusAnnouncement: (name: string, username: string, level: number) =>
    `${name} by @${username}, bloom level ${String(level)}. Press Enter to visit.`,
  born: (name: string) => `${name} was just born nearby.`,
  bornAction: "Visit",
  quiet: "This corner of space is quiet. For now.",
  listHeading: "Every world",
  listLoading: "Finding worlds",
  listMore: "Show more worlds",
  listEmpty: "No worlds yet. Yours could be the first.",
  listEmptyAction: "Create my world",
  loading: "Opening the universe",
  noWebgl: "This device shows the universe as a list. Every world is here.",
} as const;
