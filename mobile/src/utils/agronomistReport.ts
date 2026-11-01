import type {
  CropDoctorReport,
  CureStep,
} from '@/services/cropDoctorAgent';
import type {
  City,
  IrrigationReport,
} from '@/services/weatherIrrigationAgent';
import { formatINR } from '@/utils/format';

export interface AgronomistReportLocation {
  label: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  gpsDetected: boolean;
}

export interface AgronomistReportWeather {
  source: 'live' | 'offline';
  observedAt: string;
  temperatureC: number;
  humidityPct: number;
  windKmph: number;
  rainProbabilityPct: number;
  rainNext24hMm: number;
  et0Mm: number;
  soilMoisturePct?: number;
}

export interface AgronomistReportFarm {
  crop: string;
  stage: string;
  soil: string;
  method: string;
  acres: number;
}

export interface AgronomistReportIrrigation {
  kc: number;
  et0Mm: number;
  etcMm: number;
  soilMoisturePct: number;
  targetMoisturePct: number;
  soilMoistureDeficitPct: number;
  effectiveRainMm: number;
  netMm: number;
  grossMm: number;
  efficiencyPct: number;
  litersPerAcre: number;
  totalLiters: number;
  pumpRuntimeLabel: string;
  bestWindowLabel: string;
  statusLabel: string;
  schedule: {
    timeLabel: string;
    label: string;
    liters: number;
    minutes: number;
    note: string;
  }[];
}

export interface AgronomistReportPathology {
  crop: string;
  disease: string;
  scientificName: string;
  pathogenType: string;
  severity: string;
  confidencePct: number;
  infectedAreaPct: number;
  symptoms: string[];
  analysisMode: string;
  source: string;
}

export interface AgronomistReportCure {
  title: string;
  recoveryWindowDays: number;
  complianceNote: string;
  steps: CureStep[];
}

export interface AgronomistReportInput {
  role: string;
  productName: string;
  brand: string;
  quantityLabel: string;
  doseLabel: string;
  totalPrice: number;
  totalMrp: number;
}

export interface AgronomistReport {
  id: string;
  title: string;
  generatedAt: string;
  location: AgronomistReportLocation;
  weather: AgronomistReportWeather;
  farm?: AgronomistReportFarm;
  irrigation?: AgronomistReportIrrigation;
  pathology?: AgronomistReportPathology;
  cure?: AgronomistReportCure;
  inputs?: AgronomistReportInput[];
  advisories: string[];
}

