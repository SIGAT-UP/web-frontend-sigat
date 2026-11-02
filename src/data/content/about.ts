/**
 * Contenido de «Sobre nosotros» (pantalla de inicio de sesión).
 * ⚠️ Texto de ejemplo: reemplaza nombres, cargos, descripciones y contacto por los reales.
 * Cuando exista backend/CMS, este archivo se sustituye por una llamada a la API.
 */
export interface TeamMember { name: string; role: string; bio: string; skills: string[]; initials: string }

export const ABOUT = {
  company: 'Equipo SIGAT',
  tagline: 'Tecnología para cuidar el durazno colombiano',
  intro: 'Somos un equipo de desarrollo de software que construye SIGAT, el Sistema de Información para la Vigilancia de Durazno: una herramienta que conecta a técnicos, agrónomos, productores y administradores para vigilar plagas, registrar lo que pasa en campo y tomar decisiones a tiempo.',
  pillars: [
    { title: 'Misión', text: 'Facilitar la vigilancia fitosanitaria del durazno con información confiable, trazable y disponible en campo y en oficina.' },
    { title: 'Visión', text: 'Ser la plataforma de referencia para el monitoreo de plagas en frutales de Colombia, con datos abiertos a quien los necesita.' },
    { title: 'Valores', text: 'Rigor con los datos, sencillez de uso, trabajo cercano con el campo y transparencia en cada registro.' },
  ],
  team: [
    { name: 'Nombre Apellido', initials: 'NA', role: 'Líder de proyecto · Arquitectura', bio: 'Define la arquitectura del sistema y coordina el trabajo entre la app móvil, la web y la base de datos.', skills: ['Arquitectura', 'Base de datos', 'Gestión'] },
    { name: 'Nombre Apellido', initials: 'NA', role: 'Desarrollo web y diseño de interfaz', bio: 'Construye la aplicación web en React y cuida que cada pantalla sea clara para agrónomos y productores.', skills: ['React', 'Tailwind', 'UX/UI'] },
    { name: 'Nombre Apellido', initials: 'NA', role: 'Desarrollo móvil y backend', bio: 'Desarrolla la app de campo para técnicos y los servicios que sincronizan los registros con el servidor.', skills: ['Flutter', 'API', 'Sincronización'] },
  ] as TeamMember[],
  contact: { email: 'contacto@sigat.co', location: 'Colombia' },
};
