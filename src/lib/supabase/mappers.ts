import type { Match, ParticipationRequest, Profile } from "@/lib/types";
import type {
  ActivityMatchRequestRow,
  ActivityMatchRow,
  AppProfileRow,
  CreateMatchReturnRow,
  DetailMatchRow,
  DetailProfileRow,
  FeedMatchRow,
} from "@/lib/supabase/selects";

type ProfileRowLike = AppProfileRow | DetailProfileRow;

type MatchRowLike = FeedMatchRow | DetailMatchRow | CreateMatchReturnRow | ActivityMatchRow;

type MatchRequestRowLike = ActivityMatchRequestRow;

export function mapProfileRow(row: ProfileRowLike): Profile {
  return {
    id: row.id,
    auth_user_id: row.auth_user_id ?? null,
    nickname: row.nickname,
    role: row.role ?? "player",
    preferred_mode: row.preferred_mode ?? null,
    preferred_sport: row.preferred_sport ?? null,
    preferred_regions: row.preferred_regions ?? [],
    skill_level: row.skill_level ?? "mid",
    age: row.age ?? 20,
    open_chat_link: row.open_chat_link ?? null,
    phone_number: row.phone_number ?? null,
    default_contact_type: row.default_contact_type ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function mapMatchRow(row: MatchRowLike): Match {
  const minGroupSize = row.min_group_size ?? (row.mode === "team" ? 5 : 1);
  const defaultListingType =
    row.mode === "team" ? "team_match" : row.mode === "small_group" ? "partial_join" : "mercenary";

  return {
    id: row.id,
    creator_profile_id: row.creator_profile_id,
    mode: row.mode,
    listing_type: row.listing_type ?? defaultListingType,
    sport_type: row.sport_type ?? "futsal",
    futsal_format: row.futsal_format ?? ((row.sport_type ?? "futsal") === "futsal" ? "5vs5" : null),
    position_targets: row.position_targets ?? [],
    title: row.title,
    region_slug: row.region_slug,
    address: row.address ?? "",
    lat: row.lat ?? 0,
    lng: row.lng ?? 0,
    start_at: row.start_at,
    duration_minutes: row.duration_minutes ?? 120,
    fee: row.fee ?? 0,
    total_slots: row.total_slots ?? row.remaining_slots ?? 0,
    remaining_slots: row.remaining_slots ?? 0,
    min_group_size: minGroupSize,
    max_group_size: row.max_group_size ?? minGroupSize,
    skill_level: row.skill_level ?? "mid",
    contact_type: row.contact_type ?? "request_only",
    contact_link: row.contact_link ?? "",
    note: row.note ?? "",
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function mapMatchRequestRow(row: MatchRequestRowLike): ParticipationRequest {
  return {
    id: row.id,
    match_id: row.match_id,
    requester_profile_id: row.requester_profile_id,
    host_profile_id: row.host_profile_id,
    requested_count: row.requested_count ?? 1,
    message: row.message ?? "",
    entry_channel: row.entry_channel ?? "request_only",
    status: row.status,
    host_note: row.host_note ?? undefined,
    accepted_contact_link: row.accepted_contact_link ?? null,
    created_at: row.created_at,
    decided_at: row.decided_at ?? undefined,
    updated_at: row.updated_at,
  };
}
