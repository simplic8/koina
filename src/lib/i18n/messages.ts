import type { LocaleCode } from "./locales";
import { pageOverrides } from "./page-overrides";

export type MessageKey =
  | "nav.games"
  | "nav.sessions"
  | "nav.holodori"
  | "nav.spaces"
  | "nav.ethos"
  | "nav.about"
  | "nav.chat"
  | "nav.admin"
  | "nav.signIn"
  | "nav.register"
  | "nav.profile"
  | "nav.inbox"
  | "nav.signOut"
  | "nav.new"
  | "nav.menu"
  | "nav.language"
  | "hero.live"
  | "hero.leadPrefix"
  | "hero.leadSuffix"
  | "hero.lead"
  | "hero.byline"
  | "hero.defaultFirst"
  | "hero.defaultSecond"
  | "hero.ctaSessions"
  | "hero.ctaSchedule"
  | "hero.ctaGames"
  | "hero.ctaSpaces"
  | "hero.ctaEthos"
  | "hero.ctaJoin"
  | "hero.liveBoard"
  | "hero.scoreboard"
  | "footer.tagline"
  | "footer.product"
  | "footer.explore"
  | "footer.community"
  | "footer.ecosystem"
  | "footer.legal"
  | "footer.leaderboard"
  | "footer.discord"
  | "footer.rules"
  | "footer.terms"
  | "footer.privacy"
  | "footer.builtWith"
  | "footer.disclaimer"
  | "footer.inspired"
  | "spaces.eyebrow"
  | "spaces.title"
  | "spaces.lead"
  | "spaces.visit"
  | "spaces.comingSoon"
  | "spaces.jvBadge"
  | "spaces.jvBody"
  | "spaces.oshiBadge"
  | "spaces.oshiBody"
  | "spaces.numaBadge"
  | "spaces.numaBody"
  | "ethos.eyebrow"
  | "ethos.title"
  | "ethos.subtitle"
  | "ethos.lead"
  | "ethos.e1Title"
  | "ethos.e1Body"
  | "ethos.e1Verse"
  | "ethos.e2Title"
  | "ethos.e2Body"
  | "ethos.e2Verse"
  | "ethos.e3Title"
  | "ethos.e3Body"
  | "ethos.e3Verse"
  | "ethos.e4Title"
  | "ethos.e4Body"
  | "ethos.e4Verse"
  | "ethos.e5Title"
  | "ethos.e5Body"
  | "ethos.e5Verse"
  | "about.etymology"
  | "auth.welcomeBack"
  | "auth.signInTitle"
  | "auth.signInLead"
  | "auth.joinSquad"
  | "auth.registerTitle"
  | "auth.registerLead"
  | "auth.email"
  | "auth.password"
  | "auth.username"
  | "auth.or"
  | "auth.continueGoogle"
  | "auth.continueDiscord"
  | "auth.newHere"
  | "auth.createAccount"
  | "auth.alreadyRegistered"
  | "auth.signInCta"
  | "auth.createAccountCta"
  | "profile.language"
  | "profile.languageHint"
  | "profile.pageTitle"
  | "profile.pageLead"
  | "profile.sections"
  | "profile.section.general"
  | "profile.section.holodori"
  | "profile.section.roblox"
  | "profile.section.friends"
  | "profile.saving"
  | "profile.holodori.title"
  | "profile.holodori.lead"
  | "profile.holodori.gameId"
  | "profile.holodori.gameIdPlaceholder"
  | "profile.holodori.gameIdHint"
  | "profile.holodori.oshi"
  | "profile.holodori.oshiHint"
  | "profile.holodori.oshiEmpty"
  | "profile.holodori.oshiChoose"
  | "profile.holodori.removeOshi"
  | "profile.holodori.search"
  | "profile.holodori.searchPlaceholder"
  | "profile.holodori.clearSearch"
  | "profile.holodori.viewMode"
  | "profile.holodori.viewCards"
  | "profile.holodori.viewList"
  | "profile.holodori.noMatch"
  | "profile.holodori.selectedCount"
  | "profile.holodori.save"
  | "profile.holodori.saved"
  | "profile.holodori.oshiSaved"
  | "profile.holodori.toastSaved"
  | "profile.holodori.toastRemoved"
  | "profile.holodori.saveError"
  | "profile.holodori.playedTitle"
  | "profile.holodori.playedLead"
  | "profile.holodori.playedEmpty"
  | "profile.holodori.playedLoading"
  | "profile.holodori.playedError"
  | "profile.holodori.colPlayer"
  | "profile.holodori.colGameId"
  | "profile.holodori.colLastPlayed"
  | "profile.roblox.title"
  | "profile.roblox.lead"
  | "profile.roblox.username"
  | "profile.roblox.usernamePlaceholder"
  | "profile.roblox.displayName"
  | "profile.roblox.bio"
  | "profile.roblox.onlineStatus"
  | "profile.roblox.userId"
  | "profile.roblox.noAvatar"
  | "profile.roblox.pullFromRoblox"
  | "profile.roblox.syncing"
  | "profile.roblox.synced"
  | "profile.roblox.lastSynced"
  | "profile.roblox.save"
  | "profile.roblox.saved"
  | "profile.roblox.saveError"
  | "profile.roblox.syncError"
  | "profile.friends.title"
  | "profile.friends.lead"
  | "profile.friends.listEmpty"
  | "profile.friends.playedTitle"
  | "profile.friends.playedLead"
  | "profile.friends.loading"
  | "profile.friends.loadError"
  | "profile.friends.actionError"
  | "profile.friends.colPlayer"
  | "profile.friends.colLastPlayed"
  | "profile.friends.colStatus"
  | "profile.friends.colAction"
  | "profile.friends.statusFriend"
  | "profile.friends.statusNotFriend"
  | "profile.friends.add"
  | "profile.friends.remove"
  | "profile.friends.playedEmpty"
  | "profile.friends.sessionsTitle"
  | "profile.friends.sessionsLead"
  | "profile.friends.sessionsEmpty"
  | "profile.friends.you"
  | "sessions.addFriend"
  | "sessions.removeFriend"
  | "sessions.friendPending"
  | "sessions.acceptFriend"
  | "sessions.declineFriend"
  | "sessions.cancelFriendRequest"
  | "inbox.pageTitle"
  | "inbox.pageLead"
  | "inbox.notifications"
  | "inbox.messages"
  | "inbox.loading"
  | "inbox.loadError"
  | "inbox.sendError"
  | "inbox.notificationsEmpty"
  | "inbox.messagesEmpty"
  | "inbox.findFriends"
  | "inbox.friendRequest"
  | "inbox.friendRequestAccepted"
  | "inbox.friendRequestDeclined"
  | "inbox.friendAccepted"
  | "inbox.newMessage"
  | "inbox.openChat"
  | "inbox.messageFriend"
  | "inbox.selectConversation"
  | "inbox.threadEmpty"
  | "inbox.messagePlaceholder"
  | "inbox.send"
  | "inbox.sending"
  | "common.player"
  | "common.roblox"
  | "common.external"
  | "common.game"
  | "common.experience"
  | "about.eyebrow"
  | "about.title"
  | "about.lead"
  | "about.f1Title"
  | "about.f1Desc"
  | "about.f2Title"
  | "about.f2Desc"
  | "about.f3Title"
  | "about.f3Desc"
  | "sessions.featured"
  | "sessions.seeAll"
  | "sessions.emptyTitle"
  | "sessions.emptyBody"
  | "sessions.pageTitle"
  | "sessions.pageLead"
  | "sessions.hostedBy"
  | "sessions.startsIn"
  | "sessions.startingNow"
  | "sessions.registered"
  | "sessions.join"
  | "sessions.drop"
  | "sessions.delete"
  | "sessions.deleteConfirm"
  | "sessions.edit"
  | "sessions.editTitle"
  | "sessions.editLead"
  | "sessions.saveEdit"
  | "sessions.savingEdit"
  | "sessions.share"
  | "sessions.shareJoinLink"
  | "sessions.shareCopied"
  | "sessions.shareFailed"
  | "sessions.full"
  | "sessions.youJoined"
  | "sessions.working"
  | "sessions.close"
  | "sessions.participants"
  | "sessions.loadingParticipants"
  | "sessions.noParticipants"
  | "sessions.removeParticipant"
  | "sessions.leaveParticipant"
  | "sessions.holodoriGameIdRequired"
  | "sessions.holodoriGameIdCta"
  | "sessions.detailLoadError"
  | "sessions.actionError"
  | "sessions.unknownCreator"
  | "sessions.current"
  | "sessions.past"
  | "sessions.pastEmpty"
  | "sessions.clickToExpand"
  | "sessions.noMatch"
  | "sessions.showing"
  | "sessions.resetFilters"
  | "sessions.filteredByGame"
  | "sessions.clearGameFilter"
  | "sessions.filters"
  | "sessions.showFilters"
  | "sessions.hideFilters"
  | "sessions.viewMode"
  | "sessions.viewCards"
  | "sessions.viewList"
  | "sessions.search"
  | "sessions.searchPlaceholder"
  | "sessions.filterBy"
  | "sessions.allFields"
  | "sessions.sessionTitle"
  | "sessions.gameTitle"
  | "sessions.platform"
  | "sessions.creatorName"
  | "sessions.sortBy"
  | "sessions.dateTime"
  | "sessions.registeredPlayers"
  | "sessions.direction"
  | "sessions.ascending"
  | "sessions.descending"
  | "sessions.perPage"
  | "sessions.apply"
  | "sessions.clear"
  | "sessions.noMatchTitle"
  | "sessions.noMatchBody"
  | "sessions.previous"
  | "sessions.next"
  | "sessions.pagination"
  | "games.featured"
  | "games.all"
  | "games.browseAll"
  | "games.leaderboardLink"
  | "games.playRoblox"
  | "games.visitSite"
  | "games.viewLeaderboard"
  | "games.pageTitle"
  | "games.pageLead"
  | "communities.featured"
  | "communities.visit"
  | "communities.shepherdTitle"
  | "communities.shepherdBadge"
  | "communities.shepherdBody"
  | "lb.global"
  | "lb.title"
  | "lb.viewInGames"
  | "lb.allGames"
  | "lb.rank"
  | "lb.player"
  | "lb.game"
  | "lb.score"
  | "lb.empty"
  | "chat.community"
  | "chat.openFull"
  | "chat.updatesEvery"
  | "chat.empty"
  | "chat.signInPrompt"
  | "chat.send"
  | "chat.jumpLatest"
  | "chat.syncNote"
  | "chat.pageTitle"
  | "chat.messagePlaceholder"
  | "chat.signIn"
  | "onboarding.eyebrow"
  | "onboarding.welcome"
  | "onboarding.lead"
  | "onboarding.setupProfile"
  | "onboarding.browseSessions"
  | "onboarding.goHome"
  | "onboarding.updateLater"
  | "onboarding.openSettings"
  | "confirm.eyebrow"
  | "confirm.title"
  | "confirm.lead"
  | "confirm.resend"
  | "confirm.already"
  | "confirm.signIn"
  | "confirm.email"
  | "confirm.sending"
  | "auth.needConfirm"
  | "auth.resendLink"
  | "holodori.featured"
  | "holodori.lead"
  | "holodori.visitSite"
  | "holodori.schedule"
  | "holodori.browseSessions"
  | "holodori.playingNow"
  | "holodori.playingNowTitle"
  | "holodori.playingNowEmpty"
  | "holodori.howPlay"
  | "holodori.howPlayTitle"
  | "holodori.howPlayLead"
  | "holodori.rhythm"
  | "holodori.rhythmDesc"
  | "holodori.minigames"
  | "holodori.minigamesDesc"
  | "holodori.training"
  | "holodori.trainingDesc"
  | "holodori.available"
  | "holodori.jumpIn"
  | "holodori.jumpInLead"
  | "holodori.disclaimer";

