# JobMor

JobMor คือแอปหางานสำหรับนิสิตมหาวิทยาลัยเกษตรศาสตร์ วิทยาเขตศรีราชา และผู้ประกอบการในพื้นที่ repository นี้เป็น **UI foundation v0.1.0** สำหรับให้ทีมแยก branch พัฒนาเป็น feature ต่อไป

## สถานะปัจจุบัน

ทำแล้ว:

- Expo + React Native + TypeScript และ Expo Router
- Navigation แยก Student, Employer และ Admin ตั้งแต่ต้น
- UI shell อ้างอิงหน้าตาที่ทีมให้มา โดยยังไม่มี mock data
- Bottom Tab Bar ใช้ Ionicons ไม่มี emoji
- รองรับ light/dark mode ตามระบบ
- โครงภาษาไทย/อังกฤษ เริ่มตามภาษาระบบและสลับดูได้จากหน้า UI
- App icon, splash screen และ favicon ของ JobMor
- GitHub Actions ตรวจ lint และ TypeScript ใน PR

ยังไม่ทำ:

- Login, session และ route guard
- REST API, Supabase client และ PostgreSQL schema
- ข้อมูลจริง, mock data และ business logic
- Unit/E2E tests (ให้เพิ่มพร้อม feature ที่มี logic)

หน้าแรกเป็น **Development Role Preview** เพื่อให้ทีมเปิดดู navigation ของแต่ละ role ได้ ไม่ใช่หน้า Login และไม่มี authentication logic

## Tech stack

| ส่วน | เทคโนโลยี |
|---|---|
| Mobile | Expo SDK 57, React Native 0.86 |
| Language | TypeScript (strict mode) |
| Navigation | Expo Router |
| Icons | Ionicons |
| Localization | expo-localization + i18n-js |
| Backend (planned) | REST API + Supabase |
| Database (planned) | PostgreSQL |
| Repository / CI | GitHub + GitHub Actions |

## เริ่มต้นใช้งาน

ต้องมี Node.js 22 LTS และ npm

```bash
npm install
npm start
```

คำสั่งที่ใช้บ่อย:

```bash
npm run android
npm run ios
npm run web
npm run lint
npm run typecheck
npm run check
```

ก่อน push ทุกครั้งให้รัน `npm run check`

## โครงสร้างโปรเจกต์

```text
src/
├── app/                         # Route เท่านั้น ไม่ใส่ business logic หนัก
│   ├── (auth)/                  # Role preview; พื้นที่ Login ในอนาคต
│   ├── (student)/               # Student tabs
│   ├── (employer)/              # Employer tabs + create-job
│   └── (admin)/                 # Admin tabs
├── components/                  # UI ที่ใช้ร่วมกันหลายหน้า/หลาย role
├── constants/                   # Theme และ navigation configuration
├── features/                    # งานของแต่ละทีม วาง component/hook/service/type ที่นี่
│   ├── auth/
│   ├── student/
│   ├── employer/
│   └── admin/
├── hooks/                       # Shared hooks
├── localization/                # Translation dictionaries
├── providers/                   # App-level React providers
└── types/                       # Shared domain types เท่านั้น
```

กติกาสำคัญ:

- Route ใน `src/app` ควรบาง ทำหน้าที่ประกอบ screen และ navigation
- โค้ดเฉพาะ feature ให้อยู่ใน `src/features/<feature>` เพื่อลด merge conflict
- ย้ายเข้า `src/components` เมื่อ component ถูกใช้จริงอย่างน้อยสอง feature
- ห้ามใส่ Supabase service role key หรือ secret ในแอป
- การซ่อน tab ไม่ใช่ authorization; backend และ Supabase RLS ต้องตรวจสิทธิ์เสมอ

## การแบ่งงานที่แนะนำ

| Branch | ขอบเขต |
|---|---|
| `feature/student-home` | Home และ job discovery |
| `feature/student-applications` | Apply และติดตามใบสมัคร |
| `feature/employer-jobs` | Create/edit/close job |
| `feature/employer-applicants` | ตรวจและอัปเดตผู้สมัคร |
| `feature/admin-moderation` | Users, reports และ verification |
| `feature/messaging` | Conversation และ realtime messages |
| `feature/api-client` | REST client, error model และ environment config |
| `feature/auth` | ทำท้ายสุดหลัง role/RLS ชัดเจน |

