# بوابة طلبات الاستقطاب من الفلبين

نسخة MVP تتكون من صفحة عربية واحدة لرفع طلب الاستقطاب.

## الوظائف الموجودة
- نموذج عربي RTL ومتجاوب مع الجوال.
- بيانات صاحب العمل والمنشأة.
- إضافة أكثر من مهنة داخل الطلب نفسه.
- حفظ الطلب في Supabase.
- إنشاء رقم مرجعي تلقائي بصيغة `PH-2026-XXXXXXXX`.
- إرسال بريد للإدارة يحتوي على كامل الطلب.
- إرسال بريد لصاحب العمل يحتوي على التأكيد وكامل الطلب والرقم المرجعي.
- رسالة نجاح داخل الصفحة بعد الإرسال.

## 1) إنشاء قاعدة البيانات
افتح Supabase > SQL Editor وشغّل ملف:

`supabase.sql`

## 2) نشر Edge Function
ثبّت Supabase CLI ثم سجّل الدخول، وبعدها من مجلد المشروع:

```bash
supabase functions deploy submit-recruitment --no-verify-jwt
```

## 3) إضافة المتغيرات السرية

بريد الإدارة مضبوط مسبقًا على: `mahmoodejo@gmail.com`
في Supabase > Edge Functions > Secrets أضف:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `FROM_EMAIL` = بريد إرسال موثّق في Resend

مثال:
`Recruitment <requests@yourdomain.com>`

## 4) إعداد الواجهة
افتح `config.js` واستبدل:

`https://YOUR_PROJECT.supabase.co/functions/v1/submit-recruitment`

برابط مشروع Supabase الحقيقي.

## 5) رفع الموقع
ارفع الملفات التالية إلى GitHub Pages أو Cloudflare Pages:

- index.html
- style.css
- app.js
- config.js

## ملاحظة مهمة عن البريد
Resend يتطلب عادةً توثيق النطاق لاستخدام بريدك الخاص في FROM_EMAIL.
للتجربة يمكن استخدام عنوان Resend التجريبي، لكن للإنتاج يفضّل ربط نطاقك.

## الأمان
لا تضع `SUPABASE_SERVICE_ROLE_KEY` أو `RESEND_API_KEY` داخل ملفات الموقع العامة.
هذه المفاتيح تبقى داخل Edge Function Secrets فقط.


## ملاحظة الإصدار v2
تم تثبيت بريد الإدارة على `mahmoodejo@gmail.com`. ما زال يلزم إدخال رابط مشروع Supabase الحقيقي في `config.js` بعد نشر Edge Function.


## إصدار v3
تم ربط `config.js` بمشروع Supabase: `sybsrxckdoobxjlnuuvy`.