type Dictionary = Record<MessageKey, string>;

const en: Dictionary = {
  "nav.games": "Games",
  "nav.sessions": "Sessions",
  "nav.holodori": "Holodori",
  "nav.spaces": "Spaces",
  "nav.ethos": "Ethos",
  "nav.about": "About",
  "nav.chat": "Chat",
  "nav.admin": "Admin",
  "nav.signIn": "Sign in",
  "nav.register": "Register",
  "nav.profile": "Profile",
  "nav.inbox": "Inbox",
  "nav.signOut": "Sign out",
  "nav.new": "New",
  "nav.menu": "Toggle menu",
  "nav.language": "Language",
  "hero.live": "Shared commons",
  "hero.leadPrefix": "Creating common spaces",
  "hero.leadSuffix": "through community",
  "hero.lead":
    "An open commons where people gather around shared spaces, interests, and purpose — so authentic relationships can grow.",
  "hero.byline": "κοινά — common · shared · held in common",
  "hero.defaultFirst": "Shared spaces. Shared interests.",
  "hero.defaultSecond": "Shared purpose.",
  "hero.ctaSessions": "Join a session",
  "hero.ctaSchedule": "Schedule a session",
  "hero.ctaGames": "Browse games",
  "hero.ctaSpaces": "Explore spaces",
  "hero.ctaEthos": "Our ethos",
  "hero.ctaJoin": "Join KOINA",
  "hero.liveBoard": "Live",
  "hero.scoreboard": "Scoreboard",
  "footer.tagline": "Shared spaces. Shared interests. Shared purpose.",
  "footer.product": "Product",
  "footer.explore": "Explore",
  "footer.community": "Community",
  "footer.ecosystem": "Ecosystem",
  "footer.legal": "Legal",
  "footer.leaderboard": "Leaderboard",
  "footer.discord": "Discord server",
  "footer.rules": "Rules",
  "footer.terms": "Terms",
  "footer.privacy": "Privacy",
  "footer.builtWith": "Built with Next.js & Supabase",
  "footer.disclaimer":
    "KOINA — an open commons for belonging, exploration, and growth together.",
  "footer.inspired":
    "Inspired by The Digital Collective (Indigitous, DM360 and the likes) and the Holy Spirit",
  "spaces.eyebrow": "Ecosystem",
  "spaces.title": "Shared spaces",
  "spaces.lead":
    "Each space in the KOINA ecosystem gathers people around a shared interest — gaming, fandom, and immersive experiences.",
  "spaces.visit": "Visit space →",
  "spaces.comingSoon": "Coming soon",
  "spaces.jvBadge": "Shared interest · gaming",
  "spaces.jvBody":
    "Play together, make friends, and build community through Roblox LFG, game nights, and live chat.",
  "spaces.oshiBadge": "Shared interest · fandom",
  "spaces.oshiBody":
    "Showcase your oshi, merch, and stream schedule — a fan space for belonging around the people you love.",
  "spaces.numaBadge": "Shared interest · presence",
  "spaces.numaBody":
    "Immersive spaces for presence-first gathering — walk alongside others in shared virtual rooms.",
  "ethos.eyebrow": "Ethos",
  "ethos.title": "How we walk together",
  "ethos.subtitle": "Our ethos (rather than mission)",
  "ethos.lead":
    "We create common spaces where people can belong, explore, and grow together — trusting presence, grace, and the Holy Spirit more than our methods.",
  "ethos.e1Title": "Common spaces",
  "ethos.e1Body":
    "We create common spaces where people can belong, explore, and grow together.",
  "ethos.e1Verse": "Romans 15:7",
  "ethos.e2Title": "Presence before proclamation",
  "ethos.e2Body": "We choose presence before proclamation.",
  "ethos.e2Verse": "John 1:14",
  "ethos.e3Title": "Walk alongside",
  "ethos.e3Body":
    "We walk alongside others, not above them, remembering that we are all recipients of God's grace.",
  "ethos.e3Verse": "Philippians 2:3",
  "ethos.e4Title": "Trust the Spirit",
  "ethos.e4Body":
    "We simply trust the Holy Spirit, not our own methods, to reveal truth and transform hearts.",
  "ethos.e4Verse": "1 Corinthians 3:6–7; John 16:13",
  "ethos.e5Title": "Celebrate the journey",
  "ethos.e5Body":
    "We celebrate every success or failure, joy or grief, and every step of the journey.",
  "ethos.e5Verse": "Romans 12:15",
  "about.etymology":
    "The name comes from the Ancient Greek κοινά (koina) — the same root as koinonia, fellowship built through shared participation. KOINA is meant to work the same way: an open commons or identity where every member has a place to belong and social barriers are broken down to foster authentic relationships leading to Jesus.",
  "auth.welcomeBack": "Welcome back",
  "auth.signInTitle": "Sign in",
  "auth.signInLead": "Join with email, Google, or Discord.",
  "auth.joinSquad": "Join KOINA",
  "auth.registerTitle": "Register",
  "auth.registerLead":
    "Create an account to belong in the commons — chat, connect, and grow together.",
  "auth.email": "Email",
  "auth.password": "Password",
  "auth.username": "Username",
  "auth.or": "or",
  "auth.continueGoogle": "Continue with Google",
  "auth.continueDiscord": "Continue with Discord",
  "auth.newHere": "New here?",
  "auth.createAccount": "Create an account",
  "auth.alreadyRegistered": "Already registered?",
  "auth.signInCta": "Sign in",
  "auth.createAccountCta": "Create account",
  "profile.language": "Language",
  "profile.languageHint":
    "Choose how KOINA appears for you on this device.",
  "profile.pageTitle": "Profile",
  "profile.pageLead":
    "Manage your account, friends, and connected space profiles.",
  "profile.sections": "Profile sections",
  "profile.section.general": "General",
  "profile.section.holodori": "Holodori",
  "profile.section.roblox": "Roblox",
  "profile.section.friends": "Friends",
  "profile.saving": "Saving…",
  "profile.holodori.title": "Holodori profile",
  "profile.holodori.lead":
    "Save your Holodori Game ID and choose your oshi(s) from hololive female talents.",
  "profile.holodori.gameId": "Game ID",
  "profile.holodori.gameIdPlaceholder": "Your Holodori in-game ID",
  "profile.holodori.gameIdHint":
    "Use the ID others can find you with in Holodori.",
  "profile.holodori.oshi": "Who is your oshi(s)?",
  "profile.holodori.oshiHint":
    "Tap to select. Changes save automatically. Grouped by generation — pick as many as you like.",
  "profile.holodori.oshiEmpty": "No oshi selected yet.",
  "profile.holodori.oshiChoose": "Choose oshi",
  "profile.holodori.removeOshi": "Remove {name}",
  "profile.holodori.search": "Search",
  "profile.holodori.searchPlaceholder": "Name or generation…",
  "profile.holodori.clearSearch": "Clear search",
  "profile.holodori.viewMode": "Oshi view",
  "profile.holodori.viewCards": "Cards",
  "profile.holodori.viewList": "List",
  "profile.holodori.noMatch": "No talents match that search.",
  "profile.holodori.selectedCount": "{count} selected",
  "profile.holodori.save": "Save Game ID",
  "profile.holodori.saved": "Game ID saved.",
  "profile.holodori.oshiSaved": "Oshi selection saved.",
  "profile.holodori.toastSaved": "Saved",
  "profile.holodori.toastRemoved": "Removed",
  "profile.holodori.saveError": "Could not save Holodori profile.",
  "profile.holodori.playedTitle": "Recently played with",
  "profile.holodori.playedLead":
    "The last 10 people you shared a Holodori session with.",
  "profile.holodori.playedEmpty":
    "No Holodori co-players yet. Join a Holodori session to meet people.",
  "profile.holodori.playedLoading": "Loading recent players…",
  "profile.holodori.playedError": "Couldn’t load recent Holodori players.",
  "profile.holodori.colPlayer": "Player",
  "profile.holodori.colGameId": "In-game ID",
  "profile.holodori.colLastPlayed": "Last played",
  "profile.roblox.title": "Roblox profile",
  "profile.roblox.lead":
    "Link your Roblox account details. Pull live username, display name, avatar, bio, and online status when available.",
  "profile.roblox.username": "Username",
  "profile.roblox.usernamePlaceholder": "RobloxUsername",
  "profile.roblox.displayName": "Display name",
  "profile.roblox.bio": "Bio",
  "profile.roblox.onlineStatus": "Online status",
  "profile.roblox.userId": "Roblox user ID",
  "profile.roblox.noAvatar": "No avatar",
  "profile.roblox.pullFromRoblox": "Pull from Roblox",
  "profile.roblox.syncing": "Pulling…",
  "profile.roblox.synced": "Pulled latest details from Roblox.",
  "profile.roblox.lastSynced": "Last pulled {when}",
  "profile.roblox.save": "Save Roblox profile",
  "profile.roblox.saved": "Roblox profile saved.",
  "profile.roblox.saveError": "Could not save Roblox profile.",
  "profile.roblox.syncError": "Could not pull from Roblox.",
  "profile.friends.title": "My friends",
  "profile.friends.lead":
    "People you’ve added. Remove anyone anytime.",
  "profile.friends.listEmpty":
    "No friends yet. Add people from sessions or recently played.",
  "profile.friends.playedTitle": "Recently played with",
  "profile.friends.playedLead":
    "The last 10 people you shared a session with. Add them as friends anytime.",
  "profile.friends.loading": "Loading friends…",
  "profile.friends.loadError": "Couldn’t load friends data.",
  "profile.friends.actionError": "Couldn’t update friend. Try again.",
  "profile.friends.colPlayer": "Player",
  "profile.friends.colLastPlayed": "Last played",
  "profile.friends.colStatus": "Status",
  "profile.friends.colAction": "Action",
  "profile.friends.statusFriend": "Friend",
  "profile.friends.statusNotFriend": "Not friends",
  "profile.friends.add": "Add friend",
  "profile.friends.remove": "Remove",
  "profile.friends.playedEmpty":
    "No one here yet. Join a session to meet players.",
  "profile.friends.sessionsTitle": "Sessions you joined",
  "profile.friends.sessionsLead":
    "Open a session to see who played and manage friends.",
  "profile.friends.sessionsEmpty": "You haven’t joined any sessions yet.",
  "profile.friends.you": "you",
  "common.player": "Player",
  "common.roblox": "Roblox",
  "common.external": "External",
  "common.game": "Game",
  "common.experience": "Experience",
  "about.eyebrow": "About KOINA",
  "about.title": "Fellowship through shared participation",
  "about.lead":
    "KOINA is an open commons where every member has a place to belong. Shared spaces break down social barriers so authentic relationships can grow.",
  "about.f1Title": "Shared spaces",
  "about.f1Desc":
    "Common spaces — digital and social — where people can simply be present with one another.",
  "about.f2Title": "Shared interests",
  "about.f2Desc":
    "Gather around gaming, fandom, immersive presence, and more — interests that spark belonging.",
  "about.f3Title": "Shared purpose",
  "about.f3Desc":
    "Walk toward Jesus together, celebrating every step of the journey with grace.",
  "sessions.featured": "Featured Sessions",
  "sessions.seeAll": "See all sessions →",
  "sessions.emptyTitle": "No sessions scheduled yet.",
  "sessions.emptyBody":
    "Check back soon for the next community game night.",
  "sessions.pageTitle": "Sessions",
  "sessions.pageLead":
    "Community game nights and jams. Join a session, share the link, or drop anytime.",
  "sessions.hostedBy": "Hosted by",
  "sessions.startsIn": "starts in",
  "sessions.startingNow": "starting now",
  "sessions.registered": "registered",
  "sessions.join": "Join",
  "sessions.drop": "Drop",
  "sessions.delete": "Delete",
  "sessions.deleteConfirm": "Delete this session? This cannot be undone.",
  "sessions.edit": "Edit",
  "sessions.editTitle": "Edit session",
  "sessions.editLead":
    "Update the game, title, time, or capacity. Capacity can’t go below current signups.",
  "sessions.saveEdit": "Save changes",
  "sessions.savingEdit": "Saving…",
  "sessions.share": "Share",
  "sessions.shareJoinLink": "Join this session on KOINA",
  "sessions.shareCopied": "Link copied",
  "sessions.shareFailed": "Couldn’t share. Try again.",
  "sessions.full": "Full",
  "sessions.youJoined": "Joined",
  "sessions.working": "Working…",
  "sessions.close": "Close",
  "sessions.participants": "Participants",
  "sessions.loadingParticipants": "Loading participants…",
  "sessions.noParticipants": "No one has joined yet.",
  "sessions.removeParticipant": "Remove {name}",
  "sessions.leaveParticipant": "Leave session",
  "sessions.addFriend": "Add friend",
  "sessions.removeFriend": "Remove friend",
  "sessions.friendPending": "Friend request pending",
  "sessions.acceptFriend": "Accept",
  "sessions.declineFriend": "Decline",
  "sessions.cancelFriendRequest": "Cancel request",
  "inbox.pageTitle": "Inbox",
  "inbox.pageLead":
    "Friend requests, accept invites, and message your friends.",
  "inbox.notifications": "Notifications",
  "inbox.messages": "Messages",
  "inbox.loading": "Loading inbox…",
  "inbox.loadError": "Couldn’t load inbox.",
  "inbox.sendError": "Couldn’t send message.",
  "inbox.notificationsEmpty": "No notifications yet.",
  "inbox.messagesEmpty": "No conversations yet.",
  "inbox.findFriends": "Find friends",
  "inbox.friendRequest": "{name} wants to be friends",
  "inbox.friendRequestAccepted": "Friend request from {name} accepted",
  "inbox.friendRequestDeclined": "Friend request from {name} declined",
  "inbox.friendAccepted": "{name} accepted your friend request",
  "inbox.newMessage": "New message from {name}",
  "inbox.openChat": "Open chat",
  "inbox.messageFriend": "Message",
  "inbox.selectConversation": "Select a conversation to start chatting.",
  "inbox.threadEmpty": "Say hi — no messages yet.",
  "inbox.messagePlaceholder": "Write a message…",
  "inbox.send": "Send",
  "inbox.sending": "Sending…",
  "sessions.holodoriGameIdRequired":
    "You’re in this Holodori session, but you haven’t set your in-game ID yet. Add it on your profile so others can find you.",
  "sessions.holodoriGameIdCta": "Set Holodori Game ID",
  "sessions.detailLoadError": "Couldn’t load session details.",
  "sessions.actionError": "Something went wrong. Try again.",
  "sessions.unknownCreator": "Unknown creator",
  "sessions.current": "Current",
  "sessions.past": "Previous",
  "sessions.pastEmpty": "No previous sessions yet.",
  "sessions.clickToExpand": "Click to expand",
  "sessions.noMatch": "No matching sessions.",
  "sessions.showing": "Showing {from}–{to} of {total}",
  "sessions.resetFilters": "Reset filters",
  "sessions.filteredByGame": "Showing {game} sessions",
  "sessions.clearGameFilter": "Clear game filter",
  "sessions.filters": "Filters",
  "sessions.showFilters": "Show search & filters",
  "sessions.hideFilters": "Hide search & filters",
  "sessions.viewMode": "View",
  "sessions.viewCards": "Cards",
  "sessions.viewList": "List",
  "sessions.search": "Search",
  "sessions.searchPlaceholder": "Session, game, platform, or creator",
  "sessions.filterBy": "Filter by",
  "sessions.allFields": "All fields",
  "sessions.sessionTitle": "Session title",
  "sessions.gameTitle": "Game title",
  "sessions.platform": "Platform",
  "sessions.creatorName": "Creator name",
  "sessions.sortBy": "Sort by",
  "sessions.dateTime": "Date / time",
  "sessions.registeredPlayers": "Registered players",
  "sessions.direction": "Direction",
  "sessions.ascending": "Ascending",
  "sessions.descending": "Descending",
  "sessions.perPage": "Per page",
  "sessions.apply": "Apply",
  "sessions.clear": "Clear",
  "sessions.noMatchTitle": "No sessions match these filters.",
  "sessions.noMatchBody":
    "Try another search, or reset filters to see everything upcoming.",
  "sessions.previous": "Previous",
  "sessions.next": "Next",
  "sessions.pagination": "Sessions pagination",
  "games.featured": "Featured games",
  "games.all": "All games",
  "games.browseAll": "Browse all games →",
  "games.leaderboardLink": "Leaderboard →",
  "games.playRoblox": "Play on Roblox →",
  "games.visitSite": "Visit official site →",
  "games.viewLeaderboard": "View leaderboard →",
  "games.pageTitle": "Games",
  "games.pageLead":
    "Featured games curated by JustVibing. More games in the pipeline!",
  "communities.featured": "Featured communities",
  "communities.visit": "Visit site →",
  "communities.shepherdTitle": "Shepherd",
  "communities.shepherdBadge": "Community support",
  "communities.shepherdBody":
    "Don’t just moderate. Support. Shepherd helps Discord and creator communities turn difficult moments into quieter, more supportive next steps.",
  "lb.global": "Global leaderboard",
  "lb.title": "Leaderboard",
  "lb.viewInGames": "View in Games →",
  "lb.allGames": "All games",
  "lb.rank": "Rank",
  "lb.player": "Player",
  "lb.game": "Game",
  "lb.score": "Score",
  "lb.empty": "No scores for this game yet.",
  "chat.community": "Community chat",
  "chat.openFull": "Open full chat →",
  "chat.updatesEvery": "Updates every {n}s",
  "chat.empty": "No messages yet. Say hi here or in Discord",
  "chat.signInPrompt": "Sign in to chat with the community",
  "chat.send": "Send",
  "chat.jumpLatest": "Jump to latest",
  "chat.syncNote":
    "Messages sync with Discord. Yours post back to the server too.",
  "chat.pageTitle": "Community chat",
  "chat.messagePlaceholder": "Message {channel}",
  "chat.signIn": "Sign in",
  "onboarding.eyebrow": "You're in",
  "onboarding.welcome": "Welcome, {name}",
  "onboarding.lead":
    "Your email is confirmed. Jump into a session, browse games, or say hi in chat — your squad is waiting.",
  "onboarding.setupProfile": "Set up profile",
  "onboarding.browseSessions": "Browse sessions",
  "onboarding.goHome": "Go home",
  "onboarding.updateLater": "Need to update your profile later?",
  "onboarding.openSettings": "Open profile settings",
  "confirm.eyebrow": "Almost there",
  "confirm.title": "Confirm your email",
  "confirm.lead":
    "Your account isn't active yet. Open the unique link we sent from noreply@koina.community, then come back here if you need a new one.",
  "confirm.resend": "Resend confirmation email",
  "confirm.already": "Already confirmed?",
  "confirm.signIn": "Sign in",
  "confirm.email": "Email",
  "confirm.sending": "Sending…",
  "auth.needConfirm": "Need to confirm your email?",
  "auth.resendLink": "Resend the link",
  "holodori.featured": "Featured experience",
  "holodori.lead":
    "Hololive Dreams — also known as Holodori — is a free-to-play rhythm & RPG starring hololive talents. Clear songs, train your holomems, and grow the park together.",
  "holodori.visitSite": "Visit official site",
  "holodori.schedule": "Schedule a session",
  "holodori.browseSessions": "Browse sessions",
  "holodori.playingNow": "Live community",
  "holodori.playingNowTitle": "Who’s playing now",
  "holodori.playingNowEmpty":
    "No Holodori sessions are scheduled yet. Be the first to host one.",
  "holodori.howPlay": "How you play",
  "holodori.howPlayTitle": "Rhythm, quests, and teamwork",
  "holodori.howPlayLead":
    "A hybrid rhythm & RPG loop built around hololive members, live music, and park expansion.",
  "holodori.rhythm": "Rhythm games",
  "holodori.rhythmDesc":
    "Clear songs with hololive talents and climb the charts with your squad.",
  "holodori.minigames": "Mini-games & quests",
  "holodori.minigamesDesc":
    "Take on park challenges, unlock rewards, and keep the dream expanding.",
  "holodori.training": "Holomem training",
  "holodori.trainingDesc":
    "Train your roster, build synergies, and prep for the next big stage.",
  "holodori.available": "Available now",
  "holodori.jumpIn": "Jump into Hololive Dreams",
  "holodori.jumpInLead":
    "Free-to-play on mobile and PC, with over 150 songs at launch and a growing cast of holomems. Learn more and download from the official site.",
  "holodori.disclaimer":
    "Hololive Dreams / Holodori is an official COVER Corp. experience. JustVibing is a community hub and is not affiliated with COVER Corp.",
};

