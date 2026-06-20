export const API_BASE = 'http://localhost:3000';

// Analytics
export interface AnalyticsData {
  totalWalkThroughs: number;
  uniqueStudents: number;
  totalAlerts: number;
  date: string;
}

// Attendance Event (from Prisma)
export interface AttendanceEvent {
  id: number;
  student_id: string;
  student_name: string | null;
  camera_id: number | null;
  similarity_score: number;
  timestamp: string;
  created_at: string;
}

// Security Alert (from Socket.IO)
export interface SecurityAlert {
  alert_type: string;
  reason: string;
  student_id: string;
  student_name: string;
  similarity_score: number;
  camera_id: number | null;
  time: string;
}

// Student
export interface Student {
  id: number;
  student_id: string;
  full_name: string;
  enrollment_status: string;
  created_at: string;
}

// Health Check
export interface HealthCheck {
  status: string;
  uptime: number;
}

// API Response Wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Auth
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthToken {
  token: string;
  user: {
    id: string;
    email: string;
    role: string;
  };
}
