export interface SignupCredentials {
  username: string;
  pin: string;
  eventName: string;
}

export interface SignupState {
  error?: string;
  success?: boolean;
  credentials?: SignupCredentials;
}