const ja: Dictionary = {
  ...en,
  "nav.games": "ゲーム",
  "nav.sessions": "セッション",
  "nav.holodori": "ホロドリ",
  "nav.chat": "チャット",
  "nav.admin": "管理",
  "nav.signIn": "ログイン",
  "nav.register": "登録",
  "nav.profile": "プロフィール",
  "nav.signOut": "ログアウト",
  "nav.new": "新着",
  "nav.menu": "メニューを開く",
  "nav.language": "言語",
  "hero.live": "ベータテスト中",
  "hero.leadPrefix": "共通の場をつくる",
  "hero.leadSuffix": "ゲームを通じて",
  "hero.byline": "⚡Koinaより",
  "hero.ctaSessions": "セッションに参加",
  "hero.ctaSchedule": "セッションを予定する",
  "hero.ctaGames": "ゲームを見る",
  "hero.liveBoard": "ライブ",
  "hero.scoreboard": "スコアボード",
  "footer.tagline": "一緒に遊んで、友達をつくり、コミュニティを築こう。",
  "footer.product": "プロダクト",
  "footer.community": "コミュニティ",
  "footer.ecosystem": "エコシステム",
  "footer.legal": "法務",
  "footer.leaderboard": "リーダーボード",
  "footer.discord": "Discordサーバー",
  "footer.rules": "ルール",
  "footer.terms": "利用規約",
  "footer.privacy": "プライバシー",
  "footer.builtWith": "Next.js & Supabaseで構築",
  "footer.disclaimer":
    "JustVibingはKOINAエコシステムの一部です。Roblox Corporationとは無関係です。",
  "auth.welcomeBack": "おかえりなさい",
  "auth.signInTitle": "ログイン",
  "auth.signInLead": "メール、Google、またはDiscordで参加。",
  "auth.joinSquad": "スクワッドに参加",
  "auth.registerTitle": "登録",
  "auth.registerLead":
    "アカウントを作成してRSVP、チャット、ランキングに参加しよう。",
  "auth.email": "メール",
  "auth.password": "パスワード",
  "auth.username": "ユーザー名",
  "auth.or": "または",
  "auth.continueGoogle": "Googleで続ける",
  "auth.continueDiscord": "Discordで続ける",
  "auth.newHere": "初めてですか？",
  "auth.createAccount": "アカウントを作成",
  "auth.alreadyRegistered": "すでに登録済みですか？",
  "auth.signInCta": "ログイン",
  "auth.createAccountCta": "アカウント作成",
  "profile.language": "言語",
  "profile.languageHint": "この端末でのJustVibingの表示言語を選べます。",
  "common.player": "プレイヤー",
  ...(pageOverrides.ja as Partial<Dictionary>),
};

