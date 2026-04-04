import type { Match, ParticipationRequest, Profile } from "@/lib/types";
import type { MatchRequestRow, MatchRow, ProfileRow } from "@/lib/supabase/types";

export function mapProfileRow(row: ProfileRow): Profile {
  return {
    id: row.id,
    auth_user_id: row.auth_user_id,
    nickname: row.nickname,
    role: row.role,
    preferred_mode: row.preferred_mode,
    preferred_regions: row.preferred_regions ?? [],
    skill_level: row.skill_level,
    age: row.age,
    open_chat_link: row.open_chat_link,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function mapMatchRow(row: MatchRow): Match {
  return {
    id: row.id,
    creator_profile_id: row.creator_profile_id,
    mode: row.mode,
    listing_type: row.listing_type,
    title: row.title,
    region_slug: row.region_slug,
    address: row.address,
    lat: row.lat,
    lng: row.lng,
    start_at: row.start_at,
    fee: row.fee,
    total_slots: row.total_slots,
    remaining_slots: row.remaining_slots,
    min_group_size: row.min_group_size,
    max_group_size: row.max_group_size,
    skill_level: row.skill_level,
    contact_type: row.contact_type,
    contact_link: row.contact_link ?? "",
    note: row.note ?? "",
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function mapMatchRequestRow(row: MatchRequestRow): ParticipationRequest {
  return {
    id: row.id,
    match_id: row.match_id,
    requester_profile_id: row.requester_profile_id,
    host_profile_id: row.host_profile_id,
    requested_count: row.requested_count,
    message: row.message ?? "",
    entry_channel: row.entry_channel,
    status: row.status,
    host_note: row.host_note ?? undefined,
    accepted_contact_link: row.accepted_contact_link,
    created_at: row.created_at,
    decided_at: row.decided_at ?? undefined,
    updated_at: row.updated_at,
  };
}
