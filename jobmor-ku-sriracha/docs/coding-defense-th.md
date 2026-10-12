# คู่มือชี้โค้ดสำหรับตอบคำถามอาจารย์

เส้นทางหลักของข้อมูลคือ **ช่องกรอก/ปุ่ม → state ในหน้าจอ → service → Supabase API → ฐานข้อมูล → ผลลัพธ์กลับเข้า state → แสดงผล** คอมเมนต์ภาษาไทยที่เพิ่มในไฟล์ชี้จุดรับข้อมูล จุดส่ง และปลายทางตามเส้นทางนี้

## ฐานข้อมูลเชื่อมตรงไหน

เปิด `src/lib/supabase.ts` แล้วชี้ `createClient<Database>(supabaseUrl, supabasePublishableKey, ...)` ซึ่งสร้าง client กลาง อ่านค่าจาก `EXPO_PUBLIC_SUPABASE_URL` และ `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` ดูชื่อค่าที่ต้องตั้งใน `.env.example` ได้

คำตอบตัวอย่าง: “แอปติดต่อ Supabase ผ่าน API ด้วย client ตัวนี้ ทุก service import ไปใช้งาน ส่วนข้อมูลเก็บใน PostgreSQL ฝั่ง Supabase ไม่ได้เชื่อม PostgreSQL โดยตรงจากมือถือ”

## ถ้ารับข้อมูลมาแล้ว ส่งไปไหน

| สิ่งที่ผู้ใช้ทำ | จุดรับ/เรียกในหน้าจอ | ตัวส่งข้อมูล | ปลายทาง |
| --- | --- | --- | --- |
| สมัครบัญชี | `src/features/auth/register-form.tsx`: `submit`, `registerAccount(form)` | `src/features/auth/auth-service.ts`: `registerAccount` | Supabase Auth `signUp` → `auth.users` → trigger สร้าง `profiles` และ `employer_profiles` สำหรับนายจ้าง |
| เข้าสู่ระบบ | `src/features/auth/login-form.tsx`: `submit` | `auth-service.ts`: `loginAccount` | Auth `signInWithPassword` → session → `AuthProvider` |
| สร้าง/แก้ประกาศงาน | `src/features/employer/job-form-screen.tsx`: `change`, `submit` | `src/features/employer/employer-service.ts`: `saveJob` | INSERT/UPDATE `jobs` |
| สมัครงาน | `src/features/student/job-card.tsx`: `run('apply')` | `src/features/student/student-service.ts`: `applyForJob` | INSERT `applications` ด้วย `job_id` และ `applicant_id` |
| ถอนใบสมัคร | `job-card.tsx`: `run('withdraw')` | `student-service.ts`: `withdrawApplication` | DELETE `applications` ของตนเองที่ยัง `pending` |
| บันทึก/เลิกบันทึกงาน | `job-card.tsx`: `run('save')` | `student-service.ts`: `setJobSaved` | INSERT/DELETE `saved_jobs` |
| แก้โปรไฟล์นิสิต | `src/features/student/profile-form.tsx`: `save` | `student-service.ts`: `updateStudentProfile` | UPDATE `profiles` |
| รายงานประกาศงาน | `src/features/student/report-job-form.tsx`: `submit` | `student-service.ts`: `submitJobReport` | INSERT `reports` → แอดมินอ่านด้วย `loadAdminReports` |
| รับ/ปฏิเสธผู้สมัคร | `src/features/employer/applicant-detail-screen.tsx`: `decide` | `employer-service.ts`: `updateApplicationStatus` | UPDATE `applications.status` |
| แก้โปรไฟล์นายจ้าง | `src/features/employer/profile-screen.tsx`: `submit` | `employer-service.ts`: `updateEmployerProfile` | RPC `update_employer_profile` → `profiles` + `employer_profiles` |
| ระงับผู้ใช้/จัดการรายงาน | `src/features/admin/components/` | `src/features/admin/admin-service.ts`: `setAdminUserSuspended`, `updateAdminReport` | RPC `admin_set_user_suspended`, `admin_update_report` → `profiles`, `reports` |