const ko: Dictionary = {
  ...en,
  "nav.games": "게임",
  "nav.sessions": "세션",
  "nav.holodori": "Holodori",
  "nav.chat": "채팅",
  "nav.admin": "관리",
  "nav.signIn": "로그인",
  "nav.register": "가입",
  "nav.profile": "프로필",
  "nav.signOut": "로그아웃",
  "nav.new": "신규",
  "nav.menu": "메뉴 열기",
  "nav.language": "언어",
  "hero.live": "베타 테스트 중",
  "hero.leadPrefix": "함께하는 공간 만들기",
  "hero.leadSuffix": "게임을 통해",
  "hero.byline": "⚡제공: Koina",
  "hero.ctaSessions": "세션 참가",
  "hero.ctaSchedule": "세션 예약",
  "hero.ctaGames": "게임 둘러보기",
  "hero.liveBoard": "라이브",
  "hero.scoreboard": "스코어보드",
  "footer.tagline": "함께 플레이하고, 친구를 만들고, 커뮤니티를 키우세요.",
  "footer.product": "제품",
  "footer.community": "커뮤니티",
  "footer.ecosystem": "생태계",
  "footer.legal": "법적 고지",
  "footer.leaderboard": "리더보드",
  "footer.discord": "Discord 서버",
  "footer.rules": "규칙",
  "footer.terms": "이용약관",
  "footer.privacy": "개인정보",
  "footer.builtWith": "Next.js & Supabase로 제작",
  "footer.disclaimer":
    "JustVibing은 KOINA 생태계의 일부입니다. Roblox Corporation과 무관합니다.",
  "auth.welcomeBack": "다시 오신 것을 환영합니다",
  "auth.signInTitle": "로그인",
  "auth.signInLead": "이메일, Google 또는 Discord로 합류하세요.",
  "auth.joinSquad": "스쿼드에 합류",
  "auth.registerTitle": "가입",
  "auth.registerLead":
    "계정을 만들어 RSVP, 채팅, 리더보드에 참여하세요.",
  "auth.email": "이메일",
  "auth.password": "비밀번호",
  "auth.username": "사용자 이름",
  "auth.or": "또는",
  "auth.continueGoogle": "Google로 계속",
  "auth.continueDiscord": "Discord로 계속",
  "auth.newHere": "처음이신가요?",
  "auth.createAccount": "계정 만들기",
  "auth.alreadyRegistered": "이미 가입하셨나요?",
  "auth.signInCta": "로그인",
  "auth.createAccountCta": "계정 만들기",
  "profile.language": "언어",
  "profile.languageHint": "이 기기에서 JustVibing 표시 언어를 선택하세요.",
  "common.player": "플레이어",
  ...(pageOverrides.ko as Partial<Dictionary>),
};

