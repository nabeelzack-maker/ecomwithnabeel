import { useEffect, useRef, useState } from 'react'
import { PDFDocument } from 'pdf-lib'
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'
import './App.css'

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/legacy/build/pdf.worker.mjs', import.meta.url).toString()

const MAX_FILE_SIZE = 50 * 1024 * 1024
const INITIAL_CROP = { x: 8, y: 8, width: 84, height: 84 }

function Icon({ name, size = 18 }) {
  const paths = {
    arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
    upload: <><path d="M12 16V4" /><path d="m7 9 5-5 5 5" /><path d="M5 20h14" /></>,
    crop: <><path d="M6 3v12a3 3 0 0 0 3 3h12" /><path d="M3 6h12a3 3 0 0 1 3 3v12" /></>,
    zoomIn: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="M16 16 21 21M10.8 7.8v6M7.8 10.8h6" /></>,
    zoomOut: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="M16 16 21 21M7.8 10.8h6" /></>,
    fit: <><path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" /></>,
    reset: <><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v6h6" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

function Brand() {
  return <span className="brand"><span className="brand-mark">e<span>n</span></span><span>EcomWith<span>Nabeel</span></span></span>
}

function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function clamp(value, min, max) { return Math.min(max, Math.max(min, value)) }

function CropBox({ crop, setCrop, pageRef }) {
  const drag = useRef(null)
  const updateFromPointer = (event) => {
    if (!drag.current || !pageRef.current) return
    const rect = pageRef.current.getBoundingClientRect()
    const dx = ((event.clientX - drag.current.startX) / rect.width) * 100
    const dy = ((event.clientY - drag.current.startY) / rect.height) * 100
    const start = drag.current.crop
    let next = { ...start }
    if (drag.current.kind === 'move') {
      next.x = clamp(start.x + dx, 0, 100 - start.width)
      next.y = clamp(start.y + dy, 0, 100 - start.height)
    } else {
      if (drag.current.kind.includes('w')) {
        const right = start.x + start.width
        next.x = clamp(start.x + dx, 0, right - 5)
        next.width = right - next.x
      }
      if (drag.current.kind.includes('e')) next.width = clamp(start.width + dx, 5, 100 - start.x)
      if (drag.current.kind.includes('n')) {
        const bottom = start.y + start.height
        next.y = clamp(start.y + dy, 0, bottom - 5)
        next.height = bottom - next.y
      }
      if (drag.current.kind.includes('s')) next.height = clamp(start.height + dy, 5, 100 - start.y)
    }
    setCrop(next)
  }
  const startDrag = (event, kind) => {
    event.preventDefault()
    event.stopPropagation()
    drag.current = { kind, startX: event.clientX, startY: event.clientY, crop }
    const stop = () => { drag.current = null; window.removeEventListener('pointermove', updateFromPointer); window.removeEventListener('pointerup', stop) }
    window.addEventListener('pointermove', updateFromPointer)
    window.addEventListener('pointerup', stop, { once: true })
  }
  return <div className="crop-box" style={{ left: `${crop.x}%`, top: `${crop.y}%`, width: `${crop.width}%`, height: `${crop.height}%` }} onPointerDown={(event) => startDrag(event, 'move')}><span className="crop-dimensions">{Math.round(crop.width)}% x {Math.round(crop.height)}%</span>{['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'].map((handle) => <button key={handle} type="button" className={`crop-handle ${handle}`} aria-label={`Resize ${handle}`} onPointerDown={(event) => startDrag(event, handle)} />)}</div>
}

function UploadState({ onFile, error }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const choose = (file) => onFile(file)
  return <div className="pdf-upload-state"><div className={`pdf-dropzone ${dragging ? 'dragging' : ''}`} onDragOver={(event) => { event.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); choose(event.dataTransfer.files[0]) }}><div className="upload-orbit"><Icon name="upload" size={28} /></div><h2>Drop your PDF here</h2><p>or choose a file from your computer</p><button className="button" type="button" onClick={() => inputRef.current?.click()}>Upload PDF <Icon name="arrow" size={16} /></button><input ref={inputRef} type="file" accept="application/pdf,.pdf" hidden onChange={(event) => choose(event.target.files[0])} /><small>PDF only Â· Maximum file size 50MB</small></div>{error && <p className="pdf-error">{error}</p>}</div>
}

function PdfCrop() {
  const [file, setFile] = useState(null)
  const [pdf, setPdf] = useState(null)
  const [pageCount, setPageCount] = useState(0)
  const [page, setPage] = useState(1)
  const [selection, setSelection] = useState('current')
  const [selectedPages, setSelectedPages] = useState([1])
  const [crop, setCrop] = useState(INITIAL_CROP)
  const [zoom, setZoom] = useState(1)
  const [error, setError] = useState('')
  const [processing, setProcessing] = useState(false)
  const [ready, setReady] = useState(null)
  const pageRef = useRef(null)
  const canvasRef = useRef(null)
  const thumbnailRefs = useRef({})
  const sourceBytes = useRef(null)

  const loadFile = async (selectedFile) => {
    setError(''); setReady(null)
    if (!selectedFile) return
    if (selectedFile.type !== 'application/pdf' && !selectedFile.name.toLowerCase().endsWith('.pdf')) { setError('Please choose a valid PDF file.'); return }
    if (selectedFile.size > MAX_FILE_SIZE) { setError('This PDF is larger than 50MB. Please choose a smaller file.'); return }
    try {
      const bytes = await selectedFile.arrayBuffer()
      const loaded = await pdfjsLib.getDocument({ data: bytes.slice(0) }).promise
      sourceBytes.current = bytes
      setFile(selectedFile); setPdf(loaded); setPageCount(loaded.numPages); setPage(1); setSelectedPages([1]); setCrop(INITIAL_CROP); setZoom(1)
    } catch { setError('This PDF could not be opened. It may be corrupted or password protected.') }
  }

  useEffect(() => {
    if (!pdf || !canvasRef.current) return undefined
    let cancelled = false
    const render = async () => {
      try {
        const current = await pdf.getPage(page)
        const viewport = current.getViewport({ scale: 1.55 * zoom })
        const canvas = canvasRef.current
        canvas.width = viewport.width; canvas.height = viewport.height
        await current.render({ canvasContext: canvas.getContext('2d'), viewport }).promise
      } catch { if (!cancelled) setError('The selected page could not be rendered.') }
    }
    render()
    return () => { cancelled = true }
  }, [pdf, page, zoom])

  useEffect(() => {
    if (!pdf) return undefined
    let cancelled = false
    const renderThumbs = async () => {
      for (let index = 1; index <= pdf.numPages; index += 1) {
        const canvas = thumbnailRefs.current[index]
        if (!canvas) continue
        const current = await pdf.getPage(index)
        const viewport = current.getViewport({ scale: 0.18 })
        canvas.width = viewport.width; canvas.height = viewport.height
        if (!cancelled) await current.render({ canvasContext: canvas.getContext('2d'), viewport }).promise
      }
    }
    renderThumbs()
    return () => { cancelled = true }
  }, [pdf])

  const choosePage = (nextPage) => { setPage(nextPage); setCrop(INITIAL_CROP); if (selection === 'current') setSelectedPages([nextPage]) }
  const toggleSelectedPage = (number) => setSelectedPages((current) => current.includes(number) ? current.filter((item) => item !== number) : [...current, number].sort((a, b) => a - b))
  const pagesToCrop = selection === 'all' ? Array.from({ length: pageCount }, (_, index) => index + 1) : selection === 'current' ? [page] : selectedPages
  const resetAll = () => { setFile(null); setPdf(null); setPageCount(0); setReady(null); setError(''); sourceBytes.current = null }
  const processPdf = async () => {
    if (!sourceBytes.current || !pdf) { setError('Upload a PDF before cropping.'); return }
    if (!pagesToCrop.length) { setError('Select at least one page to crop.'); return }
    if (crop.width <= 0 || crop.height <= 0) { setError('Your crop area cannot be empty.'); return }
    setProcessing(true); setError('')
    try {
      const document = await PDFDocument.load(sourceBytes.current)
      const sourcePages = pdf
      const targets = new Set(pagesToCrop)
      for (let index = 0; index < document.getPageCount(); index += 1) {
        if (!targets.has(index + 1)) continue
        const sourcePage = await sourcePages.getPage(index + 1)
        const viewport = sourcePage.getViewport({ scale: 1 })
        const pdfPage = document.getPage(index)
        const cropWidth = viewport.width * crop.width / 100
        const cropHeight = viewport.height * crop.height / 100
        const cropX = viewport.width * crop.x / 100
        const cropY = viewport.height * (100 - crop.y - crop.height) / 100
        pdfPage.setCropBox(cropX, cropY, cropWidth, cropHeight)
      }
      const output = await document.save({ useObjectStreams: true })
      const blob = new Blob([output], { type: 'application/pdf' })
      setReady({ blob, name: `${file.name.replace(/\.pdf$/i, '')}-cropped.pdf`, size: output.byteLength })
    } catch { setError('The PDF could not be processed. Please try another file or reset the editor.') }
    finally { setProcessing(false) }
  }
  const download = () => { if (!ready) return; const url = URL.createObjectURL(ready.blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = ready.name; anchor.click(); URL.revokeObjectURL(url) }
  return <div className="pdf-tool-page site-shell"><header className="nav wrap pdf-nav"><a href="/" aria-label="EcomWithNabeel home"><Brand /></a><a className="button button-small" href="/tools">All Tools <Icon name="arrow" size={15} /></a></header><main className="pdf-main wrap"><section className="pdf-title"><div><a className="calc-back" href="/tools">â† Back to Tools</a><span className="eyebrow"><span className="eyebrow-dot" /> Free document tool</span><h1>PDF Crop</h1><p>Crop your PDF pages precisely and create a clean, ready-to-use PDF.</p></div>{file && <div className="pdf-file-chip"><Icon name="check" size={15} /><span>{file.name}<small>{formatBytes(file.size)}</small></span></div>}</section>{!pdf ? <UploadState onFile={loadFile} error={error} /> : <><section className="pdf-workspace"><aside className="pdf-sidebar"><div className="workspace-heading"><span>Pages</span><small>{pageCount} total</small></div><div className="thumbnail-list">{Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => <button key={number} className={page === number ? 'thumbnail active' : 'thumbnail'} onClick={() => choosePage(number)}><span>Page {number}</span><canvas ref={(node) => { thumbnailRefs.current[number] = node }} /></button>)}</div></aside><section className="pdf-editor"><div className="editor-toolbar"><div><strong>Page {page}</strong><span>Draw a crop area over the preview</span></div><div className="zoom-controls"><button onClick={() => setZoom((current) => clamp(current - .15, .55, 2.2))} aria-label="Zoom out"><Icon name="zoomOut" size={16} /></button><span>{Math.round(zoom * 100)}%</span><button onClick={() => setZoom((current) => clamp(current + .15, .55, 2.2))} aria-label="Zoom in"><Icon name="zoomIn" size={16} /></button><button onClick={() => setZoom(1)} aria-label="Fit to screen"><Icon name="fit" size={16} /></button></div></div><div className="pdf-canvas-stage"><div className="pdf-page-frame" ref={pageRef}><canvas ref={canvasRef} /><CropBox crop={crop} setCrop={setCrop} pageRef={pageRef} /></div></div><div className="editor-bottom"><span>Crop: {Math.round(crop.width)}% Ã— {Math.round(crop.height)}%</span><span>Page ratio preserved</span></div></section><aside className="pdf-controls"><div className="workspace-heading"><span>Crop controls</span><Icon name="crop" size={17} /></div><div className="control-block"><label>Apply crop to</label><div className="choice-list"><label><input type="radio" checked={selection === 'current'} onChange={() => setSelection('current')} /> Current page</label><label><input type="radio" checked={selection === 'all'} onChange={() => setSelection('all')} /> All pages</label><label><input type="radio" checked={selection === 'selected'} onChange={() => setSelection('selected')} /> Selected pages</label></div>{selection === 'selected' && <div className="selected-pages">{Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => <label key={number}><input type="checkbox" checked={selectedPages.includes(number)} onChange={() => toggleSelectedPage(number)} /> {number}</label>)}</div>}</div><div className="control-block crop-stat"><label>Crop dimensions</label><strong>{Math.round(crop.width)}% Ã— {Math.round(crop.height)}%</strong><small>Coordinates scale to the original PDF page.</small></div><button className="button control-button" onClick={processPdf} disabled={processing}>{processing ? 'Creating PDF...' : 'Crop PDF'} <Icon name="arrow" size={16} /></button><button className="outline-control" onClick={() => setCrop(INITIAL_CROP)}><Icon name="reset" size={15} /> Reset Crop</button><button className="outline-control" onClick={resetAll}><Icon name="close" size={15} /> Reset All</button>{error && <p className="pdf-error control-error">{error}</p>}</aside></section>{ready && <section className="pdf-ready"><div className="ready-icon"><Icon name="check" size={20} /></div><div><span>PDF Ready</span><strong>{ready.name}</strong><small>{formatBytes(ready.size)} Â· {pagesToCrop.length} page{pagesToCrop.length === 1 ? '' : 's'} cropped</small></div><button className="button" onClick={download}>Download PDF <Icon name="arrow" size={16} /></button></section>}</>}<p className="pdf-privacy">Your PDF is processed locally in your browser whenever possible. Your files are not intentionally uploaded to a server by this tool.</p></main><footer className="calculator-footer"><span>Â© 2024 EcomWithNabeel</span><span>Free tools for Indian e-commerce businesses</span></footer></div>
}

export default PdfCrop
