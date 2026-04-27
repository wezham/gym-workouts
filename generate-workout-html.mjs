import fs from "node:fs/promises";
import path from "node:path";

const DEFAULT_INPUT = path.resolve(process.cwd(), "workout-plan.csv");
const DEFAULT_OUTPUT = path.resolve(process.cwd(), "workout-plan.html");
const DEFAULT_TIMEZONE = "Australia/Sydney";
const EXERCISE_DESCRIPTIONS = {
  "Arnold Press": "Start with dumbbells in front of your shoulders, palms facing you. Rotate the palms outward as you press overhead, then reverse the motion on the way down.",
  "Bent Over Row": "Hinge at the hips with a flat back, hold the bar below you, and row it toward your lower ribs while keeping your torso steady.",
  "Bulgarian Split Squat": "Stand in a split stance with your back foot elevated on a bench. Lower your back knee toward the floor, then drive through the front foot to stand.",
  "Cable Crunch": "Kneel facing a high cable, hold the rope near your temples, and curl your ribs toward your hips without pulling mostly with the arms.",
  "Cable Lateral Raise": "Stand side-on to a low cable and raise one arm out to the side to shoulder height with a slight bend in the elbow.",
  "Chest Supported Row": "Lie chest-down on an incline bench and row the weights toward your torso. Let the bench remove momentum and keep the upper back doing the work.",
  "Dips": "Support yourself on parallel bars, lower until your shoulders are just below elbows if comfortable, then press back up while keeping control.",
  "Hanging Knee Raises": "Hang from a bar, brace your torso, and lift your knees toward your chest without swinging your body.",
  "Incline Curl": "Sit back on an incline bench with arms hanging down. Curl the dumbbells up while keeping your upper arms mostly fixed.",
  "Lateral Raise (slow tempo)": "Raise the dumbbells to shoulder height with control, pause briefly, then lower slowly to keep tension on the side delts.",
  "Leg Raises": "Lie flat or hang supported, keep your core braced, and lift your legs under control without using momentum.",
  "Plank": "Hold a straight line from shoulders to heels with elbows under shoulders, glutes tight, and ribs tucked down.",
  "RDL": "Push your hips back with a soft knee bend and lower the weight along your legs until you feel your hamstrings load, then drive the hips forward to stand.",
  "Romanian Deadlift": "Push your hips back with a soft knee bend and lower the weight along your legs until you feel your hamstrings load, then drive the hips forward to stand.",
  "T-Bar Row": "Brace your torso, pull the handle toward your chest or upper stomach, and lower it with control without jerking your back.",
  "Tricep Pushdown": "Keep your elbows pinned near your sides and press the handle down until your arms are straight, then return under control.",
  "Tricep Rope Pushdown": "Keep elbows tucked in, spread the rope slightly at the bottom, and control the return without letting the shoulders roll forward.",
};

function getArgValue(flag) {
  const index = process.argv.indexOf(flag);
  if (index === -1 || index === process.argv.length - 1) {
    return null;
  }

  return process.argv[index + 1];
}

function getTodayString(timeZone) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function parseCsv(text) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error("CSV must include a header row and at least one data row.");
  }

  const headers = lines[0].split(",").map((value) => value.trim());

  return lines.slice(1).map((line, index) => {
    const values = line.split(",").map((value) => value.trim());

    if (values.length !== headers.length) {
      throw new Error(
        `CSV row ${index + 2} has ${values.length} columns; expected ${headers.length}.`,
      );
    }

    return Object.fromEntries(headers.map((header, headerIndex) => [header, values[headerIndex]]));
  });
}