const fil: Dictionary = {
  ...en,
  "nav.games": "Mga Laro",
  "nav.sessions": "Mga Session",
  "nav.holodori": "Holodori",
  "nav.chat": "Chat",
  "nav.admin": "Admin",
  "nav.signIn": "Mag-sign in",
  "nav.register": "Magrehistro",
  "nav.profile": "Profile",
  "nav.signOut": "Mag-sign out",
  "nav.new": "Bago",
  "nav.menu": "Buksan ang menu",
  "nav.language": "Wika",
  "hero.live": "Nasa Beta Testing",
  "hero.leadPrefix": "Gumagawa ng shared spaces",
  "hero.leadSuffix": "sa pamamagitan ng gaming",
  "hero.byline": "⚡ni Koina",
  "hero.ctaSessions": "Sumali sa session",
  "hero.ctaSchedule": "Mag-schedule ng session",
  "hero.ctaGames": "Tingnan ang mga laro",
  "hero.liveBoard": "Live",
  "hero.scoreboard": "Scoreboard",
  "footer.tagline": "Maglaro nang sama-sama. Gumawa ng kaibigan. Bumuo ng community.",
  "footer.product": "Produkto",
  "footer.community": "Community",
  "footer.ecosystem": "Ecosystem",
  "footer.legal": "Legal",
  "footer.leaderboard": "Leaderboard",
  "footer.discord": "Discord server",
  "footer.rules": "Mga Patakaran",
  "footer.terms": "Mga Tuntunin",
  "footer.privacy": "Privacy",
  "footer.builtWith": "Ginawa gamit ang Next.js & Supabase",
  "footer.disclaimer":
    "JustVibing, bahagi ng KOINA ecosystem. Hindi affiliated sa Roblox Corporation.",
  "auth.welcomeBack": "Maligayang pagbabalik",
  "auth.signInTitle": "Mag-sign in",
  "auth.signInLead": "Sumali gamit ang email, Google, o Discord.",
  "auth.joinSquad": "Sumali sa squad",
  "auth.registerTitle": "Magrehistro",
  "auth.registerLead":
    "Gumawa ng account para makapag-RSVP, makipag-chat, at umakyat sa board.",
  "auth.email": "Email",
  "auth.password": "Password",
  "auth.username": "Username",
  "auth.or": "o",
  "auth.continueGoogle": "Magpatuloy sa Google",
  "auth.continueDiscord": "Magpatuloy sa Discord",
  "auth.newHere": "Bago ka rito?",
  "auth.createAccount": "Gumawa ng account",
  "auth.alreadyRegistered": "Nakarehistro na?",
  "auth.signInCta": "Mag-sign in",
  "auth.createAccountCta": "Gumawa ng account",
  "profile.language": "Wika",
  "profile.languageHint":
    "Piliin kung paano ipapakita ang JustVibing sa device na ito.",
  "common.player": "Player",
  ...(pageOverrides.fil as Partial<Dictionary>),
};

