/* ================================================================
   PCM BR AÇO - Utility Functions
   ================================================================ */

const Utils = (() => {

  // ---- ID Generation ----
  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }

  function generateSeqId(prefix, existing) {
    const nums = existing.map(e => parseInt((e.id || '').replace(/\D/g,''))).filter(n => !isNaN(n));
    const next = nums.length ? Math.max(...nums) + 1 : 1;
    return prefix + String(next).padStart(4, '0');
  }

  // ---- Date Utilities ----
  function today() {
    return new Date().toISOString().split('T')[0];
  }

  function nowISO() {
    return new Date().toISOString();
  }

  function nowTime() {
    const n = new Date();
    return n.getHours().toString().padStart(2,'0') + ':' + n.getMinutes().toString().padStart(2,'0');
  }

  function isValidDate(dateStr) {
    if (!dateStr) return false;
    if (dateStr.startsWith('0000') || dateStr === 'undefined' || dateStr === 'null') return false;
    const d = new Date(dateStr + (dateStr.length === 10 ? 'T00:00:00' : ''));
    return !isNaN(d.getTime());
  }

  function formatDate(dateStr) {
    if (!isValidDate(dateStr)) return '—';
    const d = new Date(dateStr + (dateStr.length === 10 ? 'T00:00:00' : ''));
    return d.toLocaleDateString('pt-BR');
  }

  function formatDateTime(isoStr) {
    if (!isValidDate(isoStr)) return '—';
    const d = new Date(isoStr);
    return d.toLocaleDateString('pt-BR') + ' ' + d.getHours().toString().padStart(2,'0') + ':' + d.getMinutes().toString().padStart(2,'0');
  }

  function formatDateShort(dateStr) {
    if (!isValidDate(dateStr)) return '';
    const d = new Date(dateStr + 'T00:00:00');
    const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    return d.getDate() + ' ' + months[d.getMonth()];
  }

  function getDayOfWeek(dateStr) {
    const days = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
    return days[new Date(dateStr + 'T00:00:00').getDay()];
  }

  function isToday(dateStr) {
    return dateStr === today();
  }

  function isOverdue(dateStr, status) {
    if (!isValidDate(dateStr) || ['concluida','cancelada'].includes(status)) return false;
    return dateStr < today();
  }

  function isThisWeek(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    const t = new Date();
    const startOfWeek = new Date(t);
    startOfWeek.setDate(t.getDate() - t.getDay());
    startOfWeek.setHours(0,0,0,0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23,59,59,999);
    return d >= startOfWeek && d <= endOfWeek;
  }

  function isThisMonth(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    const t = new Date();
    return d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear();
  }

  function daysUntil(dateStr) {
    if (!isValidDate(dateStr)) return null;
    const d = new Date(dateStr + 'T00:00:00');
    const t = new Date();
    t.setHours(0,0,0,0);
    return Math.round((d - t) / (1000 * 60 * 60 * 24));
  }

  function calcDuration(start, end) {
    if (!start || !end) return null;
    const s = new Date(start);
    const e = new Date(end);
    const diff = e - s;
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    return { hours, minutes, text: hours + 'h ' + minutes + 'min', totalMin: hours * 60 + minutes };
  }

  function calcDurationFromTimes(startISO, endTime) {
    if (!startISO || !endTime) return null;
    const startDate = new Date(startISO);
    const [eh, em] = endTime.split(':').map(Number);
    const endDate = new Date(startDate);
    endDate.setHours(eh, em, 0, 0);
    if (endDate < startDate) endDate.setDate(endDate.getDate() + 1);
    return calcDuration(startDate, endDate);
  }

  function getMonthName(monthIndex) {
    const months = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    return months[monthIndex];
  }

  function addDays(dateStr, days) {
    const d = new Date(dateStr + 'T00:00:00');
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  }

  function addMonths(dateStr, months) {
    const d = new Date(dateStr + 'T00:00:00');
    d.setMonth(d.getMonth() + months);
    return d.toISOString().split('T')[0];
  }

  function nextRecorrencia(dateStr, recorrencia) {
    switch(recorrencia) {
      case 'diaria': return addDays(dateStr, 1);
      case 'semanal': return addDays(dateStr, 7);
      case 'quinzenal': return addDays(dateStr, 15);
      case 'mensal': return addMonths(dateStr, 1);
      case 'bimestral': return addMonths(dateStr, 2);
      case 'trimestral': return addMonths(dateStr, 3);
      case 'semestral': return addMonths(dateStr, 6);
      case 'anual': return addMonths(dateStr, 12);
      default: return null;
    }
  }

  // ---- Priority Helpers ----
  const PRIORITY_ORDER = { critica: 0, alta: 1, media: 2, baixa: 3 };
  const PRIORITY_LABELS = { critica: 'Crítica', alta: 'Alta', media: 'Média', baixa: 'Baixa' };
  const PRIORITY_COLORS = { critica: '#E74C3C', alta: '#F39C12', media: '#27AE60', baixa: '#95A5A6' };

  function priorityLabel(p) { return PRIORITY_LABELS[p] || p; }
  function priorityColor(p) { return PRIORITY_COLORS[p] || '#ccc'; }

  function prioridade_dot(p) {
    const colors = { critica: '🔴', alta: '🟡', media: '🟢', baixa: '⚪' };
    return colors[p] || '⚪';
  }

  // ---- Status Helpers ----
  const STATUS_LABELS = { pendente: 'Pendente', andamento: 'Em Andamento', pausada: 'Pausada', concluida: 'Concluída', cancelada: 'Cancelada' };
  const STATUS_ICONS = { pendente: 'fa-clock', andamento: 'fa-play-circle', pausada: 'fa-pause-circle', concluida: 'fa-check-circle', cancelada: 'fa-times-circle' };

  function statusLabel(s) { return STATUS_LABELS[s] || s; }
  function statusIcon(s) { return STATUS_ICONS[s] || 'fa-circle'; }

  function statusBadge(status) {
    const icons = { pendente:'⏳', andamento:'▶️', pausada:'⏸️', concluida:'✅', cancelada:'❌' };
    return `<span class="badge badge-${status}">${icons[status]||''} ${STATUS_LABELS[status]||status}</span>`;
  }

  // ---- Tipo Helpers ----
  function tipoBadge(tipo) {
    if (tipo === 'preventiva') return '<span class="badge" style="background:rgba(39,174,96,0.12);color:#1E8449"><i class="fa-solid fa-shield-check"></i> Preventiva</span>';
    return '<span class="badge" style="background:rgba(231,76,60,0.12);color:#C0392B"><i class="fa-solid fa-triangle-exclamation"></i> Corretiva</span>';
  }

  // ---- DOM Utilities ----
  function qs(sel, ctx) { return (ctx || document).querySelector(sel); }
  function qsa(sel, ctx) { return Array.from((ctx || document).querySelectorAll(sel)); }

  function el(tag, props, ...children) {
    const e = document.createElement(tag);
    if (props) Object.entries(props).forEach(([k,v]) => {
      if (k === 'class') e.className = v;
      else if (k === 'html') e.innerHTML = v;
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
      else e.setAttribute(k, v);
    });
    children.flat().forEach(c => {
      if (typeof c === 'string') e.appendChild(document.createTextNode(c));
      else if (c) e.appendChild(c);
    });
    return e;
  }

  function setHTML(selector, html) {
    const el = document.querySelector(selector);
    if (el) el.innerHTML = html;
  }

  function val(id) {
    const e = document.getElementById(id);
    return e ? e.value.trim() : '';
  }

  function setVal(id, v) {
    const e = document.getElementById(id);
    if (e) e.value = v !== undefined ? v : '';
  }

  // ---- String Utilities ----
  function escapeHTML(str) {
    return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function truncate(str, n) {
    return str && str.length > n ? str.slice(0, n) + '...' : (str || '');
  }

  function initials(name) {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length === 1) return parts[0].slice(0,2).toUpperCase();
    return (parts[0][0] + parts[parts.length-1][0]).toUpperCase();
  }

  function normalize(str) {
    return (str || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  function matchSearch(text, query) {
    return normalize(text).includes(normalize(query));
  }

  function formatCurrency(n) {
    return 'R$ ' + Number(n || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function formatNumber(n) {
    return Number(n || 0).toLocaleString('pt-BR');
  }

  // ---- Toast Notifications ----
  function toast(msg, type = 'info', duration = 4000) {
    const icons = { success: 'fa-check-circle', error: 'fa-circle-xmark', warning: 'fa-triangle-exclamation', info: 'fa-circle-info' };
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerHTML = `
      <i class="fa-solid ${icons[type] || icons.info} toast-icon"></i>
      <span class="toast-msg">${escapeHTML(msg)}</span>
      <button class="toast-close" onclick="this.closest('.toast').remove()"><i class="fa-solid fa-xmark"></i></button>
    `;
    container.appendChild(t);

    if (duration > 0) {
      setTimeout(() => {
        t.classList.add('removing');
        setTimeout(() => t.remove(), 350);
      }, duration);
    }
  }

  // ---- Debounce ----
  function debounce(fn, delay) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  }

  // ---- Download ----
  function downloadFile(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function downloadJSON(filename, data) {
    downloadFile(filename, JSON.stringify(data, null, 2), 'application/json');
  }

  function downloadCSV(filename, rows) {
    const csv = rows.map(r => r.map(c => `"${String(c||'').replace(/"/g,'""')}"`).join(',')).join('\n');
    downloadFile(filename, '\uFEFF' + csv, 'text/csv;charset=utf-8');
  }

  // ---- Local Storage wrapper with error handling ----
  function lsGet(key, fallback = null) {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : fallback;
    } catch(e) { return fallback; }
  }

  function lsSet(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch(e) {
      toast('Erro ao salvar dados. Verifique o espaço em disco.', 'error');
      return false;
    }
  }

  // ---- Number Formatting ----
  function pct(a, b) {
    if (!b) return 0;
    return Math.round((a / b) * 100);
  }

  // ---- Color Scale ----
  function colorByPct(p) {
    if (p >= 80) return 'var(--success)';
    if (p >= 50) return 'var(--warning)';
    return 'var(--danger)';
  }

  function stockStatus(atual, minimo) {
    if (atual <= 0) return { label: 'ZERADO', cls: 'critico', pct: 0 };
    const p = Math.min(100, Math.round((atual / (minimo * 1.5)) * 100));
    if (atual < minimo) return { label: '🚨 CRÍTICO', cls: 'critico', pct: p };
    if (atual < minimo * 1.2) return { label: '⚠️ ATENÇÃO', cls: 'atencao', pct: p };
    return { label: '✅ OK', cls: 'ok', pct: Math.min(100, p) };
  }

  return {
    generateId, generateSeqId,
    today, nowISO, nowTime,
    formatDate, formatDateTime, formatDateShort, getDayOfWeek,
    isToday, isOverdue, isThisWeek, isThisMonth, daysUntil,
    calcDuration, calcDurationFromTimes,
    getMonthName, addDays, addMonths, nextRecorrencia,
    PRIORITY_ORDER, PRIORITY_LABELS, PRIORITY_COLORS,
    priorityLabel, priorityColor, prioridade_dot,
    STATUS_LABELS, STATUS_ICONS,
    statusLabel, statusIcon, statusBadge, tipoBadge,
    qs, qsa, el, setHTML, val, setVal,
    escapeHTML, truncate, initials, normalize, matchSearch,
    formatCurrency, formatNumber, pct,
    toast, debounce,
    downloadFile, downloadJSON, downloadCSV,
    lsGet, lsSet,
    colorByPct, stockStatus
  };
})();
