declare module "lunar-javascript" {
  export class Solar {
    static fromYmdHms(y: number, m: number, d: number, h: number, mi: number, s: number): Solar;
    static fromYmd(y: number, m: number, d: number): Solar;
    getLunar(): Lunar;
  }
  export class Lunar {
    getEightChar(): EightChar;
  }
  export class EightChar {
    getYear(): string;
    getMonth(): string;
    getDay(): string;
    getTime(): string;
    getYearNaYin(): string;
    getMonthNaYin(): string;
    getDayNaYin(): string;
    getTimeNaYin(): string;
    getYearHideGan(): string[] | { toArray?: () => string[] };
    getMonthHideGan(): string[] | { toArray?: () => string[] };
    getDayHideGan(): string[] | { toArray?: () => string[] };
    getTimeHideGan(): string[] | { toArray?: () => string[] };
  }
}
