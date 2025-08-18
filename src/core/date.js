// Date utilities
export const DateUtils = {
  now() {
    return new Date().toISOString();
  },

  today() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  },

  addDays(dateStr, days) {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + days);
    return date.toISOString();
  },

  isPastDue(dateStr) {
    return new Date(dateStr) <= new Date();
  },

  formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString();
  }
};

if (typeof window !== "undefined") {
  window.DateUtils = DateUtils;
}
