// Tone-Shift palettes — each tone is a complete visual mode the app slips into
// based on what the user is doing / where they are in the journey. Names match
// the brief's 5 stages, with extra moods for specific service contexts.
window.CONCIERGE_TONES = {
  // ── Journey stages ─────────────────────────────────────────
  exploring: {
    name: 'Exploring',
    sub: 'Curiosity, distance, possibility',
    bg: '#0E0F14',
    bg2: '#1A1D26',
    surface: 'rgba(255,255,255,0.04)',
    line: 'rgba(255,255,255,0.08)',
    ink: '#EAE6DC',
    mute: '#7E8597',
    accent: '#C8A36A',     // soft gold — distant lamplight
    accent2: '#5B7BA8',    // dusk blue
    serif: "'Cormorant Garamond', 'Times New Roman', serif",
    sans: "'Manrope', -apple-system, system-ui, sans-serif",
    mono: "'JetBrains Mono', ui-monospace, monospace",
    glyph: '◇',
  },
  arriving: {
    name: 'Arriving',
    sub: 'Arrival heat, terracotta, first light',
    bg: '#1A0F0A',
    bg2: '#2A1810',
    surface: 'rgba(255,255,255,0.05)',
    line: 'rgba(212,150,108,0.18)',
    ink: '#F4EFE6',
    mute: '#9C8474',
    accent: '#D97757',     // coral / terracotta
    accent2: '#E8B26B',    // sunset amber
    serif: "'Cormorant Garamond', serif",
    sans: "'Manrope', system-ui, sans-serif",
    mono: "'JetBrains Mono', monospace",
    glyph: '◐',
  },
  settling: {
    name: 'Settling',
    sub: 'Practical clarity, paperwork, lists',
    bg: '#0F1411',
    bg2: '#172019',
    surface: 'rgba(255,255,255,0.04)',
    line: 'rgba(160,180,160,0.12)',
    ink: '#E8E8DD',
    mute: '#7E8C7E',
    accent: '#7FB069',     // sage / mid-green — calm utility
    accent2: '#BFA06A',    // warm gold ledger
    serif: "'Cormorant Garamond', serif",
    sans: "'Manrope', system-ui, sans-serif",
    mono: "'JetBrains Mono', monospace",
    glyph: '◈',
  },
  living: {
    name: 'Living',
    sub: 'Daily rhythm, ocean light, leisure',
    bg: '#08161B',
    bg2: '#0F2530',
    surface: 'rgba(255,255,255,0.05)',
    line: 'rgba(120,200,210,0.15)',
    ink: '#EAF4F4',
    mute: '#7BA0A8',
    accent: '#3FB6B0',     // turquoise
    accent2: '#F0CC7A',    // warm sand
    serif: "'Cormorant Garamond', serif",
    sans: "'Manrope', system-ui, sans-serif",
    mono: "'JetBrains Mono', monospace",
    glyph: '◉',
  },
  thriving: {
    name: 'Thriving',
    sub: 'Insider quiet, deep forest, gold leaf',
    bg: '#0A1410',
    bg2: '#13211B',
    surface: 'rgba(255,255,255,0.04)',
    line: 'rgba(191,160,106,0.22)',
    ink: '#F4EFE6',
    mute: '#8B8474',
    accent: '#BFA06A',     // gold leaf
    accent2: '#5C8A6F',    // deep forest
    serif: "'Cormorant Garamond', serif",
    sans: "'Manrope', system-ui, sans-serif",
    mono: "'JetBrains Mono', monospace",
    glyph: '✦',
  },
};

// Stage cards displayed on the "Where are you?" screen.
window.CONCIERGE_STAGES = [
  { id: 'exploring', label: 'Still exploring', sub: 'Researching from abroad', icon: '◇',
    detail: 'Market reports, neighborhood guides, virtual tours.' },
  { id: 'arriving', label: 'Moving soon', sub: 'Decision made, logistics ahead', icon: '◐',
    detail: 'Movers, customs, airport pickup, first nights.' },
  { id: 'settling', label: 'Just arrived', sub: 'Sorting out the basics', icon: '◈',
    detail: 'Banking, schools, doctors, household help.' },
  { id: 'living', label: 'Living here', sub: 'Routines in place', icon: '◉',
    detail: 'Yacht days, private chefs, wellness, events.' },
  { id: 'thriving', label: 'Long-time resident', sub: 'A Panama insider', icon: '✦',
    detail: 'Off-market deals, business intros, mentor others.' },
];
