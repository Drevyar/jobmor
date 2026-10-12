# Student QuickMatch สำหรับเดโม

หน้า Home คง QuickMatch ขนาดเล็กใต้ช่องค้นหา ระบบล่าสุดใช้การเลือกแบบพื้นฐานจากข้อมูลจริงของ Supabase ไม่ต้องมี Gemini key สำหรับ QuickMatch

## Flow

Student กด Find a job → ตรวจบัญชียืนยันแล้ว → อ่านงานที่เปิดรับ เวลาว่าง ความสนใจ ใบสมัครและงานที่ข้าม → กรองงานเต็ม หมดเวลา สมัคร/ข้ามแล้ว หรือกะขัดกัน → เลือกงานหนึ่งงานและอธิบายข้อเท็จจริง → สนใจ → ดูรายละเอียด/ยืนยันสมัคร

ใช้ทักษะที่ปรากฏในข้อความประกาศเป็นเหตุผลประกอบ โดยไม่สร้าง match percentage ข้อมูลเวลาว่างที่ไม่มีจะเป็น unknown พร้อมข้อความให้ตรวจเวลาก่อนสมัคร ไม่ต้องเพิ่ม infrastructure

พื้นที่ใช้การค้นหาข้อความ ไม่ใช้ GPS ระยะทางหรือเวลาเดินทาง งานด่วนตรวจจากแท็ก [URGENT] ใน title เดิม ไม่ใช้ระบบ Push/instant accept

Job Radar/Opportunity Discovery ถูกนำออกจากหน้าแอปแล้ว Endpoint/code เดิมบางส่วนคงไว้เพื่อ compatibility และไม่ใช่ฟีเจอร์ที่ใช้ในเดโม

ใช้ tables profiles, jobs, applications, student_availability, student_job_preferences และ student_job_interactions เดิม RLS และ role guards ยังคงทำงาน

Candidate Insight ของ Employer ยังคงใช้ Gemini ที่ตั้งค่าฝั่งเซิร์ฟเวอร์เดิม ส่วน QuickMatch ไม่เรียก provider/AI budget

ขั้นตอนเดโมและขอบเขตล่าสุด: [Expo Go demo](expo-go-demo.md)
