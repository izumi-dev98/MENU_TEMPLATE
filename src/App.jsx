import { useEffect, useMemo, useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import './App.css'

const STORAGE_KEY = 'ipd_weekly_meals_v2'
const STAFF_KEY = 'ipd_staff_menu_v1'
const THEME_KEY = 'ipd_table_theme'
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const THEMES = [
  { id: 'classic', name: 'Classic Gold', paper: '#fffdf6', accent: '#b8941f', head: '#f3e9d2' },
  { id: 'dark', name: 'Dark Elegant', paper: '#262019', accent: '#d4af37', head: '#3a2f23' },
  { id: 'green', name: 'Fresh Green', paper: '#f6fdf8', accent: '#1f7a4d', head: '#dff0e3' },
  { id: 'blue', name: 'Ocean Blue', paper: '#f5faff', accent: '#1f5fa8', head: '#dfeafb' },
  { id: 'red', name: 'Lacquer Red', paper: '#fff7f4', accent: '#a32e2e', head: '#f6ddd2' },
  { id: 'purple', name: 'Royal Purple', paper: '#f7f3ff', accent: '#6d28d9', head: '#e6dcfb' },
  { id: 'teal', name: 'Teal Fresh', paper: '#f2fbfb', accent: '#0f766e', head: '#d7f0ed' },
  { id: 'orange', name: 'Sunset Orange', paper: '#fff8f1', accent: '#c2571a', head: '#fbe3cd' },
  { id: 'pink', name: 'Sakura Pink', paper: '#fff5f8', accent: '#c2185b', head: '#fbdcea' },
  { id: 'navy', name: 'Steel Navy', paper: '#eef2f7', accent: '#0f2a4a', head: '#d7e1ef' },
  { id: 'coffee', name: 'Coffee Brown', paper: '#f7f1ea', accent: '#5d3a1a', head: '#e7d6c0' },
]

const LAYOUTS = [
  { id: 'table', name: 'Classic Table', icon: '▦' },
  { id: 'cards', name: 'Card View', icon: '❏' },
  { id: 'minimal', name: 'Minimal List', icon: '☰' },
  { id: 'compact', name: 'Compact', icon: '≡' },
  { id: 'pills', name: 'Pill Rows', icon: '◉' },
  { id: 'magazine', name: 'Magazine', icon: '📰' },
]
const LAYOUT_KEY = 'ipd_table_layout'
const TITLE_KEY = 'ipd_menu_title'
const STAFF_TITLE_KEY = 'staff_menu_title'

const SAMPLE_MEALS = [
  { id: 'mon', day: 'Monday', breakfast: 'MTW (ကျန်းမာရေးအစားအစာ)', lunch: 'ထမင်း + ဟင်းသီးဟင်းရွက် + အသား', dinner: 'ကြက်သားဟင်း + ဟင်းချို' },
  { id: 'tue', day: 'Tuesday', breakfast: 'ပေါင်မုန့် + ကြက်ဥ + ကော်ဖီ', lunch: 'ထမင်း + ငါးဟင်း + ဟင်းသီးဟင်းရွက်', dinner: 'ပဲဟင်း + အသီးအရွက်' },
  { id: 'wed', day: 'Wednesday', breakfast: 'မုန့်ဟင်းခါး + လက်ဖက်ရည်', lunch: 'ထမင်း + ကြက်သား + ဟင်းချို', dinner: 'ငါးကြော် + အရွက်စုံ' },
  { id: 'thu', day: 'Thursday', breakfast: 'MTW (Breakfast)', lunch: 'ထမင်း + ပဲကုလားဟင်း + အသီးအရွက်', dinner: 'ကြက်သားဆီပြန် + ဟင်းချို' },
  { id: 'fri', day: 'Friday', breakfast: 'အာလူးပေါင်မုန့် + ကြက်ဥ + လက်ဖက်ရည်', lunch: 'ကြက်သားဟင်း + ထမင်း + အသီးအရွက်', dinner: 'ငါးဟင်း + ဟင်းချို' },
  { id: 'sat', day: 'Saturday', breakfast: 'မုန့်ဖက်ထုပ် + ကော်ဖီ', lunch: 'ထမင်း + အသားဟင်း + အသီးအရွက်', dinner: 'ကြက်သားဟင်း + ဟင်းသီးဟင်းရွက်' },
]

const SAMPLE_STAFF = [
  { id: 'st1', day: 'Monday', dish: 'မုန့်ဟင်းခါး + လက်ဖက်ရည်', price: 2500 },
  { id: 'st2', day: 'Monday', dish: 'ထမင်း + ကြက်သား + ဟင်းချို', price: 3500 },
  { id: 'st3', day: 'Monday', dish: 'ငါးဟင်း + ဟင်းချို', price: 3000 },
  { id: 'st4', day: 'Tuesday', dish: 'ပေါင်မုန့် + ကြက်ဥ + ကော်ဖီ', price: 2000 },
]

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

function normalizeMeal(obj) {
  const pick = (...keys) => {
    for (const k of keys) {
      const v = obj[k]
      if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim()
    }
    return ''
  }
  const dayRaw = pick('day', 'Day', 'DAY', '0')
  if (!dayRaw) return null
  const day = DAYS.find((d) => d.toLowerCase() === dayRaw.toLowerCase())
    ?? (dayRaw.charAt(0).toUpperCase() + dayRaw.slice(1))
  return {
    id: uid() + Math.floor(Math.random() * 1e6),
    day,
    breakfast: pick('breakfast', 'Breakfast', 'BREAKFAST', '1'),
    lunch: pick('lunch', 'Lunch', 'LUNCH', '2', '3'),
    dinner: pick('dinner', 'Dinner', 'DINNER', '3', '5'),
  }
}

function loadStored(key) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return null
    return parsed.filter(Boolean)
  } catch { return null }
}

