
import { navigate }                     from "../app/router.js";
import { el, append, empty }            from "../utils/dom.js";
import { createModal, renderModePopup, renderOutlineModal } from "../components/modal.js";
import { saveCourse }                   from "../storage/store.js";
import { setCourse }                    from "../app/state.js";
import { processDocument }              from "../document/pipeline.js";
import { listUserBooks, saveUserBook, deleteUserBooks } from "../lib/bookRepository.js";
import { getCurrentUser, signOut } from "../lib/authProvider.js";

// ── Starter sample data retained for reference but not used in account libraries ──

function _buildStarterCourse(id, name, sections) {
  return {
    id,
    name,
    createdAt: Date.now(),
    chapters: [{ id: 1, title: name, sections }],
    sections,
  };
}

function _getSampleDocs() {
  return [
    {
      id: "sample-1",
      name: "Databases course",
      progress: 72,
      modifiedAt: Date.now() - 1 * 86400e3,
      course: _buildStarterCourse("sample-1", "Databases course", [
        {
          id: 1,
          title: "Relational Model & Keys",
          text: "A relational database stores data in tables made of rows (tuples) and columns (attributes). A primary key uniquely identifies each row in a table and cannot be null. A foreign key links one table to the primary key of another table, preserving referential integrity across related records.",
        },
        {
          id: 2,
          title: "Normalization & ACID Transactions",
          text: "Normalization organizes tables to reduce data redundancy and prevent update anomalies. First Normal Form requires atomic values, Second Normal Form removes partial dependencies, and Third Normal Form removes transitive dependencies. Transactions follow ACID properties: Atomicity, Consistency, Isolation, and Durability.",
        },
      ]),
    },
    {
      id: "sample-2",
      name: "Cybersecurity",
      progress: 45,
      modifiedAt: Date.now() - 2 * 86400e3,
      course: _buildStarterCourse("sample-2", "Cybersecurity", [
        {
          id: 1,
          title: "The CIA Triad",
          text: "Information security rests on three core principles called the CIA triad: Confidentiality, Integrity, and Availability. Confidentiality keeps sensitive data private through encryption and access control. Integrity ensures data cannot be altered without authorization. Availability guarantees systems stay accessible when needed.",
        },
        {
          id: 2,
          title: "Authentication & Encryption",
          text: "Strong authentication verifies identity using something you know, something you have, or something you are. Multi-factor authentication combines two or more factors to stop credential theft. Symmetric encryption uses a single shared key for speed, while asymmetric encryption uses a public and private key pair.",
        },
      ]),
    },
    {
      id: "sample-3",
      name: "Introduction to React",
      progress: 60,
      modifiedAt: Date.now() - 3 * 86400e3,
      course: _buildStarterCourse("sample-3", "Introduction to React", [
        {
          id: 1,
          title: "Components & Props",
          text: "React applications are built from reusable components that return user interface elements. Props are read-only inputs passed from a parent component to a child component, allowing the same component structure to render different data cleanly.",
        },
        {
          id: 2,
          title: "State & Effects",
          text: "State stores dynamic data that changes over time inside a component. When state updates, React re-renders only the affected parts of the interface. Effects synchronize a component with external systems such as timers, browser storage, or network requests.",
        },
      ]),
    },
    {
      id: "sample-4",
      name: "Linear Algebra – Chap. 3",
      progress: 90,
      modifiedAt: Date.now() - 4 * 86400e3,
      course: _buildStarterCourse("sample-4", "Linear Algebra – Chap. 3", [
        {
          id: 1,
          title: "Vectors & Linear Independence",
          text: "A vector space is a collection of vectors that can be scaled and added together. Vectors are linearly independent if no vector in the set can be written as a linear combination of the others. A basis is a linearly independent set that spans the entire space.",
        },
        {
          id: 2,
          title: "Eigenvalues & Eigenvectors",
          text: "For a square matrix A, a non-zero vector v is an eigenvector if multiplying A by v only scales v by a scalar factor called the eigenvalue. Eigenvalues reveal the stretching directions and stability behavior of linear transformations.",
        },
      ]),
    },
    {
      id: "sample-5",
      name: "Algorithms & Complexity",
      progress: 30,
      modifiedAt: Date.now() - 5 * 86400e3,
      course: _buildStarterCourse("sample-5", "Algorithms & Complexity", [
        {
          id: 1,
          title: "Big-O Asymptotic Notation",
          text: "Big-O notation describes how an algorithm's runtime or memory grows as the input size n increases. Constant time O(1) stays fixed, logarithmic time O(log n) halves the search space each step, and linear time O(n) grows proportionally with input length.",
        },
        {
          id: 2,
          title: "Divide and Conquer",
          text: "Divide and conquer algorithms break a problem into smaller subproblems, solve each recursively, and combine the results. Merge sort splits an array in half and merges sorted halves in O(n log n) time, making it reliable even on large unsorted datasets.",
        },
      ]),
    },
    {
      id: "sample-6",
      name: "Network Protocols",
      progress: 55,
      modifiedAt: Date.now() - 6 * 86400e3,
      course: _buildStarterCourse("sample-6", "Network Protocols", [
        {
          id: 1,
          title: "TCP vs UDP Transport",
          text: "TCP is a connection-oriented protocol that guarantees ordered, reliable delivery through acknowledgments and retransmissions. UDP is connectionless and lightweight, trading reliability for lower latency in live video, voice calls, and online gaming.",
        },
        {
          id: 2,
          title: "HTTP & DNS Resolution",
          text: "DNS translates human-readable domain names into IP addresses so browsers can locate servers. Over that connection, HTTP defines request and response methods such as GET, POST, and status codes so clients and servers can exchange web resources.",
        },
      ]),
    },
  ];
}

