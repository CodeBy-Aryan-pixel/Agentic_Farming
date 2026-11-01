/**
 * Future Farming — High-Fidelity Devanagari-Safe PDF User Manual Generator
 * 
 * Supports:
 * - English ('en')
 * - Marathi ('mr' — मराठी)
 * - Hindi ('hi' — हिंदी)
 * - Trilingual Combined ('all' — EN + मराठी + हिंदी)
 * 
 * Dual Export Engine:
 * 1. Automatic rasterized high-resolution PDF download via html2pdf.js
 * 2. Instant native vector PDF export via window.print() (@media print CSS)
 * 
 * Visible Full-Viewport Overlay pattern prevents blank-canvas drops from
 * off-screen (-9999px) or scroll-offset containers.
 */

export interface GuideStep {
  number: string;
  title: string;
  instruction: string;
  proTip: string;
}

export interface GuideModule {
  id: string;
  filterKey: string;
  moduleNumber: string;
  title: string;
  summary: string;
  iconName: string;
  iconColor: string;
  route: any;
  actionButtonText: string;
  steps: GuideStep[];
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface GuideLanguageContent {
  heroBadge: string;
  heroTitle: string;
  heroSubtitle: string;
  listenAllBtn: string;
  stopAudioBtn: string;
  allModulesTab: string;
  listenModuleBtn: string;
  proTipLabel: string;
  faqSectionTitle: string;
  faqSectionSubtitle: string;
  helpdeskTitle: string;
  helpdeskSub: string;
  callCentreBtn: string;
  chatAssistantBtn: string;
  modules: GuideModule[];
  faqs: FaqItem[];
}

export type GuideLanguageMap = Record<'en' | 'mr' | 'hi', GuideLanguageContent>;

export function generateManualInnerHtml(
  langMode: 'en' | 'mr' | 'hi' | 'all',
  contentMap: GuideLanguageMap
): string {
  const languagesToRender: { key: 'en' | 'mr' | 'hi'; label: string; content: GuideLanguageContent }[] =
    langMode === 'all'
      ? [
          { key: 'en', label: 'English Manual', content: contentMap.en },
          { key: 'mr', label: 'मराठी आवृत्ती (Marathi Edition)', content: contentMap.mr },
          { key: 'hi', label: 'हिंदी संस्करण (Hindi Edition)', content: contentMap.hi },
        ]
      : [
          {
            key: langMode,
            label:
              langMode === 'mr'
                ? 'मराठी शेतकरी मार्गदर्शिका (Marathi Edition)'
                : langMode === 'hi'
                ? 'हिंदी किसान उपयोगकर्ता पुस्तिका (Hindi Edition)'
                : 'English User Manual (Official Edition)',
            content: contentMap[langMode],
          },
        ];

  const currentDate = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return `
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Sans+Devanagari:wght@400;500;600;700;800&display=swap');

    #ff-printable-manual-sheet {
      font-family: 'Inter', 'Noto Sans Devanagari', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #111827;
      line-height: 1.5;
      font-size: 13px;
      background: #FFFFFF;
      box-sizing: border-box;
      -webkit-font-smoothing: antialiased;
    }

    #ff-printable-manual-sheet * {
      box-sizing: border-box;
    }

    /* ─── Official Header Banner ─── */
    .header-banner {
      background-color: #0F291E;
      color: #FFFFFF;
      border-radius: 12px;
      padding: 22px 24px;
      margin-bottom: 20px;
      border-left: 6px solid #15803D;
      page-break-inside: avoid;
    }

    .brand-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .brand-title {
      font-size: 20px;
      font-weight: 800;
      letter-spacing: 0.5px;
      color: #FFFFFF;
    }

    .brand-badge {
      display: inline-block;
      background-color: #15803D;
      color: #FFFFFF;
      font-size: 10px;
      font-weight: 700;
      padding: 4px 8px;
      border-radius: 6px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .edition-tag {
      font-size: 11px;
      color: #86EFAC;
      font-weight: 700;
      margin-bottom: 4px;
      letter-spacing: 0.5px;
    }

    .header-title {
      font-size: 18px;
      font-weight: 800;
      color: #FFFFFF;
      margin-bottom: 6px;
      line-height: 1.3;
    }

    .header-subtitle {
      font-size: 12px;
      color: #D1FAE5;
      line-height: 1.4;
    }

    .meta-bar {
      margin-top: 14px;
      padding-top: 10px;
      border-top: 1px solid rgba(255, 255, 255, 0.15);
      display: flex;
      justify-content: space-between;
      font-size: 10.5px;
      color: #A7F3D0;
    }

    /* ─── Quick Summary Table ─── */
    .summary-box {
      background-color: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 10px;
      padding: 14px 16px;
      margin-bottom: 22px;
      page-break-inside: avoid;
    }

    .summary-title {
      font-size: 13px;
      font-weight: 700;
      color: #0F291E;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }

    .summary-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px 16px;
      font-size: 11.5px;
    }

    .summary-item {
      display: flex;
      align-items: baseline;
      gap: 6px;
    }

    .summary-num {
      font-weight: 700;
      color: #15803D;
      font-variant-numeric: tabular-nums;
    }

    /* ─── Section Header (for Trilingual) ─── */
    .section-divider {
      background-color: #EDF5EE;
      border-left: 4px solid #15803D;
      padding: 10px 14px;
      border-radius: 6px;
      margin: 24px 0 16px 0;
      font-size: 15px;
      font-weight: 800;
      color: #0F291E;
      page-break-after: avoid;
    }

    /* ─── Module Card ─── */
    .module-card {
      background-color: #FFFFFF;
      border: 1px solid #E6ECE6;
      border-radius: 10px;
      padding: 16px;
      margin-bottom: 18px;
    }

    .ff-pdf-card {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }

    .module-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 6px;
    }

    .module-badge {
      font-size: 10px;
      font-weight: 800;
      color: #15803D;
      background-color: #DCFCE7;
      padding: 2px 7px;
      border-radius: 4px;
      letter-spacing: 0.3px;
      font-variant-numeric: tabular-nums;
    }

    .module-title {
      font-size: 15px;
      font-weight: 800;
      color: #0F291E;
      margin-bottom: 4px;
      line-height: 1.3;
    }

    .module-summary {
      font-size: 11.5px;
      color: #4B5563;
      margin-bottom: 12px;
      line-height: 1.4;
    }

    /* ─── 4 Steps Grid (2x2) ─── */
    .steps-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }

    .step-box {
      background-color: #FAFAFA;
      border: 1px solid #E5E7EB;
      border-radius: 8px;
      padding: 10px 12px;
      display: flex;
      flex-direction: column;
    }

    .step-top {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 4px;
    }

    .step-pill {
      background-color: #15803D;
      color: #FFFFFF;
      font-size: 10px;
      font-weight: 700;
      padding: 1px 6px;
      border-radius: 4px;
      font-variant-numeric: tabular-nums;
    }

    .step-title {
      font-size: 11.5px;
      font-weight: 700;
      color: #111827;
      line-height: 1.25;
    }

    .step-instruction {
      font-size: 10.5px;
      color: #374151;
      line-height: 1.4;
      margin-bottom: 6px;
      flex: 1;
    }

    .protip-box {
      background-color: #EDF5EE;
      border-left: 3px solid #15803D;
      padding: 4px 6px;
      border-radius: 3px;
      font-size: 9.5px;
      color: #166534;
      line-height: 1.35;
    }

    .protip-label {
      font-weight: 700;
      color: #15803D;
      margin-right: 3px;
    }

    /* ─── FAQ Section ─── */
    .faq-section {
      background-color: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 10px;
      padding: 14px 16px;
      margin-top: 18px;
      page-break-inside: avoid;
    }

    .faq-header {
      font-size: 13px;
      font-weight: 800;
      color: #0F291E;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }

    .faq-item {
      margin-bottom: 8px;
      padding-bottom: 8px;
      border-bottom: 1px solid #E2E8F0;
    }

    .faq-item:last-child {
      border-bottom: none;
      margin-bottom: 0;
      padding-bottom: 0;
    }

    .faq-question {
      font-size: 11.5px;
      font-weight: 700;
      color: #15803D;
      margin-bottom: 3px;
    }

    .faq-answer {
      font-size: 10.5px;
      color: #374151;
      line-height: 1.4;
    }

    /* ─── Footer ─── */
    .doc-footer {
      margin-top: 24px;
      padding-top: 12px;
      border-top: 2px solid #E5E7EB;
      text-align: center;
      font-size: 10px;
      color: #6B7280;
      page-break-inside: avoid;
    }

    .doc-footer strong {
      color: #0F291E;
    }

    .page-break {
      page-break-before: always;
      margin-top: 20px;
    }

    /* ─── Crisp Print Media Styles ─── */
    @media print {
      body {
        background: #FFFFFF !important;
      }
      body > *:not(#ff-pdf-export-overlay) {
        display: none !important;
      }
      #ff-pdf-export-overlay {
        position: static !important;
        overflow: visible !important;
        padding: 0 !important;
        margin: 0 !important;
        width: 100% !important;
        background: #FFFFFF !important;
      }
      #ff-pdf-top-bar {
        display: none !important;
      }
      #ff-printable-manual-sheet {
        width: 100% !important;
        max-width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      .ff-pdf-card {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      .page-break {
        page-break-before: always !important;
        break-before: page !important;
      }
    }
  </style>

  <!-- Header Banner -->
  <div class="header-banner">
    <div class="brand-row">
      <div class="brand-title">FUTURE FARMING</div>
      <div class="brand-badge">PRECISION AGRICULTURE</div>
    </div>
    <div class="edition-tag">OFFICIAL FIELD TRAINING MANUAL • EDITION 2026</div>
    <div class="header-title">Farmer's Complete Step-by-Step User Manual</div>
    <div class="header-subtitle">
      Comprehensive guide to crop disease diagnosis, precision drip irrigation, FPO subsidized store, live mandi prices, and government schemes.
    </div>
    <div class="meta-bar">
      <span>Region: Kolhapur & Maharashtra Agricultural Command</span>
      <span>Issued: ${currentDate}</span>
      <span>Toll-Free Helpline: 1800-180-1551</span>
    </div>
  </div>

  <!-- Quick Reference Summary Box -->
  <div class="summary-box ff-pdf-card">
    <div class="summary-title">App Module Directory & Quick Reference</div>
    <div class="summary-grid">
      <div class="summary-item"><span class="summary-num">01.</span> <strong>Dashboard (/dashboard):</strong> 4-Plot live soil moisture & NPK telemetry</div>
      <div class="summary-item"><span class="summary-num">02.</span> <strong>Crop Doctor (/crop-doctor):</strong> 128x128 lesion scan & certified cures</div>
      <div class="summary-item"><span class="summary-num">03.</span> <strong>Irrigation (/weather-irrigation):</strong> Hyper-local ETc water budgeting & rain-lock</div>
      <div class="summary-item"><span class="summary-num">04.</span> <strong>Agri-Shop (/agri-shop):</strong> Genuine fertilizers, Razorpay & 5-stage tracking</div>
      <div class="summary-item"><span class="summary-num">05.</span> <strong>Mandi Markets (/market-advisor):</strong> APMC live rates & 7-day price forecasts</div>
      <div class="summary-item"><span class="summary-num">06.</span> <strong>Govt. Schemes (/govt-schemes):</strong> PM-KISAN, MahaDBT & subsidy applications</div>
    </div>
  </div>

  ${languagesToRender
    .map((langBlock, blockIndex) => {
      const { label, content } = langBlock;
      return `
      ${langMode === 'all' && blockIndex > 0 ? '<div class="page-break"></div>' : ''}
      ${langMode === 'all' ? `<div class="section-divider">${label}</div>` : ''}

      ${content.modules
        .map((mod) => `
        <div class="module-card ff-pdf-card">
          <div class="module-header">
            <span class="module-badge">${mod.moduleNumber}</span>
          </div>
          <div class="module-title">${mod.title}</div>
          <div class="module-summary">${mod.summary}</div>

          <div class="steps-grid">
            ${mod.steps
              .map(
                (step) => `
              <div class="step-box">
                <div class="step-top">
                  <span class="step-pill">Step ${step.number}</span>
                  <span class="step-title">${step.title}</span>
                </div>
                <div class="step-instruction">${step.instruction}</div>
                <div class="protip-box">
                  <span class="protip-label">${content.proTipLabel}:</span>${step.proTip}
                </div>
              </div>
            `
              )
              .join('')}
          </div>
        </div>
      `)
        .join('')}

      <!-- Troubleshooting & FAQs -->
      <div class="faq-section ff-pdf-card">
        <div class="faq-header">${content.faqSectionTitle}</div>
        ${content.faqs
          .map(
            (faq) => `
          <div class="faq-item">
            <div class="faq-question">Q: ${faq.question}</div>
            <div class="faq-answer">${faq.answer}</div>
          </div>
        `
          )
          .join('')}
      </div>
    `;
    })
    .join('')}

  <!-- Official Document Footer -->
  <div class="doc-footer ff-pdf-card">
    <p><strong>Future Farming Precision Agriculture Platform</strong> • Designed for Smallholder & Commercial Farmers across India.</p>
    <p>Toll-Free Kisan Call Centre: <strong>1800-180-1551</strong> • AI Farm Assistant Available 24/7 in English, मराठी & हिंदी.</p>
    <p style="margin-top: 4px; font-size: 9px; color: #9CA3AF;">© 2026 Future Farming Systems. Certified for Maharashtra FPO Network & Krishi Vigyan Kendra (KVK).</p>
  </div>
`;
}

export function generateManualHtml(
  langMode: 'en' | 'mr' | 'hi' | 'all',
  contentMap: GuideLanguageMap
): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Future Farming — Step-by-Step Farmer's User Manual</title>
</head>
<body style="background:#FFFFFF;margin:0;padding:10px;">
  <div style="width:790px;margin:0 auto;" id="ff-printable-manual-sheet">
    ${generateManualInnerHtml(langMode, contentMap)}
  </div>
</body>
</html>`;
}

/**
 * Downloads or prints the user manual as a PDF in the chosen language.
 * Uses a visible full-viewport overlay mounted directly on document.body,
 * guaranteeing html2pdf / html2canvas will NEVER snapshot a blank white sheet.
 * Also provides an instant "Save / Print Crisp Vector PDF" button for selectable text.
 */
export async function downloadUserManualPdf(
  langMode: 'en' | 'mr' | 'hi' | 'all',
  contentMap?: GuideLanguageMap,
  onProgress?: (status: string) => void
): Promise<void> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  const fileNames: Record<string, string> = {
    en: 'Future_Farming_User_Manual_English.pdf',
    mr: 'Future_Farming_User_Manual_Marathi.pdf',
    hi: 'Future_Farming_User_Manual_Hindi.pdf',
    all: 'Future_Farming_User_Manual_Trilingual_Complete.pdf',
  };

  const filename = fileNames[langMode] || 'Future_Farming_User_Manual.pdf';
  onProgress?.(`Preparing ${filename}...`);

  // Remove existing overlay if present
  const existingOverlay = document.getElementById('ff-pdf-export-overlay');
  if (existingOverlay) {
    existingOverlay.remove();
  }

  // 1. Create a Visible Full-Viewport Overlay Mounted directly on document.body
  const overlay = document.createElement('div');
  overlay.id = 'ff-pdf-export-overlay';
  overlay.style.cssText =
    'position:fixed;inset:0;z-index:999999;background:#FFFFFF;overflow-y:auto;padding:0;margin:0;';

  // Sticky top control bar marked with data-html2canvas-ignore="true"
  const topBar = document.createElement('div');
  topBar.id = 'ff-pdf-top-bar';
  topBar.setAttribute('data-html2canvas-ignore', 'true');
  topBar.style.cssText =
    'position:sticky;top:0;z-index:10000;background:#0F291E;color:#FFFFFF;padding:12px 24px;display:flex;align-items:center;justify-content:space-between;box-shadow:0 2px 10px rgba(0,0,0,0.25);border-bottom:2px solid #15803D;font-family:system-ui,-apple-system,sans-serif;';

  const leftBox = document.createElement('div');
  leftBox.style.cssText = 'display:flex;align-items:center;gap:12px;';
  leftBox.innerHTML = `
    <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#86EFAC;"></span>
    <span id="ff-pdf-status-text" style="font-size:13px;font-weight:700;color:#86EFAC;letter-spacing:0.3px;">
      Preparing High-Resolution Farmer User Manual PDF...
    </span>
  `;

  const rightBox = document.createElement('div');
  rightBox.style.cssText = 'display:flex;align-items:center;gap:10px;';

  const printBtn = document.createElement('button');
  printBtn.id = 'ff-pdf-print-btn';
  printBtn.type = 'button';
  printBtn.style.cssText =
    'background:#15803D;color:#FFFFFF;border:none;padding:8px 16px;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:6px;';
  printBtn.textContent = 'Save / Print Crisp Vector PDF (Ctrl+P)';
  printBtn.onclick = () => window.print();

  const closeBtn = document.createElement('button');
  closeBtn.id = 'ff-pdf-close-btn';
  closeBtn.type = 'button';
  closeBtn.style.cssText =
    'background:rgba(255,255,255,0.15);color:#FFFFFF;border:1px solid rgba(255,255,255,0.25);padding:8px 14px;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;';
  closeBtn.textContent = 'Close Preview (X)';
  closeBtn.onclick = () => {
    overlay.remove();
  };

  rightBox.appendChild(printBtn);
  rightBox.appendChild(closeBtn);
  topBar.appendChild(leftBox);
  topBar.appendChild(rightBox);
  overlay.appendChild(topBar);

  // Mount printable manual sheet
  const sheetEl = document.createElement('div');
  sheetEl.id = 'ff-printable-manual-sheet';
  sheetEl.style.cssText =
    "width:790px;margin:0 auto;padding:28px;background:#FFFFFF;color:#0F291E;font-family:'Segoe UI','Noto Sans Devanagari',sans-serif;";
  
  if (contentMap) {
    sheetEl.innerHTML = generateManualInnerHtml(langMode, contentMap);
  }
  overlay.appendChild(sheetEl);

  document.body.appendChild(overlay);

  // 2. Scroll to (0, 0), Wait for Fonts/Layout Paint, and Capture with html2pdf.js
  window.scrollTo(0, 0);
  overlay.scrollTop = 0;

  // Load Noto Sans Devanagari font into document.head so Marathi & Hindi render crisply
  if (!document.getElementById('ff-devanagari-font')) {
    const link = document.createElement('link');
    link.id = 'ff-devanagari-font';
    link.rel = 'stylesheet';
    link.href =
      'https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;600;700&display=swap';
    document.head.appendChild(link);
  }

  // Inject helper style so html2pdf internal overlay has opacity 1 and does not get clipped
  if (!document.getElementById('ff-html2pdf-override-style')) {
    const style = document.createElement('style');
    style.id = 'ff-html2pdf-override-style';
    style.textContent = `
      .html2pdf__overlay {
        opacity: 1 !important;
        z-index: 10000000 !important;
        background: #FFFFFF !important;
      }
      .html2pdf__container {
        background: #FFFFFF !important;
      }
    `;
    document.head.appendChild(style);
  }

  // Ensure html2pdf.js is loaded
  if (!(window as any).html2pdf) {
    onProgress?.('Loading PDF printing engine...');
    await new Promise<void>((resolve, reject) => {
      const existing = document.getElementById('html2pdf-script');
      if (existing) return resolve();
      const script = document.createElement('script');
      script.id = 'html2pdf-script';
      script.src =
        'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('html2pdf CDN unreachable'));
      document.head.appendChild(script);
    });
  }

  // Wait 500ms so the DOM and Devanagari glyphs are 100% painted on screen
  await new Promise((resolve) => setTimeout(resolve, 500));

  const opt = {
    margin: [8, 8, 8, 8],
    filename: fileNames[langMode] || 'Future_Farming_User_Manual.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#FFFFFF',
      scrollX: 0,
      scrollY: 0,
      x: 0,
      y: 0,
      windowWidth: 850,
    },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: ['css', 'legacy'], avoid: ['.ff-pdf-card', 'tr'] },
  };

  const statusEl = document.getElementById('ff-pdf-status-text');
  if (statusEl) {
    statusEl.textContent = 'Generating High-Resolution PDF...';
  }

  try {
    await (window as any).html2pdf().set(opt).from(sheetEl).save();
    if (statusEl) {
      statusEl.textContent =
        'PDF Downloaded! You can also click Save / Print Vector PDF above or Close Preview.';
    }
    onProgress?.('PDF download completed!');
  } catch (err) {
    console.warn('html2pdf save error, overlay remains open with vector print button:', err);
    if (statusEl) {
      statusEl.textContent =
        'Click "Save / Print Crisp Vector PDF (Ctrl+P)" above to save your document.';
    }
  }
}
