import { useMemo, useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import './App.css'

const MAX_FILE_SIZE = 50 * 1024 * 1024
const PAGE_SIZE = 8
const DEFAULT_RULE = { type: 'percent', value: '5' }
const EMPTY_ROWS = []

const money = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 })
const formatMoney = (value) => money.format(Number.isFinite(Number(value)) ? Number(value) : 0)
const parsePrice = (value) => { const parsed = Number.parseFloat(String(value).replace(/[^0-9.-]/g, '')); return Number.isFinite(parsed) ? parsed : NaN }
const normalizeHeader = (value) => String(value ?? '').toLowerCase().replace(/[^a-z0-9]/g, '')
const labelFor = (headers, index) => index === '' ? 'Not mapped' : String(headers[index] ?? `Column ${Number(index) + 1}`)

function Icon({ name, size = 18 }) {
  const paths = {
    arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>, upload: <><path d="M12 16V4" /><path d="m7 9 5-5 5 5" /><path d="M5 20h14" /></>, check: <path d="m5 12 4 4L19 6" />, close: <><path d="m6 6 12 12M18 6 6 18" /></>, reset: <><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v6h6" /></>, download: <><path d="M12 4v12" /><path d="m7 11 5 5 5-5" /><path d="M5 20h14" /></>, filter: <path d="M4 6h16M7 12h10M10 18h4" />, search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></>, plus: <><path d="M12 5v14M5 12h14" /></>, warning: <><path d="M12 3 2 21h20L12 3Z" /><path d="M12 9v4M12 17h.01" /></>, table: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 10h18M9 10v10M15 10v10" /></>, spark: <><path d="m12 3 1.2 5.8L19 10l-5.8 1.2L12 17l-1.2-5.8L5 10l5.8-1.2L12 3Z" /></>,
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}
function Brand() { return <span className="brand"><span className="brand-mark">e<span>n</span></span><span>EcomWith<span>Nabeel</span></span></span> }
function formatBytes(bytes) { return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB` }

function detectMapping(headers) {
  const aliases = {
    sku: ['sku', 'productsku', 'variantid', 'productid', 'itemid'],
    catalog: ['catalog', 'catalogid', 'catalogue', 'catalogueid'],
    variant: ['variant', 'variantname', 'size', 'color', 'colour'],
    msp: ['msp', 'mrp', 'sellingprice', 'price', 'listingprice'],
    wdrp: ['wdrp', 'wd rp', 'wholesalediscountedretailprice'],
  }
  return Object.fromEntries(Object.entries(aliases).map(([field, names]) => {
    const index = headers.findIndex((header) => names.includes(normalizeHeader(header)))
    return [field, index === -1 ? '' : String(index)]
  }))
}

function buildRows(aoa, mapping) {
  return aoa.slice(1).map((values, index) => {
    const read = (field) => mapping[field] === '' ? '' : values[Number(mapping[field])] ?? ''
    return { id: index, originalIndex: index + 1, values, selected: true, sku: read('sku'), catalog: read('catalog'), variant: read('variant'), currentMsp: read('msp'), newMsp: read('msp'), currentWdrp: read('wdrp'), newWdrp: read('wdrp') }
  }).filter((row) => row.values.some((value) => String(value ?? '').trim() !== ''))
}

function validateRows(rows) {
  const keyCounts = new Map()
  rows.forEach((row) => { const key = `${row.sku}|${row.catalog}|${row.variant}`.trim().toLowerCase(); keyCounts.set(key, (keyCounts.get(key) || 0) + 1) })
  return rows.map((row) => {
    const errors = []
    const msp = parsePrice(row.newMsp)
    const wdrp = parsePrice(row.newWdrp)
    if (!Number.isFinite(msp) || msp <= 0) errors.push('MSP must be greater than 0')
    if (!Number.isFinite(wdrp) || wdrp < 0) errors.push('WDRP must be zero or greater')
    const key = `${row.sku}|${row.catalog}|${row.variant}`.trim().toLowerCase()
    if (key && keyCounts.get(key) > 1) errors.push('Duplicate product row')
    return { ...row, errors, changed: String(row.currentMsp) !== String(row.newMsp) || String(row.currentWdrp) !== String(row.newWdrp) }
  })
}

function readWorkbook(file, onSuccess, onError) {
  if (!file) return
  if (!file.name.toLowerCase().endsWith('.xlsx')) { onError('Please upload an .xlsx file.'); return }
  if (file.size > MAX_FILE_SIZE) { onError('This spreadsheet is larger than 50MB. Please choose a smaller file.'); return }
  const reader = new FileReader()
  reader.onload = (event) => {
    try {
      const workbook = XLSX.read(event.target.result, { type: 'array', cellDates: true })
      const sheetName = workbook.SheetNames[0]
      const sheet = workbook.Sheets[sheetName]
      const aoa = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })
      if (!sheetName || !aoa.length || aoa.length < 2) throw new Error('empty')
      const headers = aoa[0].map((header, index) => String(header || `Column ${index + 1}`))
      const mapping = detectMapping(headers)
      const rows = buildRows(aoa, mapping)
      if (!rows.length) throw new Error('empty')
      onSuccess({ file, workbook, sheetName, aoa, headers, mapping, rows, isDemo: file.name.toLowerCase().includes('demo') })
    } catch { onError('This XLSX could not be read. It may be corrupt, empty, or unsupported.') }
  }
  reader.onerror = () => onError('The spreadsheet could not be read from your computer.')
  reader.readAsArrayBuffer(file)
}

function sampleFile() {
  const aoa = [['SKU', 'Catalog ID', 'Variant', 'MSP', 'WDRP', 'Notes'], ['DEMO-001', 'CAT-1001', 'Red / M', 499, 474, 'Demo product'], ['DEMO-002', 'CAT-1002', 'Blue / L', 799, 759, 'Demo product'], ['DEMO-003', 'CAT-1003', 'Black / Free Size', 299, 284, 'Demo product'], ['DEMO-004', 'CAT-1004', 'Yellow / S', 649, 616, 'Demo product']]
  const workbook = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(aoa), 'Price Updates')
  return new File([XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })], 'ecomwithnabeel-demo-price-file.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}

function FileDrop({ onFile, error }) {
  const input = useRef(null); const [dragging, setDragging] = useState(false)
  return <div className="pm-upload-area"><div className={`pm-dropzone ${dragging ? 'dragging' : ''}`} onDragOver={(event) => { event.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); onFile(event.dataTransfer.files[0]) }}><div className="pm-upload-icon"><Icon name="upload" size={25} /></div><h2>Upload your price file</h2><p>Drop an XLSX here or browse your computer.</p><div className="pm-upload-buttons"><button className="button" onClick={() => input.current?.click()}>Choose XLSX <Icon name="arrow" size={15} /></button><button className="pm-sample-button" onClick={() => onFile(sampleFile())}><Icon name="spark" size={14} /> Try with Sample File</button></div><input ref={input} hidden type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={(event) => onFile(event.target.files[0])} /><small>XLSX only · Maximum file size 50MB</small></div>{error && <p className="pdf-error">{error}</p>}</div>
}

function MappingPanel({ headers, mapping, setMapping, rows }) {
  const fields = [['sku', 'SKU / Product ID'], ['catalog', 'Catalog'], ['variant', 'Variant'], ['msp', 'MSP'], ['wdrp', 'WDRP']]
  const missing = !mapping.msp || !mapping.wdrp
  return <section className="pm-mapping-card"><div className="pm-card-heading"><div><span className="kicker">2. MAP COLUMNS</span><h2>Tell us where the prices live.</h2></div><Icon name="table" size={21} /></div><p>We detected these columns where possible. You can change any mapping before editing.</p><div className="pm-mapping-grid">{fields.map(([field, label]) => <label key={field}><span>{label}</span><select value={mapping[field]} onChange={(event) => setMapping((current) => ({ ...current, [field]: event.target.value }))}><option value="">Not mapped</option>{headers.map((header, index) => <option key={`${field}-${index}`} value={index}>{header}</option>)}</select></label>)}</div>{missing && <div className="pm-warning"><Icon name="warning" size={16} /><span>MSP and WDRP columns are required before you can edit or export. Map them above.</span></div>}<small className="pm-mapped-note">{rows.length} product rows detected from the first sheet.</small></section>
}

function BulkPanel({ selectedCount, onApply, rule, setRule }) {
  const [operation, setOperation] = useState('set')
  const [value, setValue] = useState('')
  return <section className="pm-bulk-card"><div className="pm-card-heading"><div><span className="kicker">BULK EDIT</span><h2>Update selected MSP prices.</h2></div><span className="pm-count-badge">{selectedCount} selected</span></div><div className="pm-bulk-grid"><label><span>Action</span><select value={operation} onChange={(event) => setOperation(event.target.value)}><option value="set">Set MSP to</option><option value="increaseAmount">Increase by ₹</option><option value="decreaseAmount">Decrease by ₹</option><option value="increasePercent">Increase by %</option><option value="decreasePercent">Decrease by %</option></select></label><label><span>Value</span><input type="number" min="0" step="any" value={value} onChange={(event) => setValue(event.target.value)} placeholder="e.g. 10" /></label><button className="button" onClick={() => onApply(operation, parsePrice(value))} disabled={!selectedCount || !Number.isFinite(parsePrice(value))}>Apply to selected</button></div><div className="wdrp-rule"><div><strong>Seller-defined WDRP rule</strong><small>This is an editable planning rule, not Meesho's official internal formula.</small></div><select value={rule.type} onChange={(event) => setRule((current) => ({ ...current, type: event.target.value }))}><option value="percent">WDRP = MSP × percentage</option><option value="fixed">WDRP = MSP - fixed amount</option></select><div className="rule-value"><input type="number" min="0" step="any" value={rule.value} onChange={(event) => setRule((current) => ({ ...current, value: event.target.value }))} /><span>{rule.type === 'percent' ? '%' : '₹'}</span></div><button className="pm-outline-button" onClick={() => onApply('wdrp')} disabled={!selectedCount}>Auto Calculate WDRP</button></div></section>
}

function PriceTable({ rows, headers, mapping, search, setSearch, filter, setFilter, sort, setSort, page, setPage, onToggle, onToggleAll, onEdit }) {
  const filtered = useMemo(() => rows.filter((row) => { const needle = search.toLowerCase(); const matchesSearch = !needle || [row.sku, row.catalog, row.variant].some((value) => String(value).toLowerCase().includes(needle)); return matchesSearch && (filter === 'all' || (filter === 'changed' && row.changed) || (filter === 'errors' && row.errors.length)) }), [rows, search, filter])
  const sorted = useMemo(() => [...filtered].sort((a, b) => { if (sort === 'priceAsc') return (parsePrice(a.newMsp) || 0) - (parsePrice(b.newMsp) || 0); if (sort === 'priceDesc') return (parsePrice(b.newMsp) || 0) - (parsePrice(a.newMsp) || 0); return a.id - b.id }), [filtered, sort])
  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE)); const safePage = Math.min(page, pageCount); const visible = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
  const allVisibleSelected = visible.length > 0 && visible.every((row) => row.selected)
  const mapped = (field) => mapping[field] !== '' ? `Mapped: ${labelFor(headers, mapping[field])}` : 'Not mapped'
  return <section className="pm-table-card"><div className="pm-table-heading"><div><span className="kicker">3. EDIT PRICES</span><h2>Review every row before export.</h2><small>{mapped('msp')} · {mapped('wdrp')}</small></div><div className="pm-table-summary"><strong>{rows.length}</strong><span>products</span></div></div><div className="pm-table-toolbar"><label className="pm-search"><Icon name="search" size={16} /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} placeholder="Search SKU, catalog, variant" /></label><select value={filter} onChange={(event) => { setFilter(event.target.value); setPage(1) }}><option value="all">All rows</option><option value="changed">Changed</option><option value="errors">Errors</option></select><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="original">Original order</option><option value="priceAsc">MSP low to high</option><option value="priceDesc">MSP high to low</option></select></div><div className="pm-table-scroll"><table><thead><tr><th><input type="checkbox" checked={allVisibleSelected} onChange={() => onToggleAll(visible, !allVisibleSelected)} /></th><th>SKU / Product ID</th><th>Catalog</th><th>Variant</th><th>Current MSP</th><th>New MSP</th><th>Current WDRP</th><th>New WDRP</th><th>Status</th></tr></thead><tbody>{visible.map((row) => <tr key={row.id} className={`${row.changed ? 'changed-row' : ''} ${row.errors.length ? 'error-row' : ''}`}><td><input type="checkbox" checked={row.selected} onChange={() => onToggle(row.id)} /></td><td><strong>{row.sku || '—'}</strong></td><td>{row.catalog || '—'}</td><td>{row.variant || '—'}</td><td>{formatMoney(parsePrice(row.currentMsp) || 0)}</td><td><input className="cell-input" value={row.newMsp} onChange={(event) => onEdit(row.id, 'newMsp', event.target.value)} /></td><td>{formatMoney(parsePrice(row.currentWdrp) || 0)}</td><td><input className="cell-input" value={row.newWdrp} onChange={(event) => onEdit(row.id, 'newWdrp', event.target.value)} /></td><td><span className={`row-status ${row.errors.length ? 'invalid' : row.changed ? 'updated' : 'unchanged'}`}>{row.errors.length ? 'Invalid' : row.changed ? 'Updated' : 'Unchanged'}</span>{row.errors.length > 0 && <small className="row-error-text">{row.errors[0]}</small>}</td></tr>)}</tbody></table>{!visible.length && <div className="pm-empty-table">No rows match this view.</div>}</div><div className="pm-pagination"><span>Showing {visible.length ? (safePage - 1) * PAGE_SIZE + 1 : 0}-{Math.min(safePage * PAGE_SIZE, sorted.length)} of {sorted.length}</span><div><button onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={safePage === 1}>←</button><strong>{safePage} / {pageCount}</strong><button onClick={() => setPage((current) => Math.min(pageCount, current + 1))} disabled={safePage === pageCount}>→</button></div></div></section>
}

export default function PriceManager() {
  const [dataset, setDataset] = useState(null); const [error, setError] = useState(''); const [rule, setRule] = useState(DEFAULT_RULE); const [search, setSearch] = useState(''); const [filter, setFilter] = useState('all'); const [sort, setSort] = useState('original'); const [page, setPage] = useState(1); const [ready, setReady] = useState(null); const [exportError, setExportError] = useState('')
  const rows = dataset ? dataset.rows : EMPTY_ROWS; const validatedRows = useMemo(() => validateRows(rows), [rows]); const selectedRows = validatedRows.filter((row) => row.selected); const changedRows = validatedRows.filter((row) => row.changed); const errors = validatedRows.filter((row) => row.errors.length); const missingRequired = !dataset?.mapping.msp || !dataset?.mapping.wdrp
  const load = (file) => { setError(''); setReady(null); readWorkbook(file, (next) => { setDataset(next); setPage(1) }, setError) }
  const updateMapping = (nextMapping) => { if (!dataset) return; setDataset((current) => ({ ...current, mapping: nextMapping, rows: buildRows(current.aoa, nextMapping) })) }
  const updateRow = (id, field, value) => setDataset((current) => ({ ...current, rows: current.rows.map((row) => row.id === id ? { ...row, [field]: value } : row) }))
  const toggle = (id) => setDataset((current) => ({ ...current, rows: current.rows.map((row) => row.id === id ? { ...row, selected: !row.selected } : row) }))
  const toggleAll = (visible, selected) => { const ids = new Set(visible.map((row) => row.id)); setDataset((current) => ({ ...current, rows: current.rows.map((row) => ids.has(row.id) ? { ...row, selected } : row) })) }
  const applyBulk = (operation, value) => { if (!dataset) return; setDataset((current) => ({ ...current, rows: current.rows.map((row) => { if (!row.selected) return row; if (operation === 'wdrp') { const msp = parsePrice(row.newMsp); const ruleValue = parsePrice(rule.value) || 0; const next = rule.type === 'percent' ? msp * (1 - ruleValue / 100) : msp - ruleValue; return { ...row, newWdrp: Number.isFinite(msp) ? Math.max(0, next.toFixed(2)) : row.newWdrp } } const currentMsp = parsePrice(row.newMsp) || 0; const next = operation === 'set' ? value : operation === 'increaseAmount' ? currentMsp + value : operation === 'decreaseAmount' ? currentMsp - value : operation === 'increasePercent' ? currentMsp * (1 + value / 100) : currentMsp * (1 - value / 100); return { ...row, newMsp: Math.max(0, next.toFixed(2)) } }) })) }
  const reset = () => { setDataset(null); setReady(null); setError(''); setExportError('') }
  const exportXlsx = () => { if (!dataset || missingRequired || errors.length) { setExportError('Map MSP and WDRP and fix every invalid row before exporting.'); return } try { const workbook = dataset.workbook; const sheet = workbook.Sheets[dataset.sheetName]; validatedRows.forEach((row) => { sheet[XLSX.utils.encode_cell({ r: row.originalIndex, c: Number(dataset.mapping.msp) })] = { t: 'n', v: parsePrice(row.newMsp) }; sheet[XLSX.utils.encode_cell({ r: row.originalIndex, c: Number(dataset.mapping.wdrp) })] = { t: 'n', v: parsePrice(row.newWdrp) } }); const bytes = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' }); const blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }); setReady({ blob, name: 'ecomwithnabeel_price_update.xlsx', size: bytes.byteLength }) } catch { setExportError('The updated XLSX could not be generated. Please try again.') } }
  const download = () => { if (!ready) return; const url = URL.createObjectURL(ready.blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = ready.name; anchor.click(); URL.revokeObjectURL(url) }
  return <div className="price-manager-page site-shell"><header className="nav wrap pm-nav"><a href="/" aria-label="EcomWithNabeel home"><Brand /></a><a className="button button-small" href="/tools">All Tools <Icon name="arrow" size={15} /></a></header><main className="pm-main wrap"><section className="pm-hero"><div><a className="calc-back" href="/tools">← Back to Tools</a><span className="eyebrow"><span className="eyebrow-dot" /> Free seller tool</span><h1>Meesho Price Manager</h1><p>Update multiple product prices faster with one spreadsheet.</p></div>{dataset && <div className="pm-file-chip"><Icon name="check" size={15} /><span>{dataset.file.name}{dataset.isDemo && <small>Demo products</small>}<small>{formatBytes(dataset.file.size)} · {rows.length} products</small></span></div>}</section>{!dataset ? <FileDrop onFile={load} error={error} /> : <><MappingPanel headers={dataset.headers} mapping={dataset.mapping} setMapping={updateMapping} rows={rows} />{!missingRequired && <><BulkPanel selectedCount={selectedRows.length} onApply={applyBulk} rule={rule} setRule={setRule} /><PriceTable rows={validatedRows} headers={dataset.headers} mapping={dataset.mapping} search={search} setSearch={setSearch} filter={filter} setFilter={setFilter} sort={sort} setSort={setSort} page={page} setPage={setPage} onToggle={toggle} onToggleAll={toggleAll} onEdit={updateRow} /></>}<section className="pm-review-card"><div className="pm-card-heading"><div><span className="kicker">4. REVIEW CHANGES</span><h2>Ready to export?</h2></div><div className="pm-review-count">{changedRows.length} changed</div></div><div className="pm-summary-grid"><div><strong>{rows.length}</strong><span>Total products</span></div><div><strong>{selectedRows.length}</strong><span>Selected products</span></div><div><strong>{changedRows.filter((row) => parsePrice(row.currentMsp) !== parsePrice(row.newMsp)).length}</strong><span>Changed MSP</span></div><div><strong>{changedRows.filter((row) => parsePrice(row.currentWdrp) !== parsePrice(row.newWdrp)).length}</strong><span>Changed WDRP</span></div><div><strong>{rows.length - changedRows.length}</strong><span>Unchanged</span></div><div className={errors.length ? 'has-errors' : ''}><strong>{errors.length}</strong><span>Errors</span></div></div>{changedRows.length > 0 && <div className="pm-review-table"><div className="pm-review-row review-head"><span>SKU</span><span>Old MSP</span><span>New MSP</span><span>Old WDRP</span><span>New WDRP</span></div>{changedRows.slice(0, 10).map((row) => <div className="pm-review-row" key={row.id}><span>{row.sku || '—'}</span><span>{formatMoney(parsePrice(row.currentMsp) || 0)}</span><span>{formatMoney(parsePrice(row.newMsp) || 0)}</span><span>{formatMoney(parsePrice(row.currentWdrp) || 0)}</span><span>{formatMoney(parsePrice(row.newWdrp) || 0)}</span></div>)}</div>}<div className="pm-export-area"><div><strong>{missingRequired ? 'Map your price columns first' : errors.length ? 'Fix validation errors before export' : 'Your original columns stay intact'}</strong><small>Only the mapped MSP and WDRP cells are changed in the downloaded workbook.</small></div><button className="button" onClick={exportXlsx} disabled={missingRequired || errors.length > 0}>Generate Updated XLSX <Icon name="download" size={16} /></button></div>{exportError && <p className="pdf-error">{exportError}</p>}</section>{ready && <section className="pm-ready"><div className="ready-icon"><Icon name="check" size={19} /></div><div><span>Price file ready</span><strong>{ready.name}</strong><small>{formatBytes(ready.size)} · Real XLSX export</small></div><button className="button" onClick={download}>Download Updated XLSX <Icon name="download" size={16} /></button></section>}<button className="pm-reset-all" onClick={reset}><Icon name="reset" size={15} /> Start over with another file</button></>}<p className="pm-privacy">Your spreadsheet is processed locally in your browser. Your catalog data is not intentionally uploaded to our server.</p></main><footer className="calculator-footer"><span>© 2024 EcomWithNabeel</span><span>Free tools for Indian e-commerce businesses</span></footer></div>
}
