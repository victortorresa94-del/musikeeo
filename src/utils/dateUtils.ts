/**
 * converts a Date object to a YYYY-MM-DD string using LOCAL time,
 * avoiding UTC conversion issues.
 */
export const toLocalDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Creates a Date object from a YYYY-MM-DD string, set to local midnight.
 */
export const fromLocalDateString = (dateStr: string): Date => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
};
