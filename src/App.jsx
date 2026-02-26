import { useState, useEffect, useCallback, useRef } from "react";

// ─── DESIGN SYSTEM ───────────────────────────────────────────────
const COLORS = {
  bg: "#0C0F14",
  surface: "#141820",
  surfaceRaised: "#1A1F2B",
  surfaceHover: "#1E2433",
  border: "#2A3040",
  borderFocus: "#4A7CFF",
  text: "#E8ECF4",
  textSecondary: "#8892A6",
  textMuted: "#5A6478",
  accent: "#4A7CFF",
  accentSoft: "rgba(74,124,255,0.12)",
  accentGlow: "rgba(74,124,255,0.25)",
  success: "#34D399",
  successSoft: "rgba(52,211,153,0.12)",
  warning: "#FBBF24",
  warningSoft: "rgba(251,191,36,0.12)",
  danger: "#EF4444",
  dangerSoft: "rgba(239,68,68,0.12)",
  info: "#60A5FA",
};

const STATUS_COLORS = {
  active: { bg: COLORS.successSoft, text: COLORS.success, label: "Активен" },
  invited: { bg: COLORS.accentSoft, text: COLORS.accent, label: "Приглашён" },
  pending_approval: { bg: COLORS.warningSoft, text: COLORS.warning, label: "Ожидает подтверждения" },
  suspended: { bg: COLORS.dangerSoft, text: COLORS.danger, label: "Приостановлен" },
  revoked: { bg: "rgba(90,100,120,0.15)", text: COLORS.textMuted, label: "Отозван" },
  archived: { bg: "rgba(90,100,120,0.1)", text: COLORS.textMuted, label: "В архиве" },
};

const ROLE_ICONS = {
  "Администратор организации": "◆",
  "Операционный специалист": "●",
  "Специалист по комплаенсу": "■",
  "Технический специалист": "▲",
  "Подписант": "✦",
  "Аудитор": "◎",
};

// ─── MOCK DATA ───────────────────────────────────────────────────
const MOCK_PEOPLE = [
  { id: 1, name: "Волков Алексей Иванович", email: "a.volkov@broker-alpha.ru", roles: ["Администратор организации"], status: "active", contactType: "операционный", lastLogin: "2026-02-26T08:14:00Z", tempAccess: null, riskScore: 0 },
  { id: 2, name: "Кузнецова Елена Сергеевна", email: "y.kuznetsova@broker-alpha.ru", roles: ["Операционный специалист", "Подписант"], status: "active", contactType: "операционный", lastLogin: "2026-02-25T16:42:00Z", tempAccess: null, riskScore: 2 },
  { id: 3, name: "Орлов Дмитрий Петрович", email: "d.orlov@broker-alpha.ru", roles: ["Специалист по комплаенсу"], status: "active", contactType: "комплаенс", lastLogin: "2026-02-24T11:20:00Z", tempAccess: null, riskScore: 0 },
  { id: 4, name: "Соколова Марина Андреевна", email: "m.sokolova@broker-alpha.ru", roles: ["Технический специалист"], status: "active", contactType: "технический", lastLogin: "2026-02-26T09:01:00Z", tempAccess: null, riskScore: 0 },
  { id: 5, name: "Новиков Павел Викторович", email: "p.novikov@broker-alpha.ru", roles: ["Операционный специалист"], status: "suspended", contactType: "операционный", lastLogin: "2026-02-10T14:33:00Z", tempAccess: null, riskScore: 0 },
  { id: 6, name: "Петрова Ольга Николаевна", email: "o.petrova@audit-firm.ru", roles: ["Аудитор"], status: "active", contactType: "комплаенс", lastLogin: "2026-02-26T07:55:00Z", tempAccess: { start: "2026-02-20", end: "2026-02-27", daysLeft: 1 }, riskScore: 0 },
  { id: 7, name: "Иванов Сергей Александрович", email: "s.ivanov@broker-alpha.ru", roles: ["Администратор организации", "Подписант"], status: "active", contactType: "операционный", lastLogin: "2026-02-25T09:10:00Z", tempAccess: null, riskScore: 3 },
  { id: 8, name: "Фёдорова Анна Дмитриевна", email: "a.fedorova@broker-alpha.ru", roles: [], status: "invited", contactType: "операционный", lastLogin: null, tempAccess: null, riskScore: 0 },
];

const MOCK_ROLES = [
  { id: "org-admin", name: "Администратор организации", type: "predefined", description: "Полное управление кабинетом организации на бирже: пользователи, роли, настройки", responsibilities: ["user_administration", "role_management", "approval_authority", "organization_settings"], userCount: 2 },
  { id: "ops-officer", name: "Операционный специалист", type: "predefined", description: "Ежедневные операции: расчёты, маржа, отчётность", responsibilities: ["settlement_initiate", "settlement_confirm", "margin_view", "margin_manage", "reporting_view", "reporting_submit"], userCount: 2 },
  { id: "compliance", name: "Специалист по комплаенсу", type: "predefined", description: "Контроль соблюдения регуляторных требований, управление аудитом и комплаенс-отчётность", responsibilities: ["reporting_view", "reporting_submit", "audit_log_view", "audit_log_export", "compliance_reporting"], userCount: 1 },
  { id: "tech-int", name: "Технический специалист", type: "predefined", description: "Управление API-доступом, настройка технических подключений и интеграций", responsibilities: ["api_key_management", "integration_config", "technical_monitoring"], userCount: 1 },
  { id: "signatory", name: "Подписант", type: "predefined", description: "Уполномочен подтверждать и подписывать биржевые операции от имени организации", responsibilities: ["operation_confirm", "document_sign", "settlement_approve"], userCount: 2 },
  { id: "auditor", name: "Аудитор", type: "predefined", description: "Доступ только для чтения: просмотр операций, отчётов и истории изменений", responsibilities: ["reporting_view", "audit_log_view", "audit_log_export", "settlement_view", "margin_view"], userCount: 1 },
];

const RESPONSIBILITY_GROUPS = {
  "Отчётность": [
    { id: "reporting_view", label: "Просмотр отчётов и выписок", risk: "low" },
    { id: "reporting_submit", label: "Подача регуляторных отчётов", risk: "high" },
    { id: "compliance_reporting", label: "Управление комплаенс-отчётностью", risk: "medium" },
  ],
  "Расчёты": [
    { id: "settlement_view", label: "Просмотр статуса расчётов", risk: "low" },
    { id: "settlement_initiate", label: "Создание расчётных поручений", risk: "high" },
    { id: "settlement_confirm", label: "Подтверждение расчётных поручений", risk: "high" },
    { id: "settlement_approve", label: "Утверждение расчётных операций", risk: "critical" },
  ],
  "Маржа": [
    { id: "margin_view", label: "Просмотр маржинальных позиций", risk: "low" },
    { id: "margin_manage", label: "Управление маржинальными операциями", risk: "high" },
  ],
  "Документы": [
    { id: "document_view", label: "Просмотр документов", risk: "low" },
    { id: "document_sign", label: "Подписание документов от имени организации", risk: "critical" },
  ],
  "Интеграция": [
    { id: "api_key_management", label: "Управление API-ключами", risk: "high" },
    { id: "integration_config", label: "Настройка технических подключений", risk: "medium" },
    { id: "technical_monitoring", label: "Мониторинг подключений", risk: "low" },
  ],
  "Администрирование": [
    { id: "user_administration", label: "Управление представителями организации", risk: "high" },
    { id: "role_management", label: "Назначение и изменение ролей", risk: "high" },
    { id: "approval_authority", label: "Утверждение запросов на изменение доступа", risk: "critical" },
    { id: "organization_settings", label: "Настройки организации", risk: "medium" },
  ],
  "Подтверждение операций": [
    { id: "operation_confirm", label: "Подтверждение биржевых операций", risk: "critical" },
  ],
};

