# JobMor — เดโมด้วย Expo Go

## เป้าหมายปัจจุบัน

รันจาก VS Code → npx expo start → สแกน QR → Expo Go งานนี้อยู่ใน branch addfeatures ไม่มี EAS, FCM, APNs, native Push หรือ build แบบ APK/IPA

## ฟีเจอร์สำหรับนำเสนอ

- Student: เข้าระบบ ค้นหา/กรอง ดูรายละเอียด สมัคร/ถอนใบสมัคร บันทึกงาน ดูสถานะ และแก้โปรไฟล์/ทักษะ/เวลาว่าง
- Employer: สร้าง/ดู/แก้ไข/ลบงาน ดูผู้สมัคร รับ/ปฏิเสธใบสมัคร และแก้ข้อมูลบริษัท
- Admin: ดูภาพรวม ผู้ใช้ งาน รายงาน และทำงานตามสิทธิ์เดิม
- QuickMatch: เลือกงานจริงที่ยังเข้าเงื่อนไขจาก Supabase โดยใช้เวลาว่าง หมวดงาน พื้นที่ข้อความ ค่าจ้าง และประวัติสมัคร/ข้าม เมื่อทักษะที่กรอกปรากฏในข้อมูลประกาศก็ใช้เป็นเหตุผลประกอบ ไม่พึ่ง Gemini หรือ quota; ถ้าข้อมูลบางส่วนไม่มีจะแสดงความไม่แน่นอน
- งานด่วน: สวิตช์ในฟอร์ม Employer บันทึกแท็ก [URGENT] ในชื่อประกาศเดิม Student เห็นป้ายและตัวกรองงานด่วน แล้วสมัครผ่าน flow pending เดิม Employer เป็นผู้รับ/ปฏิเสธ
- AI Candidate Insight: คงระบบ Gemini/Edge Function เดิม วิเคราะห์เมื่อกดปุ่มเท่านั้น ความผิดพลาดจาก AI ไม่ขัดขวางการดูหรือจัดการใบสมัคร

## สิ่งที่ข้ามสำหรับเดโม

Native/in-app notification, realtime, GPS/ระยะทาง/ETA, geofencing, worker, cron, การรับกะอัตโนมัติ และ EAS ทั้งหมด Job Radar/Opportunity Discovery ยังไม่แสดงใน UI เช่นเดิม หน้า Messages เป็นต้นแบบ ไม่ใช้เป็นส่วนหลักของเดโม

## สถานะ Supabase

เชื่อมโปรเจกต์ jobmor: https://ygurqvincjuiapukalrv.supabase.co

Migration nearby_urgent_jobs เคย apply แล้วในแผนก่อนหน้า ตาราง/columns ส่วนตัวและคิวที่สร้างไว้ยังคงอยู่ เพื่อไม่ลบข้อมูลหรือรื้อ schema ในรอบลดขอบเขตนี้ แอปเวอร์ชันเดโมไม่เรียกใช้ ไม่ต้อง db push เพิ่ม

ไม่มี cron jobmor-urgent-push, secret ของ worker หรืออุปกรณ์ Push ที่ตั้งไว้ขณะตรวจ การ cleanup trigger บนโปรเจกต์ถูก automatic approval review ปฏิเสธ จึงเลือกใช้แท็กใน title ซึ่งทำงานกับ schema/สิทธิ์ CRUD เดิมและไม่เข้าเส้นทาง Push/instant

student-ai ใช้ QuickMatch แบบพื้นฐาน ส่วน urgent-jobs URI เดิมถูกปิดด้วย HTTP 410 เพื่อหยุดการส่ง Push

## คำสั่งเดโม

เปิด terminal ใน VS Code:

```powershell
cd C:\Users\tarit\OneDrive\Desktop\jobmor\jobmor-ku-sriracha
npm install
npx expo start --clear
```