function timestamp(value: string | undefined): string {
  if (!value) return 'Not recorded';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function coordinateLabel(latitude: number, longitude: number): string {
  const latDirection = latitude >= 0 ? 'N' : 'S';
  const lonDirection = longitude >= 0 ? 'E' : 'W';

  return `${Math.abs(latitude).toFixed(4)} deg ${latDirection}, ${Math.abs(longitude).toFixed(4)} deg ${lonDirection}`;
}

function locationFromCity(
  city: City,
  fallbackLabel?: string
): AgronomistReportLocation {
  return {
    label: fallbackLabel ?? city.displayName ?? city.name,
    city: city.name,
    state: city.state,
    latitude: city.latitude,
    longitude: city.longitude,
    gpsDetected: Boolean(city.isGpsDetected),
  };
}

export function buildCropDoctorAgronomistReport(
  report: CropDoctorReport,
  city: City,
  liveWeather?: { et0Mm: number; rainNext24hMm: number }
): AgronomistReport {
  const vision = report.vision;
  const advisories = [
    report.spray.banner,
    report.spray.headline,
    report.cure.complianceNote,
  ].filter(Boolean);

  if (vision.warning) {
    advisories.push(vision.warning);
  }

  return {
    id: report.id,
    title: 'Crop Doctor Agronomist Report',
    generatedAt: report.generatedAt,
    location: locationFromCity(
      city,
      `${report.weather.cityLabel}, ${report.weather.state}`
    ),
    weather: {
      source: report.weather.source,
      observedAt: report.weather.observedAt,
      temperatureC: report.weather.metrics.temperatureC,
      humidityPct: report.weather.metrics.humidityPct,
      windKmph: report.weather.metrics.windKmph,
      rainProbabilityPct: report.weather.metrics.todayRainProb,
      rainNext24hMm:
        liveWeather?.rainNext24hMm ??
        report.weather.metrics.precipitationMm,
      et0Mm: liveWeather?.et0Mm ?? 0,
    },
    farm: {
      crop: vision.cropDetected,
      stage: 'Current field scan',
      soil: 'Field sample',
      method: 'Recommended programme',
      acres: report.acres,
    },
    pathology: {
      crop: vision.cropDetected,
      disease: vision.diseaseName,
      scientificName: vision.scientificName,
      pathogenType: vision.pathogenType,
      severity: vision.severity,
      confidencePct: vision.confidencePct,
      infectedAreaPct: vision.infectedAreaPercent,
      symptoms: vision.symptoms,
      analysisMode: vision.analysisMode,
      source: vision.source,
    },
    cure: {
      title: report.cure.title,
      recoveryWindowDays: report.cure.recoveryWindowDays,
      complianceNote: report.cure.complianceNote,
      steps: report.cure.steps,
    },
    inputs: report.rx.items.map((item) => ({
      role: item.role,
      productName: item.product.name,
      brand: item.product.brand,
      quantityLabel: item.quantityLabel,
      doseLabel: item.doseLabel,
      totalPrice: item.totalPrice,
      totalMrp: item.totalMrp,
    })),
    advisories,
  };
}

export function buildIrrigationAgronomistReport(
  report: IrrigationReport
): AgronomistReport {
  return {
    id: `irrigation-${report.weather.city.id}-${report.generatedAt}`,
    title: 'Precision Irrigation Agronomist Report',
    generatedAt: report.generatedAt,
    location: locationFromCity(report.weather.city),
    weather: {
      source: report.weather.source,
      observedAt: report.weather.observedAt,
      temperatureC: report.weather.current.temperatureC,
      humidityPct: report.weather.current.humidityPct,
      windKmph: report.weather.current.windKmph,
      rainProbabilityPct: report.weather.next24hRainProbabilityPct,
      rainNext24hMm: report.weather.next24hRainMm,
      et0Mm: report.hydro.et0Mm,
      soilMoisturePct: report.weather.current.soilMoistureRootZonePct,
    },
    farm: {
      crop: report.crop.name,
      stage: report.stage.label,
      soil: report.soil.name,
      method: report.method.name,
      acres: report.farm.acres,
    },
    irrigation: {
      kc: report.hydro.kc,
      et0Mm: report.hydro.et0Mm,
      etcMm: report.hydro.etcMm,
      soilMoisturePct: report.hydro.soilMoisturePct,
      targetMoisturePct: report.hydro.targetMoisturePct,
      soilMoistureDeficitPct: report.hydro.soilMoistureDeficitPct,
      effectiveRainMm: report.hydro.effectiveRainMm,
      netMm: report.hydro.netMm,
      grossMm: report.hydro.grossMm,
      efficiencyPct: report.hydro.efficiencyPct,
      litersPerAcre: report.hydro.litersPerAcre,
      totalLiters: report.hydro.totalLiters,
      pumpRuntimeLabel: report.hydro.pumpRuntimeLabel,
      bestWindowLabel: report.hydro.bestWindowLabel,
      statusLabel: report.hydro.statusLabel,
      schedule: report.hydro.schedule,
    },
    advisories: [
      report.sentinel.spraySafety.message,
      report.sentinel.rainLock
        ? 'Rain lock is active. Hold irrigation until the next forecast review.'
        : report.hydro.nextCheckLabel,
      ...report.sentinel.alerts.map((alert) => alert.message),
    ].filter(Boolean),
  };
}

export function buildPlainTextReport(report: AgronomistReport): string {
  const lines: string[] = [
    'FUTURE FARMING',
    report.title,
    `Report ID: ${report.id}`,
    `Generated: ${timestamp(report.generatedAt)}`,
    '',
    'GPS & FIELD TELEMETRY',
    `Location: ${report.location.label}`,
    `Coordinates: ${coordinateLabel(report.location.latitude, report.location.longitude)}`,
    `GPS fix: ${report.location.gpsDetected ? 'Device GPS verified' : 'Regional centroid / manual selection'}`,
    `Weather source: ${report.weather.source.toUpperCase()}`,
    `Observed: ${timestamp(report.weather.observedAt)}`,
    `Temperature: ${report.weather.temperatureC.toFixed(1)} C | Humidity: ${report.weather.humidityPct}% | Wind: ${report.weather.windKmph.toFixed(1)} km/h`,
    `Rain risk next 24h: ${report.weather.rainProbabilityPct}% | Rain forecast: ${report.weather.rainNext24hMm.toFixed(1)} mm`,
    `Reference ET0: ${report.weather.et0Mm.toFixed(2)} mm/day`,
  ];

  if (report.farm) {
    lines.push(
      '',
      'FARM PROFILE',
      `Crop: ${report.farm.crop}`,
      `Stage: ${report.farm.stage}`,
      `Soil: ${report.farm.soil}`,
      `Irrigation method: ${report.farm.method}`,
      `Area: ${report.farm.acres} acre(s)`
    );
  }

  if (report.irrigation) {
    const irrigation = report.irrigation;

    lines.push(
      '',
      'FAO-56 PENMAN-MONTEITH IRRIGATION BALANCE',
      `Crop coefficient (Kc): ${irrigation.kc.toFixed(2)}`,
      `ET0: ${irrigation.et0Mm.toFixed(2)} mm | ETc: ${irrigation.etcMm.toFixed(2)} mm`,
      `Root-zone soil moisture: ${irrigation.soilMoisturePct.toFixed(1)}% | Target: ${irrigation.targetMoisturePct.toFixed(1)}%`,
      `Soil moisture deficit: ${irrigation.soilMoistureDeficitPct.toFixed(1)}%`,
      `Effective rainfall: ${irrigation.effectiveRainMm.toFixed(2)} mm`,
      `Net irrigation: ${irrigation.netMm.toFixed(2)} mm | Gross irrigation: ${irrigation.grossMm.toFixed(2)} mm`,
      `Application efficiency: ${irrigation.efficiencyPct}%`,
      `Water prescription: ${irrigation.litersPerAcre.toLocaleString('en-IN')} L/acre | Total: ${irrigation.totalLiters.toLocaleString('en-IN')} L`,
      `Pump runtime: ${irrigation.pumpRuntimeLabel}`,
      `Best window: ${irrigation.bestWindowLabel}`,
      `Agent verdict: ${irrigation.statusLabel}`
    );

    if (irrigation.schedule.length > 0) {
      lines.push('', 'IRRIGATION SCHEDULE');
      irrigation.schedule.forEach((pulse) => {
        lines.push(
          `${pulse.timeLabel} - ${pulse.label}: ${pulse.liters.toLocaleString('en-IN')} L over ${pulse.minutes} min. ${pulse.note}`
        );
      });
    }
  }

  if (report.pathology) {
    const pathology = report.pathology;

    lines.push(
      '',
      'LEAF PATHOLOGY DIAGNOSIS',
      `Crop: ${pathology.crop}`,
      `Disease: ${pathology.disease} (${pathology.scientificName})`,
      `Pathogen type: ${pathology.pathogenType}`,
      `Severity: ${pathology.severity} | Confidence: ${pathology.confidencePct.toFixed(1)}%`,
      `Infected leaf area: ${pathology.infectedAreaPct.toFixed(1)}%`,
      `Analysis: ${pathology.analysisMode} | Source: ${pathology.source}`,
      `Symptoms: ${pathology.symptoms.length > 0 ? pathology.symptoms.join(', ') : 'No symptom list recorded'}`
    );
  }

  if (report.cure) {
    lines.push(
      '',
      '4-STEP CURE PROTOCOL',
      report.cure.title,
      `Recovery window: ${report.cure.recoveryWindowDays} days`,
      report.cure.complianceNote
    );

    report.cure.steps.forEach((step) => {
      lines.push(
        `Step ${step.step} - ${step.title} [${step.timing}]`,
        step.detail,
        step.productName
          ? `Input: ${step.productName}${step.doseLabel ? ` | Dose: ${step.doseLabel}` : ''}`
          : 'Input: Cultural / mechanical action',
        step.safetyNote ? `Safety: ${step.safetyNote}` : ''
      );
    });
  }

  if (report.inputs && report.inputs.length > 0) {
    lines.push('', 'AGRI-SHOP RECOMMENDED INPUTS');

    report.inputs.forEach((input) => {
      lines.push(
        `${input.productName} (${input.brand}) - ${input.role}`,
        `Quantity: ${input.quantityLabel} | Dose: ${input.doseLabel} | Price: ${formatINR(input.totalPrice)} (MRP ${formatINR(input.totalMrp)})`
      );
    });
  }

  if (report.advisories.length > 0) {
    lines.push('', 'FIELD ADVISORIES');
    report.advisories.forEach((advisory) => {
      lines.push(`- ${advisory}`);
    });
  }

  lines.push(
    '',
    'DISCLAIMER',
    'Decision-support output only. Verify pesticide labels, local agronomist guidance, and official scheme terms before field application.'
  );

  return lines.join('\n').trim();
}

const LATEX_ESCAPES: Record<string, string> = {
  '\\': '\\textbackslash{}',
  '&': '\\&',
  '%': '\\%',
  '$': '\\$',
  '#': '\\#',
  '_': '\\_',
  '{': '\\{',
  '}': '\\}',
  '~': '\\textasciitilde{}',
  '^': '\\textasciicircum{}',
};

function escapeLatex(value: string): string {
  return value.replace(
    /[\\&%$#_{}~^]/g,
    (character) => LATEX_ESCAPES[character] ?? character
  );
}

function latexItemize(items: string[]): string {
  return [
    '\\begin{itemize}[leftmargin=*,itemsep=2pt]',
    ...items.filter(Boolean).map((item) => `  \\item ${escapeLatex(item)}`),
    '\\end{itemize}',
  ].join('\n');
}

export function buildLatexReport(report: AgronomistReport): string {
  const telemetry = [
    `Location: ${report.location.label}`,
    `Coordinates: ${coordinateLabel(report.location.latitude, report.location.longitude)}`,
    `GPS fix: ${report.location.gpsDetected ? 'Device GPS verified' : 'Regional centroid or manual selection'}`,
    `Weather source: ${report.weather.source.toUpperCase()}`,
    `Observed: ${timestamp(report.weather.observedAt)}`,
    `Temperature: ${report.weather.temperatureC.toFixed(1)} C`,
    `Humidity: ${report.weather.humidityPct}%`,
    `Wind: ${report.weather.windKmph.toFixed(1)} km/h`,
    `Rain risk next 24h: ${report.weather.rainProbabilityPct}%`,
    `Rain forecast next 24h: ${report.weather.rainNext24hMm.toFixed(1)} mm`,
    `Reference ET0: ${report.weather.et0Mm.toFixed(2)} mm/day`,
  ];

  const farm = report.farm
    ? latexItemize([
        `Crop: ${report.farm.crop}`,
        `Stage: ${report.farm.stage}`,
        `Soil: ${report.farm.soil}`,
        `Irrigation method: ${report.farm.method}`,
        `Area: ${report.farm.acres} acre(s)`,
      ])
    : '';

  const irrigation = report.irrigation
    ? [
        '\\section*{FAO-56 Penman-Monteith Water Balance}',
        latexItemize([
          `Crop coefficient (Kc): ${report.irrigation.kc.toFixed(2)}`,
          `ET0: ${report.irrigation.et0Mm.toFixed(2)} mm`,
          `ETc: ${report.irrigation.etcMm.toFixed(2)} mm`,
          `Root-zone soil moisture: ${report.irrigation.soilMoisturePct.toFixed(1)}%`,
          `Target soil moisture: ${report.irrigation.targetMoisturePct.toFixed(1)}%`,
          `Soil moisture deficit: ${report.irrigation.soilMoistureDeficitPct.toFixed(1)}%`,
          `Effective rainfall: ${report.irrigation.effectiveRainMm.toFixed(2)} mm`,
          `Net irrigation: ${report.irrigation.netMm.toFixed(2)} mm`,
          `Gross irrigation: ${report.irrigation.grossMm.toFixed(2)} mm`,
          `Application efficiency: ${report.irrigation.efficiencyPct}%`,
          `Water prescription: ${report.irrigation.litersPerAcre.toLocaleString('en-IN')} L/acre`,
          `Total water: ${report.irrigation.totalLiters.toLocaleString('en-IN')} L`,
          `Pump runtime: ${report.irrigation.pumpRuntimeLabel}`,
          `Best application window: ${report.irrigation.bestWindowLabel}`,
          `Agent verdict: ${report.irrigation.statusLabel}`,
        ]),
        report.irrigation.schedule.length > 0
          ? [
              '\\subsection*{Irrigation schedule}',
              latexItemize(
                report.irrigation.schedule.map(
                  (pulse) =>
                    `${pulse.timeLabel} - ${pulse.label}: ${pulse.liters.toLocaleString('en-IN')} L over ${pulse.minutes} min. ${pulse.note}`
                )
              ),
            ].join('\n')
          : '',
      ].join('\n')
    : '';

  const pathology = report.pathology
    ? [
        '\\section*{Leaf Pathology Diagnosis}',
        latexItemize([
          `Crop: ${report.pathology.crop}`,
          `Disease: ${report.pathology.disease} (${report.pathology.scientificName})`,
          `Pathogen type: ${report.pathology.pathogenType}`,
          `Severity: ${report.pathology.severity}`,
          `Confidence: ${report.pathology.confidencePct.toFixed(1)}%`,
          `Infected leaf area: ${report.pathology.infectedAreaPct.toFixed(1)}%`,
          `Analysis mode: ${report.pathology.analysisMode}`,
          `Diagnosis source: ${report.pathology.source}`,
          `Symptoms: ${report.pathology.symptoms.join(', ') || 'No symptom list recorded'}`,
        ]),
      ].join('\n')
    : '';

  const cure = report.cure
    ? [
        '\\section*{4-Step Cure Protocol}',
        `\\textbf{${escapeLatex(report.cure.title)}}\\\\`,
        `Recovery window: ${report.cure.recoveryWindowDays} days\\\\`,
        escapeLatex(report.cure.complianceNote),
        '\\begin{enumerate}[leftmargin=*,itemsep=5pt]',
        ...report.cure.steps.map((step) =>
          [
            `\\item \\textbf{${escapeLatex(step.title)}} (${escapeLatex(step.timing)})`,
            escapeLatex(step.detail),
            step.productName
              ? `Input: ${escapeLatex(step.productName)}${step.doseLabel ? `; dose ${escapeLatex(step.doseLabel)}` : ''}`
              : 'Input: Cultural or mechanical action',
            step.safetyNote
              ? `Safety: ${escapeLatex(step.safetyNote)}`
              : '',
          ]
            .filter(Boolean)
            .join('\\\\')
        ),
        '\\end{enumerate}',
      ].join('\n')
    : '';

  const inputs =
    report.inputs && report.inputs.length > 0
      ? [
          '\\section*{Agri-Shop Recommended Inputs}',
          '\\begin{itemize}[leftmargin=*,itemsep=3pt]',
          ...report.inputs.map((input) =>
            [
              `\\item \\textbf{${escapeLatex(input.productName)}} (${escapeLatex(input.brand)}) - ${escapeLatex(input.role)}`,
              `Quantity: ${escapeLatex(input.quantityLabel)}; dose: ${escapeLatex(input.doseLabel)}; price: Rs. ${input.totalPrice.toLocaleString('en-IN')} (MRP Rs. ${input.totalMrp.toLocaleString('en-IN')})`,
            ].join('\\\\')
          ),
          '\\end{itemize}',
        ].join('\n')
      : '';

  const advisories =
    report.advisories.length > 0
      ? [
          '\\section*{Field Advisories}',
          latexItemize(report.advisories),
        ].join('\n')
      : '';

  return `\\documentclass[10pt]{article}
\\usepackage[T1]{fontenc}
\\usepackage[utf8]{inputenc}
\\usepackage{lmodern}
\\usepackage[margin=18mm]{geometry}
\\usepackage{enumitem}
\\usepackage{xcolor}
\\definecolor{forest}{HTML}{0F291E}
\\definecolor{emerald}{HTML}{15803D}
\\setlength{\\parindent}{0pt}
\\begin{document}
\\begin{center}
{\\LARGE \\textbf{Future Farming}}\\\\[2pt]
{\\color{emerald}\\large ${escapeLatex(report.title)}}\\\\[4pt]
Report ID: ${escapeLatex(report.id)}\\\\
Generated: ${escapeLatex(timestamp(report.generatedAt))}
\\end{center}
\\vspace{4pt}
\\hrule
\\vspace{8pt}
${farm ? `\\section*{Farm Profile}\n${farm}\n` : ''}
\\section*{GPS and Field Telemetry}
${latexItemize(telemetry)}
${irrigation}
${pathology}
${cure}
${inputs}
${advisories}
\\section*{Disclaimer}
Decision-support output only. Verify pesticide labels, local agronomist guidance, and official scheme terms before field application.
\\end{document}
`;
}

export const LATEX_REPORT_FILENAME = 'Future_Farming_Agronomist_Report.tex';
