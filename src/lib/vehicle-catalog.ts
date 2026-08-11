/**
 * Year / Make / Model catalog.
 *
 * Expanded from Revive Detail's `src/lib/vehicle.ts`, which offered a flat
 * 31-entry make dropdown and a free-text model box. That was fine for
 * detailing — the only thing the model actually decided was which of four
 * price buckets the car fell into. A repair shop needs more: the model and its
 * year range drive labor time, parts lookup, and which services even apply, so
 * guessing from a regex isn't good enough.
 *
 * So this file carries a real catalog: makes, their models, each model's
 * production year range, and its body class. It is deliberately a plain data
 * module — no database, no API key, no network — so year/make/model selection
 * works offline and instantly. The vehicle-data provider (see
 * `vehicle-provider.ts`) can widen it at runtime, but the site is never
 * *dependent* on that.
 *
 * Coverage aims at what a Shenandoah Valley general-repair shop actually
 * drives onto the lift: mainstream US-market makes from roughly 1990 on, plus
 * the domestic trucks and older models that stay on the road around here.
 */

export type VehicleClass = "sedan" | "suv" | "truck" | "minivan" | "van";

export const VEHICLE_CLASSES: VehicleClass[] = [
  "sedan",
  "suv",
  "truck",
  "minivan",
  "van",
];

export const VEHICLE_CLASS_LABELS: Record<VehicleClass, string> = {
  sedan: "Car / Coupe / Sedan / Hatchback",
  suv: "SUV / Crossover",
  truck: "Pickup Truck",
  minivan: "Minivan",
  van: "Full-size / Cargo Van",
};

/**
 * A model as stored in the catalog: name, first year, last year (null = still
 * in production), body class.
 */
export type ModelEntry = [name: string, from: number, to: number | null, cls: VehicleClass];

export type Model = {
  name: string;
  from: number;
  to: number | null;
  vehicleClass: VehicleClass;
};

/** The oldest model year the year dropdown offers. */
export const EARLIEST_YEAR = 1981;

