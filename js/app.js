/**
 * SQL Journey — Main Application Logic
 * จัดการ SQLite Engine, Theme Switcher, Lessons, Editor, Schema Explorer และ Challenge Checker
 */

// ==========================================
// STATE MANAGEMENT
// ==========================================
let db = null;
let SQL = null;
let activeLessonIndex = 0;
let currentCategoryFilter = "all";
let searchQuery = "";
let completedLessons = new Set();

// DOM Element References
const editor = document.getElementById("sqlEditor");
const resultArea = document.getElementById("result");
const lessonList = document.getElementById("lessonList");
const statusDot = document.getElementById("statusDot");
const statusText = document.getElementById("statusText");
const themeToggleBtn = document.getElementById("themeToggleBtn");
const progressPctEl = document.getElementById("progressPct");
const progressBarFillEl = document.getElementById("progressBarFill");
const progressPillEl = document.getElementById("progressPill");
const categoryFilterContainer = document.getElementById("categoryFilter");
const lessonSearchInput = document.getElementById("lessonSearchInput");
const schemaModal = document.getElementById("schemaModal");

// ==========================================
// 1. THEME MANAGEMENT (Default: Light Mode)
// ==========================================
function initTheme() {
  const savedTheme = localStorage.getItem("sqlJourneyTheme");
  // Default to 'light' if not set
  const theme = savedTheme || "light";
  setTheme(theme);
}

function setTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("sqlJourneyTheme", theme);
  
  if (themeToggleBtn) {
    themeToggleBtn.innerHTML = theme === "dark" ? "☀️" : "🌙";
    themeToggleBtn.setAttribute("title", theme === "dark" ? "เปลี่ยนเป็นโหมดสว่าง (Light Mode)" : "เปลี่ยนเป็นโหมดมืด (Dark Mode)");
  }
}

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme") || "light";
  const newTheme = current === "dark" ? "light" : "dark";
  setTheme(newTheme);
}

// ==========================================
// 2. PROGRESS MANAGEMENT
// ==========================================
function loadProgress() {
  try {
    const saved = localStorage.getItem("sqlJourneyCompletedLessons");
    if (saved) {
      completedLessons = new Set(JSON.parse(saved));
    }
  } catch (e) {
    completedLessons = new Set();
  }
  updateProgressUI();
}

function markLessonCompleted(lessonId) {
  completedLessons.add(lessonId);
  try {
    localStorage.setItem("sqlJourneyCompletedLessons", JSON.stringify([...completedLessons]));
  } catch (e) {
    console.error("Failed to save progress", e);
  }
  updateProgressUI();
  renderLessons();
}

function updateProgressUI() {
  const total = lessons.length;
  const done = completedLessons.size;
  const pct = Math.round((done / total) * 100);

  if (progressPctEl) progressPctEl.textContent = `${pct}% (${done}/${total})`;
  if (progressBarFillEl) progressBarFillEl.style.width = `${pct}%`;
  if (progressPillEl) progressPillEl.textContent = `ความคืบหน้า ${done}/${total} บท (${pct}%)`;

  const lessonCountStat = document.getElementById("lessonCountStat");
  if (lessonCountStat) lessonCountStat.textContent = `${total} บทเรียนพร้อมแบบฝึกหัด`;
}

// ==========================================
// 3. DATABASE (SQLite WASM) PERSISTENCE
// ==========================================
// เปลี่ยน key เมื่อ seed data เปลี่ยนโครงสร้าง เพื่อให้ผู้ใช้เดิมได้ฐานข้อมูลชุดใหม่อัตโนมัติ
const DB_STORAGE_KEY = "sqlJourneyDatabase_v4";

function bytesToBase64(bytes) {
  // แปลงเป็น binary string แบบแบ่ง chunk ป้องกัน RangeError จาก call stack เมื่อ DB ใหญ่
  const CHUNK_SIZE = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK_SIZE));
  }
  return btoa(binary);
}

function saveDatabase() {
  if (!db) return;
  try {
    const base64 = bytesToBase64(db.export());
    localStorage.setItem(DB_STORAGE_KEY, base64);
  } catch (e) {
    console.warn("Could not persist database to localStorage", e);
  }
}

function loadSavedDatabase() {
  try {
    const saved = localStorage.getItem(DB_STORAGE_KEY);
    if (!saved) return null;
    const binary = atob(saved);
    const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
    return new SQL.Database(bytes);
  } catch (e) {
    console.warn("Could not load database from localStorage", e);
    return null;
  }
}

function resetDatabase() {
  const confirmed = confirm("ต้องการล้างข้อมูลที่แก้ไข และคืนฐานข้อมูลเป็นค่าเริ่มต้นใช่หรือไม่?");
  if (!confirmed) return;

  try {
    db = new SQL.Database();
    db.run(initialSQL);
    saveDatabase();
    showToast("รีเซ็ตฐานข้อมูลเรียบร้อยแล้ว", "success");
    resultArea.innerHTML = `<div class="message success">✅ รีเซ็ตฐานข้อมูล E-Commerce เรียบร้อยแล้ว พร้อมสำหรับเริ่มเรียนรู้ใหม่</div>`;
  } catch (e) {
    showToast("เกิดข้อผิดพลาดในการรีเซ็ต: " + e.message, "error");
  }
}

// ==========================================
// 4. LESSON RENDERING & NAVIGATION
// ==========================================
function renderCategoryFilters() {
  if (!categoryFilterContainer) return;
  categoryFilterContainer.innerHTML = categoriesList.map(cat => `
    <button class="filter-chip ${cat.id === currentCategoryFilter ? "active" : ""}" data-category="${cat.id}">
      ${cat.label}
    </button>
  `).join("");

  categoryFilterContainer.querySelectorAll(".filter-chip").forEach(btn => {
    btn.addEventListener("click", () => {
      currentCategoryFilter = btn.dataset.category;
      renderCategoryFilters();
      renderLessons();
    });
  });
}

function renderLessons() {
  if (!lessonList) return;

  const filtered = lessons.filter(lesson => {
    const matchesCat = currentCategoryFilter === "all" || lesson.category === currentCategoryFilter;
    const matchesSearch = !searchQuery || 
      lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      lesson.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  if (filtered.length === 0) {
    lessonList.innerHTML = `<div style="padding: 14px; text-align: center; color: var(--muted); font-size: 0.84rem;">ไม่พบบทเรียนที่ค้นหา</div>`;
    return;
  }

  lessonList.innerHTML = filtered.map(lesson => {
    const isCompleted = completedLessons.has(lesson.id);
    const isActive = lessons[activeLessonIndex]?.id === lesson.id;
    return `
      <button class="lesson-btn ${isActive ? "active" : ""}" data-id="${lesson.id}">
        <div class="lesson-btn-content">
          <span class="lesson-btn-number">${escapeHtml(lesson.level)}</span>
          <span class="lesson-btn-title">${escapeHtml(lesson.title)}</span>
        </div>
        ${isCompleted ? '<span class="lesson-badge-done" title="ผ่านแล้ว">✓</span>' : ''}
      </button>
    `;
  }).join("");

  lessonList.querySelectorAll(".lesson-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = Number(btn.dataset.id);
      const index = lessons.findIndex(l => l.id === id);
      if (index !== -1) {
        activeLessonIndex = index;
        showLesson();
        renderLessons();
      }
    });
  });
}

