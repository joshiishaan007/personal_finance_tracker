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
    frequent: '/api/transactions/frequent',
    detail: (id: string) => `/api/transactions/${id}`,
    importPreview: '/api/transactions/import/preview',
    importCommit: '/api/transactions/import/commit',
    importBatch: (batchId: string) => `/api/transactions/import/${batchId}`,
    trash: '/api/transactions/trash',
    trashItem: (id: string) => `/api/transactions/trash/${id}`,
    restore: (id: string) => `/api/transactions/${id}/restore`,
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
  spendingPlan: {
    get: '/api/spending-plan',
    update: '/api/spending-plan',
    history: '/api/spending-plan/history',
  },
  investments: {
    list: '/api/investments',
    create: '/api/investments',
    detail: (id: string) => `/api/investments/${id}`,
  },
  loans: {
    list:    '/api/loans',
    create:  '/api/loans',
    detail:  (id: string) => `/api/loans/${id}`,
    payment: (id: string) => `/api/loans/${id}/payment`,
  },
  grossPL: {
    list: '/api/gross-pl',
    create: '/api/gross-pl',
    detail: (id: string) => `/api/gross-pl/${id}`,
  },
  balance: '/api/balance',
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
    pl: '/api/analytics/pl',
    tags: (qs?: string) => `/api/analytics/tags${qs ? `?${qs}` : ''}`,
    spendingHeatmap: '/api/analytics/spending-heatmap',
  },
  pl: (qs?: string) => `/api/pl${qs ? `?${qs}` : ''}`,
  reports: {
    monthly: (qs?: string) => `/api/reports/monthly${qs ? `?${qs}` : ''}`,
    yearly: (qs?: string) => `/api/reports/yearly${qs ? `?${qs}` : ''}`,
  },
  ai: {
    insights: '/api/ai/insights',
    generate: '/api/ai/insights',
    dismiss: '/api/ai/insights/dismiss',
    parse: '/api/ai/parse',
  },
  engagement: {
    daily: '/api/engagement/daily',
  },
  lifeGoals: {
    list: '/api/life-goals',
    create: '/api/life-goals',
    detail: (id: string) => `/api/life-goals/${id}`,
    summary: '/api/life-goals/summary',
    today: '/api/life-goals/today',
  },
  contributions: {
    list: (qs?: string) => `/api/contributions${qs ? `?${qs}` : ''}`,
    create: '/api/contributions',
    detail: (id: string) => `/api/contributions/${id}`,
    heatmap: (qs: string) => `/api/contributions/heatmap?${qs}`,
  },
  tasks: {
    list: (qs?: string) => `/api/tasks${qs ? `?${qs}` : ''}`,
    create: '/api/tasks',
    detail: (id: string) => `/api/tasks/${id}`,
  },
  push: {
    vapidPublicKey: '/api/push/vapid-public-key',
    subscribe:      '/api/push/subscribe',
    unsubscribe:    '/api/push/unsubscribe',
  },
  debts: {
    list:    (qs?: string) => `/api/debts${qs ? `?${qs}` : ''}`,
    create:  '/api/debts',
    summary: (qs?: string) => `/api/debts/summary${qs ? `?${qs}` : ''}`,
    cleanup: '/api/debts/cleanup',
    detail:  (id: string) => `/api/debts/${id}`,
  },
  instantCards: {
    list:    '/api/instant-cards',
    create:  '/api/instant-cards',
    reorder: '/api/instant-cards/reorder',
    detail:  (id: string) => `/api/instant-cards/${id}`,
  },
  export: {
    json: '/api/export/json',
    transactionsCsv: '/api/export/transactions/csv',
  },
  import: {
    json: '/api/import/json',
  },
  user: {
    preferences: '/api/user/preferences',
    account: '/api/user/account',
  },
} as const;
