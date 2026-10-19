const faNum = (n) => Number(n).toLocaleString("fa-IR");
const faDay = (n) => Number(n).toLocaleString("fa-IR", { useGrouping: false });

const tbody = document.getElementById("tableBody");
const noticeEl = document.getElementById("notice");
const pageTitle = document.getElementById("pageTitle");

/* ---------- MODAL ---------- */
const dialog = document.getElementById("expenseDialog");
const titleEl = document.getElementById("modalTitle");
const amountEl = document.getElementById("modalAmount");
const descEl = document.getElementById("modalDesc");
const gallerySection = document.getElementById("gallerySection");
const galleryEl = document.getElementById("modalGallery");
const closeBtn = document.getElementById("modalClose");

function openModal(item, monthName) {
  titleEl.textContent = item.title;
  const small = document.createElement("small");
  small.textContent = monthName + " — " + faDay(item.day);
  titleEl.appendChild(small);

  amountEl.textContent = faNum(item.amount) + " تومان";

  descEl.textContent = item.desc || "";
  descEl.style.display = item.desc ? "block" : "none";

  galleryEl.innerHTML = "";
  if (item.images && item.images.length) {
    gallerySection.style.display = "block";
    item.images.forEach((src, i) => {
      const a = document.createElement("a");
      a.href = src;
      a.target = "_blank";
      a.rel = "noopener";
      const img = document.createElement("img");
      img.src = src;
      img.alt = "تصویر فاکتور " + faNum(i + 1);
      img.loading = "lazy";
      img.onerror = () => {
        a.textContent = "تصویر بارگذاری نشد";
        a.style.cssText =
          "display:flex;align-items:center;justify-content:center;font-size:0.75rem;color:#999;";
      };
      a.appendChild(img);
      galleryEl.appendChild(a);
    });
  } else {
    gallerySection.style.display = "none";
  }

  dialog.showModal();
}

/* ---------- RENDER ---------- */
function render(data) {
  if (data.title) {
    pageTitle.textContent = data.title;
    document.title = data.title;
  }
  if (data.notice) noticeEl.textContent = data.notice;

  tbody.innerHTML = "";
  let grandTotal = 0;

  (data.months || []).forEach((month) => {
    const monthSpan =
      month.items.length +
      month.items.reduce((acc, it) => acc + (it.subs ? it.subs.length : 0), 0);
    const monthTotal = month.items.reduce((acc, it) => acc + it.amount, 0);
    grandTotal += monthTotal;

    month.items.forEach((item, itemIndex) => {
      const tr = document.createElement("tr");
      tr.className = "expense";
      if (item.paid === false) {
        tr.classList.add("unpaid");
      }
      tr.tabIndex = 0;
      tr.setAttribute("role", "button");
      tr.setAttribute("aria-haspopup", "dialog");
      tr.dataset.month = month.name;
      // store item as JSON for the modal (or use an index; JSON is simplest here)
      tr.dataset.item = JSON.stringify(item);

      const hasDesc = item.desc && item.desc.trim().length > 0;
      const hasImages = item.images && item.images.length > 0;

      if (itemIndex === 0) {
        const tdMonth = document.createElement("td");
        tdMonth.className = "month";
        tdMonth.rowSpan = monthSpan;
        tdMonth.textContent = month.name;
        tr.appendChild(tdMonth);
      }

      const tdDate = document.createElement("td");
      tdDate.className = "date";
      tdDate.rowSpan = 1 + (item.subs ? item.subs.length : 0);
      tdDate.textContent = faDay(item.day);
      tr.appendChild(tdDate);

      const tdCat = document.createElement("td");
      tdCat.className = "cat" + (hasDesc || hasImages ? " has-detail" : "");
      tdCat.textContent = item.title;
      if (hasDesc || hasImages) {
        const sr = document.createElement("span");
        sr.className = "sr-only";
        sr.textContent = " (جزئیات دارد)";
        tdCat.appendChild(sr);
      }
      tr.appendChild(tdCat);

      const tdTotal = document.createElement("td");
      tdTotal.className = "total";
      tdTotal.textContent = faNum(item.amount);
      tr.appendChild(tdTotal);

      tbody.appendChild(tr);

      (item.subs || []).forEach((sub) => {
        const subTr = document.createElement("tr");
        const tdSub = document.createElement("td");
        tdSub.className = "sub";
        tdSub.textContent = sub.title;
        const tdSubTotal = document.createElement("td");
        tdSubTotal.className = "subtotal";
        if (item.paid === false) subTr.classList.add("unpaid");
        tdSubTotal.textContent = faNum(sub.amount);
        subTr.appendChild(tdSub);
        subTr.appendChild(tdSubTotal);
        tbody.appendChild(subTr);
      });
    });

    const subTr = document.createElement("tr");
    subTr.className = "subtotal";
    const tdLabel = document.createElement("td");
    tdLabel.colSpan = 3;
    tdLabel.textContent = "جمع " + month.name;
    const tdSum = document.createElement("td");
    tdSum.className = "total";
    tdSum.textContent = faNum(monthTotal);
    subTr.appendChild(tdLabel);
    subTr.appendChild(tdSum);
    tbody.appendChild(subTr);
  });

  const grandTr = document.createElement("tr");
  grandTr.className = "grand-total";
  const gLabel = document.createElement("td");
  gLabel.colSpan = 3;
  gLabel.textContent = "جمع کل";
  const gSum = document.createElement("td");
  gSum.className = "total";
  gSum.textContent = faNum(grandTotal);
  grandTr.appendChild(gLabel);
  grandTr.appendChild(gSum);
  tbody.appendChild(grandTr);
}

function showError(msg) {
  tbody.innerHTML =
    '<tr><td colspan="4" class="status-msg error">' + msg + "</td></tr>";
}

/* ---------- LOAD DATA ---------- */
fetch("https://ohinibla.github.io/building/data.json")
  .then((res) => {
    if (!res.ok) throw new Error("HTTP " + res.status);
    return res.json();
  })
  .then(render)
  .catch((err) => {
    console.error(err);
    showError(
      "خطا در بارگذاری داده‌ها. اگر فایل را مستقیم از دیسک باز کرده‌اید، " +
      "لطفاً آن را روی یک وب‌سرور ساده اجرا کنید.",
    );
  });

/* ---------- EVENTS ---------- */
tbody.addEventListener("click", (e) => {
  const tr = e.target.closest("tr.expense");
  if (!tr) return;
  openModal(JSON.parse(tr.dataset.item), tr.dataset.month);
});

tbody.addEventListener("keydown", (e) => {
  if (e.key !== "Enter" && e.key !== " ") return;
  const tr = e.target.closest("tr.expense");
  if (!tr) return;
  e.preventDefault();
  openModal(JSON.parse(tr.dataset.item), tr.dataset.month);
});

closeBtn.addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (e) => {
  if (e.target === dialog) dialog.close();
});
