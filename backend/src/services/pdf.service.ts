import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { Buffer } from 'buffer';

export interface ReportData {
  id?: string;
  patient_id: string;
  patient_name: string;
  patient_age?: number;
  patient_gender?: string;
  doctor_name: string;
  doctor_title?: string;
  doctor_registration?: string;
  type: 'medical' | 'prescription' | 'discharge' | 'lab';
  title: string;
  diagnosis?: string;
  chief_complaint?: string;
  examination_notes?: string;
  prescriptions?: PrescriptionItem[];
  follow_up_date?: string;
  created_at?: string;
  additional_notes?: string;
}

export interface PrescriptionItem {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

// Hospital Header Configuration
const HOSPITAL_CONFIG = {
  name: 'CITY HOSPITAL & RESEARCH CENTER',
  address: '123 Healthcare Avenue, Medical City, India - 110001',
  phone: '+91 98765 43210',
  email: 'info@cityhospital.com',
  website: 'www.cityhospital.com'
};

export class PDFService {
  
  // Main function to generate PDF based on report type
  static generateReport(data: ReportData): jsPDF {
    const doc = new jsPDF();
    
    // Add hospital header
    this.addHospitalHeader(doc);
    
    // Add patient info
    this.addPatientInfo(doc, data);
    
    // Add report content based on type
    switch (data.type) {
      case 'prescription':
        this.addPrescriptionContent(doc, data);
        break;
      case 'medical':
        this.addMedicalReportContent(doc, data);
        break;
      case 'discharge':
        this.addDischargeContent(doc, data);
        break;
      case 'lab':
        this.addLabReportContent(doc, data);
        break;
      default:
        this.addMedicalReportContent(doc, data);
    }
    
    // Add doctor signature
    this.addDoctorSignature(doc, data);
    
    // Add footer
    this.addFooter(doc, data);
    
    return doc;
  }
  
  // Add hospital header
  private static addHospitalHeader(doc: jsPDF): void {
    const pageWidth = doc.internal.pageSize.width;
    
    // Hospital name
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 51, 102); // Dark blue
    const hospitalText = HOSPITAL_CONFIG.name;
    const hospitalWidth = doc.getTextWidth(hospitalText);
    doc.text(hospitalText, (pageWidth - hospitalWidth) / 2, 20);
    
    // Decorative line
    doc.setDrawColor(0, 51, 102);
    doc.setLineWidth(0.5);
    doc.line(20, 24, pageWidth - 20, 24);
    
    // Address and contact
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    
    const addressText = HOSPITAL_CONFIG.address;
    const addressWidth = doc.getTextWidth(addressText);
    doc.text(addressText, (pageWidth - addressWidth) / 2, 30);
    
    const contactText = `Phone: ${HOSPITAL_CONFIG.phone} | Email: ${HOSPITAL_CONFIG.email}`;
    const contactWidth = doc.getTextWidth(contactText);
    doc.text(contactText, (pageWidth - contactWidth) / 2, 35);
    
    // Line separator
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(20, 40, pageWidth - 20, 40);
  }
  
  // Add patient information box
  private static addPatientInfo(doc: jsPDF, data: ReportData): void {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    
    // Patient info box background
    doc.setFillColor(240, 248, 255); // Light blue
    doc.rect(20, 48, doc.internal.pageSize.width - 40, 25, 'F');
    
    // Labels and values
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Patient Name:', 25, 55);
    doc.setFont('helvetica', 'normal');
    doc.text(data.patient_name || 'N/A', 60, 55);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Age:', 130, 55);
    doc.setFont('helvetica', 'normal');
    doc.text(data.patient_age ? `${data.patient_age} years` : 'N/A', 145, 55);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Gender:', 25, 62);
    doc.setFont('helvetica', 'normal');
    doc.text(data.patient_gender || 'N/A', 60, 62);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Patient ID:', 130, 62);
    doc.setFont('helvetica', 'normal');
    doc.text(data.patient_id?.substring(0, 8) || 'N/A', 160, 62);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Date:', 25, 69);
    doc.setFont('helvetica', 'normal');
    doc.text(data.created_at ? new Date(data.created_at).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN'), 60, 69);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Report Type:', 130, 69);
    doc.setFont('helvetica', 'normal');
    doc.text(this.formatReportType(data.type), 160, 69);
  }
  
