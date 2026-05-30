const STORAGE_KEY = "gugu-flash:packs:v2";

export async function loadPacks(seedUrl = "/data/seed-packs.json") {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  const response = await fetch(seedUrl);
  const packs = await response.json();
  savePacks(packs);
  return packs;
}

export function savePacks(packs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(packs));
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    throw new Error("local_pack_store_unavailable");
  }
}

export function resetLocalPacks() {
  localStorage.removeItem(STORAGE_KEY);
}
