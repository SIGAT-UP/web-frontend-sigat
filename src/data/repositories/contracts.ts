/**
 * CONTRATOS DE DATOS. Las pantallas solo conocen estas interfaces.
 * Para conectar el backend: implemente cada una con `fetch` y cámbielas en `src/data/services.ts`.
 */
import type {
  SessionUser, Farm, Lot, LotControl, Trap, FieldRecord, ReviewAction, ActivityItem, HistoryEntry, Planning, NewPlanningInput, Recipient,
  Application, Harvest, LotStatusSummary, AppNotification, ProducerCropLot, AppUser, NewUserInput, UpdateUserInput, UserFormOptions, DeletePreview, DeleteResult, AuditEntry, AdminOverview, InspectionProgram, TrapInput, LotInput, CatalogCard, TimelineItem,
} from '../models/types';

export interface AuthRepository {
  login(email: string, password: string, remember?: boolean): Promise<SessionUser>;   // lanza Error con mensaje para mostrar
  logout(): Promise<void>;
  current(): Promise<SessionUser | null>;
  /** Solicitud de restablecimiento: el administrador asigna la nueva clave. Responde igual exista o no la cuenta. */
  requestPasswordReset(identifier: string): Promise<void>;
  dataAsOf(): Promise<string>;                                    // fecha ISO de los datos más recientes recibidos
}

export interface LotRepository {
  farm(): Promise<Farm>;
  list(): Promise<Lot[]>;
  get(id: string): Promise<Lot>;
  control(id: string): Promise<LotControl>;
  traps(lotId?: string): Promise<Trap[]>;
  recentActivity(lotId: string): Promise<ActivityItem[]>;
  history(lotId: string): Promise<HistoryEntry[]>;
  createTrap(input: TrapInput): Promise<Trap>;               // código oficial único, formato Divipola-ruta-número y paridad RN-005
  updateTrap(code: string, input: Omit<TrapInput, 'code' | 'lotId' | 'type'>): Promise<Trap>;
  updateLot(id: string, input: LotInput): Promise<Lot>;
}

export interface ReviewRepository {
  list(): Promise<FieldRecord[]>;
  get(id: string): Promise<FieldRecord>;
  /** confirmar = acepta la VISITA completa (POST /revisiones/{visi_id}/aceptacion);
   *  corregir/rechazar = versión nueva de ESA lectura (POST /lecturas/{registro_id}/correcciones | /anulaciones). */
  resolve(id: string, action: ReviewAction): Promise<FieldRecord>;
}

export interface PlanningRepository {
  list(): Promise<Planning[]>;                                    // las del usuario en sesión (creadas o recibidas)
  get(id: string): Promise<Planning>;
  recipients(kind: 'productor' | 'tecnico'): Promise<Recipient[]>;
  create(input: NewPlanningInput): Promise<Planning>;
  respond(id: string, decision: 'Aceptada' | 'Rechazada', reason?: string): Promise<Planning>;
}

export interface ProducerRepository {
  cropLots(): Promise<ProducerCropLot[]>;
  lotStatus(lotId: string): Promise<LotStatusSummary>;
  applications(): Promise<Application[]>;
  registerApplication(a: Omit<Application, 'id' | 'lotLabel'>): Promise<Application>;
  harvests(): Promise<Harvest[]>;
  saveHarvest(h: { lotId: string; expectedDate?: string; expectedKg?: number; actualDate?: string; actualKg?: number }): Promise<Harvest>;
  history(): Promise<{ id: string; at: string; lotId: string; what: string; by: string; kind: 'Visitas del técnico' | 'Aplicaciones' | 'Cosecha'; origin: 'Inspección oficial' | 'Autoreporte' }[]>;
  timeline(): Promise<TimelineItem[]>;
}

export interface AdminRepository {
  overview(): Promise<AdminOverview>;
  users(): Promise<AppUser[]>;
  user(id: string): Promise<AppUser>;                              // GET /usuarios/{id}
  userFormOptions(): Promise<UserFormOptions>;                    // GET /catalogos/centro_acopio + /geografia/municipios
  createUser(i: NewUserInput): Promise<AppUser>;                   // POST /usuarios
  updateUser(id: string, i: UpdateUserInput): Promise<AppUser>;    // PATCH /usuarios/{id}
  deletePreview(id: string): Promise<DeletePreview>;               // GET /usuarios/{id}/eliminacion
  deleteUser(id: string, reason: string): Promise<DeleteResult>;   // POST /usuarios/{id}/eliminacion
  setUserActive(id: string, active: boolean): Promise<AppUser>;
  /** El administrador asigna una contraseña nueva y se la entrega él mismo a la persona (POST /usuarios/{id}/restablecimiento-contrasena). */
  assignPassword(id: string, newPassword: string): Promise<void>;
  audit(): Promise<AuditEntry[]>;
  farms(): Promise<Farm[]>;
  updateFarm(f: Farm): Promise<Farm>;
}

export interface ProgramRepository {
  get(): Promise<InspectionProgram>;
  saveNewVersion(p: InspectionProgram, since: string): Promise<InspectionProgram>;
  catalogs(): Promise<CatalogCard[]>;
  catalogItems(id: string): Promise<string[]>;
  saveCatalogItems(id: string, items: string[]): Promise<CatalogCard>;
}

export interface NotificationRepository {
  list(): Promise<AppNotification[]>;
  markRead(id: string): Promise<void>;
  markAllRead(): Promise<void>;
}