function showLesson() {
  const lesson = lessons[activeLessonIndex];
  if (!lesson) return;

  const levelEl = document.getElementById("lessonLevel");
  const titleEl = document.getElementById("lessonTitle");
  const descEl = document.getElementById("lessonDescription");
  const tipEl = document.getElementById("lessonTip");
  const challengeBoxEl = document.getElementById("challengeBox");
  const prevBtn = document.getElementById("prevLessonBtn");
  const nextBtn = document.getElementById("nextLessonBtn");

  if (levelEl) levelEl.textContent = lesson.level;
  if (titleEl) titleEl.textContent = lesson.title;
  // Security note: description/tip/hint เป็น trusted HTML จาก static lessons.js เท่านั้น
  // ห้ามนำมาใช้กับข้อมูลจากภายนอก (API/ผู้ใช้) โดยตรง — ต้อง escape ก่อนเสมอ
  if (descEl) descEl.innerHTML = lesson.description;
  if (tipEl) tipEl.innerHTML = `<strong>💡 เคล็ดลับ:</strong> ${lesson.tip}`;

  // Challenge Box
  if (challengeBoxEl) {
    if (lesson.challenge) {
      const isDebug = lesson.type === "debug";
      challengeBoxEl.style.display = "flex";
      challengeBoxEl.className = `challenge-box${isDebug ? " is-debug" : ""}`;
      challengeBoxEl.innerHTML = `
        <div class="challenge-header">
          <div class="challenge-title">
            <span>${isDebug ? "🔧" : "🎯"}</span>
            <strong>${isDebug ? "ภารกิจ: แก้ Query ให้ถูกต้อง" : "โจทย์ท้าทายประจำบท"}</strong>
          </div>
          <span class="challenge-badge">${completedLessons.has(lesson.id) ? "✅ ผ่านแล้ว" : (isDebug ? "🐛 มีบั๊ก" : "⚡ แบบฝึกหัด")}</span>
        </div>
        <p class="challenge-desc">${lesson.challenge.question}</p>
        <div class="challenge-actions">
          <button class="btn btn-challenge" id="checkSolutionBtn">🔍 ตรวจสอบคำตอบ</button>
          <button class="btn btn-secondary" style="font-size: 0.76rem; padding: 4px 8px;" id="showHintBtn">💡 ดูคำใบ้</button>
        </div>
        <div id="challengeFeedback" style="display: none;"></div>
      `;

      document.getElementById("checkSolutionBtn")?.addEventListener("click", () => checkChallengeSolution(lesson));
      document.getElementById("showHintBtn")?.addEventListener("click", () => {
        const fb = document.getElementById("challengeFeedback");
        if (fb) {
          fb.style.display = "block";
          fb.className = "message";
          // hint เป็น trusted HTML จาก static lessons.js
          fb.innerHTML = `<strong>คำใบ้:</strong> ${lesson.challenge.hint}`;
        }
      });
    } else {
      challengeBoxEl.style.display = "none";
    }
  }

  // Prev / Next button state
  if (prevBtn) prevBtn.disabled = activeLessonIndex === 0;
  if (nextBtn) nextBtn.disabled = activeLessonIndex === lessons.length - 1;

  editor.value = lesson.sql;
  resultArea.innerHTML = lesson.type === "debug"
    ? `<div class="message">🐛 Editor โหลดโค้ดที่<strong>มีบั๊ก</strong>มาให้แล้ว — กด "▶ รัน SQL" เพื่อดูอาการ แล้วแก้จนผลลัพธ์ตรงเป้าหมาย จากนั้นกด "🔍 ตรวจสอบคำตอบ"</div>`
    : `<div class="message">กดปุ่ม "▶ รัน SQL" หรือกด <kbd style="background: var(--panel-2); padding: 2px 5px; border-radius: 4px; border: 1px solid var(--line);">Ctrl + Enter</kbd> เพื่อดูผลลัพธ์</div>`;
}

function nextLesson() {
  if (activeLessonIndex < lessons.length - 1) {
    activeLessonIndex++;
    showLesson();
    renderLessons();
  }
}

function prevLesson() {
  if (activeLessonIndex > 0) {
    activeLessonIndex--;
    showLesson();
    renderLessons();
  }
}

