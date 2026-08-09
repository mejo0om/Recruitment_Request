import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function makeReference() {
  const now = new Date();
  const year = now.getUTCFullYear();
  const rand = crypto.randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase();
  return `PH-${year}-${rand}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const required = ["employer_name", "mobile", "email", "employer_city", "company_name", "positions"];
    for (const field of required) {
      if (!body[field] || (field === "positions" && !Array.isArray(body.positions))) {
        throw new Error(`Missing field: ${field}`);
      }
    }

    if (!body.positions.length) throw new Error("At least one position is required");

    const reference_number = makeReference();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { error: insertError } = await supabase
      .from("recruitment_requests")
      .insert({
        reference_number,
        employer_name: body.employer_name,
        mobile: body.mobile,
        email: body.email,
        employer_city: body.employer_city,
        company_name: body.company_name,
        cr_number: body.cr_number || null,
        company_address: body.company_address || null,
        notes: body.notes || null,
        positions: body.positions,
      });

    if (insertError) throw insertError;

    const rows = body.positions.map((p: any, i: number) => `
      <tr>
        <td>${i + 1}</td>
        <td>${escapeHtml(p.job_title)}</td>
        <td>${escapeHtml(p.quantity)}</td>
        <td>${escapeHtml(p.experience_years ?? "-")}</td>
        <td>${escapeHtml(p.salary ?? "-")}</td>
        <td>${escapeHtml(p.work_city)}</td>
        <td>${escapeHtml(p.contract_duration || "-")}</td>
        <td>${escapeHtml(p.benefits || "-")}</td>
        <td>${escapeHtml(p.requirements || "-")}</td>
      </tr>
    `).join("");

    const html = `
      <div dir="rtl" style="font-family:Arial,sans-serif;line-height:1.8;color:#172033">
        <h2>طلب استقطاب عمالة من الفلبين</h2>
        <p><strong>الرقم المرجعي:</strong> ${reference_number}</p>
        <hr>
        <p><strong>صاحب العمل:</strong> ${escapeHtml(body.employer_name)}</p>
        <p><strong>الجوال:</strong> ${escapeHtml(body.mobile)}</p>
        <p><strong>البريد:</strong> ${escapeHtml(body.email)}</p>
        <p><strong>المدينة:</strong> ${escapeHtml(body.employer_city)}</p>
        <p><strong>المنشأة:</strong> ${escapeHtml(body.company_name)}</p>
        <p><strong>السجل التجاري:</strong> ${escapeHtml(body.cr_number || "-")}</p>
        <p><strong>العنوان:</strong> ${escapeHtml(body.company_address || "-")}</p>
        <h3>العمالة المطلوبة</h3>
        <table border="1" cellpadding="7" cellspacing="0" style="border-collapse:collapse;width:100%;font-size:13px">
          <thead>
            <tr>
              <th>#</th><th>المهنة</th><th>العدد</th><th>الخبرة</th><th>الراتب</th>
              <th>مدينة العمل</th><th>مدة العقد</th><th>المزايا</th><th>المتطلبات</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <p><strong>ملاحظات:</strong> ${escapeHtml(body.notes || "-")}</p>
      </div>
    `;

    const resendKey = Deno.env.get("RESEND_API_KEY");
    const adminEmail = Deno.env.get("ADMIN_EMAIL");
    const fromEmail = Deno.env.get("FROM_EMAIL") || "Recruitment <onboarding@resend.dev>";

    if (!resendKey || !adminEmail) throw new Error("Email environment variables are not configured");

    const sendEmail = async (to: string, subject: string, htmlBody: string) => {
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [to],
          subject,
          html: htmlBody,
        }),
      });
      if (!r.ok) {
        const t = await r.text();
        throw new Error(`Email sending failed: ${t}`);
      }
    };

    await Promise.all([
      sendEmail(adminEmail, `طلب استقطاب جديد - ${reference_number}`, html),
      sendEmail(
        body.email,
        `تأكيد استلام طلب الاستقطاب - ${reference_number}`,
        `<div dir="rtl" style="font-family:Arial,sans-serif;line-height:1.8">
          <h2>تم استلام طلب الاستقطاب بنجاح</h2>
          <p>شكرًا لك، تم استلام طلبك وسيتم التواصل معك بعد المراجعة.</p>
          ${html}
        </div>`
      ),
    ]);

    return new Response(JSON.stringify({ success: true, reference_number }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error?.message || "Unexpected error" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
