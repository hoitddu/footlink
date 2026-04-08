import { REGION_OPTIONS, SKILL_LEVELS } from "@/lib/constants";
import type {
  Match,
  ParticipationRequest,
  Profile,
  RegionOption,
  SkillLevel,
} from "@/lib/types";

function createBaseDate(referenceNow?: number) {
  return new Date(referenceNow ?? Date.now());
}

function minutesFrom(baseDate: Date, minutes: number) {
  return new Date(baseDate.getTime() + minutes * 60 * 1000).toISOString();
}

function hoursFrom(baseDate: Date, hours: number, extraMinutes = 0) {
  return minutesFrom(baseDate, hours * 60 + extraMinutes);
}

function minutesAgo(baseDate: Date, minutes: number) {
  return new Date(baseDate.getTime() - minutes * 60 * 1000).toISOString();
}

function match(values: Omit<Match, "status"> & { status?: Match["status"] }): Match {
  return {
    status: "open",
    sport_type: values.sport_type ?? "futsal",
    ...values,
  };
}

export const regions: RegionOption[] = REGION_OPTIONS;

export const profiles: Profile[] = [
  {
    id: "profile-junseo",
    nickname: "준서팀장",
    role: "captain",
    preferred_mode: "small_group",
    preferred_sport: "futsal",
    preferred_regions: ["수원"],
    skill_level: "mid",
    age: 31,
    open_chat_link: "https://open.kakao.com/o/example1",
  },
  {
    id: "profile-minho",
    nickname: "민호FC",
    role: "player",
    preferred_mode: "solo",
    preferred_sport: "futsal",
    preferred_regions: ["수원"],
    skill_level: "low",
    age: 29,
    open_chat_link: "https://open.kakao.com/o/example2",
  },
  {
    id: "profile-dohyun",
    nickname: "도현캡틴",
    role: "captain",
    preferred_mode: "team",
    preferred_sport: "soccer",
    preferred_regions: ["수원"],
    skill_level: "high",
    age: 34,
    open_chat_link: "https://open.kakao.com/o/example6",
  },
  {
    id: "profile-yuna",
    nickname: "유나메이트",
    role: "player",
    preferred_mode: "small_group",
    preferred_sport: "futsal",
    preferred_regions: ["수원"],
    skill_level: "mid",
    age: 29,
    open_chat_link: "https://open.kakao.com/o/example4",
  },
];

