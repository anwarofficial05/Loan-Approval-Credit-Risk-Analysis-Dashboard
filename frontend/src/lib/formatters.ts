/**
 * Indian Financial Formatting Utilities
 */

export function formatINR(val: number | null | undefined, compact: boolean = false): string {
  if (val === null || val === undefined || isNaN(val)) return '₹0';
  
  if (compact) {
    if (val >= 10000000) {
      return `₹${(val / 10000000).toFixed(2)} Cr`;
    } else if (val >= 100000) {
      return `₹${(val / 100000).toFixed(2)} L`;
    } else if (val >= 1000) {
      return `₹${(val / 1000).toFixed(1)} K`;
    } else {
      return `₹${Math.round(val)}`;
    }
  }

  // Full Indian numbering grouping (e.g. 1,24,50,000)
  const rounded = Math.round(val);
  const isNeg = rounded < 0;
  const absStr = Math.abs(rounded).toString();

  if (absStr.length <= 3) {
    return `${isNeg ? '-' : ''}₹${absStr}`;
  }

  const lastThree = absStr.substring(absStr.length - 3);
  const otherNumbers = absStr.substring(0, absStr.length - 3);
  const withCommas = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + lastThree;

  return `${isNeg ? '-' : ''}₹${withCommas}`;
}

export function formatPercent(val: number | null | undefined, decimals: number = 1): string {
  if (val === null || val === undefined || isNaN(val)) return '0.0%';
  return `${val.toFixed(decimals)}%`;
}

export function formatIndianNumber(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return '0';
  const rounded = Math.round(val);
  const isNeg = rounded < 0;
  const absStr = Math.abs(rounded).toString();

  if (absStr.length <= 3) {
    return `${isNeg ? '-' : ''}${absStr}`;
  }

  const lastThree = absStr.substring(absStr.length - 3);
  const otherNumbers = absStr.substring(0, absStr.length - 3);
  const withCommas = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + lastThree;

  return `${isNeg ? '-' : ''}${withCommas}`;
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
}
