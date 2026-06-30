export type FamilyPerson = {
  id: string;
  fullName: string;
  gender: "Erkek" | "Kadin";
  birthYear: number | null;
  deathYear: number | null;
  relation: string;
  fatherName: string;
  motherName: string;
  fatherId?: string;
  motherId?: string;
  spouseId?: string;
};

export const familyPeople: FamilyPerson[] = [
  {
    id: "emine-karaca-1849",
    fullName: "EMINE KARACA",
    gender: "Kadin",
    birthYear: 1849,
    deathYear: 1915,
    relation: "Annesinin annesinin babasinin babasinin annesi",
    fatherName: "OMER",
    motherName: "REYHAN"
  },
  {
    id: "yusuf-alkas-1859",
    fullName: "YUSUF ALKAS",
    gender: "Erkek",
    birthYear: 1859,
    deathYear: 1924,
    relation: "Annesinin babasinin babasinin babasi",
    fatherName: "CIKO",
    motherName: "MEDINE"
  },
  {
    id: "haney-alkas-1862",
    fullName: "HANEY ALKAS",
    gender: "Kadin",
    birthYear: 1862,
    deathYear: 1924,
    relation: "Annesinin babasinin babasinin annesi",
    fatherName: "AHO",
    motherName: "GULEY"
  },
  {
    id: "hasan-karaca-1864",
    fullName: "HASAN KARACA",
    gender: "Erkek",
    birthYear: 1864,
    deathYear: 1900,
    relation: "Annesinin annesinin babasinin babasi",
    fatherName: "KANDO",
    motherName: "EMINE",
    motherId: "emine-karaca-1849"
  },
  {
    id: "esme-karaca-1866",
    fullName: "ESME KARACA",
    gender: "Kadin",
    birthYear: 1866,
    deathYear: 1900,
    relation: "Annesinin annesinin babasinin annesi",
    fatherName: "HASAN",
    motherName: "ISEY"
  },
  {
    id: "husso-alkas-1876",
    fullName: "HUSSO ALKAS",
    gender: "Erkek",
    birthYear: 1876,
    deathYear: 1962,
    relation: "Babasinin babasi",
    fatherName: "CIKO",
    motherName: "MEDINE",
    spouseId: "nazi-alkas-1899"
  },
  {
    id: "mahmut-karaca-1887",
    fullName: "MAHMUT KARACA",
    gender: "Erkek",
    birthYear: 1887,
    deathYear: 1945,
    relation: "Annesinin annesinin babasi",
    fatherName: "HASAN",
    motherName: "ESME",
    fatherId: "hasan-karaca-1864",
    motherId: "esme-karaca-1866"
  },
  {
    id: "huseyin-alkas-1894",
    fullName: "HUSEYIN ALKAS",
    gender: "Erkek",
    birthYear: 1894,
    deathYear: 1962,
    relation: "Annesinin babasinin babasi",
    fatherName: "YUSUF",
    motherName: "HANEY",
    fatherId: "yusuf-alkas-1859",
    motherId: "haney-alkas-1862",
    spouseId: "cennet-alkas-1899"
  },
  {
    id: "cennet-alkas-1899",
    fullName: "CENNET ALKAS",
    gender: "Kadin",
    birthYear: 1899,
    deathYear: 1900,
    relation: "Annesinin babasinin annesi",
    fatherName: "ALHO",
    motherName: "FATMA",
    spouseId: "huseyin-alkas-1894"
  },
  {
    id: "nazi-alkas-1899",
    fullName: "NAZI ALKAS",
    gender: "Kadin",
    birthYear: 1899,
    deathYear: 1900,
    relation: "Babasinin annesi",
    fatherName: "HUSEYIN",
    motherName: "DONE",
    spouseId: "husso-alkas-1876"
  },
  {
    id: "ayse-alkas-1929",
    fullName: "AYSE ALKAS",
    gender: "Kadin",
    birthYear: 1929,
    deathYear: 1997,
    relation: "Annesinin annesi",
    fatherName: "MAHMUT",
    motherName: "DONDU",
    fatherId: "mahmut-karaca-1887",
    spouseId: "alho-alkas-1929"
  },
  {
    id: "alho-alkas-1929",
    fullName: "ALHO ALKAS",
    gender: "Erkek",
    birthYear: 1929,
    deathYear: 1975,
    relation: "Annesinin babasi",
    fatherName: "HUSEYIN",
    motherName: "CENNET",
    fatherId: "huseyin-alkas-1894",
    motherId: "cennet-alkas-1899",
    spouseId: "ayse-alkas-1929"
  },
  {
    id: "haydar-alkas-1936",
    fullName: "HAYDAR ALKAS",
    gender: "Erkek",
    birthYear: 1936,
    deathYear: 2015,
    relation: "Babasi",
    fatherName: "HUSSO",
    motherName: "NAZI",
    fatherId: "husso-alkas-1876",
    motherId: "nazi-alkas-1899",
    spouseId: "hanim-alkas-1948"
  },
  {
    id: "hanim-alkas-1948",
    fullName: "HANIM ALKAS",
    gender: "Kadin",
    birthYear: 1948,
    deathYear: null,
    relation: "Annesi",
    fatherName: "ALHO",
    motherName: "AYSE",
    fatherId: "alho-alkas-1929",
    motherId: "ayse-alkas-1929",
    spouseId: "haydar-alkas-1936"
  },
  {
    id: "kemal-alkas-1982",
    fullName: "KEMAL ALKAS",
    gender: "Erkek",
    birthYear: 1982,
    deathYear: null,
    relation: "Kendisi",
    fatherName: "HAYDAR",
    motherName: "HANIM",
    fatherId: "haydar-alkas-1936",
    motherId: "hanim-alkas-1948"
  }
];
