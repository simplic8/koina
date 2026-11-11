"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type MouseEvent,
} from "react";
import { useLocale } from "@/components/i18n/LocaleProvider";

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  whatsapp: string;
  telegram: string;
  discord: string;
  consentVibeCode: boolean;
  consentKoina: boolean;
};

const initialForm: FormState = {
  firstName: "",
  lastName: "",
  email: "",
  whatsapp: "",
  telegram: "",
  discord: "",
  consentVibeCode: true,
  consentKoina: true,
};

export function VibeCodeRegisterModal() {
  const { t } = useLocale();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const formId = useId();
  const [form, setForm] = useState<FormState>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    function onCancel(event: Event) {
      if (submitting) event.preventDefault();
    }

    dialog.addEventListener("cancel", onCancel);
    return () => dialog.removeEventListener("cancel", onCancel);
  }, [submitting]);

  function openModal() {
    setError(null);
    setSuccess(null);
    setForm(initialForm);
    dialogRef.current?.showModal();
  }

  function closeModal() {
    if (submitting) return;
    dialogRef.current?.close();
  }

  function onBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) closeModal();
  }

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!form.consentVibeCode) {
      setError(t("vibe.consentRequired"));
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/vibe-code/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          whatsapp: form.whatsapp,
          telegram: form.telegram,
          discord: form.discord,
          consentVibeCode: form.consentVibeCode,
          consentKoina: form.consentKoina,
        }),
      });
      const data = (await response.json()) as {
        error?: string;
        message?: string;
        ok?: boolean;
      };

      if (!response.ok) {
        throw new Error(data.error ?? t("vibe.submitFailed"));
      }

      setSuccess(t("vibe.submitSuccess"));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("vibe.submitFailed"),
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="vibe-reg">
        <p className="vibe-label vibe-label-flush">{t("vibe.register")}</p>
        <button type="button" className="vibe-reg-btn" onClick={openModal}>
          Vibe Code
        </button>
        <p className="vibe-free">{t("vibe.freeNote")}</p>
      </div>

      <dialog
        ref={dialogRef}
        className="vibe-modal"
        onClick={onBackdropClick}
        aria-labelledby={`${formId}-title`}
      >
        <div className="vibe-modal-panel">
          <div className="vibe-modal-head">
            <div>
              <p className="vibe-modal-eyebrow">{t("vibe.modalEyebrow")}</p>
              <h2 id={`${formId}-title`} className="vibe-modal-title">
                {t("vibe.modalTitle")}
              </h2>
            </div>
            <button
              type="button"
              className="vibe-modal-close"
              onClick={closeModal}
              disabled={submitting}
              aria-label={t("vibe.closeForm")}
            >
              ×
            </button>
          </div>

          {success ? (
            <div className="vibe-modal-success" role="status">
              <p className="vibe-modal-success-title">
                {t("vibe.successTitle")}
              </p>
              <p>{success}</p>
              <button
                type="button"
                className="vibe-modal-submit"
                onClick={closeModal}
              >
                {t("sessions.close")}
              </button>
            </div>
          ) : (
            <form className="vibe-modal-form" onSubmit={onSubmit}>
              <div className="vibe-modal-grid">
                <label className="vibe-modal-field">
                  {t("vibe.firstName")}
                  <input
                    required
                    maxLength={80}
                    autoComplete="given-name"
                    value={form.firstName}
                    onChange={(e) => updateField("firstName", e.target.value)}
                  />
                </label>
                <label className="vibe-modal-field">
                  {t("vibe.lastName")}
                  <input
                    required
                    maxLength={80}
                    autoComplete="family-name"
                    value={form.lastName}
                    onChange={(e) => updateField("lastName", e.target.value)}
                  />
                </label>
              </div>

              <label className="vibe-modal-field">
                {t("vibe.emailAddress")}
                <input
                  type="email"
                  required
                  maxLength={254}
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                />
              </label>

              <div className="vibe-modal-grid">
                <label className="vibe-modal-field">
                  {t("vibe.whatsapp")}
                  <span className="vibe-modal-optional">
                    {t("vibe.optional")}
                  </span>
                  <input
                    type="tel"
                    maxLength={40}
                    autoComplete="tel"
                    placeholder="+65…"
                    value={form.whatsapp}
                    onChange={(e) => updateField("whatsapp", e.target.value)}
                  />
                </label>
                <label className="vibe-modal-field">
                  {t("vibe.telegram")}
                  <span className="vibe-modal-optional">
                    {t("vibe.optional")}
                  </span>
                  <input
                    maxLength={120}
                    placeholder="@username"
                    value={form.telegram}
                    onChange={(e) => updateField("telegram", e.target.value)}
                  />
                </label>
              </div>

              <label className="vibe-modal-field">
                {t("vibe.discord")}
                <span className="vibe-modal-optional">
                  {t("vibe.optional")}
                </span>
                <input
                  maxLength={120}
                  placeholder="username"
                  value={form.discord}
                  onChange={(e) => updateField("discord", e.target.value)}
                />
              </label>

              <div className="vibe-modal-checks">
                <label className="vibe-modal-check">
                  <input
                    type="checkbox"
                    required
                    checked={form.consentVibeCode}
                    onChange={(e) =>
                      updateField("consentVibeCode", e.target.checked)
                    }
                  />
                  <span>{t("vibe.consentVibe")}</span>
                </label>
                <label className="vibe-modal-check">
                  <input
                    type="checkbox"
                    checked={form.consentKoina}
                    onChange={(e) =>
                      updateField("consentKoina", e.target.checked)
                    }
                  />
                  <span>{t("vibe.consentKoina")}</span>
                </label>
              </div>

              {error ? <p className="vibe-modal-error">{error}</p> : null}

              <button
                type="submit"
                className="vibe-modal-submit"
                disabled={submitting}
              >
                {submitting ? t("vibe.submitting") : t("vibe.submit")}
              </button>
            </form>
          )}
        </div>
      </dialog>
    </>
  );
}
