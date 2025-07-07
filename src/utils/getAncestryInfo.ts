import ancestryDataRaw from '../data/ancestry-vic.json';

type AncestryEntry = {
  group: string;
  percent: number;
};

type AncestryRecord = {
  total_population: number;
  ancestries: AncestryEntry[];
};

type AncestryDataset = {
  [suburb: string]: AncestryRecord;
};

type AncestryResult = {
  suburb: string;
  total_population: number;
  ancestries: AncestryEntry[];
};

// Safely cast loaded JSON to strongly typed dataset
const ancestryData = ancestryDataRaw as AncestryDataset;

export function getAncestryInfo(suburbName: string): AncestryResult | null {
  if (!suburbName) return null;

  const normalized = suburbName.trim().toLowerCase();

  const matchingKey = Object.keys(ancestryData).find(
    (key) => key.toLowerCase() === normalized || key.toLowerCase().includes(normalized)
  );

  if (!matchingKey) return null;

  const result = ancestryData[matchingKey];

  return {
    suburb: matchingKey,
    total_population: result.total_population,
    ancestries: result.ancestries.slice(0, 5), // optional: limit to top 5
  };
}
