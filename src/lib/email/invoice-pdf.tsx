import { Document, Page, View, Text, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import type { PriceBreakdown } from "@/lib/pricing";
import { formatUsd } from "@/lib/pricing";

export interface InvoiceData {
  requestId: string;
  createdAt: Date;
  contactName: string;
  contactEmail: string;
  note?: string;
  shareUrl: string;
  duration: "week" | "month";
  cycles: number;
  breakdown: PriceBreakdown;
}

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#1a1a1a" },
  brand: { fontSize: 20, fontWeight: 700, marginBottom: 2 },
  brandAccent: { color: "#c9691a" },
  subtitle: { fontSize: 10, color: "#666666", marginBottom: 20 },
  metaRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  metaBlock: { flexDirection: "column" },
  metaLabel: { fontSize: 8, color: "#888888", textTransform: "uppercase", marginBottom: 2 },
  metaValue: { fontSize: 10, marginBottom: 6 },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
    paddingBottom: 6,
    marginBottom: 6,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#dddddd",
    paddingVertical: 6,
  },
  colItem: { flex: 3 },
  colRate: { flex: 1, textAlign: "right" },
  headerText: { fontSize: 8, textTransform: "uppercase", color: "#888888" },
  bundleNote: {
    marginTop: 10,
    padding: 8,
    backgroundColor: "#fdf1e6",
    borderRadius: 4,
    fontSize: 9,
    color: "#8a4a10",
  },
  totalsBlock: { marginTop: 16, alignSelf: "flex-end", width: 220 },
  totalsRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  totalsLabel: { color: "#666666" },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#1a1a1a",
  },
  grandTotalLabel: { fontSize: 11, fontWeight: 700 },
  grandTotalValue: { fontSize: 11, fontWeight: 700 },
  footer: {
    position: "absolute",
    bottom: 32,
    left: 40,
    right: 40,
    fontSize: 8,
    color: "#999999",
    borderTopWidth: 0.5,
    borderTopColor: "#dddddd",
    paddingTop: 8,
  },
});

function InvoiceDocument({ data }: { data: InvoiceData }) {
  const { breakdown } = data;
  const durationLabel = data.duration === "week" ? "week" : "month";
  const durationPlural = data.cycles === 1 ? durationLabel : `${durationLabel}s`;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.brand}>
          Cipta<Text style={styles.brandAccent}>Forge</Text>
        </Text>
        <Text style={styles.subtitle}>Workspace rental request, request #{data.requestId}</Text>

        <View style={styles.metaRow}>
          <View style={styles.metaBlock}>
            <Text style={styles.metaLabel}>Requested by</Text>
            <Text style={styles.metaValue}>{data.contactName}</Text>
            <Text style={styles.metaLabel}>Email</Text>
            <Text style={styles.metaValue}>{data.contactEmail}</Text>
          </View>
          <View style={styles.metaBlock}>
            <Text style={styles.metaLabel}>Date</Text>
            <Text style={styles.metaValue}>
              {data.createdAt.toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </Text>
            <Text style={styles.metaLabel}>Billing period</Text>
            <Text style={styles.metaValue}>
              {data.cycles} {durationPlural} ({breakdown.totalWeeks} weeks total)
            </Text>
          </View>
        </View>

        <View style={styles.tableHeader}>
          <Text style={[styles.colItem, styles.headerText]}>Item</Text>
          <Text style={[styles.colRate, styles.headerText]}>Rate / week</Text>
        </View>
        {breakdown.lines.map((line) => (
          <View style={styles.tableRow} key={line.instanceId}>
            <Text style={styles.colItem}>{line.name}</Text>
            <Text style={styles.colRate}>{formatUsd(line.discountedWeeklyCents)}</Text>
          </View>
        ))}

        {breakdown.appliedBundle && (
          <Text style={styles.bundleNote}>
            {breakdown.appliedBundle.name} applied: {breakdown.appliedBundle.discountPct}% off the
            items above ({breakdown.appliedBundle.description})
          </Text>
        )}

        <View style={styles.totalsBlock}>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Weekly subtotal</Text>
            <Text>{formatUsd(breakdown.weeklySubtotalCents)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Total weeks</Text>
            <Text>{breakdown.totalWeeks}</Text>
          </View>
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>Total due</Text>
            <Text style={styles.grandTotalValue}>{formatUsd(breakdown.grandTotalCents)}</Text>
          </View>
        </View>

        {data.note && (
          <View style={{ marginTop: 20 }}>
            <Text style={styles.metaLabel}>Delivery notes</Text>
            <Text style={styles.metaValue}>{data.note}</Text>
          </View>
        )}

        <Text style={styles.footer}>
          This is a demo invoice generated for a Desent Solutions developer challenge submission.
          Prices are illustrative placeholders, not live CiptaForge pricing. View or edit this
          setup at {data.shareUrl}
        </Text>
      </Page>
    </Document>
  );
}

export async function renderInvoicePdf(data: InvoiceData): Promise<Buffer> {
  return renderToBuffer(<InvoiceDocument data={data} />);
}