  // Add prescription content
  private static addPrescriptionContent(doc: jsPDF, data: ReportData): void {
    let yPos = 85;
    
    // Title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 51, 102);
    doc.text('PRESCRIPTION', 20, yPos);
    
    // Rx Symbol
    doc.setFontSize(24);
    doc.setTextColor(200, 0, 0);
    doc.text('℞', doc.internal.pageSize.width - 40, yPos);
    
    yPos += 15;
    
    // Diagnosis
    if (data.diagnosis) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('Diagnosis:', 20, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(data.diagnosis, 50, yPos);
      yPos += 10;
    }
    
    // Medicines table
    if (data.prescriptions && data.prescriptions.length > 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 51, 102);
      doc.text('Prescribed Medicines:', 20, yPos);
      yPos += 8;
      
      const tableData = data.prescriptions.map((med, index) => [
        (index + 1).toString(),
        med.name,
        med.dosage,
        med.frequency,
        med.duration,
        med.instructions || '-'
      ]);
      
      (doc as any).autoTable({
        startY: yPos,
        head: [['S.No', 'Medicine', 'Dosage', 'Frequency', 'Duration', 'Instructions']],
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: [0, 51, 102],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        styles: {
          fontSize: 9,
          cellPadding: 3
        },
        columnStyles: {
          0: { cellWidth: 15 },
          1: { cellWidth: 40 },
          2: { cellWidth: 25 },
          3: { cellWidth: 30 },
          4: { cellWidth: 25 },
          5: { cellWidth: 'auto' }
        }
      });
      
      yPos = (doc as any).lastAutoTable.finalY + 10;
    }
    
