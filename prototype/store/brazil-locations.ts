// Módulo de Localização & Distâncias para o Brasil (com foco no Espírito Santo e flexibilidade nacional)

export interface StateOption {
  uf: string;
  name: string;
}

export const BRAZIL_STATES: StateOption[] = [
  { uf: "ES", name: "Espírito Santo" },
  { uf: "RJ", name: "Rio de Janeiro" },
  { uf: "SP", name: "São Paulo" },
  { uf: "MG", name: "Minas Gerais" },
  { uf: "BA", name: "Bahia" },
  { uf: "PR", name: "Paraná" },
  { uf: "RS", name: "Rio Grande do Sul" },
  { uf: "SC", name: "Santa Catarina" },
  { uf: "GO", name: "Goiás" },
  { uf: "DF", name: "Distrito Federal" },
  { uf: "PE", name: "Pernambuco" },
  { uf: "CE", name: "Ceará" },
  { uf: "AL", name: "Alagoas" },
  { uf: "AM", name: "Amazonas" },
  { uf: "AP", name: "Amapá" },
  { uf: "MA", name: "Maranhão" },
  { uf: "MT", name: "Mato Grosso" },
  { uf: "MS", name: "Mato Grosso do Sul" },
  { uf: "PA", name: "Pará" },
  { uf: "PB", name: "Paraíba" },
  { uf: "PI", name: "Piauí" },
  { uf: "RN", name: "Rio Grande do Norte" },
  { uf: "RO", name: "Rondônia" },
  { uf: "RR", name: "Roraima" },
  { uf: "SE", name: "Sergipe" },
  { uf: "TO", name: "Tocantins" },
  { uf: "AC", name: "Acre" }
];

export const CITIES_BY_STATE: Record<string, string[]> = {
  ES: [
    "Vitória",
    "Vila Velha",
    "Serra",
    "Cariacica",
    "Guarapari",
    "Viana",
    "Cachoeiro de Itapemirim",
    "Linhares",
    "Colatina",
    "São Mateus",
    "Aracruz",
    "Marataízes",
    "Domingos Martins",
    "Nova Venécia",
    "Anchieta",
    "Itapemirim",
    "Santa Maria de Jetibá",
    "Castelo"
  ],
  RJ: ["Rio de Janeiro", "Niterói", "São Gonçalo", "Duque de Caxias", "Nova Iguaçu", "Petrópolis", "Campos dos Goytacazes", "Cabo Frio"],
  SP: ["São Paulo", "Campinas", "Santos", "São Bernardo do Campo", "Santo André", "Osasco", "Ribeirão Preto", "Sorocaba"],
  MG: ["Belo Horizonte", "Uberlândia", "Contagem", "Juiz de Fora", "Betim", "Montes Claros"],
  BA: ["Salvador", "Feira de Santana", "Vitória da Conquista", "Camaçari", "Itabuna"]
};

export const NEIGHBORHOODS_BY_CITY: Record<string, string[]> = {
  // Vitória
  "Vitória": [
    "Praia do Canto",
    "Jardim da Penha",
    "Jardim Camburi",
    "Mata da Praia",
    "Enseada do Suá",
    "Bento Ferreira",
    "Barro Vermelho",
    "Santa Lúcia",
    "Pontal de Camburi",
    "Centro",
    "Maruípe",
    "Goiabeiras",
    "República",
    "Ilha do Boi",
    "Ilha do Frade",
    "Praia do Suá",
    "Monte Belo",
    "Consolação"
  ],
  // Vila Velha
  "Vila Velha": [
    "Praia da Costa",
    "Itapuã",
    "Praia de Itaparica",
    "Glória",
    "Centro",
    "Coqueiral de Itaparica",
    "Gaivotas",
    "Santa Mônica",
    "Ibes",
    "Paul",
    "Soteco",
    "Cristóvão Colombo",
    "Cobilândia"
  ],
  // Serra
  "Serra": [
    "Parque Residencial Laranjeiras",
    "Laranjeiras",
    "Jacaraípe",
    "Manguinhos",
    "Valparaíso",
    "Colina de Laranjeiras",
    "Morada de Laranjeiras",
    "Porto Canoa",
    "Barcelona",
    "Serra Dourada",
    "Bairro de Fátima",
    "Novo Horizonte",
    "Serra Centro"
  ],
  // Cariacica
  "Cariacica": [
    "Campo Grande",
    "Jardim América",
    "Itacibá",
    "Alto Boa Vista",
    "Bela Aurora",
    "Vila Capixaba",
    "Tucum",
    "Porto de Santana"
  ],
  // Guarapari
  "Guarapari": [
    "Praia do Morro",
    "Centro",
    "Enseada Azul",
    "Meaípe",
    "Muquiçaba",
    "Ipiranga",
    "Setiba"
  ]
};

