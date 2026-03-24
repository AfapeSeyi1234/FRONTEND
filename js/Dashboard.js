document.addEventListener("DOMContentLoaded", function () {
  const API = "http://localhost:5000";

  const sidebarAvatar = document.getElementById("sidebar-avatar");
  const sidebarName   = document.getElementById("sidebar-name");
  const sidebarDept   = document.getElementById("sidebar-department");
  const logoutBtn     = document.getElementById("logout-btn");

  // ── Auth + sidebar (original logic) ──────────────────────────────────────
  async function initDashboard() {
    const isAuthenticated = localStorage.getItem("isAuthenticated");
    if (!isAuthenticated || isAuthenticated !== "true") {
      window.location.href = "Login.html";
      return;
    }

    const cachedUser = localStorage.getItem("userProfile");
    if (cachedUser) {
      try {
        const user = JSON.parse(cachedUser);
        if (user.avatar) sidebarAvatar.src = user.avatar;
        sidebarName.textContent = `${user.first_name} ${user.last_name}`;
        sidebarDept.textContent = user.department.replace(/-/g, " ").toUpperCase();
      } catch (e) { console.error("Cache parse error", e); }
    }

    try {
      const response = await fetch(`${API}/api/profile`, { credentials: "include" });
      if (!response.ok) throw new Error("Unauthorized");
      const user = await response.json();
      localStorage.setItem("userProfile", JSON.stringify(user));
      if (user.avatar) sidebarAvatar.src = user.avatar;
      sidebarName.textContent = `${user.first_name} ${user.last_name}`;
      sidebarDept.textContent = user.department.replace(/-/g, " ").toUpperCase();
    } catch (error) {
      console.error("Auth error:", error);
      if (!localStorage.getItem("userProfile")) {
        localStorage.clear();
        window.location.href = "Login.html";
      }
    }
  }

  // ── Logout (original logic) ───────────────────────────────────────────────
  const logoutModal      = document.getElementById("logout-modal-overlay");
  const confirmLogoutBtn = document.getElementById("confirm-logout");
  const cancelLogoutBtn  = document.getElementById("cancel-logout");

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => logoutModal.classList.add("active"));
  }
  if (cancelLogoutBtn) {
    cancelLogoutBtn.addEventListener("click", () => logoutModal.classList.remove("active"));
  }
  if (logoutModal) {
    logoutModal.addEventListener("click", (e) => {
      if (e.target === logoutModal) logoutModal.classList.remove("active");
    });
  }
  if (confirmLogoutBtn) {
    confirmLogoutBtn.addEventListener("click", async function () {
      this.disabled = true;
      this.textContent = "Signing out...";
      try {
        await fetch(`${API}/api/logout`, { method: "POST", credentials: "include" });
        localStorage.removeItem("isAuthenticated");
        localStorage.removeItem("userProfile");
        window.location.href = "Login.html";
      } catch (error) {
        console.error("Logout failed:", error);
        window.location.href = "Login.html";
      }
    });
  }

  // ── Load chart + stats from backend ─────────────────────────────────────
  async function loadChartData() {
    try {
      const [chartRes, statsRes] = await Promise.all([
        fetch(`${API}/api/dashboard/chart`, { credentials: "include" }),
        fetch(`${API}/api/dashboard/stats`, { credentials: "include" }),
      ]);

      let stats = null;
      if (statsRes.ok) {
        stats = await statsRes.json();
        renderStats(stats);
      }

      if (chartRes.ok) {
        const chartData = await chartRes.json();
        const ORDER = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
        chartData.chart.sort((a, b) => ORDER.indexOf(a.day) - ORDER.indexOf(b.day));
        renderChart(chartData.chart);
        renderSummary(chartData.chart, stats);
      }
    } catch (err) {
      console.warn("Dashboard load failed:", err);
    }
  }

  // ── Render bar chart ──────────────────────────────────────────────────────
  // Each day: { date, day (short), students, source ("actual"|"average"|"none"), height_pct }
  function renderChart(days) {
    const chart   = document.getElementById("demandChart");
    const empty   = document.getElementById("chartEmpty");
    const tooltip = document.getElementById("chartTooltip");

    const hasData = days.some(d => d.students > 0);

    if (!hasData) {
      empty.style.display = "block";
      return;
    }
    empty.style.display = "none";

    // Clear previous bars (keep the empty message element)
    Array.from(chart.children).forEach(c => {
      if (c.id !== "chartEmpty") c.remove();
    });

    days.forEach(day => {
      const heightPct = day.students > 0 ? Math.max(6, day.height_pct) : 4;
      const isActual  = day.source === "actual";
      const isAvg     = day.source === "average";
      const isEmpty   = day.source === "none" || day.students === 0;

      // Bar colour: solid primary for real data, lighter for averages
      const barColor  = isActual ? "var(--primary)" : isAvg ? "#a0b4d6" : "#e0e7ff";

      const col = document.createElement("div");
      col.style.cssText = "flex:1;text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;";

      // Student count above bar
      const label = document.createElement("div");
      label.style.cssText = "font-size:10px;font-weight:700;color:var(--primary);margin-bottom:4px;min-height:14px;";
      label.textContent = day.students > 0 ? day.students.toLocaleString() : "";

      // Bar
      const bar = document.createElement("div");
      bar.style.cssText = `
        width:70%;height:${heightPct}%;
        background:${barColor};
        border-radius:6px 6px 0 0;
        transition:height 0.6s ease,background 0.2s;
        cursor:${isEmpty ? "default" : "pointer"};
      `;

      if (!isEmpty) {
        const sourceLabel = isActual ? "Actual predictions" : "Dataset average";
        bar.addEventListener("mouseenter", () => {
          bar.style.background = "#1a5ac5";
          tooltip.style.display = "block";
          tooltip.textContent = `${day.day}: ${day.students.toLocaleString()} students (${sourceLabel})`;
        });
        bar.addEventListener("mousemove", (e) => {
          const rect = chart.getBoundingClientRect();
          tooltip.style.left = `${e.clientX - rect.left - tooltip.offsetWidth / 2}px`;
          tooltip.style.top  = `${e.clientY - rect.top - 36}px`;
        });
        bar.addEventListener("mouseleave", () => {
          bar.style.background = barColor;
          tooltip.style.display = "none";
        });
      }

      // Day label below bar
      const dayLabel = document.createElement("p");
      dayLabel.className = "small";
      dayLabel.style.cssText = "margin:4px 0 0;font-weight:600;";
      dayLabel.textContent = day.day;

      col.appendChild(label);
      col.appendChild(bar);
      col.appendChild(dayLabel);
      chart.appendChild(col);
    });

    // Legend
    const legend = document.createElement("div");
    legend.style.cssText = "position:absolute;bottom:-24px;right:0;display:flex;gap:12px;font-size:10px;color:#64748b;";
    legend.innerHTML = `
      <span><span style="display:inline-block;width:10px;height:10px;background:var(--primary);border-radius:2px;margin-right:4px;"></span>Real data</span>
      <span><span style="display:inline-block;width:10px;height:10px;background:#a0b4d6;border-radius:2px;margin-right:4px;"></span>Dataset avg</span>
    `;
    chart.style.position = "relative";
    chart.appendChild(legend);
  }

  function renderSummary(days, stats) {
    const summary = document.getElementById("chartSummary");
    const total7  = days.reduce((s, d) => s + d.students, 0);

    if (total7 === 0) {
      summary.innerHTML = `<span style="color:#94a3b8;">No prediction data yet.</span>`;
      return;
    }

    const peak = days.reduce((best, d) => d.students > best.students ? d : best, days[0]);

    const row = (label, value) => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;
                  background:#f8fafc;border-radius:10px;border:1px solid #e0e7ff;">
        <span style="font-size:13px;color:#64748b;font-weight:600;">${label}</span>
        <span style="font-size:18px;font-weight:800;color:var(--primary);">${value}</span>
      </div>`;

    // Meal type badge for Most Demanded Meal
    const mealBg    = { Breakfast: "#dbeafe", Lunch: "#fef3c7", Supper: "#f3e8ff" };
    const mealColor = { Breakfast: "#1e40af", Lunch: "#92400e", Supper: "#7e22ce" };
    const meal      = (stats && stats.most_demanded_meal) || "—";
    const mealBadge = meal !== "—"
      ? `<span style="background:${mealBg[meal]||"#f1f5f9"};color:${mealColor[meal]||"#475569"};
                      padding:4px 16px;border-radius:999px;font-size:14px;font-weight:700;">${meal}</span>`
      : `<span style="color:#94a3b8;">—</span>`;

    summary.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:14px;">
        ${row("7-Day Total", total7.toLocaleString())}
        ${row("Peak Day",    peak.day)}
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;
                    background:#f8fafc;border-radius:10px;border:1px solid #e0e7ff;">
          <span style="font-size:13px;color:#64748b;font-weight:600;">Most Demanded Meal</span>
          ${mealBadge}
        </div>
      </div>`;
  }

  // ── Metrics cards (real data from /api/dashboard/stats) ─────────────────
  function renderStats(stats) {
    // Card 1 — Number of times user pressed Generate Prediction
    document.getElementById("metricTotalPredicted").textContent =
      stats.total_records > 0
        ? stats.total_records.toLocaleString()
        : "0";
    document.getElementById("metricTotalSub").textContent =
      stats.total_records > 0
        ? `${stats.total_records.toLocaleString()} demand forecasts made`
        : "No predictions yet";
    document.getElementById("metricTotalSub").style.color =
      stats.total_records > 0 ? "#16a34a" : "#94a3b8";

    // Card 2 — Average expected students (from dataset)
    document.getElementById("metricAvgStudents").textContent =
      stats.avg_expected_students > 0
        ? stats.avg_expected_students.toLocaleString()
        : "—";

    // Card 3 — Most predicted food item
    const topFood = document.getElementById("metricTopFood");
    topFood.textContent = stats.most_predicted_food || "—";
    topFood.style.fontSize = stats.most_predicted_food && stats.most_predicted_food.length > 15
      ? "14px" : "18px";
    document.getElementById("metricTopFoodSub").textContent = "Highest demand item";

    // Cache peak day from dataset so summary card always shows dataset-backed value
    if (stats.peak_day) {
      _cachedPeakDay = stats.peak_day;
      // Re-render summary if it's already showing (chart loaded before stats)
      const summary = document.getElementById("chartSummary");
      if (summary && summary.querySelector("div")) {
        const rows = summary.querySelectorAll("div > div");
        rows.forEach(r => {
          if (r.querySelector("span:first-child")?.textContent === "Peak Day") {
            r.querySelector("span:last-child").textContent = stats.peak_day;
          }
        });
      }
    }
  }

  // ── Init ──────────────────────────────────────────────────────────────────
  initDashboard();
  loadChartData();

  // Auto-refresh chart every 60 seconds so it stays live
  setInterval(loadChartData, 60000);
});