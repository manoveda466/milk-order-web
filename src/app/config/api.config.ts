// API Configuration
export const API_CONFIG = {
  // Base API URL - Update this to match your .NET Core API
  BASE_URL: 'https://localhost:7047/api',
  
  // API Endpoints
  ENDPOINTS: {
    // OTP Authentication
    AUTH: {
      SEND_OTP: 'auth/send-otp',
      VERIFY_OTP: 'auth/verify-otp',
      RESEND_OTP: 'auth/resend-otp',
      LOGOUT: 'auth/logout',
      CURRENT_USER: 'auth/me'
    },
    
    // Users
    USERS: {
      CURRENT: 'user/current',
      PROFILE: 'user/profile'
    },
    
    // Milk Orders
    MILK_ORDERS: {
      BASE: 'milk-orders',
      BY_ID: (id: number) => `milk-orders/${id}`,
      BY_CUSTOMER: 'milk-orders/customer',
      BY_DATE_RANGE: 'milk-orders/date-range',
      STATUS: (id: number) => `milk-orders/${id}/status`,
      STATISTICS: 'milk-orders/statistics',
      EXPORT: 'milk-orders/export'
    },
    
    // File Upload
    UPLOAD: {
      BASE: 'upload',
      IMAGES: 'upload/images',
      DOCUMENTS: 'upload/documents'
    }
  },
  
  // HTTP Headers
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Api-Key': 'c123af47-dbd4-43aa-ae16-9bc82e710c4c'
  },
  
  // Request Timeout (in milliseconds)
  TIMEOUT: 30000,
  
  // Retry Configuration
  RETRY: {
    COUNT: 3,
    DELAY: 1000
  }
};

// Environment-specific configuration
export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}/${endpoint}`;
};

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error occurred. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access denied.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'Server error occurred. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  TIMEOUT_ERROR: 'Request timeout. Please try again.'
} as const;