const SOD_CONFLICTS = [
  { resp1: "settlement_initiate", resp2: "settlement_approve", severity: "critical", message: "Нельзя создавать и утверждать одну и ту же расчётную операцию — нарушение разделения обязанностей" },
  { resp1: "settlement_initiate", resp2: "settlement_confirm", severity: "warning", message: "Создание и подтверждение расчётов одним лицом требует дополнительного контроля" },
  { resp1: "user_administration", resp2: "operation_confirm", severity: "warning", message: "Совмещение администрирования пользователей и подтверждения операций повышает уровень риска" },
  { resp1: "role_management", resp2: "approval_authority", severity: "critical", message: "Нельзя назначать роли и утверждать запросы на доступ — требуется принцип «четырёх глаз»" },
  { resp1: "api_key_management", resp2: "operation_confirm", severity: "warning", message: "Технический доступ в сочетании с подтверждением операций создаёт повышенный риск" },
];

const MOCK_APPROVALS = [
  { id: 1, type: "role_change", subject: "Фёдорова Анна Дмитриевна", description: "Назначить роль: Операционный специалист", requestedBy: "Волков А. И.", requestedAt: "2026-02-25T14:00:00Z", approver: "Иванов С. А.", deadline: "2026-02-28T23:59:00Z", status: "pending", comments: [] },
  { id: 2, type: "access_revocation", subject: "Новиков Павел Викторович", description: "Полный отзыв доступа — увольнение сотрудника", requestedBy: "Волков А. И.", requestedAt: "2026-02-24T10:00:00Z", approver: "Орлов Д. П.", deadline: "2026-02-26T23:59:00Z", status: "pending", comments: [{ author: "Орлов Д. П.", text: "Подтвердите, что кадровая служба уведомлена.", time: "2026-02-24T11:30:00Z" }] },
  { id: 3, type: "temp_access", subject: "Петрова Ольга Николаевна", description: "Продлить доступ аудитора на 14 дней", requestedBy: "Орлов Д. П.", requestedAt: "2026-02-25T16:00:00Z", approver: "Волков А. И.", deadline: "2026-02-27T12:00:00Z", status: "pending", comments: [] },
];

const MOCK_AUDIT_LOG = [
  { id: 1, timestamp: "2026-02-26T08:14:00Z", actor: "Волков А. И.", action: "Отправлено приглашение", target: "Фёдорова А. Д.", details: "Предварительная роль: Операционный специалист", before: null, after: "приглашён" },
  { id: 2, timestamp: "2026-02-24T10:05:00Z", actor: "Волков А. И.", action: "Приостановлен доступ", target: "Новиков П. В.", details: "Причина: начат процесс увольнения", before: "активен", after: "приостановлен" },
  { id: 3, timestamp: "2026-02-20T09:00:00Z", actor: "Волков А. И.", action: "Временный доступ предоставлен", target: "Петрова О. Н.", details: "Роль: Аудитор, 20.02 — 27.02.2026", before: null, after: "активен (временно)" },
  { id: 4, timestamp: "2026-02-18T14:22:00Z", actor: "Иванов С. А.", action: "Утверждено изменение роли", target: "Кузнецова Е. С.", details: "Добавлена роль: Подписант (утверждено Ивановым С. А., принцип «четырёх глаз»)", before: "Операционный специалист", after: "Операционный специалист, Подписант" },
  { id: 5, timestamp: "2026-02-15T11:00:00Z", actor: "Система", action: "Обнаружен конфликт обязанностей", target: "Кузнецова Е. С.", details: "Конфликт: создание + подтверждение расчётов одним лицом", before: null, after: "предупреждение принято" },
  { id: 6, timestamp: "2026-02-10T09:30:00Z", actor: "Волков А. И.", action: "Создана пользовательская роль", target: "Младший аналитик", details: "Роль с правами только на чтение отчётов и расчётов", before: null, after: "роль создана" },
];

// ─── UTILITY COMPONENTS ──────────────────────────────────────────
const Badge = ({ color, bg, children, small }) => (
  <span style={{
    display: "inline-flex", alignItems: "center", gap: 4,
    padding: small ? "2px 8px" : "3px 10px",
    borderRadius: 4, fontSize: small ? 11 : 12, fontWeight: 550,
    color, backgroundColor: bg, letterSpacing: "0.01em",
    whiteSpace: "nowrap",
  }}>{children}</span>
);

const StatusBadge = ({ status }) => {
  const s = STATUS_COLORS[status] || STATUS_COLORS.active;
  return <Badge color={s.text} bg={s.bg}>{s.label}</Badge>;
};

const RiskBadge = ({ level }) => {
  const map = {
    low: { color: COLORS.textSecondary, bg: "transparent", label: "Низкий" },
    medium: { color: COLORS.warning, bg: COLORS.warningSoft, label: "Средний" },
    high: { color: "#F97316", bg: "rgba(249,115,22,0.12)", label: "Высокий" },
    critical: { color: COLORS.danger, bg: COLORS.dangerSoft, label: "Критический" },
  };
  const m = map[level] || map.low;
  return <Badge color={m.color} bg={m.bg} small>{m.label}</Badge>;
};

const RiskIndicator = ({ score }) => {
  if (score === 0) return null;
  const color = score >= 3 ? COLORS.danger : score >= 2 ? COLORS.warning : COLORS.info;
  const label = score >= 3 ? "Высокий риск" : "Повышенный";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }} title={`Уровень риска: ${score} — обнаружено совмещение полномочий`}>
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        <path d="M8 1L15 14H1L8 1Z" fill={color} opacity="0.9"/>
        <text x="8" y="12" textAnchor="middle" fill={COLORS.bg} fontSize="8" fontWeight="700">!</text>
      </svg>
      <span style={{ fontSize: 11, color, fontWeight: 600 }}>{label}</span>
    </div>
  );
};

const TempAccessBadge = ({ tempAccess }) => {
  if (!tempAccess) return null;
  const urgent = tempAccess.daysLeft <= 1;
  return (
    <Badge color={urgent ? COLORS.danger : COLORS.warning} bg={urgent ? COLORS.dangerSoft : COLORS.warningSoft} small>
      ⏱ {tempAccess.daysLeft} дн. осталось
    </Badge>
  );
};

const Button = ({ children, variant = "default", size = "md", onClick, disabled, style: extraStyle }) => {
  const base = {
    display: "inline-flex", alignItems: "center", gap: 6, border: "none", cursor: disabled ? "not-allowed" : "pointer",
    borderRadius: 6, fontWeight: 550, fontSize: size === "sm" ? 12 : 13, letterSpacing: "0.01em",
    padding: size === "sm" ? "6px 12px" : "8px 16px", transition: "all 0.15s ease",
    opacity: disabled ? 0.4 : 1, fontFamily: "inherit",
  };
  const variants = {
    default: { backgroundColor: COLORS.surfaceRaised, color: COLORS.text, border: `1px solid ${COLORS.border}` },
    primary: { backgroundColor: COLORS.accent, color: "#fff" },
    danger: { backgroundColor: COLORS.dangerSoft, color: COLORS.danger, border: `1px solid rgba(239,68,68,0.2)` },
    success: { backgroundColor: COLORS.successSoft, color: COLORS.success, border: `1px solid rgba(52,211,153,0.2)` },
    ghost: { backgroundColor: "transparent", color: COLORS.textSecondary },
  };
  return <button style={{ ...base, ...variants[variant], ...extraStyle }} onClick={onClick} disabled={disabled}>{children}</button>;
};

