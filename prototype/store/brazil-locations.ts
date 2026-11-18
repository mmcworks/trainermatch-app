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

// Fallback estático com todos os 78 municípios do ES e principais cidades de cada UF
export const CITIES_BY_STATE: Record<string, string[]> = {
  ES: [
    "Afonso Cláudio", "Água Doce do Norte", "Águia Branca", "Alegre", "Alfredo Chaves",
    "Alto Rio Novo", "Anchieta", "Apiacá", "Aracruz", "Atilio Vivacqua",
    "Baixo Guandu", "Barra de São Francisco", "Boa Esperança", "Bom Jesus do Norte", "Brejetuba",
    "Cachoeiro de Itapemirim", "Cariacica", "Castelo", "Colatina", "Conceição da Barra",
    "Conceição do Castelo", "Divino de São Lourenço", "Domingos Martins", "Dores do Rio Preto", "Ecoporanga",
    "Fundão", "Governador Lindenberg", "Guaçuí", "Guarapari", "Ibatiba",
    "Ibiraçu", "Ibitirama", "Iconha", "Irupi", "Itaguaçu",
    "Itapemirim", "Itarana", "Iúna", "Jaguaré", "Jerônimo Monteiro",
    "João Neiva", "Laranja da Terra", "Linhares", "Mantenópolis", "Marataízes",
    "Marechal Floriano", "Marilândia", "Mimoso do Sul", "Montanha", "Mucurici",
    "Muniz Freire", "Muqui", "Nova Venécia", "Pancas", "Pedro Canário",
    "Pinheiros", "Piúma", "Ponto Belo", "Presidente Kennedy", "Rio Bananal",
    "Rio Novo do Sul", "Santa Leopoldina", "Santa Maria de Jetibá", "Santa Teresa", "São Domingos do Norte",
    "São Gabriel da Palha", "São José do Calçado", "São Mateus", "São Roque do Canaã", "Serra",
    "Sooretama", "Vargem Alta", "Venda Nova do Imigrante", "Viana", "Vila Pavão",
    "Vila Valério", "Vila Velha", "Vitória"
  ],
  RJ: ["Rio de Janeiro", "Niterói", "São Gonçalo", "Duque de Caxias", "Nova Iguaçu", "Petrópolis", "Campos dos Goytacazes", "Cabo Frio", "Volta Redonda", "Macaé", "Angra dos Reis", "Teresópolis", "Resende", "Nova Friburgo"],
  SP: ["São Paulo", "Campinas", "Santos", "São Bernardo do Campo", "Santo André", "Osasco", "Ribeirão Preto", "Sorocaba", "São José dos Campos", "Guarulhos", "Piracicaba", "Bauru", "Jundiaí", "Franca", "Praia Grande"],
  MG: ["Belo Horizonte", "Uberlândia", "Contagem", "Juiz de Fora", "Betim", "Montes Claros", "Uberaba", "Governador Valadares", "Ipatinga", "Sete Lagoas", "Divinópolis", "Poços de Caldas"],
  BA: ["Salvador", "Feira de Santana", "Vitória da Conquista", "Camaçari", "Itabuna", "Juazeiro", "Lauro de Freitas", "Ilhéus", "Jequié", "Teixeira de Freitas", "Porto Seguro"],
  PR: ["Curitiba", "Londrina", "Maringá", "Ponta Grossa", "Cascavel", "São José dos Pinhais", "Foz do Iguaçu", "Colombo", "Guarapuava", "Paranaguá"],
  RS: ["Porto Alegre", "Caxias do Sul", "Canoas", "Pelotas", "Santa Maria", "Gravataí", "Viamão", "Novo Hamburgo", "São Leopoldo", "Rio Grande", "Passo Fundo"],
  SC: ["Florianópolis", "Joinville", "Blumenau", "São José", "Chapecó", "Itajaí", "Criciúma", "Jaraguá do Sul", "Palhoça", "Balneário Camboriú", "Brusque"],
  GO: ["Goiânia", "Aparecida de Goiânia", "Anápolis", "Rio Verde", "Luziânia", "Águas Lindas de Goiás", "Valparaíso de Goiás", "Trindade", "Formosa", "Itumbiara"],
  DF: ["Brasília", "Taguatinga", "Ceilândia", "Águas Claras", "Guará", "Samambaia", "Sobradinho", "Planaltina"],
  PE: ["Recife", "Jaboatão dos Guararapes", "Olinda", "Caruaru", "Petrolina", "Paulista", "Cabo de Santo Agostinho", "Camaragibe", "Garanhuns", "Vitória de Santo Antão"],
  CE: ["Fortaleza", "Caucaia", "Juazeiro do Norte", "Maracanaú", "Sobral", "Crato", "Itapipoca", "Maranguape", "Iguatu"],
  AL: ["Maceió", "Arapiraca", "Rio Largo", "Palmeira dos Índios", "União dos Palmares", "Penedo"],
  AM: ["Manaus", "Parintins", "Itacoatiara", "Manacapuru", "Coari", "Tabatinga"],
  AP: ["Macapá", "Santana", "Laranjal do Jari", "Oiapoque"],
  MA: ["São Luís", "Imperatriz", "São José de Ribamar", "Timon", "Caxias", "Codó", "Paço do Lumiar"],
  MT: ["Cuiabá", "Várzea Grande", "Rondonópolis", "Sinop", "Tangará da Serra", "Sorriso"],
  MS: ["Campo Grande", "Dourados", "Três Lagoas", "Corumbá", "Ponta Porã"],
  PA: ["Belém", "Ananindeua", "Santarém", "Marabá", "Parauapebas", "Castanhal"],
  PB: ["João Pessoa", "Campina Grande", "Santa Rita", "Patos", "Bayeux", "Sousa"],
  PI: ["Teresina", "Parnaíba", "Picos", "Piripiri", "Floriano"],
  RN: ["Natal", "Mossoró", "Parnamirim", "São Gonçalo do Amarante", "Ceará-Mirim", "Caicó"],
  RO: ["Porto Velho", "Ji-Paraná", "Ariquemes", "Vilhena", "Cacoal"],
  RR: ["Boa Vista", "Rorainópolis", "Caracaraí"],
  SE: ["Aracaju", "Nossa Senhora do Socorro", "Lagarto", "Itabaiana", "São Cristóvão", "Estância"],
  TO: ["Palmas", "Araguaína", "Gurupi", "Porto Nacional", "Paraíso do Tocantins"],
  AC: ["Rio Branco", "Cruzeiro do Sul", "Sena Madureira", "Tarauacá", "Feijó"]
};

// Cache em memória para requisições dinâmicas da API do IBGE
const ibgeCityCache: Record<string, string[]> = {};

/**
 * Carrega a lista completa de cidades para a UF selecionada.
 * Utiliza o cache local / fallback estático e enriquece dinamicamente com a API pública do IBGE.
 */
export async function fetchCitiesForUf(uf: string): Promise<string[]> {
  const cleanUf = (uf || "").toUpperCase().trim();
  if (!cleanUf) return [];

  // Se já tiver em cache na memória da sessão
  if (ibgeCityCache[cleanUf] && ibgeCityCache[cleanUf].length > 0) {
    return ibgeCityCache[cleanUf];
  }

  // Cidades do fallback estático inicial
  const fallback = CITIES_BY_STATE[cleanUf] || [];

  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const res = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${cleanUf}/municipios`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const cityNames = data
          .map((item: { nome?: string }) => item.nome || "")
          .filter(Boolean)
          .sort((a, b) => a.localeCompare(b, "pt-BR"));

        ibgeCityCache[cleanUf] = cityNames;
        return cityNames;
      }
    }
  } catch {
    // Em caso de falha de rede/offline, retorna o fallback estático
  }

  ibgeCityCache[cleanUf] = fallback;
  return fallback;
}

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
