import React, { useCallback, useState } from 'react';
import {
  Platform,
  Share,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Feather from '@expo/vector-icons/Feather';

import { ActionButton } from '@/components/ActionButton';
import { PALETTE } from '@/components/UnifiedPageShell';
import { formatINR } from '@/utils/format';
import {
  LATEX_REPORT_FILENAME,
  buildLatexReport,
  buildPlainTextReport,
  type AgronomistReport,
} from '@/utils/agronomistReport';

interface ExportReportButtonProps {
  report: AgronomistReport;
  style?: StyleProp<ViewStyle>;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatReportDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function listHtml(items: string[]): string {
  return `<ul>${items
    .filter(Boolean)
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join('')}</ul>`;
}

function buildPrintableHtml(report: AgronomistReport): string {
  const metric = (label: string, value: string) =>
    `<div class="metric"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;

  const farm = report.farm
    ? `<section class="panel">
        <h2>Farm Profile</h2>
        <div class="grid">
          ${metric('Crop', report.farm.crop)}
          ${metric('Growth stage', report.farm.stage)}
          ${metric('Soil', report.farm.soil)}
          ${metric('Irrigation method', report.farm.method)}
          ${metric('Area', `${report.farm.acres} acre(s)`)}
        </div>
      </section>`
    : '';

  const irrigation = report.irrigation
    ? `<section class="panel">
        <h2>FAO-56 Water Balance</h2>
        <div class="grid">
          ${metric('ET0', `${report.irrigation.et0Mm.toFixed(2)} mm`)}
          ${metric('ETc', `${report.irrigation.etcMm.toFixed(2)} mm`)}
          ${metric('Crop coefficient', report.irrigation.kc.toFixed(2))}
          ${metric('Soil moisture', `${report.irrigation.soilMoisturePct.toFixed(1)}%`)}
          ${metric('Target moisture', `${report.irrigation.targetMoisturePct.toFixed(1)}%`)}
          ${metric('Gross irrigation', `${report.irrigation.grossMm.toFixed(2)} mm`)}
          ${metric('Water prescription', `${report.irrigation.litersPerAcre.toLocaleString('en-IN')} L/acre`)}
          ${metric('Total water', `${report.irrigation.totalLiters.toLocaleString('en-IN')} L`)}
        </div>
        <p><strong>Best window:</strong> ${escapeHtml(report.irrigation.bestWindowLabel)}</p>
        <p><strong>Pump runtime:</strong> ${escapeHtml(report.irrigation.pumpRuntimeLabel)}</p>
        <p><strong>Agent verdict:</strong> ${escapeHtml(report.irrigation.statusLabel)}</p>
        ${
          report.irrigation.schedule.length > 0
            ? `<table>
                <thead><tr><th>Window</th><th>Pulse</th><th>Water</th><th>Runtime</th></tr></thead>
                <tbody>${report.irrigation.schedule
                  .map(
                    (pulse) =>
                      `<tr><td>${escapeHtml(pulse.timeLabel)}</td><td>${escapeHtml(pulse.label)}</td><td>${pulse.liters.toLocaleString('en-IN')} L</td><td>${pulse.minutes} min</td></tr>`
                  )
                  .join('')}</tbody>
              </table>`
            : ''
        }
      </section>`
    : '';

  const pathology = report.pathology
    ? `<section class="panel">
        <h2>Leaf Pathology Diagnosis</h2>
        <div class="grid">
          ${metric('Crop', report.pathology.crop)}
          ${metric('Disease', report.pathology.disease)}
          ${metric('Scientific name', report.pathology.scientificName)}
          ${metric('Pathogen type', report.pathology.pathogenType)}
          ${metric('Severity', report.pathology.severity)}
          ${metric('Confidence', `${report.pathology.confidencePct.toFixed(1)}%`)}
          ${metric('Infected leaf area', `${report.pathology.infectedAreaPct.toFixed(1)}%`)}
          ${metric('Diagnosis source', report.pathology.source)}
        </div>
        <p><strong>Symptoms:</strong> ${escapeHtml(
          report.pathology.symptoms.join(', ') || 'No symptom list recorded'
        )}</p>
      </section>`
    : '';

  const cure = report.cure
    ? `<section class="panel">
        <h2>4-Step Cure Protocol</h2>
        <p><strong>${escapeHtml(report.cure.title)}</strong></p>
        <p>Recovery window: ${report.cure.recoveryWindowDays} days</p>
        <ol>${report.cure.steps
          .map(
            (step) =>
              `<li class="step">
                <div class="step-title">${escapeHtml(step.title)} <span>${escapeHtml(step.timing)}</span></div>
                <p>${escapeHtml(step.detail)}</p>
                ${
                  step.productName
                    ? `<p class="input">Input: ${escapeHtml(step.productName)}${
                        step.doseLabel
                          ? ` | Dose: ${escapeHtml(step.doseLabel)}`
                          : ''
                      }</p>`
                    : ''
                }
                ${
                  step.safetyNote
                    ? `<p class="safety">Safety: ${escapeHtml(step.safetyNote)}</p>`
                    : ''
                }
              </li>`
          )
          .join('')}</ol>
        <p class="note">${escapeHtml(report.cure.complianceNote)}</p>
      </section>`
    : '';

  const inputs =
    report.inputs && report.inputs.length > 0
      ? `<section class="panel">
          <h2>Prescribed Agri-Shop Inputs</h2>
          <table>
            <thead><tr><th>Product</th><th>Dosage</th><th>Quantity</th><th>Price</th></tr></thead>
            <tbody>${report.inputs
              .map(
                (input) =>
                  `<tr>
                    <td><strong>${escapeHtml(input.productName)}</strong><br /><span>${escapeHtml(input.brand)}</span></td>
                    <td>${escapeHtml(input.doseLabel)}</td>
                    <td>${escapeHtml(input.quantityLabel)}</td>
                    <td>${formatINR(input.totalPrice)}</td>
                  </tr>`
              )
              .join('')}</tbody>
          </table>
        </section>`
      : '';

  const advisories =
    report.advisories.length > 0
      ? `<section class="panel"><h2>Field Advisories</h2>${listHtml(report.advisories)}</section>`
      : '';

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Future Farming Agronomist Report</title>
  <style>
    @page { size: A4; margin: 14mm; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif; color: #0F291E; background: #FFFFFF; font-size: 11px; line-height: 1.5; }
    .header { background: #0F291E; color: #FFFFFF; border-radius: 16px; padding: 22px 24px; margin-bottom: 16px; }
    .eyebrow { color: #86EFAC; font-size: 9px; font-weight: 700; letter-spacing: 1.4px; text-transform: uppercase; }
    h1 { margin: 6px 0 5px; font-size: 22px; line-height: 1.25; }
    .meta { color: #D1DBD1; font-size: 10px; }
    .panel { border: 1px solid #E6ECE6; border-radius: 16px; padding: 18px; margin-bottom: 14px; break-inside: avoid; }
    h2 { margin: 0 0 12px; font-size: 14px; color: #0F291E; }
    p { margin: 6px 0; }
    .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
    .metric { border: 1px solid #E6ECE6; border-radius: 10px; background: #F7F9F7; padding: 10px 12px; }
    .metric span { display: block; color: #6B7280; font-size: 8px; font-weight: 700; letter-spacing: 0.7px; text-transform: uppercase; }
    .metric strong { display: block; margin-top: 3px; font-size: 12px; font-variant-numeric: tabular-nums; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th { background: #EDF5EE; color: #0F291E; text-align: left; padding: 8px; border: 1px solid #E6ECE6; font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; }
    td { padding: 8px; border: 1px solid #E6ECE6; vertical-align: top; font-variant-numeric: tabular-nums; }
    td span { color: #6B7280; }
    ol, ul { margin: 8px 0; padding-left: 20px; }
    li { margin-bottom: 7px; }
    .step-title { font-weight: 700; }
    .step-title span { display: inline-block; margin-left: 6px; background: #F3F4F6; color: #374151; border-radius: 999px; padding: 2px 8px; font-size: 8px; font-weight: 600; }
    .input { color: #15803D; font-weight: 600; }
    .safety { color: #92400E; }
    .note { color: #6B7280; font-size: 9px; }
    .footer { border-top: 1px solid #E6ECE6; margin-top: 18px; padding-top: 10px; color: #6B7280; font-size: 9px; }
    @media print { .panel { break-inside: avoid; } }
  </style>
</head>
<body>
  <header class="header">
    <div class="eyebrow">Future Farming | Official Agronomist Telemetry Report</div>
    <h1>${escapeHtml(report.title)}</h1>
    <div class="meta">${escapeHtml(report.location.label)} | ${escapeHtml(
      report.location.gpsDetected ? 'Device GPS verified' : 'Manual location'
    )} | ${escapeHtml(formatReportDate(report.generatedAt))}</div>
  </header>

  <section class="panel">
    <h2>Field &amp; Atmospheric Telemetry</h2>
    <div class="grid">
      ${metric('Temperature', `${report.weather.temperatureC.toFixed(1)} C`)}
      ${metric('Relative humidity', `${report.weather.humidityPct}%`)}
      ${metric('Wind velocity', `${report.weather.windKmph.toFixed(1)} km/h`)}
      ${metric('Rain risk next 24h', `${report.weather.rainProbabilityPct}%`)}
      ${metric('Rain forecast', `${report.weather.rainNext24hMm.toFixed(1)} mm`)}
      ${metric('Reference ET0', `${report.weather.et0Mm.toFixed(2)} mm/day`)}
      ${metric('Weather source', report.weather.source.toUpperCase())}
      ${metric('Observed', formatReportDate(report.weather.observedAt))}
    </div>
  </section>

  ${farm}
  ${irrigation}
  ${pathology}
  ${cure}
  ${inputs}
  ${advisories}

  <footer class="footer">
    Verified by Future Farming Multi-Agent Agronomic Engine (Open-Meteo FAO-56 and Crop Doctor Vision).
    Decision-support output only. Verify pesticide labels, local agronomist guidance, and official scheme terms before field application.
  </footer>
</body>
</html>`;
}

async function openPrintableReport(report: AgronomistReport): Promise<void> {
  if (Platform.OS !== 'web') {
    await Share.share({
      title: report.title,
      message: buildPlainTextReport(report),
    });
    return;
  }

  const frame = document.createElement('iframe');

  frame.setAttribute('aria-hidden', 'true');
  frame.style.cssText =
    'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;';
  document.body.appendChild(frame);

  const frameWindow = frame.contentWindow;
  const frameDocument = frameWindow?.document;

  if (!frameWindow || !frameDocument) {
    frame.remove();
    window.print();
    return;
  }

  frameDocument.open();
  frameDocument.write(buildPrintableHtml(report));
  frameDocument.close();

  window.setTimeout(() => {
    frameWindow.focus();
    frameWindow.print();
    window.setTimeout(() => frame.remove(), 1000);
  }, 150);
}

async function downloadLatexReport(report: AgronomistReport): Promise<void> {
  const latex = buildLatexReport(report);

  if (Platform.OS !== 'web') {
    await Share.share({
      title: LATEX_REPORT_FILENAME,
      message: latex,
    });
    return;
  }

  const blob = new Blob([latex], {
    type: 'application/x-tex;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = LATEX_REPORT_FILENAME;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function ExportReportButton({
  report,
  style,
}: ExportReportButtonProps) {
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingTex, setExportingTex] = useState(false);

  const handlePdf = useCallback(async () => {
    setExportingPdf(true);

    try {
      await openPrintableReport(report);
    } finally {
      setExportingPdf(false);
    }
  }, [report]);

  const handleLatex = useCallback(async () => {
    setExportingTex(true);

    try {
      await downloadLatexReport(report);
    } finally {
      setExportingTex(false);
    }
  }, [report]);

  return (
    <View style={[styles.card, style]}>
      <View style={styles.header}>
        <View style={styles.iconBox}>
          <Feather name="file-text" size={20} color={PALETTE.brandEmerald} />
        </View>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>AGRONOMIST REPORT EXPORT</Text>
          <Text style={styles.title}>PDF and LaTeX field report</Text>
          <Text style={styles.subtitle}>
            Includes GPS telemetry, FAO-56 water balance, leaf pathology,
            the 4-step cure protocol, and Agri-Shop inputs.
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <ActionButton
          label="Export PDF Report"
          icon="printer"
          variant="forest"
          fullWidth
          loading={exportingPdf}
          onPress={handlePdf}
          style={styles.action}
        />
        <ActionButton
          label="Download LaTeX (.tex)"
          icon="download"
          variant="outline"
          fullWidth
          loading={exportingTex}
          onPress={handleLatex}
          style={styles.action}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: PALETTE.cardBg,
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: 24,
    padding: 24,
    gap: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: PALETTE.sageTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: {
    flex: 1,
    gap: 3,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.9,
    color: PALETTE.brandEmerald,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: PALETTE.brandDark,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12.5,
    lineHeight: 18,
    color: PALETTE.textMuted,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'stretch',
    flexWrap: 'wrap',
    gap: 10,
  },
  action: {
    flexGrow: 1,
    flexBasis: 210,
  },
});
