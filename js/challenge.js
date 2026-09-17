/**
 * SQL Journey — Challenge Checker (Logic กลาง)
 * ใช้ร่วมกันระหว่าง js/app.js และ tests/verify.cjs เพื่อไม่ให้ logic ตรวจสอบ
 * แตกต่างกันระหว่างสภาพแวดล้อม — แก้ไขที่ไฟล์นี้ที่เดียว
 *
 * ความสามารถ:
 *  - ตรวจโจทย์ประเภท query (เทียบผลลัพธ์) และ DML/DDL (เทียบสถานะ DB)
 *  - วิเคราะห์ "จุดที่ต่าง" เพื่อให้ feedback ระบุจุดผิดแก่ผู้เรียน
 *  - รองรับ challenge.unordered (เทียบแบบชุด ไม่สนลำดับแถว)
 *  - รองรับ challenge.requiredColumns (บังคับชื่อคอลัมน์ที่โจทย์ระบุ)
 */

// ==========================================
// 1. การเทียบสถานะฐานข้อมูล (โจทย์ DML / DDL)
// ==========================================
// options.includeDdl = true → รวม DDL ของ table/view/index ในการเทียบด้วย
// (ใช้กับโจทย์ Database Design ที่ต้องตรวจ constraints จริง เช่น FK, CHECK, PK)
// โจทย์ DML ทั่วไปไม่ต้องส่ง options จะเทียบเฉพาะข้อมูลตามเดิม

// normalize DDL ให้ทนต่อความต่างของ style (ตัวพิมพ์/เว้นวรรค/IF NOT EXISTS)
// ก่อนนำไปเทียบ เช่น "CREATE TABLE IF NOT EXISTS t(a INTEGER PRIMARY KEY)" == "create table t (a integer primary key)"
function normalizeDdl(sqlText) {
  return String(sqlText)
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/if(not)?exists/g, "");
}

function dumpDatabaseState(targetDb, options = {}) {
  const parts = [];

  if (options.includeDdl) {
    const ddlRows = targetDb.exec(
      "SELECT type, name, sql FROM sqlite_master WHERE sql IS NOT NULL AND name NOT LIKE 'sqlite_%' ORDER BY type, name"
    )[0].values;
    parts.push("DDL:" + ddlRows.map(row => `${row[0]} ${row[1]}=${normalizeDdl(row[2])}`).join("|"));
  }

  const tableNames = targetDb.exec(
    "SELECT name FROM sqlite_master WHERE type IN ('table', 'view') AND name NOT LIKE 'sqlite_%' ORDER BY name"
  )[0].values.flat();

  parts.push(tableNames.map(name => {
    const res = targetDb.exec(`SELECT * FROM "${name}"`);
    if (!res.length) return JSON.stringify([name, []]);
    return JSON.stringify([name, res[0].columns, res[0].values]);
  }).join("|"));

  return parts.join(";;");
}

// ==========================================
// 2. การแยกประเภทโจทย์จากคำสั่งเฉลย
// ==========================================
function getChallengeType(solution) {
  const first = solution.trim().toUpperCase();
  return (first.startsWith("SELECT") || first.startsWith("WITH")) ? "query" : "dml";
}

// ==========================================
// 3. การเทียบผลลัพธ์ Query พร้อมวิเคราะห์จุดที่ต่าง
// ==========================================

// ปัดเศษทศนิยมก่อนเทียบ กันปัญหา floating point จากการคำนวณด้วยสูตรคนละรูปแบบ
function normalizeChallengeValue(value) {
  if (typeof value === "number" && !Number.isInteger(value)) {
    return Math.round(value * 1e6) / 1e6;
  }
  return value;
}

function serializeChallengeRow(row) {
  return JSON.stringify(row.map(normalizeChallengeValue));
}

function sortedCopy(arr) {
  return [...arr].sort();
}

/**
 * เทียบผลลัพธ์ของผู้เรียน (userRes) กับเฉลย (expectedRes)
 *
 * @param {Array}  userRes     ผลลัพธ์จาก db.exec ของผู้เรียน
 * @param {Array}  expectedRes ผลลัพธ์จาก db.exec ของเฉลย
 * @param {Object} options     { unordered: bool, requiredColumns: string[] }
 * @returns {{correct: boolean, code: string, [key: string]: any}}
 *   code: ok | statement_count | column_count | row_count | values_differ |
 *         order_only | column_names
 */
