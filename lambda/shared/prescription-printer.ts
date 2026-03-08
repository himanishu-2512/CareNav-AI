// Prescription Pretty Printer - Format prescriptions for display
// Validates: Requirements 22.4

import { ParsedPrescription, MedicationEntry } from './prescription-parser';

/**
 * Format options for prescription printing
 */
export interface PrintOptions {
  includeHeader?: boolean;
  includeFooter?: boolean;
  includeValidityPeriod?: boolean;
  validityDays?: number;
  lineWidth?: number;
}

/**
 * Default print options following medical prescription standards
 */
const DEFAULT_OPTIONS: Required<PrintOptions> = {
  includeHeader: true,
  includeFooter: true,
  includeValidityPeriod: true,
  validityDays: 30,
  lineWidth: 80
};

/**
 * Format a prescription into a human-readable document
 * Follows medical prescription standards
 * 
 * @param prescription - Parsed prescription object
 * @param options - Formatting options
 * @returns Formatted prescription string
 */
export function printPrescription(
  prescription: ParsedPrescription,
  options: PrintOptions = {}
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const lines: string[] = [];

  // Header section
  if (opts.includeHeader) {
    lines.push(centerText('PRESCRIPTION', opts.lineWidth));
    lines.push(repeatChar('=', opts.lineWidth));
    lines.push('');
  }

  // Date and doctor information
  const date = formatDate(prescription.date);
  lines.push(`Date: ${date}`);
  lines.push(`Doctor: ${prescription.doctorName}`);
  lines.push(`Doctor ID: ${prescription.doctorId}`);
  lines.push('');

  // Patient information
  lines.push(`Patient: ${prescription.patientName}`);
  lines.push(`UHID: ${prescription.uhid}`);
  lines.push(`Patient ID: ${prescription.patientId}`);
  
  if (prescription.episodeId) {
    lines.push(`Episode ID: ${prescription.episodeId}`);
  }
  
  lines.push('');
  lines.push(repeatChar('-', opts.lineWidth));
  lines.push('');

  // Medications section
  lines.push('MEDICATIONS:');
  lines.push('');

  prescription.medications.forEach((med, index) => {
    lines.push(`${index + 1}. ${med.medicineName}`);
    lines.push(`   Dosage: ${med.dosage}`);
    lines.push(`   Frequency: ${med.frequency}`);
    lines.push(`   Duration: ${med.duration} day${med.duration !== 1 ? 's' : ''}`);
    
    if (med.foodTiming) {
      lines.push(`   Timing: ${capitalizeFirst(med.foodTiming)}`);
    }
    
    if (med.specialInstructions) {
      lines.push(`   Instructions: ${med.specialInstructions}`);
    }
    
    lines.push('');
  });

  // Footer section
  if (opts.includeFooter) {
    lines.push(repeatChar('-', opts.lineWidth));
    lines.push('');
    lines.push(`Prescription ID: ${prescription.prescriptionId}`);
    
    if (opts.includeValidityPeriod) {
      lines.push(`Valid for: ${opts.validityDays} days from date of issue`);
    }
    
    lines.push('');
    lines.push(centerText('This is a computer-generated prescription', opts.lineWidth));
  }

  return lines.join('\n');
}

/**
 * Format a prescription for medical shop display (compact format)
 * Optimized for quick reading at pharmacy
 */
export function printPrescriptionForMedicalShop(prescription: ParsedPrescription): string {
  const lines: string[] = [];

  lines.push('═══════════════════════════════════════════════════════════════');
  lines.push(centerText('PRESCRIPTION', 63));
  lines.push('═══════════════════════════════════════════════════════════════');
  lines.push('');
  
  // Essential information only
  lines.push(`Date: ${formatDate(prescription.date)}          Rx ID: ${prescription.prescriptionId}`);
  lines.push(`Patient: ${prescription.patientName} (UHID: ${prescription.uhid})`);
  lines.push(`Doctor: ${prescription.doctorName}`);
  lines.push('');
  lines.push('───────────────────────────────────────────────────────────────');
  lines.push('MEDICATIONS:');
  lines.push('───────────────────────────────────────────────────────────────');
  lines.push('');

  prescription.medications.forEach((med, index) => {
    lines.push(`${index + 1}. ${med.medicineName.toUpperCase()}`);
    lines.push(`   ${med.dosage} | ${med.frequency} | ${med.duration} days`);
    
    if (med.foodTiming) {
      lines.push(`   Take: ${capitalizeFirst(med.foodTiming)}`);
    }
    
    if (med.specialInstructions) {
      lines.push(`   Note: ${med.specialInstructions}`);
    }
    
    lines.push('');
  });

  lines.push('═══════════════════════════════════════════════════════════════');
  
  return lines.join('\n');
}

