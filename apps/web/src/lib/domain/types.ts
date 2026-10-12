/** Auth identifiers and Google identity must never appear in public profile payloads. */
export type AccountState = 'pending_age' | 'active' | 'restricted' | 'suspended';
export type ChatRequestStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled';
export type RetentionMode = 'normal' | '24h' | '7d';
export type MessageKind = 'text' | 'voice';
export type AuthContext = {
  accountId: string;
  authUserId: string;
  role: 'user' | 'admin';
  state: AccountState;
};
export type DiscoveryFilters = {
  districts: string[];
  genders: string[];
  minAge: number;
  maxAge: number;
  interests: string[];
  intentions: string[];
  languages: string[];
  onlineOnly: boolean;
  pageSize: number;
  cursor?: string;
};
