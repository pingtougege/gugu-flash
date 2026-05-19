const STORAGE_KEY = "gugu-flash:packs:v1";

export async function loadPacks(seedUrl = "/data/seed-packs.json") {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) return JSON.parse(stored);

  const response = await fetch(seedUrl);
  const packs = await response.json();
  savePacks(packs);
  return packs;
}

export function savePacks(packs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(packs));
}

export function resetLocalPacks() {
  localStorage.removeItem(STORAGE_KEY);
}
