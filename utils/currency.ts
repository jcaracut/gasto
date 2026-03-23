/**
 * Format amount as Philippine Peso currency
 * @param amount - The amount to format
 * @returns Formatted string with PHP symbol and thousand separators
 */
export const formatCurrency = (amount: number): string => {
  const formatted = amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `₱${formatted}`;
};

/**
 * Format amount as Philippine Peso currency (without symbol)
 * @param amount - The amount to format
 * @returns Formatted string with thousand separators
 */
export const formatAmount = (amount: number): string => {
  return amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};