// ==========================================
// 5. SQL EXECUTION & RESULT RENDERING
// ==========================================
function escapeHtml(value) {
  if (value === null || value === undefined) return '<span class="null-value">NULL</span>';
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

let lastQueryResults = [];

function runSQL() {
  const sql = editor.value.trim();

  if (!sql) {
    resultArea.innerHTML = `<div class="message error">❌ กรุณาพิมพ์คำสั่ง SQL ก่อนกดรัน</div>`;
    return;
  }

  const startTime = performance.now();

  try {
    const queryResults = db.exec(sql);
    const duration = (performance.now() - startTime).toFixed(2);
    saveDatabase();
    lastQueryResults = queryResults;
    renderResults(queryResults, duration);
  } catch (error) {
    resultArea.innerHTML = `
      <div class="message error">
        <strong>⚠️ เกิดข้อผิดพลาดในคำสั่ง SQL:</strong><br>
        <span style="font-family: var(--font-mono); margin-top: 4px; display: inline-block;">${escapeHtml(error.message)}</span>
      </div>
    `;
  }
}

function renderResults(queryResults, duration = "0.00") {
  if (!queryResults.length) {
    resultArea.innerHTML = `
      <div class="message success">
        <div>
          <strong>✅ คำสั่งทำงานสำเร็จ (Execution: ${duration} ms)</strong>
          <div style="font-size: 0.82rem; margin-top: 2px; color: var(--muted);">ไม่มีข้อมูลสำหรับแสดงผล (DML Statement เช่น INSERT, UPDATE, DELETE) บันทึกลงในฐานข้อมูลเรียบร้อยแล้ว</div>
        </div>
      </div>
    `;
    return;
  }

  let totalRows = 0;
  const tablesHtml = queryResults.map((query, qIndex) => {
    totalRows += query.values.length;
    const headers = query.columns.map(column => `<th>${escapeHtml(column)}</th>`).join("");
    const rows = query.values.map(row => `
      <tr>${row.map(value => `<td>${escapeHtml(value)}</td>`).join("")}</tr>
    `).join("");

    return `
      <div class="table-wrap">
        <table>
          <thead><tr>${headers}</tr></thead>
          <tbody>${rows || `<tr><td colspan="${query.columns.length}" style="text-align: center; color: var(--muted);">ไม่พบข้อมูล (0 แถว)</td></tr>`}</tbody>
        </table>
      </div>
    `;
  }).join('<div style="height: 12px;"></div>');

  resultArea.innerHTML = `
    <div class="result-head">
      <div class="result-label">
        <span>ตารางผลลัพธ์</span>
        <span class="result-stats-badge">${totalRows} แถว · ${duration} ms</span>
      </div>
      <div class="result-tools">
        <button class="btn-tool" id="copyCsvBtn">คัดลอก CSV</button>
        <button class="btn-tool" id="copyJsonBtn">คัดลอก JSON</button>
      </div>
    </div>
    ${tablesHtml}
  `;

  document.getElementById("copyCsvBtn")?.addEventListener("click", copyResultsAsCSV);
  document.getElementById("copyJsonBtn")?.addEventListener("click", copyResultsAsJSON);
}

// Challenge Solution Checker — logic การตรวจอยู่ใน js/challenge.js (แชร์กับ tests/verify.cjs)
// การตรวจทำบนสำเนา DB แยกคนละ instance เพื่อไม่ให้การตรวจ (โดยเฉพาะ solution ที่เป็น DML)
// กระทบฐานข้อมูลจริงที่ผู้เรียนใช้อยู่
function cloneDatabase() {
  return new SQL.Database(db.export());
}

// แปลงค่าสำหรับแสดงใน feedback (NULL แสดงเด่น ๆ ให้เห็น)
function displayValue(value) {
  if (value === null || value === undefined) return '<span class="null-value">NULL</span>';
  return `<code>${escapeHtml(String(value))}</code>`;
}

function checkChallengeSolution(lesson) {
  const fb = document.getElementById("challengeFeedback");
  if (!fb || !lesson.challenge) return;

  const userSQL = editor.value.trim();
  if (!userSQL) {
    fb.style.display = "block";
    fb.className = "message error";
    fb.innerHTML = "กรุณาเขียนคำสั่ง SQL ในช่อง Editor ก่อนกดตรวจสอบ";
    return;
  }

  const userDb = cloneDatabase();
  const solutionDb = cloneDatabase();
  try {
    let userRes;
    try {
      userRes = userDb.exec(userSQL);
    } catch (e) {
      fb.style.display = "block";
      fb.className = "message error";
      fb.innerHTML = `❌ คำสั่งของคุณมีข้อผิดพลาด: ${escapeHtml(e.message)}`;
      return;
    }

    let expectedRes = [];
    try {
      expectedRes = solutionDb.exec(lesson.challenge.solution);
    } catch (e) {
      console.warn("Challenge solution failed to execute:", e);
    }

    fb.style.display = "block";

    // โจทย์ประเภท query เทียบผลลัพธ์ / โจทย์ประเภท DML เทียบสถานะตารางหลังรัน
    // (โจทย์ Database Design ใช้ checkSchema เพื่อตรวจโครงสร้าง DDL ด้วย)
    if (getChallengeType(lesson.challenge.solution) === "dml") {
      const dumpOptions = { includeDdl: !!lesson.challenge.checkSchema };
      if (dumpDatabaseState(userDb, dumpOptions) === dumpDatabaseState(solutionDb, dumpOptions)) {
        renderChallengeSuccess(fb, lesson);
      } else if (lesson.challenge.checkSchema) {
        fb.className = "message warning";
        fb.innerHTML = `⚡ <strong>โครงสร้าง/ข้อมูลยังไม่ตรง blueprint:</strong> ตรวจชื่อตาราง ชนิดข้อมูล ลำดับคอลัมน์ constraints (PK / NOT NULL / CHECK / FK) และข้อมูลที่แทรกให้ตรง spec ทุกจุด (กด "ดูคำใบ้" ได้)`;
      } else {
        fb.className = "message warning";
        fb.innerHTML = `⚡ <strong>สถานะฐานข้อมูลหลังรันยังไม่ตรงกับเป้าหมาย:</strong> ตรวจเงื่อนไข <code>WHERE</code> ค่าที่แก้ไข และตารางเป้าหมายอีกครั้ง (กด "ดูคำใบ้" ได้)`;
      }
      return;
    }

    const result = compareQueryResults(userRes, expectedRes, {
      unordered: !!lesson.challenge.unordered,
      requiredColumns: lesson.challenge.requiredColumns || []
    });

    if (result.correct) {
      renderChallengeSuccess(fb, lesson);
      return;
    }

    fb.className = "message warning";
    fb.innerHTML = `⚡ <strong>ยังไม่ผ่าน:</strong> ${describeResultDifference(result)}`;
  } finally {
    userDb.close();
    solutionDb.close();
  }
}

function renderChallengeSuccess(fb, lesson) {
  fb.className = "message success";
  if (lesson.type === "debug") {
    fb.innerHTML = `🎉 <strong>แก้สำเร็จ!</strong> Query ของคุณให้ผลลัพธ์ถูกต้องตรงตามเป้าหมายแล้ว`;
  } else {
    fb.innerHTML = `🎉 <strong>ยอดเยี่ยมมาก!</strong> คำสั่ง SQL ของคุณให้ผลลัพธ์ถูกต้องตรงตามโจทย์`;
  }
  markLessonCompleted(lesson.id);
  showToast("ผ่านบทเรียนนี้แล้ว! +1", "success");
}

// สร้างข้อความบอก "ผิดตรงไหน" จากผลวิเคราะห์ของ compareQueryResults
function describeResultDifference(result) {
  switch (result.code) {
    case "statement_count": {
      if (result.userStatements === 0) {
        return `คำสั่งของคุณไม่คืนตารางผลลัพธ์ — อาจเป็นคำสั่ง DML/DDL หรือ <code>SELECT</code> ที่ได้ 0 แถว (เงื่อนไขไม่ตรงกับข้อมูลสักแถว) โจทย์นี้คาดหวังผลลัพธ์ ${result.expectedStatements} ชุด`;
      }
      return `จำนวนชุดผลลัพธ์ไม่ตรง: คุณได้ ${result.userStatements} ชุด เฉลยคาดหวัง ${result.expectedStatements} ชุด — ตรวจว่ามีหลายคำสั่งปนกันหรือไม่`;
    }
    case "column_count":
      return `จำนวนคอลัมน์ไม่ตรง: คุณเลือก ${result.userColumns} คอลัมน์ โจทย์ต้องการ ${result.expectedColumns} คอลัมน์ — ตรวจคำสั่ง SELECT`;
    case "row_count":
      return `จำนวนแถวไม่ตรง: คุณได้ ${result.userRows} แถว เฉลยได้ ${result.expectedRows} แถว — ตรวจเงื่อนไข <code>WHERE</code> / <code>JOIN</code> / <code>GROUP BY</code>`;
    case "values_differ":
      return `ค่าไม่ตรงที่แถวที่ ${result.row} คอลัมน์ "${escapeHtml(result.column ?? "-")}" — คุณได้ ${displayValue(result.userValue)} เฉลยคือ ${displayValue(result.expectedValue)} <span style="color: var(--muted);">(แถวก่อนหน้าถูกต้องแล้ว เริ่มตรวจจากจุดนี้)</span>`;
    case "order_only":
      return `ชุดข้อมูลถูกต้องครบถ้วน แต่<strong>ลำดับแถว</strong>ยังไม่ตรง — ตรวจ <code>ORDER BY</code> ของคำสั่ง`;
    case "column_names":
      return `ค่าถูกต้อง แต่ยังขาดคอลัมน์ที่โจทย์กำหนดชื่อไว้: <code>${result.missing.map(escapeHtml).join(", ")}</code> — ใช้ <code>AS</code> ตั้งชื่อคอลัมน์ตามโจทย์`;
    default:
      return `ผลลัพธ์ยังไม่ตรงกับโจทย์ — ลองตรวจเงื่อนไข คอลัมน์ หรือลำดับข้อมูลอีกครั้ง (สามารถคลิก "ดูคำใบ้" ได้)`;
  }
}

// ==========================================
// 6. COPY & EXPORT UTILITIES
// ==========================================
function fallbackCopyText(text) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  let ok = false;
  try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
  textarea.remove();
  return ok;
}

function copyTextToClipboard(text, successMessage) {
  const failMessage = "คัดลอกไม่สำเร็จ — เบราว์เซอร์อาจบล็อกการคัดลอกในหน้าที่ไม่ใช่ HTTPS";
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text)
      .then(() => showToast(successMessage, "success"))
      .catch(() => {
        showToast(fallbackCopyText(text) ? successMessage : failMessage, "success");
      });
  } else {
    const ok = fallbackCopyText(text);
    showToast(ok ? successMessage : failMessage, ok ? "success" : "error");
  }
}

function copyResultsAsCSV() {
  if (!lastQueryResults.length) return;
  const q = lastQueryResults[0];
  const csv = [
    q.columns.join(","),
    ...q.values.map(row => row.map(v => typeof v === "string" && v.includes(",") ? `"${v}"` : (v ?? "")).join(","))
  ].join("\n");

  copyTextToClipboard(csv, "คัดลอกข้อมูลเป็น CSV เรียบร้อยแล้ว");
}

function copyResultsAsJSON() {
  if (!lastQueryResults.length) return;
  const q = lastQueryResults[0];
  const json = q.values.map(row => {
    const obj = {};
    q.columns.forEach((col, idx) => {
      obj[col] = row[idx];
    });
    return obj;
  });

  copyTextToClipboard(JSON.stringify(json, null, 2), "คัดลอกข้อมูลเป็น JSON เรียบร้อยแล้ว");
}

function copySQLEditor() {
  copyTextToClipboard(editor.value, "คัดลอกโค้ด SQL แล้ว");
}

function formatSQL() {
  // คำหลายคำต้องมาก่อนคำสั้นที่ซ้อนกัน (เช่น INNER JOIN ก่อน JOIN)
  const keywords = [
    "FULL OUTER JOIN", "LEFT OUTER JOIN", "RIGHT OUTER JOIN", "CROSS JOIN",
    "INNER JOIN", "LEFT JOIN", "RIGHT JOIN", "FULL JOIN",
    "ORDER BY", "GROUP BY", "PARTITION BY", "INSERT INTO", "DELETE FROM",
    "UNION ALL", "ON CONFLICT", "DO UPDATE", "IS NOT NULL", "QUERY PLAN",
    "SELECT", "FROM", "WHERE", "HAVING", "LIMIT", "OFFSET",
    "JOIN", "ON", "AS", "VALUES", "UPDATE", "SET", "WITH", "RECURSIVE",
    "UNION", "EXISTS", "AND", "OR", "NOT", "IN", "BETWEEN", "LIKE", "IS NULL",
    "CASE", "WHEN", "THEN", "ELSE", "END", "OVER", "DISTINCT",
    "BEGIN", "COMMIT", "ROLLBACK", "TRANSACTION",
    "CREATE", "VIEW", "INDEX", "TABLE", "ALTER", "DROP", "EXPLAIN",
    "ASC", "DESC", "EXCLUDED"
  ];

  // แยกส่วนที่เป็น string literal ('...') ออกมาก่อน เพื่อไม่เปลี่ยนตัวพิมพ์ของ "ข้อมูล"
  const segments = editor.value.split(/('(?:[^']|'')*')/);
  const formatted = segments
    .map((segment, i) => {
      if (i % 2 === 1) return segment;
      keywords.forEach(kw => {
        segment = segment.replace(new RegExp(`\\b${kw}\\b`, "gi"), kw);
      });
      return segment;
    })
    .join("");

  editor.value = formatted;
  showToast("จัดรูปแบบคีย์เวิร์ด SQL เรียบร้อย", "success");
}

