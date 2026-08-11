"use client";

import { Button } from "@/components/ui/Button";
import { CreateSessionModal } from "@/components/sessions/CreateSessionModal";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { focusCurrentSessions } from "@/lib/sessions/focus-current";
import type { Game, SessionTitleSuggestion } from "@/lib/types";

export function SessionsHeaderActions({
  signedIn,
  games,
  titleSuggestions,
  openOnMount = false,
  defaultGameSlug,
}: {
  signedIn: boolean;
  games: Game[];
  titleSuggestions: SessionTitleSuggestion[];
  openOnMount?: boolean;
  defaultGameSlug?: string;
}) {
  const { t } = useLocale();
  const scheduleHref = `/login?next=${encodeURIComponent("/sessions?create=true")}`;

  return (
    <div className="mt-6 flex flex-wrap gap-3">
      {signedIn ? (
        <CreateSessionModal
          games={games}
          titleSuggestions={titleSuggestions}
          openOnMount={openOnMount}
          defaultGameSlug={defaultGameSlug}
          triggerLabel={t("hero.ctaSchedule")}
        />
      ) : (
        <Button href={scheduleHref}>{t("hero.ctaSchedule")}</Button>
      )}
      <Button variant="outline" onClick={focusCurrentSessions}>
        {t("hero.ctaSessions")}
      </Button>
    </div>
  );
}
