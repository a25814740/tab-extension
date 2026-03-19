export async function getLocal<T>(key: string, fallback: T): Promise<T> {
  if (!chrome?.storage?.local) {
    return fallback;
  }

  const result = await chrome.storage.local.get(key);
  return (result[key] as T) ?? fallback;
}

export async function setLocal<T>(key: string, value: T) {
  if (!chrome?.storage?.local) {
    return;
  }

  await chrome.storage.local.set({ [key]: value });
}

export async function getSync<T>(key: string, fallback: T): Promise<T> {
  if (!chrome?.storage?.sync) {
    return fallback;
  }

  const result = await chrome.storage.sync.get(key);
  return (result[key] as T) ?? fallback;
}

export async function setSync<T>(key: string, value: T) {
  if (!chrome?.storage?.sync) {
    return;
  }

  await chrome.storage.sync.set({ [key]: value });
}