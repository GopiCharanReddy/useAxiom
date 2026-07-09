/**
 * Utility function to suspend execution for a specified duration.
 * @param ms - Milliseconds to sleep
 */
export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Basic phone number format validation helper (supporting standard E.164 format).
 * @param phone - Phone number string to validate
 */
export const isValidPhoneNumber = (phone: string): boolean => {
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  return e164Regex.test(phone);
};

/**
 * Format date utility to display standard ISO date strings consistently.
 * @param date - Date to format
 */
export const formatDateString = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString();
};
