import fs from 'fs';
import path from 'path';
import { FactCheckItem, VerificationStats } from '../types';
import { INITIAL_FACT_CHECKS, INITIAL_STATS } from '../data/initialFactChecks';

const DATA_DIR = path.join(process.cwd(), 'backend', 'data');
const EDITORIAL_FILE = path.join(DATA_DIR, 'editorial-news.json');

interface EditorialStorage {
  items: FactCheckItem[];
  stats: VerificationStats;
}

let cache: EditorialStorage | null = null;
let saveTimer: NodeJS.Timeout | null = null;

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadEditorialData(): EditorialStorage {
  if (cache) return cache;
  ensureDataDir();

  try {
    if (fs.existsSync(EDITORIAL_FILE)) {
      const content = fs.readFileSync(EDITORIAL_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed.items)) {
        cache = {
          items: parsed.items,
          stats: parsed.stats || { ...INITIAL_STATS },
        };
        return cache;
      }
    }
  } catch (err) {
    console.warn('[TRACE Editorial] Could not load editorial file, seeding default:', err);
  }

  cache = {
    items: [...INITIAL_FACT_CHECKS],
    stats: { ...INITIAL_STATS },
  };
  saveEditorialData(cache);
  return cache;
}

function saveEditorialData(data: EditorialStorage): void {
  cache = data;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      ensureDataDir();
      const tempPath = `${EDITORIAL_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(tempPath, EDITORIAL_FILE);
    } catch (err) {
      console.error('[TRACE Editorial] Error saving editorial data:', err);
    }
  }, 100);
}

export function getEditorialFeed(): { items: FactCheckItem[]; stats: VerificationStats } {
  const data = loadEditorialData();
  return {
    items: [...data.items],
    stats: { ...data.stats },
  };
}

export function getEditorialArticle(id: string): FactCheckItem | null {
  const data = loadEditorialData();
  return data.items.find((item) => item.id === id) || null;
}

export function addEditorialArticle(item: FactCheckItem): FactCheckItem {
  const data = loadEditorialData();
  data.items.unshift(item);
  data.stats.totalClaimsChecked += 1;
  if (item.verdict === 'DEBUNKED_FAKE') {
    data.stats.fakeNewsBusted += 1;
  }

  const catIdx = data.stats.categoriesBreakdown.findIndex((c) => c.category === item.category);
  if (catIdx >= 0) {
    data.stats.categoriesBreakdown[catIdx].count += 1;
  } else {
    data.stats.categoriesBreakdown.push({ category: item.category, count: 1 });
  }

  data.stats.accuracyRate =
    data.stats.totalClaimsChecked > 0
      ? Math.round(((data.stats.totalClaimsChecked - data.stats.fakeNewsBusted) / data.stats.totalClaimsChecked) * 1000) / 10
      : 100;

  saveEditorialData(data);
  return item;
}

export function updateEditorialArticle(id: string, updates: Partial<FactCheckItem>): FactCheckItem | null {
  const data = loadEditorialData();
  const index = data.items.findIndex((item) => item.id === id);
  if (index === -1) return null;

  const current = data.items[index];
  const updated: FactCheckItem = {
    ...current,
    ...updates,
    id: current.id,
    timestamp: 'Updated just now',
  };

  data.items[index] = updated;
  saveEditorialData(data);
  return updated;
}

export function deleteEditorialArticle(id: string): boolean {
  const data = loadEditorialData();
  const index = data.items.findIndex((item) => item.id === id);
  if (index === -1) return false;

  data.items.splice(index, 1);
  saveEditorialData(data);
  return true;
}

export function getEditorialStats(): any {
  const data = loadEditorialData();
  return {
    totalItems: data.items.length,
    verifiedCount: data.items.filter((i) => i.verdict === 'VERIFIED_TRUE').length,
    fakeCount: data.items.filter((i) => i.verdict === 'DEBUNKED_FAKE').length,
    misleadingCount: data.items.filter((i) => i.verdict === 'MISLEADING').length,
    stats: data.stats,
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  };
}

/**
 * Increment anonymous platform stats counters without exposing or storing personal scans in feed.
 */
export function incrementPlatformStats(type: 'claim' | 'deepfake' | 'media', isFake: boolean, category?: string) {
  const data = loadEditorialData();
  data.stats.totalClaimsChecked += 1;
  if (type === 'deepfake') {
    data.stats.deepfakesIntercepted += 1;
  } else if (type === 'media') {
    data.stats.mediaAuditsCompleted += 1;
  }
  if (isFake) {
    data.stats.fakeNewsBusted += 1;
  }
  if (category) {
    const catIdx = data.stats.categoriesBreakdown.findIndex((c) => c.category === category);
    if (catIdx >= 0) {
      data.stats.categoriesBreakdown[catIdx].count += 1;
    } else {
      data.stats.categoriesBreakdown.push({ category, count: 1 });
    }
  }
  data.stats.accuracyRate =
    data.stats.totalClaimsChecked > 0
      ? Math.round(((data.stats.totalClaimsChecked - data.stats.fakeNewsBusted) / data.stats.totalClaimsChecked) * 1000) / 10
      : 100;
  saveEditorialData(data);
}
