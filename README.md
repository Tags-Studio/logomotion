# لوجو موشن (نسخة MVP) — ستايل Match Cut

أداة بتحوّل لوجو ثابت لفيديو حركي، بنفس فكرة logomotion.design، مبنية بـ:

- **Remotion** (React → فيديو حقيقي MP4) — بيرندر على السيرفر.
- **Express + Multer** لاستقبال رفع الملفات وتشغيل الرندر.
- **Frontend** بسيط (HTML/CSS/JS عادي، RTL عربي).

## المتطلبات

- Node.js 18 أو أحدث.
- اتصال إنترنت أول مرة بس (Remotion بيحمّل نسخة Chromium headless تلقائي أول تشغيل).
- مساحة تخزين لملفات الرفع والفيديوهات الناتجة (`public/uploads` و `out`).

## التشغيل

```bash
cd logomotion-clone
npm install
npm run server
```

بعد كده افتح المتصفح على:

```
http://localhost:4000
```

## إزاي بيشتغل الستايل (Match Cut)

1. اللوجو بيدخل النص بحركة scale + fade (أول 40 فريم من 120).
2. وقفة قصيرة.
3. دائرة (iris wipe) بتتوسع من مركز اللوجو وتكشف فيديو الخلفية اللي رفعته — ده اللي بيدي إحساس الـ "match cut".
4. اللوجو بيفضل شعار صغير في الزاوية لحد آخر الفيديو.

المقاس الناتج: **1080×1920** (عمودي، مناسب لـ Reels/Stories/TikTok) بمعدل **30fps** ومدة **4 ثواني**.

## معاينة الأنيميشن أثناء التطوير (Remotion Studio)

لو عايز تعدّل التوقيتات أو الحركة وتشوف النتيجة live من غير ما تعمل render كامل كل مرة:

```bash
npm run studio
```

ده هيفتح Remotion Studio على المتصفح وتقدر تشوف التايم لاين وتعدّل props مباشرة.

## النشر على Render (مجاني)

**1) ارفع المشروع على GitHub**

```bash
cd logomotion-clone
git init
git add .
git commit -m "أول نسخة"
```

روح على github.com، اعمل repository جديد (مينفعش يكون فاضي)، وبعدين:

```bash
git remote add origin https://github.com/USERNAME/REPO-NAME.git
git branch -M main
git push -u origin main
```

**2) اربط Render بالـ repo**

1. سجّل دخول على [render.com](https://render.com) (تقدر تسجل بحساب GitHub مباشرة).
2. من الداشبورد: **New +** → **Web Service**.
3. اختار الـ repo اللي رفعته.
4. Render هيلاقي ملف `render.yaml` في المشروع ويظبط الإعدادات لوحده تلقائيًا (Build Command وStart Command). لو مالقاش، ادخل يدوي:
   - **Build Command**: `npm install`
   - **Start Command**: `npm run server`
   - **Instance Type**: Free
5. دوس **Deploy Web Service**.

أول عملية build هتاخد شوية وقت (5-10 دقايق) عشان بتحمّل الـ dependencies ونسخة Chromium اللي Remotion محتاجها. تابع اللوج (Logs tab) عشان تتأكد إن كل حاجة نجحت.

**3) بعد ما الـ deploy يخلص**

Render هيديك رابط زي `https://logomotion-clone.onrender.com` — افتحه وجرّب الأداة.

**⚠ حاجتين مهمين في الخطة المجانية:**
- **السيرفر بينام بعد 15 دقيقة** من غير استخدام، وأول طلب بعد كده هياخد 30-60 ثانية عشان "يصحى" (cold start). ده طبيعي، مش error.
- **الملفات بتتمسح كل ما السيرفر يعيد التشغيل** (التخزين مؤقت/ephemeral) — يعني الفيديوهات القديمة مش هتفضل محفوظة. لو عايز حفظ دائم لاحقًا، هنحتاج نوصل تخزين خارجي (زي Cloudflare R2 أو S3).
- **512MB رام بس** — لو الرندر بطئ أو فشل مع فيديوهات طويلة/تقيلة، ده سبب محتمل. جرب بفيديو قصير الأول (أقل من 10 ثواني) وشوف النتيجة.

## الخطوات الجاية المقترحة

- إضافة ستايلات تانية (Pulse / Chrome / Thermal / Smoke) كـ compositions جديدة في `src/remotion/`.
- تحويل الـ render لـ async job queue (بدل ما الطلب يفضل مفتوح لحد ما الفيديو يخلص) — مهم قبل أي استضافة عامة.
- مكتبة فيديوهات جاهزة (stock clips) بدل ما اليوزر يرفع فيديو بنفسه كل مرة.
- ربط النظام بتخزين سحابي (S3 مثلاً) بدل السيرفر المحلي لو هيتنشر فعليًا.

## هيكل المشروع

```
logomotion-clone/
├── package.json
├── server/
│   └── index.js          ← Express server + استدعاء Remotion renderMedia
├── src/remotion/
│   ├── index.jsx          ← registerRoot
│   ├── Root.jsx            ← تعريف الـ Composition (المقاس، المدة، fps)
│   └── MatchCut.jsx         ← منطق الأنيميشن نفسه
└── public/
    ├── index.html          ← واجهة الرفع والمعاينة (RTL عربي)
    ├── style.css
    ├── app.js
    └── uploads/            ← الملفات المرفوعة بتتخزن هنا مؤقتًا
```