export function createMatches(referenceNow?: number): Match[] {
  const baseDate = createBaseDate(referenceNow);

  return [
    match({
      id: "match-suwon-ingye-urgent",
      creator_profile_id: "profile-junseo",
      mode: "solo",
      listing_type: "mercenary",
      title: "인계 풋살존",
      region_slug: "suwon",
      address: "경기 수원시 팔달구 인계로 138 인계 풋살존",
      lat: 37.2658,
      lng: 127.0315,
      start_at: minutesFrom(baseDate, 35),
      fee: 9000,
      total_slots: 2,
      remaining_slots: 2,
      min_group_size: 1,
      max_group_size: 1,
      skill_level: "mid",
      contact_type: "request_only",
      contact_link: "",
      note: "오늘 바로 경기 가능하신 분이면 빠르게 확정할게요.",
    }),
    match({
      id: "match-suwon-yeongtong-solo",
      creator_profile_id: "profile-minho",
      sport_type: "soccer",
      mode: "solo",
      listing_type: "mercenary",
      title: "영통 실내구장",
      region_slug: "suwon",
      address: "경기 수원시 영통구 중부대로 1590 영통 실내구장",
      lat: 37.2524,
      lng: 127.0718,
      start_at: minutesFrom(baseDate, 55),
      fee: 10000,
      total_slots: 1,
      remaining_slots: 1,
      min_group_size: 1,
      max_group_size: 1,
      skill_level: "low",
      contact_type: "openchat",
      contact_link: "https://open.kakao.com/o/example3",
      note: "가볍게 즐기는 분위기예요. 초급도 편하게 오세요.",
    }),
    match({
      id: "match-suwon-gwanggyo-group",
      creator_profile_id: "profile-yuna",
      mode: "small_group",
      listing_type: "partial_join",
      title: "광교 스포츠타운",
      region_slug: "suwon",
      address: "경기 수원시 영통구 광교중앙로 170 광교 스포츠타운",
      lat: 37.2861,
      lng: 127.0517,
      start_at: hoursFrom(baseDate, 1, 20),
      fee: 11000,
      total_slots: 1,
      remaining_slots: 1,
      min_group_size: 2,
      max_group_size: 4,
      skill_level: "mid",
      contact_type: "openchat",
      contact_link: "https://open.kakao.com/o/example4",
      note: "친구랑 같이 오셔도 좋아요. 템포 맞는 분을 우선으로 받을게요.",
    }),
    match({
      id: "match-suwon-mangpo-group",
      creator_profile_id: "profile-junseo",
      mode: "small_group",
      listing_type: "partial_join",
      title: "망포 스타트",
      region_slug: "suwon",
      address: "경기 수원시 영통구 영통로 237 망포 스타트",
      lat: 37.2458,
      lng: 127.0589,
      start_at: hoursFrom(baseDate, 2, 10),
      fee: 10000,
      total_slots: 3,
      remaining_slots: 3,
      min_group_size: 2,
      max_group_size: 4,
      skill_level: "mid",
      contact_type: "request_only",
      contact_link: "",
      note: "2~3명 단위로 받고 있어요. 템포 좋게 게임하실 팀이면 환영합니다.",
    }),
    match({
      id: "match-suwon-homaesil-group",
      creator_profile_id: "profile-yuna",
      mode: "small_group",
      listing_type: "partial_join",
      title: "호매실 실내필드",
      region_slug: "suwon",
      address: "경기 수원시 권선구 금곡로 205 호매실 실내필드",
      lat: 37.2665,
      lng: 126.9569,
      start_at: hoursFrom(baseDate, 3, 5),
      fee: 9000,
      total_slots: 2,
      remaining_slots: 2,
      min_group_size: 2,
      max_group_size: 3,
      skill_level: "low",
      contact_type: "openchat",
      contact_link: "https://open.kakao.com/o/example5",
      note: "수원 초보 위주에서 편하게 같이 뛸 분 찾고 있습니다. 초급 환영이에요.",
    }),
    match({
      id: "match-suwon-team-1",
      creator_profile_id: "profile-dohyun",
      mode: "team",
      listing_type: "team_match",
      title: "수원 챔피언스",
      region_slug: "suwon",
      address: "경기 수원시 장안구 조원로 81 수원 챔피언스",
      lat: 37.3045,
      lng: 127.0104,
      start_at: hoursFrom(baseDate, 2, 30),
      fee: 65000,
      total_slots: 1,
      remaining_slots: 1,
      min_group_size: 5,
      max_group_size: 10,
      skill_level: "high",
      contact_type: "openchat",
      contact_link: "https://open.kakao.com/o/example6",
      note: "팀매치 경험 있는 팀이면 좋겠습니다. 경기 템포 빠른 편입니다.",
    }),
    match({
      id: "match-suwon-team-2",
      creator_profile_id: "profile-dohyun",
      mode: "team",
      listing_type: "team_match",
      title: "브라보돔 아레나",
      region_slug: "suwon",
      address: "경기 수원시 권선구 권선로 120 브라보돔 아레나",
      lat: 37.2581,
      lng: 127.0212,
      start_at: hoursFrom(baseDate, 4, 10),
      fee: 60000,
      total_slots: 1,
      remaining_slots: 1,
      min_group_size: 5,
      max_group_size: 10,
      skill_level: "mid",
      contact_type: "request_only",
      contact_link: "",
      note: "중급 팀 위주로 받고 있어요. 매너 좋고 일정 정확한 팀이면 좋겠습니다.",
    }),
  ];
}

export function createParticipationRequests(referenceNow?: number): ParticipationRequest[] {
  const baseDate = createBaseDate(referenceNow);

  return [
    {
      id: "request-1",
      match_id: "match-suwon-ingye-urgent",
      requester_profile_id: "profile-minho",
      host_profile_id: "profile-junseo",
      entry_channel: "request_only",
      requested_count: 1,
      message: "혼자 참가 희망합니다. 바로 이동 가능합니다.",
      status: "pending",
      created_at: minutesAgo(baseDate, 12),
    },
    {
      id: "request-2",
      match_id: "match-suwon-gwanggyo-group",
      requester_profile_id: "profile-junseo",
      host_profile_id: "profile-yuna",
      entry_channel: "openchat",
      requested_count: 3,
      message: "3명이 같이 합류하고 싶습니다.",
      status: "accepted",
      accepted_contact_link: "https://open.kakao.com/o/example4",
      created_at: minutesAgo(baseDate, 65),
      decided_at: minutesAgo(baseDate, 50),
      host_note: "오픈채팅으로 일정 공유드릴게요.",
    },
    {
      id: "request-3",
      match_id: "match-suwon-team-2",
      requester_profile_id: "profile-yuna",
      host_profile_id: "profile-dohyun",
      entry_channel: "request_only",
      requested_count: 1,
      message: "상대 팀 일정 문의드립니다.",
      status: "rejected",
      created_at: minutesAgo(baseDate, 95),
      decided_at: minutesAgo(baseDate, 70),
      host_note: "이미 상대팀이 확정됐습니다.",
    },
    {
      id: "request-4",
      match_id: "match-suwon-homaesil-group",
      requester_profile_id: "profile-minho",
      host_profile_id: "profile-yuna",
      entry_channel: "openchat",
      requested_count: 2,
      message: "친구 한 명과 같이 들어가고 싶습니다.",
      status: "pending",
      created_at: minutesAgo(baseDate, 20),
    },
  ];
}

export const matches = createMatches();
export const participationRequests = createParticipationRequests();
export const skillLabels: SkillLevel[] = SKILL_LEVELS;
