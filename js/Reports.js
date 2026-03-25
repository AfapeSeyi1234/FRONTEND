document.addEventListener("DOMContentLoaded", function () {
  const API      = window.API_BASE_URL;
  let currentPage = 1;
  const PER_PAGE  = 10;

  // ── Auth + sidebar ──────────────────────────────────────────────────────────
  async function initPage() {
    const isAuthenticated = localStorage.getItem("isAuthenticated");
    if (!isAuthenticated || isAuthenticated !== "true") {
      window.location.href = "Login.html";
      return;
    }

    const cachedUser = localStorage.getItem("userProfile");
    if (cachedUser) {
      try {
        const user = JSON.parse(cachedUser);
        if (user.avatar) document.getElementById("sidebar-avatar").src = user.avatar;
        document.getElementById("sidebar-name").textContent = `${user.first_name} ${user.last_name}`;
        document.getElementById("sidebar-department").textContent =
          user.department.replace(/-/g, " ").toUpperCase();
      } catch (e) {}
    }

    try {
      const res = await fetch(`${API}/api/profile`, { credentials: "include" });
      if (!res.ok) throw new Error("Unauthorized");
      const user = await res.json();
      localStorage.setItem("userProfile", JSON.stringify(user));
      if (user.avatar) document.getElementById("sidebar-avatar").src = user.avatar;
      document.getElementById("sidebar-name").textContent = `${user.first_name} ${user.last_name}`;
      document.getElementById("sidebar-department").textContent =
        user.department.replace(/-/g, " ").toUpperCase();
    } catch (err) {
      if (!cachedUser) {
        localStorage.clear();
        window.location.href = "Login.html";
      }
    }
  }

  // ── Meal type badge colours ─────────────────────────────────────────────────
  function mealBadge(mealType) {
    const styles = {
      "Breakfast": "background:#dbeafe;color:#1e40af;",
      "Lunch":     "background:#fef3c7;color:#92400e;",
      "Supper":    "background:#f3e8ff;color:#7e22ce;",
      "Dinner":    "background:#f3e8ff;color:#7e22ce;",
    };
    const style = styles[mealType] || "background:#f1f5f9;color:#475569;";
    return `<span style="${style}padding:4px 10px;border-radius:4px;font-size:11px;font-weight:700;">${mealType}</span>`;
  }

  // ── Format date ─────────────────────────────────────────────────────────────
  function formatDate(dateStr) {
    if (!dateStr) return "—";
    try {
      const d = new Date(dateStr + "T00:00:00");
      return d.toLocaleDateString("en-GB", {
        day: "2-digit", month: "short", year: "numeric"
      });
    } catch (_) { return dateStr; }
  }

  // ── Accuracy badge ──────────────────────────────────────────────────────────
  function accuracyBadge(predicted, actual) {
    if (!predicted || !actual) return '<span style="color:#94a3b8;font-style:italic;">—</span>';
    const pct  = Math.abs(predicted - actual) / actual * 100;
    const diff = actual - predicted;
    const sign = diff >= 0 ? "+" : "";
    if (pct <= 5) {
      return `<span style="background:#dcfce7;color:#166534;padding:3px 10px;border-radius:999px;font-size:11px;font-weight:700;">
                ✓ ${sign}${diff} (${pct.toFixed(1)}% off)
              </span>`;
    } else if (pct <= 15) {
      return `<span style="background:#fef9c3;color:#854d0e;padding:3px 10px;border-radius:999px;font-size:11px;font-weight:700;">
                ~ ${sign}${diff} (${pct.toFixed(1)}% off)
              </span>`;
    } else {
      return `<span style="background:#fee2e2;color:#991b1b;padding:3px 10px;border-radius:999px;font-size:11px;font-weight:700;">
                ✗ ${sign}${diff} (${pct.toFixed(1)}% off)
              </span>`;
    }
  }

  // ── Fetch and render reports ────────────────────────────────────────────────
  async function loadReports(page) {
    document.getElementById("loadingMsg").style.display = "inline";
    try {
      const res = await fetch(
        `${API}/api/reports?page=${page}&per_page=${PER_PAGE}`,
        { credentials: "include" }
      );

      if (!res.ok) {
        document.getElementById("reportTableBody").innerHTML =
          `<tr><td colspan="6" style="text-align:center;color:#dc2626;padding:32px;">
             Failed to load reports.
           </td></tr>`;
        return;
      }

      const data = await res.json();

      // ── Stats cards ────────────────────────────────────────────────────────
      document.getElementById("statTotal").textContent = data.stats.total_predictions;
      document.getElementById("statToday").textContent = data.stats.completed_today;

      // ── Table rows ─────────────────────────────────────────────────────────
      const tbody = document.getElementById("reportTableBody");

      if (!data.records || data.records.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#94a3b8;padding:32px;">
          No records yet — predictions will appear here after use.
        </td></tr>`;
      } else {
        tbody.innerHTML = data.records.map((r, i) => `
          <tr ${i % 2 === 1 ? 'style="background:#f8fafc"' : ''}>
            <td>
              <div style="font-weight:700;">${formatDate(r.record_date)}</div>
              <div style="font-size:11px;color:#64748b;">${r.day_of_week || "—"}</div>
            </td>
            <td>${mealBadge(r.meal_type)}</td>
            <td style="font-weight:500;">${r.food_item || "—"}</td>
            <td style="font-weight:700;color:var(--primary);font-size:1.05rem;">
              ${r.predicted_students != null ? r.predicted_students.toLocaleString() : "—"}
            </td>
            <td style="font-weight:700;color:#166534;font-size:1.05rem;">
              ${r.actual_students != null ? r.actual_students.toLocaleString() : 
                '<span style="color:#94a3b8;font-style:italic;font-weight:400;">Pending</span>'}
            </td>
            <td>${accuracyBadge(r.predicted_students, r.actual_students)}</td>
          </tr>
        `).join("");
      }

      // ── Pagination info ────────────────────────────────────────────────────
      const start = (page - 1) * PER_PAGE + 1;
      const end   = Math.min(page * PER_PAGE, data.total);
      document.getElementById("paginationInfo").textContent =
        data.total === 0 ? "No entries" : `Showing ${start} to ${end} of ${data.total} entries`;

      // ── Pagination buttons ─────────────────────────────────────────────────
      renderPagination(page, data.total_pages);

    } catch (err) {
      document.getElementById("reportTableBody").innerHTML =
        `<tr><td colspan="6" style="text-align:center;color:#dc2626;padding:32px;">
           Network error: ${err.message}
         </td></tr>`;
    } finally {
      document.getElementById("loadingMsg").style.display = "none";
    }
  }

  // ── Pagination buttons ──────────────────────────────────────────────────────
  function renderPagination(current, totalPages) {
    const container = document.getElementById("paginationBtns");
    container.innerHTML = "";

    if (totalPages <= 1) return; // no pagination needed for single page

    function makeBtn(label, targetPage, isActive, isDisabled) {
      const btn = document.createElement("button");
      btn.innerHTML = label;
      btn.disabled  = isDisabled;
      btn.style.cssText = [
        "padding:6px 10px",
        "border:1px solid #e0e7ff",
        "border-radius:6px",
        "font-size:13px",
        "font-weight:600",
        "transition:all 0.2s",
        isDisabled ? "cursor:not-allowed;opacity:0.4;" : "cursor:pointer;",
        isActive   ? "background:var(--primary);color:#fff;" : "background:#fff;color:#374151;",
      ].join(";");

      if (!isDisabled) {
        btn.onclick = () => {
          currentPage = targetPage;
          loadReports(currentPage);
          // scroll table back to top
          document.querySelector(".table-wrapper").scrollIntoView({ behavior: "smooth" });
        };
      }
      return btn;
    }

    // ◀ Previous
    container.appendChild(makeBtn("◀ Prev", current - 1, false, current === 1));

    // Page number buttons — show window of 5 around current page
    const start = Math.max(1, current - 2);
    const end   = Math.min(totalPages, current + 2);

    if (start > 1) {
      container.appendChild(makeBtn("1", 1, false, false));
      if (start > 2) {
        const dots = document.createElement("span");
        dots.textContent = "…";
        dots.style.cssText = "padding:6px 4px;color:#94a3b8;";
        container.appendChild(dots);
      }
    }

    for (let p = start; p <= end; p++) {
      container.appendChild(makeBtn(p, p, p === current, false));
    }

    if (end < totalPages) {
      if (end < totalPages - 1) {
        const dots = document.createElement("span");
        dots.textContent = "…";
        dots.style.cssText = "padding:6px 4px;color:#94a3b8;";
        container.appendChild(dots);
      }
      container.appendChild(makeBtn(totalPages, totalPages, false, false));
    }

    // Next ▶
    container.appendChild(makeBtn("Next ▶", current + 1, false, current === totalPages));
  }

  // ── Logout ──────────────────────────────────────────────────────────────────
  const logoutModal = document.getElementById("logout-modal-overlay");
  document.getElementById("logout-btn").addEventListener("click", () =>
    logoutModal.classList.add("active"));
  document.getElementById("cancel-logout").addEventListener("click", () =>
    logoutModal.classList.remove("active"));
  logoutModal.addEventListener("click", (e) => {
    if (e.target === logoutModal) logoutModal.classList.remove("active");
  });
  document.getElementById("confirm-logout").addEventListener("click", async function () {
    this.disabled = true;
    this.textContent = "Signing out...";
    try {
      await fetch(`${API}/api/logout`, { method: "POST", credentials: "include" });
      localStorage.clear();
      window.location.href = "Login.html";
    } catch (_) { window.location.href = "Login.html"; }
  });

  // ── Init ────────────────────────────────────────────────────────────────────
  initPage();
  loadReports(currentPage);
});