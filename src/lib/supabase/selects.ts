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
  "title",
  "region_slug",
  "lat",
  "lng",
  "start_at",
  "fee",
  "remaining_slots",
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
  "title",
  "region_slug",
  "address",
  "lat",
  "lng",
  "start_at",
  "fee",
  "remaining_slots",
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
  "title",
  "region_slug",
  "start_at",
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
  "title",
  "region_slug",
  "address",
  "lat",
  "lng",
  "start_at",
  "fee",
  "remaining_slots",
  "min_group_size",
  "max_group_size",
  "skill_level",
  "contact_type",
  "contact_link",
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
  "nickname",
  "role",
  "preferred_mode",
  "preferred_regions",
  "skill_level",
  "age",
  "open_chat_link",
]);

export const PROFILE_DETAIL_SELECT = joinColumns([
  "id",
  "nickname",
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
  "status",
  "created_at",
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
  | "min_group_size"
  | "max_group_size"
  | "skill_level"
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
  | "min_group_size"
  | "max_group_size"
  | "skill_level"
  | "status"
>;

export type ActivityMatchRow = PartialRow<
  MatchRow,
  | "id"
  | "creator_profile_id"
  | "mode"
  | "title"
  | "region_slug"
  | "start_at"
  | "remaining_slots"
  | "contact_type"
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
  | "min_group_size"
  | "max_group_size"
  | "skill_level"
  | "contact_type"
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
