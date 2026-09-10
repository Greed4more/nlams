#!/usr/bin/env node
// Converts the NLAMS West Bengal 28-district parcel CSVs (parcel_id, ...,
// polygon_wkt_wgs84, source_type, ...) into one compact GeoJSON file per
// district under public/geo/wb_parcels/, plus a manifest.json the map's
// district picker reads without fetching every district's full geometry.
//
// Usage: node scripts/convert-wb-parcels.mjs [sourceDir] [outDir]
// Defaults assume the source folder sits next to this repo, as provided:
//   ../NLAMS_WB_28_District_Parcels  ->  public/geo/wb_parcels/

import { readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const sourceDir = path.resolve(
  process.argv[2] ?? path.join(repoRoot, "..", "NLAMS_WB_28_District_Parcels"),
);
const outDir = path.resolve(process.argv[3] ?? path.join(repoRoot, "public", "geo", "wb_parcels"));

const ROUND = 6; // ~0.11m at this latitude — plenty for a demo cadastral layer.

function round(n) {
  return Math.round(n * 10 ** ROUND) / 10 ** ROUND;
}

/** Minimal RFC 4180 CSV parser — handles quoted fields, embedded commas/
 * newlines, and doubled "" escapes, which is all these files use. */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.length > 1 || row[0] !== "") rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

/** Parses "POLYGON ((lng lat, lng lat, ...))" or
 * "MULTIPOLYGON (((...)), ((...)))" — no interior rings/holes appear in
 * this dataset (verified against the source CSVs before writing this). */
function wktToGeometry(wkt) {
  const isMulti = wkt.startsWith("MULTIPOLYGON");
  const body = wkt.slice(wkt.indexOf("(")).trim();

  function parseRing(ringText) {
    return ringText
      .split(",")
      .map((pair) => pair.trim().split(/\s+/).map(Number))
      .map(([lng, lat]) => [round(lng), round(lat)]);
  }

  if (!isMulti) {
    // body = "((lng lat, ...))"
    const ring = body.slice(2, -2);
    return { type: "Polygon", coordinates: [parseRing(ring)] };
  }
  // body = "(((lng lat, ...)), ((lng lat, ...)))"
  const inner = body.slice(1, -1); // drop outermost ( )
  const polygonTexts = [...inner.matchAll(/\(\(([^)]*)\)\)/g)].map((m) => m[1]);
  return {
    type: "MultiPolygon",
    coordinates: polygonTexts.map((ringText) => [parseRing(ringText)]),
  };
}

mkdirSync(outDir, { recursive: true });

const files = readdirSync(sourceDir).filter((f) => f.endsWith(".csv"));
const manifest = [];
let grandTotal = 0;

for (const file of files) {
  const slug = file.replace(/\.csv$/, "");
  const text = readFileSync(path.join(sourceDir, file), "utf-8");
  const rows = parseCsv(text);
  const header = rows[0];
  const col = Object.fromEntries(header.map((name, idx) => [name, idx]));

  const features = [];
  let realCount = 0;
  let districtName = slug;
  let parentDistrict = slug;
  let districtStatus = "";

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || r.length < header.length) continue;
    const wkt = r[col.polygon_wkt_wgs84];
    if (!wkt) continue;
    const isReal = r[col.source_type] === "REAL_BANGLARBHUMI_CAPTURE";
    if (isReal) realCount++;
    districtName = r[col.district];
    parentDistrict = r[col.parent_current_district];
    districtStatus = r[col.district_status];

    features.push({
      type: "Feature",
      geometry: wktToGeometry(wkt),
      properties: {
        id: r[col.parcel_id],
        block: r[col.block],
        mouza: r[col.mouza],
        plot: r[col.plot_no],
        areaSqm: Math.round(Number(r[col.area_sqm]) * 10) / 10,
        real: isReal,
      },
    });
  }

  const geojson = {
    type: "FeatureCollection",
    disclaimer:
      "Demo cadastral fabric — NOT an authoritative land record. Real rows are Banglarbhumi-sourced captures with approximate WGS84 georeferencing; all other rows are synthetic parcels generated inside real block boundaries.",
    features,
  };

  writeFileSync(path.join(outDir, `${slug}.geojson`), JSON.stringify(geojson));

  manifest.push({
    slug,
    district: districtName,
    parentDistrict,
    status: districtStatus,
    count: features.length,
    realCount,
  });
  grandTotal += features.length;
  console.log(`${file}: ${features.length} parcels (${realCount} real) -> ${slug}.geojson`);
}

writeFileSync(path.join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2));
console.log(`\nWrote ${files.length} district files + manifest.json (${grandTotal} parcels total) to ${outDir}`);
