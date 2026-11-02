/**
 * MODELOS DE DOMINIO (lo que consumen las pantallas).
 * El backend `sigat-durazno-api` responde con estas formas (los repositorios HTTP pueden adaptar
 * diferencias puntuales en `data/http/repositories.ts`); las pantallas no cambian.
 */
export type Role = 'AGRONOMO' | 'ADMIN' | 'PRODUCTOR';

export interface SessionUser {
  id: string;
  name: string;
  initials: string;
  role: Role;
  roleLabel: string;
  email: string;
  farmLabel?: string; // productor: "Productora · <predio> · durazno"
}

export interface Farm { id: string; name: string; extensionHa: number | null; lotCount: number | null; code?: string | null; municipality?: string | null; department?: string | null; responsible?: string | null }

export type LotCoverage = 'completo' | 'parcial' | 'sin_visitar';
export type TrappingScenario = 'Área infestada' | 'Supresión' | 'Erradicación' | 'Exclusión' | 'Sin revisar';

export interface Lot {
  id: string;
  name: string;            // "Lote 2 · Centro"
  shortName: string;       // "Centro"
  farmId: string;
  owner: string;
  crop: string;
  areaHa: number;
  scenario: TrappingScenario;
  status: string;          // "Vigilancia activa"
  trapCodes: [string, string];  // ["54518-602-001","54518-602-004"]
  trapsTotal: number;
  trapsRead: number;       // trampas leídas en el período
  lastVisit: string | null;
  lastSync: string | null;
  technician: string | null;
  unverified: number;      // registros sin verificar
  needsReview: number;
  coverage: LotCoverage;
  /** polígono esquemático del mapa (porcentajes) */
  shape: { x: number; y: number; w: number; h: number };
}

export interface MtdPoint { label: string; value: number }
export interface LotControl {
  lotId: string;
  mtd: number | null;
  mtdPeriod: string;
  exportThreshold: string | null; // null => "Sin definir"
  aptitudeConcept: string;        // "No emitido"
  scenario: TrappingScenario;
  scenarioLimit: number;
  series: MtdPoint[];
  /** Indicadores del período (opcionales: si el backend no los envía se muestran como «—»). */
  periodReadings?: number | null;
  specimens?: number | null;
  activeFindings?: number | null;
  /** Datos del cultivo para el resumen. */
  phenologicalStage?: string | null;
  expectedHarvest?: string | null;   // fecha ISO
  expectedKg?: number | null;
  actualKg?: number | null;
  bpaStatus?: string | null;         // estado del checklist de buenas prácticas
}

export type TrapStatus = 'Activa' | 'Inactiva' | 'En mantenimiento';
export type TrapConfig = 'Correcta' | 'Revisar';
export interface Trap {
  code: string; lotId: string; status: TrapStatus; lastReadingCaptures: number;
  observedAt: string; config: TrapConfig; sync: 'Sincronizada' | 'Revisar'; read: boolean;
  attractant?: string; type?: 'Jackson' | 'McPhail';
  x: number; y: number; // posición esquemática en el mapa (porcentaje dentro del lote)
}

export type ReviewState = 'Sin verificar' | 'Confirmado' | 'Corregido' | 'Rechazado' | 'Autoreporte';
export type RecordType = 'Inspección' | 'Aplicación' | 'Cosecha' | 'Corrección';
export interface FieldRecord {
  /** Visita (inspección) a la que pertenece la lectura: la BD acepta la revisión sobre la VISITA. */
  visitId?: string;
  id: string; observedAt: string; type: RecordType; detail: string; lotId: string | null; lotLabel: string;
  user: 'Técnico' | 'Productor' | 'Agrónomo'; state: ReviewState;
  trapCode?: string; captures?: number; warning?: string; reviewReason?: string;
  /** Nombre de quien registró la lectura y estado de la trampa al momento de la lectura. */
  userName?: string; trapStatus?: TrapStatus;
  receivedAt?: string; versions: { v: number; label: string; captures?: number; at: string; reason?: string }[];
}
export type ReviewAction = { kind: 'confirmar' } | { kind: 'corregir'; captures: number; reason: string } | { kind: 'rechazar'; reason: string };

export type ActivityKind = 'sync' | 'visit' | 'reading' | 'application';
export interface ActivityItem { kind: ActivityKind; text: string; at: string }

export interface HistoryEntry { id: string; type: RecordType; at: string; user: 'Técnico' | 'Productor' | 'Agrónomo'; lotId: string; detail: string }