function buildProgram(rows) {
  const weeks = new Map();

  for (const row of rows) {
    const weekNumber = Number(row.Week);
    if (!Number.isInteger(weekNumber) || weekNumber < 1) {
      throw new Error(`Invalid week value: ${row.Week}`);
    }

    if (!weeks.has(weekNumber)) {
      weeks.set(weekNumber, {
        weekNumber,
        days: {
          "Day 1": [],
          "Day 2": [],
        },
      });
    }

    const week = weeks.get(weekNumber);
    const day = row.Day;

    if (!week.days[day]) {
      week.days[day] = [];
    }

    week.days[day].push({
      block: row.Block,
      exercise: row.Exercise,
      sets: row.Sets,
      reps: row.Reps,
      notes: row.Notes,
      description: EXERCISE_DESCRIPTIONS[row.Exercise] || "",
    });
  }

  const orderedWeeks = [...weeks.values()].sort((a, b) => a.weekNumber - b.weekNumber);

  if (orderedWeeks.length !== 12) {
    throw new Error(`Expected 12 weeks in the CSV, found ${orderedWeeks.length}.`);
  }

  for (const week of orderedWeeks) {
    for (const dayName of ["Day 1", "Day 2"]) {
      if (!week.days[dayName] || week.days[dayName].length === 0) {
        throw new Error(`Week ${week.weekNumber} is missing ${dayName}.`);
      }
    }
  }

  return orderedWeeks;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderHtml({ program, startDate, timezone, sourceName }) {
  const payload = JSON.stringify({
    startDate,
    timezone,
    sourceName,
    weeks: program,
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>12 Week Workout Plan</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #eef3f7;
      --panel: rgba(255, 255, 255, 0.92);
      --panel-strong: #ffffff;
      --line: rgba(17, 24, 39, 0.08);
      --text: #17202a;
      --muted: #5f6c7b;
      --accent: #0f766e;
      --accent-strong: #115e59;
      --accent-soft: rgba(15, 118, 110, 0.12);
      --shadow: 0 18px 50px rgba(27, 39, 51, 0.08);
      --radius-lg: 24px;
      --radius-md: 18px;
      --radius-sm: 12px;
      --font-display: "Avenir Next", "Segoe UI", sans-serif;
      --font-body: "IBM Plex Sans", "Segoe UI", sans-serif;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      min-height: 100vh;
      font-family: var(--font-body);
      color: var(--text);
      background:
        radial-gradient(circle at top left, rgba(15, 118, 110, 0.15), transparent 30%),
        radial-gradient(circle at top right, rgba(59, 130, 246, 0.12), transparent 26%),
        linear-gradient(180deg, #f7fafc 0%, var(--bg) 100%);
    }

    body::before {
      content: "";
      position: fixed;
      inset: 0;
      pointer-events: none;
      background: linear-gradient(180deg, rgba(247, 250, 252, 0) 0%, rgba(247, 250, 252, 0.22) 100%);
    }

    .shell {
      width: min(1180px, calc(100% - 24px));
      margin: 0 auto;
      padding: 20px 0 48px;
    }

    .hero {
      padding: 28px;
      border-radius: var(--radius-lg);
      background:
        linear-gradient(135deg, rgba(15, 118, 110, 0.98), rgba(30, 64, 175, 0.92)),
        #124c64;
      color: #f8fbff;
      box-shadow: var(--shadow);
      overflow: hidden;
      position: relative;
    }

    .hero::after {
      content: "";
      position: absolute;
      inset: auto -10% -35% auto;
      width: 280px;
      height: 280px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.08);
      filter: blur(6px);
    }

    .hero-top,
    .stats,
    .workspace,
    .week-grid,
    .exercise-table {
      position: relative;
      z-index: 1;
    }

    .eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 7px 12px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.14);
      font-size: 13px;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    h1 {
      margin: 16px 0 10px;
      font-family: var(--font-display);
      font-size: clamp(30px, 6vw, 52px);
      line-height: 0.96;
      letter-spacing: -0.04em;
    }

    .hero-copy {
      max-width: 700px;
      margin: 0;
      font-size: 16px;
      line-height: 1.55;
      color: rgba(248, 251, 255, 0.88);
    }

    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
      gap: 12px;
      margin-top: 24px;
    }

    .stat {
      padding: 16px 18px;
      border-radius: var(--radius-md);
      background: rgba(255, 255, 255, 0.12);
      border: 1px solid rgba(255, 255, 255, 0.08);
      backdrop-filter: blur(10px);
    }

    .stat-label {
      display: block;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: rgba(248, 251, 255, 0.7);
      margin-bottom: 8px;
    }

    .stat-value {
      font-size: 28px;
      font-weight: 700;
      letter-spacing: -0.03em;
    }

    .workspace {
      display: grid;
      grid-template-columns: 1.2fr 0.8fr;
      gap: 18px;
      margin-top: 18px;
    }

    .panel {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow);
      backdrop-filter: blur(10px);
    }

    .panel-inner {
      padding: 22px;
    }

    .panel-title {
      margin: 0 0 6px;
      font-family: var(--font-display);
      font-size: 24px;
      letter-spacing: -0.03em;
    }

    .panel-subtitle {
      margin: 0;
      color: var(--muted);
      line-height: 1.55;
    }

    .control-row {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 20px;
      margin-bottom: 18px;
    }

    .chip {
      appearance: none;
      border: 1px solid rgba(15, 118, 110, 0.12);
      background: #ffffff;
      color: var(--text);
      min-height: 48px;
      padding: 12px 16px;
      border-radius: 999px;
      font: inherit;
      font-weight: 600;
      cursor: pointer;
      transition: transform 160ms ease, background 160ms ease, border-color 160ms ease;
    }

    .chip:hover,
    .chip:focus-visible {
      transform: translateY(-1px);
      border-color: rgba(15, 118, 110, 0.35);
      outline: none;
    }

    .chip.active {
      background: var(--accent);
      color: #ffffff;
      border-color: var(--accent);
      box-shadow: 0 10px 24px rgba(15, 118, 110, 0.22);
    }

    .summary-strip {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-bottom: 18px;
    }

    .summary-pill {
      padding: 10px 14px;
      border-radius: 14px;
      background: var(--accent-soft);
      color: var(--accent-strong);
      font-weight: 600;
    }

    .exercise-table {
      width: 100%;
      border-collapse: collapse;
      overflow: hidden;
      border-radius: 16px;
      background: var(--panel-strong);
      border: 1px solid var(--line);
    }

    .exercise-table th,
    .exercise-table td {
      padding: 14px 14px;
      text-align: left;
      border-bottom: 1px solid var(--line);
      vertical-align: top;
    }

    .exercise-table th {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--muted);
      background: #f8fafc;
    }

    .exercise-table tbody tr:last-child td {
      border-bottom: none;
    }

    .exercise-name {
      font-weight: 700;
      color: #10212d;
    }

    .block-tag {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 42px;
      padding: 7px 10px;
      border-radius: 999px;
      background: rgba(15, 118, 110, 0.1);
      color: var(--accent-strong);
      font-weight: 700;
    }

    .week-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
      margin-top: 18px;
    }

    .week-button {
      appearance: none;
      text-align: left;
      padding: 16px;
      min-height: 108px;
      border-radius: 18px;
      border: 1px solid var(--line);
      background: #ffffff;
      cursor: pointer;
      transition: transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease;
    }

    .week-button:hover,
    .week-button:focus-visible {
      transform: translateY(-1px);
      border-color: rgba(15, 118, 110, 0.35);
      box-shadow: 0 10px 24px rgba(15, 118, 110, 0.12);
      outline: none;
    }

    .week-button.active {
      border-color: var(--accent);
      background: linear-gradient(180deg, #ffffff 0%, rgba(15, 118, 110, 0.06) 100%);
    }

    .week-button.current::after {
      content: "Current";
      display: inline-block;
      margin-top: 10px;
      padding: 6px 9px;
      border-radius: 999px;
      background: rgba(15, 118, 110, 0.12);
      color: var(--accent-strong);
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .week-number {
      display: block;
      font-size: 14px;
      font-weight: 700;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 6px;
    }

    .week-focus {
      margin: 0;
      font-size: 18px;
      font-weight: 700;
      letter-spacing: -0.03em;
      color: #10212d;
    }

    .week-caption {
      margin-top: 8px;
      color: var(--muted);
      line-height: 1.45;
      font-size: 14px;
    }

    .footer-note {
      margin-top: 18px;
      font-size: 14px;
      color: var(--muted);
      line-height: 1.6;
    }

    .mobile-section-label {
      display: none;
    }

    @media (max-width: 900px) {
      .workspace {
        grid-template-columns: 1fr;
      }

      .week-grid {
        grid-template-columns: 1fr 1fr;
      }
    }

    @media (max-width: 640px) {
      .shell {
        width: min(100% - 16px, 100%);
        padding-top: 12px;
        padding-bottom: 24px;
      }

      .hero,
      .panel-inner {
        padding: 18px;
      }

      .hero {
        border-radius: 22px;
      }

      .stats {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .stat {
        padding: 14px;
      }

      .stat-value {
        font-size: 24px;
      }

      .panel-title {
        font-size: 22px;
      }

      .control-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
      }

      .chip {
        width: 100%;
        justify-content: center;
      }

      .exercise-table thead {
        display: none;
      }

      .exercise-table,
      .exercise-table tbody,
      .exercise-table tr,
      .exercise-table td {
        display: block;
        width: 100%;
      }

      .exercise-table tr {
        padding: 14px;
        margin-bottom: 12px;
        border: 1px solid var(--line);
        border-radius: 18px;
        background: #ffffff;
        box-shadow: 0 10px 28px rgba(27, 39, 51, 0.06);
      }

      .exercise-table tr:last-child {
        margin-bottom: 0;
      }

      .exercise-table td {
        border: none;
        padding: 6px 0;
      }

      .exercise-table td::before {
        content: attr(data-label);
        display: block;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--muted);
        margin-bottom: 4px;
      }

      .exercise-table td[data-label="Exercise"] {
        padding-top: 0;
      }

      .exercise-table td[data-label="Exercise"]::before {
        display: none;
      }

      .exercise-name {
        display: block;
        font-size: 18px;
        line-height: 1.25;
        margin-bottom: 4px;
      }

      .exercise-table td[data-label="Block"] {
        padding-bottom: 2px;
      }

      .exercise-table td[data-label="Sets"],
      .exercise-table td[data-label="Reps"] {
        display: inline-block;
        width: 48%;
        vertical-align: top;
      }

      .exercise-table td[data-label="Notes"],
      .exercise-table td[data-label="How It Works"] {
        padding-top: 10px;
      }

      .mobile-section-label {
        display: block;
        margin: 0 0 12px;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--muted);
      }

      .week-grid {
        grid-template-columns: 1fr;
      }

      .week-button {
        min-height: 96px;
      }

      .footer-note {
        font-size: 13px;
      }
    }

    @media (max-width: 420px) {
      .hero,
      .panel-inner {
        padding: 16px;
      }

      h1 {
        font-size: 32px;
      }

      .hero-copy {
        font-size: 15px;
      }

      .stats {
        grid-template-columns: 1fr;
      }

      .control-row {
        grid-template-columns: 1fr;
      }

      .exercise-name {
        font-size: 17px;
      }

      .exercise-table td[data-label="Sets"],
      .exercise-table td[data-label="Reps"] {
        display: block;
        width: 100%;
      }
    }
  </style>
