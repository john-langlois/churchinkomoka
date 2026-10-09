export type ExportTier = {
  name: string;
  minAge: number;
  maxAge: number | null;
  price: number | null;
  isFree: boolean;
};

export type ExportRegistration = {
  contactName: string;
  contactEmail: string;
  contactPhone?: string | null;
  status: string;
  type: string;
  churchName?: string | null;
  city?: string | null;
  country?: string | null;
  arrivalDate?: string | null;
  departureDate?: string | null;
  notes?: string | null;
};

export type ExportRegistrant = {
  firstName: string;
  lastName: string;
  age?: number | null;
  isAdult: boolean;
  dietaryRestrictions?: string | null;
  medicalNotes?: string | null;
};

export type ExportGroup = {
  registration: ExportRegistration;
  registrants: ExportRegistrant[];
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  confirmed: "Paid",
  cancelled: "Cancelled",
  waitlisted: "Waitlisted",
};

function tierFor(age: number | null | undefined, tiers?: ExportTier[] | null) {
  if (!tiers || age == null) return null;
  return (
    tiers.find((t) => age >= t.minAge && (t.maxAge == null || age <= t.maxAge)) ??
    null
  );
}

/**
 * Builds an .xlsx with one block per registration (family or individual):
 * a shaded header row with the contact details, followed by one row per person.
 * Cancelled registrations are skipped. Triggers a browser download.
 */
export async function exportRegistrationsToExcel(
  retreatName: string,
  groups: ExportGroup[],
  tiers?: ExportTier[] | null,
) {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Registrants", {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  const hasPricing = !!tiers?.length;

  const columns = [
    { header: "Family / Contact", width: 28 },
    { header: "Email", width: 30 },
    { header: "Phone", width: 16 },
    { header: "Status", width: 12 },
    { header: "Name", width: 26 },
    { header: "Age", width: 7 },
    { header: "Type", width: 9 },
    ...(hasPricing ? [{ header: "Price", width: 10 }] : []),
    { header: "Dietary", width: 28 },
    { header: "Medical", width: 28 },
    { header: "Church", width: 24 },
    { header: "City / Country", width: 24 },
    { header: "Arrival", width: 12 },
    { header: "Departure", width: 12 },
    { header: "Notes", width: 36 },
  ];
  ws.columns = columns.map((c) => ({ header: c.header, width: c.width }));

  const font = { name: "Arial", size: 10 };
  const head = ws.getRow(1);
  head.font = { ...font, bold: true, color: { argb: "FFFFFFFF" } };
  head.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1C1917" } };
  head.alignment = { vertical: "middle" };
  head.height = 22;

  const active = groups
    .filter((g) => g.registration.status !== "cancelled")
    .sort((a, b) =>
      a.registration.contactName.localeCompare(b.registration.contactName),
    );

  for (const { registration: reg, registrants } of active) {
    const people = registrants.length;
    const groupTotal = hasPricing
      ? registrants.reduce((s, r) => {
          const t = tierFor(r.age, tiers);
          return t && !t.isFree ? s + (t.price ?? 0) : s;
        }, 0)
      : null;
    const label =
      `${reg.contactName} (${people} ${people === 1 ? "person" : "people"}` +
      `${groupTotal != null ? `, $${groupTotal}` : ""})`;
    const place = [reg.city, reg.country].filter(Boolean).join(", ");

    // Group header row — one cell per column so filters still work.
    const groupRow = ws.addRow(
      columns.map((c) => {
        switch (c.header) {
          case "Family / Contact": return label;
          case "Email": return reg.contactEmail;
          case "Phone": return reg.contactPhone ?? "";
          case "Status": return STATUS_LABELS[reg.status] ?? reg.status;
          case "Church": return reg.churchName ?? "";
          case "City / Country": return place;
          case "Arrival": return reg.arrivalDate ?? "";
          case "Departure": return reg.departureDate ?? "";
          case "Notes": return reg.notes ?? "";
          default: return "";
        }
      }),
    );
    groupRow.font = { ...font, bold: true };
    groupRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE7E5E4" } };

    for (const p of registrants) {
      const tier = tierFor(p.age, tiers);
      ws.addRow(
        columns.map((c) => {
          switch (c.header) {
            case "Name": return `${p.firstName} ${p.lastName}`;
            case "Age": return p.age ?? "";
            case "Type": return p.isAdult ? "Adult" : "Child";
            case "Price": return tier ? (tier.isFree ? 0 : (tier.price ?? 0)) : "";
            case "Dietary": return p.dietaryRestrictions ?? "";
            case "Medical": return p.medicalNotes ?? "";
            default: return "";
          }
        }),
      ).font = font;
    }
  }

  if (hasPricing) {
    const priceCol = columns.findIndex((c) => c.header === "Price") + 1;
    ws.getColumn(priceCol).numFmt = "$#,##0;($#,##0);-";
  }
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: columns.length } };
  ws.eachRow((row) => {
    row.alignment = { vertical: "top", wrapText: true };
  });

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const safeName = retreatName.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "");
  a.href = url;
  a.download = `${safeName || "retreat"}-registrants.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
