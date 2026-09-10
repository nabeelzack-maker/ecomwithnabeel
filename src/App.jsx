import { useEffect, useState } from 'react'
import './App.css'
import ProfitCalculator from './ProfitCalculator.jsx'
import PdfCrop from './PdfCrop.jsx'
import PdfLayout from './PdfLayout.jsx'

const products = [
  ['truck', 'Shipping Fixer', 'Resolve shipping issues before they become costly returns.', 'coral'],
  ['spark', 'Auto Listing', 'Turn product details into scroll-stopping listings in seconds.', 'yellow'],
  ['tag', 'Price Manager', 'Keep every price competitive, accurate, and profitable.', 'mint'],
  ['chart', 'Profit Calculator', 'Know your real margin before you click publish.', 'blue'],
  ['crop', 'PDF Crop', 'Clean product documents without wrestling with software.', 'lavender'],
  ['layout', 'PDF Layout', 'Arrange, brand, and share polished PDFs with ease.', 'peach'],
]
const faqs = [
  ['Who is EcomWithNabeel built for?', 'EcomWithNabeel is made for Indian e-commerce sellers who want to spend less time on repetitive operations and more time growing their store. It works especially well for Meesho sellers, but the toolkit is useful across marketplaces.'],
  ['Can I use the tools separately?', 'Yes. Each tool is designed to stand on its own, so you can start with the workflow that creates the most friction for your business and add more as you need them.'],
  ['Do I need technical knowledge?', 'Not at all. EcomWithNabeel is designed for busy sellers, not developers. Every workflow is intentionally simple, clear, and built around the work you already do.'],
  ['Is my data secure?', 'Security matters to us. We will publish the full details of our data handling and retention practices before launch. This is a placeholder for that policy.'],
]

