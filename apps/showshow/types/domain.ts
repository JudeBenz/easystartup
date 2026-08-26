/**
 * ShowShow domain contract — copyright-safe by design.
 * Shows store raw facts only (dates, fees, addresses, names, URLs).
 * Never store competitor rankings, scores, or editorial copy.
 */

export type UserRole = "artist" | "showgoer" | "director" | "admin";

export type JuryProcess = "blind" | "panel" | "invitation" | "open" | "unknown";

export type ApplicationStatus =
  | "interested"
  | "applied"
  | "juried"
  | "accepted"
  | "waitlisted"
  | "declined"
  | "withdrawn";

export type Medium =
  | "ceramics"
  | "oil_painting"
  | "watercolor"
  | "jewelry"
  | "sculpture"
  | "photography"
  | "fiber"
  | "glass"
  | "printmaking"
  | "mixed_media"
  | "drawing"
  | "wood"
  | "other";

export type SourceKind = "official_site" | "manual" | "api" | "licensed";

export type SocialPlatform = "youtube" | "instagram" | "facebook" | "tiktok" | "other";

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  roles: UserRole[];
  homeBase?: GeoPoint & { label: string };
  createdAt: string;
}

export interface ArtistProfile {
  id: string;
  userId: string;
  slug: string;
  displayName: string;
  tagline: string;
  bio: string;
  mediums: Medium[];
  portfolioUrls: string[];
  boothDefaultSize?: string;
  stripeConnectReady: boolean;
  city: string;
  region: string;
}

export interface ShowgoerProfile {
  id: string;
  userId: string;
  favoriteShowIds: string[];
  followedArtistIds: string[];
}

export interface DirectorProfile {
  id: string;
  userId: string;
  showIds: string[];
  verified: boolean;
  verifiedDomain?: string;
  verifiedAt?: string;
}

/** Evergreen show brand — not a single year's edition. */
export interface Show {
  id: string;
  slug: string;
  name: string;
  officialWebsiteUrl: string;
  primaryCity: string;
  primaryRegion: string;
  country: string;
  geo: GeoPoint;
  promotedUntil?: string;
}

export interface ShowEdition {
  id: string;
  showId: string;
  year: number;
  startDate: string;
  endDate: string;
  applicationDeadline?: string;
  venueName: string;
  fullAddress: string;
  geo: GeoPoint;
  boothFeeMin?: number;
  boothFeeMax?: number;
  applicationFee?: number;
  currency: string;
  juryProcess: JuryProcess;
  attendance?: number;
  attendanceSourceUrl?: string;
  directorName?: string;
  directorEmail?: string;
  directorPhone?: string;
  status: "upcoming" | "active" | "completed" | "cancelled";
}

export interface ShowSocialLink {
  id: string;
  editionId: string;
  platform: SocialPlatform;
  url: string;
}

/** Outbound link only — never store rankings/scores/copy from aggregators. */
export interface ShowExternalReference {
  id: string;
  showId: string;
  label: string;
  url: string;
  kind: "ranking_aggregator" | "press" | "other";
}

export interface FactProvenance {
  id: string;
  entityType: "show" | "edition";
  entityId: string;
  field: string;
  sourceUrl: string;
  sourceKind: SourceKind;
  capturedAt: string;
  adapterId: string;
}