## ตัวอย่างตามข้อมูลหนึ่งรายการ: สร้างประกาศงาน

1. `Field.onChange` ใน `job-form-screen.tsx` เรียก `change(key, value)` เก็บข้อความใน `form` ผ่าน `setForm` การพิมพ์ยังไม่บันทึกฐานข้อมูล
2. ปุ่มบันทึกเรียก `submit()` ซึ่งเรียก `validateJob(form)` ถ้าผ่านจึง `await saveJob(form, jobId)`
3. `saveJob` ใน `employer-service.ts` ตรวจข้อมูลซ้ำและตรวจบัญชีนายจ้างด้วย `employerId()` จากนั้นสร้าง `values` โดย `trim()` ข้อความและ `Number()` ค่าจ้าง/จำนวนคน
4. ถ้าไม่มี `jobId` ใช้ `supabase.from('jobs').insert({ ...values, employer_id: owner })` ถ้ามีใช้ `.update(values).eq('id', id).eq('employer_id', owner)`
5. `.select().single()` รับแถวที่บันทึกกลับมา ถ้ามี `error` จะ `throw` ให้หน้าฟอร์มแสดงข้อผิดพลาด ถ้าสำเร็จคืน `job` แล้ว `router.replace` ไปหน้ารายการหรือรายละเอียดงาน

คำตอบตัวอย่าง: “รับข้อมูลใน form ของหน้าจอครับ เมื่อกดบันทึกจะตรวจค่าแล้วส่งเข้า saveJob ซึ่งเขียนตาราง jobs และคืนข้อมูลที่บันทึกกลับมาเพื่อใช้เปิดหน้าถัดไป”

## ข้อมูลจากฐานข้อมูลมาแสดงได้อย่างไร

- นิสิต: `getStudentCollection()` ใน `student-service.ts` อ่าน `jobs`, `applications`, `saved_jobs` แล้วจับคู่ด้วย `job_id`
- นายจ้าง: `getEmployerJobs()` ใน `employer-service.ts` อ่านงานของตนเองพร้อมจำนวนผู้สมัคร
- `useStudentData` / `useEmployerData` รับฟังก์ชันอ่านข้อมูลเป็น `load` เรียกเมื่อหน้าได้รับ focus แล้วเก็บผลด้วย `setData` ทำให้ React แสดงข้อมูลใหม่ ทั้งสอง hook ป้องกันผลคำขอเก่ามาทับข้อมูลหลังเปลี่ยนหน้า/บัญชี
- `.select()` คืออ่าน, `.insert()` คือเพิ่ม, `.update()` คือแก้ไข, `.delete()` คือลบ, `.eq()` คือกำหนดเงื่อนไข, `.rpc()` คือเรียกฟังก์ชัน SQL ที่ฐานข้อมูล

## หลัง Login รู้ได้อย่างไรว่าต้องเข้าหน้าไหน

`loginAccount` → Supabase Auth สร้าง session → `src/providers/auth-provider.tsx` รับผ่าน `onAuthStateChange` → `applySession` เรียก `resolveRole` อ่าน `profiles.role` → `src/app/_layout.tsx` ใช้ `Stack.Protected` เปิดกลุ่ม `(student)`, `(employer)` หรือ `(admin)` ตามบทบาท

Session เก็บเพื่อใช้ต่อเนื่อง: เว็บใช้ localStorage ส่วนมือถือใช้ `createSessionStorage` ที่รับ SecureStore และ AsyncStorage ดูรายละเอียดใน `src/lib/session-storage.ts` และการเลือก storage ใน `supabase.ts`

## ข้อมูลส่งไป AI ตรงไหน

