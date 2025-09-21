# 🗺️ Mind Map Editor

โปรเจกต์เว็บแอปพลิเคชันสำหรับสร้างและจัดการ Mind Map ที่มีความยืดหยุ่นสูง สร้างด้วย React, Vite, และ TypeScript

<img width="1903" height="920" alt="image" src="https://github.com/user-attachments/assets/dec258e9-c5ca-4fbe-a215-82e75d1765ce" />


## ✨ คุณสมบัติหลัก (Features)

- **Drag & Drop Interface:** สร้างและจัดวาง Node ได้อย่างอิสระบน Canvas
- **การจัดการ Node:**
  - สร้าง Node ประเภทต่างๆ (Topic, Image, Decision, etc.)
  - แก้ไขชื่อ Node ได้โดยตรง (In-place editing) ผ่านการดับเบิลคลิก
  - คัดลอก, วาง, และลบ Node ได้
- **การเชื่อมต่อแบบ Many-to-Many:** ทุก Node สามารถมีเส้นเชื่อมเข้าและออกได้หลายเส้น
- **Properties Panel:** เมื่อเลือก Node จะมี Panel ด้านขวาสำหรับ:
  - แก้ไขชื่อ Node
  - เปลี่ยนประเภทและสัญลักษณ์ของ Node
  - ดูรายการเส้นเชื่อมเข้า (Incoming) และออก (Outgoing)
- **Rich Text Note Editor:** บันทึกโน้ตย่อสำหรับแต่ละ Node พร้อมเครื่องมือจัดรูปแบบข้อความ (Powered by Tiptap)
- **Paste Image as Node:** วางรูปภาพจาก Clipboard ลงบน Canvas เพื่อสร้าง Node รูปภาพได้ทันที
- **การควบคุม Canvas:**
  - Pan & Zoom ด้วยเมาส์และคีย์บอร์ด (`Ctrl` + `Mouse Wheel`, `Ctrl` + `+/-`)
  - Reset View กลับไปยังจุดเริ่มต้น
- **การบันทึกข้อมูล:**
  - บันทึกข้อมูลแผนผังและความคืบหน้าลงใน Local Storage ของเบราว์เซอร์
  - Import และ Export แผนผังทั้งหมดเป็นไฟล์ `.json`
- **Dark Mode:** รองรับการสลับธีมระหว่างสว่างและมืด

## 🛠️ เทคโนโลยีที่ใช้ (Tech Stack)

- **Framework:** React 18
- **Build Tool:** Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Text Editor:** Tiptap
- **Icons:** Lucide React

## 🚀 การติดตั้งและเริ่มใช้งาน (Getting Started)

ทำตามขั้นตอนต่อไปนี้เพื่อรันโปรเจกต์บนเครื่องของคุณ

1.  **Clone the repository (หรือแตกไฟล์โปรเจกต์):**
    ```bash
    git clone <your-repository-url>
    cd <project-folder>
    ```

2.  **ติดตั้ง Dependencies:**
    ใช้ `yarn` (แนะนำ) หรือ `npm`
    ```bash
    yarn install
    ```
    หรือ
    ```bash
    npm install
    ```

3.  **รัน Development Server:**
    ```bash
    yarn dev
    ```
    หรือ
    ```bash
    npm run dev
    ```

4.  เปิดเบราว์เซอร์แล้วไปที่ `http://localhost:5173` (หรือ Port ที่ Vite แสดงใน Terminal)

## 🔮 แนวทางการพัฒนาต่อ (Future Improvements)

- **Undo/Redo:** เพิ่มระบบย้อนกลับและทำซ้ำการกระทำต่างๆ
- **Real-time Collaboration:** ใช้ Backend (เช่น Firebase, Supabase) เพื่อให้ผู้ใช้หลายคนสามารถทำงานบนแผนผังเดียวกันได้พร้อมกัน
- **Export to Image:** เพิ่มความสามารถในการส่งออกแผนผังเป็นไฟล์รูปภาพ (PNG, SVG)
- **Re-implement Markdown Export:** พัฒนา Logic การส่งออกเป็น Markdown ใหม่ให้รองรับโครงสร้างข้อมูลแบบ Graph


TRY --> https://quiet-caramel-1b3541.netlify.app/
