/**
 * Official state land-records portals reachable from the NIC-Bhoomi Gateway
 * shortcut in the officer header. Only verification-grade destinations are
 * listed — states without a confirmed portal intentionally fall through so
 * the UI can say the gateway is not yet wired rather than link somewhere
 * unreliable.
 */
export interface StatePortal {
  name: string;
  url: string;
}

export const STATE_PORTALS: Record<string, StatePortal> = {
  "Andhra Pradesh": { name: "Meebhoomi", url: "https://meebhoomi.ap.gov.in" },
  Assam: { name: "Dharitree (Revenue Assam)", url: "https://revenueassam.nic.in" },
  Bihar: { name: "Bihar Bhumi", url: "https://biharbhumi.bihar.gov.in" },
  Chhattisgarh: { name: "Bhuiyan", url: "https://bhuiyan.cg.nic.in" },
  Goa: { name: "Goa Online — Land Records", url: "https://goaonline.gov.in" },
  Gujarat: { name: "AnyROR", url: "https://anyror.gujarat.gov.in" },
  Haryana: { name: "Jamabandi", url: "https://jamabandi.nic.in" },
  Jharkhand: { name: "Jharbhoomi", url: "https://jharbhoomi.jharkhand.gov.in" },
  Karnataka: { name: "Bhoomi", url: "https://bhoomi.karnataka.gov.in" },
  Maharashtra: { name: "Mahabhulekh", url: "https://mahabhulekh.maharashtra.gov.in" },
  Odisha: { name: "Bhulekh Odisha", url: "https://bhulekh.ori.nic.in" },
  Punjab: { name: "PLRS Fard", url: "https://plrs.punjab.gov.in" },
  Rajasthan: { name: "Apna Khata", url: "https://apnakhata.rajasthan.gov.in" },
  "Tamil Nadu": { name: "TN e-Services", url: "https://eservices.tn.gov.in" },
  Telangana: { name: "Dharani", url: "https://dharani.telangana.gov.in" },
  "Uttar Pradesh": { name: "Bhulekh UP", url: "https://upbhulekh.gov.in" },
  "West Bengal": { name: "Banglarbhumi", url: "https://banglarbhumi.gov.in" },
};

export function statePortalFor(state: string | null): StatePortal | null {
  return state ? (STATE_PORTALS[state] ?? null) : null;
}
