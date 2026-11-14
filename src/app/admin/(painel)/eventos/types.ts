export interface EventFormState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

export interface EventFormValues {
  name: string;
  description: string;
  location: string;
  startsAt: string;
  maxGift: string;
  extraInfo: string;
  hasSecretSanta: boolean;
}