// ── Date formatting ────────────────────────────────────────────────────────────

function _formatDate(ts) {
  const d   = new Date(ts);
  const now = new Date();
  const diff = now - d;

  if (diff < 60e3)         return "Just now";
  if (diff < 3600e3)       return `${Math.floor(diff / 60e3)}m ago`;
  if (diff < 86400e3)      return `${Math.floor(diff / 3600e3)}h ago`;
  if (diff < 2 * 86400e3)  return "Yesterday";

  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

// ── Main export ────────────────────────────────────────────────────────────────

export function renderDashboard(container) {
  container.className = "screen dash-root";

  // ── Shared blurred pastel background (matches landing page) ──────────────
  const bgDiv = el("div", { cls: "landing-bg", attrs: { "aria-hidden": "true" } });
  const bgImg = el("img", {
    cls: "landing-bg-img",
    attrs: { src: "/assets/aistudio/side.png", alt: "" },
  });
  bgImg.onerror = () => { bgImg.style.display = "none"; };
  const bgOverlay = el("div", { cls: "landing-bg-overlay" });
  append(bgDiv, bgImg, bgOverlay);

  // ── State ────────────────────────────────────────────────────────────────
  let docs      = [];
  let searchQ   = "";
  let sortDir   = -1;
  let selected  = new Set();
  let renameId  = null;

  // ── Sidebar ──────────────────────────────────────────────────────────────
  const sidebar = el("aside", { cls: "dash-sidebar", attrs: { "aria-label": "Sidebar" } });

  const logoWrap = el("a", {
    cls: "dash-sidebar-logo",
    attrs: { href: "#/", "aria-label": "Lilet r3ad Home" },
  });
  const mascotImg = el("img", {
    cls: "dash-mascot-img",
    attrs: {
      src: "/assets/aistudio/side.png",
      alt: "Lilet3ad icon",
    },
  });
  const logoText = el("span", { cls: "dash-logo-text", text: "Lilet Raad", dirAuto: false });
  append(logoWrap, mascotImg, logoText);

  // Nav
  const nav = el("nav", { cls: "dash-nav", attrs: { "aria-label": "Main navigation" } });

  const navDocs = el("button", {
    cls: "dash-nav-item dash-nav-item--active",
    attrs: { type: "button", "aria-current": "page", "aria-label": "All documents" },
  });
  append(navDocs, _svgBook(), el("span", { text: "All documents" }));

  const navHome = el("button", {
    cls: "dash-nav-item dash-home-btn",
    attrs: { type: "button", "aria-label": "Back to landing page" },
  });
  append(navHome, _svgHome(), el("span", { text: "Home" }));
  navHome.addEventListener("click", () => navigate("/"));

  append(nav, navDocs);

  // Theme toggle (bottom of sidebar)
  const themeToggleWrap = el("div", { cls: "dash-theme-wrap" });
  const themeLabel = el("span", { cls: "dash-theme-label", text: "Theme" });
  const themeToggle = _buildThemeToggle();
  append(themeToggleWrap, themeLabel, themeToggle);

  append(sidebar, logoWrap, nav, themeToggleWrap, navHome);

  // Mobile menu button
  const menuBtn = el("button", {
    cls: "dash-menu-btn btn btn-ghost btn-sm",
    attrs: { type: "button", "aria-label": "Open sidebar", "aria-expanded": "false" },
  });
  menuBtn.appendChild(_svgMenu());

  let drawerOpen = false;
  menuBtn.addEventListener("click", () => {
    drawerOpen = !drawerOpen;
    sidebar.classList.toggle("dash-sidebar--open", drawerOpen);
    overlay.classList.toggle("dash-drawer-overlay--open", drawerOpen);
    menuBtn.setAttribute("aria-expanded", String(drawerOpen));
  });

  const overlay = el("div", { cls: "dash-drawer-overlay" });
  overlay.setAttribute("aria-hidden", "true");
  overlay.addEventListener("click", () => {
    drawerOpen = false;
    sidebar.classList.remove("dash-sidebar--open");
    overlay.classList.remove("dash-drawer-overlay--open");
    menuBtn.setAttribute("aria-expanded", "false");
  });

  // ── Header ───────────────────────────────────────────────────────────────
  const header = el("header", { cls: "dash-header", attrs: { role: "banner" } });

  const headerLeft = el("div", { cls: "dash-header-left" });
  const breadcrumb = el("span", { cls: "dash-breadcrumb", text: "Study Workspace" });
  append(headerLeft, menuBtn, breadcrumb);

  const headerRight = el("div", { cls: "dash-header-right" });

  const aboutBtn = el("button", {
    cls: "dash-header-link",
    text: "About us",
    attrs: { type: "button", "aria-label": "About Lilet_r3ad" },
  });
  aboutBtn.addEventListener("click", () => _openAboutModal());

  const feedbackBtn = el("button", {
    cls: "dash-header-link",
    text: "Leave feedback",
    attrs: { type: "button", "aria-label": "Leave feedback" },
  });
  feedbackBtn.addEventListener("click", () => _openFeedbackModal());

  const accountLabel = el("span", { cls: "dash-header-link", text: getCurrentUser()?.email || "Account" });
  const signOutBtn = el("button", { cls: "dash-header-link", text: "Sign out", attrs: { type: "button" } });
  signOutBtn.addEventListener("click", async () => {
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      _showToast(`Could not sign out: ${error.message}`);
    }
  });
  append(headerRight, accountLabel, aboutBtn, feedbackBtn, signOutBtn);
  append(header, headerLeft, headerRight);

  // ── Main area ─────────────────────────────────────────────────────────────
  const main  = el("main",    { cls: "dash-main", attrs: { id: "main-content", "aria-label": "Document list" } });
  const panel = el("section", { cls: "dash-panel" });

  // Title row
  const titleRow = el("div", { cls: "dash-title-row" });
  const titleGroup = el("div", { cls: "dash-title-group" });
  const heading = el("h1", { cls: "dash-heading", text: "All documents" });
  const subheading = el("p", {
    cls: "dash-subheading",
    text: "Select a course to study with Teacher Chat or Study Partner, or upload a new file.",
  });
  append(titleGroup, heading, subheading);

  const newDocBtn = el("button", {
    cls: "dash-new-btn",
    attrs: { type: "button", "aria-label": "New document" },
  });
  append(newDocBtn, _svgPlus(), el("span", { text: "New document" }));
  newDocBtn.addEventListener("click", () => _openNewDocModal());

  append(titleRow, titleGroup, newDocBtn);

  // Search bar
  const searchWrap = el("div", { cls: "dash-search-wrap" });
  const searchInput = el("input", {
    cls: "dash-search",
    attrs: {
      type: "search",
      placeholder: "Search your documents...",
      "aria-label": "Search documents",
      autocomplete: "off",
    },
  });
  searchInput.addEventListener("input", () => {
    searchQ = searchInput.value.trim().toLowerCase();
    _renderList();
  });
  append(searchWrap, _svgSearch(), searchInput);

  // Bulk toolbar
  const bulkBar = el("div", { cls: "dash-bulk-bar", attrs: { role: "toolbar", "aria-label": "Bulk actions" } });
  bulkBar.style.display = "none";
  const bulkLabel = el("span", { cls: "dash-bulk-label" });
  const deleteSelBtn = el("button", {
    cls: "dash-bulk-delete",
    attrs: { type: "button", "aria-label": "Delete selected documents" },
  });
  append(deleteSelBtn, _svgTrash(), el("span", { text: "Delete selected" }));
  deleteSelBtn.addEventListener("click", () => {
    if (!selected.size) return;
    const ids = [...selected];
    deleteUserBooks(ids).then(() => {
      const deleted = new Set(ids);
      docs = docs.filter((doc) => !deleted.has(doc.id));
      ids.forEach((id) => selected.delete(id));
      _updateBulkBar();
      _renderList();
    }).catch((error) => _showToast(`Could not delete books: ${error.message}`));
  });
  append(bulkBar, bulkLabel, deleteSelBtn);

  // Table wrapper
  const tableWrap = el("div", { cls: "dash-table-wrap" });

  append(panel, titleRow, searchWrap, bulkBar, tableWrap);
  main.appendChild(panel);

  // ── Root assembly ─────────────────────────────────────────────────────────
  const col = el("div", { cls: "dash-content-col" });
  append(col, header, main);
  append(container, bgDiv, overlay, sidebar, col);

  // ── List renderer ─────────────────────────────────────────────────────────
  function _renderList() {
    empty(tableWrap);

    const q = searchQ;
    const filtered = docs.filter(d => !q || d.name.toLowerCase().includes(q));
    filtered.sort((a, b) => sortDir * (b.modifiedAt - a.modifiedAt));

    if (filtered.length === 0 && docs.length === 0) {
      tableWrap.appendChild(_buildEmptyState());
      return;
    }

    if (filtered.length === 0) {
      const noneEl = el("div", { cls: "dash-no-results", text: "No documents match your search." });
      tableWrap.appendChild(noneEl);
      return;
    }

    const table = el("table", { cls: "dash-table", attrs: { role: "table" } });
    const colgroup = el("colgroup");
    append(
      colgroup,
      el("col", { cls: "dash-col dash-col--check" }),
      el("col", { cls: "dash-col dash-col--title" }),
      el("col", { cls: "dash-col dash-col--progress" }),
      el("col", { cls: "dash-col dash-col--date" }),
      el("col", { cls: "dash-col dash-col--actions" }),
    );
    table.appendChild(colgroup);
    const thead = el("thead");
    const thr   = el("tr", { cls: "dash-thead-row" });

    // Select-all checkbox
    const thCheck = el("th", { cls: "dash-th dash-th--check", attrs: { scope: "col" } });
    const selectAll = el("input", {
      attrs: { type: "checkbox", "aria-label": "Select all documents" },
    });
    selectAll.addEventListener("change", () => {
      if (selectAll.checked) filtered.forEach(d => selected.add(d.id));
      else filtered.forEach(d => selected.delete(d.id));
      _updateBulkBar();
      _renderList();
    });
    thCheck.appendChild(selectAll);

    const thTitle = el("th", { cls: "dash-th dash-th--title", attrs: { scope: "col" } });
    thTitle.textContent = "Title";

    const thProg = el("th", { cls: "dash-th dash-th--progress", attrs: { scope: "col" } });
    thProg.textContent = "Progress";

    const thDate = el("th", { cls: "dash-th dash-th--date", attrs: { scope: "col" } });
    const thDateBtn = el("button", {
      cls: "dash-sort-btn",
      attrs: { type: "button", "aria-label": "Sort by last modified" },
    });
    const sortArrow = el("span", { cls: "dash-sort-arrow", dirAuto: false });
    sortArrow.textContent = sortDir === -1 ? "↓" : "↑";
    append(thDateBtn, el("span", { text: "Last modified" }), sortArrow);
    thDate.appendChild(thDateBtn);
    thDateBtn.addEventListener("click", () => {
      sortDir *= -1;
      _renderList();
    });

    const thAct = el("th", { cls: "dash-th dash-th--actions", attrs: { scope: "col" } });
    thAct.appendChild(el("span", { cls: "sr-only", text: "Actions" }));

    append(thr, thCheck, thTitle, thProg, thDate, thAct);
    thead.appendChild(thr);
    table.appendChild(thead);

    const tbody = el("tbody");
    filtered.forEach(doc => tbody.appendChild(_buildRow(doc)));
    table.appendChild(tbody);
    tableWrap.appendChild(table);

    const checkedCount = filtered.filter(d => selected.has(d.id)).length;
    selectAll.checked       = checkedCount === filtered.length && filtered.length > 0;
    selectAll.indeterminate = checkedCount > 0 && checkedCount < filtered.length;
  }

  // ── Build a document row ───────────────────────────────────────────────────
  function _buildRow(doc) {
    const tr = el("tr", { cls: "dash-row" });
    if (selected.has(doc.id)) tr.classList.add("dash-row--selected");

    // Checkbox cell
    const tdCheck = el("td", { cls: "dash-td dash-td--check" });
    const cb = el("input", {
      attrs: { type: "checkbox", "aria-label": `Select ${doc.name}` },
    });
    cb.checked = selected.has(doc.id);
    cb.addEventListener("change", (e) => {
      e.stopPropagation();
      if (cb.checked) selected.add(doc.id);
      else selected.delete(doc.id);
      _updateBulkBar();
      _renderList();
    });
    tdCheck.appendChild(cb);

    // Title cell
    const tdTitle = el("td", { cls: "dash-td dash-td--title" });
    const docIcon = el("img", {
      cls: "dash-doc-icon",
      attrs: {
        src: "/assets/aistudio/p2logo3_ba527f4c.png",
        alt: "",
        referrerpolicy: "no-referrer",
      },
    });
    const docName = el("span", { cls: "dash-doc-name", text: doc.name });
    append(tdTitle, docIcon, docName);

    // Progress cell
    const tdProg = el("td", { cls: "dash-td dash-td--progress" });
    const progWrap = el("div", { cls: "dash-prog-wrap" });
    const progTrack = el("div", {
      cls: "dash-prog-track",
      attrs: {
        role: "progressbar",
        "aria-valuenow": String(doc.progress),
        "aria-valuemin": "0",
        "aria-valuemax": "100",
        "aria-label": `${doc.name} progress: ${doc.progress}%`,
      },
    });
    const progFill = el("div", { cls: "dash-prog-fill" });
    progFill.style.width = `${doc.progress}%`;
    const progPct = el("span", { cls: "dash-prog-pct", text: `${doc.progress}%` });
    progTrack.appendChild(progFill);
    append(progWrap, progTrack, progPct);
    tdProg.appendChild(progWrap);

    // Date cell
    const tdDate = el("td", { cls: "dash-td dash-td--date" });
    const dateEl = el("time", {
      text: _formatDate(doc.modifiedAt),
      attrs: { datetime: new Date(doc.modifiedAt).toISOString() },
    });
    tdDate.appendChild(dateEl);

    // Actions cell
    const tdAct = el("td", { cls: "dash-td dash-td--actions" });
    const actWrap = el("div", { cls: "dash-row-actions" });

    const renameBtn = el("button", {
      cls: "dash-row-action-btn",
      attrs: { type: "button", "aria-label": `Rename ${doc.name}` },
    });
    renameBtn.appendChild(_svgPencil());
    renameBtn.appendChild(el("span", { cls: "dash-tooltip", text: "Rename", dirAuto: false }));
    renameBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      _openRenameModal(doc);
    });

    const deleteBtn = el("button", {
      cls: "dash-row-action-btn dash-row-action-btn--danger",
      attrs: { type: "button", "aria-label": `Delete ${doc.name}` },
    });
    deleteBtn.appendChild(_svgTrash());
    deleteBtn.appendChild(el("span", { cls: "dash-tooltip", text: "Delete", dirAuto: false }));
    deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      deleteUserBooks([doc.id]).then(() => {
        docs = docs.filter(d => d.id !== doc.id);
        selected.delete(doc.id);
        _updateBulkBar();
        _renderList();
      }).catch((error) => _showToast(`Could not delete book: ${error.message}`));
    });

    append(actWrap, renameBtn, deleteBtn);
    tdAct.appendChild(actWrap);

    // Row click -> open document mode popup
    tr.addEventListener("click", (e) => {
      if (e.target === cb || e.target === renameBtn || e.target === deleteBtn ||
          renameBtn.contains(e.target) || deleteBtn.contains(e.target)) return;
      _openDocument(doc);
    });

    tr.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        _openDocument(doc);
      }
    });
    tr.setAttribute("tabindex", "0");
    tr.setAttribute("role", "row");
    tr.setAttribute("aria-label", `Open ${doc.name}`);

    append(tr, tdCheck, tdTitle, tdProg, tdDate, tdAct);
    return tr;
  }

  // ── Bulk toolbar ───────────────────────────────────────────────────────────
  function _updateBulkBar() {
    if (selected.size > 0) {
      bulkBar.style.display = "flex";
      bulkLabel.textContent = `${selected.size} selected`;
    } else {
      bulkBar.style.display = "none";
    }
  }

  // ── Open document (mode popup) ─────────────────────────────────────────────
  function _openDocument(doc) {
    const course = doc.course;
    if (!course || (!course.sections?.length && !course.parts?.length)) {
      _showToast("This book has no course content and cannot be opened.");
      return;
    }
    setCourse(course);
    saveCourse(course);
    renderModePopup(document.body, {
      onTeacher: () => navigate("/teacher"),
      onPath:    () => navigate("/path"),
    });
  }

  // ── Rename modal ───────────────────────────────────────────────────────────
  function _openRenameModal(doc) {
    renameId = doc.id;

    const nameInput = el("input", {
      cls: "dash-rename-input",
      attrs: {
        type: "text",
        value: doc.name,
        maxlength: "120",
        "aria-label": "New document name",
        autocomplete: "off",
      },
    });
    setTimeout(() => { nameInput.value = doc.name; nameInput.select(); }, 50);

    const saveBtn = el("button", {
      cls: "btn btn-primary btn-sm",
      text: "Save",
      attrs: { type: "button" },
    });
    const cancelBtn = el("button", {
      cls: "btn btn-outline btn-sm",
      text: "Cancel",
      attrs: { type: "button" },
    });

    const { close } = createModal(document.body, {
      title: "Rename document",
      body: nameInput,
      footerButtons: [cancelBtn, saveBtn],
    });

    cancelBtn.addEventListener("click", () => close());
    saveBtn.addEventListener("click", async () => {
      const newName = nameInput.value.trim();
      if (!newName) return;
      const d = docs.find(d => d.id === renameId);
      if (d) {
        const updated = {
          ...d,
          name: newName,
          modifiedAt: Date.now(),
          course: { ...d.course, name: newName },
        };
        saveBtn.disabled = true;
        try {
          const saved = await saveUserBook(updated);
          docs = docs.map((item) => item.id === saved.id ? saved : item);
          _renderList();
          close();
        } catch (error) {
          _showToast(`Could not rename book: ${error.message}`);
          saveBtn.disabled = false;
        }
      }
    });
    nameInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") saveBtn.click();
      if (e.key === "Escape") close();
    });
  }

  // ── New document modal ─────────────────────────────────────────────────────
  function _openNewDocModal() {
    let uploadedCourse = null;
    let uploadedFile   = null;

    const fileInputId = "dash-file-upload-" + Date.now();
    const fileInput = el("input", {
      cls: "sr-only",
      attrs: {
        type: "file",
        accept: ".pdf,.docx,.txt",
        "aria-label": "Upload course file",
        id: fileInputId,
      },
    });

    const zone = el("label", {
      cls: "dash-drop-zone",
      attrs: { for: fileInputId, tabindex: "0", "aria-label": "Upload a file — PDF, DOCX, or TXT" },
    });
    const zoneIcon = el("span", { cls: "dash-drop-icon", attrs: { "aria-hidden": "true" } });
    zoneIcon.appendChild(_svgUpload());
    const zoneText = el("p", { cls: "dash-drop-text", text: "Click to browse or drag & drop" });
    const zoneHint = el("p", { cls: "dash-drop-hint", text: "Supported: PDF, DOCX, TXT" });
    append(zone, zoneIcon, zoneText, zoneHint);

    zone.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); zone.click(); } });
    zone.addEventListener("dragover", (e) => { e.preventDefault(); zone.classList.add("dash-drop-zone--over"); });
    zone.addEventListener("dragleave", () => zone.classList.remove("dash-drop-zone--over"));
    zone.addEventListener("drop", (e) => {
      e.preventDefault();
      zone.classList.remove("dash-drop-zone--over");
      const file = e.dataTransfer?.files?.[0];
      if (file) _handleUpload(file);
    });
    fileInput.addEventListener("change", (e) => {
      const file = e.target.files?.[0];
      if (file) _handleUpload(file);
      fileInput.value = "";
    });

    const chipArea = el("div", { cls: "dash-chip-area" });
    const statusEl = el("div", { cls: "dash-upload-status" });
    statusEl.style.display = "none";

    const createBtn = el("button", {
      cls: "btn btn-primary btn-sm",
      text: "Create",
      attrs: { type: "button", disabled: "true" },
    });
    const cancelBtn = el("button", {
      cls: "btn btn-outline btn-sm",
      text: "Cancel",
      attrs: { type: "button" },
    });

    async function _handleUpload(file) {
      const ext = (file.name.split(".").pop() || "").toLowerCase();
      if (!["pdf", "docx", "txt"].includes(ext)) {
        statusEl.style.display = "block";
        statusEl.textContent   = `Unsupported format ".${ext}". Use PDF, DOCX, or TXT.`;
        statusEl.className     = "dash-upload-status dash-upload-status--error";
        return;
      }

      uploadedFile = file;

      empty(chipArea);
      const chip     = el("div", { cls: "dash-file-chip" });
      const chipName = el("span", { cls: "dash-chip-name", text: file.name });
      const chipProg = el("div", { cls: "dash-chip-prog-track" });
      const chipFill = el("div", { cls: "dash-chip-prog-fill" });
      chipProg.appendChild(chipFill);
      append(chip, chipName, chipProg);
      chipArea.appendChild(chip);

      statusEl.style.display = "block";
      statusEl.textContent   = "Processing…";
      statusEl.className     = "dash-upload-status";

      createBtn.setAttribute("disabled", "true");

      let pct = 0;
      const fakeProgress = setInterval(() => {
        pct = Math.min(pct + 8, 85);
        chipFill.style.width = `${pct}%`;
      }, 200);

      try {
        const course = await processDocument(file, (msg) => {
          statusEl.textContent = msg;
        });
        clearInterval(fakeProgress);
        chipFill.style.width = "100%";
        statusEl.textContent = "Ready!";
        statusEl.className   = "dash-upload-status dash-upload-status--ok";
        uploadedCourse = course;
        createBtn.removeAttribute("disabled");
      } catch (err) {
        clearInterval(fakeProgress);
        statusEl.textContent = `Error: ${err.message}`;
        statusEl.className   = "dash-upload-status dash-upload-status--error";
      }
    }

    const { close } = createModal(document.body, {
      title: "New document",
      subtitle: "Upload a file to study",
      body: [zone, fileInput, chipArea, statusEl],
      footerButtons: [cancelBtn, createBtn],
    });

    cancelBtn.addEventListener("click", () => close());
    createBtn.addEventListener("click", () => {
      if (!uploadedCourse) return;
      close();

      renderOutlineModal(document.body, uploadedCourse, {
        onProceed: (finalCourse) => {
          const newDoc = {
            id: crypto.randomUUID(),
            name: uploadedFile?.name || finalCourse.name || "Untitled",
            progress: 0,
            modifiedAt: Date.now(),
            course: finalCourse,
          };

          saveUserBook(newDoc).then((saved) => {
            docs.unshift(saved);
            _renderList();
            setCourse(finalCourse);
            saveCourse(finalCourse);
            renderModePopup(document.body, {
              onTeacher: () => navigate("/teacher"),
              onPath:    () => navigate("/path"),
            });
          }).catch((error) => _showToast(`Could not save book: ${error.message}`));
        },
      });
    });
  }

  // ── About modal ────────────────────────────────────────────────────────────
  function _openAboutModal() {
    const wrap = el("div", { cls: "dash-about-body" });

    const mascotEl = el("img", {
      cls: "dash-about-mascot-img",
      attrs: { src: "/assets/Screenshot_2026-11-18_at_1.12.35_AM_4f655e17.png", alt: "Lilet_r3ad mascot" },
    });

    const title = el("h2", { cls: "dash-about-title", text: "Lilet Raad" });
    const desc  = el("p",  {
      text: "Lilet Raad is a calm, privacy first AI study helper that runs right in your browser   no external tracking and your study files stay on your device.",
    });
    const desc2 = el("p",  {
      text: "Upload a course PDF, DOCX, or TXT and your personal study partner will help explain key ideas, generate flashcards, and quiz you step by step.",
    });
    const mascotDesc = el("p", { cls: "dash-about-mascot-desc" });
    mascotDesc.appendChild(el("strong", { text: "Meet Lilet " }));
    mascotDesc.appendChild(document.createTextNode(
      "— your smiling star study companion, here to keep every study session clear, organized, and stress-free."
    ));

    append(wrap, mascotEl, title, desc, desc2, mascotDesc);

    const closeBtn = el("button", {
      cls: "btn btn-primary btn-sm",
      text: "Got it!",
      attrs: { type: "button" },
    });
    const { close } = createModal(document.body, {
      title: "About Lilet Raad",
      body: wrap,
      footerButtons: [closeBtn],
    });
    closeBtn.addEventListener("click", () => close());
  }

  // ── Feedback modal ─────────────────────────────────────────────────────────
  function _openFeedbackModal() {
    let rating = 0;

    const ratingWrap = el("div", { cls: "dash-rating-wrap", attrs: { role: "group", "aria-label": "Rating" } });
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      const star = el("button", {
        cls: "dash-star-btn",
        attrs: { type: "button", "aria-label": `Rate ${i} out of 5`, "data-value": String(i) },
      });
      star.textContent = "★";
      star.addEventListener("mouseover", () => _highlightStars(i));
      star.addEventListener("mouseout",  () => _highlightStars(rating));
      star.addEventListener("click",     () => { rating = i; _highlightStars(i); });
      stars.push(star);
      ratingWrap.appendChild(star);
    }

    function _highlightStars(n) {
      stars.forEach((s, idx) => {
        s.classList.toggle("dash-star-btn--active", idx < n);
      });
    }

    const textarea = el("textarea", {
      cls: "dash-feedback-textarea",
      attrs: {
        placeholder: "Tell us what you think — anything is helpful!",
        rows: "4",
        maxlength: "1000",
        "aria-label": "Feedback message",
      },
    });

    const ratingLabel = el("label", { cls: "dash-feedback-label", text: "How would you rate Lilet_r3ad?" });
    const msgLabel    = el("label", { cls: "dash-feedback-label", text: "Your message (optional)" });

    const sendBtn = el("button", {
      cls: "btn btn-primary btn-sm",
      text: "Send",
      attrs: { type: "button" },
    });
    const cancelBtn = el("button", {
      cls: "btn btn-outline btn-sm",
      text: "Cancel",
      attrs: { type: "button" },
    });

    const { close } = createModal(document.body, {
      title: "Leave feedback",
      subtitle: "Help us make Lilet Raad better",
      body: [ratingLabel, ratingWrap, msgLabel, textarea],
      footerButtons: [cancelBtn, sendBtn],
    });

    cancelBtn.addEventListener("click", () => close());
    sendBtn.addEventListener("click", () => {
      close();
      _showToast("Thanks for your feedback!");
    });
  }

  // ── Toast notification ─────────────────────────────────────────────────────
  function _showToast(text) {
    const toast = el("div", { cls: "dash-toast", text, attrs: { role: "status", "aria-live": "polite" } });
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add("dash-toast--visible"));
    setTimeout(() => {
      toast.classList.remove("dash-toast--visible");
      toast.addEventListener("transitionend", () => toast.remove(), { once: true });
    }, 3000);
  }

  // ── Empty state ────────────────────────────────────────────────────────────
  function _buildEmptyState() {
    const wrap = el("div", { cls: "dash-empty" });
    const bot  = el("img", {
      cls: "dash-empty-mascot",
      attrs: { src: "/assets/Screenshot_2026-11-18_at_1.12.35_AM_4f655e17.png", alt: "Lilet_r3ad mascot" },
    });
    const h2   = el("h2",  { cls: "dash-empty-heading", text: "Upload your first course" });
    const p    = el("p",   { cls: "dash-empty-desc",    text: "Drop a PDF, DOCX, or TXT file and your AI study partner will take it from there." });

    const btn = el("button", {
      cls: "dash-new-btn dash-empty-btn",
      attrs: { type: "button", "aria-label": "New document" },
    });
    append(btn, _svgPlus(), el("span", { text: "New document" }));
    btn.addEventListener("click", () => _openNewDocModal());

    append(wrap, bot, h2, p, btn);
    return wrap;
  }

  tableWrap.appendChild(el("p", { cls: "dash-subheading", text: "Loading your books…" }));
  listUserBooks().then((userBooks) => {
    docs = userBooks;
    _renderList();
  }).catch((error) => {
    empty(tableWrap);
    tableWrap.appendChild(el("p", {
      cls: "dash-subheading",
      text: `Could not load your books: ${error.message}`,
      attrs: { role: "alert" },
    }));
  });
}