const ms: Dictionary = {
  ...en,
  "nav.games": "Permainan",
  "nav.sessions": "Sesi",
  "nav.holodori": "Holodori",
  "nav.chat": "Sembang",
  "nav.admin": "Admin",
  "nav.signIn": "Log masuk",
  "nav.register": "Daftar",
  "nav.profile": "Profil",
  "nav.signOut": "Log keluar",
  "nav.new": "Baharu",
  "nav.menu": "Buka menu",
  "nav.language": "Bahasa",
  "hero.live": "Dalam Ujian Beta",
  "hero.leadPrefix": "Mewujudkan ruang bersama",
  "hero.leadSuffix": "melalui permainan",
  "hero.byline": "⚡oleh Koina",
  "hero.ctaSessions": "Sertai sesi",
  "hero.ctaSchedule": "Jadualkan sesi",
  "hero.ctaGames": "Lihat permainan",
  "hero.liveBoard": "Langsung",
  "hero.scoreboard": "Papan skor",
  "footer.tagline": "Main bersama. Buat kawan. Bina komuniti.",
  "footer.product": "Produk",
  "footer.community": "Komuniti",
  "footer.ecosystem": "Ekosistem",
  "footer.legal": "Undang-undang",
  "footer.leaderboard": "Papan pendahulu",
  "footer.discord": "Pelayan Discord",
  "footer.rules": "Peraturan",
  "footer.terms": "Terma",
  "footer.privacy": "Privasi",
  "footer.builtWith": "Dibina dengan Next.js & Supabase",
  "footer.disclaimer":
    "JustVibing, sebahagian daripada ekosistem KOINA. Tidak berafiliasi dengan Roblox Corporation.",
  "auth.welcomeBack": "Selamat kembali",
  "auth.signInTitle": "Log masuk",
  "auth.signInLead": "Sertai dengan e-mel, Google, atau Discord.",
  "auth.joinSquad": "Sertai skuad",
  "auth.registerTitle": "Daftar",
  "auth.registerLead":
    "Cipta akaun untuk RSVP, bersembang, dan naik papan skor.",
  "auth.email": "E-mel",
  "auth.password": "Kata laluan",
  "auth.username": "Nama pengguna",
  "auth.or": "atau",
  "auth.continueGoogle": "Teruskan dengan Google",
  "auth.continueDiscord": "Teruskan dengan Discord",
  "auth.newHere": "Baharu di sini?",
  "auth.createAccount": "Cipta akaun",
  "auth.alreadyRegistered": "Sudah berdaftar?",
  "auth.signInCta": "Log masuk",
  "auth.createAccountCta": "Cipta akaun",
  "profile.language": "Bahasa",
  "profile.languageHint":
    "Pilih bagaimana JustVibing dipaparkan pada peranti ini.",
  "common.player": "Pemain",
  ...(pageOverrides.ms as Partial<Dictionary>),
};