คอมพิวเตอร์และโทรศัพท์อยู่บน Wi-Fi เดียวกัน เปิด Expo Go ที่รองรับ SDK 57 แล้วสแกน QR ต้องมีอินเทอร์เน็ตเพื่อเรียก Supabase และ Candidate Insight

หากต้องตรวจในเว็บด้วย: npm run web

ไม่ต้องรัน eas init, eas build, prebuild, สร้าง Firebase หรือทำ Apple Developer configuration

## ลำดับนำเสนอ

1. Employer เข้าระบบ สร้างงานวันที่ในอนาคต กะ 18:00 - 22:00 ค่าจ้างรายชั่วโมง เลือกงานด่วนและเปิดรับ
2. Student เปิด Home → กรองงานด่วน → ดูรายละเอียด → สมัคร → เปิด Applications เห็น pending
3. Employer เปิด Applicants → รับ/ปฏิเสธ → Student รีเฟรชเห็นสถานะ
4. Student เพิ่มเวลาว่างที่ครอบคลุมกะ หรือเว้นว่างเพื่อแสดง unknown → QuickMatch → สนใจ → ดูงาน/ยืนยันสมัคร
5. Employer เปิดผู้สมัคร → วิเคราะห์ Candidate Insight ถ้า provider พร้อมใช้งาน

งานวันที่ผ่านไป กะอ่านไม่ได้ งานเต็ม งานที่เคยสมัคร/ข้าม หรือเวลาซ้อน จะไม่ถูก QuickMatch แนะนำ ควรสร้างงานใหม่ก่อนเดโมและตั้งความสนใจให้ตรงกับงาน

## การตรวจสอบ

npm run check ใช้ lint, TypeScript และ automated tests รวม SQL ownership/application tests; native bundling ตรวจด้วย Expo export ซึ่งไม่ได้สร้าง native app

การทดสอบบนโทรศัพท์จริงยังต้องสแกน QR ด้วย Expo Go ไม่ควรถือว่าผ่านจากการ bundle อย่างเดียว

ผลตรวจรอบนี้: lint/TypeScript/74 tests ผ่าน, iOS และ Android JS bundle ผ่าน, เดโม Student ผ่านการดูโปรไฟล์/เวลาว่าง QuickMatch งานด่วน ดูรายละเอียด ยืนยันสมัคร และถอนสมัครบน Supabase จริง ตรวจว่า Student ถูกส่งกลับ Home เมื่อเปิดเส้นทาง Employer และไม่พบ console error

ประกาศ DEMO ชั่วคราวและใบสมัครที่สร้างเพื่อทดสอบถูกลบแล้ว จำนวนงาน/ใบสมัครกลับเท่าเดิม การรับเข้าทำงานบนบัญชีจริงไม่ได้ทดสอบเพราะ automatic review ปฏิเสธ จึงใช้ SQL tests ของ Employer แบบ rollback แทน

Employer ผ่านการตรวจหน้าจอจริง: Dashboard/My Jobs, สร้างงานด่วนแบบ draft, แก้ชื่อและค่าจ้าง, popup บันทึกสำเร็จ, dialog ลบและยกเลิก, ตัวกรองผู้สมัคร, รายละเอียดผู้สมัคร และข้อมูลบริษัท/ฟอร์มแก้ไขที่เติมข้อมูลเดิมครบ Candidate Insight เรียก Gemini จริงสำเร็จและแสดง summary/strengths/gaps/questions โดยไม่เปลี่ยนสถานะใบสมัคร ไม่พบ console error

หลังลบ draft DEMO และประกาศทดสอบ เหลืองานเดิม 2 งานและใบสมัครเดิม 2 รายการ ไม่มี DEMO หรือคิว Push ค้าง สถานะใบสมัครเดิมไม่เปลี่ยน บัญชี Employer ถูกออกจากฟอร์มแก้โปรไฟล์ด้วย Cancel โดยไม่มีการแก้ข้อมูลจริง