// ── Theme toggle component ─────────────────────────────────────────────────────

function _buildThemeToggle() {
  const wrap  = el("div", { cls: "dash-theme-toggle", attrs: { role: "group", "aria-label": "Color theme" } });
  const track = el("div", { cls: "dash-theme-track" });

  const isDark = () => document.documentElement.getAttribute("data-theme") === "dark";

  const thumb = el("div", { cls: "dash-theme-thumb" });
  const moonLabel = el("span", { cls: "dash-theme-icon", attrs: { "aria-hidden": "true" } });
  moonLabel.appendChild(_svgMoon());
  const sunLabel  = el("span", { cls: "dash-theme-icon", attrs: { "aria-hidden": "true" } });
  sunLabel.appendChild(_svgSun());

  function _sync() {
    track.classList.toggle("dash-theme-track--light", !isDark());
    thumb.style.transform = isDark() ? "translateX(0)" : "translateX(20px)";
  }
  _sync();
  append(track, moonLabel, thumb, sunLabel);

  const btn = el("button", {
    cls: "dash-theme-btn",
    attrs: { type: "button", "aria-label": "Toggle light or dark theme" },
  });
  btn.appendChild(track);
  btn.addEventListener("click", () => {
    const next = isDark() ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("lilet_r3ad_theme", next);
    _sync();
  });

  wrap.appendChild(btn);
  return wrap;
}

