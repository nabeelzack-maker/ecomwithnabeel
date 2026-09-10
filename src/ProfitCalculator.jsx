import { useMemo, useState } from 'react'
import './App.css'

const DEFAULTS = {
  productCost: '100',
  packagingCost: '5',
  adCost: '0',
  gstRate: '5',
  shippingCharge: '56',
  listingPrice: '140',
  returnRate: '15',
  returnShippingFee: '160',
  damagedReturns: '10',
  targetProfit: '30',
  hasGstBill: false,
}

const money = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
const number = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 1 })
const read = (value) => Math.max(0, Number.parseFloat(value) || 0)
const clampPercent = (value) => Math.min(100, read(value))
const formatMoney = (value) => money.format(Number.isFinite(value) ? value : 0)
const formatNumber = (value) => number.format(Number.isFinite(value) ? value : 0)

function calcForPrice(values, listingPrice) {
  const productCost = read(values.productCost)
  const packagingCost = read(values.packagingCost)
  const adCost = read(values.adCost)
  const gstRate = read(values.gstRate)
  const shippingCharge = read(values.shippingCharge)
  const returnRate = clampPercent(values.returnRate)
  const returnShippingFee = read(values.returnShippingFee)
  const damagedReturns = clampPercent(values.damagedReturns)
  const deliveredOrders = 100 * (1 - returnRate / 100)
  const returnedOrders = 100 * returnRate / 100
  const damagedReturnOrders = returnedOrders * damagedReturns / 100
  const gst = listingPrice * gstRate / (100 + gstRate)
  const shippingGst = shippingCharge * 18 / 100
  const salesGstTotal = gst * deliveredOrders
  const shippingGstTotal = shippingGst * deliveredOrders
  const packagingTotal = packagingCost * 100
  const productCostTotal = productCost * deliveredOrders
  const returnShippingTotal = returnShippingFee * returnedOrders
  const damagedProductLoss = productCost * damagedReturnOrders
  const revenue = listingPrice * deliveredOrders
  const finalProfit = revenue - productCostTotal - packagingTotal - adCost * 100 - shippingGstTotal - returnShippingTotal - damagedProductLoss - salesGstTotal
  const estimatedItcPerOrder = productCost * gstRate / (100 + gstRate)
  const estimatedItcTotal = values.hasGstBill ? estimatedItcPerOrder * 100 : 0
  const basicMargin = listingPrice - productCost
  const profitBeforeReturns = (listingPrice - gst - productCost - packagingCost - adCost - shippingGst)
  const realProfitPerOrder = finalProfit / 100
  return {
    productCost, packagingCost, adCost, gstRate, shippingCharge, returnRate, returnShippingFee, damagedReturns,
    deliveredOrders, returnedOrders, damagedReturnOrders, listingPrice, gst, shippingGst, salesGstTotal,
    shippingGstTotal, packagingTotal, productCostTotal, returnShippingTotal, damagedProductLoss, revenue,
    finalProfit, realProfitPerOrder, basicMargin, profitBeforeReturns, estimatedItcPerOrder, estimatedItcTotal,
    profitMargin: listingPrice > 0 ? realProfitPerOrder / listingPrice * 100 : 0,
  }
}

function solvePrice(values, targetProfit = 0) {
  let low = 0
  let high = 100000
  if (calcForPrice(values, high).realProfitPerOrder < targetProfit) return null
  for (let index = 0; index < 60; index += 1) {
    const middle = (low + high) / 2
    if (calcForPrice(values, middle).realProfitPerOrder >= targetProfit) high = middle
    else low = middle
  }
  return high
}

function maxSurvivableReturnRate(values) {
  const atZero = calcForPrice({ ...values, returnRate: '0' }, read(values.listingPrice)).finalProfit
  const atHundred = calcForPrice({ ...values, returnRate: '100' }, read(values.listingPrice)).finalProfit
  if (atZero < 0) return 0
  if (atHundred >= 0) return 100
  let low = 0
  let high = 100
  for (let index = 0; index < 60; index += 1) {
    const middle = (low + high) / 2
    if (calcForPrice({ ...values, returnRate: String(middle) }, read(values.listingPrice)).finalProfit >= 0) low = middle
    else high = middle
  }
  return low
}