</head>
<body>
  <div class="shell">
    <section class="hero">
      <div class="hero-top">
        <span class="eyebrow">12 Week Training Cycle</span>
        <h1>Know exactly what to train when you walk into the gym.</h1>
        <p class="hero-copy">
          This plan starts on <strong id="start-date-text"></strong> and loops across all 12 weeks.
          Open it on your phone, check the current week, switch to Day 1 or Day 2, and train without digging through spreadsheets.
        </p>
      </div>
      <div class="stats">
        <div class="stat">
          <span class="stat-label">Current Week</span>
          <span class="stat-value" id="current-week-stat">Week 1</span>
        </div>
        <div class="stat">
          <span class="stat-label">Workout Today</span>
          <span class="stat-value" id="current-day-stat">Day 1</span>
        </div>
        <div class="stat">
          <span class="stat-label">Phase Progress</span>
          <span class="stat-value" id="phase-progress-stat">1 / 12</span>
        </div>
        <div class="stat">
          <span class="stat-label">Cycle Length</span>
          <span class="stat-value">84 Days</span>
        </div>
      </div>
    </section>

    <section class="workspace">
      <article class="panel">
        <div class="panel-inner">
          <h2 class="panel-title" id="workout-title">Week 1, Day 1</h2>
          <p class="panel-subtitle" id="workout-subtitle"></p>

          <div class="control-row" id="day-controls"></div>
          <div class="summary-strip" id="summary-strip"></div>
          <p class="mobile-section-label">Exercises</p>

          <table class="exercise-table">
            <thead>
              <tr>
                <th>Block</th>
                <th>Exercise</th>
                <th>Sets</th>
                <th>Reps</th>
                <th>Notes</th>
                <th>How It Works</th>
              </tr>
            </thead>
            <tbody id="exercise-body"></tbody>
          </table>
        </div>
      </article>

      <aside class="panel">
        <div class="panel-inner">
          <h2 class="panel-title">Week Selector</h2>
          <p class="panel-subtitle">
            The current week is selected automatically from today’s date, but you can jump anywhere in the 12-week block.
          </p>

          <div class="week-grid" id="week-grid"></div>

          <p class="footer-note">
            Source: <span id="source-name"></span><br>
            Timezone: <span id="timezone-name"></span>
          </p>
        </div>
      </aside>
    </section>
  </div>

  <script>
    const plan = ${payload};

    const MS_PER_DAY = 24 * 60 * 60 * 1000;
    const state = {
      selectedWeekIndex: 0,
      selectedDay: "Day 1",
    };

    function dateAtMidnight(dateString) {
      return new Date(dateString + "T00:00:00");
    }

    function formatLongDate(dateString, timeZone) {
      return new Intl.DateTimeFormat("en-AU", {
        timeZone,
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(dateAtMidnight(dateString));
    }

    function formatShortDate(date) {
      return new Intl.DateTimeFormat("en-AU", {
        weekday: "short",
        day: "numeric",
        month: "short",
      }).format(date);
    }

    function mod(value, divisor) {
      return ((value % divisor) + divisor) % divisor;
    }

    function computeCurrentState() {
      const today = new Date();
      const start = dateAtMidnight(plan.startDate);
      const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const elapsedDays = Math.floor((todayMidnight - start) / MS_PER_DAY);
      const weekIndex = mod(Math.floor(elapsedDays / 7), plan.weeks.length);
      const daysIntoWeek = mod(elapsedDays, 7);
      const day = daysIntoWeek <= 2 ? "Day 1" : "Day 2";

      return { weekIndex, day, elapsedDays, daysIntoWeek };
    }

    function getWeekSummary(week) {
      const dayOneMain = week.days["Day 1"][0]?.exercise || "Workout";
      const dayTwoMain = week.days["Day 2"][0]?.exercise || "Workout";
      return { dayOneMain, dayTwoMain };
    }

    function createButton(label, className, onClick) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = className;
      button.textContent = label;
      button.addEventListener("click", onClick);
      return button;
    }

    function renderWeekButtons(currentWeekIndex) {
      const weekGrid = document.getElementById("week-grid");
      weekGrid.innerHTML = "";

      plan.weeks.forEach((week, index) => {
        const summary = getWeekSummary(week);
        const button = document.createElement("button");
        button.type = "button";
        button.className = "week-button";

        if (index === state.selectedWeekIndex) {
          button.classList.add("active");
        }

        if (index === currentWeekIndex) {
          button.classList.add("current");
        }

        button.innerHTML = [
          '<span class="week-number">Week ' + week.weekNumber + '</span>',
          '<p class="week-focus">' + escapeHtml(summary.dayOneMain) + '</p>',
          '<p class="week-caption">Day 1: ' + escapeHtml(summary.dayOneMain) + '<br>Day 2: ' + escapeHtml(summary.dayTwoMain) + '</p>'
        ].join("");

        button.addEventListener("click", () => {
          state.selectedWeekIndex = index;
          render();
        });

        weekGrid.appendChild(button);
      });
    }

    function renderDayButtons() {
      const container = document.getElementById("day-controls");
      container.innerHTML = "";

      ["Day 1", "Day 2"].forEach((day) => {
        const button = createButton(day, "chip" + (state.selectedDay === day ? " active" : ""), () => {
          state.selectedDay = day;
          render();
        });
        container.appendChild(button);
      });
    }

    function renderSummary(currentWeek) {
      const week = plan.weeks[state.selectedWeekIndex];
      const dayEntries = week.days[state.selectedDay];
      const summaryStrip = document.getElementById("summary-strip");
      const uniqueBlocks = [...new Set(dayEntries.map((entry) => entry.block))];
      const isCurrentWeek = state.selectedWeekIndex === currentWeek.weekIndex;
      const weekStart = new Date(dateAtMidnight(plan.startDate).getTime() + state.selectedWeekIndex * 7 * MS_PER_DAY);
      const weekEnd = new Date(weekStart.getTime() + 6 * MS_PER_DAY);

      const pills = [
        isCurrentWeek ? "Current training week" : "Planned week",
        uniqueBlocks.length + " exercise blocks",
        dayEntries.length + " total movements",
        formatShortDate(weekStart) + " to " + formatShortDate(weekEnd),
      ];

      summaryStrip.innerHTML = pills
        .map((pill) => '<span class="summary-pill">' + escapeHtml(pill) + "</span>")
        .join("");
    }

    function renderTable() {
      const body = document.getElementById("exercise-body");
      const week = plan.weeks[state.selectedWeekIndex];
      const dayEntries = week.days[state.selectedDay];

      body.innerHTML = dayEntries
        .map((entry) => {
          const notes = entry.notes ? escapeHtml(entry.notes) : " ";
          const description = entry.description ? escapeHtml(entry.description) : " ";
          return \`
            <tr>
              <td data-label="Block"><span class="block-tag">\${escapeHtml(entry.block)}</span></td>
              <td data-label="Exercise"><span class="exercise-name">\${escapeHtml(entry.exercise)}</span></td>
              <td data-label="Sets">\${escapeHtml(entry.sets)}</td>
              <td data-label="Reps">\${escapeHtml(entry.reps)}</td>
              <td data-label="Notes">\${notes}</td>
              <td data-label="How It Works">\${description}</td>
            </tr>
          \`;
        })
        .join("");
    }

    function renderHeader(currentWeek) {
      const week = plan.weeks[state.selectedWeekIndex];
      const isCurrentWeek = state.selectedWeekIndex === currentWeek.weekIndex;
      const title = "Week " + week.weekNumber + ", " + state.selectedDay;
      const subtitle = isCurrentWeek
        ? "This is the workout scheduled for the current week in your live 12-week cycle."
        : "You are viewing a different week in the cycle. Use this to plan ahead or review previous sessions.";

      document.getElementById("workout-title").textContent = title;
      document.getElementById("workout-subtitle").textContent = subtitle;
      document.getElementById("current-week-stat").textContent = "Week " + plan.weeks[currentWeek.weekIndex].weekNumber;
      document.getElementById("current-day-stat").textContent = currentWeek.day;
      document.getElementById("phase-progress-stat").textContent =
        plan.weeks[currentWeek.weekIndex].weekNumber + " / " + plan.weeks.length;
      document.getElementById("start-date-text").textContent = formatLongDate(plan.startDate, plan.timezone);
    }

    function renderStaticMeta() {
      document.getElementById("source-name").textContent = plan.sourceName;
      document.getElementById("timezone-name").textContent = plan.timezone;
    }

    function render() {
      const currentWeek = computeCurrentState();
      renderHeader(currentWeek);
      renderDayButtons();
      renderSummary(currentWeek);
      renderTable();
      renderWeekButtons(currentWeek.weekIndex);
      renderStaticMeta();
    }

    function escapeHtml(value) {
      return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
    }

    (function init() {
      const current = computeCurrentState();
      state.selectedWeekIndex = current.weekIndex;
      state.selectedDay = current.day;
      render();
    })();
  </script>
</body>
</html>`;
}

async function main() {
  const inputPath = path.resolve(getArgValue("--input") || DEFAULT_INPUT);
  const outputPath = path.resolve(getArgValue("--output") || DEFAULT_OUTPUT);
  const timezone = getArgValue("--timezone") || DEFAULT_TIMEZONE;
  const startDate = getArgValue("--start-date") || getTodayString(timezone);

  const csvText = await fs.readFile(inputPath, "utf8");
  const rows = parseCsv(csvText);
  const program = buildProgram(rows);
  const html = renderHtml({
    program,
    startDate,
    timezone,
    sourceName: path.basename(inputPath),
  });

  await fs.writeFile(outputPath, html, "utf8");

  console.log(`Created ${outputPath}`);
  console.log(`Plan start date: ${startDate}`);
  console.log(`Weeks loaded: ${program.length}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
