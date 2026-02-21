/**
 * Lista completa de habilidades (inspirada em 99freelas.com.br)
 * Usada em EditProfile (adicionar habilidades) e NewProject (skills do projeto)
 */

export const ALL_SKILLS: string[] = [
  // Web, Mobile & Software
  '.NET Compact Framework', '.NET Framework', '.NET para Web', '.NET Remoting',
  '1ShoppingCart', '3DS Max', 'A/B Testing', 'Adobe After Effects',
  'Adobe Illustrator', 'Adobe Photoshop', 'Adobe Premiere', 'Angular',
  'API REST', 'AWS', 'Azure', 'Bootstrap', 'C#', 'C++', 'CSS3',
  'Django', 'Docker', 'Figma', 'Flutter', 'Git', 'HTML5', 'Java',
  'JavaScript', 'jQuery', 'Kotlin', 'Kubernetes', 'Laravel', 'MongoDB',
  'MySQL', 'Node.js', 'PHP', 'PostgreSQL', 'Python', 'React', 'React Native',
  'Redis', 'Ruby on Rails', 'Rust', 'SASS', 'Scala', 'Spring Boot',
  'SQL Server', 'Swift', 'TypeScript', 'Vue.js', 'WordPress', 'Xamarin',
  'Android', 'iOS', 'Firebase', 'GraphQL', 'Next.js', 'Nuxt.js', 'Tailwind CSS',
  'Electron', 'Ionic', 'Cordova', 'Webpack', 'Vite', 'Gulp',
  // Design & Criação
  'Design Gráfico', 'Design de Logotipos', 'Identidade Visual', 'Branding',
  'Corel Draw', 'Design 3D', 'Blender 3D', 'Arte-Final', 'Diagramação',
  'Design de Cartão de Visita', 'Comunicação Visual', 'Motion Graphics',
  'Criação de Personagens', 'Ilustração', 'Edição de Vídeo', 'Edição de Áudio',
  'Criação de Campanhas', 'UX Design', 'UI Design', 'Design de Embalagens',
  'InDesign', 'Canva', 'Sketch', 'Adobe XD', 'Prototipagem',
  // Escrita & Conteúdo
  'Redação', 'Copywriting', 'Revisão de Textos', 'Tradução', 'Transcrição',
  'SEO', 'Content Marketing', 'Produção de Conteúdo', 'Blog', 'E-books',
  'Roteiro', 'Legendagem', 'Revisão Gramatical',
  // Vendas & Marketing
  'Marketing Digital', 'Tráfego Pago', 'Google Ads', 'Facebook Ads', 'Meta Ads',
  'E-mail Marketing', 'Social Media', 'Inbound Marketing', 'SEO (Search Engine Optimization)',
  'Landing Page', 'Analytics', 'Google Analytics',   'Remarketing',
  'Planejamento de Mídia', 'Gestão de Tráfego',
  // Fotografia & Audiovisual
  'Fotografia', 'Vídeo', 'Sony Vegas', 'Final Cut',
  'Fotografia de Produto', 'Vídeo Institucional', 'Motion', 'Animação',
  // Administração & Suporte
  'Excel', 'PowerPoint', 'Word', 'Planilhas', 'Apresentações',
  'Atendimento ao Cliente', 'Suporte', 'Virtual Assistant', 'Assistente Virtual',
  'Contabilidade', 'Administração', 'Organização de Eventos',
  // Engenharia & Arquitetura
  'AutoCAD', 'Revit', 'SketchUp', 'Projetos Arquitetônicos', 'Engenharia',
  'Desenho Técnico', 'Maquetes', 'Renderização 3D',
  // Educação & Consultoria
  'Consultoria', 'Mentoria', 'Treinamento', 'Aulas Online', 'EAD',
  'Pesquisa', 'Análise de Dados',
  // Outros
  'Digitação', 'Transcrição de Áudio', 'Formatação', 'PDF',
  'Leitura de Imagem', 'OCR', 'Scraping', 'Automação'
];

/** Remove duplicatas e ordena alfabeticamente */
export function getSortedSkills(): string[] {
  return [...new Set(ALL_SKILLS)].sort((a, b) => a.localeCompare(b, 'pt-BR'));
}