// ── SVG icons (inline, aria-hidden) ───────────────────────────────────────────

function _svgBook() {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "18"); svg.setAttribute("height", "18");
  svg.setAttribute("viewBox", "0 0 24 24"); svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor"); svg.setAttribute("stroke-width", "2.2");
  svg.setAttribute("stroke-linecap", "round"); svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("aria-hidden", "true"); svg.setAttribute("focusable", "false");
  svg.innerHTML = '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>';
  return svg;
}

function _svgHome() {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "18"); svg.setAttribute("height", "18");
  svg.setAttribute("viewBox", "0 0 24 24"); svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor"); svg.setAttribute("stroke-width", "2.2");
  svg.setAttribute("stroke-linecap", "round"); svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("aria-hidden", "true"); svg.setAttribute("focusable", "false");
  svg.innerHTML = '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>';
  return svg;
}

function _svgSearch() {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "18"); svg.setAttribute("height", "18");
  svg.setAttribute("viewBox", "0 0 24 24"); svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor"); svg.setAttribute("stroke-width", "2.2");
  svg.setAttribute("stroke-linecap", "round"); svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("aria-hidden", "true"); svg.setAttribute("focusable", "false");
  svg.innerHTML = '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>';
  return svg;
}

function _svgPlus() {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "18"); svg.setAttribute("height", "18");
  svg.setAttribute("viewBox", "0 0 24 24"); svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor"); svg.setAttribute("stroke-width", "2.4");
  svg.setAttribute("stroke-linecap", "round"); svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("aria-hidden", "true"); svg.setAttribute("focusable", "false");
  svg.innerHTML = '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>';
  return svg;
}

