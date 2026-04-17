const fs = require('fs');
const path = require('path');

/**
 * NOTE: Production figures for this dashboard are imported from
 * `Dataset-U.S. Top 10 Specialty Types Moves Market.xlsx` via
 * `import_us_specialty_moves_excel.py` (writes public/data/value.json & volume.json).
 * This script remains as a fallback / template only.
 */

// Years: 2021-2033
const years = [2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033];

// Single geography: US only (top-level key matches geographical selection)
const regions = {
  US: [],
};

// Internal keys: "By US Region" avoids collision with legacy "By Region" chart/geo logic.
// UI maps "By US Region" -> "By Region" via segmentTypeDisplayLabel().
const segmentTypes = {
  'By Specialty Move Types': {
    'Fine Art & Antiques Moving': 0.1,
    'Pet Relocation & Animal Transport': 0.1,
    'Laboratory & Biotech Equipment Moves': 0.1,
    'Medical & Hospital Equipment Relocation': 0.1,
    'Industrial & Manufacturing Equipment Moves': 0.1,
    'Trade Show & Exhibition Logistics': 0.1,
    'Museum & Cultural Institution Relocation': 0.1,
    'Film, TV & Entertainment Production Moves': 0.1,
    'Renewable Energy Equipment & Battery Transport': 0.1,
    'Luxury Retail Store Fixtures & Visual Merchandising Moves': 0.1,
  },
  'By US Region': {
    Northeast: 0.25,
    Southeast: 0.25,
    Midwest: 0.25,
    West: 0.25,
  },
};

const regionBaseValues = {
  US: 320,
};

const regionGrowthRates = {
  US: 0.12,
};

const segmentGrowthMultipliers = {
  'By Specialty Move Types': {
    'Fine Art & Antiques Moving': 1.0,
    'Pet Relocation & Animal Transport': 1.05,
    'Laboratory & Biotech Equipment Moves': 1.08,
    'Medical & Hospital Equipment Relocation': 1.06,
    'Industrial & Manufacturing Equipment Moves': 1.04,
    'Trade Show & Exhibition Logistics': 1.1,
    'Museum & Cultural Institution Relocation': 0.98,
    'Film, TV & Entertainment Production Moves': 1.12,
    'Renewable Energy Equipment & Battery Transport': 1.15,
    'Luxury Retail Store Fixtures & Visual Merchandising Moves': 1.03,
  },
  'By US Region': {
    Northeast: 1.02,
    Southeast: 1.06,
    Midwest: 1.04,
    West: 1.1,
  },
};

const volumePerMillionUSD = 480;

let seed = 42;
function seededRandom() {
  seed = (seed * 16807 + 0) % 2147483647;
  return (seed - 1) / 2147483646;
}

function addNoise(value, noiseLevel = 0.03) {
  return value * (1 + (seededRandom() - 0.5) * 2 * noiseLevel);
}

function roundTo1(val) {
  return Math.round(val * 10) / 10;
}

function roundToInt(val) {
  return Math.round(val);
}

function generateTimeSeries(baseValue, growthRate, roundFn) {
  const series = {};
  for (let i = 0; i < years.length; i++) {
    const year = years[i];
    const rawValue = baseValue * Math.pow(1 + growthRate, i);
    series[year] = roundFn(addNoise(rawValue));
  }
  return series;
}

function generateData(isVolume) {
  const data = {};
  const roundFn = isVolume ? roundToInt : roundTo1;
  const multiplier = isVolume ? volumePerMillionUSD : 1;

  for (const [regionName, countries] of Object.entries(regions)) {
    const regionBase = regionBaseValues[regionName] * multiplier;
    const regionGrowth = regionGrowthRates[regionName];

    data[regionName] = {};
    for (const [segType, segments] of Object.entries(segmentTypes)) {
      data[regionName][segType] = {};
      for (const [segName, share] of Object.entries(segments)) {
        const segGrowth = regionGrowth * segmentGrowthMultipliers[segType][segName];
        const segBase = regionBase * share;
        data[regionName][segType][segName] = generateTimeSeries(segBase, segGrowth, roundFn);
      }
    }

    for (const country of countries) {
      const countryBase = regionBase * 0.5;
      const countryGrowthVariation = 1 + (seededRandom() - 0.5) * 0.04;
      const countryGrowth = regionGrowth * countryGrowthVariation;

      data[country] = {};
      for (const [segType, segments] of Object.entries(segmentTypes)) {
        data[country][segType] = {};
        for (const [segName, share] of Object.entries(segments)) {
          const segGrowth = countryGrowth * segmentGrowthMultipliers[segType][segName];
          const segBase = countryBase * share;
          const shareVariation = 1 + (seededRandom() - 0.5) * 0.1;
          data[country][segType][segName] = generateTimeSeries(segBase * shareVariation, segGrowth, roundFn);
        }
      }
    }
  }

  return data;
}

seed = 42;
const valueData = generateData(false);
seed = 7777;
const volumeData = generateData(true);

const outDir = path.join(__dirname, 'public', 'data');
fs.writeFileSync(path.join(outDir, 'value.json'), JSON.stringify(valueData, null, 2));
fs.writeFileSync(path.join(outDir, 'volume.json'), JSON.stringify(volumeData, null, 2));

console.log('Generated value.json and volume.json successfully');
console.log('Value geographies:', Object.keys(valueData));
console.log('Segment types:', Object.keys(valueData.US));
