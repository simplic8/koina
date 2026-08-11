/** Card / session cover images by game slug. */
export const GAME_CARD_IMAGES: Record<string, string> = {
  "tower-to-eternity": "/games/tower-to-eternity.png",
  "warrior-of-light": "/games/warrior-of-light.png",
  "run-to-the-gate": "/games/run-to-the-gate.png",
  holodori: "/games/holodori.png",
};

export function gameCardImage(slug: string | null | undefined) {
  if (!slug) return null;
  return GAME_CARD_IMAGES[slug] ?? null;
}
