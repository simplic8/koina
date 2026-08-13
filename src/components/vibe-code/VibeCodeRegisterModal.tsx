"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type MouseEvent,
} from "react";

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
      setError(
        "Please consent to be contacted about Vibe Code so we can follow up.",
      );
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
        throw new Error(data.error ?? "Could not submit registration.");
      }

      setSuccess(
        data.message ??
          "Registration received. Check your email for a confirmation — we'll get back to you soon.",
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not submit registration.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="vibe-reg">
        <p className="vibe-label vibe-label-flush">Register</p>
        <button type="button" className="vibe-reg-btn" onClick={openModal}>
          Vibe Code
        </button>
        <p className="vibe-free">Limited seats · All tools free</p>
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
              <p className="vibe-modal-eyebrow">Workshop signup</p>
              <h2 id={`${formId}-title`} className="vibe-modal-title">
                Register for Vibe Code
              </h2>
            </div>
            <button
              type="button"
              className="vibe-modal-close"
              onClick={closeModal}
              disabled={submitting}
              aria-label="Close registration form"
            >
              ×
            </button>
          </div>

          {success ? (
            <div className="vibe-modal-success" role="status">
              <p className="vibe-modal-success-title">You&apos;re on the list</p>
              <p>{success}</p>
              <button
                type="button"
                className="vibe-modal-submit"
                onClick={closeModal}
              >
                Close
              </button>
            </div>
          ) : (
            <form className="vibe-modal-form" onSubmit={onSubmit}>
              <div className="vibe-modal-grid">
                <label className="vibe-modal-field">
                  First name
                  <input
                    required
                    maxLength={80}
                    autoComplete="given-name"
                    value={form.firstName}
                    onChange={(e) => updateField("firstName", e.target.value)}
                  />
                </label>
                <label className="vibe-modal-field">
                  Last name
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
                Email address
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
                  WhatsApp number
                  <span className="vibe-modal-optional">Optional</span>
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
                  Telegram handle
                  <span className="vibe-modal-optional">Optional</span>
                  <input
                    maxLength={120}
                    placeholder="@username"
                    value={form.telegram}
                    onChange={(e) => updateField("telegram", e.target.value)}
                  />
                </label>
              </div>

              <label className="vibe-modal-field">
                Discord handle
                <span className="vibe-modal-optional">Optional</span>
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
                  <span>
                    I agree to be contacted about <strong>Vibe Code</strong>{" "}
                    (required)
                  </span>
                </label>
                <label className="vibe-modal-check">
                  <input
                    type="checkbox"
                    checked={form.consentKoina}
                    onChange={(e) =>
                      updateField("consentKoina", e.target.checked)
                    }
                  />
                  <span>
                    Keep me in the loop about other <strong>KOINA</strong>{" "}
                    activities (optional)
                  </span>
                </label>
              </div>

              {error ? <p className="vibe-modal-error">{error}</p> : null}

              <button
                type="submit"
                className="vibe-modal-submit"
                disabled={submitting}
              >
                {submitting ? "Submitting…" : "Submit registration"}
              </button>
            </form>
          )}
        </div>
      </dialog>
    </>
  );
}
