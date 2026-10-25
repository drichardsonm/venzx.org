// Subset of Venezuela's political-administrative division (Estado -> Municipio -> Parroquia).
export type Geo = Record<string, Record<string, string[]>>;

export const VENEZUELA: Geo = {
  Amazonas: { Atures: ["Fernando Girón Tovar", "Luis Alberto Gómez"], Autana: ["Isla Ratón", "Samariapo"] },
  Anzoátegui: { "Simón Bolívar": ["El Carmen", "San Cristóbal"], Sotillo: ["Puerto La Cruz", "Pozuelos"] },
  Apure: { "San Fernando": ["San Fernando", "El Recreo"], Achaguas: ["Achaguas", "Apurito"] },
  Aragua: { Girardot: ["Las Delicias", "Madre María de San José"], "Santiago Mariño": ["Turmero", "Samán de Güere"] },
  Barinas: { Barinas: ["Barinas", "Alto Barinas"], Bolívar: ["Barinitas", "Calderas"] },
  Bolívar: { Caroní: ["Cachamay", "Unare", "Vista al Sol"], Heres: ["Catedral", "Agua Salada"] },
  Carabobo: { Valencia: ["San José", "Catedral", "Rafael Urdaneta"], "Puerto Cabello": ["Juan José Flores", "Fraternidad"] },
  Cojedes: { "Ezequiel Zamora": ["San Carlos de Austria", "Juan Ángel Bravo"], Tinaquillo: ["Tinaquillo"] },
  "Delta Amacuro": { Tucupita: ["San José", "Leonardo Ruiz Pineda"], "Antonio Díaz": ["Curiapo"] },
  "Distrito Capital": { Libertador: ["Catedral", "El Recreo", "Petare", "Sucre", "23 de Enero"] },
  Falcón: { Miranda: ["San Antonio", "Santa Ana"], Carirubana: ["Punto Fijo", "Carirubana"] },
  Guárico: { "Juan Germán Roscio": ["San Juan de los Morros", "Parapara"], Infante: ["Valle de la Pascua"] },
  "La Guaira": { Vargas: ["Maiquetía", "Catia La Mar", "Macuto"] },
  Lara: { Iribarren: ["Catedral", "Concepción", "Juan de Villegas"], Palavecino: ["Cabudare", "José Gregorio Bastidas"] },
  Mérida: { Libertador: ["El Llano", "Milla", "Arias"], "Alberto Adriani": ["El Vigía", "Presidente Páez"] },
  Miranda: { Sucre: ["Petare", "Leoncio Martínez"], Chacao: ["Chacao"], Baruta: ["Baruta", "El Cafetal"] },
  Monagas: { Maturín: ["San Simón", "Alto de Los Godos", "Boquerón"], Piar: ["Aragua de Maturín"] },
  "Nueva Esparta": { Mariño: ["Porlamar"], Arismendi: ["La Asunción"] },
  Portuguesa: { Guanare: ["Guanare", "Córdoba"], Páez: ["Acarigua"] },
  Sucre: { Sucre: ["Altagracia", "Santa Inés"], Bermúdez: ["Carúpano"] },
  Táchira: { "San Cristóbal": ["La Concordia", "Pedro María Morantes", "San Juan Bautista"], "Pedro María Ureña": ["Ureña"], Bolívar: ["San Antonio del Táchira"] },
  Trujillo: { Trujillo: ["Matriz", "Chiquinquirá"], Valera: ["Mercedes Díaz", "Juan Ignacio Montilla"] },
  Yaracuy: { "San Felipe": ["San Felipe", "Albarico"], Nirgua: ["Nirgua"] },
  Zulia: { Maracaibo: ["Olegario Villalobos", "Coquivacoa", "Chiquinquirá", "Bolívar"], "San Francisco": ["San Francisco", "Domitila Flores"], Cabimas: ["Ambrosio", "La Rosa"] },
};

export const ESTADOS = Object.keys(VENEZUELA).sort((a, b) => a.localeCompare(b));

// Tile-map layout (col,row) approximating geography.
export const TILES: Record<string, [number, number, string]> = {
  Falcón: [2, 0, "FAL"], "La Guaira": [5, 0, "LGU"], "Nueva Esparta": [8, 0, "NES"],
  Zulia: [0, 1, "ZUL"], Lara: [2, 1, "LAR"], Yaracuy: [3, 1, "YAR"], Carabobo: [4, 1, "CAR"],
  Aragua: [5, 1, "ARA"], "Distrito Capital": [6, 1, "DC"], Miranda: [7, 1, "MIR"], Sucre: [8, 1, "SUC"],
  Trujillo: [1, 2, "TRU"], Portuguesa: [2, 2, "POR"], Cojedes: [3, 2, "COJ"], Guárico: [5, 2, "GUA"],
  Anzoátegui: [7, 2, "ANZ"], Monagas: [8, 2, "MON"],
  Mérida: [1, 3, "MER"], Barinas: [2, 3, "BAR"], "Delta Amacuro": [9, 2, "DEL"],
  Táchira: [0, 3, "TAC"], Apure: [3, 3, "APU"], Bolívar: [7, 3, "BOL"], Amazonas: [5, 4, "AMA"],
};

export const GENEROS = ["Hombre", "Mujer", "Venezx"];
export const EDADES = ["13-18", "19-25", "26-40", "41-60", "+61"];
export const INTERESES = ["Economía", "Salud", "Servicios", "Educación", "Tecnología"];
export const CATEGORIAS = ["Economía", "Salud", "Servicios", "Educación", "Tecnología", "Seguridad", "Ambiente", "General"];
export const INTENCIONES = ["Quiero", "Me gusta", "No me gusta"] as const;