const id: Dictionary = {
  ...en,
  "nav.games": "Game",
  "nav.sessions": "Sesi",
  "nav.holodori": "Holodori",
  "nav.chat": "Chat",
  "nav.admin": "Admin",
  "nav.signIn": "Masuk",
  "nav.register": "Daftar",
  "nav.profile": "Profil",
  "nav.signOut": "Keluar",
  "nav.new": "Baru",
  "nav.menu": "Buka menu",
  "nav.language": "Bahasa",
  "hero.live": "Sedang Uji Beta",
  "hero.leadPrefix": "Membangun ruang bersama",
  "hero.leadSuffix": "melalui game",
  "hero.byline": "⚡oleh Koina",
  "hero.ctaSessions": "Gabung sesi",
  "hero.ctaSchedule": "Jadwalkan sesi",
  "hero.ctaGames": "Jelajahi game",
  "hero.liveBoard": "Live",
  "hero.scoreboard": "Papan skor",
  "footer.tagline": "Main bareng. Buat teman. Bangun komunitas.",
  "footer.product": "Produk",
  "footer.community": "Komunitas",
  "footer.ecosystem": "Ekosistem",
  "footer.legal": "Legal",
  "footer.leaderboard": "Papan peringkat",
  "footer.discord": "Server Discord",
  "footer.rules": "Aturan",
  "footer.terms": "Ketentuan",
  "footer.privacy": "Privasi",
  "footer.builtWith": "Dibangun dengan Next.js & Supabase",
  "footer.disclaimer":
    "JustVibing, bagian dari ekosistem KOINA. Tidak berafiliasi dengan Roblox Corporation.",
  "auth.welcomeBack": "Selamat datang kembali",
  "auth.signInTitle": "Masuk",
  "auth.signInLead": "Gabung dengan email, Google, atau Discord.",
  "auth.joinSquad": "Gabung skuad",
  "auth.registerTitle": "Daftar",
  "auth.registerLead":
    "Buat akun untuk RSVP, chat, dan naik di papan skor.",
  "auth.email": "Email",
  "auth.password": "Kata sandi",
  "auth.username": "Nama pengguna",
  "auth.or": "atau",
  "auth.continueGoogle": "Lanjutkan dengan Google",
  "auth.continueDiscord": "Lanjutkan dengan Discord",
  "auth.newHere": "Baru di sini?",
  "auth.createAccount": "Buat akun",
  "auth.alreadyRegistered": "Sudah terdaftar?",
  "auth.signInCta": "Masuk",
  "auth.createAccountCta": "Buat akun",
  "profile.language": "Bahasa",
  "profile.languageHint":
    "Pilih bagaimana JustVibing ditampilkan di perangkat ini.",
  "common.player": "Pemain",
  ...(pageOverrides.id as Partial<Dictionary>),
};