function _svgPencil() {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "15"); svg.setAttribute("height", "15");
  svg.setAttribute("viewBox", "0 0 24 24"); svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor"); svg.setAttribute("stroke-width", "2.2");
  svg.setAttribute("stroke-linecap", "round"); svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("aria-hidden", "true"); svg.setAttribute("focusable", "false");
  svg.innerHTML = '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>';
  return svg;
}

function _svgTrash() {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "15"); svg.setAttribute("height", "15");
  svg.setAttribute("viewBox", "0 0 24 24"); svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor"); svg.setAttribute("stroke-width", "2.2");
  svg.setAttribute("stroke-linecap", "round"); svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("aria-hidden", "true"); svg.setAttribute("focusable", "false");
  svg.innerHTML = '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>';
  return svg;
}

function _svgMenu() {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "22"); svg.setAttribute("height", "22");
  svg.setAttribute("viewBox", "0 0 24 24"); svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor"); svg.setAttribute("stroke-width", "2.2");
  svg.setAttribute("stroke-linecap", "round"); svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("aria-hidden", "true"); svg.setAttribute("focusable", "false");
  svg.innerHTML = '<line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>';
  return svg;
}

function _svgUpload() {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "32"); svg.setAttribute("height", "32");
  svg.setAttribute("viewBox", "0 0 24 24"); svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor"); svg.setAttribute("stroke-width", "2");
  svg.setAttribute("stroke-linecap", "round"); svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("aria-hidden", "true"); svg.setAttribute("focusable", "false");
  svg.innerHTML = '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>';
  return svg;
}

function _svgMoon() {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "12"); svg.setAttribute("height", "12");
  svg.setAttribute("viewBox", "0 0 24 24"); svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor"); svg.setAttribute("stroke-width", "2.2");
  svg.setAttribute("stroke-linecap", "round"); svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("aria-hidden", "true"); svg.setAttribute("focusable", "false");
  svg.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';
  return svg;
}

function _svgSun() {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "12"); svg.setAttribute("height", "12");
  svg.setAttribute("viewBox", "0 0 24 24"); svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor"); svg.setAttribute("stroke-width", "2.2");
  svg.setAttribute("stroke-linecap", "round"); svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("aria-hidden", "true"); svg.setAttribute("focusable", "false");
  svg.innerHTML = '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>';
  return svg;
}
