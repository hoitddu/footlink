import type { MatchRequestRow, MatchRow, NotificationReadRow, ProfileRow } from "@/lib/supabase/types";

function joinColumns(columns: string[]) {
  return columns.join(", ");
}

type PartialRow<T, K extends keyof T> = Pick<T, K> & Partial<Omit<T, K>>;

export const MATCH_FEED_SELECT = joinColumns([
  "id",
  "creator_profile_id",
  "mode",
  "listing_type",
  "sport_type",
  "futsal_format",
  "position_targets",
  "title",
  "region_slug",
  "lat",
  "lng",
  "start_at",
  "duration_minutes",
  "fee",
  "remaining_slots",
  "contact_type",
  "min_group_size",
  "max_group_size",
  "skill_level",
  "status",
]);

export const MATCH_DETAIL_SELECT = joinColumns([
  "id",
  "creator_profile_id",
  "mode",
  "listing_type",
  "sport_type",
  "futsal_format",
  "position_targets",
  "title",
  "region_slug",
  "address",
  "lat",
  "lng",
  "start_at",
  "duration_minutes",
  "fee",
  "remaining_slots",
  "contact_type",
  "min_group_size",
  "max_group_size",
  "skill_level",
  "note",
  "status",
]);

export const MATCH_ACTIVITY_SELECT = joinColumns([
  "id",
  "creator_profile_id",
  "mode",
  "listing_type",
  "sport_type",
  "futsal_format",
  "position_targets",
  "title",
  "region_slug",
  "address",
  "start_at",
  "duration_minutes",
  "fee",
  "remaining_slots",
  "contact_type",
  "contact_link",
  "status",
]);

export const MATCH_CREATE_RETURN_SELECT = joinColumns([
  "id",
  "creator_profile_id",
  "mode",
  "listing_type",
  "sport_type",
  "futsal_format",
  "position_targets",
  "title",
  "region_slug",
  "address",
  "lat",
  "lng",
  "start_at",
  "duration_minutes",
  "fee",
  "remaining_slots",
  "contact_type",
  "contact_link",
  "min_group_size",
  "max_group_size",
  "skill_level",
  "note",
  "status",
]);

export const MATCH_REQUEST_VALIDATION_SELECT = joinColumns([
  "id",
  "creator_profile_id",
  "remaining_slots",
  "status",
  "contact_type",
]);

export const PROFILE_APP_SELECT = joinColumns([
  "id",
  "auth_user_id",
  "nickname",
  "role",
  "preferred_mode",
  "preferred_sport",
  "preferred_regions",
  "skill_level",
  "age",
  "open_chat_link",
  "phone_number",
  "default_contact_type",
  "created_at",
  "updated_at",
]);

export const PROFILE_DETAIL_SELECT = joinColumns([
  "id",
  "nickname",
  "preferred_sport",
  "preferred_regions",
  "age",
]);

export const MATCH_REQUEST_ACTIVITY_SELECT = joinColumns([
  "id",
  "match_id",
  "requester_profile_id",
  "host_profile_id",
  "requested_count",
  "message",
  "entry_channel",
  "status",
  "host_note",
  "accepted_contact_link",
  "created_at",
  "decided_at",
]);

export const MATCH_REQUEST_PERSONALIZATION_SELECT = joinColumns([
  "id",
  "match_id",
  "requester_profile_id",
  "host_profile_id",
  "requested_count",
  "entry_channel",
  "status",
  "accepted_contact_link",
  "created_at",
  "updated_at",
]);

export const MATCH_REQUEST_PATH_SELECT = joinColumns(["id", "match_id"]);

export const NOTIFICATION_READ_SELECT = joinColumns([
  "profile_id",
  "notification_id",
  "read_at",
  "created_at",
]);

export type FeedMatchRow = PartialRow<
  MatchRow,
  | "id"
  | "creator_profile_id"
  | "mode"
  | "listing_type"
  | "title"
  | "region_slug"
  | "lat"
  | "lng"
  | "start_at"
  | "fee"
  | "remaining_slots"
  | "status"
>;

export type DetailMatchRow = PartialRow<
  MatchRow,
  | "id"
  | "creator_profile_id"
  | "mode"
  | "listing_type"
  | "title"
  | "region_slug"
  | "address"
  | "lat"
  | "lng"
  | "start_at"
  | "fee"
  | "remaining_slots"
  | "status"
>;

export type ActivityMatchRow = PartialRow<
  MatchRow,
  | "id"
  | "creator_profile_id"
  | "mode"
  | "listing_type"
  | "title"
  | "region_slug"
  | "address"
  | "start_at"
  | "fee"
  | "remaining_slots"
  | "contact_type"
  | "contact_link"
  | "status"
>;

export type CreateMatchReturnRow = PartialRow<
  MatchRow,
  | "id"
  | "creator_profile_id"
  | "mode"
  | "listing_type"
  | "title"
  | "region_slug"
  | "address"
  | "lat"
  | "lng"
  | "start_at"
  | "fee"
  | "remaining_slots"
  | "contact_type"
  | "contact_link"
  | "status"
>;

export type MatchRequestValidationRow = Pick<
  MatchRow,
  "id" | "creator_profile_id" | "remaining_slots" | "status" | "contact_type"
>;

export type AppProfileRow = PartialRow<
  ProfileRow,
  "id" | "nickname" | "role" | "skill_level" | "age"
>;

export type DetailProfileRow = PartialRow<ProfileRow, "id" | "nickname" | "age">;

export type ActivityMatchRequestRow = PartialRow<
  MatchRequestRow,
  "id" | "match_id" | "requester_profile_id" | "host_profile_id" | "requested_count" | "status" | "created_at"
>;

export type RequestPathRow = Pick<MatchRequestRow, "id" | "match_id">;

export type NotificationReadSelectRow = Pick<
  NotificationReadRow,
  "profile_id" | "notification_id" | "read_at" | "created_at"
>;
