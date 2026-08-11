import QRCode from "qrcode";
import type { Session } from "@/lib/types";

const CARD_SIZE = 1080;
const ACCENT = "#EF4E25";
const INK = "#0B0B0C";
const SURFACE = "#F7F5F2";
const MUTED = "rgba(11, 11, 12, 0.55)";

function isLocalOrigin(value: string) {
  return /^(https?:\/\/)?(localhost|127\.0\.0\.1)(:\d+)?$/i.test(
    value.replace(/\/$/, ""),
  );
}

/** Public origin for share links — localhost is never auto-linked in Telegram. */
export function shareOrigin(origin?: string) {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  const current =
    typeof window !== "undefined" ? window.location.origin : undefined;
  const explicit = origin?.trim().replace(/\/$/, "");

  for (const candidate of [explicit, configured, current]) {
    if (candidate && !isLocalOrigin(candidate)) return candidate;
  }

  return configured || current || "https://koina.community";
}

export function sessionDeepLink(sessionId: string, origin?: string) {
  const base = shareOrigin(origin);
  return `${base}/sessions?session=${encodeURIComponent(sessionId)}`;
}

/** Bold (math unicode) + underline for text/plain pastes that ignore HTML. */
function styleShareTitlePlain(title: string) {
  let bold = "";
  for (const char of title) {
    const code = char.codePointAt(0);
    if (code == null) continue;
    if (code >= 0x41 && code <= 0x5a) {
      bold += String.fromCodePoint(0x1d400 + (code - 0x41));
    } else if (code >= 0x61 && code <= 0x7a) {
      bold += String.fromCodePoint(0x1d41a + (code - 0x61));
    } else if (code >= 0x30 && code <= 0x39) {
      bold += String.fromCodePoint(0x1d7ce + (code - 0x30));
    } else {
      bold += char;
    }
  }
  let underlined = "";
  for (const char of bold) {
    underlined += char === " " || char === "\t" ? char : `${char}\u0332`;
  }
  return underlined;
}