const Card = ({ children, style, onClick, hoverable }) => (
  <div
    onClick={onClick}
    style={{
      backgroundColor: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 8,
      padding: 20, cursor: onClick ? "pointer" : "default",
      transition: "all 0.15s ease", ...style,
    }}
    onMouseEnter={e => { if (hoverable) { e.currentTarget.style.borderColor = COLORS.borderFocus; e.currentTarget.style.backgroundColor = COLORS.surfaceHover; } }}
    onMouseLeave={e => { if (hoverable) { e.currentTarget.style.borderColor = COLORS.border; e.currentTarget.style.backgroundColor = COLORS.surface; } }}
  >{children}</div>
);

const SectionHeader = ({ title, subtitle, action }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 650, color: COLORS.text, margin: 0 }}>{title}</h2>
      {subtitle && <p style={{ fontSize: 13, color: COLORS.textSecondary, margin: "4px 0 0", lineHeight: 1.5 }}>{subtitle}</p>}
    </div>
    {action}
  </div>
);

const EmptyState = ({ icon, title, description }) => (
  <div style={{ textAlign: "center", padding: "48px 24px", color: COLORS.textMuted }}>
    <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.5 }}>{icon}</div>
    <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.textSecondary, marginBottom: 4 }}>{title}</div>
    <div style={{ fontSize: 13 }}>{description}</div>
  </div>
);

const StatCard = ({ label, value, sub, color, onClick }) => (
  <Card hoverable={!!onClick} onClick={onClick} style={{ flex: 1, minWidth: 140 }}>
    <div style={{ fontSize: 11, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, marginBottom: 8 }}>{label}</div>
    <div style={{ fontSize: 28, fontWeight: 700, color: color || COLORS.text, lineHeight: 1 }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 6 }}>{sub}</div>}
  </Card>
);

const SearchInput = ({ value, onChange, placeholder }) => (
  <div style={{ position: "relative", flex: 1, maxWidth: 320 }}>
    <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: COLORS.textMuted, fontSize: 14 }}>⌕</span>
    <input
      type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{
        width: "100%", padding: "8px 12px 8px 30px", backgroundColor: COLORS.surfaceRaised, border: `1px solid ${COLORS.border}`,
        borderRadius: 6, color: COLORS.text, fontSize: 13, outline: "none", fontFamily: "inherit", boxSizing: "border-box",
      }}
      onFocus={e => e.target.style.borderColor = COLORS.borderFocus}
      onBlur={e => e.target.style.borderColor = COLORS.border}
    />
  </div>
);

const Tabs = ({ tabs, active, onChange }) => (
  <div style={{ display: "flex", gap: 0, borderBottom: `1px solid ${COLORS.border}`, marginBottom: 20 }}>
    {tabs.map(t => (
      <button
        key={t.id} onClick={() => onChange(t.id)}
        style={{
          padding: "10px 16px", fontSize: 13, fontWeight: active === t.id ? 600 : 450,
          color: active === t.id ? COLORS.accent : COLORS.textSecondary,
          backgroundColor: "transparent", border: "none", cursor: "pointer",
          borderBottom: active === t.id ? `2px solid ${COLORS.accent}` : "2px solid transparent",
          fontFamily: "inherit", transition: "all 0.15s",
        }}
      >
        {t.label}{t.count != null && <span style={{ marginLeft: 6, fontSize: 11, opacity: 0.7 }}>({t.count})</span>}
      </button>
    ))}
  </div>
);

const formatDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  const months = ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}, ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
};

