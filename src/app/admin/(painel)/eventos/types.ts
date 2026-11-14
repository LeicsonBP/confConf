export interface EventFormState {
  error?: string;
  success?: boolean;
  fieldErrors?: Record<string, string>;
}

export interface EventFormValues {
  name: string;
  description: string;
  location: string;
  address: string;
  startsAt: string;
  maxGift: string;
  extraInfo: string;
  hasSecretSanta: boolean;
}
