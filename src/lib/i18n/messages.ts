import type { LocaleCode } from "./locales";
import { pageOverrides } from "./page-overrides";
import { jaOverrides } from "./locale-overrides/ja";
import { koOverrides } from "./locale-overrides/ko";
import { filOverrides } from "./locale-overrides/fil";
import { msOverrides } from "./locale-overrides/ms";
import { idOverrides } from "./locale-overrides/id";
import { zhCNOverrides } from "./locale-overrides/zh-CN";
import { zhTWOverrides } from "./locale-overrides/zh-TW";

export type MessageKey =
  | "nav.games"
  | "nav.sessions"
  | "nav.holodori"
  | "nav.spaces"
  | "nav.ethos"
  | "nav.about"
  | "nav.vibeCode"
  | "nav.forum"
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
  | "auth.googleComingSoon"
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
  | "holodori.disclaimer"
  | "holodori.heroAlt"
  | "theme.light"
  | "theme.dark"
  | "theme.system"
  | "theme.label"
  | "theme.change"
  | "hero.q2a"
  | "hero.q2b"
  | "hero.q3a"
  | "hero.q3b"
  | "ticker.1"
  | "ticker.2"
  | "ticker.3"
  | "ticker.4"
  | "ticker.5"
  | "ticker.6"
  | "ticker.7"
  | "auth.signInFailed"
  | "auth.registerFailed"
  | "auth.confirmBeforeSignIn"
  | "auth.confirmationSent"
  | "auth.usernameFormat"
  | "confirm.sentTo"
  | "confirm.enterEmail"
  | "confirm.resendFailed"
  | "confirm.resendDefault"
  | "authConfirm.eyebrow"
  | "authConfirm.title"
  | "authConfirm.lead"
  | "authConfirm.button"
  | "authConfirm.confirming"
  | "authConfirm.invalidLink"
  | "authConfirm.invalidShort"
  | "authConfirm.expired"
  | "authConfirm.expiredShort"
  | "authConfirm.confirmedSignIn"
  | "authConfirm.needNew"
  | "legal.termsTitle"
  | "legal.privacyTitle"
  | "legal.lastUpdated"
  | "legal.seeAlso"
  | "forum.eyebrow"
  | "forum.lead"
  | "forum.emptyAdmin"
  | "forum.emptyPublic"
  | "forum.hidden"
  | "forum.live"
  | "forum.ready"
  | "forum.open"
  | "forum.show"
  | "forum.hide"
  | "forum.deleting"
  | "forum.deleteConfirm"
  | "forum.visibilityError"
  | "forum.deleteError"
  | "forum.uploadTitle"
  | "forum.uploadLead"
  | "forum.fieldTitle"
  | "forum.fieldDescription"
  | "forum.fieldFile"
  | "forum.chooseFile"
  | "forum.uploadFailed"
  | "forum.uploading"
  | "forum.create"
  | "forum.sessionEyebrow"
  | "forum.sessionLead"
  | "forum.joinViewer"
  | "forum.browseOnly"
  | "forum.present"
  | "forum.allSessions"
  | "forum.presenterLabel"
  | "forum.presenterHelp"
  | "forum.viewersLabel"
  | "forum.viewersHelp"
  | "forum.browseLabel"
  | "forum.browseHelp"
  | "forum.status"
  | "forum.notLive"
  | "forum.shareViewer"
  | "forum.modeViewer"
  | "forum.statusBrowsing"
  | "forum.statusConnecting"
  | "forum.slide"
  | "forum.statusSynced"
  | "forum.statusBroadcasting"
  | "forum.statusPresentingServer"
  | "forum.statusWatchingServer"
  | "forum.statusPresentingLive"
  | "forum.statusWatchingLive"
  | "forum.loadingDeck"
  | "forum.noteMoved"
  | "forum.noteViewersPrompted"
  | "forum.noteViewersPromptedSlide"
  | "forum.errSync"
  | "forum.errSave"
  | "forum.errLive"
  | "forum.viewerOne"
  | "forum.viewerMany"
  | "forum.presentingCount"
  | "forum.connectedHint"
  | "forum.notFollowingHint"
  | "forum.notSynced"
  | "forum.syncOnAria"
  | "forum.syncOffAria"
  | "forum.syncOnTitle"
  | "forum.syncOffTitle"
  | "forum.syncOn"
  | "forum.syncOff"
  | "forum.bringViewers"
  | "forum.bringViewersHint"
  | "forum.markLive"
  | "forum.exit"
  | "vibe.hackBanner"
  | "vibe.hackBannerLink"
  | "vibe.register"
  | "vibe.freeNote"
  | "vibe.modalEyebrow"
  | "vibe.modalTitle"
  | "vibe.closeForm"
  | "vibe.successTitle"
  | "vibe.firstName"
  | "vibe.lastName"
  | "vibe.emailAddress"
  | "vibe.whatsapp"
  | "vibe.telegram"
  | "vibe.discord"
  | "vibe.optional"
  | "vibe.consentVibe"
  | "vibe.consentKoina"
  | "vibe.consentRequired"
  | "vibe.submit"
  | "vibe.submitting"
  | "vibe.submitFailed"
  | "vibe.submitSuccess"
  | "hack.builtFor"
  | "hack.eyebrow"
  | "hack.title1"
  | "hack.title2"
  | "hack.standfirst"
  | "hack.jump"
  | "hack.tl.brief"
  | "hack.tl.build"
  | "hack.tl.run"
  | "hack.tl.share"
  | "hack.build.band"
  | "hack.build.whatTitle"
  | "hack.build.what1"
  | "hack.build.what2"
  | "hack.build.what3"
  | "hack.build.howTitle"
  | "hack.build.how1"
  | "hack.build.how2"
  | "hack.build.how3"
  | "hack.promptsEnglish"
  | "hack.copy"
  | "hack.copied"
  | "hack.copyFail"
  | "hack.p1.label"
  | "hack.p1.note"
  | "hack.p2.label"
  | "hack.p2.note"
  | "hack.run.band"
  | "hack.run.colStep"
  | "hack.run.colDo"
  | "hack.run.colWatch"
  | "hack.run.step"
  | "hack.run.s1.title"
  | "hack.run.s1.body"
  | "hack.run.s1.check"
  | "hack.run.s2.title"
  | "hack.run.s2.body"
  | "hack.run.s2.check"
  | "hack.run.s3.title"
  | "hack.run.s3.body"
  | "hack.run.s3.check"
  | "hack.run.s4.title"
  | "hack.run.s4.body"
  | "hack.run.s4.check"
  | "hack.run.s5.title"
  | "hack.run.s5.body"
  | "hack.run.s5.check"
  | "hack.run.s6.title"
  | "hack.run.s6.body"
  | "hack.run.s6.check"
  | "hack.run.s7.title"
  | "hack.run.s7.body"
  | "hack.run.s7.check"
  | "hack.concepts.band"
  | "hack.concepts.intro"
  | "hack.concepts.yourPart"
  | "hack.concepts.nextjs.role"
  | "hack.concepts.nextjs.body"
  | "hack.concepts.nextjs.yours"
  | "hack.concepts.supabase.role"
  | "hack.concepts.supabase.body"
  | "hack.concepts.supabase.yours"
  | "hack.concepts.github.role"
  | "hack.concepts.github.body"
  | "hack.concepts.github.yours"
  | "hack.concepts.vercel.role"
  | "hack.concepts.vercel.body"
  | "hack.concepts.vercel.yours"
  | "hack.cheat.band"
  | "hack.pre.title"
  | "hack.pre.lead"
  | "hack.pre.1"
  | "hack.pre.2"
  | "hack.pre.3"
  | "hack.pre.4"
  | "hack.pre.5"
  | "hack.pre.6"
  | "hack.keys.title"
  | "hack.keys.1"
  | "hack.keys.2"
  | "hack.keys.3"
  | "hack.vercel.title"
  | "hack.vercel.lead"
  | "hack.vercel.1"
  | "hack.vercel.2"
  | "hack.vercel.3"
  | "hack.vercel.4"
  | "hack.vercel.5"
  | "hack.vercel.6"
  | "hack.vercel.liveUrl"
  | "hack.bonus.title"
  | "hack.bonus.lead"
  | "hack.skill.install"
  | "hack.skill.run"
  | "hack.skill.emil"
  | "hack.skill.impeccable"
  | "hack.skill.taste"
  | "hack.bonus.oneAtATime"
  | "hack.bonus.seeLive"
  | "hack.bonus.seeLiveTail"
  | "hack.ba.before"
  | "hack.ba.beforeSub"
  | "hack.ba.after"
  | "hack.ba.afterSub"
  | "hack.ba.beforeLabel"
  | "hack.ba.afterLabel"
  | "hack.ba.beforeAlt"
  | "hack.ba.afterAlt"
  | "hack.ba.clickHint"
  | "hack.lb.label"
  | "hack.lb.close"
  | "hack.warn.title"
  | "hack.warn.p1"
  | "hack.warn.p2"
  | "hack.warn.p3"
  | "hack.app.band"
  | "hack.app.intro"
  | "hack.app.install.title"
  | "hack.app.install.role"
  | "hack.app.node.what"
  | "hack.app.node.hint"
  | "hack.app.claude.what"
  | "hack.app.claude.hint"
  | "hack.app.cursor.what"
  | "hack.app.cursor.hint"
  | "hack.app.either.what"
  | "hack.app.either.hint"
  | "hack.app.github.role"
  | "hack.app.github.create.what"
  | "hack.app.github.create.hint"
  | "hack.app.github.login.what"
  | "hack.app.github.login.hint"
  | "hack.app.vercel.role"
  | "hack.app.vercel.signup.what"
  | "hack.app.vercel.signup.hint"
  | "hack.app.supabase.role"
  | "hack.app.supabase.signup.what"
  | "hack.app.supabase.signup.hint"
  | "hack.app.supabase.project.what"
  | "hack.app.supabase.project.hint"
  | "hack.app.supabase.keys.what"
  | "hack.app.supabase.keys.hint"
  | "hack.app.supabase.email.what"
  | "hack.app.supabase.email.hint"
  | "hack.footer.handout"
  | "settings.avatarTitle"
  | "settings.avatarHint"
  | "settings.upload"
  | "settings.uploading"
  | "settings.remove"
  | "settings.chooseImage"
  | "settings.uploadFailed"
  | "settings.avatarUpdated"
  | "settings.avatarRemoved"
  | "settings.removePhotoFailed"
  | "settings.nameTitle"
  | "settings.nameLead"
  | "settings.usernameHint"
  | "settings.displayName"
  | "settings.displayNamePlaceholder"
  | "settings.signedInAs"
  | "settings.save"
  | "settings.nameUpdated"
  | "settings.updateFailed"
  | "settings.linkedTitle"
  | "settings.linkedLead"
  | "settings.linked"
  | "settings.notLinked"
  | "settings.unlink"
  | "settings.unlinking"
  | "settings.redirecting"
  | "settings.linkGoogle"
  | "settings.linkDiscord"
  | "settings.keepOne"
  | "settings.unlinked"
  | "settings.passwordTitle"
  | "settings.passwordLead"
  | "settings.currentPassword"
  | "settings.newPassword"
  | "settings.confirmPassword"
  | "settings.passwordMismatch"
  | "settings.updatePassword"
  | "settings.updatingPassword"
  | "settings.passwordUpdated"
  | "settings.passwordFailed"
  | "settings.oauthNoPassword"
  | "settings.deleteTitle"
  | "settings.deleteLead"
  | "settings.deleteTypePrompt"
  | "settings.deleteButton"
  | "settings.deleting"
  | "settings.deleteFailed"
  | "createSession.submit"
  | "createSession.title"
  | "createSession.lead"
  | "createSession.titleLanguage"
  | "createSession.suggest"
  | "createSession.titlePlaceholder"
  | "createSession.dateTime"
  | "createSession.scheduleNow"
  | "createSession.timeHint"
  | "createSession.capacity"
  | "createSession.capacityMin"
  | "createSession.errDate"
  | "createSession.errFuture"
  | "createSession.errCapacityRange"
  | "createSession.errCapacityWhole"
  | "createSession.errUpdate"
  | "createSession.errCreate"
  | "createSession.cancel"
  | "createSession.creating";