const formatRelative = (iso) => {
  if (!iso) return "Нет данных";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Только что";
  if (mins < 60) return `${mins} мин. назад`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} ч. назад`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Вчера";
  return `${days} дн. назад`;
};

const pluralize = (n, one, few, many) => {
  const mod10 = n % 10, mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 19) return many;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
};

// ─── MODAL ───────────────────────────────────────────────────────
const Modal = ({ open, onClose, title, width = 560, children }) => {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={onClose}>
      <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} />
      <div onClick={e => e.stopPropagation()} style={{
        position: "relative", width, maxWidth: "90vw", maxHeight: "85vh", overflow: "auto",
        backgroundColor: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 12,
        boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
      }}>
        <div style={{ padding: "20px 24px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 650, color: COLORS.text }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: COLORS.textMuted, cursor: "pointer", fontSize: 18, fontFamily: "inherit" }}>✕</button>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  );
};

// ─── LIFECYCLE STATE DIAGRAM ─────────────────────────────────────
const LifecycleDiagram = () => {
  const states = [
    { id: "invited", label: "Приглашён", x: 60, y: 80, color: COLORS.accent },
    { id: "pending", label: "Ожидает", x: 220, y: 80, color: COLORS.warning },
    { id: "active", label: "Активен", x: 380, y: 80, color: COLORS.success },
    { id: "suspended", label: "Приостан.", x: 380, y: 200, color: COLORS.danger },
    { id: "revoked", label: "Отозван", x: 220, y: 200, color: COLORS.textMuted },
    { id: "archived", label: "Архив", x: 60, y: 200, color: "#4A5568" },
  ];
  const arrows = [
    { from: "invited", to: "pending", label: "Верификация" },
    { from: "pending", to: "active", label: "Утверждён" },
    { from: "active", to: "suspended", label: "Приостановить" },
    { from: "suspended", to: "active", label: "Возобновить" },
    { from: "suspended", to: "revoked", label: "Отозвать" },
    { from: "active", to: "revoked", label: "Отозвать" },
    { from: "revoked", to: "archived", label: "В архив" },
    { from: "pending", to: "revoked", label: "Отклонить" },
  ];
  return (
    <svg width="100%" viewBox="0 0 480 280" style={{ maxWidth: 480 }}>
      <defs>
        <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill={COLORS.textMuted} />
        </marker>
      </defs>
      {arrows.map((a, i) => {
        const from = states.find(s => s.id === a.from);
        const to = states.find(s => s.id === a.to);
        const mx = (from.x + to.x) / 2, my = (from.y + to.y) / 2;
        return (
          <g key={i}>
            <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke={COLORS.border} strokeWidth="1.5" markerEnd="url(#arrowhead)" />
            <text x={mx} y={my - 6} textAnchor="middle" fill={COLORS.textMuted} fontSize="8" fontFamily="inherit">{a.label}</text>
          </g>
        );
      })}
      {states.map(s => (
        <g key={s.id}>
          <circle cx={s.x} cy={s.y} r="30" fill={COLORS.surfaceRaised} stroke={s.color} strokeWidth="2" />
          <text x={s.x} y={s.y + 3} textAnchor="middle" fill={s.color} fontSize="9" fontWeight="600" fontFamily="inherit">{s.label}</text>
        </g>
      ))}
    </svg>
  );
};

// ─── PAGE: DASHBOARD ─────────────────────────────────────────────
const Dashboard = ({ setPage, people, approvals }) => {
  const active = people.filter(p => p.status === "active").length;
  const pending = approvals.filter(a => a.status === "pending").length;
  const tempCount = people.filter(p => p.tempAccess).length;
  const highRisk = people.filter(p => p.riskScore >= 2).length;
  const expiringSoon = people.filter(p => p.tempAccess && p.tempAccess.daysLeft <= 2);

  return (
    <div>
      <SectionHeader
        title="Обзор доступа и полномочий"
        subtitle="Организация: ООО «Брокер Альфа» — участник биржи с 2019 года"
      />

      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        <StatCard label="Активные представители" value={active} sub={`из ${people.length} всего`} onClick={() => setPage("people")} />
        <StatCard label="Ожидают утверждения" value={pending} color={pending > 0 ? COLORS.warning : COLORS.success} sub={pending > 0 ? "Требуется действие" : "Нет ожидающих"} onClick={() => setPage("approvals")} />
        <StatCard label="Временный доступ" value={tempCount} color={tempCount > 0 ? COLORS.info : COLORS.textMuted} sub={expiringSoon.length > 0 ? `${expiringSoon.length} истекает скоро` : "Нет срочных"} onClick={() => setPage("temp-access")} />
        <StatCard label="Предупреждения" value={highRisk} color={highRisk > 0 ? COLORS.danger : COLORS.success} sub={highRisk > 0 ? "Обнаружены совмещения" : "Конфликтов нет"} onClick={() => setPage("sod")} />
      </div>

      {(pending > 0 || expiringSoon.length > 0 || highRisk > 0) && (
        <Card style={{ marginBottom: 24, borderColor: COLORS.warning, borderLeftWidth: 3 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.warning, marginBottom: 8 }}>⚠ Требуется внимание</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {pending > 0 && (
              <div style={{ fontSize: 13, color: COLORS.textSecondary, cursor: "pointer" }} onClick={() => setPage("approvals")}>
                → <strong style={{ color: COLORS.text }}>{pending} {pluralize(pending, "запрос", "запроса", "запросов")}</strong> на изменение доступа {pluralize(pending, "ожидает", "ожидают", "ожидают")} вашего рассмотрения
              </div>
            )}
            {expiringSoon.map(p => (
              <div key={p.id} style={{ fontSize: 13, color: COLORS.textSecondary, cursor: "pointer" }} onClick={() => setPage("temp-access")}>
                → <strong style={{ color: COLORS.text }}>{p.name}</strong> — временный доступ истекает через <span style={{ color: COLORS.danger, fontWeight: 600 }}>{p.tempAccess.daysLeft} {pluralize(p.tempAccess.daysLeft, "день", "дня", "дней")}</span>
              </div>
            ))}
            {highRisk > 0 && (
              <div style={{ fontSize: 13, color: COLORS.textSecondary, cursor: "pointer" }} onClick={() => setPage("sod")}>
                → У <strong style={{ color: COLORS.text }}>{highRisk} {pluralize(highRisk, "представителя", "представителей", "представителей")}</strong> обнаружено совмещение полномочий — рекомендуется проверка
              </div>
            )}
          </div>
        </Card>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        <Card>
          <div style={{ fontSize: 13, fontWeight: 650, color: COLORS.text, marginBottom: 16 }}>Карта полномочий организации</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {MOCK_ROLES.map(role => (
              <div key={role.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ color: COLORS.accent, fontSize: 10 }}>{ROLE_ICONS[role.name] || "○"}</span>
                  <span style={{ fontSize: 13, color: COLORS.text, fontWeight: 500 }}>{role.name}</span>
                </div>
                <Badge color={COLORS.textSecondary} bg={COLORS.surfaceRaised} small>{role.userCount} назнач.</Badge>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <div style={{ fontSize: 13, fontWeight: 650, color: COLORS.text, marginBottom: 16 }}>Жизненный цикл доступа</div>
          <LifecycleDiagram />
        </Card>
      </div>

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 650, color: COLORS.text }}>Последние изменения</div>
          <Button variant="ghost" size="sm" onClick={() => setPage("audit")}>Полный журнал →</Button>
        </div>
        {MOCK_AUDIT_LOG.slice(0, 4).map(entry => (
          <div key={entry.id} style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: `1px solid ${COLORS.border}` }}>
            <div style={{ fontSize: 11, color: COLORS.textMuted, minWidth: 110, whiteSpace: "nowrap" }}>{formatRelative(entry.timestamp)}</div>
            <div style={{ flex: 1, fontSize: 13, color: COLORS.textSecondary }}>
              <strong style={{ color: COLORS.text }}>{entry.actor}</strong> — {entry.action} → <strong style={{ color: COLORS.text }}>{entry.target}</strong>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
};

// ─── PAGE: PEOPLE ────────────────────────────────────────────────
const PeoplePage = ({ people, setPage, onInvite, onViewPerson }) => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const tabs = [
    { id: "all", label: "Все", count: people.length },
    { id: "active", label: "Активные", count: people.filter(p => p.status === "active").length },
    { id: "invited", label: "Приглашённые", count: people.filter(p => p.status === "invited").length },
    { id: "suspended", label: "Приостановленные", count: people.filter(p => p.status === "suspended").length },
  ];
  const filtered = people.filter(p => {
    if (filter !== "all" && p.status !== filter) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.email.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <SectionHeader
        title="Представители"
        subtitle="Лица, уполномоченные действовать от имени вашей организации на бирже"
        action={<Button variant="primary" onClick={onInvite}>+ Пригласить</Button>}
      />
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
        <SearchInput value={search} onChange={setSearch} placeholder="Поиск по имени или email…" />
      </div>
      <Tabs tabs={tabs} active={filter} onChange={setFilter} />
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1fr 0.3fr", gap: 12, padding: "8px 16px", fontSize: 11, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>
          <div>ФИО</div><div>Роль</div><div>Статус</div><div>Тип контакта</div><div>Последний вход</div><div></div>
        </div>
        {filtered.map(p => (
          <div key={p.id} onClick={() => onViewPerson(p)} style={{
            display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1fr 0.3fr", gap: 12, padding: "12px 16px",
            backgroundColor: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 6,
            cursor: "pointer", transition: "all 0.1s", alignItems: "center", marginBottom: 4,
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = COLORS.borderFocus; e.currentTarget.style.backgroundColor = COLORS.surfaceHover; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = COLORS.border; e.currentTarget.style.backgroundColor = COLORS.surface; }}
          >
            <div>
              <div style={{ fontSize: 13, fontWeight: 550, color: COLORS.text }}>{p.name}</div>
              <div style={{ fontSize: 12, color: COLORS.textMuted }}>{p.email}</div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {p.roles.length === 0 ? <span style={{ fontSize: 12, color: COLORS.textMuted, fontStyle: "italic" }}>Роль не назначена</span> :
                p.roles.map(r => <Badge key={r} color={COLORS.accent} bg={COLORS.accentSoft} small>{r}</Badge>)}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <StatusBadge status={p.status} />
              <TempAccessBadge tempAccess={p.tempAccess} />
            </div>
            <div style={{ fontSize: 12, color: COLORS.textSecondary }}>{p.contactType}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontSize: 12, color: COLORS.textSecondary }}>{formatRelative(p.lastLogin)}</span>
              <RiskIndicator score={p.riskScore} />
            </div>
            <div style={{ fontSize: 12, color: COLORS.textMuted }}>→</div>
          </div>
        ))}
        {filtered.length === 0 && <EmptyState icon="👥" title="Никого не найдено" description="Попробуйте изменить параметры поиска или фильтр" />}
      </div>
    </div>
  );
};

// ─── PERSON DETAIL MODAL ─────────────────────────────────────────
const PersonDetail = ({ person, open, onClose }) => {
  if (!person) return null;
  const allResp = MOCK_ROLES.filter(r => person.roles.includes(r.name)).flatMap(r => r.responsibilities);
  const uniqueResp = [...new Set(allResp)];
  const conflicts = SOD_CONFLICTS.filter(c => uniqueResp.includes(c.resp1) && uniqueResp.includes(c.resp2));

  return (
    <Modal open={open} onClose={onClose} title={person.name} width={640}>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, marginBottom: 4 }}>Email</div>
            <div style={{ fontSize: 13, color: COLORS.text }}>{person.email}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, marginBottom: 4 }}>Статус</div>
            <StatusBadge status={person.status} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, marginBottom: 4 }}>Тип контакта</div>
            <div style={{ fontSize: 13, color: COLORS.text }}>{person.contactType}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, marginBottom: 4 }}>Последний вход</div>
            <div style={{ fontSize: 13, color: COLORS.text }}>{formatDate(person.lastLogin)}</div>
          </div>
        </div>

        {person.tempAccess && (
          <Card style={{ borderColor: person.tempAccess.daysLeft <= 1 ? "rgba(239,68,68,0.3)" : "rgba(251,191,36,0.3)" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: person.tempAccess.daysLeft <= 1 ? COLORS.danger : COLORS.warning, marginBottom: 6 }}>
              ⏱ Временный доступ
            </div>
            <div style={{ fontSize: 13, color: COLORS.textSecondary }}>
              Действует: {person.tempAccess.start} — {person.tempAccess.end} (осталось {person.tempAccess.daysLeft} {pluralize(person.tempAccess.daysLeft, "день", "дня", "дней")})
            </div>
            <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 4 }}>
              Доступ будет автоматически отозван по истечении срока. Запрос на продление можно подать до окончания.
            </div>
          </Card>
        )}

        <div>
          <div style={{ fontSize: 12, fontWeight: 650, color: COLORS.text, marginBottom: 8 }}>Назначенные роли</div>
          {person.roles.length === 0 ? (
            <div style={{ fontSize: 13, color: COLORS.textMuted, fontStyle: "italic" }}>Роли не назначены. Приглашение ожидает назначения роли и утверждения.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {person.roles.map(r => {
                const role = MOCK_ROLES.find(mr => mr.name === r);
                return (
                  <div key={r} style={{ padding: "8px 12px", backgroundColor: COLORS.surfaceRaised, borderRadius: 6, border: `1px solid ${COLORS.border}` }}>
                    <div style={{ fontSize: 13, fontWeight: 550, color: COLORS.accent }}>{ROLE_ICONS[r]} {r}</div>
                    {role && <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 2 }}>{role.description}</div>}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {conflicts.length > 0 && (
          <Card style={{ borderColor: "rgba(239,68,68,0.3)" }}>
            <div style={{ fontSize: 12, fontWeight: 650, color: COLORS.danger, marginBottom: 8 }}>⚠ Конфликты разделения обязанностей</div>
            {conflicts.map((c, i) => (
              <div key={i} style={{ fontSize: 12, color: COLORS.textSecondary, padding: "4px 0", borderTop: i > 0 ? `1px solid ${COLORS.border}` : "none" }}>
                <RiskBadge level={c.severity} /> <span style={{ marginLeft: 6 }}>{c.message}</span>
              </div>
            ))}
          </Card>
        )}

        <div>
          <div style={{ fontSize: 12, fontWeight: 650, color: COLORS.text, marginBottom: 8 }}>Действующие полномочия</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {uniqueResp.map(r => {
              const allR = Object.values(RESPONSIBILITY_GROUPS).flat();
              const resp = allR.find(rr => rr.id === r);
              return resp ? <Badge key={r} color={COLORS.textSecondary} bg={COLORS.surfaceRaised} small>{resp.label}</Badge> : null;
            })}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, paddingTop: 12, borderTop: `1px solid ${COLORS.border}` }}>
          {person.status === "active" && <Button variant="default">Изменить роль</Button>}
          {person.status === "active" && <Button variant="danger">Приостановить доступ</Button>}
          {person.status === "suspended" && <Button variant="success">Возобновить доступ</Button>}
          {person.status === "suspended" && <Button variant="danger">Отозвать доступ</Button>}
          {person.status === "invited" && <Button variant="danger">Отменить приглашение</Button>}
        </div>
        <div style={{ fontSize: 11, color: COLORS.textMuted }}>
          Любое изменение доступа требует подтверждения другим уполномоченным представителем (принцип «четырёх глаз»).
        </div>
      </div>
    </Modal>
  );
};

// ─── PAGE: INVITE WIZARD ─────────────────────────────────────────
const InviteWizard = ({ open, onClose }) => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [contactType, setContactType] = useState("операционный");
  const [isTemp, setIsTemp] = useState(false);

  const reset = () => { setStep(1); setEmail(""); setName(""); setRole(""); setContactType("операционный"); setIsTemp(false); };

  return (
    <Modal open={open} onClose={() => { reset(); onClose(); }} title="Приглашение нового представителя" width={580}>
      <div style={{ display: "flex", gap: 0, marginBottom: 24 }}>
        {["Данные", "Роль и доступ", "Проверка"].map((s, i) => (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 700,
              backgroundColor: step > i + 1 ? COLORS.success : step === i + 1 ? COLORS.accent : COLORS.surfaceRaised,
              color: step >= i + 1 ? "#fff" : COLORS.textMuted, marginBottom: 6,
            }}>{step > i + 1 ? "✓" : i + 1}</div>
            <div style={{ fontSize: 11, color: step === i + 1 ? COLORS.text : COLORS.textMuted, fontWeight: step === i + 1 ? 600 : 400 }}>{s}</div>
          </div>
        ))}
      </div>

      {step === 1 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, display: "block", marginBottom: 6 }}>ФИО полностью</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Как указано в официальных документах"
              style={{ width: "100%", padding: "10px 12px", backgroundColor: COLORS.surfaceRaised, border: `1px solid ${COLORS.border}`, borderRadius: 6, color: COLORS.text, fontSize: 13, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, display: "block", marginBottom: 6 }}>Корпоративный email</label>
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="имя@организация.ru" type="email"
              style={{ width: "100%", padding: "10px 12px", backgroundColor: COLORS.surfaceRaised, border: `1px solid ${COLORS.border}`, borderRadius: 6, color: COLORS.text, fontSize: 13, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
            <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 4 }}>На этот адрес будет отправлена ссылка-приглашение. Представитель должен подтвердить личность перед активацией.</div>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, display: "block", marginBottom: 6 }}>Тип контакта</label>
            <div style={{ display: "flex", gap: 8 }}>
              {["операционный", "технический", "комплаенс"].map(t => (
                <button key={t} onClick={() => setContactType(t)} style={{
                  flex: 1, padding: "8px 12px", borderRadius: 6, fontSize: 12, fontWeight: 550, cursor: "pointer",
                  backgroundColor: contactType === t ? COLORS.accentSoft : COLORS.surfaceRaised,
                  color: contactType === t ? COLORS.accent : COLORS.textSecondary,
                  border: `1px solid ${contactType === t ? COLORS.borderFocus : COLORS.border}`,
                  fontFamily: "inherit",
                }}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
            <Button variant="primary" disabled={!name || !email} onClick={() => setStep(2)}>Далее</Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, display: "block", marginBottom: 8 }}>Предварительная роль</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {MOCK_ROLES.map(r => (
                <div key={r.id} onClick={() => setRole(r.id)} style={{
                  padding: "10px 14px", borderRadius: 6, cursor: "pointer",
                  backgroundColor: role === r.id ? COLORS.accentSoft : COLORS.surfaceRaised,
                  border: `1px solid ${role === r.id ? COLORS.borderFocus : COLORS.border}`,
                  transition: "all 0.1s",
                }}>
                  <div style={{ fontSize: 13, fontWeight: 550, color: role === r.id ? COLORS.accent : COLORS.text }}>
                    {ROLE_ICONS[r.name]} {r.name}
                  </div>
                  <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 2 }}>{r.description}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input type="checkbox" checked={isTemp} onChange={e => setIsTemp(e.target.checked)} id="temp-check" />
            <label htmlFor="temp-check" style={{ fontSize: 13, color: COLORS.textSecondary, cursor: "pointer" }}>Предоставить временный доступ с ограниченным сроком</label>
          </div>
          {isTemp && (
            <Card style={{ borderColor: COLORS.border }}>
              <div style={{ fontSize: 12, color: COLORS.textSecondary }}>
                Временный доступ автоматически отзывается по истечении срока. Уведомление направляется за 48 часов до окончания.
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: 8, alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 4 }}>Начало</div>
                  <input type="date" style={{ padding: "6px 10px", backgroundColor: COLORS.surfaceRaised, border: `1px solid ${COLORS.border}`, borderRadius: 4, color: COLORS.text, fontSize: 12, fontFamily: "inherit" }} />
                </div>
                <span style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 14 }}>—</span>
                <div>
                  <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 4 }}>Окончание</div>
                  <input type="date" style={{ padding: "6px 10px", backgroundColor: COLORS.surfaceRaised, border: `1px solid ${COLORS.border}`, borderRadius: 4, color: COLORS.text, fontSize: 12, fontFamily: "inherit" }} />
                </div>
              </div>
            </Card>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
            <Button onClick={() => setStep(1)}>← Назад</Button>
            <Button variant="primary" disabled={!role} onClick={() => setStep(3)}>Далее</Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card style={{ borderColor: COLORS.border }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text, marginBottom: 12 }}>Сводка приглашения</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div><span style={{ fontSize: 11, color: COLORS.textMuted }}>ФИО</span><div style={{ fontSize: 13, color: COLORS.text }}>{name || "—"}</div></div>
              <div><span style={{ fontSize: 11, color: COLORS.textMuted }}>Email</span><div style={{ fontSize: 13, color: COLORS.text }}>{email || "—"}</div></div>
              <div><span style={{ fontSize: 11, color: COLORS.textMuted }}>Тип контакта</span><div style={{ fontSize: 13, color: COLORS.text }}>{contactType}</div></div>
              <div><span style={{ fontSize: 11, color: COLORS.textMuted }}>Предварительная роль</span><div style={{ fontSize: 13, color: COLORS.accent }}>{MOCK_ROLES.find(r => r.id === role)?.name || "—"}</div></div>
              {isTemp && <div style={{ gridColumn: "1/3" }}><span style={{ fontSize: 11, color: COLORS.textMuted }}>Тип доступа</span><div style={{ fontSize: 13, color: COLORS.warning }}>Временный (даты будут подтверждены)</div></div>}
            </div>
          </Card>
          <Card style={{ borderColor: "rgba(251,191,36,0.3)" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.warning, marginBottom: 4 }}>Требуется подтверждение</div>
            <div style={{ fontSize: 12, color: COLORS.textSecondary }}>
              Приглашение будет направлено на утверждение другому администратору организации. Письмо-приглашение будет отправлено только после утверждения. Представитель должен также пройти верификацию личности.
            </div>
          </Card>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
            <Button onClick={() => setStep(2)}>← Назад</Button>
            <Button variant="primary" onClick={() => { reset(); onClose(); }}>Отправить на утверждение</Button>
          </div>
        </div>
      )}
    </Modal>
  );
};

// ─── PAGE: ROLES ─────────────────────────────────────────────────
const RolesPage = () => {
  const [selectedRole, setSelectedRole] = useState(null);
  return (
    <div>
      <SectionHeader
        title="Бизнес-роли"
        subtitle="Роли определяют набор полномочий. Каждая роль описывает, какие операции на бирже может выполнять представитель."
        action={<Button variant="default">+ Создать роль</Button>}
      />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {MOCK_ROLES.map(role => (
          <Card key={role.id} hoverable onClick={() => setSelectedRole(selectedRole?.id === role.id ? null : role)}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.text }}>{ROLE_ICONS[role.name]} {role.name}</div>
                <Badge color={role.type === "predefined" ? COLORS.textMuted : COLORS.accent} bg={role.type === "predefined" ? COLORS.surfaceRaised : COLORS.accentSoft} small>
                  {role.type === "predefined" ? "Системная" : "Пользовательская"}
                </Badge>
              </div>
              <Badge color={COLORS.textSecondary} bg={COLORS.surfaceRaised}>{role.userCount} назнач.</Badge>
            </div>
            <div style={{ fontSize: 12, color: COLORS.textSecondary, marginBottom: 12, lineHeight: 1.5 }}>{role.description}</div>
            {selectedRole?.id === role.id && (
              <div style={{ borderTop: `1px solid ${COLORS.border}`, paddingTop: 12, marginTop: 4 }}>
                <div style={{ fontSize: 11, fontWeight: 650, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Входящие полномочия</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {role.responsibilities.map(rId => {
                    const allR = Object.values(RESPONSIBILITY_GROUPS).flat();
                    const resp = allR.find(r => r.id === rId);
                    return resp ? (
                      <div key={rId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0" }}>
                        <span style={{ fontSize: 12, color: COLORS.text }}>{resp.label}</span>
                        <RiskBadge level={resp.risk} />
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};

// ─── PAGE: RESPONSIBILITIES ──────────────────────────────────────
const ResponsibilitiesPage = () => (
  <div>
    <SectionHeader
      title="Полномочия"
      subtitle="Полномочия сгруппированы по направлениям деятельности. Здесь описано, что именно может делать представитель, а не технические разрешения системы."
    />
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {Object.entries(RESPONSIBILITY_GROUPS).map(([group, items]) => (
        <Card key={group}>
          <div style={{ fontSize: 14, fontWeight: 650, color: COLORS.text, marginBottom: 12 }}>{group}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {items.map(item => (
              <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${COLORS.border}` }}>
                <div>
                  <div style={{ fontSize: 13, color: COLORS.text }}>{item.label}</div>
                  <div style={{ fontSize: 11, color: COLORS.textMuted }}>Код: {item.id}</div>
                </div>
                <RiskBadge level={item.risk} />
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  </div>
);