หนึ่ง branch ควรมีเจ้าของหลักหนึ่งคน และไม่รวมหลาย feature ที่ไม่เกี่ยวกัน

## Git workflow

ใช้เส้นทาง `feature/* → develop → main`

```bash
git switch develop
git pull origin develop
git switch -c feature/student-home
```

### ควร commit ตอนไหน

อย่ารอให้ feature เสร็จทั้งหมด ให้ commit เมื่อได้ “หน่วยงานที่อธิบายได้และยัง build ผ่าน” เช่น:

1. วาง route/type/interface ที่จำเป็น
   `git commit -m "feat(student): scaffold home route"`
2. ทำ UI component ชุดแรกเสร็จ
   `git commit -m "feat(student): add job search header"`
3. ทำ empty/loading/error state
   `git commit -m "feat(student): handle job list states"`
4. เชื่อม API หรือ state management
   `git commit -m "feat(student): connect jobs endpoint"`
5. เพิ่ม test และแก้ lint/type
   `git commit -m "test(student): cover job filtering"`
6. ปรับเอกสารหรือ refactor แยกเป็น commit ของตัวเอง
   `git commit -m "docs(student): document jobs contract"`

หลักง่าย ๆ: commit ทุกครั้งก่อนเปลี่ยนไปทำ concern ใหม่, ก่อน refactor ใหญ่, และก่อนหยุดงาน/ส่งต่อ แต่ไม่ commit โค้ดที่ typecheck ไม่ผ่าน

ใช้ Conventional Commits:

- `feat:` ความสามารถใหม่
- `fix:` แก้ bug
- `refactor:` ปรับโครงโดย behavior เดิม
- `docs:` เอกสาร
- `test:` test
- `chore:` tooling/dependency/CI

เมื่อพร้อมส่งงาน:

```bash
npm run check
git push -u origin feature/student-home
```

เปิด Pull Request เข้า `develop`, ให้เพื่อน review อย่างน้อยหนึ่งคน และ merge เมื่อ CI ผ่านเท่านั้น ห้าม push ตรงเข้า `main` หรือ `develop` ส่วน `main` ใช้เฉพาะ release ที่ผ่านการทดสอบจาก `develop`

## Versioning

โปรเจกต์ใช้ [Semantic Versioning](https://semver.org/): `MAJOR.MINOR.PATCH`

- `0.1.0` — UI foundation ปัจจุบัน
- เพิ่ม `PATCH` เมื่อแก้ bug โดย API/behavior เดิม เช่น `0.1.1`
- เพิ่ม `MINOR` เมื่อเพิ่ม feature ที่ backward-compatible เช่น `0.2.0`
- เริ่ม `1.0.0` เมื่อ flow หลักพร้อม production และ contract เสถียร
- เพิ่ม `MAJOR` หลัง 1.0 เมื่อมี breaking change

ตอน release ให้แก้เวอร์ชันใน `package.json` และ `app.json` ให้ตรงกัน จากนั้น merge เข้า `main` และสร้าง tag:

```bash
git tag -a v0.1.0 -m "JobMor UI foundation"
git push origin v0.1.0
```

## Environment และ backend ในอนาคต

คัดลอก `.env.example` เป็น `.env` เมื่อเริ่มเชื่อม Supabase:

```bash
cp .env.example .env
```

ใช้เฉพาะ public URL/publishable key ฝั่งแอป ส่วน secret และงานที่ต้องใช้สิทธิ์สูงให้อยู่ใน backend เท่านั้น ก่อนเริ่ม API/Auth ทีมควรตกลง REST contract, PostgreSQL schema, role claims และ RLS policies ร่วมกันก่อน

## CI

GitHub Actions จะทำงานเมื่อ push หรือเปิด PR เข้า `develop`/`main` โดยรัน `npm ci` และ `npm run check` หาก CI ไม่ผ่านให้แก้ใน feature branch เดิม ห้าม bypass ด้วยการปิด lint หรือ TypeScript strict mode

## License

MIT — ดู [LICENSE](./LICENSE)
