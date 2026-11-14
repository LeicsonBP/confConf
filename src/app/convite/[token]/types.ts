export interface SignupCredentials {
  username: string;
  pin: string;
  eventName: string;
  eventDate: string;
  eventAddress: string | null;
}

export interface SignupState {
  error?: string;
  success?: boolean;
  credentials?: SignupCredentials;
}
