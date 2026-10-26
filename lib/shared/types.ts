export type Gender = "male" | "female";

export interface BirthInput {
  name?: string;
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  gender: Gender;
  lat?: number;
  lng?: number;
  place?: string;
  useTrueSolar?: boolean;
  timezone?: string;
}

export interface DomainSection {
  key: string;
  title: string;
  text: string;
}

export interface TemplateReading {
  label: string;
  disclaimer: string;
  sections: DomainSection[];
}