// ─── PAGE: APPROVALS ─────────────────────────────────────────────
const ApprovalsPage = ({ approvals }) => {
  const [showApproveModal, setShowApproveModal] = useState(null);
  const typeLabels = { role_change: "Изменение роли", access_revocation: "Отзыв доступа", temp_access: "Временный доступ" };
  return (
    <div>
      <SectionHeader
        title="Запросы на утверждение"
        subtitle="Все изменения доступа требуют утверждения уполномоченным представителем. Рассмотрите ожидающие запросы."
      />
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {approvals.filter(a => a.status === "pending").map(a => (
          <Card key={a.id} style={{ borderLeftWidth: 3, borderLeftColor: COLORS.warning }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <Badge color={COLORS.warning} bg={COLORS.warningSoft} small>{typeLabels[a.type] || a.type}</Badge>
                <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.text, marginTop: 8 }}>{a.description}</div>
                <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 4 }}>
                  Касается: <strong style={{ color: COLORS.text }}>{a.subject}</strong>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, color: COLORS.textMuted }}>Срок</div>
                <div style={{ fontSize: 12, color: new Date(a.deadline) < new Date(Date.now() + 86400000) ? COLORS.danger : COLORS.textSecondary, fontWeight: 600 }}>
                  {formatDate(a.deadline)}
                </div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 12, fontSize: 12, color: COLORS.textSecondary }}>
              <div>Инициатор: <strong style={{ color: COLORS.text }}>{a.requestedBy}</strong></div>
              <div>Утверждающий: <strong style={{ color: COLORS.text }}>{a.approver}</strong></div>
              <div>Подано: {formatDate(a.requestedAt)}</div>
            </div>
            {a.comments.length > 0 && (
              <div style={{ marginTop: 12, padding: "10px 12px", backgroundColor: COLORS.surfaceRaised, borderRadius: 6 }}>
                <div style={{ fontSize: 11, color: COLORS.textMuted, fontWeight: 600, marginBottom: 6 }}>Комментарии</div>
                {a.comments.map((c, i) => (
                  <div key={i} style={{ fontSize: 12, color: COLORS.textSecondary }}>
                    <strong style={{ color: COLORS.text }}>{c.author}</strong> ({formatRelative(c.time)}): {c.text}
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <Button variant="success" onClick={() => setShowApproveModal(a)}>✓ Утвердить</Button>
              <Button variant="danger">✗ Отклонить</Button>
              <Button variant="ghost">Комментарий</Button>
            </div>
          </Card>
        ))}
        {approvals.filter(a => a.status === "pending").length === 0 && (
          <EmptyState icon="✓" title="Нет ожидающих запросов" description="Все запросы на изменение доступа обработаны." />
        )}
      </div>
      <Modal open={!!showApproveModal} onClose={() => setShowApproveModal(null)} title="Подтверждение утверждения" width={480}>
        {showApproveModal && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Card style={{ borderColor: COLORS.border }}>
              <div style={{ fontSize: 13, color: COLORS.textSecondary }}>
                Вы утверждаете: <strong style={{ color: COLORS.text }}>{showApproveModal.description}</strong>
              </div>
              <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 4 }}>
                Изменение вступит в силу сразу после подтверждения.
              </div>
            </Card>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, display: "block", marginBottom: 6 }}>Комментарий (необязательно)</label>
              <textarea rows={3} placeholder="Добавьте пояснение для журнала аудита…" style={{
                width: "100%", padding: 10, backgroundColor: COLORS.surfaceRaised, border: `1px solid ${COLORS.border}`,
                borderRadius: 6, color: COLORS.text, fontSize: 13, fontFamily: "inherit", resize: "vertical", outline: "none", boxSizing: "border-box",
              }} />
            </div>
            <Card style={{ borderColor: "rgba(251,191,36,0.3)" }}>
              <div style={{ fontSize: 12, color: COLORS.warning }}>
                Утверждая этот запрос, вы подтверждаете, что ознакомились с изменением и принимаете ответственность в рамках процедур внутреннего контроля организации. Действие будет зафиксировано в журнале аудита.
              </div>
            </Card>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <Button onClick={() => setShowApproveModal(null)}>Отмена</Button>
              <Button variant="success" onClick={() => setShowApproveModal(null)}>Подтвердить</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

