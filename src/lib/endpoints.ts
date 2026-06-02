// Single source of truth for API paths. Hooks build URLs from here — never inline.
export const ENDPOINTS = {
  auth: {
    google: '/api/auth/google',
    logout: '/api/auth/logout',
    me: '/api/auth/me',
  },
  transactions: {
    list: (qs?: string) => `/api/transactions${qs ? `?${qs}` : ''}`,
    create: '/api/transactions',
    detail: (id: string) => `/api/transactions/${id}`,
    importPreview: '/api/transactions/import/preview',
    importCommit: '/api/transactions/import/commit',
    importBatch: (batchId: string) => `/api/transactions/import/${batchId}`,
  },
  categories: {
    list: '/api/categories',
    create: '/api/categories',
    detail: (id: string) => `/api/categories/${id}`,
  },
  budgets: {
    list: '/api/budgets',
    create: '/api/budgets',
    detail: (id: string) => `/api/budgets/${id}`,
  },
  goals: {
    list: '/api/goals',
    create: '/api/goals',
    detail: (id: string) => `/api/goals/${id}`,
  },
  recurring: {
    list: '/api/recurring',
    create: '/api/recurring',
    detail: (id: string) => `/api/recurring/${id}`,
    generate: '/api/recurring/generate',
  },
  netWorth: {
    list: '/api/net-worth',
    latest: '/api/net-worth/latest',
    create: '/api/net-worth',
  },
  notifications: {
    list: '/api/notifications',
    readAll: '/api/notifications/read-all',
    read: (id: string) => `/api/notifications/${id}/read`,
  },
  analytics: {
    dashboard: '/api/analytics/dashboard',
    monthly: (qs?: string) => `/api/analytics/monthly${qs ? `?${qs}` : ''}`,
    yearly: (qs?: string) => `/api/analytics/yearly${qs ? `?${qs}` : ''}`,
    custom: (qs?: string) => `/api/analytics/custom${qs ? `?${qs}` : ''}`,
  },
  pl: (qs?: string) => `/api/pl${qs ? `?${qs}` : ''}`,
  reports: {
    monthly: (qs?: string) => `/api/reports/monthly${qs ? `?${qs}` : ''}`,
    yearly: (qs?: string) => `/api/reports/yearly${qs ? `?${qs}` : ''}`,
  },
  ai: {
    insights: '/api/ai/insights',
    dismiss: '/api/ai/insights/dismiss',
  },
  export: {
    json: '/api/export/json',
    transactionsCsv: '/api/export/transactions/csv',
  },
  user: {
    preferences: '/api/user/preferences',
    account: '/api/user/account',
  },
} as const;