/**
 * Format a prescription as plain text (minimal formatting)
 * Useful for SMS, email, or simple text display
 */
export function printPrescriptionPlainText(prescription: ParsedPrescription): string {
  const lines: string[] = [];

  lines.push(`PRESCRIPTION - ${formatDate(prescription.date)}`);
  lines.push(`Patient: ${prescription.patientName} (${prescription.uhid})`);
  lines.push(`Doctor: ${prescription.doctorName}`);
  lines.push('');
  lines.push('Medications:');

  prescription.medications.forEach((med, index) => {
    const parts = [
      `${index + 1}. ${med.medicineName}`,
      med.dosage,
      med.frequency,
      `${med.duration} days`
    ];
    
    if (med.foodTiming) {
      parts.push(med.foodTiming);
    }
    
    lines.push(parts.join(' - '));
    
    if (med.specialInstructions) {
      lines.push(`   ${med.specialInstructions}`);
    }
  });

  lines.push('');
  lines.push(`Prescription ID: ${prescription.prescriptionId}`);

  return lines.join('\n');
}

/**
 * Format a prescription as JSON string (for data interchange)
 */
export function printPrescriptionJSON(prescription: ParsedPrescription, pretty: boolean = true): string {
  return JSON.stringify(prescription, null, pretty ? 2 : 0);
}

/**
 * Format a prescription for patient app display (user-friendly format)
 */
export function printPrescriptionForPatient(prescription: ParsedPrescription): string {
  const lines: string[] = [];

  lines.push('╔═══════════════════════════════════════════════════════════════╗');
  lines.push('║' + centerText('Your Prescription', 63) + '║');
  lines.push('╚═══════════════════════════════════════════════════════════════╝');
  lines.push('');
  
  lines.push(`📅 Date: ${formatDate(prescription.date)}`);
  lines.push(`👨‍⚕️ Doctor: ${prescription.doctorName}`);
  lines.push('');
  lines.push('💊 Your Medications:');
  lines.push('');

  prescription.medications.forEach((med, index) => {
    lines.push(`${index + 1}. ${med.medicineName}`);
    lines.push(`   • Take: ${med.dosage}`);
    lines.push(`   • When: ${med.frequency}`);
    lines.push(`   • For: ${med.duration} day${med.duration !== 1 ? 's' : ''}`);
    
    if (med.foodTiming) {
      const emoji = getFoodTimingEmoji(med.foodTiming);
      lines.push(`   • ${emoji} ${capitalizeFirst(med.foodTiming)}`);
    }
    
    if (med.specialInstructions) {
      lines.push(`   ⚠️  ${med.specialInstructions}`);
    }
    
    lines.push('');
  });

  lines.push('─────────────────────────────────────────────────────────────');
  lines.push(`Prescription ID: ${prescription.prescriptionId}`);
  lines.push('Valid for 30 days from date of issue');

  return lines.join('\n');
}

// Helper functions

/**
 * Format ISO date string to readable format
 */
function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  return date.toLocaleDateString('en-US', options);
}

/**
 * Center text within a given width
 */
function centerText(text: string, width: number): string {
  const padding = Math.max(0, width - text.length);
  const leftPad = Math.floor(padding / 2);
  const rightPad = padding - leftPad;
  return ' '.repeat(leftPad) + text + ' '.repeat(rightPad);
}

/**
 * Repeat a character n times
 */
function repeatChar(char: string, count: number): string {
  return char.repeat(count);
}

/**
 * Capitalize first letter of string
 */
function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Get emoji for food timing
 */
function getFoodTimingEmoji(timing: string): string {
  const emojiMap: Record<string, string> = {
    'before food': '🍽️',
    'after food': '🍽️',
    'with food': '🍽️',
    'anytime': '⏰'
  };
  return emojiMap[timing] || '⏰';
}

/**
 * Get a summary line for a medication (one-line format)
 */
export function getMedicationSummary(med: MedicationEntry): string {
  const parts = [
    med.medicineName,
    med.dosage,
    med.frequency,
    `${med.duration} days`
  ];
  
  if (med.foodTiming) {
    parts.push(med.foodTiming);
  }
  
  return parts.join(' - ');
}

/**
 * Get total number of medications in prescription
 */
export function getMedicationCount(prescription: ParsedPrescription): number {
  return prescription.medications.length;
}

/**
 * Get prescription summary (one-line format)
 */
export function getPrescriptionSummary(prescription: ParsedPrescription): string {
  const medCount = prescription.medications.length;
  const date = formatDate(prescription.date);
  return `Prescription by ${prescription.doctorName} on ${date} - ${medCount} medication${medCount !== 1 ? 's' : ''}`;
}
