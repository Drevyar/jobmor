import type { VerificationQueueItem, ReportQueueItem } from '../types/moderation';

export const MOCK_VERIFICATIONS: VerificationQueueItem[] = [
  {
    id: 'ver-01',
    studentName: 'สมชาย ใจดี',
    studentId: '653020012-3',
    faculty: 'วิศวกรรมศาสตร์ ศรีราชา',
    universityEmail: 'somchai.ja@ku.th',
    submittedAt: '2026-09-21T10:30:00Z',
    status: 'pending',
  },
  {
    id: 'ver-02',
    studentName: 'กนกวรรณ สุขเสริฐ',
    studentId: '643030114-1',
    faculty: 'วิทยาการจัดการ',
    universityEmail: 'kanokwan.su@ku.th',
    submittedAt: '2026-09-21T09:15:00Z',
    status: 'pending',
  },
  {
    id: 'ver-03',
    studentName: 'ธนกฤต วิเศษศิลป์',
    studentId: '663010450-8',
    faculty: 'พาณิชยนาวีนานาชาติ',
    universityEmail: 'thanakrit.v@ku.th',
    submittedAt: '2026-09-20T16:45:00Z',
    status: 'pending',
  },
];

export const MOCK_REPORTS: ReportQueueItem[] = [
  {
    id: 'rep-01',
    reporterName: 'ร้านกาแฟ KU Corner',
    targetType: 'user',
    targetName: 'นิสิตทดลองงาน A',
    reason: 'ไม่มาทำงานตามนัดหมายโดยไม่แจ้งล่วงหน้า',
    createdAt: '2026-09-21T14:20:00Z',
    status: 'pending',
  },
  {
    id: 'rep-02',
    reporterName: 'นิสิต มก. ศรีราชา',
    targetType: 'job',
    targetName: 'พนักงานแจกใบโบร์ชัวร์รายวัน',
    reason: 'รายละเอียดค่าจ้างไม่ตรงตามที่ประกาศไว้',
    createdAt: '2026-09-20T11:00:00Z',
    status: 'pending',
  },
];
