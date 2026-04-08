export type EntryMode = "solo" | "small_group" | "team";
export type ListingType = "mercenary" | "partial_join" | "team_match";
export type DirectContactType = "openchat" | "phone";
export type ContactType = DirectContactType | "request_only";
export type MatchStatus = "open" | "matched" | "closed" | "cancelled";
export type ParticipationStatus =
  | "pending"
  | "accepted"
  | "confirmed"
  | "rejected"
  | "withdrawn"
  | "expired";
export type DemoNotificationKind =
  | "host_request_received"
  | "request_accepted"
  | "request_confirmed"
  | "request_rejected";
export type SkillLevel = "beginner" | "low" | "mid" | "high";
export type SportType = "futsal" | "soccer";
export type FutsalFormatOption = "4vs4" | "5vs5" | "6vs6";
export type FeedSportFilter = "all" | SportType;
export type FeedTimeWindow = "all" | "now" | "today" | "tomorrow" | "weekend";
export type FeedSort = "recommended" | "time" | "distance" | "fee" | "closing";
export type FeedPreset = FeedSort;
export type RegionSlug = "suwon";
export type UserRole = "player" | "captain";

export interface FeedDateFilterItem {
  id: string;
  label: string;
  dayOfWeek: string;
  fullDate?: string;
}

export interface Profile {
  id: string;
  auth_user_id?: string | null;
  nickname: string;
  role: UserRole;
  preferred_mode?: EntryMode | null;
  preferred_sport?: SportType | null;
  preferred_regions: string[];
  skill_level: SkillLevel;
  age: number;
  open_chat_link?: string | null;
  phone_number?: string | null;
  default_contact_type?: DirectContactType | null;
  created_at?: string;
  updated_at?: string;
}

export interface Match {
  id: string;
  creator_profile_id: string;
  mode: EntryMode;
  listing_type: ListingType;
  sport_type?: SportType;
  futsal_format?: FutsalFormatOption | null;
  title: string;
  region_slug: RegionSlug;
  address: string;
  lat: number;
  lng: number;
  start_at: string;
  duration_minutes: number;
  fee: number;
  total_slots: number;
  remaining_slots: number;
  min_group_size: number;
  max_group_size: number;
  skill_level: SkillLevel;
  contact_type: ContactType;
  contact_link: string;
  note: string;
  status: MatchStatus;
  created_at?: string;
  updated_at?: string;
}

export interface ParticipationRequest {
  id: string;
  match_id: string;
  requester_profile_id: string;
  host_profile_id: string;
  entry_channel: ContactType;
  requested_count: number;
  message: string;
  status: ParticipationStatus;
  accepted_contact_link?: string | null;
  created_at: string;
  decided_at?: string;
  updated_at?: string;
  host_note?: string;
}

export interface AppNotification {
  id: string;
  profile_id: string;
  kind: DemoNotificationKind;
  title: string;
  body: string;
  href: string;
  created_at: string;
  related_match_id?: string;
  related_request_id?: string;
  read_at?: string;
}

export type DemoNotification = AppNotification;

export interface RegionOption {
  slug: RegionSlug;
  label: string;
  area: "seoul" | "gyeonggi";
  lat: number;
  lng: number;
}

export interface FeedContext {
  sport: FeedSportFilter;
  window: FeedTimeWindow;
  radiusKm?: number;
  onlyLastSpot: boolean;
  sort: FeedSort;
  regionSlug?: string;
  regionLabel: string;
  lat?: number;
  lng?: number;
  mode?: EntryMode;
  groupSize?: number;
  selectedDateFrom?: string;
  selectedDateTo?: string;
  selectedDateLabel?: string;
  skillLevel?: SkillLevel;
}

export interface FeedDataSource {
  matches: Match[];
  profiles: Profile[];
  participationRequests: ParticipationRequest[];
  regions: RegionOption[];
}

export interface AppState extends FeedDataSource {
  currentProfileId: string;
  notifications: AppNotification[];
}

export type DemoAppState = AppState;

export interface MatchWithMeta extends Match {
  region_label: string;
  distanceKm: number;
  minutesUntilStart: number;
  statusLabel: string;
  statusTone: "urgent" | "soon" | "team" | "calm";
  recommendedScore: number;
  organizer?: Profile;
  contactAvailable: boolean;
  urgencyLevel: "last_spot" | "starting_soon" | "today" | "weekend" | "closed";
}

export interface OpenSpotCardVM {
  id: string;
  sportType: SportType;
  startAt: string;
  venueName: string;
  distanceKm: number;
  remainingSlots: number;
  fee: number;
  contactAvailable: boolean;
  urgencyLevel: MatchWithMeta["urgencyLevel"];
}

export type CreateMatchInput = Omit<
  Match,
  "id" | "creator_profile_id" | "status" | "created_at" | "updated_at" | "sport_type"
> & {
  sport_type: SportType;
};

export interface SubmitParticipationInput {
  matchId: string;
  requestedCount: number;
  message: string;
}

export interface UpdateProfileInput {
  nickname: string;
  age: number;
  preferred_mode?: EntryMode | null;
  preferred_sport?: SportType | null;
  preferred_regions: string[];
  skill_level: SkillLevel;
  open_chat_link?: string | null;
  phone_number?: string | null;
  default_contact_type?: DirectContactType | null;
}

export interface DemoAppActions {
  switchProfile: (profileId: string) => void;
  updateCurrentProfile: (updates: Partial<UpdateProfileInput>) => void;
  createMatch: (input: CreateMatchInput) => Match;
  cancelMatch: (matchId: string) => Match;
  submitParticipation: (input: SubmitParticipationInput) => ParticipationRequest;
  acceptParticipation: (requestId: string, hostNote?: string) => ParticipationRequest;
  confirmParticipation: (requestId: string, hostNote?: string) => ParticipationRequest;
  cancelParticipationConfirmation: (requestId: string, hostNote?: string) => ParticipationRequest;
  rejectParticipation: (requestId: string, hostNote?: string) => ParticipationRequest;
  withdrawParticipation: (requestId: string) => ParticipationRequest;
  markNotificationsRead: (notificationIds?: string[]) => void;
  resetDemoState: () => void;
}

export interface ProfileFormState {
  profile: Profile | null;
  returnTo?: string;
}
