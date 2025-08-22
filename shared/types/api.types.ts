export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface AuthResponse {
  token: string;
  user: UserInfo;
}

export interface UserInfo {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  teams?: string[];
}

export interface FileImportRequest {
  fileKey: string;
  name?: string;
}

export interface FileExportRequest {
  format: 'json' | 'svg' | 'png' | 'pdf';
  scale?: number;
  nodeIds?: string[];
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface FileListResponse {
  files: any[];
  total: number;
  page: number;
  totalPages: number;
}