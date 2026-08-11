import { Resend } from "resend";

const DEFAULT_FROM = "KOINA <noreply@koina.community>";

export function isResendConfigured() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return false;
  // Ignore common placeholders from .env.example
  if (/^re_x+$/i.test(apiKey) || /your|xxx|example|change.?me/i.test(apiKey)) {
    return false;
  }
  return true;
}

export function getResendClient() {
  if (!isResendConfigured()) return null;
  return new Resend(process.env.RESEND_API_KEY!.trim());
}

export function getResendFrom() {
  return process.env.RESEND_FROM_EMAIL?.trim() || DEFAULT_FROM;
}
