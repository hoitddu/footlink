export type EntryMode = "solo" | "small_group" | "team";
export type ListingType = "mercenary" | "partial_join" | "team_match";
export type ContactType = "openchat" | "request_only";
export type MatchStatus = "open" | "matched" | "closed" | "cancelled";
export type ParticipationStatus =
  | "pending"
  | "chat_entered"
  | "accepted"
  | "rejected"
  | "withdrawn";
export type DemoNotificationKind = "host_request_received" | "request_accepted";
export type SkillLevel = "입문" | "초급" | "중급" | "상급";
export type FeedPreset = "recommended" | "time" | "distance" | "urgent" | "price";

export interface Profile {
  id: string;
  nickname: string;
  role: "player" | "captain";
  preferred_mode: EntryMode;
  preferred_regions: string[];
  skill_level: SkillLevel;
  age: number;
  open_chat_link?: string;
}

export interface Match {
  id: string;
  creator_id: string;
  mode: EntryMode;
  listing_type: ListingType;
  title: string;
  region: string;
  address: string;
  lat: number;
  lng: number;
  start_at: string;
  fee: number;
  needed_count: number;
  min_group_size: number;
  max_group_size: number;
  skill_level: SkillLevel;
  contact_type: ContactType;
  contact_value: string;
  note: string;
  status: MatchStatus;
}

export interface ParticipationRequest {
  id: string;
  match_id: string;
  requester_id: string;
  host_id: string;
  entry_channel: ContactType;
  requested_count: number;
  message: string;
  status: ParticipationStatus;
  created_at: string;
  decided_at?: string;
  host_note?: string;
}

export interface DemoNotification {
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

export interface RegionOption {
  slug: string;
  label: string;
  area: "서울" | "경기";
  lat: number;
  lng: number;
}

export interface FeedContext {
  mode: EntryMode;
  groupSize: number;
  regionSlug?: string;
  regionLabel: string;
  selectedDateFrom?: string;
  selectedDateTo?: string;
  selectedDateLabel?: string;
  skillLevel?: SkillLevel;
  lat?: number;
  lng?: number;
}

export interface FeedDataSource {
  matches: Match[];
  profiles: Profile[];
  participationRequests: ParticipationRequest[];
  regions: RegionOption[];
}

export interface DemoAppState extends FeedDataSource {
  currentProfileId: string;
  notifications: DemoNotification[];
}

export interface MatchWithMeta extends Match {
  distanceKm: number;
  minutesUntilStart: number;
  statusLabel: string;
  statusTone: "urgent" | "soon" | "team" | "calm";
  compatibilityScore: number;
  organizer?: Profile;
}

export type CreateMatchInput = Omit<Match, "id" | "creator_id" | "status">;

export interface SubmitParticipationInput {
  matchId: string;
  requestedCount: number;
  message: string;
}

export interface DemoAppActions {
  switchProfile: (profileId: string) => void;
  updateCurrentProfile: (
    updates: Partial<
      Pick<
        Profile,
        "nickname" | "preferred_mode" | "preferred_regions" | "skill_level" | "age" | "open_chat_link"
      >
    >,
  ) => void;
  createMatch: (input: CreateMatchInput) => Match;
  submitParticipation: (input: SubmitParticipationInput) => ParticipationRequest;
  acceptParticipation: (requestId: string, hostNote?: string) => ParticipationRequest;
  rejectParticipation: (requestId: string, hostNote?: string) => ParticipationRequest;
  withdrawParticipation: (requestId: string) => ParticipationRequest;
  markNotificationsRead: (notificationIds?: string[]) => void;
  resetDemoState: () => void;
}
