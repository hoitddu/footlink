import type {
  ContactType,
  DirectContactType,
  EntryMode,
  FutsalFormatOption,
  ListingType,
  MatchStatus,
  ParticipationStatus,
  RegionSlug,
  SkillLevel,
  SportType,
  UserRole,
} from "@/lib/types";

export interface ProfileRow {
  id: string;
  auth_user_id: string | null;
  nickname: string;
  role: UserRole;
  preferred_mode: EntryMode | null;
  preferred_sport: SportType | null;
  preferred_regions: string[] | null;
  skill_level: SkillLevel;
  age: number;
  open_chat_link: string | null;
  phone_number: string | null;
  default_contact_type: DirectContactType | null;
  created_at: string;
  updated_at: string;
}

export interface MatchRow {
  id: string;
  creator_profile_id: string;
  mode: EntryMode;
  listing_type: ListingType;
  sport_type: SportType | null;
  futsal_format: FutsalFormatOption | null;
  title: string;
  region_slug: RegionSlug;
  address: string;
  lat: number;
  lng: number;
  start_at: string;
  duration_minutes: number | null;
  fee: number;
  total_slots: number;
  remaining_slots: number;
  min_group_size: number;
  max_group_size: number;
  skill_level: SkillLevel;
  contact_type: ContactType;
  contact_link: string | null;
  note: string | null;
  status: MatchStatus;
  created_at: string;
  updated_at: string;
}

export interface MatchRequestRow {
  id: string;
  match_id: string;
  requester_profile_id: string;
  host_profile_id: string;
  requested_count: number;
  message: string | null;
  entry_channel: ContactType;
  status: ParticipationStatus;
  host_note: string | null;
  accepted_contact_link: string | null;
  created_at: string;
  decided_at: string | null;
  updated_at: string;
}

export interface NotificationReadRow {
  profile_id: string;
  notification_id: string;
  read_at: string;
  created_at: string;
}
