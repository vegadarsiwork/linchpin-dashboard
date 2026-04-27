import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { amountInWords } from "./amount-in-words";

export type LineItem = {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
};

export type InvoiceData = {
  invoiceNumber: string;
  date: string;
  isQuotation: boolean;
  companyName: string;
  companyAddress: string;
  companyGSTIN?: string;
  clientName: string;
  clientAddress?: string;
  clientGSTIN?: string;
  lineItems: LineItem[];
  subtotal: number;
  gstRate: number;
  gstAmount: number;
  totalAmount: number;
  paymentTerms?: string;
};

const C = { primary: "#0f172a", border: "#e2e8f0", muted: "#64748b", light: "#f8fafc" };

const s = StyleSheet.create({
  page: { fontSize: 10, fontFamily: "Helvetica", padding: 44, color: "#1e293b" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  coName: { fontSize: 20, fontFamily: "Helvetica-Bold", color: C.primary, marginBottom: 3 },
  coAddr: { color: C.muted, lineHeight: 1.5, fontSize: 9 },
  invTitle: { fontSize: 24, fontFamily: "Helvetica-Bold", color: C.primary, textAlign: "right" },
  invMeta: { color: C.muted, textAlign: "right", marginTop: 2, fontSize: 9 },
  divider: { borderBottomWidth: 2, borderBottomColor: C.primary, marginVertical: 14 },
  thinLine: { borderBottomWidth: 1, borderBottomColor: C.border, marginVertical: 10 },
  billLabel: {
    fontSize: 7, fontFamily: "Helvetica-Bold", color: C.muted,
    textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 5,
  },
  billName: { fontSize: 12, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  billAddr: { color: C.muted, lineHeight: 1.6, fontSize: 9 },
  // Table
  tHead: { flexDirection: "row", backgroundColor: C.primary, paddingHorizontal: 8, paddingVertical: 7 },
  tHCell: { color: "#fff", fontFamily: "Helvetica-Bold", fontSize: 9 },
  tRow: { flexDirection: "row", paddingHorizontal: 8, paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: C.border },
  tRowAlt: { backgroundColor: C.light },
  // Col widths
  cNo: { width: "5%" },
  cDesc: { width: "45%" },
  cQty: { width: "12%", textAlign: "right" },
  cRate: { width: "18%", textAlign: "right" },
  cAmt: { width: "20%", textAlign: "right" },
  // Totals
  totalsWrap: { alignSelf: "flex-end", width: "42%", marginTop: 10 },
  totRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  totLabel: { color: C.muted },
  grandRow: {
    flexDirection: "row", justifyContent: "space-between",
    backgroundColor: C.primary, paddingHorizontal: 10, paddingVertical: 7, marginTop: 4,
  },
  grandLabel: { color: "#fff", fontFamily: "Helvetica-Bold" },
  grandVal: { color: "#fff", fontFamily: "Helvetica-Bold", fontSize: 12 },
  // Words
  wordsBox: {
    backgroundColor: C.light, borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 10, paddingVertical: 8, marginTop: 14,
  },
  wordsLabel: {
    fontSize: 7, fontFamily: "Helvetica-Bold", color: C.muted,
    textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 3,
  },
  wordsText: { fontFamily: "Helvetica-Bold", fontSize: 9 },
  // Footer
  footer: { position: "absolute", bottom: 44, left: 44, right: 44 },
  footerLine: { borderTopWidth: 1, borderTopColor: C.border, paddingTop: 10 },
  footerRow: { flexDirection: "row", justifyContent: "space-between" },
  footerLabel: {
    fontSize: 7, fontFamily: "Helvetica-Bold", color: C.muted,
    textTransform: "uppercase", letterSpacing: 1, marginBottom: 2,
  },
  footerText: { fontSize: 9, color: C.muted },
  sig: { marginTop: 24, borderTopWidth: 1, borderTopColor: C.border, paddingTop: 4, fontSize: 9, color: C.muted },
});

function fmt(n: number) {
  return "Rs. " + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function InvoicePDF({ data }: { data: InvoiceData }) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <View style={{ maxWidth: "55%" }}>
            <Text style={s.coName}>{data.companyName}</Text>
            <Text style={s.coAddr}>{data.companyAddress}</Text>
            {data.companyGSTIN && (
              <Text style={[s.coAddr, { marginTop: 3 }]}>GSTIN: {data.companyGSTIN}</Text>
            )}
          </View>
          <View>
            <Text style={s.invTitle}>{data.isQuotation ? "QUOTATION" : "INVOICE"}</Text>
            <Text style={s.invMeta}>#{data.invoiceNumber}</Text>
            <Text style={s.invMeta}>Date: {data.date}</Text>
          </View>
        </View>

        <View style={s.divider} />

        {/* Bill To */}
        <View style={{ marginBottom: 16 }}>
          <Text style={s.billLabel}>Bill To</Text>
          <Text style={s.billName}>{data.clientName}</Text>
          {data.clientAddress ? <Text style={s.billAddr}>{data.clientAddress}</Text> : null}
          {data.clientGSTIN ? (
            <Text style={[s.billAddr, { marginTop: 2 }]}>GSTIN: {data.clientGSTIN}</Text>
          ) : null}
        </View>

        {/* Line items */}
        <View>
          <View style={s.tHead}>
            <Text style={[s.tHCell, s.cNo]}>#</Text>
            <Text style={[s.tHCell, s.cDesc]}>Description</Text>
            <Text style={[s.tHCell, s.cQty]}>Qty</Text>
            <Text style={[s.tHCell, s.cRate]}>Rate</Text>
            <Text style={[s.tHCell, s.cAmt]}>Amount</Text>
          </View>
          {data.lineItems.map((item, i) => (
            <View key={i} style={[s.tRow, i % 2 === 1 ? s.tRowAlt : {}]}>
              <Text style={s.cNo}>{i + 1}</Text>
              <Text style={s.cDesc}>{item.description}</Text>
              <Text style={s.cQty}>{item.quantity}</Text>
              <Text style={s.cRate}>{item.rate.toFixed(2)}</Text>
              <Text style={s.cAmt}>{item.amount.toFixed(2)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={s.totalsWrap}>
          <View style={s.totRow}>
            <Text style={s.totLabel}>Subtotal</Text>
            <Text>{fmt(data.subtotal)}</Text>
          </View>
          <View style={[s.totRow, { borderBottomWidth: 1, borderBottomColor: C.border, paddingBottom: 5 }]}>
            <Text style={s.totLabel}>GST @ {data.gstRate}%</Text>
            <Text>{fmt(data.gstAmount)}</Text>
          </View>
          <View style={s.grandRow}>
            <Text style={s.grandLabel}>TOTAL</Text>
            <Text style={s.grandVal}>{fmt(data.totalAmount)}</Text>
          </View>
        </View>

        {/* Amount in words */}
        <View style={s.wordsBox}>
          <Text style={s.wordsLabel}>Amount in Words</Text>
          <Text style={s.wordsText}>{amountInWords(data.totalAmount)}</Text>
        </View>

        {/* Footer */}
        <View style={s.footer}>
          <View style={s.footerLine}>
            <View style={s.footerRow}>
              <View>
                <Text style={s.footerLabel}>Payment Terms</Text>
                <Text style={s.footerText}>
                  {data.paymentTerms ?? "Due within 30 days of invoice date."}
                </Text>
                <Text style={[s.footerText, { marginTop: 4 }]}>
                  Thank you for your business!
                </Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={s.footerLabel}>For {data.companyName}</Text>
                <Text style={s.sig}>Authorised Signatory</Text>
              </View>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
