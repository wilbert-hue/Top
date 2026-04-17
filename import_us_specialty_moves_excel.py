"""
Import U.S. Specialty Moves market data into public/data/value.json and volume.json.

VALUE (USD Mn):
  The "Value & Volume" sheet in the workbook can show **4,747.1** in the UI while **B20/B31**
  still contain older cached numbers (~4,835) from a previous revision. The dashboard should
  follow the **segment line items** that sum to the total you use in analysis.

  This script uses the **canonical 2025 leaf values** (matching the 4,747.1 total) and the
  **parent year totals (2025–2033)** from the approved table. Each year is filled by scaling
  2025 shares:  leaf[y] = parent_total[y] * (leaf_2025 / sum_2025).

VOLUME:
  Read from the **Value & Volume** sheet (Volume block) — totals match the sum of children
  in the saved file (e.g. 611,540 moves in 2025).
"""
from __future__ import annotations

import json
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parent
XLSX = ROOT / "Dataset-U.S. Top 10 Specialty Types Moves Market.xlsx"
OUT_VALUE = ROOT / "public" / "data" / "value.json"
OUT_VOLUME = ROOT / "public" / "data" / "volume.json"

SEG_SPECIALTY = "By Specialty Move Types"
SEG_REGION = "By US Region"

# --- Canonical VALUE: 2025 leaves (USD Mn). Sum = 4,747.1 ---
VALUE_2025_SPECIALTY: dict[str, float] = {
    "Fine Art & Antiques Moving": 1582.6,
    "Pet Relocation & Animal Transport": 848.7,
    "Laboratory & Biotech Equipment Moves": 153.4,
    "Medical & Hospital Equipment Relocation": 247.2,
    "Industrial & Manufacturing Equipment Moves": 386.2,
    "Trade Show & Exhibition Logistics": 809.0,
    "Museum & Cultural Institution Relocation": 50.1,
    "Film, TV & Entertainment Production Moves": 65.3,
    "Renewable Energy Equipment & Battery Transport": 602.6,
    "Luxury Retail Store Fixtures & Visual Merchandising Moves": 2.0,
}

VALUE_2025_REGION: dict[str, float] = {
    "Northeast": 911.4,
    "Southeast": 1063.3,
    "Midwest": 835.5,
    "West": 1305.5,
    "Southwest": 631.4,
}

# Parent total for US market (same for "By Specialty" and "By Region" views) — from your table
PARENT_VALUE_BY_YEAR: dict[int, float] = {
    2025: 4747.1,
    2026: 5034.3,
    2027: 5349.2,
    2028: 5695.7,
    2029: 6082.0,
    2030: 6511.8,
    2031: 6983.9,
    2032: 7501.7,
    2033: 8065.4,
}


def scale_leaves_to_parent_totals(
    base_2025: dict[str, float], parent_by_year: dict[int, float]
) -> dict[str, dict[str, float]]:
    """Each year, scale 2025 shares to match parent total; fix rounding on last key."""
    base_sum = sum(base_2025.values())
    names = list(base_2025.keys())
    out: dict[str, dict[str, float]] = {n: {} for n in names}
    for year, parent in sorted(parent_by_year.items()):
        ys = str(year)
        allocated = 0.0
        for n in names[:-1]:
            v = parent * (base_2025[n] / base_sum)
            v = round(v, 6)
            out[n][ys] = v
            allocated += v
        # last leaf absorbs residual
        out[names[-1]][ys] = round(parent - allocated, 6)
    return out


def read_volume_from_value_volume_sheet() -> dict[str, dict[str, float]]:
    """Parse Volume section: after row 'Volume', skip subtotal rows; import leaf lines only."""
    df = pd.read_excel(XLSX, "Value & Volume", header=None)

    header_idx = None
    for i in range(len(df)):
        if str(df.iloc[i, 0]).strip() == "Row Labels":
            header_idx = i
            break
    if header_idx is None:
        raise SystemExit("Value & Volume: could not find 'Row Labels' row")

    year_cols: dict[int, int] = {}
    for j in range(1, df.shape[1]):
        v = df.iloc[header_idx, j]
        if isinstance(v, (int, float)) and not pd.isna(v) and 2000 < v < 2100:
            year_cols[int(v)] = j

    years = sorted(year_cols.keys())
    if not years:
        raise SystemExit("Value & Volume: no year columns found")

    def row_series(r: int) -> dict[str, float]:
        series: dict[str, float] = {}
        for y in years:
            val = df.iloc[r, year_cols[y]]
            if pd.isna(val):
                continue
            series[str(y)] = float(val) if isinstance(val, float) else int(val)
        return series

    vol_row = None
    for i in range(len(df)):
        if str(df.iloc[i, 0]).strip() == "Volume":
            vol_row = i
            break
    if vol_row is None:
        raise SystemExit("Value & Volume: no 'Volume' section row")

    r = vol_row + 1
    # Skip optional subtotal "By Specialty Move Types"
    if str(df.iloc[r, 0]).strip() == "By Specialty Move Types":
        r += 1

    specialty: dict[str, dict[str, float]] = {}
    while r < len(df):
        label = str(df.iloc[r, 0]).strip()
        if label == "By Region":
            r += 1
            break
        if label == "" or pd.isna(df.iloc[r, 0]):
            break
        specialty[label] = row_series(r)
        r += 1

    region: dict[str, dict[str, float]] = {}
    while r < len(df):
        label = str(df.iloc[r, 0]).strip()
        if label == "" or pd.isna(df.iloc[r, 0]):
            break
        region[label] = row_series(r)
        r += 1

    return {SEG_SPECIALTY: specialty, SEG_REGION: region}


def main() -> None:
    if not XLSX.is_file():
        raise SystemExit(f"Missing Excel file: {XLSX}")

    value_specialty = scale_leaves_to_parent_totals(VALUE_2025_SPECIALTY, PARENT_VALUE_BY_YEAR)
    value_region = scale_leaves_to_parent_totals(VALUE_2025_REGION, PARENT_VALUE_BY_YEAR)

    value_payload = {
        "US": {
            SEG_SPECIALTY: value_specialty,
            SEG_REGION: value_region,
        }
    }

    vol_block = read_volume_from_value_volume_sheet()
    vol_payload = {"US": vol_block}

    OUT_VALUE.parent.mkdir(parents=True, exist_ok=True)
    OUT_VALUE.write_text(json.dumps(value_payload, indent=2), encoding="utf-8")
    OUT_VOLUME.write_text(json.dumps(vol_payload, indent=2), encoding="utf-8")

    # Sanity check
    s2025 = sum(value_specialty[k]["2025"] for k in value_specialty)
    r2025 = sum(value_region[k]["2025"] for k in value_region)
    print(f"Wrote {OUT_VALUE}")
    print(f"Wrote {OUT_VOLUME}")
    print(f"Check 2025 value sums: specialty={s2025:.6f} region={r2025:.6f} (expect {PARENT_VALUE_BY_YEAR[2025]})")


if __name__ == "__main__":
    main()