function Icon({ name, size = 20 }) {
  const paths = {
    arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    truck: <><path d="M3 6h11v10H3z" /><path d="M14 9h4l3 3v4h-7z" /><circle cx="7" cy="18" r="2" /><circle cx="18" cy="18" r="2" /></>,
    spark: <><path d="m12 3 1.2 5.8L19 10l-5.8 1.2L12 17l-1.2-5.8L5 10l5.8-1.2L12 3Z" /><path d="m19 16 .5 2.5L22 19l-2.5.5L19 22l-.5-2.5L16 19l2.5-.5L19 16Z" /></>,
    tag: <><path d="M20 13 13 20l-9-9V4h7l9 9Z" /><circle cx="8" cy="8" r="1" /></>,
    chart: <><path d="M4 19V5" /><path d="M4 19h17" /><path d="m7 15 3-4 3 2 5-7" /></>,
    crop: <><path d="M6 3v12a3 3 0 0 0 3 3h12" /><path d="M3 6h12a3 3 0 0 1 3 3v12" /></>,
    layout: <><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M4 10h16M10 10v10" /></>,
    menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

function Brand({ compact = false }) {
  return <span className="brand"><span className={`brand-mark ${compact ? 'small' : ''}`}>e<span>n</span></span><span>EcomWith<span>Nabeel</span></span></span>
}

function DashboardPreview() {
  return <div className="hero-visual" aria-label="EcomWithNabeel seller tools dashboard preview">
    <div className="visual-glow" />
    <div className="dashboard">
      <div className="dash-top"><div className="dash-logo"><Brand compact /></div><div className="dash-top-right"><span className="dash-search">⌕ &nbsp; Search</span><span className="avatar">EN</span></div></div>
      <div className="dash-body"><aside><span className="side-active"><Icon name="chart" size={15} /> Overview</span><span><Icon name="tag" size={15} /> Listings</span><span><Icon name="truck" size={15} /> Shipping</span><span><Icon name="layout" size={15} /> Documents</span><div className="side-bottom"><span><Icon name="spark" size={15} /> What's new</span><span>Settings</span></div></aside>
        <div className="dash-content"><div className="dash-heading"><div><small>DEMO WORKSPACE</small><h3>Your seller overview <span>✦</span></h3></div><button>+ Add product</button></div><div className="metrics"><div><span>Revenue this month</span><strong>₹ — — —</strong><small className="up">Demo data placeholder</small></div><div><span>Orders fulfilled</span><strong>— — —</strong><small className="up">Demo data placeholder</small></div></div><div className="chart-card"><div className="chart-head"><span>Revenue overview</span><select defaultValue="30"><option value="30">Last 30 days</option></select></div><div className="chart-area"><div className="chart-lines"><i /><i /><i /><i /></div><svg viewBox="0 0 430 105" preserveAspectRatio="none"><path d="M0 89 C35 82 45 72 69 79 S104 65 124 72 S161 37 188 57 S228 48 249 62 S276 32 300 45 S330 48 350 27 S379 45 397 15 S420 21 430 8" fill="none" stroke="#d79b37" strokeWidth="3" /></svg><div className="chart-labels"><span>Example</span><span>Example</span><span>Example</span><span>Example</span><span>Example</span></div></div></div></div>
      </div>
    </div>
    <div className="float-card float-orders"><span className="float-icon green"><Icon name="check" size={16} /></span><div><small>Orders today</small><strong>Demo placeholder</strong></div></div><div className="float-card float-profit"><span className="float-icon coral">₹</span><div><small>Profit margin</small><strong>To be calculated</strong></div></div>
  </div>
}

const salesProducts = {
  'price-manager': {
    icon: 'tag', name: 'Meesho Price Manager', short: 'Bulk catalog price management - Chrome Extension coming soon.',
    description: 'Make catalog-wide pricing changes faster and with fewer manual mistakes. Prepare the right upload file, manage variants, and keep your pricing workflow moving.',
    accent: 'gold', label: 'Built for Meesho sellers',
    features: ['Bulk price management', 'MSP / WDRP management', 'Manage multiple product variants', 'Faster catalog price updates', 'Generate a ready-to-use upload file'],
    steps: [['01', 'Choose your catalog', 'Bring the product file you already use for your store.'], ['02', 'Set your price rules', 'Review MSP, WDRP, variants, and the changes you want to make.'], ['03', 'Download and upload', 'Get a clean, ready-to-use file for your next catalog update.']],
    suitable: ['Meesho sellers managing many SKUs', 'Sellers who update prices frequently', 'Teams working with product variants'],
    faq: [['Will this update products automatically?', 'This sales page describes the planned workflow. Automatic marketplace connections will be documented when the product launches.'], ['Can I manage different variants?', 'Yes. Variant-level pricing is one of the core workflows this tool is designed to make easier.'], ['Is the upload file ready for Meesho?', 'The planned output is designed around a clean, ready-to-use catalog upload workflow. Final format details will be shared before launch.']],
  },
  'profit-calculator': {
    icon: 'chart', name: 'Price & Profit Calculator', short: 'See what you actually earn after every cost that matters.',
    description: 'Stop guessing your margins. Map product cost, packaging, GST, shipping, ads, and returns into one clear profitability view before you make a pricing decision.',
    accent: 'navy', label: 'Know your real numbers',
    features: ['Product cost calculation', 'Packaging cost inputs', 'GST and shipping impact', 'Ads cost planning', 'Return / RTO impact', 'Profit and breakeven analysis'],
    steps: [['01', 'Add your costs', 'Enter the numbers behind a product, from sourcing to packaging.'], ['02', 'Model the reality', 'Account for GST, shipping, advertising, and return impact.'], ['03', 'Make the call', 'Understand profit, margin, and breakeven before you publish.']],
    suitable: ['Sellers setting prices for new products', 'Meesho sellers reviewing real margins', 'Anyone planning ads or promotions'],
    faq: [['Does it include return and RTO impact?', 'Yes. Return and RTO impact is part of the planned calculation model so your view of profitability is more realistic.'], ['Can I compare different prices?', 'The planned experience is designed to help you test price scenarios and understand the effect on margin and breakeven.'], ['Will it replace my accounting software?', 'No. This is a seller decision tool for understanding product-level economics, not a replacement for accounting or tax filing software.']],
  },
  'pdf-crop': {
    icon: 'crop', name: 'PDF Crop', short: 'Clean up product documents with precise, simple cropping.',
    description: 'Remove unnecessary edges and whitespace from product PDFs without wrestling with complex design software. A focused workflow for getting files print-ready.',
    accent: 'coral', label: 'Simple document tools',
    features: ['Upload a PDF', 'Crop individual pages', 'Precise crop controls', 'Process and download the result', 'A simple, focused workflow'],
    steps: [['01', 'Upload your PDF', 'Start with the document that needs a cleaner frame.'], ['02', 'Set the crop', 'Use clear controls to define exactly what stays on each page.'], ['03', 'Download the result', 'Process the document and take the finished PDF to your next step.']],
    suitable: ['Sellers preparing product paperwork', 'Teams cleaning marketplace documents', 'Anyone who needs quick PDF fixes'],
    faq: [['Can I crop individual pages?', 'The planned workflow supports page-level cropping so you can keep control over the finished document.'], ['Will the original PDF be changed?', 'The tool is planned to create a processed result, keeping your original file separate.'], ['Do I need design software?', 'No. The goal is a focused crop workflow that handles this one job without the complexity of a full editor.']],
  },
  'pdf-layout': {
    icon: 'layout', name: 'PDF Layout', short: 'Arrange labels and pages into a clean, print-friendly PDF.',
    description: 'Turn scattered PDF pages into a more useful layout. Arrange labels, fit multiple items on A4, and reduce the whitespace that makes printing expensive and awkward.',
    accent: 'mint', label: 'Print smarter',
    features: ['Upload a PDF', 'Arrange pages and labels', 'A4 layout support', 'Multiple labels per page', 'Reduce unnecessary whitespace', 'Print-friendly output'],
    steps: [['01', 'Upload your pages', 'Bring in the labels or pages you need to organize.'], ['02', 'Build your layout', 'Arrange content on A4 and choose how many labels fit per page.'], ['03', 'Print with confidence', 'Export a cleaner, more space-efficient PDF for the next step.']],
    suitable: ['Sellers printing shipping labels', 'Teams batching paperwork', 'Anyone trying to reduce wasted pages'],
    faq: [['Can I arrange multiple labels per page?', 'Yes. Multiple-label layouts are a central part of the planned workflow.'], ['Is the output sized for A4?', 'The tool is designed around A4 layouts and print-friendly output.'], ['Can I reduce empty space?', 'Yes. The product is intended to help you make better use of each printed page.']],
  },
}

function SiteHeader() {
  const [open, setOpen] = useState(false)
  return <header className="nav wrap sales-nav"><a href="/" aria-label="EcomWithNabeel home"><Brand /></a><button className="sales-menu-button" aria-label="Toggle navigation" onClick={() => setOpen((current) => !current)}><Icon name={open ? 'close' : 'menu'} /></button><nav className={`sales-links ${open ? 'open' : ''}`}><a href="/" onClick={() => setOpen(false)}>Home</a><a href="/tools" onClick={() => setOpen(false)}>Tools</a><a href="/about" onClick={() => setOpen(false)}>About</a><a href="/contact" onClick={() => setOpen(false)}>Contact</a></nav><div className="nav-actions"><a className="button button-small" href="/tools">Use Free Tools <Icon name="arrow" size={16} /></a></div></header>
}

function SalesFooter() {
  return <footer className="footer wrap sales-footer"><div className="footer-top"><div><a href="/"><Brand /></a><p>Free tools for smarter<br />online selling.</p></div><div className="footer-links"><div><strong>Explore</strong><a href="/">Home</a><a href="/tools">Tools</a><a href="/about">About</a></div><div><strong>Connect</strong><a href="/contact">Contact</a><a href="/privacy">Privacy Policy</a><a href="/terms">Terms</a></div></div></div><div className="footer-bottom"><span>© 2024 EcomWithNabeel. Free tools for smarter online selling.</span><span>India <i className="india-dot" /></span></div></footer>
}

function SalesShell({ children }) { return <div className="site-shell sales-shell"><SiteHeader />{children}<SalesFooter /></div> }

function FeatureIcon({ name }) { return <span className="feature-icon"><Icon name={name} size={21} /></span> }

function ProductCard({ product, slug }) {
  const comingSoon = slug === 'price-manager'
  return <article className={`sales-product-card ${product.accent} ${comingSoon ? 'coming-soon-card' : ''}`}><div className="product-card-top"><FeatureIcon name={product.icon} /><span className="card-arrow"><Icon name="arrow" size={18} /></span></div><span className="sales-label">{comingSoon ? 'COMING SOON' : product.label}</span><h3>{product.name}</h3><p>{product.short}</p><ul>{product.features.slice(0, 3).map((feature) => <li key={feature}><Icon name="check" size={14} /> {feature}</li>)}</ul><div className="sales-card-actions">{comingSoon ? <button className="button coming-soon-button" type="button" disabled>Coming Soon</button> : <><a className="button button-outline" href={`/tools/${slug}`}>View Details</a><a className="button" href={`/tools/${slug}`}>Use Free <Icon name="arrow" size={15} /></a></>}</div></article>
}

function PriceManagerComingSoon() {
  return <SalesShell><main className="sales-main coming-soon-page"><section className="product-hero wrap navy"><div><a className="back-link" href="/tools"><Icon name="arrow" size={15} /> Back to Tools</a><div className="product-hero-icon"><FeatureIcon name="tag" /></div><span className="eyebrow"><span className="eyebrow-dot" /> Chrome Extension coming soon</span><h1>Meesho Price Manager<br /><em>is on the way.</em></h1><p>Bulk catalog price management - Chrome Extension coming soon. We are preparing the right workflow for sellers who manage pricing across many products.</p><div className="product-hero-actions"><span className="coming-soon-large">Coming Soon</span><span className="price-note">Future seller tool<small>No working tool is available yet</small></span></div></div><div className="product-hero-card"><span className="kicker">PLANNED FOR LATER</span><div className="hero-card-icon"><Icon name="tag" size={35} /></div><strong>Built for bulk catalog work</strong><p>The future Chrome Extension will be designed around a practical, seller-controlled workflow.</p><div className="hero-card-lines"><i /><i /><i /></div></div></section><section className="coming-soon-note"><div className="wrap"><span className="kicker">IN THE WORKS</span><h2>Not active yet.<br /><em>Coming as an extension.</em></h2><p>The current web app does not access Meesho accounts, catalogs, or credentials. This product remains safely set aside until its Chrome Extension version is ready.</p><a className="button button-light" href="/tools">Explore Active Free Tools <Icon name="arrow" size={16} /></a></div></section></main></SalesShell>
}

// eslint-disable-next-line no-unused-vars
function LegacyToolsPage() {
  return <SalesShell><main className="sales-main"><section className="tools-hero wrap"><div className="sales-hero-copy"><span className="eyebrow"><span className="eyebrow-dot" /> Seller tools, made practical</span><h1>Small tools. <em>Serious leverage.</em></h1><p>Focused tools for the work that happens between getting an order and growing a real e-commerce business.</p><div className="hero-actions"><a className="button" href="#tools-grid">Explore the toolkit <Icon name="arrow" /></a><a className="text-link" href="#how-it-works">See How It Works <Icon name="arrow" size={17} /></a></div></div><div className="tools-hero-art"><div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" /><div className="art-panel"><span>YOUR SELLER TOOLKIT</span><strong>More clarity.<br /><em>Less busywork.</em></strong><div className="art-row"><span><Icon name="tag" size={16} /> Pricing</span><span><Icon name="chart" size={16} /> Profit</span></div><div className="art-row"><span><Icon name="crop" size={16} /> PDFs</span><span><Icon name="layout" size={16} /> Layouts</span></div></div></div></section><section className="sales-intro-band"><div className="wrap sales-band-inner"><span>DESIGNED FOR</span><strong>Indian e-commerce sellers</strong><span className="band-dot" /><strong>Meesho workflows</strong><span className="band-dot" /><strong>Everyday momentum</strong></div></section><section className="sales-section wrap" id="tools-grid"><div className="section-intro"><div><span className="kicker">THE TOOLKIT</span><h2>Pick the problem<br /><em>you want solved.</em></h2></div><p>Start with one workflow. Add more when you are ready. Each tool is made to be useful on its own.</p></div><div className="sales-products-grid">{Object.entries(salesProducts).map(([slug, product]) => <ProductCard key={slug} slug={slug} product={product} />)}</div></section><section className="sales-how" id="how-it-works"><div className="wrap"><div className="center-intro"><span className="kicker">HOW IT WORKS</span><h2>Choose your friction.<br /><em>Remove it.</em></h2><p>No sprawling software suite to learn. Just practical tools that fit the way sellers already work.</p></div><div className="sales-steps"><div><b>01</b><h3>Choose a tool</h3><p>Find the workflow that is taking too much of your time.</p></div><div><b>02</b><h3>Make a clearer move</h3><p>Use a focused tool built around the decision in front of you.</p></div><div><b>03</b><h3>Keep growing</h3><p>Put the time and confidence back into your store.</p></div></div></div></section><section className="sales-cta-band" id="resources"><div className="wrap"><span className="kicker">BUILT FOR THE REAL WORLD</span><h2>One better workflow<br /><em>at a time.</em></h2><a className="button button-light" href="#tools-grid">Explore Seller Tools <Icon name="arrow" /></a></div></section></main></SalesShell>
}

function FAQList({ items }) {
  const [open, setOpen] = useState(0)
  return <div className="faq-list sales-faq-list">{items.map(([question, answer], index) => <div className={`faq-item ${open === index ? 'active' : ''}`} key={question}><button onClick={() => setOpen(open === index ? -1 : index)} aria-expanded={open === index}><span>{question}</span><Icon name={open === index ? 'close' : 'plus'} size={18} /></button>{open === index && <p>{answer}</p>}</div>)}</div>
}

function ProductPage({ product, slug }) {
  return <SalesShell><main className="sales-main product-main"><section className={`product-hero wrap ${product.accent}`}><div><a className="back-link" href="/tools"><Icon name="arrow" size={15} /> Back to Tools</a><div className="product-hero-icon"><FeatureIcon name={product.icon} /></div><span className="eyebrow"><span className="eyebrow-dot" /> {product.label}</span><h1>{product.name}<br /><em>made simpler.</em></h1><p>{product.description}</p><div className="product-hero-actions"><a className="button" href={`/tools/${slug}`}>Try Now - Free <Icon name="arrow" /></a><span className="price-note">Free to use<small>No payment details required</small></span></div></div><div className="product-hero-card"><span className="kicker">A clearer way to work</span><div className="hero-card-icon"><Icon name={product.icon} size={35} /></div><strong>{product.features[0]}</strong><p>One focused workflow, designed around the work sellers already do.</p><div className="hero-card-lines"><i /><i /><i /></div></div></section><section className="product-overview wrap"><div><span className="kicker">WHAT YOU GET</span><h2>Made for the details<br /><em>that add up.</em></h2></div><div className="feature-list">{product.features.map((feature) => <div key={feature}><Icon name="check" size={16} /><span>{feature}</span></div>)}</div></section><section className="product-how"><div className="wrap"><div className="center-intro"><span className="kicker">HOW IT WORKS</span><h2>From friction<br /><em>to flow.</em></h2><p>A focused three-step workflow that keeps the busywork out of the way.</p></div><div className="product-steps">{product.steps.map(([number, title, text]) => <div key={number}><span>{number}</span><div><h3>{title}</h3><p>{text}</p></div></div>)}</div></div></section><section className="suitable-section wrap"><div className="suitable-art"><div className="suitable-art-mark">{product.icon === 'chart' ? '₹' : product.icon === 'tag' ? '%' : '▦'}</div></div><div><span className="kicker">IS THIS FOR YOU?</span><h2>Useful where<br /><em>you are.</em></h2><p>This tool is a good fit when you want a simpler, more dependable way to handle the work behind your store.</p><ul>{product.suitable.map((item) => <li key={item}><Icon name="check" size={16} /> {item}</li>)}</ul></div></section><section className="free-cta-section"><div className="wrap free-cta-inner"><div><span className="kicker">READY WHEN YOU ARE</span><h2>Make the next move<br /><em>with more clarity.</em></h2><p>Start using this tool free and put a better workflow to work today.</p></div><a className="button button-light" href={`/tools/${slug}`}>Use Free <Icon name="arrow" size={16} /></a></div></section><section className="product-faq wrap" id="faq"><div><span className="kicker">QUESTIONS, ANSWERED</span><h2>Good to<br /><em>know.</em></h2></div><FAQList items={product.faq} /></section></main></SalesShell>
}

// eslint-disable-next-line no-unused-vars
function LegacyHomePage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [openFaq, setOpenFaq] = useState(0)
  const closeMenu = () => setMenuOpen(false)
  return <div className="site-shell">
    <header className="nav wrap"><a href="#top" aria-label="EcomWithNabeel home"><Brand /></a><button className="menu-button" aria-label={menuOpen ? 'Close menu' : 'Open menu'} onClick={() => setMenuOpen(!menuOpen)}><Icon name={menuOpen ? 'close' : 'menu'} /></button><nav className={menuOpen ? 'nav-links open' : 'nav-links'}><a href="#products" onClick={closeMenu}>Tools</a><a href="#how-it-works" onClick={closeMenu}>How It Works</a><a href="#products" onClick={closeMenu}>Free Tools</a><a href="#resources" onClick={closeMenu}>Resources</a></nav><div className="nav-actions"><a className="login" href="#footer">Login</a><a className="button button-small" href="#products">Use Tools Free <Icon name="arrow" size={16} /></a></div></header>
    <main id="top">
      <section className="hero wrap"><div className="hero-copy"><div className="eyebrow"><span className="eyebrow-dot" /> Built for smarter e-commerce sellers</div><h1>Powerful tools built to help you <em>sell smarter.</em></h1><p className="hero-lede">Save time, reduce costs, and grow your e-commerce business with powerful seller tools built for the real-world needs of Indian sellers.</p><div className="hero-actions"><a className="button" href="#products">Explore Seller Tools <Icon name="arrow" /></a><a className="text-link" href="#how-it-works">See How It Works <Icon name="arrow" size={17} /></a></div><p className="microcopy"><span className="micro-check"><Icon name="check" size={13} /></span> Built for Indian sellers <span className="micro-divider" /> Made for momentum</p></div><DashboardPreview /></section>
      <section className="trust-strip"><div className="wrap trust-inner"><span>MADE FOR SELLERS WHO ARE</span><div className="trust-word">BUILDING <b>BRANDS</b></div><div className="trust-word">MOVING <b>SMARTER</b></div><div className="trust-word">GROWING <b>DAILY</b></div></div></section>
      <section className="section wrap" id="products"><div className="section-intro"><div><span className="kicker">THE TOOLKIT</span><h2>Everything you need to<br /><em>sell with confidence.</em></h2></div><p>One focused toolkit for the everyday tasks that slow sellers down. Simple enough to start today, powerful enough to grow with you.</p></div><div className="product-grid">{products.map(([icon, title, text, tone]) => <article className={`product-card ${tone}`} key={title}><div className="product-icon"><Icon name={icon} size={23} /></div><span className="card-arrow"><Icon name="arrow" size={18} /></span><h3>{title}</h3><p>{text}</p><a href="#pricing">Learn more <Icon name="arrow" size={15} /></a></article>)}</div></section>
      <section className="how-section" id="how-it-works"><div className="wrap"><div className="center-intro"><span className="kicker">HOW IT WORKS</span><h2>Less busywork.<br /><em>More business.</em></h2><p>EcomWithNabeel makes the messy parts of selling feel remarkably simple.</p></div><div className="steps"><div className="step"><span className="step-number">01</span><div className="step-line" /><h3>Pick your workflow</h3><p>Choose the tools that match the way you sell today.</p></div><div className="step"><span className="step-number">02</span><div className="step-line" /><h3>Make it your own</h3><p>Set your preferences once. We will handle the repetition.</p></div><div className="step"><span className="step-number">03</span><div className="step-line" /><h3>Get more done</h3><p>Put your time back where it makes the biggest difference.</p></div></div></div></section>
      <section className="benefit-section wrap"><div className="benefit-art"><div className="benefit-note note-one">⌁ Built for flow</div><div className="benefit-note note-two"><Icon name="check" size={15} /> More margin, less manual work</div><div className="rings"><span /><span /><span /><b>en</b></div></div><div className="benefit-copy"><span className="kicker">WHY ECOMWITHNABEEL</span><h2>Your store is growing.<br /><em>Your tools should too.</em></h2><p>The right systems give you back more than time. They give you clarity, control, and the confidence to make your next move.</p><ul><li><span><Icon name="check" size={16} /></span> Spend less time fixing tiny problems</li><li><span><Icon name="check" size={16} /></span> Make decisions with better numbers</li><li><span><Icon name="check" size={16} /></span> Build a business that runs lighter</li></ul></div></section>
      <section className="quote-section"><div className="wrap quote-inner"><span className="quote-mark">“</span><blockquote>Real seller stories will live here as EcomWithNabeel grows. We will let the people using these tools tell that story in their own words.</blockquote><div className="quote-person"><div className="person-placeholder">?</div><div><strong>Seller story coming soon</strong><span>Real customer feedback will appear here at launch.</span></div></div></div></section>
      <section className="pricing-section wrap" id="pricing"><div className="center-intro"><span className="kicker">SIMPLE PRICING</span><h2>Start small.<br /><em>Scale when ready.</em></h2><p>Choose the toolkit that fits your stage. Change your plan as your business changes.</p></div><div className="pricing-card"><div className="plan plan-free"><span className="plan-label">STARTER</span><h3>Essentials</h3><p>For sellers getting their systems in place.</p><div className="price"><strong>₹0</strong><span> / forever</span></div><a className="button button-outline" href="#footer">Join the waitlist <Icon name="arrow" size={16} /></a><ul><li><Icon name="check" size={15} /> Access to starter tools</li><li><Icon name="check" size={15} /> Personal workspace</li><li><Icon name="check" size={15} /> Helpful resources</li></ul></div><div className="plan plan-pro"><div className="popular">MOST POPULAR</div><span className="plan-label">FOR GROWING SELLERS</span><h3>Momentum</h3><p>For sellers ready to make every hour count.</p><div className="price"><strong>Coming soon</strong></div><a className="button button-light" href="#footer">Get early access <Icon name="arrow" size={16} /></a><ul><li><Icon name="check" size={15} /> All six seller tools</li><li><Icon name="check" size={15} /> Smart automations</li><li><Icon name="check" size={15} /> Priority support</li></ul></div></div><p className="pricing-note">No fake promises. Pricing details will be shared before launch.</p></section>
      <section className="faq-section wrap" id="faq"><div className="faq-title"><span className="kicker">QUESTIONS, ANSWERED</span><h2>Good to<br /><em>know.</em></h2><p>Still curious? We are building EcomWithNabeel in the open. More answers are on the way.</p></div><div className="faq-list">{faqs.map(([question, answer], index) => <div className={`faq-item ${openFaq === index ? 'active' : ''}`} key={question}><button onClick={() => setOpenFaq(openFaq === index ? -1 : index)} aria-expanded={openFaq === index}><span>{question}</span><Icon name={openFaq === index ? 'close' : 'plus'} size={18} /></button>{openFaq === index && <p>{answer}</p>}</div>)}</div></section>
      <section className="final-cta"><div className="wrap final-inner"><div><span className="kicker">YOUR NEXT MOVE</span><h2>Make room for<br /><em>what matters.</em></h2></div><div><p>Build your store with tools that do more of the heavy lifting.</p><a className="button button-light" href="#products">Explore Seller Tools <Icon name="arrow" /></a></div></div></section>
    </main>
    <footer className="footer wrap" id="footer"><div className="footer-top"><div><a href="#top"><Brand /></a><p>Tools for the work behind<br />every successful store.</p></div><div className="footer-links" id="resources"><div><strong>Explore</strong><a href="#products">Tools</a><a href="#how-it-works">How It Works</a><a href="#pricing">Pricing</a></div><div><strong>Company</strong><a href="#faq">FAQ</a><a href="#footer">Contact</a><a href="#footer">Privacy</a></div><div><strong>Follow along</strong><a href="#footer">Instagram</a><a href="#footer">LinkedIn</a><a href="#footer">YouTube</a></div></div></div><div className="footer-bottom"><span>© 2024 EcomWithNabeel. Made for ambitious sellers.</span><span>India <i className="india-dot" /></span></div></footer>
  </div>
}

function FreeToolCard({ icon, title, description, href, accent, comingSoon = false }) {
  return <article className={`home-tool-card ${accent} ${comingSoon ? 'home-coming-card' : ''}`}><div className="home-tool-icon"><FeatureIcon name={icon} /></div><span className="home-tool-label">{comingSoon ? 'COMING SOON' : 'FREE TOOL'}</span><h3>{title}</h3><p>{description}</p>{comingSoon ? <button className="button coming-soon-button" disabled>Coming Soon</button> : <a className="button" href={href}>Use Free <Icon name="arrow" size={15} /></a>}</article>
}

function HomePagePolished() {
  return <SalesShell><main className="polished-home"><section className="home-hero wrap"><div><span className="eyebrow"><span className="eyebrow-dot" /> Free tools for smarter online selling</span><h1>Run your store with <em>more clarity.</em></h1><p>Practical, free tools for Indian online sellers to calculate profit, clean documents, and get more done every day.</p><div className="hero-actions"><a className="button" href="/tools">Explore Free Tools <Icon name="arrow" /></a><a className="text-link" href="#home-tools">See what is included <Icon name="arrow" size={17} /></a></div><div className="home-proof"><span><Icon name="check" size={14} /> Completely free</span><span><Icon name="check" size={14} /> Works in your browser</span></div></div><div className="home-hero-art"><div className="home-art-card"><span>YOUR DAILY EDGE</span><strong>Calculate.<br /><em>Clean. Create.</em></strong><div className="home-art-bars"><i /><i /><i /><i /></div></div><div className="home-art-note">3 free tools<br /><small>one lighter workflow</small></div></div></section><section className="home-tools-section" id="home-tools"><div className="wrap"><div className="section-intro"><div><span className="kicker">THE FREE TOOLKIT</span><h2>Useful tools for<br /><em>the work behind selling.</em></h2></div><p>No subscriptions or complicated setup. Choose a tool, bring your own numbers or files, and get a useful result.</p></div><div className="home-tool-grid"><FreeToolCard icon="chart" title="Price & Profit Calculator" description="See your real profit after GST, shipping, ads, packaging, and returns." href="/tools/profit-calculator" accent="navy" /><FreeToolCard icon="crop" title="PDF Crop" description="Crop PDF pages precisely and create a clean file in your browser." href="/tools/pdf-crop" accent="coral" /><FreeToolCard icon="layout" title="PDF Layout" description="Arrange shipping pages into print-friendly A4 sheets with ease." href="/tools/pdf-layout" accent="mint" /><FreeToolCard icon="tag" title="Meesho Price Manager" description="Bulk catalog price management - Chrome Extension coming soon." accent="gold" comingSoon /></div></div></section><section className="home-why"><div className="wrap home-why-inner"><div><span className="kicker">BUILT FOR REAL WORK</span><h2>Less switching.<br /><em>More doing.</em></h2></div><p>EcomWithNabeel keeps the small, important workflows of online selling close at hand, without pretending to replace the platforms you already use.</p><a className="button button-light" href="/tools">Use Free Tools <Icon name="arrow" size={16} /></a></div></section></main></SalesShell>
}

function InfoPage({ type }) {
  const about = type === 'about'
  return <SalesShell><main className="info-page wrap"><span className="eyebrow"><span className="eyebrow-dot" /> EcomWithNabeel</span><h1>{about ? <>Tools that make<br /><em>selling lighter.</em></> : <>Let’s make<br /><em>work simpler.</em></>}</h1><p>{about ? 'EcomWithNabeel is a growing collection of free, focused tools for Indian online sellers. We build practical browser experiences for the work that happens between an order, a spreadsheet, and a successful store.' : 'Have a question, a useful idea, or a workflow you would like to see made simpler? We are building EcomWithNabeel in the open.'}</p><div className="info-panel"><strong>{about ? 'Our approach' : 'Get in touch'}</strong><span>{about ? 'Clear inputs. Honest outputs. No unnecessary complexity.' : 'Contact details will be added here as the project moves toward launch.'}</span></div><a className="button" href="/tools">Explore Free Tools <Icon name="arrow" size={16} /></a></main></SalesShell>
}

function PageMetadata({ path }) {
  useEffect(() => {
    const pages = { '/': ['EcomWithNabeel - Free tools for smarter online selling', 'Free browser tools for Indian online sellers to calculate profit, crop PDFs, and arrange print-ready layouts.'], '/tools': ['Free Seller Tools - EcomWithNabeel', 'Simple free tools built to help online sellers save time, calculate profit, and manage everyday work.'], '/tools/profit-calculator': ['Price & Profit Calculator - EcomWithNabeel', 'Calculate real seller profit after GST, shipping, ads, packaging, and returns.'], '/tools/pdf-crop': ['PDF Crop - EcomWithNabeel', 'Crop PDF pages precisely and create a clean, ready-to-use PDF locally in your browser.'], '/tools/pdf-layout': ['PDF Layout - EcomWithNabeel', 'Arrange shipping PDF pages onto clean, print-friendly A4 sheets in your browser.'], '/about': ['About EcomWithNabeel', 'Learn about EcomWithNabeel and our practical free tools for Indian online sellers.'], '/contact': ['Contact EcomWithNabeel', 'Contact EcomWithNabeel about free seller tools and useful workflow ideas.'] }
    const [title, description] = pages[path] || pages['/']
    document.title = title
    let meta = document.querySelector('meta[name="description"]')
    if (!meta) { meta = document.createElement('meta'); meta.name = 'description'; document.head.appendChild(meta) }
    meta.content = description
  }, [path])
  return null
}

function FreeToolsPage() {
  return <SalesShell><main className="free-tools-page"><section className="free-tools-hero wrap"><span className="eyebrow"><span className="eyebrow-dot" /> EcomWithNabeel toolkit</span><h1>Free Seller <em>Tools.</em></h1><p>Simple tools built to help online sellers save time, calculate profit and manage their everyday work.</p><a className="button" href="#free-tools-grid">Explore Free Tools <Icon name="arrow" size={16} /></a></section><section className="free-tools-grid-section" id="free-tools-grid"><div className="wrap"><div className="free-tools-heading"><div><span className="kicker">AVAILABLE NOW</span><h2>Three tools.<br /><em>Zero cost.</em></h2></div><p>Use them directly in your browser. No subscription, no payment details, and no unnecessary setup.</p></div><div className="home-tool-grid"><FreeToolCard icon="chart" title="Price & Profit Calculator" description="See your real profit after GST, shipping, ads, packaging, and returns." href="/tools/profit-calculator" accent="navy" /><FreeToolCard icon="crop" title="PDF Crop" description="Crop PDF pages precisely and create a clean file in your browser." href="/tools/pdf-crop" accent="coral" /><FreeToolCard icon="layout" title="PDF Layout" description="Arrange shipping pages into print-friendly A4 sheets with ease." href="/tools/pdf-layout" accent="mint" /></div><div className="tools-coming-row"><div><span className="home-tool-label">COMING SOON</span><h3>Meesho Price Manager</h3><p>Bulk catalog price management - Chrome Extension coming soon.</p></div><span className="coming-soon-large">Coming Soon</span></div></div></section><section className="home-why"><div className="wrap home-why-inner"><div><span className="kicker">BUILT FOR REAL WORK</span><h2>One lighter<br /><em>workflow.</em></h2></div><p>Focused tools for the everyday details behind online selling, designed to stay useful as your store grows.</p><a className="button button-light" href="/">Back Home <Icon name="arrow" size={16} /></a></div></section></main></SalesShell>
}

function App() {
  const path = window.location.pathname.replace(/\/$/, '') || '/'
  const page = path === '/tools/profit-calculator' ? <ProfitCalculator /> : path === '/tools/price-manager' ? <PriceManagerComingSoon /> : path === '/tools/pdf-crop' ? <PdfCrop /> : path === '/tools/pdf-layout' ? <PdfLayout /> : path === '/tools' ? <FreeToolsPage /> : path === '/about' ? <InfoPage type="about" /> : path === '/contact' ? <InfoPage type="contact" /> : path.startsWith('/tools/') && salesProducts[path.split('/')[2]] ? <ProductPage product={salesProducts[path.split('/')[2]]} slug={path.split('/')[2]} /> : <HomePagePolished />
  return <><PageMetadata path={path} />{page}</>
  /*
  if (path === '/tools') return <ToolsPage />
  if (path === '/tools/profit-calculator') return <ProfitCalculator />
  if (path === '/tools/price-manager') return <PriceManagerComingSoon />
  if (path === '/tools/pdf-crop') return <PdfCrop />
  if (path === '/tools/pdf-layout') return <PdfLayout />
  if (path.startsWith('/tools/')) {
    const slug = path.split('/')[2]
    if (salesProducts[slug]) return <ProductPage product={salesProducts[slug]} slug={slug} />
  }
  return <HomePage />
  */
}

export default App