// ─── PAGE: AUDIT LOG ─────────────────────────────────────────────
const AuditLogPage = () => {
  const [search, setSearch] = useState("");
  return (
    <div>
      <SectionHeader
        title="Журнал изменений"
        subtitle="Полная история всех изменений доступа и полномочий. Записи неизменяемы и доступны для экспорта."
        action={<Button variant="default">↓ Экспорт (CSV)</Button>}
      />
      <div style={{ marginBottom: 16 }}>
        <SearchInput value={search} onChange={setSearch} placeholder="Поиск по имени, действию или описанию…" />
      </div>
      <Card>
        <div style={{ display: "grid", gridTemplateColumns: "150px 120px 1fr 1.5fr 100px 110px", gap: 8, padding: "8px 0", fontSize: 11, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, borderBottom: `1px solid ${COLORS.border}` }}>
          <div>Дата и время</div><div>Кто изменил</div><div>Действие</div><div>Подробности</div><div>Было</div><div>Стало</div>
        </div>
        {MOCK_AUDIT_LOG.filter(e => {
          if (!search) return true;
          const s = search.toLowerCase();
          return e.actor.toLowerCase().includes(s) || e.target.toLowerCase().includes(s) || e.action.toLowerCase().includes(s) || e.details.toLowerCase().includes(s);
        }).map(entry => (
          <div key={entry.id} style={{ display: "grid", gridTemplateColumns: "150px 120px 1fr 1.5fr 100px 110px", gap: 8, padding: "10px 0", fontSize: 12, borderBottom: `1px solid ${COLORS.border}`, alignItems: "flex-start" }}>
            <div style={{ color: COLORS.textMuted, fontSize: 11 }}>{formatDate(entry.timestamp)}</div>
            <div style={{ color: COLORS.text, fontWeight: 550 }}>{entry.actor}</div>
            <div style={{ color: COLORS.textSecondary }}>{entry.action} → <strong style={{ color: COLORS.text }}>{entry.target}</strong></div>
            <div style={{ color: COLORS.textSecondary, fontSize: 11, lineHeight: 1.5 }}>{entry.details}</div>
            <div style={{ color: entry.before ? COLORS.danger : COLORS.textMuted, fontSize: 11 }}>{entry.before || "—"}</div>
            <div style={{ color: entry.after ? COLORS.success : COLORS.textMuted, fontSize: 11 }}>{entry.after || "—"}</div>
          </div>
        ))}
      </Card>
    </div>
  );
};