    // Additional notes
    if (data.additional_notes) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Notes:', 20, yPos);
      yPos += 6;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const splitNotes = doc.splitTextToSize(data.additional_notes, doc.internal.pageSize.width - 40);
      doc.text(splitNotes, 20, yPos);
    }
  }
  
  // Add medical report content
  private static addMedicalReportContent(doc: jsPDF, data: ReportData): void {
    let yPos = 85;
    
    // Title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 51, 102);
    doc.text('MEDICAL REPORT', 20, yPos);
    yPos += 15;
    
    // Chief Complaint
    if (data.chief_complaint) {
      this.addSection(doc, 'Chief Complaint:', data.chief_complaint, yPos);
      yPos += 15;
    }
    
    // Examination Notes
    if (data.examination_notes) {
      this.addSection(doc, 'Physical Examination:', data.examination_notes, yPos);
      yPos += 15;
    }
    
    // Diagnosis
    if (data.diagnosis) {
      doc.setFillColor(255, 245, 238); // Light orange background
      doc.rect(20, yPos - 5, doc.internal.pageSize.width - 40, 12, 'F');
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(200, 0, 0);
      doc.text('DIAGNOSIS:', 25, yPos + 2);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      doc.text(data.diagnosis, 65, yPos + 2);
      yPos += 20;
    }
    
    // Prescriptions
    if (data.prescriptions && data.prescriptions.length > 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 51, 102);
      doc.text('Treatment Plan:', 20, yPos);
      yPos += 8;
      
      const tableData = data.prescriptions.map((med, index) => [
        (index + 1).toString(),
        med.name,
        med.dosage,
        med.frequency,
        med.duration
      ]);
      
      (doc as any).autoTable({
        startY: yPos,
        head: [['S.No', 'Medicine', 'Dosage', 'Frequency', 'Duration']],
        body: tableData,
        theme: 'striped',
        headStyles: {
          fillColor: [0, 51, 102],
          textColor: [255, 255, 255]
        },
        styles: {
          fontSize: 9
        }
      });
      
      yPos = (doc as any).lastAutoTable.finalY + 10;
    }
    
    // Follow-up
    if (data.follow_up_date) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Follow-up Date:', 20, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(new Date(data.follow_up_date).toLocaleDateString('en-IN'), 65, yPos);
    }
  }
  
  // Add discharge summary content
  private static addDischargeContent(doc: jsPDF, data: ReportData): void {
    let yPos = 85;
    
    // Title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 51, 102);
    doc.text('DISCHARGE SUMMARY', 20, yPos);
    yPos += 15;
    
    // Discharge specific content
    this.addSection(doc, 'Admission Diagnosis:', data.diagnosis || 'N/A', yPos);
    yPos += 20;
    
    this.addSection(doc, 'Course in Hospital:', data.examination_notes || 'Patient was managed conservatively with medications.', yPos);
    yPos += 20;
    
    this.addSection(doc, 'Condition at Discharge:', 'Stable. Patient is afebrile and vitals are stable.', yPos);
    yPos += 20;
    
    // Medicines at discharge
    if (data.prescriptions && data.prescriptions.length > 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(200, 0, 0);
      doc.text('Medicines at Discharge:', 20, yPos);
      yPos += 8;
      
      (doc as any).autoTable({
        startY: yPos,
        head: [['Medicine', 'Dosage', 'Duration']],
        body: data.prescriptions.map(med => [med.name, med.dosage, med.duration]),
        theme: 'grid',
        headStyles: { fillColor: [200, 0, 0] }
      });
    }
  }
  
  // Add lab report content
  private static addLabReportContent(doc: jsPDF, data: ReportData): void {
    let yPos = 85;
    
    // Title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 51, 102);
    doc.text('LABORATORY REPORT', 20, yPos);
    yPos += 15;
    
    // Test name
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Test Name:', 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(data.title || 'Complete Blood Count (CBC)', 60, yPos);
    yPos += 15;
    
    // Results
    this.addSection(doc, 'Test Results:', data.examination_notes || 'All parameters within normal range.', yPos);
    yPos += 20;
    
    // Interpretation
    this.addSection(doc, 'Interpretation:', data.additional_notes || 'No significant abnormality detected.', yPos);
  }
  
  // Helper to add section
  private static addSection(doc: jsPDF, label: string, content: string, yPos: number): void {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 51, 102);
    doc.text(label, 20, yPos);
    yPos += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    const splitContent = doc.splitTextToSize(content, doc.internal.pageSize.width - 40);
    doc.text(splitContent, 20, yPos);
  }
  
  // Add doctor signature
  private static addDoctorSignature(doc: jsPDF, data: ReportData): void {
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    const yPos = pageHeight - 50;
    
    // Signature line
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(pageWidth - 80, yPos, pageWidth - 20, yPos);
    
    // Doctor name (italic for signature effect)
    doc.setFontSize(12);
    doc.setFont('helvetica', 'italic');
    doc.text(data.doctor_name || 'Dr. Sajal Saini', pageWidth - 80, yPos + 8);
    
    // Doctor title
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text(data.doctor_title || 'MBBS, MD (Internal Medicine)', pageWidth - 80, yPos + 14);
    
    // Registration number
    if (data.doctor_registration) {
      doc.setFontSize(8);
      doc.text(`Reg. No: ${data.doctor_registration}`, pageWidth - 80, yPos + 19);
    }
    
    // Digital signature label
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text('(Digital Signature)', pageWidth - 80, yPos + 24);
  }
  
  // Add footer
  private static addFooter(doc: jsPDF, data: ReportData): void {
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    
    // Line separator
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(20, pageHeight - 25, pageWidth - 20, pageHeight - 25);
    
    // Report ID
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150, 150, 150);
    doc.text(`Report ID: ${data.id || 'N/A'}`, 20, pageHeight - 18);
    
    // Disclaimer
    const disclaimer = 'This is a computer-generated document and does not require physical signature.';
    const disclaimerWidth = doc.getTextWidth(disclaimer);
    doc.text(disclaimer, (pageWidth - disclaimerWidth) / 2, pageHeight - 12);
    
    // Page number
    doc.text(`Page 1 of 1`, pageWidth - 40, pageHeight - 18);
  }
  
  // Helper to format report type
  private static formatReportType(type: string): string {
    const types: { [key: string]: string } = {
      'medical': 'Medical Report',
      'prescription': 'Prescription',
      'discharge': 'Discharge Summary',
      'lab': 'Lab Report'
    };
    return types[type] || type;
  }
  
  // Generate and save PDF
  static async generateAndSavePDF(data: ReportData): Promise<Buffer> {
    const doc = this.generateReport(data);
    return Buffer.from(doc.output('arraybuffer'));
  }
}

export default PDFService;