export interface RoiReport {
  id: string;
  artistId: string;
  editionId: string;
  boothFee: number;
  travel: number;
  lodging: number;
  otherExpenses: number;
  grossSales: number;
  currency: string;
  hoursWorked?: number;
  notes?: string;
  optInAggregate: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RoiMediumBreakdown {
  id: string;
  reportId: string;
  medium: Medium;
  sales: number;
  unitsSold: number;
}

/** Public first-party aggregate — always labeled self-reported + sample size. */
export interface ShowAggregateMetric {
  id: string;
  editionId: string;
  showId: string;
  sampleSize: number;
  medianNet?: number;
  medianGrossSales?: number;
  medianTotalExpenses?: number;
  topMediums: { medium: Medium; share: number }[];
  label: "self_reported";
  computedAt: string;
  minNMet: boolean;
}

export interface Application {
  id: string;
  artistId: string;
  editionId: string;
  status: ApplicationStatus;
  officialApplyUrl: string;
  appliedAt?: string;
  updatedAt: string;
  reminderAt?: string;
  notes?: string;
}

export interface ShowRoute {
  id: string;
  slug: string;
  name: string;
  region: string;
  seasonLabel: string;
  description: string;
}

export interface ShowRouteStop {
  id: string;
  routeId: string;
  editionId: string;
  order: number;
  travelMilesFromPrev?: number;
  travelHoursFromPrev?: number;
}

export interface ArtistShowBooking {
  id: string;
  artistId: string;
  editionId: string;
  intent: "interested" | "applied" | "booked";
  createdAt: string;
}

export interface Post {
  id: string;
  authorUserId: string;
  artistId?: string;
  body: string;
  imageUrl?: string;
  editionId?: string;
  createdAt: string;
}

export interface ShowComment {
  id: string;
  editionId: string;
  authorUserId: string;
  body: string;
  createdAt: string;
}

export interface DirectorAnnouncement {
  id: string;
  editionId: string;
  directorUserId: string;
  title: string;
  body: string;
  kind: "opening" | "deadline_extension" | "cancellation" | "general";
  createdAt: string;
}

export interface WaitlistListing {
  id: string;
  editionId: string;
  boothLabel?: string;
  status: "open" | "filled" | "withdrawn";
  createdAt: string;
  filledAt?: string;
}

export interface BoothSitOffer {
  id: string;
  editionId: string;
  artistId: string;
  availableWindows: string;
  notes?: string;
}

export interface BoothSitRequest {
  id: string;
  editionId: string;
  artistId: string;
  neededWindow: string;
  status: "open" | "matched" | "closed";
}

export interface JuryFeedbackShare {
  id: string;
  artistId: string;
  editionId: string;
  imageUrls: string[];
  outcome: "accepted" | "waitlisted" | "declined";
  notes?: string;
  createdAt: string;
}

export interface ShowAlert {
  id: string;
  editionId: string;
  kind: "weather" | "cancellation" | "permit" | "change";
  title: string;
  body: string;
  createdAt: string;
}

export interface ShowWeatherSnapshot {
  id: string;
  editionId: string;
  date: string;
  highF: number;
  lowF: number;
  condition: string;
  precipChance: number;
}

export interface SponsorshipTier {
  id: string;
  artistId: string;
  name: string;
  monthlyPriceCents: number;
  perks: string[];
  active: boolean;
}

export interface PatronSubscription {
  id: string;
  tierId: string;
  patronUserId: string;
  status: "active" | "cancelled";
  startedAt: string;
}

export interface Product {
  id: string;
  artistId: string;
  title: string;
  description: string;
  priceCents: number;
  inventory: number;
  imageUrl?: string;
  medium: Medium;
  active: boolean;
}

export interface Order {
  id: string;
  productId: string;
  buyerUserId: string;
  quantity: number;
  totalCents: number;
  status: "pending" | "paid" | "shipped" | "cancelled";
  createdAt: string;
}

export interface PromotedListing {
  id: string;
  showId: string;
  directorUserId: string;
  startsAt: string;
  endsAt: string;
  budgetCents: number;
  status: "active" | "ended";
}

export interface Follow {
  id: string;
  followerUserId: string;
  artistId: string;
  createdAt: string;
}

export interface DemoData {
  users: User[];
  artists: ArtistProfile[];
  showgoers: ShowgoerProfile[];
  directors: DirectorProfile[];
  shows: Show[];
  editions: ShowEdition[];
  socialLinks: ShowSocialLink[];
  externalRefs: ShowExternalReference[];
  provenance: FactProvenance[];
  roiReports: RoiReport[];
  roiBreakdowns: RoiMediumBreakdown[];
  aggregates: ShowAggregateMetric[];
  applications: Application[];
  routes: ShowRoute[];
  routeStops: ShowRouteStop[];
  bookings: ArtistShowBooking[];
  posts: Post[];
  comments: ShowComment[];
  announcements: DirectorAnnouncement[];
  waitlist: WaitlistListing[];
  boothOffers: BoothSitOffer[];
  boothRequests: BoothSitRequest[];
  juryFeedback: JuryFeedbackShare[];
  alerts: ShowAlert[];
  weather: ShowWeatherSnapshot[];
  sponsorshipTiers: SponsorshipTier[];
  subscriptions: PatronSubscription[];
  products: Product[];
  orders: Order[];
  promotions: PromotedListing[];
  follows: Follow[];
}