export type PlanningStatus = 'Pendiente' | 'Aceptada' | 'Rechazada' | 'Completada';
export type PlanningKind = 'productor' | 'tecnico';
export interface Planning {
  id: string; kind: PlanningKind; activity: string; date: string; dateEnd?: string; schedule?: string;
  recipientId: string; recipientName: string; recipientRole: 'productor' | 'técnico';
  createdById: string; createdByName: string; status: PlanningStatus;
  rejectionReason?: string; respondedAt?: string; lotIds: string[]; document?: { name: string; size: string }; observations?: string;
}
export interface NewPlanningInput { kind: PlanningKind; recipientId: string; date: string; dateEnd?: string; lotIds: string[]; activity?: string; documentName?: string; observations?: string; document?: File }
export interface Recipient { id: string; name: string; subtitle: string }

export interface Application { id: string; lotId: string; lotLabel: string; at: string; product: string; dose: string; areaHa?: number; responsible?: string; note?: string }
export interface Harvest { lotId: string; lotLabel: string; expectedDate?: string; expectedKg?: number; actualDate?: string; actualKg?: number; source: 'Autoreporte' }
export interface TimelineItem { at: string; title: string; subtitle: string; badge: 'Inspección oficial' | 'Autoreporte' }

export interface LotStatusSummary {
  lot: Lot; situation: string; situationNote: string; mtd: number; mtdNote: string; concept: string; conceptNote: string;
  stage: string; stageNote: string; lastApplication: string; lastApplicationNote: string; harvest: string; harvestNote: string;
  findings: string; findingsNote: string; timeline: TimelineItem[];
}

export interface ProducerCropLot { lot: Lot; mtd: number | null; trapRange: string; lastVisit: string; lastApplication: string; expectedHarvest: string }

export type UserRole = 'Agrónomo' | 'Productor' | 'Técnico' | 'Administrador';
/** Fila de `v_usuario_admin` (BD v9) traducida a la pantalla. */
export interface AppUser {
  id: string; cedula: string; firstName: string; lastName: string; name: string; initials: string; email: string; phone?: string; address?: string;
  username: string; role: UserRole; access: string; active: boolean; note?: string;
  /** La persona debe cambiar su contraseña al entrar (contraseña temporal o asignada por el administrador). */
  mustChangePassword?: boolean; lastAccess?: string | null;
  /** Centro de acopio (técnico y administrador) y municipio (productor): filas que exige la BD por rol. */
  centerId?: string; municipalityId?: string;
}
export interface NewUserInput {
  cedula: string; firstName: string; lastName: string; email: string; phone?: string; address?: string;
  /** Contraseña temporal. Vacía = la cuenta queda sin contraseña hasta que el administrador le asigne una. */
  username: string; password: string; role: UserRole; centerId?: string; municipalityId?: string;
}
/** Edición (PATCH): solo viajan los campos que cambian. */
export type UpdateUserInput = Partial<Omit<NewUserInput, 'password'>>;
export interface Option { id: string; label: string }
export interface UserFormOptions { centers: Option[]; municipalities: Option[] }
/** Antes de eliminar: la BD decide si borra (sin actividad) o da de baja (con actividad). */
export interface DeletePreview { hasActivity: boolean; outcome: 'eliminado' | 'dado_de_baja'; explanation: string }
export interface DeleteResult { outcome: 'eliminado' | 'dado_de_baja'; message: string }
export interface AuditEntry { at: string; user: string; action: string; entity: string; type: 'Usuarios' | 'Predio' | 'Sistema' | 'Registros' | 'Trampas' | 'Configuración' }
export interface AdminOverview {
  activeUsers: number; roles: number; traps: number; farms: number;
  system: { label: string; value: string; tone: 'ok' | 'warn' }[];
  recent: { text: string; meta: string }[];
  pending: { title: string; note: string; highlight?: boolean }[];
}

export interface InspectionProgram {
  farm: string; version: number; since: string; readingPeriodDays: number; inspectionCycle: string; verification: string;
  resolution: string; imageProvider: string; scenarios: { name: string; from: string; to: string }[]; exportThreshold: string;
  history: string;
}
export interface TrapInput { code: string; type: 'Jackson' | 'McPhail'; lotId: string; status: TrapStatus; attractant: string; config: TrapConfig }
export interface LotInput { owner: string; crop: string; areaHa: number; status: string }
export interface CatalogCard { id: string; title: string; summary: string; detail?: string; mode: 'Editable' | 'Solo lectura'; action: string }
export interface SummaryData { lot: Lot; control: LotControl; kpis: { label: string; value: string; note?: string }[]; stats: { label: string; value: string }[] }

export interface AppNotification { id: string; title: string; body: string; at: string; read: boolean; to?: string }
