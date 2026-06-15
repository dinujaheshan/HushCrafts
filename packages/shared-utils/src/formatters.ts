/**
 * Formats a numeric value as LKR currency (e.g. 5250 -> LKR 5,250.00)
 */
export function formatLKR(amount: number): string {
  const formatted = new Intl.NumberFormat('en-LK', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  
  return `LKR ${formatted}`;
}

/**
 * Normalizes and formats Firestore timestamps or standard JS dates to readable string
 */
export function formatDate(date: any): string {
  if (!date) return '';
  
  let jsDate: Date;
  
  // Handle Firestore Timestamp structure
  if (typeof date.toDate === 'function') {
    jsDate = date.toDate();
  } else if (date instanceof Date) {
    jsDate = date;
  } else if (typeof date === 'string' || typeof date === 'number') {
    jsDate = new Date(date);
  } else if (date.seconds) {
    jsDate = new Date(date.seconds * 1000);
  } else {
    return 'Invalid Date';
  }
  
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).format(jsDate);
}
