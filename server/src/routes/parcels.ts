import { Router } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../db.js";
import { requireNlamsUser } from "../middleware/auth.js";

export const parcelsRouter = Router();

parcelsRouter.use(requireNlamsUser);

interface ParcelGeoRow {
  ulpin: string;
  khasraNo: string;
  ownerName: string;
  coOwners: number;
  classification: string;
  areaHa: number;
  compensationAssessed: number;
  compensationDisbursed: number;
  proposalId: string;
  projectName: string;
  state: string;
  district: string;
  geometry: string; // GeoJSON geometry, as text
}

/** GET /api/parcels/geojson — every geo-located parcel in scope, as a GeoJSON FeatureCollection. */
parcelsRouter.get("/geojson", async (req, res) => {
  const states = req.nlamsUser!.states;
  const stateFilter = states.length > 0 ? Prisma.sql`AND pr.state = ANY(${states})` : Prisma.empty;

  const rows = await prisma.$queryRaw<ParcelGeoRow[]>(Prisma.sql`
    SELECT
      p.ulpin,
      p."khasraNo",
      p."ownerName",
      p."coOwners",
      p.classification,
      p."areaHa",
      p."compensationAssessed",
      p."compensationDisbursed",
      pr.id AS "proposalId",
      pr."projectName",
      pr.state,
      pr.district,
      ST_AsGeoJSON(p.geom) AS geometry
    FROM parcels p
    JOIN proposals pr ON pr.id = p."proposalId"
    WHERE p.geom IS NOT NULL
    ${stateFilter}
  `);

  res.json({
    type: "FeatureCollection",
    features: rows.map((r) => ({
      type: "Feature",
      geometry: JSON.parse(r.geometry),
      properties: {
        ulpin: r.ulpin,
        khasraNo: r.khasraNo,
        ownerName: r.ownerName,
        coOwners: r.coOwners,
        classification: r.classification,
        areaHa: r.areaHa,
        compensationAssessed: r.compensationAssessed,
        compensationDisbursed: r.compensationDisbursed,
        proposalId: r.proposalId,
        projectName: r.projectName,
        state: r.state,
        district: r.district,
      },
    })),
  });
});