/** Catalog, keyed by make. Models are listed alphabetically per make. */
export const CATALOG: Record<string, ModelEntry[]> = {
  Acura: [
    ["CL", 1997, 2003, "sedan"], ["ILX", 2013, 2022, "sedan"],
    ["Integra", 1986, 2001, "sedan"], ["Integra", 2023, null, "sedan"],
    ["Legend", 1986, 1995, "sedan"], ["MDX", 2001, null, "suv"],
    ["NSX", 1991, 2005, "sedan"], ["RDX", 2007, null, "suv"],
    ["RL", 1996, 2012, "sedan"], ["RLX", 2014, 2020, "sedan"],
    ["RSX", 2002, 2006, "sedan"], ["TL", 1995, 2014, "sedan"],
    ["TLX", 2015, null, "sedan"], ["TSX", 2004, 2014, "sedan"],
    ["ZDX", 2010, 2013, "suv"], ["ZDX", 2024, null, "suv"],
  ],
  "Alfa Romeo": [
    ["Giulia", 2017, null, "sedan"], ["Stelvio", 2018, null, "suv"],
    ["4C", 2015, 2020, "sedan"],
  ],
  Audi: [
    ["A3", 2006, null, "sedan"], ["A4", 1996, null, "sedan"],
    ["A5", 2008, null, "sedan"], ["A6", 1995, null, "sedan"],
    ["A7", 2012, null, "sedan"], ["A8", 1997, null, "sedan"],
    ["allroad", 2001, 2005, "suv"], ["e-tron", 2019, null, "suv"],
    ["Q3", 2015, null, "suv"], ["Q5", 2009, null, "suv"],
    ["Q7", 2007, null, "suv"], ["Q8", 2019, null, "suv"],
    ["S4", 2000, null, "sedan"], ["TT", 2000, 2023, "sedan"],
  ],
  BMW: [
    ["1 Series", 2008, 2013, "sedan"], ["2 Series", 2014, null, "sedan"],
    ["3 Series", 1983, null, "sedan"], ["4 Series", 2014, null, "sedan"],
    ["5 Series", 1982, null, "sedan"], ["6 Series", 2004, 2019, "sedan"],
    ["7 Series", 1986, null, "sedan"], ["8 Series", 1991, 1997, "sedan"],
    ["8 Series", 2019, null, "sedan"], ["i3", 2014, 2021, "sedan"],
    ["i4", 2022, null, "sedan"], ["iX", 2022, null, "suv"],
    ["M3", 1988, null, "sedan"], ["M5", 1988, null, "sedan"],
    ["X1", 2013, null, "suv"], ["X2", 2018, null, "suv"],
    ["X3", 2004, null, "suv"], ["X4", 2015, null, "suv"],
    ["X5", 2000, null, "suv"], ["X6", 2008, null, "suv"],
    ["X7", 2019, null, "suv"], ["Z3", 1996, 2002, "sedan"],
    ["Z4", 2003, null, "sedan"],
  ],
  Buick: [
    ["Century", 1982, 2005, "sedan"], ["Enclave", 2008, null, "suv"],
    ["Encore", 2013, 2022, "suv"], ["Encore GX", 2020, null, "suv"],
    ["Envision", 2016, null, "suv"], ["Envista", 2024, null, "suv"],
    ["LaCrosse", 2005, 2019, "sedan"], ["LeSabre", 1981, 2005, "sedan"],
    ["Lucerne", 2006, 2011, "sedan"], ["Park Avenue", 1991, 2005, "sedan"],
    ["Rainier", 2004, 2007, "suv"], ["Regal", 1981, 2020, "sedan"],
    ["Rendezvous", 2002, 2007, "suv"], ["Roadmaster", 1991, 1996, "sedan"],
    ["Verano", 2012, 2017, "sedan"],
  ],
  Cadillac: [
    ["ATS", 2013, 2019, "sedan"], ["CT4", 2020, null, "sedan"],
    ["CT5", 2020, null, "sedan"], ["CT6", 2016, 2020, "sedan"],
    ["CTS", 2003, 2019, "sedan"], ["DeVille", 1981, 2005, "sedan"],
    ["DTS", 2006, 2011, "sedan"], ["Eldorado", 1981, 2002, "sedan"],
    ["Escalade", 1999, null, "suv"], ["Lyriq", 2023, null, "suv"],
    ["SRX", 2004, 2016, "suv"], ["STS", 2005, 2011, "sedan"],
    ["XT4", 2019, null, "suv"], ["XT5", 2017, null, "suv"],
    ["XT6", 2020, null, "suv"], ["XTS", 2013, 2019, "sedan"],
  ],
  Chevrolet: [
    ["Astro", 1985, 2005, "van"], ["Avalanche", 2002, 2013, "truck"],
    ["Aveo", 2004, 2011, "sedan"], ["Blazer", 1983, 2005, "suv"],
    ["Blazer", 2019, null, "suv"], ["Bolt EV", 2017, null, "sedan"],
    ["Camaro", 1981, null, "sedan"], ["Caprice", 1981, 1996, "sedan"],
    ["Cavalier", 1982, 2005, "sedan"], ["Cobalt", 2005, 2010, "sedan"],
    ["Colorado", 2004, null, "truck"], ["Corvette", 1981, null, "sedan"],
    ["Cruze", 2011, 2019, "sedan"], ["Equinox", 2005, null, "suv"],
    ["Express", 1996, null, "van"], ["HHR", 2006, 2011, "suv"],
    ["Impala", 1994, 2020, "sedan"], ["Lumina", 1990, 2001, "sedan"],
    ["Malibu", 1997, 2024, "sedan"], ["Monte Carlo", 1981, 2007, "sedan"],
    ["S-10", 1982, 2004, "truck"], ["Silverado 1500", 1999, null, "truck"],
    ["Silverado 2500HD", 2001, null, "truck"], ["Silverado 3500HD", 2001, null, "truck"],
    ["Sonic", 2012, 2020, "sedan"], ["Spark", 2013, 2022, "sedan"],
    ["Suburban", 1981, null, "suv"], ["Tahoe", 1995, null, "suv"],
    ["Trailblazer", 2002, 2009, "suv"], ["Trailblazer", 2021, null, "suv"],
    ["Traverse", 2009, null, "suv"], ["Trax", 2015, null, "suv"],
    ["Uplander", 2005, 2009, "minivan"], ["Venture", 1997, 2005, "minivan"],
  ],
  Chrysler: [
    ["200", 2011, 2017, "sedan"], ["300", 2005, 2023, "sedan"],
    ["300M", 1999, 2004, "sedan"], ["Aspen", 2007, 2009, "suv"],
    ["Cirrus", 1995, 2000, "sedan"], ["Concorde", 1993, 2004, "sedan"],
    ["Crossfire", 2004, 2008, "sedan"], ["LHS", 1994, 2001, "sedan"],
    ["Pacifica", 2004, 2008, "suv"], ["Pacifica", 2017, null, "minivan"],
    ["PT Cruiser", 2001, 2010, "sedan"], ["Sebring", 1995, 2010, "sedan"],
    ["Town & Country", 1990, 2016, "minivan"], ["Voyager", 2020, null, "minivan"],
  ],
  Dodge: [
    ["Avenger", 1995, 2014, "sedan"], ["Caliber", 2007, 2012, "sedan"],
    ["Caravan", 1984, 2007, "minivan"], ["Challenger", 2008, 2023, "sedan"],
    ["Charger", 2006, null, "sedan"], ["Dakota", 1987, 2011, "truck"],
    ["Dart", 2013, 2016, "sedan"], ["Durango", 1998, null, "suv"],
    ["Grand Caravan", 1987, 2020, "minivan"], ["Hornet", 2023, null, "suv"],
    ["Intrepid", 1993, 2004, "sedan"], ["Journey", 2009, 2020, "suv"],
    ["Magnum", 2005, 2008, "sedan"], ["Neon", 1995, 2005, "sedan"],
    ["Nitro", 2007, 2012, "suv"], ["Ram 1500", 1994, 2010, "truck"],
    ["Ram 2500", 1994, 2010, "truck"], ["Stratus", 1995, 2006, "sedan"],
    ["Viper", 1992, 2017, "sedan"],
  ],
  Fiat: [
    ["500", 2012, 2019, "sedan"], ["500L", 2014, 2020, "sedan"],
    ["500X", 2016, 2023, "suv"],
  ],
  Ford: [
    ["Bronco", 1981, 1996, "suv"], ["Bronco", 2021, null, "suv"],
    ["Bronco Sport", 2021, null, "suv"], ["C-Max", 2013, 2018, "sedan"],
    ["Contour", 1995, 2000, "sedan"], ["Crown Victoria", 1992, 2011, "sedan"],
    ["E-150", 1981, 2014, "van"], ["E-250", 1981, 2014, "van"],
    ["E-350", 1981, null, "van"], ["EcoSport", 2018, 2022, "suv"],
    ["Edge", 2007, 2024, "suv"], ["Escape", 2001, null, "suv"],
    ["Escort", 1981, 2003, "sedan"], ["Excursion", 2000, 2005, "suv"],
    ["Expedition", 1997, null, "suv"], ["Explorer", 1991, null, "suv"],
    ["F-150", 1981, null, "truck"], ["F-250", 1981, null, "truck"],
    ["F-350", 1981, null, "truck"], ["Fiesta", 2011, 2019, "sedan"],
    ["Five Hundred", 2005, 2007, "sedan"], ["Flex", 2009, 2019, "suv"],
    ["Focus", 2000, 2018, "sedan"], ["Freestar", 2004, 2007, "minivan"],
    ["Fusion", 2006, 2020, "sedan"], ["Maverick", 2022, null, "truck"],
    ["Mustang", 1981, null, "sedan"], ["Mustang Mach-E", 2021, null, "suv"],
    ["Ranger", 1983, 2011, "truck"], ["Ranger", 2019, null, "truck"],
    ["Taurus", 1986, 2019, "sedan"], ["Tempo", 1984, 1994, "sedan"],
    ["Thunderbird", 1981, 2005, "sedan"], ["Transit", 2015, null, "van"],
    ["Transit Connect", 2010, 2023, "van"], ["Windstar", 1995, 2003, "minivan"],
  ],
  Genesis: [
    ["G70", 2019, null, "sedan"], ["G80", 2017, null, "sedan"],
    ["G90", 2017, null, "sedan"], ["GV70", 2022, null, "suv"],
    ["GV80", 2021, null, "suv"],
  ],
  GMC: [
    ["Acadia", 2007, null, "suv"], ["Canyon", 2004, null, "truck"],
    ["Envoy", 1998, 2009, "suv"], ["Jimmy", 1983, 2005, "suv"],
    ["Safari", 1985, 2005, "van"], ["Savana", 1996, null, "van"],
    ["Sierra 1500", 1999, null, "truck"], ["Sierra 2500HD", 2001, null, "truck"],
    ["Sierra 3500HD", 2001, null, "truck"], ["Sonoma", 1991, 2004, "truck"],
    ["Terrain", 2010, null, "suv"], ["Yukon", 1992, null, "suv"],
    ["Yukon XL", 2000, null, "suv"],
  ],
  Honda: [
    ["Accord", 1981, null, "sedan"], ["Civic", 1981, null, "sedan"],
    ["Clarity", 2017, 2021, "sedan"], ["CR-V", 1997, null, "suv"],
    ["CR-Z", 2011, 2016, "sedan"], ["Crosstour", 2010, 2015, "suv"],
    ["Element", 2003, 2011, "suv"], ["Fit", 2007, 2020, "sedan"],
    ["HR-V", 2016, null, "suv"], ["Insight", 2000, 2022, "sedan"],
    ["Odyssey", 1995, null, "minivan"], ["Passport", 1994, 2002, "suv"],
    ["Passport", 2019, null, "suv"], ["Pilot", 2003, null, "suv"],
    ["Prelude", 1981, 2001, "sedan"], ["Ridgeline", 2006, null, "truck"],
    ["S2000", 2000, 2009, "sedan"],
  ],
  Hyundai: [
    ["Accent", 1995, 2022, "sedan"], ["Azera", 2006, 2017, "sedan"],
    ["Elantra", 1991, null, "sedan"], ["Genesis", 2009, 2016, "sedan"],
    ["Ioniq", 2017, 2022, "sedan"], ["Ioniq 5", 2022, null, "suv"],
    ["Ioniq 6", 2023, null, "sedan"], ["Kona", 2018, null, "suv"],
    ["Palisade", 2020, null, "suv"], ["Santa Cruz", 2022, null, "truck"],
    ["Santa Fe", 2001, null, "suv"], ["Sonata", 1989, null, "sedan"],
    ["Tiburon", 1997, 2008, "sedan"], ["Tucson", 2005, null, "suv"],
    ["Veloster", 2012, 2022, "sedan"], ["Venue", 2020, null, "suv"],
    ["Veracruz", 2007, 2012, "suv"],
  ],
  Infiniti: [
    ["EX35", 2008, 2012, "suv"], ["FX35", 2003, 2013, "suv"],
    ["G20", 1991, 2002, "sedan"], ["G35", 2003, 2008, "sedan"],
    ["G37", 2008, 2013, "sedan"], ["I30", 1996, 2001, "sedan"],
    ["JX35", 2013, 2013, "suv"], ["M35", 2006, 2010, "sedan"],
    ["Q50", 2014, null, "sedan"], ["Q60", 2014, 2022, "sedan"],
    ["QX50", 2014, null, "suv"], ["QX56", 2004, 2013, "suv"],
    ["QX60", 2014, null, "suv"], ["QX80", 2014, null, "suv"],
  ],
  Jaguar: [
    ["E-Pace", 2018, null, "suv"], ["F-Pace", 2017, null, "suv"],
    ["F-Type", 2014, 2024, "sedan"], ["I-Pace", 2019, null, "suv"],
    ["S-Type", 2000, 2008, "sedan"], ["XE", 2017, 2020, "sedan"],
    ["XF", 2009, null, "sedan"], ["XJ", 1981, 2019, "sedan"],
    ["XK", 1997, 2015, "sedan"],
  ],
  Jeep: [
    ["Cherokee", 1984, 2001, "suv"], ["Cherokee", 2014, 2023, "suv"],
    ["Commander", 2006, 2010, "suv"], ["Compass", 2007, null, "suv"],
    ["Gladiator", 2020, null, "truck"], ["Grand Cherokee", 1993, null, "suv"],
    ["Grand Wagoneer", 1984, 1991, "suv"], ["Grand Wagoneer", 2022, null, "suv"],
    ["Liberty", 2002, 2012, "suv"], ["Patriot", 2007, 2017, "suv"],
    ["Renegade", 2015, 2023, "suv"], ["Wagoneer", 2022, null, "suv"],
    ["Wrangler", 1987, null, "suv"],
  ],
  Kia: [
    ["Amanti", 2004, 2009, "sedan"], ["Carnival", 2022, null, "minivan"],
    ["EV6", 2022, null, "suv"], ["Forte", 2010, null, "sedan"],
    ["K5", 2021, null, "sedan"], ["Niro", 2017, null, "suv"],
    ["Optima", 2001, 2020, "sedan"], ["Rio", 2001, null, "sedan"],
    ["Sedona", 2002, 2021, "minivan"], ["Seltos", 2021, null, "suv"],
    ["Sorento", 2003, null, "suv"], ["Soul", 2010, null, "suv"],
    ["Spectra", 2000, 2009, "sedan"], ["Sportage", 1995, null, "suv"],
    ["Stinger", 2018, 2023, "sedan"], ["Telluride", 2020, null, "suv"],
  ],
  "Land Rover": [
    ["Defender", 1993, 1997, "suv"], ["Defender", 2020, null, "suv"],
    ["Discovery", 1994, null, "suv"], ["Discovery Sport", 2015, null, "suv"],
    ["Freelander", 2002, 2005, "suv"], ["LR3", 2005, 2009, "suv"],
    ["LR4", 2010, 2016, "suv"], ["Range Rover", 1987, null, "suv"],
    ["Range Rover Evoque", 2012, null, "suv"], ["Range Rover Sport", 2006, null, "suv"],
    ["Range Rover Velar", 2018, null, "suv"],
  ],
  Lexus: [
    ["CT200h", 2011, 2017, "sedan"], ["ES", 1990, null, "sedan"],
    ["GS", 1993, 2020, "sedan"], ["GX", 2003, null, "suv"],
    ["IS", 2001, null, "sedan"], ["LC", 2018, null, "sedan"],
    ["LS", 1990, null, "sedan"], ["LX", 1996, null, "suv"],
    ["NX", 2015, null, "suv"], ["RC", 2015, null, "sedan"],
    ["RX", 1999, null, "suv"], ["SC", 1992, 2010, "sedan"],
    ["TX", 2024, null, "suv"], ["UX", 2019, null, "suv"],
  ],
  Lincoln: [
    ["Aviator", 2003, 2005, "suv"], ["Aviator", 2020, null, "suv"],
    ["Continental", 1981, 2020, "sedan"], ["Corsair", 2020, null, "suv"],
    ["LS", 2000, 2006, "sedan"], ["Mark LT", 2006, 2008, "truck"],
    ["MKC", 2015, 2019, "suv"], ["MKS", 2009, 2016, "sedan"],
    ["MKT", 2010, 2019, "suv"], ["MKX", 2007, 2018, "suv"],
    ["MKZ", 2007, 2020, "sedan"], ["Nautilus", 2019, null, "suv"],
    ["Navigator", 1998, null, "suv"], ["Town Car", 1981, 2011, "sedan"],
  ],
  Mazda: [
    ["3", 2004, null, "sedan"], ["5", 2006, 2015, "minivan"],
    ["6", 2003, 2021, "sedan"], ["626", 1981, 2002, "sedan"],
    ["B-Series", 1994, 2009, "truck"], ["CX-3", 2016, 2021, "suv"],
    ["CX-30", 2020, null, "suv"], ["CX-5", 2013, null, "suv"],
    ["CX-50", 2023, null, "suv"], ["CX-7", 2007, 2012, "suv"],
    ["CX-9", 2007, 2023, "suv"], ["CX-90", 2024, null, "suv"],
    ["Miata MX-5", 1990, null, "sedan"], ["MPV", 1989, 2006, "minivan"],
    ["Protege", 1990, 2003, "sedan"], ["RX-7", 1981, 1995, "sedan"],
    ["RX-8", 2004, 2011, "sedan"], ["Tribute", 2001, 2011, "suv"],
  ],
  "Mercedes-Benz": [
    ["A-Class", 2019, 2022, "sedan"], ["C-Class", 1994, null, "sedan"],
    ["CLA", 2014, null, "sedan"], ["CLK", 1998, 2009, "sedan"],
    ["CLS", 2006, 2023, "sedan"], ["E-Class", 1986, null, "sedan"],
    ["G-Class", 2002, null, "suv"], ["GL-Class", 2007, 2016, "suv"],
    ["GLA", 2015, null, "suv"], ["GLB", 2020, null, "suv"],
    ["GLC", 2016, null, "suv"], ["GLE", 2016, null, "suv"],
    ["GLK", 2010, 2015, "suv"], ["GLS", 2017, null, "suv"],
    ["M-Class", 1998, 2015, "suv"], ["Metris", 2016, 2023, "van"],
    ["S-Class", 1981, null, "sedan"], ["SL", 1981, null, "sedan"],
    ["SLK", 1998, 2020, "sedan"], ["Sprinter", 2003, null, "van"],
  ],
  Mercury: [
    ["Cougar", 1981, 2002, "sedan"], ["Grand Marquis", 1983, 2011, "sedan"],
    ["Mariner", 2005, 2011, "suv"], ["Milan", 2006, 2011, "sedan"],
    ["Mountaineer", 1997, 2010, "suv"], ["Sable", 1986, 2009, "sedan"],
    ["Villager", 1993, 2002, "minivan"],
  ],
  Mini: [
    ["Clubman", 2008, 2024, "sedan"], ["Cooper", 2002, null, "sedan"],
    ["Countryman", 2011, null, "suv"], ["Paceman", 2013, 2016, "suv"],
  ],
  Mitsubishi: [
    ["3000GT", 1991, 1999, "sedan"], ["Eclipse", 1990, 2012, "sedan"],
    ["Eclipse Cross", 2018, null, "suv"], ["Endeavor", 2004, 2011, "suv"],
    ["Galant", 1985, 2012, "sedan"], ["Lancer", 2002, 2017, "sedan"],
    ["Mirage", 1985, null, "sedan"], ["Montero", 1983, 2006, "suv"],
    ["Outlander", 2003, null, "suv"], ["Outlander Sport", 2011, null, "suv"],
  ],
  Nissan: [
    ["350Z", 2003, 2009, "sedan"], ["370Z", 2009, 2020, "sedan"],
    ["Altima", 1993, null, "sedan"], ["Armada", 2004, null, "suv"],
    ["Cube", 2009, 2014, "suv"], ["Frontier", 1998, null, "truck"],
    ["Juke", 2011, 2017, "suv"], ["Kicks", 2018, null, "suv"],
    ["Leaf", 2011, null, "sedan"], ["Maxima", 1985, 2023, "sedan"],
    ["Murano", 2003, null, "suv"], ["NV200", 2013, 2021, "van"],
    ["Pathfinder", 1987, null, "suv"], ["Quest", 1993, 2016, "minivan"],
    ["Rogue", 2008, null, "suv"], ["Sentra", 1982, null, "sedan"],
    ["Titan", 2004, 2024, "truck"], ["Versa", 2007, null, "sedan"],
    ["Xterra", 2000, 2015, "suv"], ["Z", 2023, null, "sedan"],
  ],
  Oldsmobile: [
    ["Alero", 1999, 2004, "sedan"], ["Aurora", 1995, 2003, "sedan"],
    ["Bravada", 1991, 2004, "suv"], ["Cutlass", 1981, 1999, "sedan"],
    ["Intrigue", 1998, 2002, "sedan"], ["Silhouette", 1990, 2004, "minivan"],
  ],
  Plymouth: [
    ["Breeze", 1996, 2000, "sedan"], ["Grand Voyager", 1984, 2000, "minivan"],
    ["Neon", 1995, 2001, "sedan"], ["Voyager", 1984, 2000, "minivan"],
  ],
  Pontiac: [
    ["Aztek", 2001, 2005, "suv"], ["Bonneville", 1981, 2005, "sedan"],
    ["Firebird", 1981, 2002, "sedan"], ["G5", 2007, 2009, "sedan"],
    ["G6", 2005, 2010, "sedan"], ["G8", 2008, 2009, "sedan"],
    ["Grand Am", 1985, 2005, "sedan"], ["Grand Prix", 1981, 2008, "sedan"],
    ["Montana", 1999, 2006, "minivan"], ["Solstice", 2006, 2010, "sedan"],
    ["Sunfire", 1995, 2005, "sedan"], ["Torrent", 2006, 2009, "suv"],
    ["Vibe", 2003, 2010, "suv"],
  ],
  Porsche: [
    ["718 Boxster", 2017, null, "sedan"], ["911", 1981, null, "sedan"],
    ["Boxster", 1997, 2016, "sedan"], ["Cayenne", 2003, null, "suv"],
    ["Cayman", 2006, 2016, "sedan"], ["Macan", 2015, null, "suv"],
    ["Panamera", 2010, null, "sedan"], ["Taycan", 2020, null, "sedan"],
  ],
  Ram: [
    ["1500", 2011, null, "truck"], ["2500", 2011, null, "truck"],
    ["3500", 2011, null, "truck"], ["ProMaster", 2014, null, "van"],
    ["ProMaster City", 2015, 2022, "van"],
  ],
  Saturn: [
    ["Aura", 2007, 2009, "sedan"], ["ION", 2003, 2007, "sedan"],
    ["Outlook", 2007, 2010, "suv"], ["Relay", 2005, 2007, "minivan"],
    ["SL", 1991, 2002, "sedan"], ["Vue", 2002, 2010, "suv"],
  ],
  Subaru: [
    ["Ascent", 2019, null, "suv"], ["Baja", 2003, 2006, "truck"],
    ["BRZ", 2013, null, "sedan"], ["Crosstrek", 2013, null, "suv"],
    ["Forester", 1998, null, "suv"], ["Impreza", 1993, null, "sedan"],
    ["Legacy", 1990, null, "sedan"], ["Outback", 1995, null, "suv"],
    ["Solterra", 2023, null, "suv"], ["Tribeca", 2006, 2014, "suv"],
    ["WRX", 2002, null, "sedan"],
  ],
  Tesla: [
    ["Cybertruck", 2024, null, "truck"], ["Model 3", 2017, null, "sedan"],
    ["Model S", 2012, null, "sedan"], ["Model X", 2016, null, "suv"],
    ["Model Y", 2020, null, "suv"],
  ],
  Toyota: [
    ["4Runner", 1984, null, "suv"], ["Avalon", 1995, 2022, "sedan"],
    ["bZ4X", 2023, null, "suv"], ["C-HR", 2018, 2022, "suv"],
    ["Camry", 1983, null, "sedan"], ["Celica", 1981, 2005, "sedan"],
    ["Corolla", 1981, null, "sedan"], ["Corolla Cross", 2022, null, "suv"],
    ["Cressida", 1981, 1992, "sedan"], ["Echo", 2000, 2005, "sedan"],
    ["FJ Cruiser", 2007, 2014, "suv"], ["Grand Highlander", 2024, null, "suv"],
    ["Highlander", 2001, null, "suv"], ["Land Cruiser", 1981, null, "suv"],
    ["Matrix", 2003, 2013, "suv"], ["MR2", 1985, 2005, "sedan"],
    ["Previa", 1991, 1997, "minivan"], ["Prius", 2001, null, "sedan"],
    ["RAV4", 1996, null, "suv"], ["Sequoia", 2001, null, "suv"],
    ["Sienna", 1998, null, "minivan"], ["Solara", 1999, 2008, "sedan"],
    ["Supra", 1981, 1998, "sedan"], ["Supra", 2020, null, "sedan"],
    ["Tacoma", 1995, null, "truck"], ["Tercel", 1981, 1999, "sedan"],
    ["Tundra", 2000, null, "truck"], ["Venza", 2009, null, "suv"],
    ["Yaris", 2007, 2020, "sedan"],
  ],
  Volkswagen: [
    ["Atlas", 2018, null, "suv"], ["Beetle", 1998, 2019, "sedan"],
    ["CC", 2009, 2017, "sedan"], ["Eos", 2007, 2016, "sedan"],
    ["Golf", 1985, null, "sedan"], ["GTI", 1983, null, "sedan"],
    ["ID.4", 2021, null, "suv"], ["Jetta", 1981, null, "sedan"],
    ["Passat", 1990, 2022, "sedan"], ["Rabbit", 1981, 1984, "sedan"],
    ["Routan", 2009, 2014, "minivan"], ["Taos", 2022, null, "suv"],
    ["Tiguan", 2009, null, "suv"], ["Touareg", 2004, 2017, "suv"],
  ],
  Volvo: [
    ["240", 1981, 1993, "sedan"], ["850", 1993, 1997, "sedan"],
    ["C30", 2008, 2013, "sedan"], ["S40", 2000, 2011, "sedan"],
    ["S60", 2001, null, "sedan"], ["S70", 1998, 2000, "sedan"],
    ["S80", 1999, 2016, "sedan"], ["S90", 2017, null, "sedan"],
    ["V70", 1998, 2010, "suv"], ["XC40", 2019, null, "suv"],
    ["XC60", 2010, null, "suv"], ["XC70", 2003, 2016, "suv"],
    ["XC90", 2003, null, "suv"],
  ],
};

