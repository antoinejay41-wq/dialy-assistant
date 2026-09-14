import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Menu, Plus, Check, Bell, Repeat, Moon, Trash2, X, ChevronLeft,
  MessageCircle, ListChecks, Settings as SettingsIcon, CalendarDays,
  Send, Clock, Globe, Sun, ChevronRight, Undo2, User, Mail, Lock,
  Eye, EyeOff, CheckSquare, Square, LogOut, CheckCircle2
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Brand palette (login flow)                                         */
/* ------------------------------------------------------------------ */

const BRAND = {
  gradientLight: "linear-gradient(135deg, #8b5cf6 0%, #4c1d95 100%)",
  violet: "#8b5cf6",
  indigo: "#4c1d95",
};

/* ------------------------------------------------------------------ */
/*  Mock data                                                          */
/* ------------------------------------------------------------------ */

const now = new Date();
const addH = (h) => new Date(now.getTime() + h * 3600 * 1000);
const addD = (d, h = 9) => {
  const dt = new Date(now);
  dt.setDate(dt.getDate() + d);
  dt.setHours(h, 0, 0, 0);
  return dt;
};

const COLORS = {
  orange: "#e8933a",
  blue: "#4a90d9",
  purple: "#9b6bd4",
  green: "#5fbf6f",
  red: "#e05a5a",
};

const PROFILE_IMAGE_KEY = "daily-task-reminder.profile-image";

