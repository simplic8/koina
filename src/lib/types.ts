import type { LocaleCode } from "@/lib/i18n/locales";

export type UserRole = "user" | "admin";
export type UserStatus = "active" | "suspended";
export type ChatSource = "discord" | "web";

export type SessionSearchBy = "all" | "title" | "creator" | "game" | "platform";
export type SessionSort = "title" | "date" | "registered";
export type SessionSortDir = "asc" | "desc";
export type SessionPageSize = 6 | 12 | 24;

export type Profile = {
  id: string;
  username: string | null;
  display_name?: string | null;
  avatar_url: string | null;
  discord_id: string | null;
  roblox_user_id: string | null;
  role: UserRole;
  status: UserStatus;
  email_confirmed?: boolean;
  created_at: string;
};

export type GameProfilePlatform = "holodori" | "roblox";

export type GameProfile = {
  user_id: string;
  platform: GameProfilePlatform;
  holodori_game_id: string | null;
  oshi_ids: string[];
  roblox_username: string | null;
  roblox_display_name: string | null;
  roblox_user_id: string | null;
  roblox_avatar_url: string | null;
  roblox_bio: string | null;
  roblox_online_status: string | null;
  roblox_synced_at: string | null;
  created_at: string;
  updated_at: string;
};

export type GameTranslation = {
  locale: LocaleCode;
  title: string;
  description: string | null;
};

export type Game = {
  id: string;
  slug: string;
  title: string;
  platform: string;
  description: string | null;
  roblox_universe_id: string | null;
  roblox_place_id: string | null;
  ordered_datastore_id: string | null;
  is_vetted: boolean;
  is_published: boolean;
  is_featured: boolean;
  sort_order: number;
  published_at: string | null;
  created_at?: string;
  translations?: GameTranslation[];
};

export type Session = {
  id: string;
  game_id: string;
  creator_id?: string | null;
  title: string;
  starts_at: string;
  capacity: number;
  registered_count: number;
  created_at?: string;
  /** Author language tag for the session title (not machine-translated). */
  locale: LocaleCode;
  game?: (Pick<Game, "title" | "slug" | "platform"> & {
    translations?: GameTranslation[];
  }) | null;
  creator?: { username: string | null } | null;
  /** Whether the signed-in viewer has RSVP'd (list hydration). */
  viewer_joined?: boolean;
};

export type FriendshipStatus =
  | "none"
  | "outgoing"
  | "incoming"
  | "friends";

export type SessionParticipant = {
  id: string;
  username: string | null;
  display_name?: string | null;
  avatar_url: string | null;
  /** Holodori in-game ID when the session game is Holodori. */
  holodori_game_id?: string | null;
  friendship_status?: FriendshipStatus;
  /** Whether the signed-in viewer has this person on their friends list. */
  is_friend?: boolean;
};

export type FriendPerson = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  friendship_status: FriendshipStatus;
  is_friend: boolean;
  last_played_at: string | null;
  holodori_game_id?: string | null;
};

export type InboxNotificationType =
  | "friend_request"
  | "friend_request_accepted"
  | "friend_request_declined"
  | "friend_accepted"
  | "message";

export type InboxNotification = {
  id: string;
  type: InboxNotificationType;
  body: string | null;
  read_at: string | null;
  created_at: string;
  actor: {
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  friendship_id: string | null;
  message_id: string | null;
};

export type InboxConversation = {
  user: {
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  };
  last_message: {
    id: string;
    body: string;
    sender_id: string;
    created_at: string;
    read_at: string | null;
  } | null;
  unread_count: number;
};

export type DirectMessage = {
  id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
};

export type FriendSessionSummary = {
  id: string;
  title: string;
  starts_at: string;
  capacity: number;
  registered_count: number;
  game: { title: string; slug: string; platform: string } | null;
  participants: FriendPerson[];
};

export type SessionDetail = {
  session: Session;
  participants: SessionParticipant[];
  viewer_joined: boolean;
};

export type SessionListQuery = {
  q?: string;
  by?: SessionSearchBy;
  sort?: SessionSort;
  dir?: SessionSortDir;
  page?: number;
  size?: SessionPageSize;
  upcomingOnly?: boolean;
  /** When true, only sessions with starts_at in the past. */
  pastOnly?: boolean;
  /** When set, only sessions for this game slug. */
  gameSlug?: string;
};

export type SessionListResult = {
  sessions: Session[];
  total: number;
  page: number;
  pageSize: SessionPageSize;
  pageCount: number;
};

export type SessionTitleSuggestion = {
  title: string;
  game_slug: string | null;
};

export type HeroQuote = {
  id: string;
  first_line: string;
  second_line: string;
  sort_order: number;
};

export type HolodoriHeroLine = {
  id: string;
  word_one: string;
  word_two: string;
  word_three: string;
  sort_order: number;
};

export type Score = {
  id: string;
  game_id: string;
  user_id: string | null;
  roblox_entry_key: string | null;
  display_name: string | null;
  score: number;
  synced_at: string | null;
  game?: (Pick<Game, "title" | "slug"> & {
    translations?: GameTranslation[];
  }) | null;
};

export type ChatMessage = {
  id: string;
  channel: string;
  author: string;
  author_discord_id: string | null;
  author_avatar_url: string | null;
  author_avatar_decoration_url: string | null;
  author_badges: {
    id: string;
    label: string;
    iconUrl: string;
    tag?: string;
  }[];
  body: string;
  discord_message_id: string | null;
  source: ChatSource;
  user_id: string | null;
  created_at: string;
};

export type ForumPresenterState = {
  slideIndex?: number;
  lang?: "en" | "ja" | "both";
  lightbox?: {
    open: boolean;
    src?: string;
    alt?: string;
    capHtml?: string;
  } | null;
  qview?: { open: boolean; index?: number | null } | null;
  ui?: Record<string, string | number | boolean | null>;
  /** Unique token so viewers re-apply even if slideIndex is unchanged. */
  syncToken?: number;
  /** Bumped when presenter clicks “Bring viewers” — pollers detect this. */
  bringToken?: number;
  force?: boolean;
  prompt?: boolean;
};

export type ForumSession = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  storage_path: string;
  created_by: string | null;
  is_live: boolean;
  presenter_state: ForumPresenterState;
  created_at: string;
  updated_at: string;
};

export type ForumResponse = {
  id: string;
  session_id: string;
  activity_key: string;
  option_key: string;
  participant_key: string;
  payload: Record<string, unknown>;
  user_id: string | null;
  created_at: string;
  updated_at: string;
};
