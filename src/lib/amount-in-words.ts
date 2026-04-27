const ones = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
  "Seventeen", "Eighteen", "Nineteen",
];
const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function chunk(n: number): string {
  if (n === 0) return "";
  if (n < 20) return ones[n];
  if (n < 100)
    return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + ones[n % 10] : "");
  return (
    ones[Math.floor(n / 100)] +
    " Hundred" +
    (n % 100 !== 0 ? " " + chunk(n % 100) : "")
  );
}

function toWords(n: number): string {
  if (n === 0) return "Zero";
  const parts: string[] = [];
  if (n >= 10_000_000) {
    parts.push(chunk(Math.floor(n / 10_000_000)) + " Crore");
    n %= 10_000_000;
  }
  if (n >= 100_000) {
    parts.push(chunk(Math.floor(n / 100_000)) + " Lakh");
    n %= 100_000;
  }
  if (n >= 1_000) {
    parts.push(chunk(Math.floor(n / 1_000)) + " Thousand");
    n %= 1_000;
  }
  if (n > 0) parts.push(chunk(n));
  return parts.join(" ");
}

export function amountInWords(amount: number): string {
  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);
  let result = "Rupees " + toWords(rupees);
  if (paise > 0) result += ` and ${toWords(paise)} Paise`;
  return result + " Only";
}