| เส้นทาง | โค้ด |
| --- | --- |
| แอปนิสิตส่งคำขอ | `src/features/student-ai/service.ts`: `studentAi` → `supabase.functions.invoke('student-ai', { body: ... })` |
| แอปนายจ้างส่งคำขอ | `src/features/employer-ai/ai-service.ts`: `requestEmployerAi` → `supabase.functions.invoke('employer-ai', { body: input })` |
| Backend รับ HTTP และผูกการอ่านฐานข้อมูล | `supabase/functions/student-ai/index.ts`, `supabase/functions/employer-ai/index.ts`: `Deno.serve(handler)` |
| อ่าน body/ตรวจสิทธิ์/เตรียมข้อมูล/คืน JSON | `supabase/functions/_shared/student-handler.ts`, `supabase/functions/_shared/ai-handler.ts` |
| ส่ง HTTP ไป Gemini จริง | `supabase/functions/_shared/ai-provider.ts`: `callAiProvider` → POST `https://generativelanguage.googleapis.com/v1beta/models/...:generateContent` |

Backend ตรวจ token และบทบาท อ่าน context จากฐานข้อมูล เลือกข้อมูลที่ใช้ แล้วส่งเป็น JSON ไป Gemini คีย์ `GEMINI_API_KEY` อ่านจาก environment ฝั่ง Edge Function คำตอบถูกตรวจรูปแบบที่ backend และ service ในแอปก่อนนำไปแสดง

AI ฝั่งนายจ้างให้ข้อมูลประกอบการพิจารณา การรับ/ปฏิเสธจริงเกิดเมื่อผู้ใช้เรียก `updateApplicationStatus` ส่วน AI นิสิตกรองงานก่อนแนะนำ; Radar เก็บผลใน `job_radar_recommendations` และการกดข้ามเก็บ `student_job_interactions` โดยไม่เรียก Gemini

ทักษะ/ประสบการณ์และเวลาว่างส่งผ่าน `src/features/employer-ai/work-context-service.ts` ไป `profiles` และ `student_availability` ความสนใจงานส่งผ่าน `savePreferences` ใน `student-ai/service.ts` ไป `student_job_preferences`

## โครงสร้างตารางและสิทธิ์อยู่ไหน

- `supabase/migrations/202609200001_auth_foundation.sql`: ตารางโปรไฟล์, `handle_new_user`, trigger `on_auth_user_created`, การยืนยันอีเมล และ `is_admin`
- `supabase/migrations/20260921030908_employer_management.sql`: `jobs`, `applications`, RLS และ RPC `update_employer_profile`
- `supabase/migrations/20260921040000_student_features.sql`: `saved_jobs` และสิทธิ์ฝั่งนิสิต
- `supabase/migrations/202609220001_profile_security.sql`: สิทธิ์แก้โปรไฟล์และการซิงก์อีเมล
- `supabase/migrations/202609240002_admin_workflows.sql`: `reports` และ RPC จัดการของแอดมิน
- `supabase/migrations/20260924035509_employer_ai_context.sql`: เวลาว่างและโควตา AI นายจ้าง
- `supabase/migrations/20260928204004_student_recommendations.sql`: ความสนใจงาน ประวัติข้ามงาน Radar และโควตา AI นิสิต
- `src/types/database.generated.ts`: TypeScript types ของ schema สำหรับตรวจชนิดข้อมูลในโค้ด ไม่ใช่ตัวเชื่อมฐานข้อมูล

คำตอบเรื่องสิทธิ์: “หน้าแอปมี guard และ service ตรวจผู้ใช้เพื่อควบคุมการใช้งาน แต่ฐานข้อมูลบังคับสิทธิ์ด้วย Row Level Security และ SQL functions อีกชั้น ส่วน Edge Function ที่ใช้ service role ตรวจ token บทบาทและขอบเขตข้อมูลเองก่อนทำงาน”

## ลำดับเปิดไฟล์ตอนสาธิต

เริ่ม `supabase.ts` → เปิดหน้าฟอร์มที่อาจารย์ถาม → ตามชื่อฟังก์ชันไป service → ชี้ `.from('ชื่อตาราง')` หรือ `.rpc('ชื่อฟังก์ชัน')` → เปิด migration ถ้าถามเรื่อง schema/สิทธิ์ → กลับไปชี้ส่วนรับผลลัพธ์และอัปเดตหน้าจอ