// ─── PAGE: SOD ENGINE ────────────────────────────────────────────
const SoDPage = ({ people }) => {
  const conflicts = [];
  people.filter(p => p.status === "active").forEach(p => {
    const allResp = MOCK_ROLES.filter(r => p.roles.includes(r.name)).flatMap(r => r.responsibilities);
    const unique = [...new Set(allResp)];
    SOD_CONFLICTS.forEach(c => {
      if (unique.includes(c.resp1) && unique.includes(c.resp2)) {
        conflicts.push({ person: p, conflict: c });
      }
    });
  });

  return (
    <div>
      <SectionHeader
        title="Разделение обязанностей"
        subtitle="Система непрерывно проверяет назначения ролей на наличие опасных совмещений полномочий, которые могут нарушить внутренний контроль."
      />
      <Card style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 650, color: COLORS.text, marginBottom: 12 }}>Правила контроля</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {SOD_CONFLICTS.map((c, i) => {
            const allR = Object.values(RESPONSIBILITY_GROUPS).flat();
            const r1 = allR.find(r => r.id === c.resp1);
            const r2 = allR.find(r => r.id === c.resp2);
            return (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", backgroundColor: COLORS.surfaceRaised, borderRadius: 4 }}>
                <div style={{ fontSize: 12, color: COLORS.textSecondary }}>
                  <span style={{ color: COLORS.text }}>{r1?.label}</span> ✕ <span style={{ color: COLORS.text }}>{r2?.label}</span>
                </div>
                <RiskBadge level={c.severity} />
              </div>
            );
          })}
        </div>
      </Card>

      <div style={{ fontSize: 14, fontWeight: 650, color: COLORS.text, marginBottom: 12 }}>
        Обнаруженные конфликты ({conflicts.length})
      </div>
      {conflicts.length === 0 ? (
        <Card><EmptyState icon="✓" title="Конфликтов нет" description="Ни у одного представителя не обнаружено совмещения несовместимых полномочий." /></Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {conflicts.map((c, i) => (
            <Card key={i} style={{ borderLeftWidth: 3, borderLeftColor: c.conflict.severity === "critical" ? COLORS.danger : COLORS.warning }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.text }}>{c.person.name}</div>
                  <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 4 }}>
                    Роли: {c.person.roles.join(", ")}
                  </div>
                </div>
                <RiskBadge level={c.conflict.severity} />
              </div>
              <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 8, padding: "8px 12px", backgroundColor: c.conflict.severity === "critical" ? COLORS.dangerSoft : COLORS.warningSoft, borderRadius: 4 }}>
                ⚠ {c.conflict.message}
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <Button variant="default" size="sm">Запросить изменение роли</Button>
                <Button variant="ghost" size="sm">Принять риск</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── PAGE: TEMP ACCESS ───────────────────────────────────────────
