import fs from 'fs/promises';
import path from 'path';

interface Co2Entry {
  label: string;
  co2e: number;
  unit: string;
  source_table: number;
  row_no: number;
}

interface Co2IndexEntry {
  label: string;
  normalized: string;
  co2e: number;
}

let cachedIndex: Co2IndexEntry[] | null = null;

const normalizeText = (value: string) => value
  .toLowerCase()
  .replace(/[^a-z0-9\s]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const loadIndex = async () => {
  if (cachedIndex) return cachedIndex;
  const filePath = path.join(process.cwd(), 'ifeu_co2_tables1to6_full.json');
  const raw = await fs.readFile(filePath, 'utf-8');
  const parsed = JSON.parse(raw) as { categories?: Record<string, Record<string, Co2Entry>> };

  const entries: Co2IndexEntry[] = [];

  Object.values(parsed.categories || {}).forEach((group) => {
    Object.values(group || {}).forEach((entry) => {
      if (entry?.unit !== 'kg_co2e_per_kg') return;
      const label = entry.label || '';
      if (!label) return;
      entries.push({
        label,
        normalized: normalizeText(label),
        co2e: Number(entry.co2e) || 0,
      });
    });
  });

  cachedIndex = entries;
  return entries;
};

export const findCo2ForIngredient = async (ingredientName: string) => {
  const normalizedIngredient = normalizeText(ingredientName);
  if (!normalizedIngredient) return null;

  const index = await loadIndex();
  let exact = index.find(entry => entry.normalized === normalizedIngredient);
  if (exact) return exact;

  const candidates = index.filter(entry =>
    entry.normalized.includes(normalizedIngredient) || normalizedIngredient.includes(entry.normalized)
  );

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => Math.abs(a.normalized.length - normalizedIngredient.length) - Math.abs(b.normalized.length - normalizedIngredient.length));
  return candidates[0] || null;
};

export const calculateCo2FromIngredients = async (ingredients: string[], weightKg: number) => {
  if (!ingredients.length || !Number.isFinite(weightKg) || weightKg <= 0) {
    return null;
  }

  const matches = await Promise.all(
    ingredients.map(async (ingredient) => {
      const match = await findCo2ForIngredient(ingredient);
      return {
        ingredient,
        co2ePerKg: match?.co2e ?? null,
        matchedLabel: match?.label ?? null,
      };
    })
  );

  const validMatches = matches.filter(match => typeof match.co2ePerKg === 'number' && Number.isFinite(match.co2ePerKg));
  if (!validMatches.length) return null;

  const avgCo2ePerKg = validMatches.reduce((sum, match) => sum + (match.co2ePerKg as number), 0) / validMatches.length;
  const co2Kg = Number((weightKg * avgCo2ePerKg).toFixed(3));

  return {
    co2Kg,
    co2ePerKg: Number(avgCo2ePerKg.toFixed(3)),
    matches,
  };
};