const dayOrder = (d) => {
  const i = DAYS.findIndex((x) => x.toLowerCase() === String(d).toLowerCase())
  return i === -1 ? 99 : i
}

const EMPTY_FORM = { day: 'Monday', title: '', breakfast: '', lunch: '', dinner: '' }
const EMPTY_STAFF = { day: 'Monday', title: '', dish: '', price: '' }

const mmk = (v) => `${Number(v || 0).toLocaleString('en-US')} MMK`

export default function App() {
  const [view, setView] = useState('ipd') // 'ipd' | 'staff'
  const [meals, setMeals] = useState(() => loadStored(STORAGE_KEY) ?? SAMPLE_MEALS)
  const [staff, setStaff] = useState(() => loadStored(STAFF_KEY) ?? SAMPLE_STAFF)
  const [alert, setAlert] = useState(null)
  const [confirmClear, setConfirmClear] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [staffForm, setStaffForm] = useState(EMPTY_STAFF)
  const [editingStaffId, setEditingStaffId] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [showStaffModal, setShowStaffModal] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem(THEME_KEY) || 'classic' } catch { return 'classic' }
  })
  const [layout, setLayout] = useState(() => {
    try { return localStorage.getItem(LAYOUT_KEY) || 'table' } catch { return 'table' }
  })
  const [menuTitle, setMenuTitle] = useState(() => {
    try { return localStorage.getItem(TITLE_KEY) || 'IPD Meal Plan' } catch { return 'IPD Meal Plan' }
  })
  const [staffTitle, setStaffTitle] = useState(() => {
    try { return localStorage.getItem(STAFF_TITLE_KEY) || 'Staff Menu Plan' } catch { return 'Staff Menu Plan' }
  })
  const menuRef = useRef(null)

  useEffect(() => {
    if (!showModal && !showStaffModal && !alert && !confirmClear && !showTemplates) return
    const onKey = (e) => {
      if (e.key === 'Escape') { setShowModal(false); setShowStaffModal(false); setAlert(null); setConfirmClear(false); setShowTemplates(false) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showModal, showStaffModal, alert, confirmClear, showTemplates])

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(meals)) } catch { /* ignore */ }
  }, [meals])
  useEffect(() => {
    try { localStorage.setItem(STAFF_KEY, JSON.stringify(staff)) } catch { /* ignore */ }
  }, [staff])

  const sorted = useMemo(() => [...meals].sort((a, b) => dayOrder(a.day) - dayOrder(b.day)), [meals])
  const sortedStaff = useMemo(
    () => [...staff].sort((a, b) => dayOrder(a.day) - dayOrder(b.day)),
    [staff]
  )

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  const setS = (k) => (e) => setStaffForm({ ...staffForm, [k]: e.target.value })

  /* ── IPD form ── */
  function submitForm(e) {
    e.preventDefault()
    if (!form.day.trim()) { setAlert('Pick a day.'); return }
    if (!form.breakfast.trim() && !form.lunch.trim() && !form.dinner.trim()) {
      setAlert('Fill at least one meal (breakfast / lunch / dinner).')
      return
    }
    if (form.title.trim()) {
      setMenuTitle(form.title.trim())
      try { localStorage.setItem(TITLE_KEY, form.title.trim()) } catch { /* ignore */ }
    }
    if (editingId) {
      setMeals((prev) => prev.map((m) => (m.id === editingId ? { ...normalizeMeal({ ...form }), id: editingId } : m)))
      setAlert(`${form.day} updated — saved.`)
      setEditingId(null)
    } else {
      const dupe = meals.some((m) => m.day.toLowerCase() === form.day.trim().toLowerCase())
      if (dupe) { setAlert(`${form.day} already exists — use Edit to change it.`); return }
      setMeals((prev) => [...prev, { ...normalizeMeal({ ...form }), id: uid() }])
      setAlert(`${form.day} added — saved.`)
    }
    setForm(EMPTY_FORM)
    setShowModal(false)
  }

  function openAdd() { setEditingId(null); setForm(EMPTY_FORM); setShowModal(true) }
  function editMeal(m) {
    setEditingId(m.id)
    setForm({ day: m.day, title: menuTitle, breakfast: m.breakfast || '', lunch: m.lunch || '', dinner: m.dinner || '' })
    setShowModal(true)
  }
  function cancelEdit() { setEditingId(null); setForm(EMPTY_FORM); setShowModal(false) }
  function removeMeal(id) { setMeals((prev) => prev.filter((m) => m.id !== id)); setAlert('Day removed.') }

  /* ── Staff form ── */
  function submitStaff(e) {
    e.preventDefault()
    if (!staffForm.dish.trim()) { setAlert('Enter a dish name.'); return }
    if (staffForm.title.trim()) {
      setStaffTitle(staffForm.title.trim())
      try { localStorage.setItem(STAFF_TITLE_KEY, staffForm.title.trim()) } catch { /* ignore */ }
    }
    const row = { day: staffForm.day, dish: staffForm.dish.trim(), price: Number(String(staffForm.price).replace(/[^0-9.]/g, '')) || 0 }
    if (editingStaffId) {
      setStaff((prev) => prev.map((r) => (r.id === editingStaffId ? { ...row, id: editingStaffId } : r)))
      setAlert('Staff meal updated — saved.')
      setEditingStaffId(null)
    } else {
      setStaff((prev) => [...prev, { ...row, id: uid() }])
      setAlert('Staff meal added — saved.')
    }
    setStaffForm(EMPTY_STAFF)
    setShowStaffModal(false)
  }

  function openAddStaff() { setEditingStaffId(null); setStaffForm(EMPTY_STAFF); setShowStaffModal(true) }
  function editStaff(r) {
    setEditingStaffId(r.id)
    setStaffForm({ day: r.day, title: staffTitle, dish: r.dish || '', price: String(r.price ?? '') })
    setShowStaffModal(true)
  }
  function removeStaff(id) { setStaff((prev) => prev.filter((r) => r.id !== id)); setAlert('Staff meal removed.') }

  async function downloadImage() {
    if (!menuRef.current) return
    setIsExporting(true)
    await new Promise((r) => setTimeout(r, 150))
    try {
      const dataUrl = await toPng(menuRef.current, { cacheBust: true, pixelRatio: 3, backgroundColor: '#fffdf6' })
      const a = document.createElement('a')
      a.download = `${view === 'staff' ? 'staff-menu-plan' : 'ipd-meal-plan'}-${new Date().toISOString().slice(0, 10)}.png`
      a.href = dataUrl
      a.click()
      setAlert('Menu image downloaded (PNG).')
    } catch (err) { setAlert(`Image export failed: ${err.message}`) }
    finally { setIsExporting(false) }
  }

  function applyTheme(id) {
    setTheme(id)
    try { localStorage.setItem(THEME_KEY, id) } catch { /* ignore */ }
    setShowTemplates(false)
    const t = THEMES.find((x) => x.id === id)
    setAlert(`Template applied: ${t ? t.name : id}.`)
  }

  function applyLayout(id) {
    setLayout(id)
    try { localStorage.setItem(LAYOUT_KEY, id) } catch { /* ignore */ }
    setShowTemplates(false)
    const l = LAYOUTS.find((x) => x.id === id)
    setAlert(`Layout applied: ${l ? l.name : id}.`)
  }

  function doClear() {    if (view === 'staff') setStaff([])
    else { setMeals([]); setEditingId(null); setForm(EMPTY_FORM) }
    setConfirmClear(false)
    setAlert('Cleared. Local storage is now empty.')
  }

  function resetSample() {
    if (view === 'staff') setStaff(SAMPLE_STAFF)
    else setMeals(SAMPLE_MEALS)
    setAlert('Sample plan restored.')
  }

  return (
    <div className="page">
      <header className="toolbar no-export">
        <div className="brand">
          <span className="brand-mark">❦</span>
          <div>
            <h1>Menu Template</h1>
          </div>
        </div>
        <div className="actions">
          <button className="btn" onClick={() => setShowTemplates(true)}>▦ Template</button>
          <button className="btn accent" onClick={downloadImage} disabled={view === 'staff' ? !staff.length : !meals.length}>⤓ Image</button>
          <button className="btn ghost" onClick={resetSample}>Sample</button>
          <button className="btn danger-ghost" onClick={() => setConfirmClear(true)}>Clear</button>
        </div>
      </header>

      {/* View tabs */}
      <div className="tabs no-export">
        <button className={`tab ${view === 'ipd' ? 'active' : ''}`} onClick={() => setView('ipd')}>🍽️ Daily Menu</button>
        <button className={`tab ${view === 'staff' ? 'active' : ''}`} onClick={() => setView('staff')}>👥 Menu Set</button>
      </div>

      <div className="controls no-export">
        {view === 'ipd'
          ? <button className="btn primary" onClick={openAdd}>+ Add Menu</button>
          : <button className="btn primary" onClick={openAddStaff}>+ Add Staff Meal</button>}
      </div>

      {/* IPD popup form */}
      {showModal && (
        <div className="modal-overlay no-export" onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <form className="modal-card" onSubmit={submitForm}>
            <div className="modal-head">
              <strong>{editingId ? `✎ Editing ${form.day}` : '+ Add Menu'}</strong>
              <button type="button" className="modal-x" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <label>Menu Title (shows on table)
                <input className="search" placeholder="IPD Meal Plan" value={form.title} onChange={set('title')} />
              </label>
              <label>Day
                <select value={form.day} onChange={set('day')} className="search">
                  {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </label>
              <label>🌅 Breakfast
                <input className="search" placeholder="မုန့်ဟင်းခါး + လက်ဖက်ရည်" value={form.breakfast} onChange={set('breakfast')} />
              </label>
              <label>☀️ Lunch
                <input className="search" placeholder="ထမင်း + ကြက်သား + ဟင်းချို" value={form.lunch} onChange={set('lunch')} />
              </label>
              <label>🌙 Dinner
                <input className="search" placeholder="ငါးကြော် + အရွက်စုံ" value={form.dinner} onChange={set('dinner')} />
              </label>
            </div>
            <div className="modal-foot">
              <button className="btn" type="button" onClick={cancelEdit}>Cancel</button>
              <button className="btn primary" type="submit">{editingId ? 'Save' : 'Add Menu'}</button>
            </div>
          </form>
        </div>
      )}

      {/* Staff popup form */}
      {showStaffModal && (
        <div className="modal-overlay no-export" onClick={(e) => { if (e.target === e.currentTarget) setShowStaffModal(false) }}>
          <form className="modal-card" onSubmit={submitStaff}>
            <div className="modal-head">
              <strong>{editingStaffId ? `✎ Editing ${staffForm.day}` : '+ Add Staff Meal'}</strong>
              <button type="button" className="modal-x" onClick={() => setShowStaffModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <label>Menu Title (shows on table)
                <input className="search" placeholder="Staff Menu Plan" value={staffForm.title} onChange={setS('title')} />
              </label>
              <label>Day
                <select value={staffForm.day} onChange={setS('day')} className="search">
                  {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </label>
              <label>Dish
                <input className="search" placeholder="ထမင်း + ကြက်သား + ဟင်းချို" value={staffForm.dish} onChange={setS('dish')} />
              </label>
              <label>Price (MMK)
                <input className="search" inputMode="decimal" placeholder="3,500" value={staffForm.price} onChange={setS('price')} />
              </label>
            </div>
            <div className="modal-foot">
              <button className="btn" type="button" onClick={() => { setEditingStaffId(null); setStaffForm(EMPTY_STAFF); setShowStaffModal(false) }}>Cancel</button>
              <button className="btn primary" type="submit">{editingStaffId ? 'Save' : 'Add Meal'}</button>
            </div>
          </form>
        </div>
      )}

      {/* Template picker popup */}
      {showTemplates && (
        <div className="modal-overlay no-export" onClick={(e) => { if (e.target === e.currentTarget) setShowTemplates(false) }}>
          <div className="modal-card tpl-modal">
            <div className="modal-head">
              <strong>▦ Choose Template</strong>
              <button type="button" className="modal-x" onClick={() => setShowTemplates(false)}>×</button>
            </div>
            <p className="tpl-section">🎨 Design</p>
            <div className="tpl-grid">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`tpl-card ${theme === t.id ? 'selected' : ''}`}
                  onClick={() => applyTheme(t.id)}
                >
                  <span className="tpl-preview" style={{ background: t.paper, borderColor: t.accent }}>
                    <span className="tpl-bar" style={{ background: t.head, borderColor: t.accent }} />
                    <span className="tpl-line" style={{ background: t.accent }} />
                    <span className="tpl-line short" style={{ background: t.accent, opacity: 0.5 }} />
                  </span>
                  <span className="tpl-name">{t.name}</span>
                  {theme === t.id && <span className="tpl-using">✓ Using</span>}
                </button>
              ))}
            </div>
            <p className="tpl-section">🧱 Layout</p>
            <div className="tpl-grid layout-grid">
              {LAYOUTS.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  className={`tpl-card ${layout === l.id ? 'selected' : ''}`}
                  onClick={() => applyLayout(l.id)}
                >
                  <span className="layout-icon">{l.icon}</span>
                  <span className="tpl-name">{l.name}</span>
                  {layout === l.id && <span className="tpl-using">✓ Using</span>}
                </button>
              ))}
            </div>
            <div className="modal-foot">
              <button className="btn" onClick={() => setShowTemplates(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Alert popup */}
      {alert && (
        <div className="modal-overlay no-export" onClick={(e) => { if (e.target === e.currentTarget) setAlert(null) }}>
          <div className="modal-card alert-card">
            <div className="modal-head">
              <strong>❦ Notice</strong>
              <button type="button" className="modal-x" onClick={() => setAlert(null)}>×</button>
            </div>
            <p className="alert-text">{alert}</p>
            <div className="modal-foot">
              <button className="btn primary" onClick={() => setAlert(null)}>OK</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm-clear popup */}
      {confirmClear && (
        <div className="modal-overlay no-export" onClick={(e) => { if (e.target === e.currentTarget) setConfirmClear(false) }}>
          <div className="modal-card alert-card">
            <div className="modal-head danger">
              <strong>⚠ Clear all?</strong>
              <button type="button" className="modal-x" onClick={() => setConfirmClear(false)}>×</button>
            </div>
            <p className="alert-text">Delete all rows in this view from table + local storage? This cannot be undone.</p>
            <div className="modal-foot">
              <button className="btn" onClick={() => setConfirmClear(false)}>Cancel</button>
              <button className="btn danger" onClick={doClear}>Delete all</button>
            </div>
          </div>
        </div>
      )}

      {/* Exportable table */}
      <main className="menu-wrap">
        {view === 'ipd' ? (
          <div ref={menuRef} className={`menu-paper theme-${theme} layout-${layout}`}>
            <div className="menu-head">
              <div className="orn">✦ ─── ❦ ─── ✦</div>
              <h2 className="rest-name">{menuTitle}</h2>
              <div className="rule-double" />
            </div>

            {sorted.length === 0 ? (
              <div className="empty"><p>No days to show.</p></div>
            ) : (
              <table className="menu-table week-table">
                <thead>
                  <tr>
                    <th className="c-day">Day</th>
                    <th>🌅 Breakfast</th>
                    <th>☀️ Lunch</th>
                    <th>🌙 Dinner</th>
                    {!isExporting && <th className="c-act">Edit</th>}
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((m) => (
                    <tr key={m.id}>
                      <td className="c-day"><span className="day-pill">{m.day}</span></td>
                      <td className="meal"><span className="dish">{m.breakfast || '—'}</span></td>
                      <td className="meal"><span className="dish">{m.lunch || '—'}</span></td>
                      <td className="meal"><span className="dish">{m.dinner || '—'}</span></td>
                      {!isExporting && (
                        <td className="c-act no-export">
                          <button className="row-btn" title="Edit" onClick={() => editMeal(m)}>✎</button>
                          <button className="row-del" title="Remove" onClick={() => removeMeal(m.id)}>×</button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <div className="menu-foot"><div className="rule-double" /></div>
          </div>
        ) : (
          <div ref={menuRef} className={`menu-paper theme-${theme} layout-${layout}`}>
            <div className="menu-head">
              <div className="orn">✦ ─── ❦ ─── ✦</div>
              <h2 className="rest-name">{staffTitle}</h2>
              <div className="rule-double" />
            </div>

            {sortedStaff.length === 0 ? (
              <div className="empty"><p>No staff meals to show.</p></div>
            ) : (
              <table className="menu-table staff-table">
                <thead>
                  <tr>
                    <th className="c-day">Day</th>
                    <th>Dish</th>
                    <th className="c-price">Price</th>
                    {!isExporting && <th className="c-act">Edit</th>}
                  </tr>
                </thead>
                <tbody>
                  {sortedStaff.map((r) => (
                    <tr key={r.id}>
                      <td className="c-day"><span className="day-pill">{r.day}</span></td>
                      <td className="meal"><span className="dish">{r.dish || '—'}</span></td>
                      <td className="c-price">{r.price ? mmk(r.price) : '—'}</td>
                      {!isExporting && (
                        <td className="c-act no-export">
                          <button className="row-btn" title="Edit" onClick={() => editStaff(r)}>✎</button>
                          <button className="row-del" title="Remove" onClick={() => removeStaff(r.id)}>×</button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <div className="menu-foot"><div className="rule-double" /></div>
          </div>
        )}
      </main>

    </div>
  )
}