function compareQueryResults(userRes, expectedRes, options = {}) {
  if (!userRes || !expectedRes || userRes.length !== expectedRes.length) {
    return {
      correct: false,
      code: "statement_count",
      userStatements: userRes ? userRes.length : 0,
      expectedStatements: expectedRes ? expectedRes.length : 0
    };
  }

  for (let i = 0; i < userRes.length; i++) {
    const u = userRes[i];
    const e = expectedRes[i];

    if (u.columns.length !== e.columns.length) {
      return {
        correct: false,
        code: "column_count",
        userColumns: u.columns.length,
        expectedColumns: e.columns.length
      };
    }

    if (u.values.length !== e.values.length) {
      return {
        correct: false,
        code: "row_count",
        userRows: u.values.length,
        expectedRows: e.values.length
      };
    }

    const userRows = u.values.map(serializeChallengeRow);
    const expectedRows = e.values.map(serializeChallengeRow);

    // หาแถวแรกที่ต่างกันตามลำดับ
    let diffRow = -1;
    for (let r = 0; r < userRows.length; r++) {
      if (userRows[r] !== expectedRows[r]) { diffRow = r; break; }
    }

    if (diffRow === -1) {
      // ค่าตรงทั้งหมด — เหลือตรวจชื่อคอลัมน์ที่โจทย์บังคับ (ถ้ามี)
      return checkRequiredColumns(u.columns, options.requiredColumns);
    }

    // ถ้าเรียงแล้วเหมือนกัน = ชุดข้อมูลถูก แต่ "ลำดับ" ต่าง
    if (options.unordered) {
      // โจทย์ไม่สนลำดับ → เทียบแบบชุด (multiset)
      if (JSON.stringify(sortedCopy(userRows)) === JSON.stringify(sortedCopy(expectedRows))) {
        return checkRequiredColumns(u.columns, options.requiredColumns);
      }
      return buildValuesDiffer(userRows, expectedRows, u, e, true);
    }

    if (JSON.stringify(sortedCopy(userRows)) === JSON.stringify(sortedCopy(expectedRows))) {
      return { correct: false, code: "order_only" };
    }

    return buildValuesDiffer(userRows, expectedRows, u, e, false, diffRow);
  }

  return { correct: true, code: "ok" };
}

function checkRequiredColumns(userColumns, requiredColumns) {
  if (requiredColumns && requiredColumns.length > 0) {
    const missing = requiredColumns.filter(name => !userColumns.includes(name));
    if (missing.length > 0) {
      return { correct: false, code: "column_names", missing };
    }
  }
  return { correct: true, code: "ok" };
}

// สร้างรายละเอียดจุดที่ค่าต่าง พร้อมชี้แถว/คอลัมน์แรกที่ไม่ตรง
function buildValuesDiffer(userRows, expectedRows, u, e, sortedMode, knownDiffRow = -1) {
  let diffRow = knownDiffRow;
  if (sortedMode) {
    const sortedUser = sortedCopy(userRows);
    const sortedExpected = sortedCopy(expectedRows);
    for (let r = 0; r < sortedUser.length; r++) {
      if (sortedUser[r] !== sortedExpected[r]) { diffRow = r; break; }
    }
    if (diffRow === -1) diffRow = 0;
    return { correct: false, code: "values_differ" };
  }

  // โหมดตามลำดับ: ชี้แถว/คอลัมน์แรกที่ค่าไม่ตรงให้ผู้เรียนเห็นชัด ๆ
  let diffCol = -1;
  for (let c = 0; c < u.columns.length; c++) {
    const uv = JSON.stringify(normalizeChallengeValue(u.values[diffRow][c]));
    const ev = JSON.stringify(normalizeChallengeValue(e.values[diffRow][c]));
    if (uv !== ev) { diffCol = c; break; }
  }

  return {
    correct: false,
    code: "values_differ",
    row: diffRow + 1,
    column: diffCol >= 0 ? (e.columns[diffCol] || u.columns[diffCol] || `#${diffCol + 1}`) : null,
    userValue: diffCol >= 0 ? u.values[diffRow][diffCol] : null,
    expectedValue: diffCol >= 0 ? e.values[diffRow][diffCol] : null
  };
}