export function buildSessionShareContent({
  session,
  gameTitle,
  hostName,
  whenLabel,
  joinLabel,
  origin,
}: {
  session: Session;
  gameTitle: string;
  hostName: string;
  whenLabel: string;
  joinLabel: string;
  origin?: string;
}) {
  const url = sessionDeepLink(session.id, origin);

  // Blank line before joinLabel; URL directly under it (no blank line after).
  const plain = [
    styleShareTitlePlain(session.title),
    `Game: ${gameTitle}`,
    `Hosted by: ${hostName}`,
    `When: ${whenLabel}`,
    "",
    joinLabel,
    url,
  ].join("\n");

  const html = [
    `<p><b><u>${escapeHtml(session.title)}</u></b></p>`,
    `<p>Game: ${escapeHtml(gameTitle)}</p>`,
    `<p>Hosted by: ${escapeHtml(hostName)}</p>`,
    `<p>When: ${escapeHtml(whenLabel)}</p>`,
    `<p><br></p>`,
    `<p>${escapeHtml(joinLabel)}</p>`,
    `<p><a href="${escapeHtml(url)}">${escapeHtml(url)}</a></p>`,
  ].join("");

  return { url, plain, html };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    // Needed for remote covers so the canvas can export a PNG.
    if (!src.startsWith("data:")) {
      img.crossOrigin = "anonymous";
    }
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load ${src}`));
    img.src = src;
  });
}

function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (ctx.measureText(next).width <= maxWidth) {
      current = next;
      continue;
    }
    if (current) lines.push(current);
    current = word;
    if (lines.length === maxLines - 1) break;
  }

  if (lines.length < maxLines && current) {
    lines.push(current);
  }

  if (lines.length === maxLines) {
    const last = lines[maxLines - 1];
    let clipped = last;
    while (
      clipped.length > 1 &&
      ctx.measureText(`${clipped}…`).width > maxWidth
    ) {
      clipped = clipped.slice(0, -1);
    }
    if (
      words.join(" ").length > lines.join(" ").length ||
      ctx.measureText(last).width > maxWidth
    ) {
      lines[maxLines - 1] = `${clipped}…`;
    }
  }

  return lines;
}

/** Break a URL across lines without ellipsis so the full link stays readable. */
function wrapUrl(
  ctx: CanvasRenderingContext2D,
  url: string,
  maxWidth: number,
  maxLines: number,
) {
  const lines: string[] = [];
  let rest = url;
  while (rest && lines.length < maxLines) {
    if (ctx.measureText(rest).width <= maxWidth) {
      lines.push(rest);
      return lines;
    }
    let cut = rest.length;
    while (cut > 1 && ctx.measureText(rest.slice(0, cut)).width > maxWidth) {
      cut -= 1;
    }
    const chunk = rest.slice(0, cut);
    const nice = Math.max(
      chunk.lastIndexOf("/"),
      chunk.lastIndexOf("?"),
      chunk.lastIndexOf("&"),
      chunk.lastIndexOf("="),
    );
    const at = nice > 12 ? nice + 1 : cut;
    lines.push(rest.slice(0, at));
    rest = rest.slice(at);
  }
  if (rest && lines.length) {
    lines[lines.length - 1] += rest;
  }
  return lines;
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement | null,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const radius = 36;
  ctx.save();
  roundRectPath(ctx, x, y, w, h, radius);
  ctx.clip();

  if (image) {
    const scale = Math.max(w / image.width, h / image.height);
    const dw = image.width * scale;
    const dh = image.height * scale;
    const dx = x + (w - dw) / 2;
    const dy = y + (h - dh) / 2;
    ctx.drawImage(image, dx, dy, dw, dh);
    const fade = ctx.createLinearGradient(x, y + h * 0.45, x, y + h);
    fade.addColorStop(0, "rgba(11,11,12,0)");
    fade.addColorStop(1, "rgba(11,11,12,0.45)");
    ctx.fillStyle = fade;
    ctx.fillRect(x, y, w, h);
  } else {
    const fill = ctx.createLinearGradient(x, y, x + w, y + h);
    fill.addColorStop(0, "#2a1210");
    fill.addColorStop(1, ACCENT);
    ctx.fillStyle = fill;
    ctx.fillRect(x, y, w, h);
  }

  ctx.restore();
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

/** Square social card (1080×1080) with game art + QR to the join link. */
export async function renderSessionShareCard({
  title,
  gameTitle,
  hostName,
  whenLabel,
  imageUrl,
  url,
}: {
  title: string;
  gameTitle: string;
  hostName: string;
  whenLabel: string;
  imageUrl: string | null;
  url: string;
}): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = CARD_SIZE;
  canvas.height = CARD_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");

  if (typeof document !== "undefined" && document.fonts?.ready) {
    await document.fonts.ready.catch(() => undefined);
  }

  let cover: HTMLImageElement | null = null;
  if (imageUrl) {
    try {
      cover = await loadImage(imageUrl);
    } catch {
      cover = null;
    }
  }

  const qrDataUrl = await QRCode.toDataURL(url, {
    width: 220,
    margin: 1,
    errorCorrectionLevel: "M",
    color: { dark: INK, light: "#FFFFFF" },
  });
  const qrImage = await loadImage(qrDataUrl);

  ctx.fillStyle = SURFACE;
  ctx.fillRect(0, 0, CARD_SIZE, CARD_SIZE);

  ctx.fillStyle = ACCENT;
  ctx.fillRect(0, 0, 18, CARD_SIZE);

  const pad = 56;
  const contentLeft = pad + 8;
  const contentWidth = CARD_SIZE - contentLeft - pad;

  ctx.fillStyle = ACCENT;
  ctx.font = "700 28px 'Space Grotesk', 'Segoe UI', system-ui, sans-serif";
  ctx.fillText("KOINA", contentLeft, 78);

  ctx.fillStyle = MUTED;
  ctx.font = "600 22px 'IBM Plex Mono', ui-monospace, monospace";
  ctx.fillText("SESSION", contentLeft, 118);

  const coverY = 148;
  const coverH = 360;
  drawCover(ctx, cover, contentLeft, coverY, contentWidth, coverH);

  let textY = coverY + coverH + 56;
  ctx.fillStyle = INK;
  ctx.font = "700 58px 'Space Grotesk', 'Segoe UI', system-ui, sans-serif";
  const titleLines = wrapLines(ctx, title, contentWidth, 2);
  for (const line of titleLines) {
    ctx.fillText(line, contentLeft, textY);
    textY += 66;
  }

  textY += 8;
  ctx.fillStyle = ACCENT;
  ctx.font = "700 28px 'Space Grotesk', 'Segoe UI', system-ui, sans-serif";
  ctx.fillText(gameTitle, contentLeft, textY);

  textY += 46;
  ctx.fillStyle = MUTED;
  ctx.font = "500 26px 'Segoe UI', system-ui, sans-serif";
  ctx.fillText(`Hosted by ${hostName}`, contentLeft, textY);

  textY += 40;
  ctx.fillText(whenLabel, contentLeft, textY);

  // Footer: join link + QR (QR stays usable even when only the image is pasted)
  const qrSize = 168;
  const barH = 196;
  const barY = CARD_SIZE - barH - 40;
  roundRectPath(ctx, contentLeft, barY, contentWidth, barH, 20);
  ctx.fillStyle = INK;
  ctx.fill();

  const qrX = contentLeft + contentWidth - qrSize - 20;
  const qrY = barY + (barH - qrSize) / 2;
  ctx.fillStyle = "#FFFFFF";
  roundRectPath(ctx, qrX - 8, qrY - 8, qrSize + 16, qrSize + 16, 12);
  ctx.fill();
  ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);

  const linkMaxWidth = qrX - contentLeft - 36;
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "700 24px 'Segoe UI', system-ui, sans-serif";
  ctx.fillText("Scan or open link to join", contentLeft + 24, barY + 48);

  ctx.font = "600 22px 'IBM Plex Mono', ui-monospace, monospace";
  ctx.fillStyle = "rgba(255,255,255,0.88)";
  const urlLines = wrapUrl(ctx, url, linkMaxWidth, 3);
  let urlY = barY + 88;
  for (const line of urlLines) {
    ctx.fillText(line, contentLeft + 24, urlY);
    urlY += 30;
  }

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/png"),
  );
  if (!blob) throw new Error("Could not render share card");
  return blob;
}

export type ShareSessionResult = "shared" | "image" | "text";

function prefersOsShareSheet() {
  if (typeof navigator === "undefined" || typeof navigator.share !== "function") {
    return false;
  }
  const uaData = (
    navigator as Navigator & { userAgentData?: { mobile?: boolean } }
  ).userAgentData;
  if (typeof uaData?.mobile === "boolean") return uaData.mobile;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function resolveShareImageUrl(imageUrl: string | null, origin?: string) {
  if (!imageUrl) return null;
  if (imageUrl.startsWith("http") || imageUrl.startsWith("data:")) {
    return imageUrl;
  }
  const assetBase =
    typeof window !== "undefined" ? window.location.origin : shareOrigin(origin);
  return `${assetBase}${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`;
}

export async function shareSessionInvite({
  session,
  gameTitle,
  hostName,
  whenLabel,
  joinLabel,
  imageUrl,
  origin,
}: {
  session: Session;
  gameTitle: string;
  hostName: string;
  whenLabel: string;
  joinLabel: string;
  imageUrl: string | null;
  origin?: string;
}): Promise<ShareSessionResult> {
  const content = buildSessionShareContent({
    session,
    gameTitle,
    hostName,
    whenLabel,
    joinLabel,
    origin,
  });

  let image: Blob | null = null;
  try {
    image = await renderSessionShareCard({
      title: session.title,
      gameTitle,
      hostName,
      whenLabel,
      imageUrl: resolveShareImageUrl(imageUrl, origin),
      url: content.url,
    });
  } catch {
    image = null;
  }

  // Mobile: OS share can send the photo with text as a caption (clickable in Telegram).
  if (prefersOsShareSheet()) {
    const payload: ShareData = {
      title: session.title,
      text: content.plain,
      url: content.url,
    };

    try {
      if (image) {
        const file = new File(
          [image],
          `KOINA-${session.id.slice(0, 8)}.png`,
          { type: "image/png" },
        );
        const withFile = { ...payload, files: [file] };
        if (
          typeof navigator.canShare === "function" &&
          navigator.canShare(withFile)
        ) {
          await navigator.share(withFile);
          return "shared";
        }
      }
      if (
        typeof navigator.canShare !== "function" ||
        navigator.canShare(payload)
      ) {
        await navigator.share(payload);
        return "shared";
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") throw err;
      // Fall through to clipboard.
    }
  }

  // Clipboard: session card image + invite text (HTML for bold/underline title).
  return copySessionShare({
    plain: content.plain,
    html: content.html,
    image,
  });
}

export async function copySessionShare(content: {
  plain: string;
  html?: string;
  image?: Blob | null;
}): Promise<"image" | "text"> {
  const textPlain = new Blob([content.plain], { type: "text/plain" });
  const textHtml = content.html
    ? new Blob([content.html], { type: "text/html" })
    : null;

  if (
    typeof ClipboardItem !== "undefined" &&
    typeof navigator !== "undefined" &&
    navigator.clipboard?.write
  ) {
    const rich: Record<string, Blob> = {
      "text/plain": textPlain,
    };
    if (textHtml) rich["text/html"] = textHtml;
    if (content.image) rich["image/png"] = content.image;

    try {
      await navigator.clipboard.write([new ClipboardItem(rich)]);
      return content.image ? "image" : "text";
    } catch {
      // Multi-type write unsupported — keep the link via text fallback.
    }

    if (textHtml) {
      try {
        await navigator.clipboard.write([
          new ClipboardItem({
            "text/plain": textPlain,
            "text/html": textHtml,
          }),
        ]);
        return "text";
      } catch {
        // Fall through.
      }
    }
  }

  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(content.plain);
      return "text";
    } catch {
      // Fall through to execCommand.
    }
  }

  if (typeof document === "undefined") {
    throw new Error("Clipboard unavailable");
  }

  const textarea = document.createElement("textarea");
  textarea.value = content.plain;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);
  const ok = document.execCommand("copy");
  textarea.remove();
  if (!ok) throw new Error("Clipboard unavailable");
  return "text";
}
