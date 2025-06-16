export interface Subdomain {
  id: number;
  subdomain: string;
  full_url: string;
  created_at: string;
  owner_username: string;
}

export interface SubdomainAvailability {
  available: boolean;
  reason?: string;
}

export interface AdminToken {
  token: string;
  created_at: string;
  message: string;
}

export interface AdminTokenStatus {
  has_token: boolean;
  created_at?: string;
}