function CalculatorIcon({ name, size = 20 }) {
  const paths = {
    arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    reset: <><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v6h6" /></>,
    chart: <><path d="M4 19V5" /><path d="M4 19h17" /><path d="m7 15 3-4 3 2 5-7" /></>,
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

function Field({ label, hint, name, value, onChange, prefix, suffix, type = 'number', min = 0, max }) {
  return <label className="calc-field"><span>{label}</span><div className="field-control">{prefix && <b>{prefix}</b>}<input type={type} inputMode="decimal" min={min} max={max} step="any" value={value} onChange={(event) => onChange(name, event.target.value)} />{suffix && <b>{suffix}</b>}</div>{hint && <small>{hint}</small>}</label>
}

function SelectField({ label, hint, value, onChange }) {
  return <label className="calc-field"><span>{label}</span><div className="field-control"><select value={value} onChange={(event) => onChange('gstRate', event.target.value)}><option value="0">0%</option><option value="5">5%</option><option value="12">12%</option><option value="18">18%</option></select></div>{hint && <small>{hint}</small>}</label>
}

function CalculatorHeader({ mode, setMode }) {
  return <div className="calculator-header"><div><a className="calc-back" href="/tools">← Back to Tools</a><span className="eyebrow"><span className="eyebrow-dot" /> Free seller tool</span><h1>Price with clarity.<br /><em>Sell with confidence.</em></h1><p>Understand what each order really earns after the costs that matter to Indian sellers.</p></div><div className="calculator-tabs" role="tablist"><button className={mode === 'profit' ? 'active' : ''} onClick={() => setMode('profit')} role="tab" aria-selected={mode === 'profit'}>Check My Profit</button><button className={mode === 'price' ? 'active' : ''} onClick={() => setMode('price')} role="tab" aria-selected={mode === 'price'}>Find My Price</button></div></div>
}

function InputPanel({ mode, values, update, reset }) {
  const isPriceMode = mode === 'price'
  return <section className="calc-input-panel"><div className="calc-panel-heading"><span className="kicker">{isPriceMode ? 'PRICE PLANNER' : 'YOUR NUMBERS'}</span><button className="reset-button" onClick={reset}><CalculatorIcon name="reset" size={15} /> Reset</button></div><h2>{isPriceMode ? 'Find the price that protects your margin.' : 'Tell us how one order works.'}</h2><p className="calc-panel-intro">Use your own numbers. Everything updates instantly as you type.</p><div className="calc-fields"><Field label="Product Cost" hint="What you pay for the product." name="productCost" value={values.productCost} onChange={update} prefix="₹" /><Field label="Packaging Cost per Order" hint="Boxes, bags, tape, and inserts." name="packagingCost" value={values.packagingCost} onChange={update} prefix="₹" /><Field label="Ad Cost per Order" hint="Average ad spend attached to one order." name="adCost" value={values.adCost} onChange={update} prefix="₹" /><SelectField label="GST Rate" hint="GST contained inside the listing price." value={values.gstRate} onChange={update} /><Field label="Shipping Charge" hint="Shipping cost per delivered order." name="shippingCharge" value={values.shippingCharge} onChange={update} prefix="₹" />{isPriceMode ? <Field label="Expected Return Rate" hint="Your estimated percentage of returned orders." name="returnRate" value={values.returnRate} onChange={update} suffix="%" max="100" /> : <Field label="Meesho Listing Price" hint="Your customer-facing, GST-inclusive price." name="listingPrice" value={values.listingPrice} onChange={update} prefix="₹" />}<Field label="Return Shipping Fee" hint="The shipping fee on a returned order." name="returnShippingFee" value={values.returnShippingFee} onChange={update} prefix="₹" /><Field label="Damaged Returns" hint="Expected share of returns that cannot be resold." name="damagedReturns" value={values.damagedReturns} onChange={update} suffix="%" max="100" />{isPriceMode && <Field label="Target Profit per Order" hint="The real profit you want left after costs." name="targetProfit" value={values.targetProfit} onChange={update} prefix="₹" />}</div>{!isPriceMode && <label className="gst-check"><input type="checkbox" checked={values.hasGstBill} onChange={(event) => update('hasGstBill', event.target.checked)} /><span><strong>I get a GST bill when buying stock</strong><small>Shows a separate estimated input-tax-credit adjustment. Actual GST treatment depends on your tax situation.</small></span></label>}<button className="button calc-primary-action" onClick={() => undefined}>{isPriceMode ? 'Find My Price' : 'Check My Profit'} <CalculatorIcon name="arrow" size={17} /></button></section>
}

function StatusBadge({ profit }) {
  const status = profit > 0.005 ? 'PROFITABLE' : profit < -0.005 ? 'LOSING MONEY' : 'BREAK-EVEN'
  return <div className={`status-badge ${status.toLowerCase().replace(' ', '-')}`}><span className="status-dot" /><strong>{status}</strong><small>{status === 'PROFITABLE' ? 'This order leaves money after the full model.' : status === 'BREAK-EVEN' ? 'Costs and earnings are almost equal.' : 'Your current price does not cover the full model.'}</small></div>
}

function BreakdownTable({ result }) {
  const rows = [['Orders', 100], ['Delivered', result.deliveredOrders], ['Returned', result.returnedOrders], ['Revenue', result.revenue, true], ['Product Cost', result.productCostTotal, true], ['Packaging', result.packagingTotal, true], ['Ads', result.adCost * 100, true], ['Shipping GST', result.shippingGstTotal, true], ['Return Shipping', result.returnShippingTotal, true], ['Damaged Returns', result.damagedProductLoss, true], ['GST', result.salesGstTotal, true], ['Final Profit/Loss', result.finalProfit, true]]
  return <div className="breakdown-wrap"><div className="breakdown-heading"><span>100-order view</span><small>Estimated model</small></div><div className="breakdown-table"><div className="breakdown-row breakdown-head"><span>Metric</span><span>Value</span></div>{rows.map(([label, value, isMoney]) => <div className={`breakdown-row ${label === 'Final Profit/Loss' ? 'final-row' : ''}`} key={label}><span>{label}</span><strong>{isMoney ? formatMoney(value) : formatNumber(value)}</strong></div>)}</div></div>
}

function ProfitResults({ values }) {
  const result = useMemo(() => calcForPrice(values, read(values.listingPrice)), [values])
  const maxReturn = useMemo(() => maxSurvivableReturnRate(values), [values])
  const breakeven = useMemo(() => solvePrice(values, 0), [values])
  return <section className="calc-results"><div className="results-topline"><div><span className="kicker">CHECK MY PROFIT</span><h2>Your real order economics.</h2></div><StatusBadge profit={result.realProfitPerOrder} /></div><div className="profit-compare"><div><small>WHAT YOU THINK YOU EARN</small><strong>{formatMoney(result.basicMargin)}</strong><span>Listing price minus product cost</span></div><div className="compare-arrow">→</div><div className="real-profit"><small>REAL PROFIT AFTER ALL COSTS</small><strong>{formatMoney(result.realProfitPerOrder)}</strong><span>Average per order after returns</span></div></div><div className="key-results"><div><span>Maximum return rate you can survive</span><strong>{maxReturn >= 99.95 ? '>100%' : `${formatNumber(maxReturn)}%`}</strong><small>Approximate zero-profit point</small></div><div><span>Breakeven listing price</span><strong>{breakeven === null ? '> ₹1,00,000' : formatMoney(breakeven)}</strong><small>At the selected return rate</small></div><div><span>Profit / loss for 100 orders</span><strong className={result.finalProfit >= 0 ? 'positive' : 'negative'}>{formatMoney(result.finalProfit)}</strong><small>Based on the full cost model</small></div></div><div className="result-cost-grid"><div><span>Delivered orders</span><strong>{formatNumber(result.deliveredOrders)}</strong></div><div><span>Returned orders</span><strong>{formatNumber(result.returnedOrders)}</strong></div><div><span>GST impact</span><strong>{formatMoney(result.salesGstTotal)}</strong></div><div><span>Damaged-return loss</span><strong>{formatMoney(result.damagedProductLoss)}</strong></div></div>{values.hasGstBill && <div className="itc-note"><strong>Estimated input-tax-credit adjustment: {formatMoney(result.estimatedItcTotal)}</strong><span>This estimate is shown separately and is not included in final profit. Actual GST treatment depends on your tax situation.</span></div>}<BreakdownTable result={result} /></section>
}

function PriceResults({ values }) {
  const target = read(values.targetProfit)
  const suggested = useMemo(() => solvePrice(values, target), [values, target])
  const result = useMemo(() => calcForPrice(values, suggested || 0), [values, suggested])
  return <section className="calc-results"><div className="results-topline"><div><span className="kicker">FIND MY PRICE</span><h2>A price built around your target.</h2></div><div className="free-pill">FREE CALCULATION</div></div><div className="suggested-price"><small>SUGGESTED LISTING PRICE</small><strong>{suggested === null ? '> ₹1,00,000' : formatMoney(suggested)}</strong><span>GST-inclusive price for the selected costs and return rate</span></div><div className="key-results price-results"><div><span>Expected profit</span><strong>{suggested === null ? 'Not reached' : formatMoney(result.realProfitPerOrder)}</strong><small>After GST, returns, and costs</small></div><div><span>Expected profit margin</span><strong>{suggested === null ? '—' : `${formatNumber(result.profitMargin)}%`}</strong><small>Profit divided by listing price</small></div><div><span>Estimated profit for 100 orders</span><strong>{suggested === null ? 'Not reached' : formatMoney(result.finalProfit)}</strong><small>Before any tax-credit estimate</small></div></div><div className="price-explanation"><CalculatorIcon name="chart" size={19} /><p>Find My Price uses a numerical search to solve for the lowest listing price that reaches your target profit after GST, returns, shipping, ads, packaging, and damaged returns.</p></div>{values.hasGstBill && <div className="itc-note"><strong>Estimated input-tax-credit adjustment: {formatMoney(result.estimatedItcTotal)}</strong><span>This estimate is separate and not included in the suggested price. Actual GST treatment depends on your tax situation.</span></div>}</section>
}

export default function ProfitCalculator() {
  const [mode, setMode] = useState('profit')
  const [values, setValues] = useState(DEFAULTS)
  const update = (name, value) => setValues((current) => ({ ...current, [name]: value }))
  const reset = () => setValues(DEFAULTS)
  return <div className="calculator-page site-shell"><header className="nav wrap calculator-nav"><a href="/" aria-label="EcomWithNabeel home"><span className="brand"><span className="brand-mark">e<span>n</span></span><span>EcomWith<span>Nabeel</span></span></span></a><a className="button button-small" href="/tools">All Tools <CalculatorIcon name="arrow" size={15} /></a></header><main className="calculator-main wrap"><CalculatorHeader mode={mode} setMode={setMode} /><div className="calculator-layout"><InputPanel mode={mode} values={values} update={update} reset={reset} />{mode === 'profit' ? <ProfitResults values={values} /> : <PriceResults values={values} />}</div><p className="calculator-disclaimer">This calculator provides estimates for planning purposes. Marketplace fees, tax treatment, shipping rules, and return outcomes can vary. Review your own business records or a qualified tax professional before making financial decisions.</p></main><footer className="calculator-footer"><span>© 2024 EcomWithNabeel</span><span>Free seller tools for Indian e-commerce businesses</span></footer></div>
}