function showToast(message, type = "info") {
  const existing = document.getElementById("sqlToast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.id = "sqlToast";
  toast.style.position = "fixed";
  toast.style.bottom = "24px";
  toast.style.right = "24px";
  toast.style.padding = "10px 18px";
  toast.style.borderRadius = "10px";
  toast.style.fontSize = "0.85rem";
  toast.style.fontWeight = "600";
  toast.style.zIndex = "999";
  toast.style.boxShadow = "var(--shadow-lg)";
  toast.style.transition = "all 0.3s ease";
  toast.style.color = "#ffffff";
  toast.style.background = type === "success" ? "#059669" : type === "error" ? "#e11d48" : "#0284c7";
  toast.textContent = message;

  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(10px)";
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

// ==========================================
// 7. SCHEMA EXPLORER MODAL
// ==========================================
function openSchemaModal() {
  if (!schemaModal) return;
  const bodyEl = document.getElementById("schemaModalBody");
  if (!bodyEl) return;

  // Render schema tables
  bodyEl.innerHTML = `
    <p style="color: var(--muted); font-size: 0.88rem; margin: 0 0 14px;">
      ฐานข้อมูลจำลอง E-Commerce ประกอบด้วย 6 ตารางที่มีความสัมพันธ์กัน (Relational Database) คุณสามารถคลิกปุ่ม <strong>"ดูข้อมูล"</strong> เพื่อเรียกดูแถวตัวอย่างได้ทันที
    </p>
    <div class="schema-tables-grid">
      ${databaseTables.map(t => {
        let count = "?";
        try {
          const res = db.exec(`SELECT COUNT(*) as c FROM ${t.name};`);
          if (res.length && res[0].values.length) count = res[0].values[0][0];
        } catch (e) {}

        return `
          <div class="schema-table-card">
            <div class="schema-table-head">
              <span class="schema-table-name">📁 ${t.name}</span>
              <button class="btn btn-secondary schema-inspect-btn" style="font-size: 0.72rem; padding: 3px 8px;" data-inspect="${t.name}">
                ดูข้อมูล (${count} แถว)
              </button>
            </div>
            <div style="font-size: 0.78rem; color: var(--muted);">${t.description}</div>
            <div class="schema-column-list">
              ${t.columns.map(c => `
                <div class="schema-col-row">
                  <span class="schema-col-name">${c.name}</span>
                  <span class="schema-col-type">${c.type}</span>
                </div>
              `).join("")}
            </div>
          </div>
        `;
      }).join("")}
    </div>
  `;

  bodyEl.querySelectorAll(".schema-inspect-btn").forEach(btn => {
    btn.addEventListener("click", () => inspectTable(btn.dataset.inspect));
  });

  schemaModal.classList.add("active");
}

function closeSchemaModal() {
  if (schemaModal) schemaModal.classList.remove("active");
}

function inspectTable(tableName) {
  closeSchemaModal();
  editor.value = `SELECT * FROM ${tableName} LIMIT 10;`;
  runSQL();
}

// ==========================================
// 7b. JOIN VISUALIZER MODAL
// ==========================================
// ใช้ scratch DB แยก (ไม่ใช่ db หลัก) — ข้อมูลตัวอย่างเล็ก ๆ ให้เห็นภาพชัด
// และผลลัพธ์ทุก join รันด้วย SQLite จริงเสมอ ไม่ใช่ภาพวาดมั่ว
const joinModal = document.getElementById("joinModal");
let joinDemoDb = null;
let currentJoinType = "inner";

const JOIN_DEMO_SQL = `
  CREATE TABLE team_members (member_id INTEGER PRIMARY KEY, name TEXT);
  INSERT INTO team_members (member_id, name) VALUES (1, 'A'), (2, 'B'), (3, 'C');

  CREATE TABLE team_tasks (task_id INTEGER PRIMARY KEY, title TEXT, member_id INTEGER);
  INSERT INTO team_tasks (task_id, title, member_id) VALUES
    (101, 'งานที่ 1', 1),
    (102, 'งานที่ 2', 1),
    (103, 'งานที่ 3', 3),
    (104, 'งานที่ 4', 99);
`;

const JOIN_TYPES = [
  {
    key: "inner", label: "INNER JOIN",
    desc: "เก็บเฉพาะคู่ที่ตรงกันทั้งสองฝั่ง — <strong>B</strong> (ไม่มีงานเลย) หายไป และ <strong>งานที่ 4</strong> (เจ้าของลาออก) หายไป"
  },
  {
    key: "left", label: "LEFT JOIN",
    desc: "คงสมาชิกทุกคนจากฝั่งซ้าย — <strong>B</strong> ยังอยู่ แต่คอลัมน์งานเป็น NULL / <strong>งานที่ 4</strong> ยังหายเพราะไม่มีในฝั่งซ้าย"
  },
  {
    key: "right", label: "RIGHT JOIN",
    desc: "คงงานทุกชิ้นจากฝั่งขวา — <strong>งานที่ 4</strong> ยังอยู่ แต่คอลัมน์สมาชิกเป็น NULL / <strong>B</strong> หายเพราะไม่มีงานคู่กัน"
  },
  {
    key: "full", label: "FULL OUTER JOIN",
    desc: "คงทั้งสองฝั่งไม่ปล่อยใครหล่น — <strong>B</strong> ได้งานเป็น NULL และ <strong>งานที่ 4</strong> ได้สมาชิกเป็น NULL เหมาะกับการตรวจหาข้อมูลกำพร้า"
  },
  {
    key: "cross", label: "CROSS JOIN",
    desc: "จับคู่ทุกแถวกับทุกแถว (Cartesian Product) — 3 สมาชิก × 4 งาน = 12 แถว โดยไม่สนเงื่อนไข ON เลย"
  }
];

function getJoinDemoDb() {
  if (!joinDemoDb) {
    joinDemoDb = new SQL.Database();
    joinDemoDb.run(JOIN_DEMO_SQL);
  }
  return joinDemoDb;
}

function joinDemoQuery(sql) {
  const res = getJoinDemoDb().exec(sql);
  return res.length ? res[0] : { columns: [], values: [] };
}

function joinDemoSqlFor(typeKey) {
  if (typeKey === "cross") {
    return "SELECT m.member_id, m.name AS member, t.task_id, t.title AS task\nFROM team_members m\nCROSS JOIN team_tasks t\nORDER BY m.member_id, t.task_id;";
  }
  const joinKeyword = { inner: "INNER JOIN", left: "LEFT JOIN", right: "RIGHT JOIN", full: "FULL OUTER JOIN" }[typeKey];
  return `SELECT m.member_id, m.name AS member, t.task_id, t.title AS task\nFROM team_members m\n${joinKeyword} team_tasks t ON m.member_id = t.member_id\nORDER BY m.member_id, t.task_id;`;
}

function renderJoinVisualizer() {
  const bodyEl = document.getElementById("joinModalBody");
  if (!bodyEl) return;

  const type = JOIN_TYPES.find(t => t.key === currentJoinType);

  // ข้อมูลตัวอย่างสองฝั่ง + ชุด ID ที่ "มีคู่ตรงกัน" (คำนวณจาก SQL จริง)
  const leftRows = joinDemoQuery("SELECT member_id, name FROM team_members ORDER BY member_id").values;
  const rightRows = joinDemoQuery("SELECT task_id, title, member_id FROM team_tasks ORDER BY task_id").values;
  const matchedLeft = new Set(joinDemoQuery(
    "SELECT DISTINCT m.member_id FROM team_members m JOIN team_tasks t ON m.member_id = t.member_id"
  ).values.flat());
  const matchedRight = new Set(joinDemoQuery(
    "SELECT DISTINCT t.task_id FROM team_members m JOIN team_tasks t ON m.member_id = t.member_id"
  ).values.flat());

  // กติกาว่าแต่ละ join เก็บแถวไหนไว้บ้าง (ฝั่งไหนเป็น "เจ้าภาพ" ก็คงแถวครบ)
  const keepAllLeft = currentJoinType === "left" || currentJoinType === "full" || currentJoinType === "cross";
  const keepAllRight = currentJoinType === "right" || currentJoinType === "full" || currentJoinType === "cross";
  // CROSS JOIN จับคู่ทุกแถว จึงไม่มี NULL (เฉพาะ outer join เท่านั้นที่ "รอดโดยได้ NULL มาเติม")
  const showsNullFill = currentJoinType !== "cross";

  const leftPanelRows = leftRows.map(([id, name]) => {
    const kept = keepAllLeft || matchedLeft.has(id);
    const nullBadge = (showsNullFill && keepAllLeft && !matchedLeft.has(id)) ? '<span class="join-null-badge">งาน → NULL</span>' : "";
    return `<div class="join-row ${kept ? "kept" : "dropped"}"><span class="join-row-key">${escapeHtml(name)}</span><span class="join-row-sub">id ${id}</span>${nullBadge}</div>`;
  }).join("");

  const rightPanelRows = rightRows.map(([taskId, title, ownerId]) => {
    const kept = keepAllRight || matchedRight.has(taskId);
    const orphanNote = ownerId === 99 ? ' <span class="join-row-warn">เจ้าของ id 99 ลาออกแล้ว</span>' : "";
    const nullBadge = (showsNullFill && keepAllRight && !matchedRight.has(taskId)) ? '<span class="join-null-badge">สมาชิก → NULL</span>' : "";
    return `<div class="join-row ${kept ? "kept" : "dropped"}"><span class="join-row-key">${escapeHtml(title)}</span><span class="join-row-sub">id ${taskId} · ของ ${ownerId}</span>${orphanNote}${nullBadge}</div>`;
  }).join("");

  // ผลลัพธ์จริงจาก SQLite
  const demoSql = joinDemoSqlFor(currentJoinType);
  const result = joinDemoQuery(demoSql);
  const resultTable = `
    <div class="table-wrap join-result-table">
      <table>
        <thead><tr>${result.columns.map(c => `<th>${escapeHtml(c)}</th>`).join("")}</tr></thead>
        <tbody>${result.values.map(row => `<tr>${row.map(v => `<td>${escapeHtml(v)}</td>`).join("")}</tr>`).join("")}</tbody>
      </table>
    </div>
  `;

  bodyEl.innerHTML = `
    <p class="join-story">
      สมมติทีมงานมีสมาชิก 3 คน (<strong>A, B, C</strong>) และมีงาน 4 ชิ้น —
      <strong>B ยังไม่ได้รับงานเลย</strong> ส่วน <strong>งานที่ 4</strong> ถูกมอบหมายให้รหัส 99
      ซึ่งเป็นอดีตสมาชิกที่ลาออกไปแล้ว กดปุ่มแต่ละประเภท JOIN แล้วสังเกตว่า<strong>แถวไหนรอด แถวไหนหาย</strong>
    </p>

    <div class="join-type-btns">
      ${JOIN_TYPES.map(t => `
        <button class="join-type-btn ${t.key === currentJoinType ? "active" : ""}" data-join-type="${t.key}">${t.label}</button>
      `).join("")}
    </div>

    <p class="join-desc">${type.desc}</p>

    <div class="join-viz-grid">
      <div class="join-panel">
        <div class="join-panel-title">team_members <span>(ฝั่งซ้าย)</span></div>
        ${leftPanelRows}
      </div>
      <div class="join-operator">${type.label}</div>
      <div class="join-panel">
        <div class="join-panel-title">team_tasks <span>(ฝั่งขวา)</span></div>
        ${rightPanelRows}
      </div>
    </div>
    <p class="join-legend">
      <span class="join-legend-item"><span class="join-dot kept"></span> แถวที่อยู่ในผลลัพธ์</span>
      <span class="join-legend-item"><span class="join-dot dropped"></span> แถวที่ถูกตัดทิ้ง</span>
      <span class="join-legend-item"><span class="join-null-badge">NULL</span> ค่าเติมเมื่อไม่มีคู่</span>
    </p>

    <div class="join-sql-box"><pre>${escapeHtml(demoSql)}</pre></div>

    <div class="join-result-head">
      <strong>ผลลัพธ์จริง (${result.values.length} แถว)</strong>
      <span class="result-stats-badge">รันด้วย SQLite จริง</span>
    </div>
    ${resultTable}

    <p class="join-story" style="margin-top: 12px;">
      ในฐานข้อมูลจริงของคอร์ส ก็ใช้หลักการเดียวกัน:
      <code>customers LEFT JOIN orders</code> เพื่อหาลูกค้าที่ยังไม่เคยสั่งซื้อ,
      หรือ <code>FULL OUTER JOIN</code> เพื่อตรวจข้อมูลกำพร้าสองฝั่ง — ลองเล่นกับหมวด Joins ของคอร์สต่อได้เลย
    </p>
  `;

  bodyEl.querySelectorAll(".join-type-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      currentJoinType = btn.dataset.joinType;
      renderJoinVisualizer();
    });
  });
}