type Dictionary = Record<MessageKey, string>;

const en: Dictionary = {
  "nav.games": "Games",
  "nav.sessions": "Sessions",
  "nav.holodori": "Holodori",
  "nav.spaces": "Spaces",
  "nav.ethos": "Ethos",
  "nav.about": "About",
  "nav.vibeCode": "Vibe Code",
  "nav.forum": "Forum",
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
  "auth.googleComingSoon":
    "Google authentication will be added in the future.",
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
  "profile.pageLead": "Manage your account and friends.",
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
    "No friends yet. Add people from events or recently played.",
  "profile.friends.playedTitle": "Recently played with",
  "profile.friends.playedLead":
    "The last 10 people you shared an event with. Add them as friends anytime.",
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
    "No one here yet. Join an event to meet players.",
  "profile.friends.sessionsTitle": "Events you joined",
  "profile.friends.sessionsLead":
    "Open an event to see who played and manage friends.",
  "profile.friends.sessionsEmpty": "You haven’t joined any events yet.",
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
    "Your account isn't active yet. Open the unique link we sent from noreply@koina.space, then come back here if you need a new one.",
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
  "holodori.heroAlt": "Hololive Dreams promotional art",
  "theme.light": "Light",
  "theme.dark": "Dark",
  "theme.system": "System",
  "theme.label": "Theme: {mode}",
  "theme.change": "Theme: {mode}. Click to change.",
  "hero.q2a": "Belong. Explore.",
  "hero.q2b": "Grow together.",
  "hero.q3a": "Presence before",
  "hero.q3b": "proclamation.",
  "ticker.1": "● KOINA — shared spaces · shared interests · shared purpose",
  "ticker.2": "▲ JustVibing — play together in the commons",
  "ticker.3": "● Oshikatsu — fan space for belonging",
  "ticker.4": "▼ Barriers down · belonging up",
  "ticker.5": "● NUMA — immersive presence, coming soon",
  "ticker.6": "▲ κοινά — fellowship through shared participation",
  "ticker.7": "● Inspired by The Digital Collective and the Holy Spirit",
  "auth.signInFailed": "Could not sign in.",
  "auth.registerFailed": "Could not create your account.",
  "auth.confirmBeforeSignIn":
    "Confirm your email before signing in. We can resend the link below.",
  "auth.confirmationSent":
    "We sent a confirmation link from noreply@koina.space. Click it before signing in.",
  "auth.usernameFormat":
    "Letters, numbers, hyphens, dots, or underscores — no spaces",
  "confirm.sentTo":
    "We sent a confirmation link to {email}. Click it to activate your account before signing in.",
  "confirm.enterEmail": "Enter the email you used to register.",
  "confirm.resendFailed": "Could not resend confirmation email.",
  "confirm.resendDefault":
    "If that email needs confirmation, a new link is on the way.",
  "authConfirm.eyebrow": "Confirm email",
  "authConfirm.title": "Activate your account",
  "authConfirm.lead":
    "Click the button below to confirm your email. You’ll be signed in automatically when possible. This only runs when you press the button — not when the email is opened.",
  "authConfirm.button": "Confirm email & continue",
  "authConfirm.confirming": "Confirming…",
  "authConfirm.invalidLink":
    "Invalid confirmation link. Request a new one from the confirm email page.",
  "authConfirm.invalidShort": "Invalid confirmation link.",
  "authConfirm.expired":
    "Email link is invalid or has expired. Request a new confirmation email.",
  "authConfirm.expiredShort": "Email link is invalid or has expired.",
  "authConfirm.confirmedSignIn": "Email confirmed. Sign in to continue.",
  "authConfirm.needNew": "Need a new link?",
  "legal.termsTitle": "Terms of Use",
  "legal.privacyTitle": "Privacy Policy",
  "legal.lastUpdated": "Last updated: August 12, 2026",
  "legal.seeAlso": "See also:",
  "forum.eyebrow": "Live rooms",
  "forum.lead":
    "Join a live HTML deck. The presenter drives slides and lightboxes; everyone can take part in polls and activities — responses are saved to KOINA.",
  "forum.emptyAdmin": "No sessions yet. Upload an HTML deck above.",
  "forum.emptyPublic": "No forum sessions yet. Check back when a host goes live.",
  "forum.hidden": "Hidden",
  "forum.live": "Live",
  "forum.ready": "Ready",
  "forum.open": "Open",
  "forum.show": "Show",
  "forum.hide": "Hide",
  "forum.deleting": "Deleting…",
  "forum.deleteConfirm":
    "Delete “{title}”? This removes the deck and all activity responses.",
  "forum.visibilityError": "Could not update visibility.",
  "forum.deleteError": "Could not delete session.",
  "forum.uploadTitle": "Upload a deck",
  "forum.uploadLead":
    "HTML slide decks (like your workshop file). Admins can present; anyone with the link can view and join activities.",
  "forum.fieldTitle": "Title",
  "forum.fieldDescription": "Description",
  "forum.fieldFile": "HTML file",
  "forum.chooseFile": "Choose an HTML file.",
  "forum.uploadFailed": "Upload failed.",
  "forum.uploading": "Uploading…",
  "forum.create": "Create forum session",
  "forum.sessionEyebrow": "Forum session",
  "forum.sessionLead":
    "Join as a viewer to follow the presenter, or browse the deck on your own without syncing.",
  "forum.joinViewer": "Join as viewer",
  "forum.browseOnly": "Browse only",
  "forum.present": "Present",
  "forum.allSessions": "All sessions",
  "forum.presenterLabel": "Presenter",
  "forum.presenterHelp":
    "controls slides, language, and image lightboxes for everyone.",
  "forum.viewersLabel": "Viewers",
  "forum.viewersHelp":
    "stay on the presenter’s slide and can answer polls / activities — saved to KOINA.",
  "forum.browseLabel": "Browse",
  "forum.browseHelp":
    "lets you navigate the deck freely without joining the live sync or viewer count.",
  "forum.status": "Status:",
  "forum.notLive": "Not marked live yet",
  "forum.shareViewer": "Share viewer link:",
  "forum.modeViewer": "Viewer",
  "forum.statusBrowsing": "Browsing on your own",
  "forum.statusConnecting": "Connecting…",
  "forum.slide": "Slide {n}",
  "forum.statusSynced": "Synced · slide {n}",
  "forum.statusBroadcasting": "Broadcasting · slide {n}",
  "forum.statusPresentingServer": "Presenting (server sync)",
  "forum.statusWatchingServer": "Watching (server sync)",
  "forum.statusPresentingLive": "Presenting live",
  "forum.statusWatchingLive": "Watching live",
  "forum.loadingDeck": "loading deck…",
  "forum.noteMoved": "Presenter moved everyone to their slide",
  "forum.noteViewersPrompted": "Viewers prompted to jump to your slide",
  "forum.noteViewersPromptedSlide": "Viewers prompted to slide {n}",
  "forum.errSync": "Could not sync slide to server.",
  "forum.errSave": "Could not save response.",
  "forum.errLive": "Could not update live status.",
  "forum.viewerOne": "{count} viewer",
  "forum.viewerMany": "{count} viewers",
  "forum.presentingCount": "{count} presenting",
  "forum.connectedHint": "People connected in the last 30 seconds",
  "forum.notFollowingHint": "You are not following the presenter",
  "forum.notSynced": "Not synced",
  "forum.syncOnAria": "Sync with presenter is on",
  "forum.syncOffAria": "Sync with presenter is off",
  "forum.syncOnTitle": "Following the presenter — click to browse freely",
  "forum.syncOffTitle": "Browsing freely — click to follow the presenter",
  "forum.syncOn": "Sync on",
  "forum.syncOff": "Sync off",
  "forum.bringViewers": "◎ Bring viewers",
  "forum.bringViewersHint": "Bring viewers to this slide",
  "forum.markLive": "Mark live",
  "forum.exit": "Exit",
  "vibe.hackBanner": "Looking for the full vibe-code workshop/tutorial?",
  "vibe.hackBannerLink": "Check it out here",
  "vibe.register": "Register",
  "vibe.freeNote": "Limited seats · All tools free",
  "vibe.modalEyebrow": "Workshop signup",
  "vibe.modalTitle": "Register for Vibe Code",
  "vibe.closeForm": "Close registration form",
  "vibe.successTitle": "You’re on the list",
  "vibe.firstName": "First name",
  "vibe.lastName": "Last name",
  "vibe.emailAddress": "Email address",
  "vibe.whatsapp": "WhatsApp number",
  "vibe.telegram": "Telegram handle",
  "vibe.discord": "Discord handle",
  "vibe.optional": "Optional",
  "vibe.consentVibe": "I agree to be contacted about Vibe Code (required)",
  "vibe.consentKoina":
    "Keep me in the loop about other KOINA activities (optional)",
  "vibe.consentRequired":
    "Please consent to be contacted about Vibe Code so we can follow up.",
  "vibe.submit": "Submit registration",
  "vibe.submitting": "Submitting…",
  "vibe.submitFailed": "Could not submit registration.",
  "vibe.submitSuccess":
    "Registration received. Check your email for a confirmation — we’ll get back to you soon.",
  "hack.builtFor":
    "Built for",
  "hack.eyebrow":
    "KOINA.SPACE · 60-minute workshop · Your run sheet",
  "hack.title1":
    "One hour.",
  "hack.title2":
    "One <em>live</em> app.",
  "hack.standfirst":
    "One prompt, one real app — logins, posts, upvotes and an admin view — live on the internet by the end of the hour. It's tight, so <b>do the pre-work before you sit down.</b>",
  "hack.jump":
    "Pre-work & setup links",
  "hack.tl.brief":
    "brief",
  "hack.tl.build":
    "build",
  "hack.tl.run":
    "run it",
  "hack.tl.share":
    "share",
  "hack.build.band":
    "What we're building, and the two prompts that build it",
  "hack.build.whatTitle":
    "What we're building today",
  "hack.build.what1":
    "Everyone builds the same app, so the hour stays on the rails: a <b>prayer wall</b> where people sign in, post a request, upvote the ones they've prayed for, comment, and report anything off — with an admin view to act on those reports.",
  "hack.build.what2":
    "Look at how Prompt 1 is written. It names <b>who signs in, what they can do, and what the admin sees.</b> That level of detail is why it produces a working app instead of a vague one — and it's the habit to copy when you write your own.",
  "hack.build.what3":
    "<b>Your own idea comes next time.</b> Write it in the same shape: who it's for, what they can do, what gets kept.",
  "hack.build.howTitle":
    "How to use these two prompts",
  "hack.build.how1":
    "<b>Prompt 1</b> builds the whole app. Paste it, then leave it alone while it works — it installs a lot.",
  "hack.build.how2":
    "<b>Prompt 2</b> puts it on the internet, once the app runs on your own machine.",
  "hack.build.how3":
    "Between the two you do the part the AI can't: run its <code>.sql</code> file in Supabase and paste in your real keys. The steps below say when.",
  "hack.promptsEnglish":
    "The prompts below stay in English — copy and paste them into your AI tool exactly as written.",
  "hack.copy":
    "Copy",
  "hack.copied":
    "Copied",
  "hack.copyFail":
    "Select & copy",
  "hack.p1.label":
    "Prompt 1 · Step 2 — build the whole thing",
  "hack.p1.note":
    "<b>Two things to do while it builds.</b> It writes <code>.env.local</code> with the key <i>names</i> but it cannot know your actual keys — paste those in yourself from Supabase → Project Settings → API, then restart the server. And when it finishes the <code>.sql</code> file, open it, copy all of it into Supabase → SQL Editor → Run. The app won't work until both are done.",
  "hack.p2.label":
    "Prompt 2 · Step 5 — push and deploy",
  "hack.p2.note":
    "<b>It will stop and ask you things</b> — to sign in to GitHub or Vercel, to name the repo, to approve a command. Answer each one and let it carry on. If it can't finish the Vercel part itself, do those steps in your browser — they're on the cheat sheet further down.",
  "hack.run.band":
    "Step by step",
  "hack.run.colStep":
    "Step",
  "hack.run.colDo":
    "What you do",
  "hack.run.colWatch":
    "What happens · what you watch for",
  "hack.run.step":
    "Step {n}",
  "hack.run.s1.title":
    "Read the brief",
  "hack.run.s1.body":
    "Everyone builds the same app, so nobody debugs a one-off idea under time pressure. Read Prompt 1 and notice <b>how specific it is</b> — who logs in, what they can do, what the admin sees. That detail is why it produces a working app instead of a vague one.",
  "hack.run.s1.check":
    "You can say what the app does. Cursor open, terminal visible, Supabase keys to hand.",
  "hack.run.s2.title":
    "Build it — Prompt 1",
  "hack.run.s2.body":
    "<b>Next.js builds everything people see and touch</b> — pages, forms, buttons — and the AI writes all of it. Paste Prompt 1 and leave it alone while it installs and writes; interrupting it is how you end up with half an app.",
  "hack.run.s2.check":
    "Checkpoint 1 — it finishes, and your project has a <code>.sql</code> file and a <code>.env.local</code>.",
  "hack.run.s3.title":
    "Run it",
  "hack.run.s3.body":
    "Generated code is just files until it's installed and started. <code>npm install</code> fetches what it needs — usually the AI has already done this — and <code>npm run dev</code> starts it.",
  "hack.run.s3.check":
    "Checkpoint 2 — a page loads at localhost:3000, even if logging in doesn't work yet.",
  "hack.run.s4.title":
    "Connect Supabase",
  "hack.run.s4.body":
    "<b>Supabase holds your database and handles logins</b> — but it needs two things only you can give it. <b>1.</b> Your <b>Project URL</b> and <b>anon key</b> pasted into <code>.env.local</code>, so the app can find your database. <b>2.</b> The AI's <code>.sql</code> file (often in <code>/supabase</code>) copied into Supabase → SQL Editor → Run, which creates the tables. Restart the server after.",
  "hack.run.s4.check":
    "Checkpoint 3 — you've signed up, posted, and can see your row in Supabase's Table Editor.",
  "hack.run.s5.title":
    "Push to GitHub — Prompt 2",
  "hack.run.s5.body":
    "<b>GitHub is the one central copy of your code,</b> and your version history — a mistake becomes something you walk back from, not something you lose. The AI automates this through GitHub's command line tool, but <b>only you can sign in</b>, so answer its prompts as they come.",
  "hack.run.s5.check":
    "Checkpoint 4 — your code is visible in a repo on github.com.",
  "hack.run.s6.title":
    "Deploy on Vercel",
  "hack.run.s6.body":
    "<b>Vercel serves your GitHub code from a real web server,</b> so it has an address anyone can open — and redeploys on every push from now on. Same pattern: the AI drives it, you sign in. <b>Add your keys here too</b> under Environment Variables, then redeploy; <code>.env.local</code> never left your laptop.",
  "hack.run.s6.check":
    "Checkpoint 5 — your live URL is in the chat and someone else has posted on it.",
  "hack.run.s7.title":
    "Share & close",
  "hack.run.s7.body":
    "A couple of URLs go up on the shared screen, the room posts and upvotes on someone's wall, and you watch the rows land in Supabase live. You've put something on the internet that collects real information from real people — that's the whole loop.",
  "hack.run.s7.check":
    "Send your URL to one person outside the room before you close the laptop.",
  "hack.concepts.band":
    "Key concepts — what each piece is doing",
  "hack.concepts.intro":
    "Four tools, one pattern: <b>the AI writes and automates; you install, paste and sign in.</b> Every piece below has a part it does for you and a part only you can do.",
  "hack.concepts.yourPart":
    "Your part",
  "hack.concepts.nextjs.role":
    "The app people see and use",
  "hack.concepts.nextjs.body":
    "Next.js and its component libraries handle the whole user interface — the pages, the forms, the buttons, what happens when someone clicks. Once Claude or Cursor has generated the code, there is nothing to design or wire by hand.",
  "hack.concepts.nextjs.yours":
    "Install it with <code>npm install</code> — usually the AI has already done this for you — then run <code>npm run dev</code> to see it in your browser.",
  "hack.concepts.supabase.role":
    "The database and the logins",
  "hack.concepts.supabase.body":
    "Supabase provides the ready-made functions your app calls: signing people in, saving a post, reading them back. It hosts the database too, so nothing lives on your laptop.",
  "hack.concepts.supabase.yours":
    "Two things. Paste your <b>Project URL</b> and <b>API key</b> (the anon one) into <code>.env.local</code> so the app can find your database. Then open the <code>.sql</code> file the AI generated — usually in a <code>/supabase</code> folder — and copy, paste and run it in Supabase yourself. <b>The AI cannot run it for you.</b>",
  "hack.concepts.github.role":
    "Where the code lives",
  "hack.concepts.github.body":
    "All your code is committed to GitHub as the one central copy. That is what gives you version control — every change is recorded, so a mistake is something you can walk back from rather than lose work to.",
  "hack.concepts.github.yours":
    "Sign in first. The AI can then automate the rest through the GitHub command line tool (the CLI), but it cannot log in as you.",
  "hack.concepts.vercel.role":
    "What puts it on the internet",
  "hack.concepts.vercel.body":
    "Vercel takes the code from your GitHub repository and serves it from a real web server, so your app has an address anyone can open. After the first setup, every push to GitHub redeploys it automatically.",
  "hack.concepts.vercel.yours":
    "Sign in first, here too. The AI can drive the Vercel CLI once you have — and remember your keys need adding in Vercel separately, since <code>.env.local</code> never leaves your laptop.",
  "hack.cheat.band":
    "Your cheat sheet — pre-work, keys and deployment",
  "hack.pre.title":
    "Before you arrive — all of it",
  "hack.pre.lead":
    "Every link is in the appendix at the end.",
  "hack.pre.1":
    "<b>Node.js installed</b> — the LTS version from nodejs.org",
  "hack.pre.2":
    "<b>Cursor installed</b> and signed in at least once",
  "hack.pre.3":
    "<b>GitHub account</b>, signed in on this laptop",
  "hack.pre.4":
    "<b>Vercel account</b> — sign up <b>with GitHub</b>",
  "hack.pre.5":
    "<b>Supabase project created</b> — the project itself, not just the account. It takes a few minutes to start up, so do not leave this to the day.",
  "hack.pre.6":
    "<b>Keys copied into a notes file:</b> Project Settings → API → the <b>Project URL</b> and the <b>anon public</b> key",
  "hack.keys.title":
    "Manage and Protect Your Keys — in two places",
  "hack.keys.1":
    "<b>On your laptop:</b> make a file called <code>.env.local</code> in the project folder with two lines — <code>NEXT_PUBLIC_SUPABASE_URL=</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY=</code> — then <b>restart the server</b>. Keys only load when it starts.",
  "hack.keys.2":
    "<b>In Vercel:</b> the same two lines go in Settings → Environment Variables before you deploy. <code>.env.local</code> never leaves your laptop, so Vercel cannot see it.",
  "hack.keys.3":
    "The <b>anon key is meant to be public</b> — it is safe in a browser. The <i>service_role</i> key on that same Supabase page is not. Don't touch it today.",
  "hack.vercel.title":
    "If it can't do the Vercel part",
  "hack.vercel.lead":
    "Prompt 2 will try. If it gets stuck or asks you to, do it yourself — it's five clicks.",
  "hack.vercel.1":
    "Go to <b>vercel.com</b> → Add New → Project",
  "hack.vercel.2":
    "Pick the repo it just pushed → <b>Import</b>",
  "hack.vercel.3":
    "<b>Add your two keys</b> under Environment Variables, before deploying",
  "hack.vercel.4":
    "Click <b>Deploy</b> and watch it build (about a minute)",
  "hack.vercel.5":
    "Open the link, sign up, post something. <b>That is your app, live, with real accounts and real data.</b>",
  "hack.vercel.6":
    "Every push to GitHub redeploys it automatically from now on",
  "hack.vercel.liveUrl":
    "My live URL",
  "hack.bonus.title":
    "Bonus — make it look like you meant it",
  "hack.bonus.lead":
    "Only once your site is live. Install from your project folder, then reload Cursor.",
  "hack.skill.install":
    "Install",
  "hack.skill.run":
    "Run",
  "hack.skill.emil":
    "UI polish and animation judgement from a design engineer who worked at Vercel and Linear. Fixes the small timing and spacing choices an agent gets wrong on its own.",
  "hack.skill.impeccable":
    "Gives you and the agent a shared design vocabulary. <code>init</code> asks who the site is for and writes it down; <code>polish</code> then cleans up what you already built.",
  "hack.skill.taste":
    "Anti-slop rules for landing pages. The agent reads your brief and picks a direction instead of reaching for the same template every time.",
  "hack.bonus.oneAtATime":
    "<b>One at a time, then look.</b> Run a skill, check the browser, push. Three in a row and you won't know which one did what — and you can always undo a push.",
  "hack.bonus.seeLive":
    "See it live:",
  "hack.bonus.seeLiveTail":
    "— the finished prayer wall from these screenshots.",
  "hack.ba.before":
    "Before",
  "hack.ba.beforeSub":
    "straight out of Prompt 1",
  "hack.ba.after":
    "After /taste",
  "hack.ba.afterSub":
    "one command later",
  "hack.ba.beforeLabel":
    "Before /taste — straight out of Prompt 1",
  "hack.ba.afterLabel":
    "After /taste — one command later",
  "hack.ba.beforeAlt":
    "The prayer wall before running the taste skill: plain layout, emoji logo, sort control on the left, no call to action.",
  "hack.ba.afterAlt":
    "The same prayer wall after running the taste skill: custom dove mark, a prominent Share a prayer request button, a stats line, and the sort control moved right.",
  "hack.ba.clickHint":
    "Click either shot to see it full size.",
  "hack.lb.label":
    "Screenshot, full size",
  "hack.lb.close":
    "Close",
  "hack.warn.title":
    "What you did, and what comes next",
  "hack.warn.p1":
    "You described an app in a paragraph and put a working version of it on the internet — with accounts, a database, and moderation — in under an hour. That is the whole loop. Everything after this is more of the same.",
  "hack.warn.p2":
    "<b>One honest caveat:</b> an app built this fast has not been checked. Before you invite real people to post real prayer requests, someone needs to look at who can read and edit what — the security rules in that <code>.sql</code> file are the thing to check first. <b>Treat today's version as a working demo, not a safe home for other people's words.</b>",
  "hack.warn.p3":
    "<b>Next:</b> the four-week version goes properly into logins, email, your own domain, and how to check that the private things stay private.",
  "hack.app.band":
    "Appendix — everything to install and sign up for",
  "hack.app.intro":
    "Do all of this <b>before</b> the session. Two or three downloads, three accounts, about twenty minutes — but the Supabase project takes a few minutes to start up on its own, so don't leave it to the morning of.",
  "hack.app.install.title":
    "Install on your laptop",
  "hack.app.install.role":
    "Node.js, plus one AI coding tool",
  "hack.app.node.what":
    "Node.js — the LTS version",
  "hack.app.node.hint":
    "Nothing else works without this. Take the one marked <b>LTS</b>, not Current, and accept every default in the installer. To check it worked, open a terminal and type <code>node --version</code> — a number means you're done.",
  "hack.app.claude.what":
    "Claude — desktop app",
  "hack.app.claude.hint":
    "The desktop app lets you use Claude Code without the terminal. <b>Needs a paid Claude plan</b> — Pro or above; the free plan doesn't include Claude Code. If you already pay for Claude, use this. If not, use Cursor below. Prefer the terminal? <code>curl -fsSL https://claude.ai/install.sh | bash</code> on Mac or Linux, or <code>irm https://claude.ai/install.ps1 | iex</code> in Windows PowerShell.",
  "hack.app.cursor.what":
    "Cursor — AI code editor",
  "hack.app.cursor.hint":
    "Has a <b>free tier that's plenty for today</b>, so this is the one to get if you're not already paying for Claude. Download, install, and <b>sign in at least once</b> before the session.",
  "hack.app.either.what":
    "You only need one of the two",
  "hack.app.either.hint":
    "Claude or Cursor — both run the same prompts and work the same way. We'll demo in Cursor; if you're on Claude, everything still applies.",
  "hack.app.github.role":
    "Where your code lives",
  "hack.app.github.create.what":
    "Create an account",
  "hack.app.github.create.hint":
    "Free. Use an email you can check during the session — it sends a verification code. <b>Stay signed in on the laptop you're bringing.</b>",
  "hack.app.github.login.what":
    "Already have one?",
  "hack.app.github.login.hint":
    "Just confirm you can sign in. A forgotten password is a slow thing to fix with a room waiting.",
  "hack.app.vercel.role":
    "What puts it on the internet",
  "hack.app.vercel.signup.what":
    "Sign up — with GitHub",
  "hack.app.vercel.signup.hint":
    "Choose <b>Continue with GitHub</b>, not email. It links the two accounts straight away, which is what lets Vercel see your repositories later. Take the free <b>Hobby</b> plan — no card needed.",
  "hack.app.supabase.role":
    "Your database and logins",
  "hack.app.supabase.signup.what":
    "Sign up",
  "hack.app.supabase.signup.hint":
    "Continue with GitHub is quickest. Free tier, no card.",
  "hack.app.supabase.project.what":
    "Then create a project — not just the account",
  "hack.app.supabase.project.hint":
    "Name it anything. <b>Save the database password it asks you to set.</b> Pick the region nearest you — Singapore if you're here. It then takes a few minutes to start up, which is why this can't wait until the session.",
  "hack.app.supabase.keys.what":
    "Copy your two keys into a notes file",
  "hack.app.supabase.keys.hint":
    "You need the <b>Project URL</b> and the <b>anon public</b> key. Ignore <code>service_role</code> — that one bypasses every security rule and is not for today.",
  "hack.app.supabase.email.what":
    "Turn off email confirmations (optional)",
  "hack.app.supabase.email.hint":
    "Switch off <b>Confirm email</b>. Leave it on and you'll sit waiting for a confirmation mail just to sign into your own app. Turn it back on before real people use it.",
  "hack.footer.handout":
    "participant handout",
  "settings.avatarTitle": "Profile picture",
  "settings.avatarHint": "JPEG, PNG, WebP, or GIF up to 2MB.",
  "settings.upload": "Upload",
  "settings.uploading": "Uploading…",
  "settings.remove": "Remove",
  "settings.chooseImage": "Choose an image first.",
  "settings.uploadFailed": "Upload failed.",
  "settings.avatarUpdated": "Profile picture updated.",
  "settings.avatarRemoved": "Profile picture removed.",
  "settings.removePhotoFailed": "Could not remove photo.",
  "settings.nameTitle": "Name",
  "settings.nameLead":
    "Username is your unique handle (no spaces). Display name is how you appear to others.",
  "settings.usernameHint":
    "No spaces. Letters, numbers, hyphens, dots, underscores.",
  "settings.displayName": "Display name",
  "settings.displayNamePlaceholder": "Optional — spaces allowed",
  "settings.signedInAs": "Signed in as",
  "settings.save": "Save",
  "settings.nameUpdated": "Profile name updated.",
  "settings.updateFailed": "Could not update profile.",
  "settings.linkedTitle": "Linked accounts",
  "settings.linkedLead":
    "Connect Google or Discord to sign in faster. Discord also lets chat posts show as you in #web.",
  "settings.linked": "Linked",
  "settings.notLinked": "Not linked",
  "settings.unlink": "Unlink",
  "settings.unlinking": "Unlinking…",
  "settings.redirecting": "Redirecting…",
  "settings.linkGoogle": "Link Google",
  "settings.linkDiscord": "Link Discord",
  "settings.keepOne": "Keep at least one sign-in method linked.",
  "settings.unlinked": "{provider} unlinked.",
  "settings.passwordTitle": "Password",
  "settings.passwordLead": "Change the password you use to sign in with email.",
  "settings.currentPassword": "Current password",
  "settings.newPassword": "New password",
  "settings.confirmPassword": "Confirm new password",
  "settings.passwordMismatch": "New passwords do not match.",
  "settings.updatePassword": "Update password",
  "settings.updatingPassword": "Updating…",
  "settings.passwordUpdated": "Password updated.",
  "settings.passwordFailed": "Could not change password.",
  "settings.oauthNoPassword":
    "This account signs in with Google or Discord, so there’s no email password to change here.",
  "settings.deleteTitle": "Delete account",
  "settings.deleteLead":
    "Permanently delete your account and profile data. This cannot be undone.",
  "settings.deleteTypePrompt": "Type DELETE to confirm",
  "settings.deleteButton": "Delete my account",
  "settings.deleting": "Deleting…",
  "settings.deleteFailed": "Could not delete account.",
  "createSession.submit": "Create session",
  "createSession.title": "Schedule a session",
  "createSession.lead":
    "Set up the next community game night. Tag the language of the title — we keep your original wording.",
  "createSession.titleLanguage": "Title language",
  "createSession.suggest": "✦ Suggest random title",
  "createSession.titlePlaceholder": "Friday night speedrun",
  "createSession.dateTime": "Date and time",
  "createSession.scheduleNow": "Schedule now",
  "createSession.timeHint":
    "Uses your local time zone. “Schedule now” starts five minutes from now.",
  "createSession.capacity": "Capacity",
  "createSession.capacityMin": "At least {min} (current signups).",
  "createSession.errDate": "Choose a valid date and time.",
  "createSession.errFuture": "The session must be scheduled in the future.",
  "createSession.errCapacityRange": "Capacity must be between {min} and 500.",
  "createSession.errCapacityWhole":
    "Capacity must be a whole number between 2 and 500.",
  "createSession.errUpdate": "Could not update the session.",
  "createSession.errCreate": "Could not create the session.",
  "createSession.cancel": "Cancel",
  "createSession.creating": "Creating…",
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
  "hero.ctaSessions": "セッションに参加",
  "hero.ctaSchedule": "セッションを予定する",
  "hero.ctaGames": "ゲームを見る",
  "hero.liveBoard": "ライブ",
  "hero.scoreboard": "スコアボード",
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
  "auth.welcomeBack": "おかえりなさい",
  "auth.signInTitle": "ログイン",
  "auth.signInLead": "メール、Google、またはDiscordで参加。",
  "auth.registerTitle": "登録",
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
  "common.player": "プレイヤー",
  ...(pageOverrides.ja as Partial<Dictionary>),
  ...jaOverrides,
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
  "hero.ctaSessions": "세션 참가",
  "hero.ctaSchedule": "세션 예약",
  "hero.ctaGames": "게임 둘러보기",
  "hero.liveBoard": "라이브",
  "hero.scoreboard": "스코어보드",
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
  "auth.welcomeBack": "다시 오신 것을 환영합니다",
  "auth.signInTitle": "로그인",
  "auth.signInLead": "이메일, Google 또는 Discord로 합류하세요.",
  "auth.registerTitle": "가입",
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
  "common.player": "플레이어",
  ...(pageOverrides.ko as Partial<Dictionary>),
  ...koOverrides,
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
  "hero.ctaSessions": "Sumali sa session",
  "hero.ctaSchedule": "Mag-schedule ng session",
  "hero.ctaGames": "Tingnan ang mga laro",
  "hero.liveBoard": "Live",
  "hero.scoreboard": "Scoreboard",
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
  "auth.welcomeBack": "Maligayang pagbabalik",
  "auth.signInTitle": "Mag-sign in",
  "auth.signInLead": "Sumali gamit ang email, Google, o Discord.",
  "auth.registerTitle": "Magrehistro",
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
  "common.player": "Player",
  ...(pageOverrides.fil as Partial<Dictionary>),
  ...filOverrides,
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
  "hero.ctaSessions": "Sertai sesi",
  "hero.ctaSchedule": "Jadualkan sesi",
  "hero.ctaGames": "Lihat permainan",
  "hero.liveBoard": "Langsung",
  "hero.scoreboard": "Papan skor",
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
  "auth.welcomeBack": "Selamat kembali",
  "auth.signInTitle": "Log masuk",
  "auth.signInLead": "Sertai dengan e-mel, Google, atau Discord.",
  "auth.registerTitle": "Daftar",
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
  "common.player": "Pemain",
  ...(pageOverrides.ms as Partial<Dictionary>),
  ...msOverrides,
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
  "hero.ctaSessions": "Gabung sesi",
  "hero.ctaSchedule": "Jadwalkan sesi",
  "hero.ctaGames": "Jelajahi game",
  "hero.liveBoard": "Live",
  "hero.scoreboard": "Papan skor",
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
  "auth.welcomeBack": "Selamat datang kembali",
  "auth.signInTitle": "Masuk",
  "auth.signInLead": "Gabung dengan email, Google, atau Discord.",
  "auth.registerTitle": "Daftar",
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
  "common.player": "Pemain",
  ...(pageOverrides.id as Partial<Dictionary>),
  ...idOverrides,
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
  "hero.ctaSessions": "加入场次",
  "hero.ctaSchedule": "安排场次",
  "hero.ctaGames": "浏览游戏",
  "hero.liveBoard": "直播",
  "hero.scoreboard": "计分板",
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
  "auth.welcomeBack": "欢迎回来",
  "auth.signInTitle": "登录",
  "auth.signInLead": "使用邮箱、Google 或 Discord 加入。",
  "auth.registerTitle": "注册",
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
  "common.player": "玩家",
  ...(pageOverrides["zh-CN"] as Partial<Dictionary>),
  ...zhCNOverrides,
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
  "hero.ctaSessions": "加入場次",
  "hero.ctaSchedule": "安排場次",
  "hero.ctaGames": "瀏覽遊戲",
  "hero.liveBoard": "即時",
  "hero.scoreboard": "計分板",
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
  "auth.welcomeBack": "歡迎回來",
  "auth.signInTitle": "登入",
  "auth.signInLead": "使用電子郵件、Google 或 Discord 加入。",
  "auth.registerTitle": "註冊",
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
  "common.player": "玩家",
  ...(pageOverrides["zh-TW"] as Partial<Dictionary>),
  ...zhTWOverrides,
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