/** Every make in the catalog, alphabetically. */
export const MAKES: string[] = Object.keys(CATALOG).sort((a, b) => a.localeCompare(b));

function toModel(e: ModelEntry): Model {
  return { name: e[0], from: e[1], to: e[2], vehicleClass: e[3] };
}

/** Years offered in the Year dropdown, newest first. */
export function years(now = new Date()): number[] {
  const max = now.getFullYear() + 1;
  const out: number[] = [];
  for (let y = max; y >= EARLIEST_YEAR; y--) out.push(y);
  return out;
}

function producedIn(e: ModelEntry, year: number): boolean {
  return year >= e[1] && (e[2] === null || year <= e[2]);
}

/** Makes that sold at least one model in `year`. */
export function makesForYear(year: number): string[] {
  return MAKES.filter((make) => CATALOG[make].some((e) => producedIn(e, year)));
}

/**
 * Models a make sold in `year`, de-duplicated by name (a nameplate can appear
 * twice in the catalog across two separate production runs) and sorted.
 */
export function modelsFor(make: string, year: number): Model[] {
  const entries = CATALOG[make];
  if (!entries) return [];

  const seen = new Map<string, Model>();
  for (const e of entries) {
    if (producedIn(e, year) && !seen.has(e[0])) seen.set(e[0], toModel(e));
  }
  return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name));
}

