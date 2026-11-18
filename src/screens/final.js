/**
 * src/screens/final.js
 * Final quiz & completion screen (#/final).
 */

import { navigate } from "../app/router.js";
import { el, append } from "../utils/dom.js";
import { loadCourse } from "../storage/store.js";
import { getCourse } from "../app/state.js";

export function renderFinal(container) {
  container.className = "screen";

  const course = getCourse() || loadCourse();
  if (!course) {
    navigate("/app");
    return;
  }

  const wrap = el("div", {
    cls: "path-screen card",
    attrs: { style: "max-width:600px;margin:40px auto;text-align:center;padding:32px;display:flex;flex-direction:column;gap:16px;align-items:center;" },
  });

  append(
    wrap,
    el("span", { text: "🎓", attrs: { style: "font-size:3.5rem;" }, dirAuto: false }),
    el("h2", { text: "Course Completed!" }),
    el("p", { cls: "text-muted", text: `Great job completing the course "${course.name}". You are ready for the final review.` })
  );

  const actions = el("div", { attrs: { style: "display:flex;gap:12px;margin-top:16px;" } });

  const teacherBtn = el("button", {
    cls: "btn btn-primary",
    text: "Open Tutor Chat",
    attrs: { type: "button" },
  });
  teacherBtn.addEventListener("click", () => navigate("/teacher"));

  const newCourseBtn = el("button", {
    cls: "btn btn-outline",
    text: "Study Another Course",
    attrs: { type: "button" },
  });
  newCourseBtn.addEventListener("click", () => navigate("/app"));

  append(actions, teacherBtn, newCourseBtn);
  wrap.appendChild(actions);

  container.appendChild(wrap);
}
