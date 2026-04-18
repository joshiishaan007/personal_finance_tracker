export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  requestId?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}