/** Every model a make has ever sold, ignoring year. */
export function allModelsFor(make: string): Model[] {
  const entries = CATALOG[make];
  if (!entries) return [];

  const seen = new Map<string, Model>();
  for (const e of entries) if (!seen.has(e[0])) seen.set(e[0], toModel(e));
  return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function isVehicleClass(v: unknown): v is VehicleClass {
  return typeof v === "string" && (VEHICLE_CLASSES as string[]).includes(v);
}

/** Case/spacing-insensitive make match, so "mercedes benz" finds the catalog. */
export function canonicalMake(input: string): string | null {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const target = norm(input);
  return MAKES.find((m) => norm(m) === target) ?? null;
}

/** Look a model up in the catalog by make + name, optionally pinned to a year. */
export function findModel(make: string, model: string, year?: number): Model | null {
  const canonical = canonicalMake(make);
  if (!canonical) return null;

  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const target = norm(model);
  const candidates = CATALOG[canonical].filter((e) => norm(e[0]) === target);
  if (candidates.length === 0) return null;

  if (year !== undefined) {
    const inYear = candidates.find((e) => producedIn(e, year));
    if (inYear) return toModel(inYear);
  }
  return toModel(candidates[0]);
}

// ---------------------------------------------------------------------------
// Fallback classification
// ---------------------------------------------------------------------------

const MINIVAN_RE =
  /\b(odyssey|sienna|pacifica|carnival|sedona|grand\s?caravan|caravan|quest|town\s?&?\s?country|voyager|silhouette|montana|freestar|windstar|previa|villager|routan|uplander|venture|relay|mpv|minivan|mini.?van)\b/i;

const VAN_RE =
  /\b(sprinter|transit(?!\s?connect)|promaster|express|savana|astro|safari|metris|nv200|e.?[123]50|cargo\s?van|full.?size\s?van)\b/i;

const TRUCK_RE =
  /\b(f.?[123]50|silverado|sierra|ram\s?\d{4}|\bram\b|tundra|titan|tacoma|colorado|canyon|ranger|maverick|frontier|ridgeline|gladiator|cybertruck|santa\s?cruz|dakota|avalanche|s.?10|sonoma|b.?series|baja|mark\s?lt|pickup|truck|dually)\b/i;

const SUV_RE =
  /\b(cr.?v|rav.?4|rogue|murano|pathfinder|armada|tucson|santa\s?fe|palisade|sportage|sorento|telluride|cx.?[3459]0?|forester|outback|crosstrek|ascent|escape|edge|explorer|expedition|bronco|equinox|blazer|trailblazer|traverse|tahoe|suburban|yukon|escalade|compass|cherokee|wrangler|wagoneer|highlander|4.?runner|sequoia|land\s?cruiser|venza|rx|nx|gx|ux|lx|x[1357]|glb|glc|gle|gls|q[3578]|macan|cayenne|tiguan|taos|atlas|encore|envision|enclave|xc[469]0|model\s?[xy]|mach.?e|id\.?4|ev[69]|ioniq\s?5|kona|seltos|niro|hr.?v|passport|pilot|trax|range\s?rover|defender|discovery|outlander|eclipse\s?cross|aztek|vibe|vue|torrent|mariner|mountaineer|bravada|envoy|jimmy|rendezvous|rainier|aviator|nautilus|suv|crossover)\b/i;

/**
 * Best-effort vehicle class from a free-form "year make model" string.
 *
 * The catalog is consulted first — it is authoritative. The regexes below are
 * the fallback for vehicles the catalog doesn't carry (fleet trucks, imports,
 * anything older than 1981), carried over and widened from Revive Detail.
 */
export function classifyVehicle(vehicle: string): VehicleClass {
  const v = vehicle.trim();
  if (!v) return "sedan";

  // Try the catalog first: "<year> <make> <model...>".
  const m = v.match(/^(\d{4})?\s*(.*)$/);
  if (m) {
    const year = m[1] ? Number(m[1]) : undefined;
    const rest = m[2].trim();
    for (const make of MAKES) {
      const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (norm(rest).startsWith(norm(make))) {
        const modelPart = rest.slice(make.length).trim();
        const found = findModel(make, modelPart, year);
        if (found) return found.vehicleClass;
        break;
      }
    }
  }

  if (MINIVAN_RE.test(v)) return "minivan";
  if (VAN_RE.test(v)) return "van";
  if (TRUCK_RE.test(v)) return "truck";
  if (SUV_RE.test(v)) return "suv";
  return "sedan";
}