// Estimativa de distância e trânsito entre bairros/cidades (em km e minutos)
export function estimateDistanceBetweenLocations(
  fromNeighborhood: string,
  fromCity: string,
  toNeighborhood: string,
  toCity: string
): { distanceKm: number; transitMinutes: number } {
  const norm = (str: string) => (str || "").toLowerCase().trim();
  const fromN = norm(fromNeighborhood);
  const fromC = norm(fromCity);
  const toN = norm(toNeighborhood);
  const toC = norm(toCity);

  // Mesmo bairro e mesma cidade
  if (fromN && toN && fromN === toN && fromC === toC) {
    return { distanceKm: 1.5, transitMinutes: 6 };
  }

  // Mesma cidade, bairros diferentes
  if (fromC && toC && fromC === toC) {
    if (fromC.includes("vitória")) {
      // Ex: Praia do Canto -> Jardim Camburi: ~6.5 km
      if ((fromN.includes("canto") && toN.includes("camburi")) || (fromN.includes("camburi") && toN.includes("canto"))) {
        return { distanceKm: 6.8, transitMinutes: 18 };
      }
      // Ex: Praia do Canto -> Jardim da Penha: ~3.5 km
      if ((fromN.includes("canto") && toN.includes("penha")) || (fromN.includes("penha") && toN.includes("canto"))) {
        return { distanceKm: 3.2, transitMinutes: 10 };
      }
      return { distanceKm: 4.5, transitMinutes: 14 };
    }

    if (fromC.includes("velha")) {
      // Ex: Praia da Costa -> Itapuã: ~2.5 km
      if ((fromN.includes("costa") && toN.includes("itapu")) || (fromN.includes("itapu") && toN.includes("costa"))) {
        return { distanceKm: 2.8, transitMinutes: 8 };
      }
      return { distanceKm: 4.8, transitMinutes: 15 };
    }

    return { distanceKm: 5.5, transitMinutes: 16 };
  }

  // Cidades diferentes na Grande Vitória
  // Vitória <-> Vila Velha (Terceira Ponte / Segunda Ponte)
  if (
    (fromC.includes("vitória") && toC.includes("velha")) ||
    (fromC.includes("velha") && toC.includes("vitória"))
  ) {
    return { distanceKm: 8.5, transitMinutes: 22 };
  }

  // Vitória <-> Serra
  if (
    (fromC.includes("vitória") && toC.includes("serra")) ||
    (fromC.includes("serra") && toC.includes("vitória"))
  ) {
    return { distanceKm: 15.0, transitMinutes: 30 };
  }

  // Vitória <-> Cariacica
  if (
    (fromC.includes("vitória") && toC.includes("cariacica")) ||
    (fromC.includes("cariacica") && toC.includes("vitória"))
  ) {
    return { distanceKm: 12.0, transitMinutes: 26 };
  }

  // Vila Velha <-> Serra
  if (
    (fromC.includes("velha") && toC.includes("serra")) ||
    (fromC.includes("serra") && toC.includes("velha"))
  ) {
    return { distanceKm: 22.0, transitMinutes: 42 };
  }

  // Guarapari <-> Vitória / Vila Velha
  if (fromC.includes("guarapari") || toC.includes("guarapari")) {
    return { distanceKm: 52.0, transitMinutes: 65 };
  }

  // Fallback genérico para cidades distintas
  let hash = 0;
  const combined = `${fromC}_${fromN}_${toC}_${toN}`;
  for (let i = 0; i < combined.length; i++) hash = (hash << 5) - hash + combined.charCodeAt(i);
  const dist = 7.0 + (Math.abs(hash) % 25);
  const time = Math.round(dist * 2.2);

  return { distanceKm: Number(dist.toFixed(1)), transitMinutes: time };
}
