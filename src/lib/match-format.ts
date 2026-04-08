import type { FutsalFormatOption, ListingType, SportType } from "@/lib/types";

const MATCH_FORMAT_PREFIX = "[format:";

export function formatMatchFormatLabel(format: FutsalFormatOption | string) {
  return format;
}

export function buildMatchNote(note: string, format: FutsalFormatOption) {
  const trimmed = note.trim();
  const metadata = `${MATCH_FORMAT_PREFIX}${format}]`;

  return trimmed ? `${metadata}\n${trimmed}` : metadata;
}

export function getStoredNoteWithoutFormat(note?: string | null) {
  if (!note) {
    return "";
  }

  if (!note.startsWith(MATCH_FORMAT_PREFIX)) {
    return note.trim();
  }

  const endIndex = note.indexOf("]");

  if (endIndex === -1) {
    return note.trim();
  }

  return note.slice(endIndex + 1).trim();
}

export function getMatchFormatFromNote(note?: string | null): FutsalFormatOption | null {
  if (!note || !note.startsWith(MATCH_FORMAT_PREFIX)) {
    return null;
  }

  const endIndex = note.indexOf("]");

  if (endIndex === -1) {
    return null;
  }

  const format = note.slice(MATCH_FORMAT_PREFIX.length, endIndex);

  if (format === "4vs4" || format === "5vs5" || format === "6vs6") {
    return format;
  }

  return null;
}

export function getMatchFormatLabel(match: {
  listing_type: ListingType;
  sport_type?: SportType | null;
  futsal_format?: FutsalFormatOption | null;
  mode: string;
  min_group_size: number;
  max_group_size: number;
  note?: string | null;
}) {
  if ((match.sport_type ?? "futsal") !== "futsal") {
    return null;
  }

  if (match.futsal_format) {
    return formatMatchFormatLabel(match.futsal_format);
  }

  const noteFormat = getMatchFormatFromNote(match.note);

  if (noteFormat) {
    return formatMatchFormatLabel(noteFormat);
  }

  if (match.mode === "team") {
    return `${match.min_group_size}v${match.max_group_size}`;
  }

  return "5vs5";
}
