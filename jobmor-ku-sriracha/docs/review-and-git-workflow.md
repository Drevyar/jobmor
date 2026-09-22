# งาน UI และความปลอดภัย: วิธีตรวจและส่ง PR

## งานที่เปลี่ยน

- ฐานข้อมูลบังคับความยาวโปรไฟล์และรูปแบบเบอร์นายจ้าง แม้เรียก REST โดยตรง
- การเปลี่ยนอีเมล Auth ซิงก์เข้าโปรไฟล์ และนิสิตต้องคงอีเมล `@ku.th`
- บัญชีที่ถูกระงับยังอ่านข้อมูลตัวเองได้ แต่แก้โปรไฟล์และทำรายการที่ต้อง verified ไม่ได้
- Native session ย้ายจาก AsyncStorage ไป SecureStore และแบ่งข้อมูลเป็นส่วนย่อยเพื่อรองรับ Keychain
- ปรับ dependency ที่มี advisory พร้อมแพตช์ความเข้ากันได้ โดยคง Expo SDK 57
- หน้าค้นหางานนิสิตจัดข้อมูลและปุ่มใหม่ เมนูมีข้อความ hover/pressed/focus ชัดขึ้น
- ใช้สีข้อความบนปุ่มตาม light/dark theme โดยคงชุดสีแบรนด์เดิม

## ผลตรวจและสิ่งที่ต้องตรวจต่อ

- `npm run check`: lint, TypeScript และ 32 tests ผ่าน รวม SQL migrations/RLS ใน PGlite
- `npm ci` ในโฟลเดอร์แยก: ผ่าน และ postinstall ใช้แพตช์ได้; audit ไม่พบ advisory ค้าง
- `npx expo export --platform all`: ผ่านทั้ง web, Android และ iOS (เป็น bundle export ไม่ใช่การทดสอบบนอุปกรณ์จริง)
- Browser QA ที่ 1280px และ 390px: ภาษาไทย/อังกฤษ ตัวกรอง การค้นหาไม่พบงาน ล้างตัวกรอง บันทึก และสมัคร ผ่านด้วย backend จำลองในเครื่อง
- ยังต้องทดสอบ SecureStore และการกลับเข้าแอปบน Android/iOS จริง
- ยังต้องใช้ migration ใน staging และทดสอบเปลี่ยน/ยืนยันอีเมลกับ Supabase Auth จริง
- migration ใช้ `NOT VALID` เพื่อไม่แก้ข้อมูลเดิมอัตโนมัติ; ตรวจข้อมูลเก่าตาม `supabase/README.md` ก่อน rollout
- ยังไม่ได้ push, เปิด PR, merge หรือ deploy

## Commit, push และ PR ต่างกันอย่างไร

- **Commit**: บันทึกงานหนึ่งเรื่องที่ตรวจ diff แล้วและทดสอบได้ในเครื่อง ไม่ต้องรอให้โปรเจกต์เสร็จทั้งหมด
- **Push**: ส่ง commit ของ branch ขึ้น remote เพื่อสำรองและให้ทีมเห็น
- **Draft PR**: เปิดให้ทีมดูระหว่างทำได้ แต่ยังไม่พร้อม merge
- **Ready for review**: ขอบเขตงานครบ มีผลทดสอบและรูป UI หากเกี่ยวข้อง
- **Merge**: ทำหลัง CI ผ่านและ reviewer ตรวจแล้ว จากนั้นจึงเริ่มงานที่พึ่งพาการเปลี่ยนนี้จาก develop ล่าสุด

## Branch ที่เตรียมไว้ครั้งนี้

งานนี้แยก commit และ branch ต่อกันเพื่อทดสอบภาพรวมได้โดยไม่ merge เข้า develop:

| Branch | Base ของ PR รอบแรก | เนื้อหา |
| --- | --- | --- |
| `codex/security-hardening` | `develop` | กฎฐานข้อมูล, SecureStore, validation และ tests |
| `codex/dependency-security` | `codex/security-hardening` | dependency overrides และ compatibility patch |
| `codex/student-ui` | `codex/dependency-security` | UI และ contrast |

เปิดเป็น Draft PR เรียงตามตารางจะเห็น diff เฉพาะแต่ละเรื่อง เมื่อ PR ก่อนหน้า merge
แล้ว ให้เปลี่ยน base ของ PR ถัดไปเป็น develop และตรวจ diff อีกครั้ง หากทีมใช้ squash
merge ต้องย้ายเฉพาะ commit ของงานถัดไปลงบน develop ใหม่ก่อน เพื่อไม่ให้ commit เก่าซ้ำใน PR
อย่า force-push branch ที่คนอื่นกำลังทำงานร่วมกันโดยไม่ประสานกันก่อน

คำสั่งส่ง branch เมื่อพร้อม (รันจาก root repository):

```powershell
git push -u origin codex/security-hardening
git push -u origin codex/dependency-security
git push -u origin codex/student-ui
```

คำอธิบาย PR ควรระบุปัญหาเดิม พฤติกรรมใหม่ วิธีทดสอบ และส่วนที่ยังต้องทดสอบจริง
สำหรับ PR UI แนบภาพหน้าจอ ส่วน PR ฐานข้อมูลระบุ migration และขั้นตอน rollout

## Workflow สำหรับงานถัดไป

```powershell
git switch develop
git pull --ff-only origin develop
git switch -c codex/ชื่อหัวข้องาน
```

ทำงานย่อยให้จบหนึ่งเรื่อง แล้วตรวจและ commit:

```powershell
git diff
# รัน npm run check จากโฟลเดอร์ jobmor-ku-sriracha
git add -p
# ไฟล์ใหม่เลือก git add ตามชื่อไฟล์ด้วย เพราะ -p ไม่เลือก untracked files
git diff --cached
git commit -m "fix: อธิบายพฤติกรรมที่แก้"
```

Push เพื่อสำรองหรือเปิด Draft PR ได้โดยไม่ต้องรอให้งานอื่นจบ แต่ห้ามข้ามผลตรวจ
และการ review ก่อน merge เข้าสู่ develop ส่วน main ใช้สำหรับ release ที่ทดสอบแล้ว
