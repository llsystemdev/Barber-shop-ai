/**
 * Architecture General Utilities
 */

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(amount);
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('es-MX', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const parseSubdomain = (hostname: string): string | null => {
  const parts = hostname.split('.');
  if (parts.length > 2) {
    return parts[0] || null;
  }
  return null;
};