const zhCN: Dictionary = {
  ...en,
  "nav.games": "游戏",
  "nav.sessions": "场次",
  "nav.holodori": "Holodori",
  "nav.chat": "聊天",
  "nav.admin": "管理",
  "nav.signIn": "登录",
  "nav.register": "注册",
  "nav.profile": "个人资料",
  "nav.signOut": "退出登录",
  "nav.new": "新",
  "nav.menu": "打开菜单",
  "nav.language": "语言",
  "hero.live": "内测中",
  "hero.leadPrefix": "共建共享空间",
  "hero.leadSuffix": "通过游戏",
  "hero.byline": "⚡由 Koina",
  "hero.ctaSessions": "加入场次",
  "hero.ctaSchedule": "安排场次",
  "hero.ctaGames": "浏览游戏",
  "hero.liveBoard": "直播",
  "hero.scoreboard": "计分板",
  "footer.tagline": "一起玩，交朋友，建设社区。",
  "footer.product": "产品",
  "footer.community": "社区",
  "footer.ecosystem": "生态",
  "footer.legal": "法律",
  "footer.leaderboard": "排行榜",
  "footer.discord": "Discord 服务器",
  "footer.rules": "规则",
  "footer.terms": "条款",
  "footer.privacy": "隐私",
  "footer.builtWith": "基于 Next.js 与 Supabase 构建",
  "footer.disclaimer":
    "JustVibing 属于 KOINA 生态，与 Roblox Corporation 无关。",
  "auth.welcomeBack": "欢迎回来",
  "auth.signInTitle": "登录",
  "auth.signInLead": "使用邮箱、Google 或 Discord 加入。",
  "auth.joinSquad": "加入小队",
  "auth.registerTitle": "注册",
  "auth.registerLead": "创建账号以报名、聊天并登上排行榜。",
  "auth.email": "邮箱",
  "auth.password": "密码",
  "auth.username": "用户名",
  "auth.or": "或",
  "auth.continueGoogle": "使用 Google 继续",
  "auth.continueDiscord": "使用 Discord 继续",
  "auth.newHere": "新来的？",
  "auth.createAccount": "创建账号",
  "auth.alreadyRegistered": "已有账号？",
  "auth.signInCta": "登录",
  "auth.createAccountCta": "创建账号",
  "profile.language": "语言",
  "profile.languageHint": "选择此设备上 JustVibing 的显示语言。",
  "common.player": "玩家",
  ...(pageOverrides["zh-CN"] as Partial<Dictionary>),
};

const zhTW: Dictionary = {
  ...en,
  "nav.games": "遊戲",
  "nav.sessions": "場次",
  "nav.holodori": "Holodori",
  "nav.chat": "聊天",
  "nav.admin": "管理",
  "nav.signIn": "登入",
  "nav.register": "註冊",
  "nav.profile": "個人資料",
  "nav.signOut": "登出",
  "nav.new": "新",
  "nav.menu": "開啟選單",
  "nav.language": "語言",
  "hero.live": "內測中",
  "hero.leadPrefix": "共建共享空間",
  "hero.leadSuffix": "透過遊戲",
  "hero.byline": "⚡由 Koina",
  "hero.ctaSessions": "加入場次",
  "hero.ctaSchedule": "安排場次",
  "hero.ctaGames": "瀏覽遊戲",
  "hero.liveBoard": "即時",
  "hero.scoreboard": "計分板",
  "footer.tagline": "一起玩、交朋友、建立社群。",
  "footer.product": "產品",
  "footer.community": "社群",
  "footer.ecosystem": "生態系",
  "footer.legal": "法律",
  "footer.leaderboard": "排行榜",
  "footer.discord": "Discord 伺服器",
  "footer.rules": "規則",
  "footer.terms": "條款",
  "footer.privacy": "隱私權",
  "footer.builtWith": "以 Next.js 與 Supabase 打造",
  "footer.disclaimer":
    "JustVibing 屬於 KOINA 生態系，與 Roblox Corporation 無關。",
  "auth.welcomeBack": "歡迎回來",
  "auth.signInTitle": "登入",
  "auth.signInLead": "使用電子郵件、Google 或 Discord 加入。",
  "auth.joinSquad": "加入小隊",
  "auth.registerTitle": "註冊",
  "auth.registerLead": "建立帳號以報名、聊天並登上排行榜。",
  "auth.email": "電子郵件",
  "auth.password": "密碼",
  "auth.username": "使用者名稱",
  "auth.or": "或",
  "auth.continueGoogle": "使用 Google 繼續",
  "auth.continueDiscord": "使用 Discord 繼續",
  "auth.newHere": "第一次來？",
  "auth.createAccount": "建立帳號",
  "auth.alreadyRegistered": "已經註冊過？",
  "auth.signInCta": "登入",
  "auth.createAccountCta": "建立帳號",
  "profile.language": "語言",
  "profile.languageHint": "選擇此裝置上 JustVibing 的顯示語言。",
  "common.player": "玩家",
  ...(pageOverrides["zh-TW"] as Partial<Dictionary>),
};

export const dictionaries: Record<LocaleCode, Dictionary> = {
  en,
  ja,
  ko,
  fil,
  ms,
  id,
  "zh-CN": zhCN,
  "zh-TW": zhTW,
};

export function translate(
  locale: LocaleCode,
  key: MessageKey,
  params?: Record<string, string | number>,
) {
  let text = dictionaries[locale][key] ?? dictionaries.en[key] ?? key;
  if (params) {
    for (const [name, value] of Object.entries(params)) {
      text = text.replaceAll(`{${name}}`, String(value));
    }
  }
  return text;
}