const TempAccessPage = ({ people }) => {
  const temp = people.filter(p => p.tempAccess);
  return (
    <div>
      <SectionHeader
        title="Временный доступ"
        subtitle="Доступ с ограниченным сроком для внешних специалистов или особых задач. По истечении срока доступ отзывается автоматически."
      />
      {temp.length === 0 ? (
        <Card><EmptyState icon="⏱" title="Нет временных доступов" description="Весь текущий доступ — постоянный. Используйте форму приглашения для предоставления временного доступа." /></Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {temp.map(p => {
            const urgent = p.tempAccess.daysLeft <= 1;
            return (
              <Card key={p.id} style={{ borderLeftWidth: 3, borderLeftColor: urgent ? COLORS.danger : COLORS.warning }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.text }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: COLORS.textSecondary }}>{p.email}</div>
                    <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
                      {p.roles.map(r => <Badge key={r} color={COLORS.accent} bg={COLORS.accentSoft} small>{r}</Badge>)}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: urgent ? COLORS.danger : COLORS.warning }}>{p.tempAccess.daysLeft}</div>
                    <div style={{ fontSize: 11, color: COLORS.textMuted }}>{pluralize(p.tempAccess.daysLeft, "день", "дня", "дней")} осталось</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 12, marginTop: 12, fontSize: 12, color: COLORS.textSecondary }}>
                  <div>Начало: <strong style={{ color: COLORS.text }}>{p.tempAccess.start}</strong></div>
                  <div>Окончание: <strong style={{ color: COLORS.text }}>{p.tempAccess.end}</strong></div>
                </div>
                {urgent && (
                  <div style={{ marginTop: 12, padding: "8px 12px", backgroundColor: COLORS.dangerSoft, borderRadius: 4, fontSize: 12, color: COLORS.danger }}>
                    ⚠ Доступ истекает в течение 24 часов. Если доступ необходимо продлить, подайте запрос до окончания срока.
                  </div>
                )}
                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <Button variant="default" size="sm">Запросить продление</Button>
                  <Button variant="danger" size="sm">Отозвать немедленно</Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── NAVIGATION ──────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: "dashboard", label: "Обзор", icon: "◇" },
  { id: "people", label: "Представители", icon: "◉" },
  { id: "roles", label: "Бизнес-роли", icon: "◆" },
  { id: "responsibilities", label: "Полномочия", icon: "▣" },
  { id: "approvals", label: "Утверждения", icon: "◈", badge: 3 },
  { id: "sod", label: "Разделение обяз.", icon: "⚠" },
  { id: "temp-access", label: "Временный доступ", icon: "⏱" },
  { id: "audit", label: "Журнал изменений", icon: "▤" },
];

// ─── MAIN APP ────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("dashboard");
  const [showInvite, setShowInvite] = useState(false);
  const [viewPerson, setViewPerson] = useState(null);

  return (
    <div style={{
      display: "flex", minHeight: "100vh", backgroundColor: COLORS.bg, color: COLORS.text,
      fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: ${COLORS.bg}; }
        ::-webkit-scrollbar-thumb { background: ${COLORS.border}; border-radius: 3px; }
        ::selection { background: ${COLORS.accentGlow}; }
        input::placeholder, textarea::placeholder { color: ${COLORS.textMuted}; }
      `}</style>

      <aside style={{
        width: 248, borderRight: `1px solid ${COLORS.border}`, padding: "20px 12px",
        display: "flex", flexDirection: "column", backgroundColor: COLORS.surface, flexShrink: 0,
      }}>
        <div style={{ padding: "0 8px", marginBottom: 24 }}>
          <div style={{ fontSize: 11, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, marginBottom: 4 }}>Кабинет участника</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.text }}>Доступ и полномочия</div>
          <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>ООО «Брокер Альфа»</div>
        </div>
        <nav style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              style={{
                display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 6,
                fontSize: 13, fontWeight: page === item.id ? 600 : 450, cursor: "pointer",
                color: page === item.id ? COLORS.accent : COLORS.textSecondary,
                backgroundColor: page === item.id ? COLORS.accentSoft : "transparent",
                border: "none", fontFamily: "inherit", textAlign: "left", width: "100%",
                transition: "all 0.1s",
              }}
            >
              <span style={{ fontSize: 12, width: 18, textAlign: "center" }}>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge > 0 && (
                <span style={{
                  fontSize: 10, fontWeight: 700, color: "#fff", backgroundColor: COLORS.danger,
                  borderRadius: 10, padding: "1px 6px", minWidth: 18, textAlign: "center",
                }}>{item.badge}</span>
              )}
            </button>
          ))}
        </nav>
        <div style={{ padding: "12px 8px", borderTop: `1px solid ${COLORS.border}`, marginTop: 8 }}>
          <div style={{ fontSize: 11, color: COLORS.textMuted }}>Вы вошли как</div>
          <div style={{ fontSize: 13, fontWeight: 550, color: COLORS.text }}>Волков Алексей Иванович</div>
          <div style={{ fontSize: 11, color: COLORS.accent }}>Администратор организации</div>
        </div>
      </aside>

      <main style={{ flex: 1, padding: 32, overflow: "auto", maxHeight: "100vh" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 20, display: "flex", gap: 6 }}>
            <span style={{ cursor: "pointer" }} onClick={() => setPage("dashboard")}>Доступ и полномочия</span>
            <span>›</span>
            <span style={{ color: COLORS.textSecondary }}>{NAV_ITEMS.find(n => n.id === page)?.label}</span>
          </div>

          {page === "dashboard" && <Dashboard setPage={setPage} people={MOCK_PEOPLE} approvals={MOCK_APPROVALS} />}
          {page === "people" && <PeoplePage people={MOCK_PEOPLE} setPage={setPage} onInvite={() => setShowInvite(true)} onViewPerson={p => setViewPerson(p)} />}
          {page === "roles" && <RolesPage />}
          {page === "responsibilities" && <ResponsibilitiesPage />}
          {page === "approvals" && <ApprovalsPage approvals={MOCK_APPROVALS} />}
          {page === "audit" && <AuditLogPage />}
          {page === "sod" && <SoDPage people={MOCK_PEOPLE} />}
          {page === "temp-access" && <TempAccessPage people={MOCK_PEOPLE} />}
        </div>
      </main>

      <InviteWizard open={showInvite} onClose={() => setShowInvite(false)} />
      <PersonDetail person={viewPerson} open={!!viewPerson} onClose={() => setViewPerson(null)} />
    </div>
  );
}
