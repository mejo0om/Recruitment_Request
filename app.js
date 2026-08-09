const positionsContainer = document.getElementById("positions");
const template = document.getElementById("positionTemplate");
const addPositionBtn = document.getElementById("addPosition");
const form = document.getElementById("recruitmentForm");
const submitBtn = document.getElementById("submitBtn");
const formMessage = document.getElementById("formMessage");
const successDialog = document.getElementById("successDialog");
const referenceNumber = document.getElementById("referenceNumber");
const closeDialog = document.getElementById("closeDialog");

function refreshPositionNumbers() {
  [...positionsContainer.querySelectorAll(".position-card")].forEach((card, i) => {
    card.querySelector(".position-number").textContent = i + 1;
    const remove = card.querySelector(".remove-position");
    remove.style.display = positionsContainer.children.length > 1 ? "inline-block" : "none";
  });
}

function addPosition() {
  const node = template.content.cloneNode(true);
  const card = node.querySelector(".position-card");
  card.querySelector(".remove-position").addEventListener("click", () => {
    card.remove();
    refreshPositionNumbers();
  });
  positionsContainer.appendChild(node);
  refreshPositionNumbers();
}

addPositionBtn.addEventListener("click", addPosition);
addPosition();

closeDialog.addEventListener("click", () => successDialog.close());

function collectPositions() {
  return [...positionsContainer.querySelectorAll(".position-card")].map(card => {
    const data = {};
    card.querySelectorAll("[data-field]").forEach(el => {
      data[el.dataset.field] = el.value.trim();
    });
    data.quantity = Number(data.quantity || 0);
    data.experience_years = data.experience_years === "" ? null : Number(data.experience_years);
    data.salary = data.salary === "" ? null : Number(data.salary);
    return data;
  });
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  formMessage.textContent = "";
  formMessage.className = "form-message";

  const endpoint = window.APP_CONFIG?.endpoint || "";
  if (!endpoint || endpoint.includes("YOUR_PROJECT")) {
    formMessage.textContent = "يرجى إعداد رابط Supabase Edge Function داخل ملف config.js أولاً.";
    formMessage.classList.add("error");
    return;
  }

  const fd = new FormData(form);
  const payload = {
    employer_name: fd.get("employer_name"),
    mobile: fd.get("mobile"),
    email: fd.get("email"),
    employer_city: fd.get("employer_city"),
    company_name: fd.get("company_name"),
    cr_number: fd.get("cr_number"),
    company_address: fd.get("company_address"),
    notes: fd.get("notes"),
    positions: collectPositions()
  };

  try {
    submitBtn.disabled = true;
    submitBtn.querySelector("span").textContent = "جاري إرسال الطلب...";

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(payload)
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.error || "تعذر إرسال الطلب");

    referenceNumber.textContent = result.reference_number;
    successDialog.showModal();
    form.reset();
    positionsContainer.innerHTML = "";
    addPosition();
  } catch (err) {
    formMessage.textContent = err.message || "حدث خطأ غير متوقع. حاول مرة أخرى.";
    formMessage.classList.add("error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.querySelector("span").textContent = "إرسال طلب الاستقطاب";
  }
});