const initialTasks = [
  {
    id: "1",
    title: "Buy travel insurance",
    notes: "",
    due: addD(-3, 12),
    repeat: "none",
    color: COLORS.red,
    reminderOffset: "at time",
    status: "open",
    history: [{ action: "created", source: "user", ts: addD(-5) }],
  },
  {
    id: "2",
    title: "Make appointment with dentist",
    notes: "Dr Philip, +65 6533 7311, 24 Fifth St",
    due: addH(-1),
    repeat: "Every 6 months after completion",
    color: COLORS.red,
    reminderOffset: "at time",
    status: "open",
    history: [{ action: "created", source: "user", ts: addD(-10) }],
  },
  {
    id: "3",
    title: "Pay credit card bills",
    notes: "",
    due: addH(2),
    repeat: "13th each month",
    color: COLORS.orange,
    reminderOffset: "1 hour before",
    status: "open",
    history: [{ action: "created", source: "ai", ts: addD(-30) }],
  },
  {
    id: "4",
    title: "Print itinerary",
    notes: "",
    due: addH(6),
    repeat: "none",
    color: COLORS.orange,
    reminderOffset: "at time",
    status: "open",
    history: [{ action: "created", source: "user", ts: addD(-1) }],
  },
  {
    id: "5",
    title: "Book taxi",
    notes: "",
    due: addD(1, 6),
    repeat: "none",
    color: COLORS.blue,
    reminderOffset: "at time",
    status: "open",
    history: [{ action: "created", source: "ai", ts: now }],
  },
  {
    id: "6",
    title: "Feed Pepper",
    notes: "",
    due: addD(1, 8),
    repeat: "Daily",
    color: COLORS.blue,
    reminderOffset: "at time",
    status: "open",
    history: [{ action: "created", source: "user", ts: addD(-60) }],
  },
  {
    id: "7",
    title: "Recycle cans and bottles",
    notes: "",
    due: addD(4, 7),
    repeat: "Thursdays",
    color: COLORS.purple,
    reminderOffset: "at time",
    status: "open",
    history: [{ action: "created", source: "user", ts: addD(-90) }],
  },
  {
    id: "8",
    title: "Pay rent",
    notes: "",
    due: addD(6, 20),
    repeat: "3rd Friday each month",
    color: COLORS.purple,
    reminderOffset: "1 day before",
    status: "open",
    history: [{ action: "created", source: "user", ts: addD(-120) }],
  },
  {
    id: "9",
    title: "Renew passport",
    notes: "",
    due: addD(20, 10),
    repeat: "none",
    color: COLORS.green,
    reminderOffset: "1 day before",
    status: "open",
    history: [{ action: "created", source: "user", ts: addD(-5) }],
  },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

function relTime(due, statusOpen) {
  const diffMs = due - new Date();
  const abs = Math.abs(diffMs);
  const mins = Math.round(abs / 60000);
  const hrs = Math.round(abs / 3600000);
  const days = Math.round(abs / 86400000);
  if (diffMs < 0) {
    if (mins < 60) return `${mins}m ago`;
    if (hrs < 24) return `${hrs}h ago`;
    return `${days}d ago`;
  }
  if (mins < 60) return `in ${mins}m`;
  if (hrs < 24) return `in ${hrs}h`;
  return due.toLocaleDateString(undefined, { weekday: "short" });
}

function fmtDate(d) {
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
function fmtTime(d) {
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function bucketOf(due, status) {
  if (status === "completed") return "completed";
  const diffDays = (due - new Date()) / 86400000;
  if (diffDays < 0) return "OVERDUE";
  const d = new Date(); d.setHours(23, 59, 59, 999);
  if (due <= d) return "TODAY";
  const t = new Date(); t.setDate(t.getDate() + 1); t.setHours(23, 59, 59, 999);
  if (due <= t) return "TOMORROW";
  const w = new Date(); w.setDate(w.getDate() + 7);
  if (due <= w) return "NEXT 7 DAYS";
  return "FUTURE";
}

const BUCKET_ORDER = ["OVERDUE", "TODAY", "TOMORROW", "NEXT 7 DAYS", "FUTURE"];

/* ------------------------------------------------------------------ */
/*  Root app                                                           */
/* ------------------------------------------------------------------ */

function MainApp({ startTheme = "dark", userEmail = "you@example.com", onLogout }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [tab, setTab] = useState("today");
  const [openTask, setOpenTask] = useState(null); // task object or null
  const [theme, setTheme] = useState(startTheme);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileImage, setProfileImage] = useState(() => {
    if (typeof window === "undefined") return "";
    return window.localStorage.getItem(PROFILE_IMAGE_KEY) || "";
  });

  const isDark = theme === "dark";

  function updateProfileImage(file) {
    if (!file || !file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = () => {
      const image = String(reader.result || "");
      setProfileImage(image);
      window.localStorage.setItem(PROFILE_IMAGE_KEY, image);
    };
    reader.readAsDataURL(file);
  }

  const bg = isDark ? "#161616" : "#f4f3ef";
  const surface = isDark ? "#1e1e1e" : "#ffffff";
  const textPrimary = isDark ? "#f2f2f0" : "#1a1a1a";
  const textSecondary = isDark ? "#8f8f8c" : "#6b6b68";
  const divider = isDark ? "#2b2b2b" : "#e6e5e0";

  function updateTask(id, patch, historyEntry) {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              ...patch,
              history: historyEntry ? [historyEntry, ...t.history] : t.history,
            }
          : t
      )
    );
  }

  function completeTask(id) {
    updateTask(id, { status: "completed" }, {
      action: "completed",
      source: "user",
      ts: new Date(),
    });
  }

  function deleteTask(id) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setOpenTask(null);
  }

  function createTask(title, due, source = "user") {
    const task = {
      id: String(Date.now()),
      title,
      notes: "",
      due,
      repeat: "none",
      color: COLORS.blue,
      reminderOffset: "at time",
      status: "open",
      history: [{ action: "created", source, ts: new Date() }],
    };
    setTasks((prev) => [...prev, task]);
    return task;
  }

  const shellStyle = {
    background: bg,
    color: textPrimary,
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif",
    height: "100vh",
    minHeight: "100vh",
    width: "100%",
    maxWidth: 480,
    margin: "0 auto",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    position: "relative",
  };

  const ctx = { tasks, setTasks, updateTask, completeTask, deleteTask, createTask, setOpenTask, isDark, bg, surface, textPrimary, textSecondary, divider, theme, setTheme, setTab, userEmail, onLogout, profileImage, updateProfileImage, openDrawer: () => setDrawerOpen(true), closeDrawer: () => setDrawerOpen(false) };

  return (
    <div style={{ display: "flex", justifyContent: "center", width: "100%", minHeight: "100vh", background: bg }}>
      <div style={shellStyle}>
        <div style={{ flex: 1, overflowY: "auto", paddingBottom: 70 }}>
          {tab === "today" && <TodayScreen ctx={ctx} onQuickAdd={() => setQuickAddOpen(true)} />}
          {tab === "chat" && <ChatScreen ctx={ctx} />}
          {tab === "tasks" && <TasksScreen ctx={ctx} />}
          {tab === "settings" && <SettingsScreen ctx={ctx} />}
        </div>

        <BottomNav tab={tab} setTab={setTab} ctx={ctx} />

        {openTask && (
          <TaskDetailModal task={openTask} ctx={ctx} onClose={() => setOpenTask(null)} />
        )}
        {quickAddOpen && (
          <QuickAddModal
            ctx={ctx}
            onClose={() => setQuickAddOpen(false)}
          />
        )}
        {drawerOpen && <SideDrawer ctx={ctx} onClose={() => setDrawerOpen(false)} />}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Bottom nav                                                         */
/* ------------------------------------------------------------------ */

function BottomNav({ tab, setTab, ctx }) {
  const items = [
    { id: "today", label: "Today", icon: ListChecks },
    { id: "chat", label: "Assistant", icon: MessageCircle },
    { id: "tasks", label: "Tasks", icon: CalendarDays },
    { id: "settings", label: "Settings", icon: SettingsIcon },
  ];
  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 64,
        display: "flex",
        borderTop: `1px solid ${ctx.divider}`,
        background: ctx.surface,
      }}
    >
      {items.map((it) => {
        const Icon = it.icon;
        const active = tab === it.id;
        return (
          <button
            key={it.id}
            onClick={() => setTab(it.id)}
            style={{
              flex: 1,
              background: "none",
              border: "none",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 3,
              cursor: "pointer",
              color: active ? "#4a90d9" : ctx.textSecondary,
            }}
          >
            <Icon size={20} strokeWidth={active ? 2.4 : 1.8} />
            <span style={{ fontSize: 10, letterSpacing: 0.3 }}>{it.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Side drawer — profile, tasks done, settings, log out                */
/* ------------------------------------------------------------------ */

function SideDrawer({ ctx, onClose }) {
  const { isDark, textPrimary, textSecondary, divider, surface, tasks, setTab, userEmail, onLogout, profileImage } = ctx;
  const doneCount = tasks.filter((t) => t.status === "completed").length;
  const openCount = tasks.filter((t) => t.status === "open").length;

  function go(target) {
    setTab(target);
    onClose();
  }

  const Row = ({ icon: Icon, label, sub, onClick, danger }) => (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "13px 4px",
        background: "none",
        border: "none",
        textAlign: "left",
        cursor: "pointer",
        color: danger ? "#e05a5a" : textPrimary,
      }}
    >
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          background: isDark ? "#242424" : "#f0efe9",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={16} color={danger ? "#e05a5a" : textSecondary} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{label}</div>
        {sub && <div style={{ fontSize: 11.5, color: textSecondary }}>{sub}</div>}
      </div>
    </button>
  );

  return (
    <div
      onClick={onClose}
      style={{
        position: "absolute",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        zIndex: 30,
        display: "flex",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "78%",
          maxWidth: 300,
          height: "100%",
          background: surface,
          padding: "22px 16px",
          display: "flex",
          flexDirection: "column",
          animation: "slideIn .18s ease-out",
        }}
      >
        {/* profile */}
        <button
          onClick={() => go("settings")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            width: "100%",
            marginBottom: 18,
            padding: 0,
            border: "none",
            background: "none",
            textAlign: "left",
            cursor: "pointer",
          }}
        >
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 23,
              background: "linear-gradient(135deg, #8b5cf6, #4c1d95)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              overflow: "hidden",
            }}
          >
            {profileImage ? <img src={profileImage} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <User size={20} color="#fff" />}
          </div>
          <div style={{ overflow: "hidden" }}>
            <div style={{ fontSize: 14.5, fontWeight: 700, color: textPrimary }}>My Profile</div>
            <div style={{ fontSize: 12, color: textSecondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {userEmail}
            </div>
          </div>
        </button>

        {/* tasks done stat */}
        <button
          onClick={() => go("tasks")}
          style={{
            display: "flex",
            gap: 10,
            marginBottom: 18,
            padding: "12px 14px",
            borderRadius: 14,
            background: isDark ? "#242424" : "#f0efe9",
            width: "100%",
            border: "none",
            textAlign: "left",
            color: textPrimary,
            cursor: "pointer",
          }}
        >
          <CheckCircle2 size={18} color="#5fbf6f" style={{ marginTop: 1 }} />
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: textPrimary }}>
              {doneCount} task{doneCount === 1 ? "" : "s"} done
            </div>
            <div style={{ fontSize: 11.5, color: textSecondary }}>
              {openCount} still open
            </div>
          </div>
        </button>

        <div style={{ borderTop: `1px solid ${divider}`, margin: "4px 0 6px" }} />

        <Row icon={User} label="Profile" sub="View and edit your info" onClick={() => go("settings")} />
        <Row icon={CheckCircle2} label="Tasks done" sub={`${doneCount} completed so far`} onClick={() => go("tasks")} />
        <Row icon={SettingsIcon} label="Settings" sub="Notifications, theme, language" onClick={() => go("settings")} />

        <div style={{ flex: 1 }} />

        <div style={{ borderTop: `1px solid ${divider}`, margin: "6px 0" }} />
        <Row
          icon={LogOut}
          label="Log out"
          danger
          onClick={() => {
            onClose();
            if (onLogout) onLogout();
          }}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Today screen                                                       */
/* ------------------------------------------------------------------ */

function TodayScreen({ ctx, onQuickAdd }) {
  const { tasks, textPrimary, textSecondary, divider, surface, isDark } = ctx;

  const open = tasks.filter((t) => t.status === "open");
  const grouped = useMemo(() => {
    const g = {};
    BUCKET_ORDER.forEach((b) => (g[b] = []));
    open.forEach((t) => {
      const b = bucketOf(t.due, t.status);
      if (g[b]) g[b].push(t);
    });
    Object.values(g).forEach((arr) => arr.sort((a, b) => a.due - b.due));
    return g;
  }, [tasks]);

  const nextUp = [...open].sort((a, b) => a.due - b.due)[0];

  return (
    <div>
      {/* header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "18px 16px 10px",
        }}
      >
        <button
          type="button"
          aria-label="Open profile menu"
          onClick={(event) => {
            event.stopPropagation();
            ctx.openDrawer();
          }}
          style={{ background: "none", border: "none", padding: 8, display: "flex", cursor: "pointer" }}
        >
          <Menu size={22} color={textPrimary} />
        </button>
        <span style={{ fontWeight: 600, fontSize: 15, letterSpacing: 0.5 }}>
          TODAY
        </span>
        <button onClick={onQuickAdd} style={{ background: "none", border: "none" }}>
          <Plus size={22} color={textPrimary} />
        </button>
      </div>

      {nextUp && (
        <div
          style={{
            margin: "4px 16px 14px",
            padding: "12px 14px",
            borderRadius: 14,
            background: isDark ? "#232323" : "#eceae2",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div style={{ width: 4, height: 32, borderRadius: 2, background: nextUp.color }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: textSecondary, letterSpacing: 0.5 }}>
              NEXT UP
            </div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{nextUp.title}</div>
          </div>
          <div style={{ fontSize: 12, color: textSecondary }}>
            {relTime(nextUp.due)}
          </div>
        </div>
      )}

      {BUCKET_ORDER.map((bucket) =>
        grouped[bucket].length ? (
          <Section
            key={bucket}
            title={bucket}
            tasks={grouped[bucket]}
            ctx={ctx}
          />
        ) : null
      )}

      {open.length === 0 && (
        <div style={{ textAlign: "center", marginTop: 60, color: textSecondary, fontSize: 13 }}>
          Nothing on your list. Tap + to add a task.
        </div>
      )}
    </div>
  );
}

function Section({ title, tasks, ctx }) {
  const overdue = title === "OVERDUE";
  const headerColor = overdue ? "#e05a5a" : ctx.textSecondary;
  return (
    <div>
      <div
        style={{
          position: "sticky",
          top: 0,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "8px 16px",
          background: ctx.isDark ? "#1a1a1a" : "#eeede8",
          fontSize: 11,
          letterSpacing: 0.8,
          color: headerColor,
          fontWeight: 700,
        }}
      >
        <span>{title}</span>
        <Plus size={15} color={headerColor} />
      </div>
      {tasks.map((t) => (
        <TaskRow key={t.id} task={t} ctx={ctx} overdue={overdue} />
      ))}
    </div>
  );
}

function TaskRow({ task, ctx, overdue }) {
  const { completeTask, setOpenTask, textPrimary, textSecondary, divider } = ctx;
  const [checked, setChecked] = useState(false);

  return (
    <div
      onClick={() => setOpenTask(task)}
      style={{
        display: "flex",
        alignItems: "stretch",
        borderBottom: `1px solid ${divider}`,
        cursor: "pointer",
      }}
    >
      <div style={{ width: 4, background: task.color, flexShrink: 0 }} />
      <button
        onClick={(e) => {
          e.stopPropagation();
          setChecked(true);
          setTimeout(() => completeTask(task.id), 350);
        }}
        style={{
          width: 44,
          background: "none",
          border: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 20,
            height: 20,
            borderRadius: 6,
            border: checked ? "none" : `1.5px solid ${textSecondary}`,
            background: checked ? "#5fbf6f" : "transparent",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all .2s",
          }}
        >
          {checked && <Check size={14} color="#0d1f0f" strokeWidth={3} />}
        </div>
      </button>
      <div style={{ flex: 1, padding: "10px 8px 10px 0" }}>
        <div style={{ fontSize: 14.5, fontWeight: 600, color: textPrimary }}>
          {task.title}
        </div>
        <div style={{ fontSize: 12, color: overdue ? "#e05a5a" : textSecondary, marginTop: 2 }}>
          {task.repeat !== "none" ? task.repeat : `${fmtDate(task.due)}, ${fmtTime(task.due)}`}
        </div>
      </div>
      <div style={{ padding: "10px 14px", fontSize: 12, color: textSecondary, whiteSpace: "nowrap" }}>
        {relTime(task.due)}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Task detail / reschedule modal                                     */
/* ------------------------------------------------------------------ */

function TaskDetailModal({ task, ctx, onClose }) {
  const { updateTask, deleteTask, completeTask, isDark, textPrimary, textSecondary, surface, divider } = ctx;
  const [title, setTitle] = useState(task.title);
  const [confirmDelete, setConfirmDelete] = useState(false);

  function setDue(newDate, label) {
    updateTask(task.id, { due: newDate }, {
      action: "updated",
      source: "user",
      ts: new Date(),
      note: `Rescheduled to ${label}`,
    });
  }

  const quickPicks = [
    { label: "9:30 AM", fn: () => { const d = new Date(task.due); d.setHours(9,30,0,0); setDue(d, "9:30 AM"); } },
    { label: "12:00 PM", fn: () => { const d = new Date(task.due); d.setHours(12,0,0,0); setDue(d, "12:00 PM"); } },
    { label: "6:30 PM", fn: () => { const d = new Date(task.due); d.setHours(18,30,0,0); setDue(d, "6:30 PM"); } },
    { label: "10:00 PM", fn: () => { const d = new Date(task.due); d.setHours(22,0,0,0); setDue(d, "10:00 PM"); } },
    { label: "+10 min", fn: () => setDue(new Date(task.due.getTime() + 10*60000), "+10 min") },
    { label: "+1 hr", fn: () => setDue(new Date(task.due.getTime() + 3600000), "+1 hr") },
    { label: "+3 hr", fn: () => setDue(new Date(task.due.getTime() + 3*3600000), "+3 hr") },
    { label: "+1 day", fn: () => setDue(new Date(task.due.getTime() + 86400000), "+1 day") },
  ];

  return (
    <ModalOverlay onClose={onClose}>
      <div style={{ background: isDark ? "#1c1c1c" : "#fff", borderRadius: 18, padding: 18, color: textPrimary }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <button onClick={onClose} style={{ background: "none", border: "none", color: textSecondary }}>
            <ChevronLeft size={20} />
          </button>
          <span style={{ fontSize: 13, color: textSecondary }}>Task details</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: textSecondary }}>
            <X size={18} />
          </button>
        </div>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => updateTask(task.id, { title }, { action: "updated", source: "user", ts: new Date(), note: "Edited title" })}
          style={{
            width: "100%",
            background: "transparent",
            border: "none",
            outline: "none",
            fontSize: 17,
            fontWeight: 600,
            color: textPrimary,
            marginBottom: 4,
          }}
        />
        <div style={{ fontSize: 12, color: "#e8933a", marginBottom: 14 }}>
          Set to "{fmtDate(task.due)}, {fmtTime(task.due)}"
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
          {quickPicks.map((q) => (
            <button
              key={q.label}
              onClick={q.fn}
              style={{
                padding: "10px 4px",
                borderRadius: 10,
                border: `1px solid ${divider}`,
                background: isDark ? "#242424" : "#f4f3ef",
                color: textPrimary,
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              {q.label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 16, color: textSecondary }}>
          <IconPill icon={Clock} label="Snooze" />
          <IconPill icon={Repeat} label={task.repeat !== "none" ? "Repeats" : "Repeat"} active={task.repeat !== "none"} />
          <IconPill icon={Bell} label="Remind" active />
        </div>

        <div style={{ fontSize: 11, color: textSecondary, letterSpacing: 0.5, marginBottom: 6 }}>HISTORY</div>
        <div style={{ maxHeight: 110, overflowY: "auto", marginBottom: 16 }}>
          {task.history.slice(0, 5).map((h, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: textSecondary, padding: "4px 0", borderBottom: `1px solid ${divider}` }}>
              <span>
                {h.note || h.action} {h.source === "ai" ? "· via assistant" : ""}
              </span>
              {i === 0 && h.source === "ai" && (
                <button style={{ background: "none", border: "none", color: "#4a90d9", display: "flex", alignItems: "center", gap: 3 }}>
                  <Undo2 size={12} /> Undo
                </button>
              )}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => setConfirmDelete(true)}
            style={{ flex: 1, padding: "12px 0", borderRadius: 12, border: `1px solid ${divider}`, background: "transparent", color: "#e05a5a", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
          >
            <Trash2 size={16} /> Delete
          </button>
          <button
            onClick={() => { completeTask(task.id); onClose(); }}
            style={{ flex: 1, padding: "12px 0", borderRadius: 12, border: "none", background: "#5fbf6f", color: "#0d1f0f", fontWeight: 700 }}
          >
            Mark complete
          </button>
        </div>

        {confirmDelete && (
          <div style={{ marginTop: 12, padding: 12, borderRadius: 10, background: isDark ? "#241414" : "#fdecec", fontSize: 13 }}>
            Delete "{task.title}" permanently?
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button onClick={() => setConfirmDelete(false)} style={{ flex: 1, padding: 8, borderRadius: 8, border: `1px solid ${divider}`, background: "transparent", color: textPrimary }}>Cancel</button>
              <button onClick={() => deleteTask(task.id)} style={{ flex: 1, padding: 8, borderRadius: 8, border: "none", background: "#e05a5a", color: "#fff" }}>Delete</button>
            </div>
          </div>
        )}
      </div>
    </ModalOverlay>
  );
}

function IconPill({ icon: Icon, label, active }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, padding: "6px 10px", borderRadius: 20, border: `1px solid ${active ? "#4a90d9" : "#3a3a3a"}`, color: active ? "#4a90d9" : "inherit" }}>
      <Icon size={13} />
      {label}
    </div>
  );
}

function ModalOverlay({ children, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "absolute",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        display: "flex",
        alignItems: "flex-end",
        zIndex: 20,
      }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", padding: 10 }}>
        {children}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Quick add modal                                                    */
/* ------------------------------------------------------------------ */

function QuickAddModal({ ctx, onClose }) {
  const { createTask, isDark, textPrimary, textSecondary, divider } = ctx;
  const [text, setText] = useState("");

  function parsePreview(str) {
    const lower = str.toLowerCase();
    if (lower.includes("tomorrow")) return "Tomorrow, 9:00 AM";
    if (lower.includes("today")) return "Today, later";
    return null;
  }

  function submit() {
    if (!text.trim()) return;
    const due = text.toLowerCase().includes("tomorrow") ? addD(1, 9) : addH(3);
    createTask(text.trim(), due, "user");
    onClose();
  }

  const preview = parsePreview(text);

  return (
    <ModalOverlay onClose={onClose}>
      <div style={{ background: isDark ? "#1c1c1c" : "#fff", borderRadius: 18, padding: 16, color: textPrimary }}>
        <div style={{ fontSize: 13, color: textSecondary, marginBottom: 8 }}>New task</div>
        <input
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="e.g. Call the bank tomorrow 10am"
          style={{ width: "100%", background: "transparent", border: "none", outline: "none", fontSize: 16, fontWeight: 600, color: textPrimary, marginBottom: 6 }}
        />
        {preview && <div style={{ fontSize: 12, color: "#e8933a", marginBottom: 10 }}>Set to "{preview}"</div>}
        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 12, borderRadius: 12, border: `1px solid ${divider}`, background: "transparent", color: textPrimary }}>Cancel</button>
          <button onClick={submit} style={{ flex: 1, padding: 12, borderRadius: 12, border: "none", background: "#4a90d9", color: "#fff", fontWeight: 700 }}>Add task</button>
        </div>
      </div>
    </ModalOverlay>
  );
}

/* ------------------------------------------------------------------ */
/*  Chat screen (mock assistant, multilingual demo)                    */
/* ------------------------------------------------------------------ */

const LANG_SAMPLES = {
  en: { greet: "Hi! Ask me to add, move, or check on your tasks — in any language.", confirm: (t, d) => `Done — "${t}" is set for ${d}.` },
  es: { greet: "¡Hola! Pídeme que agregue, mueva o revise tus tareas, en cualquier idioma.", confirm: (t, d) => `Listo — "${t}" quedó programada para ${d}.` },
  fr: { greet: "Bonjour ! Demandez-moi d'ajouter, déplacer ou vérifier vos tâches, dans n'importe quelle langue.", confirm: (t, d) => `C'est fait — « ${t} » est prévue pour ${d}.` },
  ht: { greet: "Bonjou! Mande m ajoute, deplase, oswa tcheke tach ou yo, nan nenpòt lang.", confirm: (t, d) => `Fini — "${t}" pwograme pou ${d}.` },
};

function detectLang(str) {
  const s = str.toLowerCase();
  if (/[àâçéèêëîïôûùü]/.test(s) || /\bveuillez\b|\brendez-vous\b|\bdemain\b/.test(s)) return "fr";
  if (/\bmwen\b|\bpral\b|\bdemen\b/.test(s)) return "ht";
  if (/[ñáéíóúü]/.test(s) || /\bpor favor\b|\bmañana\b/.test(s)) return "es";
  return "en";
}

function ChatScreen({ ctx }) {
  const { createTask, isDark, textPrimary, textSecondary, divider, surface } = ctx;
  const [messages, setMessages] = useState([
    { role: "assistant", text: LANG_SAMPLES.en.greet },
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  function send() {
    if (!input.trim()) return;
    const userMsg = input.trim();
    const lang = detectLang(userMsg);
    setMessages((m) => [...m, { role: "user", text: userMsg }]);
    setInput("");

    setTimeout(() => {
      const lower = userMsg.toLowerCase();
      let reply;
      let card = null;

      if (/remind|rappel|recuerda|mande/.test(lower) || /pay|payer|pagar|peye/.test(lower)) {
        const title = userMsg.replace(/remind me to|rappelle[- ]moi de|recu[eé]rdame|mande m/gi, "").trim() || "New reminder";
        const due = addD(1, 9);
        createTask(title, due, "ai");
        reply = LANG_SAMPLES[lang].confirm(title, `${fmtDate(due)}, ${fmtTime(due)}`);
        card = { title, due };
      } else if (/what.*(weekend|today|do i need)/.test(lower)) {
        reply = "This weekend you have: Recycle cans and bottles (Thu), Pay rent (Fri). Want me to remind you an hour before either one?";
      } else if (/move|d[eé]placer|mover|deplase/.test(lower)) {
        reply = "Sure — which task, and what day should I move it to?";
      } else {
        reply = lang === "en"
          ? "Got it. I can create, list, update, complete, or schedule reminders for tasks — just tell me what you need."
          : LANG_SAMPLES[lang].greet;
      }
      setMessages((m) => [...m, { role: "assistant", text: reply, card }]);
    }, 500);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "18px 16px 10px", fontWeight: 600, fontSize: 15, letterSpacing: 0.5, borderBottom: `1px solid ${divider}` }}>
        ASSISTANT
      </div>
      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ alignSelf: m.role === "user" ? "flex-end" : "flex-start", maxWidth: "82%" }}>
            <div
              style={{
                padding: "9px 13px",
                borderRadius: 14,
                fontSize: 13.5,
                lineHeight: 1.4,
                background: m.role === "user" ? "#4a90d9" : (isDark ? "#242424" : "#eceae4"),
                color: m.role === "user" ? "#fff" : textPrimary,
              }}
            >
              {m.text}
            </div>
            {m.card && (
              <div style={{ marginTop: 6, padding: "8px 12px", borderRadius: 10, border: `1px solid ${divider}`, fontSize: 12, color: textSecondary, display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 4, height: 20, background: COLORS.blue, borderRadius: 2 }} />
                <div>
                  <div style={{ color: textPrimary, fontWeight: 600 }}>{m.card.title}</div>
                  <div>{fmtDate(m.card.due)}, {fmtTime(m.card.due)}</div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, padding: 10, borderTop: `1px solid ${divider}` }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Remind me to... / Recuérdame... / Rappelle-moi..."
          style={{ flex: 1, background: isDark ? "#232323" : "#eceae4", border: "none", outline: "none", borderRadius: 20, padding: "10px 14px", color: textPrimary, fontSize: 13.5 }}
        />
        <button onClick={send} style={{ width: 40, height: 40, borderRadius: 20, border: "none", background: "#4a90d9", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Send size={16} color="#fff" />
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tasks / calendar screen                                             */
/* ------------------------------------------------------------------ */

function TasksScreen({ ctx }) {
  const { tasks, textPrimary, textSecondary, divider, isDark } = ctx;
  const [subtab, setSubtab] = useState("upcoming");

  const open = tasks.filter((t) => t.status === "open");
  const completed = tasks.filter((t) => t.status === "completed");
  const upcoming = [...open].sort((a, b) => a.due - b.due);

  const tabs = [
    { id: "inbox", label: "Inbox" },
    { id: "upcoming", label: "Upcoming" },
    { id: "completed", label: "Completed" },
    { id: "calendar", label: "Calendar" },
  ];

  return (
    <div>
      <div style={{ padding: "18px 16px 10px", fontWeight: 600, fontSize: 15, letterSpacing: 0.5 }}>ALL TASKS</div>
      <div style={{ display: "flex", padding: "0 12px 10px", gap: 6 }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setSubtab(t.id)}
            style={{
              padding: "6px 12px",
              borderRadius: 16,
              border: `1px solid ${subtab === t.id ? "#4a90d9" : divider}`,
              background: subtab === t.id ? (isDark ? "#1d2a36" : "#e6f0fa") : "transparent",
              color: subtab === t.id ? "#4a90d9" : textSecondary,
              fontSize: 12.5,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {subtab !== "calendar" && (
        <div>
          {(subtab === "completed" ? completed : upcoming).length === 0 && (
            <div style={{ textAlign: "center", marginTop: 40, color: textSecondary, fontSize: 13 }}>Nothing here yet.</div>
          )}
          {(subtab === "completed" ? completed : upcoming).map((t) => (
            <TaskRow key={t.id} task={t} ctx={ctx} overdue={bucketOf(t.due, t.status) === "OVERDUE"} />
          ))}
        </div>
      )}

      {subtab === "calendar" && <MiniCalendar tasks={open} ctx={ctx} />}
    </div>
  );
}

function MiniCalendar({ tasks, ctx }) {
  const { textPrimary, textSecondary, divider, isDark } = ctx;
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const byDay = {};
  tasks.forEach((t) => {
    const d = t.due;
    if (d.getMonth() === month && d.getFullYear() === year) {
      byDay[d.getDate()] = byDay[d.getDate()] || [];
      byDay[d.getDate()].push(t);
    }
  });

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div style={{ padding: "4px 16px 20px" }}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, textAlign: "center" }}>
        {today.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, marginBottom: 4 }}>
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={i} style={{ textAlign: "center", fontSize: 10, color: textSecondary }}>{d}</div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
        {cells.map((d, i) => (
          <div
            key={i}
            style={{
              aspectRatio: "1",
              borderRadius: 8,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background: d === today.getDate() ? "#4a90d9" : (isDark ? "#1e1e1e" : "#f0efe9"),
              color: d === today.getDate() ? "#fff" : textPrimary,
              fontSize: 12,
              position: "relative",
            }}
          >
            {d || ""}
            {d && byDay[d] && (
              <div style={{ display: "flex", gap: 2, marginTop: 2 }}>
                {byDay[d].slice(0, 3).map((t, j) => (
                  <div key={j} style={{ width: 4, height: 4, borderRadius: 2, background: t.color }} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Settings screen                                                     */
/* ------------------------------------------------------------------ */

function SettingsScreen({ ctx }) {
  const { theme, setTheme, textPrimary, textSecondary, divider, isDark, userEmail, profileImage, updateProfileImage } = ctx;
  const [quietHours, setQuietHours] = useState(true);
  const [lang, setLang] = useState("Auto-detect");

  const Row = ({ icon: Icon, label, right }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", borderBottom: `1px solid ${divider}` }}>
      <Icon size={18} color={textSecondary} />
      <div style={{ flex: 1, fontSize: 14 }}>{label}</div>
      {right}
    </div>
  );

  const Toggle = ({ on, onClick }) => (
    <button onClick={onClick} style={{ width: 40, height: 24, borderRadius: 12, border: "none", background: on ? "#4a90d9" : "#3a3a3a", position: "relative", cursor: "pointer" }}>
      <div style={{ width: 18, height: 18, borderRadius: 9, background: "#fff", position: "absolute", top: 3, left: on ? 19 : 3, transition: "left .15s" }} />
    </button>
  );

  return (
    <div>
      <div style={{ padding: "18px 16px 10px", fontWeight: 600, fontSize: 15, letterSpacing: 0.5 }}>SETTINGS</div>

      <div style={{ padding: "10px 16px 14px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 58, height: 58, borderRadius: 29, background: "linear-gradient(135deg, #8b5cf6, #4c1d95)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
          {profileImage ? <img src={profileImage} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <User size={24} color="#fff" />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: textPrimary }}>Profile picture</div>
          <div style={{ fontSize: 12, color: textSecondary, marginTop: 3 }}>Choose a photo for your profile</div>
        </div>
        <label style={{ padding: "8px 12px", borderRadius: 10, background: "#4a90d9", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
          Upload
          <input type="file" accept="image/*" onChange={(event) => updateProfileImage(event.target.files?.[0])} style={{ display: "none" }} />
        </label>
      </div>

      <div style={{ padding: "6px 16px", fontSize: 11, color: textSecondary, letterSpacing: 0.5 }}>NOTIFICATIONS</div>
      <Row icon={Bell} label="Reminder notifications" right={<Toggle on={true} onClick={() => {}} />} />
      <Row icon={Moon} label="Quiet hours (10 PM – 7 AM)" right={<Toggle on={quietHours} onClick={() => setQuietHours((q) => !q)} />} />

      <div style={{ padding: "14px 16px 6px", fontSize: 11, color: textSecondary, letterSpacing: 0.5 }}>APPEARANCE</div>
      <Row
        icon={isDark ? Moon : Sun}
        label="Theme"
        right={
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => setTheme("dark")} style={{ padding: "4px 10px", borderRadius: 10, border: `1px solid ${theme === "dark" ? "#4a90d9" : divider}`, background: "transparent", color: theme === "dark" ? "#4a90d9" : textSecondary, fontSize: 12 }}>Dark</button>
            <button onClick={() => setTheme("light")} style={{ padding: "4px 10px", borderRadius: 10, border: `1px solid ${theme === "light" ? "#4a90d9" : divider}`, background: "transparent", color: theme === "light" ? "#4a90d9" : textSecondary, fontSize: 12 }}>Light</button>
          </div>
        }
      />

      <div style={{ padding: "14px 16px 6px", fontSize: 11, color: textSecondary, letterSpacing: 0.5 }}>ASSISTANT</div>
      <Row
        icon={Globe}
        label="Assistant language"
        right={<span style={{ fontSize: 13, color: textSecondary, display: "flex", alignItems: "center", gap: 4 }}>{lang} <ChevronRight size={14} /></span>}
      />

      <div style={{ padding: "14px 16px 6px", fontSize: 11, color: textSecondary, letterSpacing: 0.5 }}>ACCOUNT</div>
      <Row icon={Globe} label="Timezone" right={<span style={{ fontSize: 13, color: textSecondary }}>Auto (GMT-4)</span>} />
      <Row icon={SettingsIcon} label={userEmail} right={<span style={{ fontSize: 12, color: "#4a90d9" }}>Sign out</span>} />
      <Row icon={Trash2} label="Delete my data" right={<span style={{ fontSize: 12, color: "#e05a5a" }}>Delete</span>} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Logo mark (matches the reference: two rounded bars + circle)       */
/* ------------------------------------------------------------------ */

function LogoMark({ size = 90 }) {
  const barW = size, barH = size * 0.24, gap = size * 0.06, r = barH / 2;
  return (
    <div style={{ position: "relative", width: barW, height: barH * 2 + gap }}>
      <div style={{ position: "absolute", top: 0, left: 0, width: barW, height: barH, borderRadius: r, background: "linear-gradient(180deg,#f4f4f6,#c9cad0)" }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, width: barW, height: barH, borderRadius: r, background: "linear-gradient(180deg,#f4f4f6,#c9cad0)" }} />
      <div style={{ position: "absolute", top: barH * 0.5 - (barH * 0.9) / 2, left: barW * 0.18, width: barH * 0.9, height: barH * 0.9, borderRadius: "50%", background: "radial-gradient(circle at 35% 30%, #ffffff, #d8d9dd)" }} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Auth flow: splash -> sign in / sign up card                        */
/* ------------------------------------------------------------------ */

function AuthGate() {
  const [theme, setTheme] = useState("dark");
  const [stage, setStage] = useState("splash"); // splash | auth | app
  const [mode, setMode] = useState("signup"); // signup | signin
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");

  const isDark = theme === "dark";
  const cardBg = isDark ? "#1c1c1c" : "#ffffff";
  const cardText = isDark ? "#f2f2f0" : "#1a1a1a";
  const cardSub = isDark ? "#8f8f8c" : "#6b6b68";
  const fieldBg = isDark ? "#242424" : "#ffffff";
  const fieldBorder = isDark ? "#333" : "#dcdbd6";

  const shellStyle = {
    background: isDark ? "#161616" : "#f4f3ef",
    height: "100vh",
    minHeight: "100vh",
    width: "100%",
    maxWidth: 480,
    margin: "0 auto",
    overflow: "hidden",
    position: "relative",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif",
  };

  function submit() {
    if (mode === "signup" && !agreed) {
      setError("Agree to the terms and conditions to continue.");
      return;
    }
    if (!email.trim() || !password.trim()) {
      setError("Enter your email and password.");
      return;
    }
    setError("");
    setStage("app");
  }

  if (stage === "app") {
    return (
      <MainApp
        startTheme={theme}
        userEmail={email || "you@example.com"}
        onLogout={() => {
          setStage("splash");
          setPassword("");
        }}
      />
    );
  }

  return (
    <div style={{ display: "flex", justifyContent: "center", width: "100%", minHeight: "100vh", background: isDark ? "#161616" : "#f4f3ef" }}>
      <div style={shellStyle}>
        {/* theme toggle, always available pre-login */}
        <button
          onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
          style={{
            position: "absolute", top: 16, right: 16, zIndex: 5,
            width: 34, height: 34, borderRadius: 17,
            border: "1px solid rgba(255,255,255,0.35)",
            background: "rgba(0,0,0,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", cursor: "pointer",
          }}
          aria-label="Toggle dark mode"
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* purple gradient header */}
        <div
          style={{
            height: stage === "splash" ? "100%" : "30%",
            background: BRAND.gradientLight,
            position: "relative",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: stage === "splash" ? "space-between" : "center",
            padding: stage === "splash" ? "70px 28px 40px" : "0",
            transition: "height .25s ease",
          }}
        >
          {/* diagonal accent lines, decorative */}
          <svg style={{ position: "absolute", inset: 0, opacity: 0.25 }} width="100%" height="100%">
            <line x1="10%" y1="90%" x2="30%" y2="60%" stroke="#fff" strokeWidth="1.5" />
            <line x1="60%" y1="95%" x2="80%" y2="65%" stroke="#fff" strokeWidth="1.5" />
            <line x1="40%" y1="20%" x2="60%" y2="0%" stroke="#fff" strokeWidth="1.5" />
          </svg>

          {stage === "splash" ? (
            <>
              <div />
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18, zIndex: 1 }}>
                <LogoMark size={84} />
                <div style={{ color: "#fff", fontWeight: 700, fontSize: 26 }}>Daily Task Reminder</div>
              </div>
              <div style={{ width: "100%", zIndex: 1 }}>
                <button
                  onClick={() => { setMode("signup"); setStage("auth"); }}
                  style={{ width: "100%", padding: "16px 0", borderRadius: 30, border: "none", background: "#fff", color: BRAND.indigo, fontWeight: 700, fontSize: 15, cursor: "pointer" }}
                >
                  Get started
                </button>
                <div
                  onClick={() => { setMode("signin"); setStage("auth"); }}
                  style={{ textAlign: "center", color: "rgba(255,255,255,0.85)", fontSize: 12.5, marginTop: 12, cursor: "pointer" }}
                >
                  I already have an account
                </div>
              </div>
            </>
          ) : (
            <div style={{ zIndex: 1 }}>
              <LogoMark size={68} />
            </div>
          )}
        </div>

        {/* auth card */}
        {stage === "auth" && (
          <div
            style={{
              position: "absolute",
              top: "26%",
              left: 0,
              right: 0,
              bottom: 0,
              background: cardBg,
              borderRadius: "26px 26px 0 0",
              padding: "26px 22px",
              display: "flex",
              flexDirection: "column",
              overflowY: "auto",
            }}
          >
            <div style={{ textAlign: "center", fontWeight: 800, fontSize: 22, color: BRAND.violet, marginBottom: 18 }}>
              {mode === "signup" ? "hello!" : "welcome back!"}
            </div>

            <FieldRow icon={Mail} placeholder="Email" value={email} onChange={setEmail} fieldBg={fieldBg} fieldBorder={fieldBorder} textColor={cardText} />
            <div style={{ height: 12 }} />
            <FieldRow
              icon={Lock}
              placeholder="Password"
              value={password}
              onChange={setPassword}
              type={showPw ? "text" : "password"}
              fieldBg={fieldBg} fieldBorder={fieldBorder} textColor={cardText}
              trailing={
                <button onClick={() => setShowPw((s) => !s)} style={{ background: "none", border: "none", color: cardSub, cursor: "pointer" }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
            />

            {mode === "signup" && (
              <div onClick={() => setAgreed((a) => !a)} style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 12, fontSize: 12, color: cardSub, cursor: "pointer" }}>
                {agreed ? <CheckSquare size={15} color={BRAND.violet} /> : <Square size={15} />}
                I agree to the <b style={{ color: cardText }}>&nbsp;terms and conditions</b>
              </div>
            )}

            {error && <div style={{ color: "#e05a5a", fontSize: 12, marginTop: 10 }}>{error}</div>}

            <button
              onClick={submit}
              style={{
                marginTop: 18, width: "100%", padding: "15px 0", borderRadius: 30, border: "none",
                background: BRAND.gradientLight, color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer",
              }}
            >
              {mode === "signup" ? "Sign up" : "Sign in"}
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "16px 0", color: cardSub, fontSize: 11 }}>
              <div style={{ flex: 1, height: 1, background: fieldBorder }} />
              or
              <div style={{ flex: 1, height: 1, background: fieldBorder }} />
            </div>

            <div style={{ display: "flex", justifyContent: "center", gap: 14, marginBottom: 10 }}>
              <SocialDot label="G" bg="#ea4335" disabled />
              <SocialDot label="" icon="apple" bg={isDark ? "#fff" : "#000"} disabled />
            </div>
            <div style={{ textAlign: "center", fontSize: 11.5, color: cardSub }}>
              Google and Apple sign-in <b style={{ color: cardText }}>coming soon</b>
            </div>

            <div style={{ textAlign: "center", marginTop: 14, fontSize: 12.5, color: cardSub }}>
              {mode === "signup" ? (
                <>Already have an account?{" "}
                  <span onClick={() => setMode("signin")} style={{ color: BRAND.violet, fontWeight: 700, cursor: "pointer" }}>Sign in</span>
                </>
              ) : (
                <>New here?{" "}
                  <span onClick={() => setMode("signup")} style={{ color: BRAND.violet, fontWeight: 700, cursor: "pointer" }}>Create an account</span>
                </>
              )}
            </div>

            <button
              onClick={() => setStage("splash")}
              style={{ position: "absolute", top: 14, left: 14, background: "none", border: "none", color: cardSub }}
            >
              <ChevronLeft size={20} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function FieldRow({ icon: Icon, placeholder, value, onChange, type = "text", fieldBg, fieldBorder, textColor, trailing }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, background: fieldBg, border: `1px solid ${fieldBorder}`, borderRadius: 24, padding: "12px 16px" }}>
      <Icon size={16} color="#9a9a97" />
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ flex: 1, border: "none", outline: "none", background: "transparent", color: textColor, fontSize: 14 }}
      />
      {trailing}
    </div>
  );
}

function SocialDot({ label, bg, disabled }) {
  return (
    <div
      style={{
        width: 42, height: 42, borderRadius: 12, background: bg,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: bg === "#fff" ? "#000" : "#fff", fontWeight: 700, fontSize: 14,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {label}
    </div>
  );
}

export default function App() {
  return <AuthGate />;
}
