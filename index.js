const faNum = (n) => Number(n).toLocaleString("fa-IR");
const faDay = (n) => Number(n).toLocaleString("fa-IR", { useGrouping: false });

const tbody = document.getElementById("tableBody");
const noticeEl = document.getElementById("notice");
const pageTitle = document.getElementById("pageTitle");

const dialog = document.getElementById("expenseDialog");
const titleEl = document.getElementById("modalTitle");
const amountEl = document.getElementById("modalAmount");
const descEl = document.getElementById("modalDesc");
const subsSection = document.getElementById("subsSection");
const subsBody = document.getElementById("modalSubs");
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

  // subs breakdown
  subsBody.innerHTML = "";
  if (item.subs && item.subs.length) {
    subsSection.style.display = "block";
    item.subs.forEach((sub) => {
      const tr = document.createElement("tr");
      const tdTitle = document.createElement("td");
      tdTitle.textContent = sub.title;
      const tdAmount = document.createElement("td");
      tdAmount.className = "total";
      tdAmount.textContent = faNum(sub.amount);
      tr.appendChild(tdTitle);
      tr.appendChild(tdAmount);
      subsBody.appendChild(tr);
    });
  } else {
    subsSection.style.display = "none";
  }

  // images
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

function render(data) {
  if (data.title) {
    pageTitle.textContent = data.title;
    document.title = data.title;
  }
  if (data.notice) noticeEl.textContent = data.notice;

  tbody.innerHTML = "";
  let grandTotal = 0;

  (data.months || []).forEach((month) => {
    const monthTotal = month.items.reduce((acc, it) => acc + it.amount, 0);
    grandTotal += monthTotal;
    // no subs in the table anymore → one row per item → rowspan = items.length
    const monthSpan = month.items.length;

    month.items.forEach((item, itemIndex) => {
      const tr = document.createElement("tr");
      tr.className = "expense";
      if (item.paid === false) tr.classList.add("unpaid");
      tr.tabIndex = 0;
      tr.setAttribute("role", "button");
      tr.setAttribute("aria-haspopup", "dialog");
      tr.dataset.month = month.name;
      tr.dataset.item = JSON.stringify(item);

      if (itemIndex === 0) {
        const tdMonth = document.createElement("td");
        tdMonth.className = "month";
        tdMonth.rowSpan = monthSpan;
        tdMonth.textContent = month.name;
        tr.appendChild(tdMonth);
      }

      const tdDate = document.createElement("td");
      tdDate.className = "date";
      tdDate.textContent = faDay(item.day);
      tr.appendChild(tdDate);

      // title cell: title on line 1, badges on line 2
      const tdCat = document.createElement("td");
      tdCat.className = "cat";

      const inner = document.createElement("div");
      inner.className = "cat-inner";

      const titleSpan = document.createElement("span");
      titleSpan.className = "cat-title";
      titleSpan.textContent = item.title;
      inner.appendChild(titleSpan);

      const badges = document.createElement("span");
      badges.className = "cat-badges";

      const hasDesc = !!(item.desc && item.desc.trim());
      const hasImages = !!(item.images && item.images.length);
      const hasDetails =
        hasDesc || hasImages || (item.subs && item.subs.length);

      if (hasDetails) {
        const b = document.createElement("span");
        b.className = "badge badge-detail";
        b.textContent = "جزئیات";
        badges.appendChild(b);
      }
      if (item.paid === false) {
        const b = document.createElement("span");
        b.className = "badge badge-unpaid";
        b.textContent = "پرداخت نشده";
        badges.appendChild(b);
      }

      if (badges.childNodes.length) inner.appendChild(badges);
      tdCat.appendChild(inner);
      tr.appendChild(tdCat);

      const tdTotal = document.createElement("td");
      tdTotal.className = "total";
      tdTotal.textContent = faNum(item.amount);
      tr.appendChild(tdTotal);

      tbody.appendChild(tr);
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

fetch("data.json")
  .then((res) => {
    if (!res.ok) throw new Error("HTTP " + res.status);
    return res.json();
  })
  .then(render)
  .catch((err) => {
    console.error(err);
    showError("خطا در بارگذاری داده‌ها.");
  });

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
