import { useEffect, useRef, useState } from 'react'
import { PDFDocument } from 'pdf-lib'
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'
import './App.css'

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/legacy/build/pdf.worker.mjs', import.meta.url).toString()

const MAX_FILE_SIZE = 50 * 1024 * 1024
const PAPER = { portrait: [595.28, 841.89], landscape: [841.89, 595.28] }
const LAYOUTS = { 1: [1, 1], 2: [1, 2], 4: [2, 2], 6: [2, 3] }

function Icon({ name, size = 18 }) {
  const paths = {
    arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>, upload: <><path d="M12 16V4" /><path d="m7 9 5-5 5 5" /><path d="M5 20h14" /></>, check: <path d="m5 12 4 4L19 6" />, reset: <><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v6h6" /></>, print: <><path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><path d="M6 14h12v7H6z" /></>, close: <><path d="m6 6 12 12M18 6 6 18" /></>, layout: <><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M4 10h16M10 10v10" /></>, plus: <><path d="M12 5v14M5 12h14" /></>, minus: <path d="M5 12h14" />,
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}
function Brand() { return <span className="brand"><span className="brand-mark">e<span>n</span></span><span>EcomWith<span>Nabeel</span></span></span> }
function formatBytes(bytes) { return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB` }
function clamp(value, min, max) { return Math.min(max, Math.max(min, value)) }

function UploadState({ onFile, error }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  return <div className="pdf-upload-state"><div className={`pdf-dropzone ${dragging ? 'dragging' : ''}`} onDragOver={(event) => { event.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); onFile(event.dataTransfer.files[0]) }}><div className="upload-orbit"><Icon name="upload" size={28} /></div><h2>Drop your PDF here</h2><p>Turn shipping pages into print-ready A4 sheets</p><button className="button" type="button" onClick={() => inputRef.current?.click()}>Upload PDF <Icon name="arrow" size={16} /></button><input ref={inputRef} type="file" accept="application/pdf,.pdf" hidden onChange={(event) => onFile(event.target.files[0])} /><small>PDF only · Maximum file size 50MB</small></div>{error && <p className="pdf-error">{error}</p>}</div>
}

function LayoutPreview({ pdf, pages, layout, orientation, margin, gap, sheetIndex }) {
  const canvasRefs = useRef({})
  const [renderError, setRenderError] = useState('')
  const [columns, rows] = LAYOUTS[layout]
  const sheetPages = pages.slice(sheetIndex * layout, sheetIndex * layout + layout)
  useEffect(() => {
    let cancelled = false
    const renderPages = pages.slice(sheetIndex * layout, sheetIndex * layout + layout)
    const render = async () => {
      try {
        for (const pageNumber of renderPages) {
          const canvas = canvasRefs.current[pageNumber]
          if (!canvas) continue
          const source = await pdf.getPage(pageNumber)
          const sourceViewport = source.getViewport({ scale: 1 })
          const cellWidth = (100 / columns)
          const cellHeight = (100 / rows)
          const previewWidth = Math.max(100, Math.floor(cellWidth * 2.8))
          const previewHeight = Math.max(100, Math.floor(cellHeight * 2.8))
          const scale = Math.min(previewWidth / sourceViewport.width, previewHeight / sourceViewport.height)
          const viewport = source.getViewport({ scale })
          canvas.width = viewport.width; canvas.height = viewport.height
          if (!cancelled) await source.render({ canvasContext: canvas.getContext('2d'), viewport }).promise
        }
      } catch { if (!cancelled) setRenderError('One preview page could not be rendered.') }
    }
    render()
    return () => { cancelled = true }
  }, [pdf, sheetIndex, pages, layout, orientation, margin, gap, columns, rows])
  return <div className={`a4-preview ${orientation}`}><div className="a4-label">A4 SHEET {sheetIndex + 1}</div><div className="a4-grid" style={{ '--grid-columns': columns, '--grid-rows': rows, '--a4-margin': `${margin / 10}%`, '--a4-gap': `${gap / 10}%` }}>{sheetPages.map((pageNumber) => <div className="a4-cell" key={pageNumber}><canvas ref={(node) => { canvasRefs.current[pageNumber] = node }} /><span>Page {pageNumber}</span></div>)}</div>{renderError && <p className="pdf-error">{renderError}</p>}</div>
}

function PdfLayout() {
  const [file, setFile] = useState(null)
  const [pdf, setPdf] = useState(null)
  const [pageCount, setPageCount] = useState(0)
  const [pages, setPages] = useState([])
  const [layout, setLayout] = useState(4)
  const [orientation, setOrientation] = useState('portrait')
  const [margin, setMargin] = useState('12')
  const [gap, setGap] = useState('5')
  const [sheetIndex, setSheetIndex] = useState(0)
  const [error, setError] = useState('')
  const [processing, setProcessing] = useState(false)
  const [ready, setReady] = useState(null)
  const sourceBytes = useRef(null)

  const loadFile = async (selectedFile) => {
    setError(''); setReady(null)
    if (!selectedFile) return
    if (selectedFile.type !== 'application/pdf' && !selectedFile.name.toLowerCase().endsWith('.pdf')) { setError('Please choose a valid PDF file.'); return }
    if (selectedFile.size > MAX_FILE_SIZE) { setError('This PDF is larger than 50MB. Please choose a smaller file.'); return }
    try {
      const bytes = await selectedFile.arrayBuffer()
      const loaded = await pdfjsLib.getDocument({ data: bytes.slice(0) }).promise
      if (!loaded.numPages) throw new Error('empty')
      sourceBytes.current = bytes
      setFile(selectedFile); setPdf(loaded); setPageCount(loaded.numPages); setPages(Array.from({ length: loaded.numPages }, (_, index) => index + 1)); setSheetIndex(0)
    } catch { setError('This PDF could not be opened. It may be corrupted, password protected, or empty.') }
  }
  const togglePage = (page) => setPages((current) => current.includes(page) ? current.filter((item) => item !== page) : [...current, page].sort((a, b) => a - b))
  const selectAll = () => setPages(Array.from({ length: pageCount }, (_, index) => index + 1))
  const deselectAll = () => setPages([])
  const autoFit = () => { setMargin('8'); setGap('4') }
  const sheets = pages.length ? Math.ceil(pages.length / layout) : 0
  const activeSheetIndex = clamp(sheetIndex, 0, Math.max(0, sheets - 1))
  const resetAll = () => { setFile(null); setPdf(null); setPageCount(0); setPages([]); setReady(null); setError(''); sourceBytes.current = null }
  const generatePdf = async () => {
    if (!sourceBytes.current || !pdf) { setError('Upload a PDF before generating an A4 layout.'); return }
    if (!pages.length) { setError('Select at least one page before generating your A4 PDF.'); return }
    setProcessing(true); setError('')
    try {
      const output = await PDFDocument.create()
      const embedded = await output.embedPdf(sourceBytes.current, pages.map((page) => page - 1))
      const [a4Width, a4Height] = PAPER[orientation]
      const cols = LAYOUTS[layout][0]
      const rows = LAYOUTS[layout][1]
      const marginPoints = Number(margin) * 2.83465
      const gapPoints = Number(gap) * 2.83465
      const cellWidth = (a4Width - marginPoints * 2 - gapPoints * (cols - 1)) / cols
      const cellHeight = (a4Height - marginPoints * 2 - gapPoints * (rows - 1)) / rows
      for (let sheet = 0; sheet < embedded.length; sheet += layout) {
        const page = output.addPage([a4Width, a4Height])
        embedded.slice(sheet, sheet + layout).forEach((embeddedPage, index) => {
          const sourceWidth = embeddedPage.width
          const sourceHeight = embeddedPage.height
          const scale = Math.min(cellWidth / sourceWidth, cellHeight / sourceHeight)
          const width = sourceWidth * scale
          const height = sourceHeight * scale
          const column = index % cols
          const row = Math.floor(index / cols)
          const x = marginPoints + column * (cellWidth + gapPoints) + (cellWidth - width) / 2
          const y = a4Height - marginPoints - (row + 1) * cellHeight - row * gapPoints + (cellHeight - height) / 2
          page.drawPage(embeddedPage, { x, y, width, height })
        })
      }
      const bytes = await output.save({ useObjectStreams: true })
      setReady({ blob: new Blob([bytes], { type: 'application/pdf' }), name: `${file.name.replace(/\.pdf$/i, '')}-${layout}-up-a4.pdf`, size: bytes.byteLength, pages: pages.length, sheets })
    } catch { setError('The A4 PDF could not be generated. Please try again or choose another file.') }
    finally { setProcessing(false) }
  }
  const download = () => { if (!ready) return; const url = URL.createObjectURL(ready.blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = ready.name; anchor.click(); URL.revokeObjectURL(url) }
  const print = () => { if (!ready) return; const url = URL.createObjectURL(ready.blob); const printWindow = window.open(url, '_blank'); if (printWindow) printWindow.onload = () => printWindow.print() }
  return <div className="pdf-tool-page site-shell"><header className="nav wrap pdf-nav"><a href="/" aria-label="EcomWithNabeel home"><Brand /></a><a className="button button-small" href="/tools">All Tools <Icon name="arrow" size={15} /></a></header><main className="pdf-main wrap"><section className="pdf-title"><div><a className="calc-back" href="/tools">← Back to Tools</a><span className="eyebrow"><span className="eyebrow-dot" /> Free document tool</span><h1>PDF Layout</h1><p>Arrange shipping pages onto clean, print-friendly A4 sheets.</p></div>{file && <div className="pdf-file-chip"><Icon name="check" size={15} /><span>{file.name}<small>{formatBytes(file.size)} · {pageCount} pages</small></span></div>}</section>{!pdf ? <UploadState onFile={loadFile} error={error} /> : <><section className="layout-workspace"><aside className="layout-left"><div className="layout-section-heading"><span>1. Choose Pages</span><small>{pages.length} of {pageCount} selected</small></div><div className="page-select-actions"><button onClick={selectAll}>Select all</button><button onClick={deselectAll}>Clear</button></div><div className="layout-thumbnails">{Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => <button key={number} className={pages.includes(number) ? 'layout-thumb selected' : 'layout-thumb'} onClick={() => togglePage(number)}><span>{pages.includes(number) ? <Icon name="check" size={12} /> : number}</span><small>Page {number}</small></button>)}</div><div className="layout-section-heading layout-settings-title"><span>2. Choose Layout</span></div><div className="layout-options">{[1, 2, 4, 6].map((count) => <button key={count} className={layout === count ? 'layout-option active' : 'layout-option'} onClick={() => setLayout(count)}><span className={`mini-sheet count-${count}`}><i /><i /><i /><i /><i /><i /></span><strong>{count}</strong><small>{count === 1 ? 'label' : 'labels'} / A4</small></button>)}</div><div className="orientation-options"><label>Orientation</label><div><button className={orientation === 'portrait' ? 'active' : ''} onClick={() => setOrientation('portrait')}>Portrait</button><button className={orientation === 'landscape' ? 'active' : ''} onClick={() => setOrientation('landscape')}>Landscape</button></div></div><div className="spacing-controls"><label>Outer margin <span>mm</span><input type="number" min="0" max="40" value={margin} onChange={(event) => setMargin(event.target.value)} /></label><label>Label gap <span>mm</span><input type="number" min="0" max="30" value={gap} onChange={(event) => setGap(event.target.value)} /></label><button className="auto-fit" onClick={autoFit}><Icon name="layout" size={14} /> Auto Fit</button></div></aside><section className="layout-preview-panel"><div className="layout-preview-heading"><div><span className="layout-section-heading">3. Preview</span><small>{sheets} A4 sheet{sheets === 1 ? '' : 's'} generated</small></div>{sheets > 1 && <div className="sheet-nav"><button onClick={() => setSheetIndex((current) => Math.max(0, current - 1))} disabled={activeSheetIndex === 0}>←</button><span>{activeSheetIndex + 1} / {sheets}</span><button onClick={() => setSheetIndex((current) => Math.min(sheets - 1, current + 1))} disabled={activeSheetIndex === sheets - 1}>→</button></div>}</div>{pages.length ? <LayoutPreview pdf={pdf} pages={pages} layout={layout} orientation={orientation} margin={Number(margin) || 0} gap={Number(gap) || 0} sheetIndex={activeSheetIndex} /> : <div className="empty-layout-preview"><Icon name="layout" size={30} /><strong>Select pages to preview</strong><span>Choose one or more pages from the sidebar.</span></div>}</section><aside className="layout-right"><div className="layout-section-heading"><span>4. Generate</span><Icon name="layout" size={17} /></div><div className="output-summary"><span>Output summary</span><strong>{pages.length} original label{pages.length === 1 ? '' : 's'}</strong><strong>{sheets} A4 sheet{sheets === 1 ? '' : 's'}</strong><small>{layout} per {orientation} A4</small></div><button className="button layout-generate" onClick={generatePdf} disabled={processing || !pages.length}>{processing ? 'Generating PDF...' : 'Generate A4 PDF'} <Icon name="arrow" size={16} /></button>{ready && <div className="layout-ready"><div className="ready-icon"><Icon name="check" size={19} /></div><span>Your A4 PDF is ready</span><strong>{ready.name}</strong><small>{ready.pages} original labels · {ready.sheets} A4 sheets · {formatBytes(ready.size)}</small><button className="button" onClick={download}>Download A4 PDF <Icon name="arrow" size={15} /></button><button className="outline-control" onClick={print}><Icon name="print" size={15} /> Print PDF</button></div>}{error && <p className="pdf-error">{error}</p>}<button className="outline-control layout-reset-all" onClick={resetAll}><Icon name="close" size={15} /> Reset All</button></aside></section></>}<p className="pdf-privacy">Your PDF is processed locally in your browser whenever possible. Your files are not intentionally uploaded to a server by this tool.</p></main><footer className="calculator-footer"><span>© 2024 EcomWithNabeel</span><span>Free tools for Indian e-commerce businesses</span></footer></div>
}

export default PdfLayout