function openJoinModal() {
  if (!joinModal) return;
  renderJoinVisualizer();
  joinModal.classList.add("active");
}

function closeJoinModal() {
  if (joinModal) joinModal.classList.remove("active");
}

// ==========================================
// 7c. PERFORMANCE LAB MODAL
// ==========================================
// ทดลอง SCAN vs INDEX บนตาราง big_orders 100,000 แถว
// ใช้ scratch DB แยกที่ไม่ถูก persist — แก้ปัญหา localStorage ล้นของ DB หลัก
const perfModal = document.getElementById("perfModal");
let perfDb = null;
let perfBuilding = false;

const PERF_ROW_COUNT = 100000;
const PERF_INDEXES = [
  { name: "idx_big_customer", createSql: "CREATE INDEX idx_big_customer ON big_orders(customer_id)", label: "idx_big_customer (customer_id)" },
  { name: "idx_big_amount", createSql: "CREATE INDEX idx_big_amount ON big_orders(amount)", label: "idx_big_amount (amount)" }
];

const PERF_SCENARIOS = [
  {
    key: "lookup",
    label: "🔎 ค้นหาออเดอร์ของลูกค้า 1 คน",
    sql: "SELECT order_id, customer_id, status, amount FROM big_orders WHERE customer_id = 4242;",
    index: "idx_big_customer",
    insight: "ค้นหาด้วยคอลัมน์ที่ไม่มี Index = SCAN ทั้งตาราง 100,000 แถวทุกครั้ง — มี Index = กระโดดเข้าไปหาเฉพาะแถวที่ต้องการ (SEARCH)"
  },
  {
    key: "sort",
    label: "🏆 Top 10 ยอดเงินสูงสุด (ORDER BY)",
    sql: "SELECT order_id, amount FROM big_orders ORDER BY amount DESC LIMIT 10;",
    index: "idx_big_amount",
    insight: "ไม่มี Index = ต้องเรียง 100,000 แถวใหม่ทั้งหมด (USE TEMP B-TREE) — มี Index บน amount = เดินจากยอดสูงสุดลงมา 10 แถวแล้วจบเลย"
  }
];

