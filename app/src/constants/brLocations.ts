export const BR_STATES = [
  { uf: 'AC', name: 'Acre' },
  { uf: 'AL', name: 'Alagoas' },
  { uf: 'AP', name: 'Amapá' },
  { uf: 'AM', name: 'Amazonas' },
  { uf: 'BA', name: 'Bahia' },
  { uf: 'CE', name: 'Ceará' },
  { uf: 'DF', name: 'Distrito Federal' },
  { uf: 'ES', name: 'Espírito Santo' },
  { uf: 'GO', name: 'Goiás' },
  { uf: 'MA', name: 'Maranhão' },
  { uf: 'MT', name: 'Mato Grosso' },
  { uf: 'MS', name: 'Mato Grosso do Sul' },
  { uf: 'MG', name: 'Minas Gerais' },
  { uf: 'PA', name: 'Pará' },
  { uf: 'PB', name: 'Paraíba' },
  { uf: 'PR', name: 'Paraná' },
  { uf: 'PE', name: 'Pernambuco' },
  { uf: 'PI', name: 'Piauí' },
  { uf: 'RJ', name: 'Rio de Janeiro' },
  { uf: 'RN', name: 'Rio Grande do Norte' },
  { uf: 'RS', name: 'Rio Grande do Sul' },
  { uf: 'RO', name: 'Rondônia' },
  { uf: 'RR', name: 'Roraima' },
  { uf: 'SC', name: 'Santa Catarina' },
  { uf: 'SP', name: 'São Paulo' },
  { uf: 'SE', name: 'Sergipe' },
  { uf: 'TO', name: 'Tocantins' },
];

export const BR_CITIES_BY_UF: Record<string, string[]> = {
  AC: ['Rio Branco', 'Cruzeiro do Sul', 'Sena Madureira'],
  AL: ['Maceió', 'Arapiraca', 'Palmeira dos Índios'],
  AP: ['Macapá', 'Santana', 'Laranjal do Jari'],
  AM: ['Manaus', 'Parintins', 'Itacoatiara'],
  BA: ['Salvador', 'Feira de Santana', 'Vitória da Conquista'],
  CE: ['Fortaleza', 'Caucaia', 'Juazeiro do Norte'],
  DF: ['Brasília', 'Taguatinga', 'Ceilândia'],
  ES: ['Vitória', 'Vila Velha', 'Serra'],
  GO: ['Goiânia', 'Aparecida de Goiânia', 'Anápolis'],
  MA: ['São Luís', 'Imperatriz', 'Caxias'],
  MT: ['Cuiabá', 'Várzea Grande', 'Rondonópolis'],
  MS: ['Campo Grande', 'Dourados', 'Três Lagoas'],
  MG: ['Belo Horizonte', 'Uberlândia', 'Contagem'],
  PA: ['Belém', 'Ananindeua', 'Santarém'],
  PB: ['João Pessoa', 'Campina Grande', 'Santa Rita'],
  PR: ['Curitiba', 'Londrina', 'Maringá'],
  PE: ['Recife', 'Jaboatão dos Guararapes', 'Olinda'],
  PI: ['Teresina', 'Parnaíba', 'Picos'],
  RJ: ['Rio de Janeiro', 'Niterói', 'Duque de Caxias'],
  RN: ['Natal', 'Mossoró', 'Parnamirim'],
  RS: ['Porto Alegre', 'Caxias do Sul', 'Pelotas'],
  RO: ['Porto Velho', 'Ji-Paraná', 'Ariquemes'],
  RR: ['Boa Vista', 'Rorainópolis', 'Caracaraí'],
  SC: ['Florianópolis', 'Joinville', 'Blumenau'],
  SP: ['São Paulo', 'Campinas', 'São José dos Campos'],
  SE: ['Aracaju', 'Nossa Senhora do Socorro', 'Lagarto'],
  TO: ['Palmas', 'Araguaína', 'Gurupi'],
};

const citiesCache = new Map<string, string[]>();

export async function getCitiesByUf(uf: string): Promise<string[]> {
  const normalizedUf = (uf || '').trim().toUpperCase();
  if (!normalizedUf) return [];
  if (citiesCache.has(normalizedUf)) return citiesCache.get(normalizedUf) || [];

  // Tenta carregar lista completa de municípios da UF pela API do IBGE.
  try {
    const state = BR_STATES.find((s) => s.uf === normalizedUf);
    if (!state) return [];
    const endpoint = `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${normalizedUf}/municipios?orderBy=nome`;
    const res = await fetch(endpoint);
    if (res.ok) {
      const data = (await res.json()) as Array<{ nome?: string }>;
      const names = data.map((item) => (item.nome || '').trim()).filter(Boolean);
      if (names.length > 0) {
        citiesCache.set(normalizedUf, names);
        return names;
      }
    }
  } catch {
    // fallback abaixo
  }

  // Fallback para lista local caso API externa não esteja disponível.
  const fallback = BR_CITIES_BY_UF[normalizedUf] || [];
  citiesCache.set(normalizedUf, fallback);
  return fallback;
}
