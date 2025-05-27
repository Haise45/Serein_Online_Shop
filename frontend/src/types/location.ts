export interface Province {
  _id: string;
  code: string;
  name: string;
  countryCode?: string;
}

export interface District {
  _id: string;
  code: string;
  name: string;
  provinceCode: string;
}

export interface Commune {
  _id: string;
  code: string;
  name: string;
  districtCode: string;
}
