// Product facts and feature flags — one place. Copy reads names and prices from here, never as literals.
// Flip a flag only when ~/Sensaka/share/updatehl.md logs the feature as done AND deployed (see CLAIMS.md in the plan repo).
export { SITE_URL, BASE } from '../../site.config.mjs';

export const PRODUCT_NAME = 'Homelab Sim';      // working name — change here only
export const BRAND = 'RACKDENSITY';
export const PARTNER = { name: 'Sensaka', url: 'https://sensaka.com' } as const;
export const CONTACT_EMAIL = 'da@mustardseedmt.com';

/** The app. `live` turns on every Try button; until then /try shows screenshots and "coming this week". */
export const TRY = {
  live: false,
  url: '',                                       // set to the public URL the dev agent logs on redeploy, then live: true
  comingNote: 'coming this week',
} as const;

export const PRICES = { account: { month: 5, year: 50 }, pro: { month: 200 }, currency: 'USD' } as const;

export const FLAGS = {
  agentLive: false,          // agent reads real Proxmox / Home Assistant / NUT / UniFi → allows "live" wording
  billingLive: false,        // Account / Pro purchasable (Dali 2026-10-14 16:00: no accounts for now)
  failInTry: true,           // Fail what-if in every tier (decided 16:00)
  aiUnblurredInTry: false,
  phoneVerified: false,
  showcase: false,
  leaderboard: false,
} as const;

export type Status = 'available' | 'roadmap';
export const FEATURE_STATUS: Record<string, Status> = {
  import3d: 'available', views: 'available', diagrams: 'available', failWhatIf: 'available', checks: 'available',
  shareImage: 'available', downloadLab: 'available', aiTokensPerSecond: 'available', flawFinder: 'available',
  cablingView: 'available', aiTokensPerKwh: 'available', pdfExport: 'available', savedLab: 'available',
  history: 'available', shareLink: 'available', fourRacks: 'available',
  upgradePlanner: 'roadmap', alerts: 'roadmap', agent: 'roadmap',
};
export const MAILTO = `mailto:${CONTACT_EMAIL}`;
