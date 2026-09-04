import type {
  AuthGateway,
  CertificateRepository,
  CourseRepository,
  ExamRepository,
  FileStorage,
  HomeworkRepository,
  LearningRepository,
  OrganizationRepository,
  ReportRepository,
  UserRepository,
} from '@/application/ports';
import { DemoAuthGateway } from '@/infrastructure/demo/repositories/demoAuthGateway';
import { DemoCertificateRepository } from '@/infrastructure/demo/repositories/demoCertificateRepository';
import { DemoCourseRepository } from '@/infrastructure/demo/repositories/demoCourseRepository';
import { DemoExamRepository } from '@/infrastructure/demo/repositories/demoExamRepository';
import { DemoFileStorage } from '@/infrastructure/demo/repositories/demoFileStorage';
import { DemoHomeworkRepository } from '@/infrastructure/demo/repositories/demoHomeworkRepository';
import { DemoLearningRepository } from '@/infrastructure/demo/repositories/demoLearningRepository';
import { DemoOrganizationRepository } from '@/infrastructure/demo/repositories/demoOrganizationRepository';
import { DemoReportRepository } from '@/infrastructure/demo/repositories/demoReportRepository';
import { DemoUserRepository } from '@/infrastructure/demo/repositories/demoUserRepository';

export function createDemoDependencies() {
  return {
    authGateway: new DemoAuthGateway(),
    userRepository: new DemoUserRepository(),
    courseRepository: new DemoCourseRepository(),
    learningRepository: new DemoLearningRepository(),
    examRepository: new DemoExamRepository(),
    homeworkRepository: new DemoHomeworkRepository(),
    organizationRepository: new DemoOrganizationRepository(),
    certificateRepository: new DemoCertificateRepository(),
    reportRepository: new DemoReportRepository(),
    fileStorage: new DemoFileStorage(),
  } satisfies {
    authGateway: AuthGateway;
    userRepository: UserRepository;
    courseRepository: CourseRepository;
    learningRepository: LearningRepository;
    examRepository: ExamRepository;
    homeworkRepository: HomeworkRepository;
    organizationRepository: OrganizationRepository;
    certificateRepository: CertificateRepository;
    reportRepository: ReportRepository;
    fileStorage: FileStorage;
  };
}
