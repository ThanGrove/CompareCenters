// The centers we track. CSC is the focus (isFocus); everyone else is a peer it
// gets compared against. Edit this list to add/remove peers, then re-seed with
// `npm run db:seed`. `notes` records why a peer was chosen or how it surfaced —
// the Discovery stage can append AI-suggested peers here too.

export interface CenterSeed {
  slug: string;
  name: string;
  homepage: string;
  isFocus?: boolean;
  notes?: string;
}

export const CENTERS: CenterSeed[] = [
  {
    slug: "uva-csc",
    name: "UVA Contemplative Sciences Center",
    homepage: "https://csc.virginia.edu",
    isFocus: true,
    notes: "The subject of the comparison — our own center.",
  },

  // ----- Peer centers -----
  // TODO: replace/extend with the peers you have in mind. A few well-known
  // contemplative / mindfulness / well-being centers are stubbed below as
  // starting points; verify URLs and prune to the set you actually care about.
  {
    slug: "umass-mindfulness",
    name: "UMass Center for Mindfulness",
    homepage: "https://www.ummhealth.org/center-mindfulness",
    notes: "Home of MBSR; long-standing clinical mindfulness program.",
  },
  {
    slug: "wisc-healthy-minds",
    name: "UW–Madison Center for Healthy Minds",
    homepage: "https://centerhealthyminds.org",
    notes: "Richard Davidson's research center; strong neuroscience output.",
  },
  {
    slug: "mind-and-life",
    name: "Mind & Life Institute",
    homepage: "https://www.mindandlife.org",
    notes: "Bridges contemplative practice and science; grants + dialogues.",
  },
  {
    slug: "brown-mindfulness",
    name: "Brown University Mindfulness Center",
    homepage: "https://www.brown.edu/public-health/mindfulness/home",
    notes: "Academic mindfulness research + training.",
  },
];
