/**
 * PUNTO ÚNICO DE CONEXIÓN. Cada servicio apunta a su implementación HTTP contra `sigat-durazno-api`
 * (`data/http`). Las pantallas solo conocen las interfaces de `repositories/contracts.ts`.
 */
import type { AuthRepository, LotRepository, ReviewRepository, PlanningRepository, ProducerRepository, AdminRepository, ProgramRepository, NotificationRepository } from './repositories/contracts';
import { httpAuth, httpLots, httpReviews, httpPlanning, httpProducer, httpAdmin, httpProgram, httpNotifications } from './http/repositories';

export const services: {
  auth: AuthRepository; lots: LotRepository; reviews: ReviewRepository; planning: PlanningRepository;
  producer: ProducerRepository; admin: AdminRepository; program: ProgramRepository; notifications: NotificationRepository;
} = { auth: httpAuth, lots: httpLots, reviews: httpReviews, planning: httpPlanning, producer: httpProducer, admin: httpAdmin, program: httpProgram, notifications: httpNotifications };
