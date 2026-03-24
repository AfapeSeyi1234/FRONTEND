document.addEventListener("DOMContentLoaded", function () {
  const API = "http://localhost:5000";

  const sidebarAvatar = document.getElementById("sidebar-avatar");
  const sidebarName   = document.getElementById("sidebar-name");
  const sidebarDept   = document.getElementById("sidebar-department");
  const logoutBtn     = document.getElementById("logout-btn");

  // ── Auth + profile (your original logic, unchanged) ──────────────────────
  async function initPage() {
    const isAuthenticated = localStorage.getItem("isAuthenticated");
    if (!isAuthenticated || isAuthenticated !== "true") {
      window.location.href = "Login.html";
      return;
    }

    // Fast load from cache
    const cachedUser = localStorage.getItem("userProfile");
    if (cachedUser) {
      try {
        const user = JSON.parse(cachedUser);
        if (user.avatar && sidebarAvatar) sidebarAvatar.src = user.avatar;
        if (sidebarName) sidebarName.textContent = `${user.first_name} ${user.last_name}`;
        if (sidebarDept) sidebarDept.textContent = user.department.replace(/-/g, " ").toUpperCase();
      } catch (e) {
        console.error("Cache parse error", e);
      }
    }

    try {
      const response = await fetch(`${API}/api/profile`, { credentials: "include" });
      if (!response.ok) throw new Error("Unauthorized");

      const user = await response.json();
      localStorage.setItem("userProfile", JSON.stringify(user));

      if (user.avatar && sidebarAvatar) sidebarAvatar.src = user.avatar;
      if (sidebarName) sidebarName.textContent = `${user.first_name} ${user.last_name}`;
      if (sidebarDept) sidebarDept.textContent = user.department.replace(/-/g, " ").toUpperCase();
    } catch (error) {
      console.error("Auth error:", error);
      if (!cachedUser) {
        localStorage.clear();
        window.location.href = "Login.html";
      }
    }
  }

  initPage();

  // ── Menu mapping: food items filtered by day + meal type ─────────────────
  // ── Menu: exact food items per day per meal (from student questionnaire) ────
  const MENU_MAPPING = {
    "Monday": {
      "Breakfast": ["Bread & Egg", "Cereal"],
      "Lunch":     ["White Rice and Gbadun stew", "White rice and red stew", "Fried rice", "Moi Moi"],
      "Supper":    ["Macaroni", "Yam and egg sauce", "Yam and stew", "Boiled plantain and egg sauce", "Boiled plantain and stew"]
    },
    "Tuesday": {
      "Breakfast": ["Yam & Egg Sauce", "Moi Moi", "Custard", "Pap", "Akara", "Oat"],
      "Lunch":     ["Amala", "Semo", "Eba", "Poundo", "Ogbono soup", "Okro soup", "Egusi soup", "Efo soup", "Ewedu soup", "Oatmeal", "Bitterleaf soup", "Mixed okro", "Ukazi soup"],
      "Supper":    ["Rice and beans", "Only Rice"]
    },
    "Wednesday": {
      "Breakfast": ["Bread & Egg", "Cereal"],
      "Lunch":     ["Beans and Stew", "Porridge beans", "Spaghetti", "Wheat bread", "Fried plantain", "Fresh corn", "Fried macaroni", "Poundo yam/Eba with egusi stew", "Mixed okro soup and stew", "Ogbono with boiled egg"],
      "Supper":    ["Jollof spaghetti", "White spaghetti and egg sauce", "White spaghetti and stew"]
    },
    "Thursday": {
      "Breakfast": ["Moi Moi", "Custard", "Pap", "Akara", "Oat"],
      "Lunch":     ["Amala", "Semo", "Eba", "Poundo", "Ogbono soup", "Okro soup", "Egusi soup", "Efo soup", "Oatmeal", "Bitterleaf soup", "Mixed okro", "Ukazi soup"],
      "Supper":    ["Jollof rice", "Fried rice", "Jollof and fried rice"]
    },
    "Friday": {
      "Breakfast": ["Bread & Egg", "Cereal"],
      "Lunch":     ["White Beans", "Porridge beans", "Spaghetti", "Fried plantain"],
      "Supper":    ["Moin moin", "Porridge Yam", "Macaroni", "Plantain and egg sauce", "Efo riro and Eba"]
    },
    "Saturday": {
      "Breakfast": ["Bread & Egg", "Cereal"],
      "Lunch":     ["White rice and Gbadun stew", "White rice and Red stew", "Jollof rice"],
      "Supper":    ["Spaghetti", "Fried yam and stew", "Fried yam and egg sauce", "Fried potato and stew", "Fried potatoes and egg sauce"]
    },
    "Sunday": {
      "Breakfast": ["Boiled yam and egg sauce", "Akara with pap", "Oat", "Custard"],
      "Lunch":     ["Jollof spaghetti", "White Beans and Stew", "Porridge Beans"],
      "Supper":    ["Jollof spaghetti", "Rice and beans with stew", "Rice"]
    }
  };

  function updateFoodOptions() {
    const day      = document.getElementById("dayOfWeek").value;
    const mealType = document.querySelector('input[name="mealType"]:checked')?.value;
    const select   = document.getElementById("foodItem");

    select.innerHTML = '<option value="">Select food item</option>';

    if (!day || !mealType) return;

    const foods = MENU_MAPPING[day]?.[mealType];
    if (!foods || foods.length === 0) {
      const opt = document.createElement("option");
      opt.disabled = true;
      opt.textContent = "No meals served at this time";
      select.appendChild(opt);
      return;
    }

    foods.forEach(item => {
      const opt = document.createElement("option");
      opt.value = item;
      opt.textContent = item;
      select.appendChild(opt);
    });
  }

  // Re-filter food list whenever meal type radio changes
  document.querySelectorAll('input[name="mealType"]').forEach(radio => {
    radio.addEventListener("change", updateFoodOptions);
  });

  // No async fetch needed anymore — mapping is inline
  function loadMenuMapping() {
    // mapping already defined above, just trigger the date event
    dateInput.dispatchEvent(new Event("change"));
  }


  // ── Logout modal (your original logic, unchanged) ─────────────────────────
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
        localStorage.clear();
        window.location.href = "Login.html";
      } catch (error) {
        console.error("Logout failed:", error);
        window.location.href = "Login.html";
      }
    });
  }

  // ── Date + Day of Week (your original logic, unchanged) ───────────────────
  const dateInput = document.getElementById("date");
  const today     = new Date().toISOString().split("T")[0];
  dateInput.value = today;

  dateInput.addEventListener("change", function () {
    const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
    // T00:00:00 prevents timezone shifting the date by one day
    const selectedDate = new Date(this.value + "T00:00:00");
    const dayName = days[selectedDate.getDay()];
    const daySelect = document.getElementById("dayOfWeek");
    if (daySelect) daySelect.value = dayName;
    updateFoodOptions(); // refresh food list for new day
  });

  // Load mapping after dateInput is declared — triggers date change internally
  loadMenuMapping();

  // ── UI helpers ────────────────────────────────────────────────────────────
  function showMsg(elId, text, type = "loading") {
    const el = document.getElementById(elId);
    if (!el) return;
    el.textContent = text;
    el.className = `form-msg ${type}`;
  }

  function hideMsg(elId) {
    const el = document.getElementById(elId);
    if (!el) return;
    el.className = "form-msg";
    el.textContent = "";
  }

  function unlockSection2() {
    const section = document.getElementById("section2");
    const lock    = document.getElementById("section2-lock");
    section.classList.remove("locked-section");
    section.classList.add("unlocked");
    if (lock) lock.classList.add("hidden");
    setTimeout(() => {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 400);
  }

  function relockSection2() {
    const section = document.getElementById("section2");
    const lock    = document.getElementById("section2-lock");
    section.classList.add("locked-section");
    section.classList.remove("unlocked");
    if (lock) lock.classList.remove("hidden");
  }

  // ── Section 1: Prediction form → real ML API call ─────────────────────────
  document.getElementById("predictionForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    const btn = document.getElementById("predictBtn");
    btn.disabled = true;
    showMsg("predictMsg", "⏳ Generating prediction...", "loading");

    const payload = {
      day_of_week: document.getElementById("dayOfWeek").value,
      meal_type:   document.querySelector('input[name="mealType"]:checked').value,
      food_item:   document.getElementById("foodItem").value,
      // popularity_index is auto-calculated server-side — not sent by user
    };

    try {
      const res = await fetch(`${API}/api/predict`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        showMsg("predictMsg", `❌ ${data.error}`, "error");
        btn.disabled = false;
        return;
      }

      // Display results — Expected Students only
      document.getElementById("predictedStudents").textContent = data.predicted_students;

      // Show the results panel
      const resultsPanel = document.getElementById("predictionResults");
      resultsPanel.classList.add("show");

      hideMsg("predictMsg");

      // Save context for Section 2
      window._lastPrediction = {
        date:               dateInput.value,
        day_of_week:        payload.day_of_week,
        meal_type:          payload.meal_type,
        food_item:          payload.food_item,
        popularity_index:   data.popularity_index_used,
        predicted_students: data.predicted_students
      };

      // Unlock Section 2
      unlockSection2();

    } catch (err) {
      showMsg("predictMsg", `❌ Network error: ${err.message}`, "error");
    } finally {
      btn.disabled = false;
    }
  });

  // ── Section 2: Actuals form → save to DB + retrain ────────────────────────
  document.getElementById("actualsForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    const btn = document.getElementById("saveActualsBtn");
    btn.disabled = true;

    const retrainBanner = document.getElementById("retrainBanner");
    if (retrainBanner) retrainBanner.classList.remove("show");
    showMsg("actualsMsg", "💾 Saving actuals and retraining model...", "loading");

    const pred = window._lastPrediction || {};

    const payload = {
      date:               pred.date               || dateInput.value || null,
      day_of_week:        pred.day_of_week        || document.getElementById("dayOfWeek").value,
      meal_type:          pred.meal_type           || document.querySelector('input[name="mealType"]:checked').value,
      food_item:          pred.food_item           || document.getElementById("foodItem").value,
      popularity_index:   pred.popularity_index   || null,
      predicted_students: pred.predicted_students || null,
      actual_students:    parseInt(document.getElementById("actualStudents").value),
    };

    try {
      const res = await fetch(`${API}/api/actuals`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        showMsg("actualsMsg", `❌ ${data.error}`, "error");
        btn.disabled = false;
        return;
      }

      hideMsg("actualsMsg");

      // Show retrain banner with new metrics
      if (retrainBanner) {
        const metricsEl = document.getElementById("retrainMetrics");
        if (metricsEl && data.new_metrics) {
          const m = data.new_metrics;
          metricsEl.textContent = `R²: ${m.R2} | MAE: ${m.MAE} students | RMSE: ${m.RMSE}`;
        }
        retrainBanner.classList.add("show");
      }

      // Reset everything and re-lock Section 2
      this.reset();
      document.getElementById("predictionForm").reset();
      document.getElementById("predictionResults").classList.remove("show");
      window._lastPrediction = null;

      relockSection2();

      // Restore today's date
      dateInput.value = today;
      setTimeout(() => dateInput.dispatchEvent(new Event("change")), 0);

      updateTimestamp();

    } catch (err) {
      showMsg("actualsMsg", `❌ Network error: ${err.message}`, "error");
    } finally {
      btn.disabled = false;
    }
  });

  // ── Timestamp (your original logic, unchanged) ────────────────────────────
  function updateTimestamp() {
    const now = new Date();
    const timeString = now.toLocaleString("en-US", {
      weekday: "long", year: "numeric", month: "long",
      day: "numeric", hour: "2-digit", minute: "2-digit",
    });
    const el = document.getElementById("timestamp");
    if (el) el.textContent = `Last updated: ${timeString}`;
  }

  updateTimestamp();
  setInterval(updateTimestamp, 60000);
});