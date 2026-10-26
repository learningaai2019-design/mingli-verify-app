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
  /** When true, DomainReading renders this section (or its group) collapsed by default. */
  defaultCollapsed?: boolean;
  /** Consecutive sections sharing a group render under one collapsible card. */
  group?: string;
}

export interface TemplateReading {
  label: string;
  disclaimer: string;
  sections: DomainSection[];
}