function labRandom32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildPerfDatabase(onDone) {
  if (perfDb || perfBuilding) return;
  perfBuilding = true;

  const building = new SQL.Database();
  building.run("CREATE TABLE big_orders (order_id INTEGER PRIMARY KEY, customer_id INTEGER NOT NULL, status TEXT NOT NULL, amount REAL NOT NULL, order_date TEXT NOT NULL)");

  const rand = labRandom32(20260915);
  const statuses = ["completed", "shipped", "pending", "cancelled"];
  building.run("BEGIN");
  const insert = building.prepare("INSERT INTO big_orders VALUES (?, ?, ?, ?, ?)");

  const CHUNK = 10000;
  let i = 1;

  const step = () => {
    const end = Math.min(i + CHUNK, PERF_ROW_COUNT + 1);
    for (; i < end; i++) {
      const month = 1 + Math.floor(rand() * 12);
      const day = 1 + Math.floor(rand() * 28);
      insert.run([
        i,
        1 + Math.floor(rand() * 5000),
        statuses[Math.floor(rand() * 4)],
        Math.round(rand() * 9900 + 100),
        `2026-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
      ]);
    }

    const statusEl = document.getElementById("perfBuildStatus");
    if (statusEl) statusEl.textContent = `⏳ กำลังสร้างข้อมูล ${i - 1}/${PERF_ROW_COUNT.toLocaleString("th-TH")} แถว...`;

    if (i <= PERF_ROW_COUNT) {
      setTimeout(step, 0);
    } else {
      insert.free();
      building.run("COMMIT");
      perfDb = building;
      perfBuilding = false;
      onDone();
    }
  };

  setTimeout(step, 30);
}

function perfIndexExists(indexName) {
  if (!perfDb) return false;
  const res = perfDb.exec(`SELECT COUNT(*) FROM sqlite_master WHERE type = 'index' AND name = '${indexName}'`);
  return res.length && res[0].values[0][0] > 0;
}

function timePerfQuery(sql, reps = 5) {
  perfDb.exec(sql); // warm-up 1 รอบ ก่อนจับเวลา
  const t0 = performance.now();
  for (let r = 0; r < reps; r++) perfDb.exec(sql);
  return (performance.now() - t0) / reps;
}

function perfQueryPlan(sql) {
  const res = perfDb.exec("EXPLAIN QUERY PLAN " + sql);
  return res.length ? res[0].values.map(row => String(row[3])) : [];
}

function renderPlanLines(planLines) {
  return planLines.map(line => {
    let cls = "";
    if (/^SCAN/i.test(line)) cls = "plan-scan";
    else if (/SEARCH|USING INDEX|USING COVERING INDEX/i.test(line)) cls = "plan-search";
    else if (/TEMP B-TREE/i.test(line)) cls = "plan-sort";
    return `<div class="plan-line ${cls}">${escapeHtml(line)}</div>`;
  }).join("") || '<div class="plan-line">—</div>';
}

function runPerfExperiment(scenario) {
  const resultEl = document.getElementById("perfExperimentResult");
  if (!resultEl || !perfDb) return;

  resultEl.innerHTML = '<div class="lab-loading">⏳ กำลังรันการทดลอง...</div>';

  // ทำงานหนักในรอบถัดไป ให้ loading ได้แสดงก่อน
  setTimeout(() => {
    // 1) แบบไม่มี index
    perfDb.run(`DROP INDEX IF EXISTS ${scenario.index}`);
    const beforeMs = timePerfQuery(scenario.sql);
    const beforePlan = perfQueryPlan(scenario.sql);

    // 2) สร้าง index แล้วรันใหม่
    const idxDef = PERF_INDEXES.find(ix => ix.name === scenario.index);
    perfDb.run(idxDef.createSql);
    const afterMs = timePerfQuery(scenario.sql);
    const afterPlan = perfQueryPlan(scenario.sql);

    // 3) คืนสถานะสะอาด (ลบ index) เพื่อให้ทดลองซ้ำได้ / custom section จัดการ index เอง
    perfDb.run(`DROP INDEX IF EXISTS ${scenario.index}`);
    syncPerfIndexCheckboxes();

    const safeAfter = Math.max(afterMs, 0.01);
    const speedup = beforeMs / safeAfter;

    resultEl.innerHTML = `
      <div class="perf-sql"><pre>${escapeHtml(scenario.sql)}</pre></div>
      <div class="perf-compare">
        <div class="perf-card before">
          <div class="perf-card-head">❌ ไม่มี Index</div>
          <div class="perf-time">${beforeMs.toFixed(2)} <span>ms</span></div>
          <div class="perf-plan">${renderPlanLines(beforePlan)}</div>
        </div>
        <div class="perf-card after">
          <div class="perf-card-head">✅ มี ${escapeHtml(idxDef.label)}</div>
          <div class="perf-time">${afterMs.toFixed(2)} <span>ms</span></div>
          <div class="perf-plan">${renderPlanLines(afterPlan)}</div>
        </div>
      </div>
      <div class="perf-speedup">🚀 เร็วขึ้นประมาณ <strong>${speedup >= 100 ? speedup.toFixed(0) : speedup.toFixed(1)}×</strong></div>
      <p class="lab-insight">💡 ${scenario.insight}</p>
      <p class="lab-note">หมายเหตุ: engine ทำงานใน WASM บนเครื่องของคุณ เวลาที่วัดได้ต่างกันในแต่ละรอบ แต่ "แผนการทำงาน" (SCAN vs SEARCH) และอัตราส่วนความต่างคือสิ่งที่ใช้เปรียบเทียบได้จริง</p>
    `;
  }, 30);
}

function syncPerfIndexCheckboxes() {
  PERF_INDEXES.forEach(ix => {
    const cb = document.getElementById(`perfIdx_${ix.name}`);
    if (cb) cb.checked = perfIndexExists(ix.name);
  });
}

function renderPerfLab() {
  const bodyEl = document.getElementById("perfModalBody");
  if (!bodyEl) return;

  bodyEl.innerHTML = `
    <p class="lab-story">
      ห้องทดลองนี้สร้างตาราง <code>big_orders</code> จำนวน <strong>${PERF_ROW_COUNT.toLocaleString("th-TH")} แถว</strong>
      สด ๆ ในหน่วยความจำ (แยกจากฐานข้อมูลหลักของคอร์ส) — ให้คุณสัมผัสกับความต่างของ query
      ที่<strong>ไม่มี Index</strong> (SCAN ทั้งตาราง) กับ<strong>มี Index</strong> (SEARCH ตรงจุด) ด้วยเวลาจริงและ Query Plan จริง
    </p>
    <div id="perfBuildStatus" class="lab-loading">⏳ กำลังสร้างข้อมูล 0/${PERF_ROW_COUNT.toLocaleString("th-TH")} แถว... (ครั้งแรกครั้งเดียว)</div>

    <div class="lab-section-title">🎯 การทดลองสำเร็จรูป</div>
    <div class="lab-scenario-btns">
      ${PERF_SCENARIOS.map(s => `<button class="lab-scenario-btn" data-scenario="${s.key}" disabled>${s.label}</button>`).join("")}
    </div>
    <div id="perfExperimentResult"></div>

    <div class="lab-section-title">🧪 ห้องทดลองอิสระ — เขียน query เอง</div>
    <p class="lab-story">เขียน query ต่อ <code>big_orders</code> (คอลัมน์: order_id, customer_id, status, amount, order_date) แล้วเลือกเปิด/ปิด Index ดูว่าแผนการทำงานเปลี่ยนอย่างไร</p>
    <textarea id="perfCustomSql" class="lab-textarea" spellcheck="false" placeholder="SELECT COUNT(*) FROM big_orders WHERE amount > 9000;">SELECT COUNT(*) FROM big_orders WHERE amount > 9000;</textarea>
    <div class="perf-index-toggles">
      ${PERF_INDEXES.map(ix => `
        <label class="perf-index-toggle">
          <input type="checkbox" id="perfIdx_${ix.name}" data-index="${ix.name}">
          <span>${escapeHtml(ix.label)}</span>
        </label>
      `).join("")}
    </div>
    <div class="lab-actions">
      <button class="btn btn-run" id="perfCustomRun" disabled>▶ รัน + ดู Query Plan</button>
    </div>
    <div id="perfCustomResult"></div>
  `;

  const ready = () => {
    const statusEl = document.getElementById("perfBuildStatus");
    if (statusEl) {
      statusEl.textContent = `✅ ข้อมูลพร้อม: big_orders ${PERF_ROW_COUNT.toLocaleString("th-TH")} แถว (อยู่ในหน่วยความจำ ไม่แตะฐานข้อมูลหลัก)`;
      statusEl.classList.add("ready");
    }
    bodyEl.querySelectorAll(".lab-scenario-btn").forEach(btn => (btn.disabled = false));
    const customRun = document.getElementById("perfCustomRun");
    if (customRun) customRun.disabled = false;
    syncPerfIndexCheckboxes();
  };

  if (perfDb) {
    ready();
  } else {
    buildPerfDatabase(ready);
  }

  bodyEl.querySelectorAll(".lab-scenario-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const scenario = PERF_SCENARIOS.find(s => s.key === btn.dataset.scenario);
      if (scenario) runPerfExperiment(scenario);
    });
  });

  bodyEl.querySelectorAll(".perf-index-toggle input").forEach(cb => {
    cb.addEventListener("change", () => {
      const ix = PERF_INDEXES.find(x => x.name === cb.dataset.index);
      if (!ix || !perfDb) return;
      perfDb.run(cb.checked ? ix.createSql : `DROP INDEX IF EXISTS ${ix.name}`);
      syncPerfIndexCheckboxes();
    });
  });

  document.getElementById("perfCustomRun")?.addEventListener("click", () => {
    const sql = document.getElementById("perfCustomSql")?.value.trim();
    const outEl = document.getElementById("perfCustomResult");
    if (!sql || !outEl || !perfDb) return;

    outEl.innerHTML = '<div class="lab-loading">⏳ กำลังรัน...</div>';
    setTimeout(() => {
      let rowCount = null;
      let errorMessage = null;
      let ms;
      try {
        ms = timePerfQuery(sql, 3);
        const res = perfDb.exec(sql);
        rowCount = res.length ? res[0].values.length : 0;
      } catch (e) {
        errorMessage = e.message;
      }

      if (errorMessage) {
        outEl.innerHTML = `<div class="message error">❌ ${escapeHtml(errorMessage)}</div>`;
        return;
      }

      outEl.innerHTML = `
        <div class="perf-custom-summary">
          <span class="result-stats-badge">เฉลี่ย ${ms.toFixed(2)} ms / ครั้ง (3 รอบ)</span>
          ${rowCount !== null ? `<span class="result-stats-badge">${rowCount.toLocaleString("th-TH")} แถว</span>` : ""}
        </div>
        <div class="perf-plan">${renderPlanLines(perfQueryPlan(sql))}</div>
        <p class="lab-note">สีแดง = SCAN (สแกนทั้งตาราง) · เขียว = ใช้ Index · เหลือง = เรียงลำดับชั่วคราว (TEMP B-TREE)</p>
      `;
    }, 30);
  });
}

function openPerfModal() {
  if (!perfModal) return;
  renderPerfLab();
  perfModal.classList.add("active");
}

function closePerfModal() {
  if (perfModal) perfModal.classList.remove("active");
}

// ==========================================
// 7d. INJECTION LAB MODAL (สอนเพื่อป้องกัน)
// ==========================================
// ระบบ Login จำลองใน sandbox ของเบราว์เซอร์ — เห็นช่องโหว่ string concatenation
// กับวิธีปิดด้วย prepared statement ด้วยตาตัวเอง (ต่อยอดบทที่ 21)
const injectionModal = document.getElementById("injectionModal");
let injectionDb = null;
let injectionSafeMode = false;

const INJECTION_USERS = [
  { userId: 1, username: "admin", password: "Adm1n$ecret", role: "Administrator" },
  { userId: 2, username: "somchai", password: "S3cret!", role: "Customer" },
  { userId: 3, username: "malee", password: "P@ssw0rd123", role: "Customer" }
];

const INJECTION_SEED_SQL = `
  CREATE TABLE demo_users (
    user_id INTEGER PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL
  );
  INSERT INTO demo_users (user_id, username, password, role) VALUES
    (1, 'admin', 'Adm1n$ecret', 'Administrator'),
    (2, 'somchai', 'S3cret!', 'Customer'),
    (3, 'malee', 'P@ssw0rd123', 'Customer');
`;

function getInjectionDb() {
  if (!injectionDb) {
    injectionDb = new SQL.Database();
    injectionDb.run(INJECTION_SEED_SQL);
  }
  return injectionDb;
}

function renderInjectionLab() {
  const bodyEl = document.getElementById("injectionModalBody");
  if (!bodyEl) return;

  bodyEl.innerHTML = `
    <p class="lab-story">
      นี่คือระบบ Login <strong>จำลอง</strong>ที่มีช่องโหว่แบบที่พบในโลกจริง — ทั้งหมดรันอยู่ใน sandbox ของเบราว์เซอร์คุณเอง
      ยิง payload ใส่ฟอร์มด้านล่างเพื่อดูว่า input ของคุณ "กลายเป็นคำสั่ง SQL" ได้อย่างไร แล้วสลับไปโหมดปลอดภัยเพื่อดูว่าทำไม payload เดียวกันถึงใช้ไม่ได้ผล
    </p>

    <div class="lab-mode-btns">
      <button class="lab-mode-btn danger ${injectionSafeMode ? "" : "active"}" id="injModeVulnerable">🚫 โหมดต่อ String ตรง ๆ (มีช่องโหว่)</button>
      <button class="lab-mode-btn success ${injectionSafeMode ? "active" : ""}" id="injModeSafe">🛡️ โหมด Prepared Statement (ปลอดภัย)</button>
    </div>

    <div class="lab-form-grid">
      <label>Username<input type="text" id="injUser" placeholder="เช่น somchai" autocomplete="off"></label>
      <label>Password<input type="text" id="injPass" placeholder="รหัสผ่าน" autocomplete="off"></label>
    </div>

    <div class="lab-section-title">🧨 payload ตัวอย่าง (กดเพื่อกรอกอัตโนมัติ)</div>
    <div class="inj-payload-chips">
      <button class="inj-payload-chip" data-user="" data-pass="' OR '1'='1">' OR '1'='1 <span>→ ใส่ช่องรหัสผ่าน</span></button>
      <button class="inj-payload-chip" data-user="admin' --" data-pass="อะไรก็ได้">admin' -- <span>→ ใส่ช่อง username</span></button>
      <button class="inj-payload-chip safe" data-user="somchai" data-pass="S3cret!">somchai / S3cret! <span>→ login ปกติ</span></button>
    </div>

    <div class="lab-actions">
      <button class="btn btn-run" id="injLoginBtn">🔓 เข้าสู่ระบบ</button>
    </div>

    <div id="injResult"></div>

    <p class="lab-note">
      ⚠️ เพื่อการเรียนรู้เท่านั้น: ระบบจำลองเก็บรหัสผ่านเป็นข้อความเปล่าเพื่อให้เห็นการทำงานชัด ๆ —
      ระบบจริงต้อง <strong>hash รหัสผ่าน</strong>เสมอ และอย่าทดลองกับระบบที่คุณไม่มีสิทธิ์
    </p>
  `;

  document.getElementById("injModeVulnerable")?.addEventListener("click", () => {
    injectionSafeMode = false;
    renderInjectionLab();
  });
  document.getElementById("injModeSafe")?.addEventListener("click", () => {
    injectionSafeMode = true;
    renderInjectionLab();
  });

  bodyEl.querySelectorAll(".inj-payload-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      document.getElementById("injUser").value = chip.dataset.user;
      document.getElementById("injPass").value = chip.dataset.pass;
    });
  });

  document.getElementById("injLoginBtn")?.addEventListener("click", attemptLabLogin);
}

function attemptLabLogin() {
  const outEl = document.getElementById("injResult");
  const u = document.getElementById("injUser")?.value ?? "";
  const p = document.getElementById("injPass")?.value ?? "";
  if (!outEl) return;

  const labDb = getInjectionDb();
  const realUser = INJECTION_USERS.find(x => x.username === u && x.password === p) || null;

  if (!injectionSafeMode) {
    // 🚫 โหมดช่องโหว่: เอา input ไปต่อ string ตรง ๆ เหมือนโค้ดที่ไม่ระวัง
    const assembled = `SELECT user_id, username, role FROM demo_users WHERE username = '${u}' AND password = '${p}' LIMIT 1`;
    let rows = [];
    let sqlError = null;
    try {
      rows = labDb.exec(assembled)[0]?.values || [];
    } catch (e) {
      sqlError = e.message;
    }

    let verdictHtml;
    if (sqlError) {
      verdictHtml = `<div class="verdict bad">💥 SQL ที่ประกอบได้รันไม่ผ่าน: ${escapeHtml(sqlError)} — นี่คือสัญญาณว่า input หลุดเข้าไปยุ่งกับโครงสร้างคำสั่งแล้ว</div>`;
    } else if (rows.length > 0) {
      const [userId, username, role] = rows[0];
      const isBypass = !realUser || realUser.username !== username;
      verdictHtml = isBypass
        ? `<div class="verdict bad">🔴 <strong>เจาะสำเร็จ!</strong> เข้าระบบได้ในฐานะ <strong>${escapeHtml(role)}</strong> (ผู้ใช้ ${escapeHtml(username)}) โดย<strong>ไม่ได้ใช้รหัสผ่านที่ถูกต้องเลย</strong> — นี่คือ SQL Injection</div>`
        : `<div class="verdict ok">🟢 Login สำเร็จตามปกติ (ข้อมูลถูกต้องจริง)</div>`;
    } else {
      verdictHtml = `<div class="verdict ok">🟢 ปฏิเสธการเข้าสู่ระบบ (ไม่พบข้อมูลตรงเงื่อนไข)</div>`;
    }

    outEl.innerHTML = `
      <div class="lab-section-title">📝 SQL ที่ถูกประกอบขึ้นจาก input ของคุณ</div>
      <div class="perf-sql"><pre>${escapeHtml(assembled)}</pre></div>
      ${verdictHtml}
    `;
    return;
  }

  // 🛡️ โหมดปลอดภัย: prepared statement + bind parameter (แบบเดียวกับบทที่ 21)
  const prepared = "SELECT user_id, username, role FROM demo_users WHERE username = ? AND password = ? LIMIT 1";
  const rows = [];
  const stmt = labDb.prepare(prepared);
  stmt.bind([u, p]);
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();

  outEl.innerHTML = `
    <div class="lab-section-title">📝 คำสั่งถูกส่งแยกจากข้อมูล (bind parameter)</div>
    <div class="perf-sql"><pre>${escapeHtml(prepared)}</pre></div>
    <div class="perf-custom-summary">
      <span class="result-stats-badge">ค่าที่ bind: username = ${escapeHtml(u || "(ว่าง)")} · password = ${escapeHtml(p || "(ว่าง)")}</span>
    </div>
    ${rows.length > 0
      ? `<div class="verdict ok">🟢 Login สำเร็จตามปกติ — ข้อมูลตรงจริงเท่านั้นถึงจะเข้าได้</div>`
      : `<div class="verdict ok">🟢 ปฏิเสธการเข้าสู่ระบบ — payload ของคุณถูกตีความเป็น "ข้อมูลธรรมดา" ไม่มีทางกลายเป็นคำสั่ง SQL ได้</div>`}
  `;
}

function openInjectionModal() {
  if (!injectionModal) return;
  renderInjectionLab();
  injectionModal.classList.add("active");
}

function closeInjectionModal() {
  if (injectionModal) injectionModal.classList.remove("active");
}

// ==========================================
// 8. APPLICATION INITIALIZATION
// ==========================================
async function initApp() {
  initTheme();
  loadProgress();
  renderCategoryFilters();

  // Search input handler
  if (lessonSearchInput) {
    lessonSearchInput.addEventListener("input", (e) => {
      searchQuery = e.target.value.trim();
      renderLessons();
    });
  }

  // Load SQLite WASM
  try {
    SQL = await initSqlJs({
      locateFile: file => `vendor/${file}`
    });

    db = loadSavedDatabase();

    if (!db) {
      db = new SQL.Database();
      db.run(initialSQL);
      saveDatabase();
    }

    if (statusDot) statusDot.classList.add("ready");
    if (statusText) statusText.textContent = "ฐานข้อมูลพร้อมใช้งาน (SQLite WASM)";

    renderLessons();
    showLesson();
  } catch (error) {
    console.error("Failed to initialize SQLite", error);
    if (statusText) statusText.textContent = "โหลดฐานข้อมูลไม่สำเร็จ";
    resultArea.innerHTML = `<div class="message error">❌ ไม่สามารถเริ่มต้น SQLite ได้: ${escapeHtml(error.message)}</div>`;
  }
}

// ==========================================
// 9. EVENT LISTENERS
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  initApp();

  // Toolbar & Editor Buttons
  document.getElementById("runBtn")?.addEventListener("click", runSQL);
  document.getElementById("resetBtn")?.addEventListener("click", resetDatabase);
  document.getElementById("loadExampleBtn")?.addEventListener("click", () => {
    editor.value = lessons[activeLessonIndex]?.sql || "";
    showToast("โหลดคำสั่งตัวอย่างแล้ว", "info");
  });
  document.getElementById("copySqlBtn")?.addEventListener("click", copySQLEditor);
  document.getElementById("formatSqlBtn")?.addEventListener("click", formatSQL);

  // Lesson Nav
  document.getElementById("prevLessonBtn")?.addEventListener("click", prevLesson);
  document.getElementById("nextLessonBtn")?.addEventListener("click", nextLesson);

  // Theme & Schema Modal
  document.getElementById("themeToggleBtn")?.addEventListener("click", toggleTheme);
  document.getElementById("schemaModalBtn")?.addEventListener("click", openSchemaModal);
  document.getElementById("closeSchemaModalBtn")?.addEventListener("click", closeSchemaModal);
  schemaModal?.addEventListener("click", (e) => {
    if (e.target === schemaModal) closeSchemaModal();
  });

  // JOIN Visualizer Modal
  document.getElementById("joinModalBtn")?.addEventListener("click", openJoinModal);
  document.getElementById("closeJoinModalBtn")?.addEventListener("click", closeJoinModal);
  joinModal?.addEventListener("click", (e) => {
    if (e.target === joinModal) closeJoinModal();
  });

  // Performance Lab Modal
  document.getElementById("perfModalBtn")?.addEventListener("click", openPerfModal);
  document.getElementById("closePerfModalBtn")?.addEventListener("click", closePerfModal);
  perfModal?.addEventListener("click", (e) => {
    if (e.target === perfModal) closePerfModal();
  });

  // Injection Lab Modal
  document.getElementById("injectionModalBtn")?.addEventListener("click", openInjectionModal);
  document.getElementById("closeInjectionModalBtn")?.addEventListener("click", closeInjectionModal);
  injectionModal?.addEventListener("click", (e) => {
    if (e.target === injectionModal) closeInjectionModal();
  });

  // Shortcut key listeners
  editor?.addEventListener("keydown", event => {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault();
      runSQL();
    }
  });

  window.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      closeSchemaModal();
      closeJoinModal();
      closePerfModal();
      closeInjectionModal();
    }
  });

  initCodeEditor();
});

// ==========================================
// 10. CODEMIRROR EDITOR (SQL highlight + autocomplete)
// ==========================================
// อัปเกรด textarea เป็น CodeMirror — โค้ดส่วนอื่นของแอปยังใช้ editor.value
// ได้ตามปกติเพราะมี property proxy จาก textarea เดิมเข้ากับ CodeMirror
let codeEditor = null;

function initCodeEditor() {
  if (typeof CodeMirror === "undefined" || !editor) return;

  // ตาราง + คอลัมน์จริงของ schema สำหรับ autocomplete (Ctrl + Space)
  const hintTables = {};
  databaseTables.forEach(t => {
    hintTables[t.name] = t.columns.map(c => c.name);
  });

  codeEditor = CodeMirror.fromTextArea(editor, {
    mode: "text/x-sqlite",
    lineNumbers: true,
    indentUnit: 2,
    tabSize: 2,
    smartIndent: true,
    extraKeys: {
      "Ctrl-Enter": () => runSQL(),
      "Cmd-Enter": () => runSQL(),
      "Ctrl-Space": (cm) => cm.showHint({
        hint: CodeMirror.hint.sql,
        tables: hintTables,
        completeSingle: false
      })
    }
  });

  codeEditor.setValue(editor.value || "");

  // proxy ค่า .value ของ textarea เดิมเข้ากับ CodeMirror
  // เพื่อให้ app.js ทุกส่วน (โหลดบทเรียน, ตรวจคำตอบ, จัดรูปแบบ, คัดลอก) ทำงานได้โดยไม่ต้องแก้
  Object.defineProperty(editor, "value", {
    get: () => codeEditor.getValue(),
    set: (v) => codeEditor.setValue(v == null ? "" : String(v)),
    configurable: true
  });
}
