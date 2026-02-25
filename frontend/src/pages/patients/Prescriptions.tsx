import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import ThemeWrapper from '../../components/theme/ThemeWrapper';
import { useAuth } from '../../context/AuthContext';
import { Download, Printer, FileText, Calendar, User, Clock, Stethoscope, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

interface Prescription {
  id: string;
  prescriptionNumber: string;
  date: string;
  diagnosis: string;
  medicines: {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
  }[];
  tests: string[];
  advice: string;
  followUp: string;
  doctorName: string;
  doctorSpecialization: string;
  doctorDepartment: string;
}

// Current patient prescriptions (single patient)
const currentPatient = {
  first_name: 'John',
  last_name: 'Doe',
  age: 45,
  sex: 'Male',
  weight: '78 kg',
  height: '175 cm'
};

// Patient prescriptions - SAME patient (John Doe) with different doctors
const patientPrescriptions: Prescription[] = [
  {
    id: 'RX-001',
    prescriptionNumber: 'RX-2024-001',
    date: '2024-02-25',
    diagnosis: 'Acute Upper Respiratory Tract Infection',
    medicines: [
      {
        name: 'Amoxicillin 500mg',
        dosage: '1 Tablet',
        frequency: '3 times a day',
        duration: '7 days',
        instructions: 'After food'
      },
      {
        name: 'Paracetamol 650mg',
        dosage: '1 Tablet',
        frequency: 'As needed (max 3 per day)',
        duration: '5 days',
        instructions: 'For fever and pain'
      },
      {
        name: 'Cetirizine 10mg',
        dosage: '1 Tablet',
        frequency: 'Once at night',
        duration: '5 days',
        instructions: 'For cold symptoms'
      }
    ],
    tests: ['CBC', 'Chest X-Ray'],
    advice: 'Drink plenty of fluids, rest well, avoid cold beverages',
    followUp: 'After 7 days or if symptoms worsen',
    doctorName: 'Dr. Sarah Johnson',
    doctorSpecialization: 'General Physician',
    doctorDepartment: 'General Medicine'
  },
  {
    id: 'RX-002',
    prescriptionNumber: 'RX-2024-002',
    date: '2024-02-24',
    diagnosis: 'Type 2 Diabetes Mellitus - Routine Checkup',
    medicines: [
      {
        name: 'Metformin 500mg',
        dosage: '1 Tablet',
        frequency: 'Twice daily',
        duration: '30 days',
        instructions: 'Before breakfast and dinner'
      },
      {
        name: 'Glimepiride 2mg',
        dosage: '1 Tablet',
        frequency: 'Once daily',
        duration: '30 days',
        instructions: 'Before breakfast'
      }
    ],
    tests: ['Fasting Blood Sugar', 'HbA1c', 'Lipid Profile'],
    advice: 'Maintain diabetic diet, exercise regularly, monitor blood sugar daily',
    followUp: 'After 1 month with reports',
    doctorName: 'Dr. Michael Chen',
    doctorSpecialization: 'Endocrinologist',
    doctorDepartment: 'Endocrinology'
  },
  {
    id: 'RX-003',
    prescriptionNumber: 'RX-2024-003',
    date: '2024-02-23',
    diagnosis: 'Hypertension Stage 2',
    medicines: [
      {
        name: 'Amlodipine 5mg',
        dosage: '1 Tablet',
        frequency: 'Once daily',
        duration: '30 days',
        instructions: 'Morning after breakfast'
      },
      {
        name: 'Losartan 50mg',
        dosage: '1 Tablet',
        frequency: 'Once daily',
        duration: '30 days',
        instructions: 'Evening'
      },
      {
        name: 'Atorvastatin 10mg',
        dosage: '1 Tablet',
        frequency: 'Once at night',
        duration: '30 days',
        instructions: 'After dinner'
      }
    ],
    tests: ['Blood Pressure Monitoring', 'ECG', 'Renal Function Test'],
    advice: 'Reduce salt intake, regular exercise, avoid stress, monitor BP twice daily',
    followUp: 'After 2 weeks',
    doctorName: 'Dr. Emily Davis',
    doctorSpecialization: 'Cardiologist',
    doctorDepartment: 'Cardiology'
  },
  {
    id: 'RX-004',
    prescriptionNumber: 'RX-2024-004',
    date: '2024-02-22',
    diagnosis: 'Allergic Rhinitis with Sinusitis',
    medicines: [
      {
        name: 'Levocetirizine 5mg',
        dosage: '1 Tablet',
        frequency: 'Once at night',
        duration: '10 days',
        instructions: 'For allergic symptoms'
      },
      {
        name: 'Fluticasone Nasal Spray',
        dosage: '2 sprays',
        frequency: 'Twice daily',
        duration: '14 days',
        instructions: 'In each nostril'
      },
      {
        name: 'Steam Inhalation',
        dosage: '10-15 minutes',
        frequency: '2-3 times daily',
        duration: '7 days',
        instructions: 'With menthol'
      }
    ],
    tests: ['CT Scan PNS', 'Allergy Test'],
    advice: 'Avoid dust and allergens, use air purifier, saline gargle',
    followUp: 'After 2 weeks',
    doctorName: 'Dr. Robert Wilson',
    doctorSpecialization: 'ENT Specialist',
    doctorDepartment: 'ENT'
  }
];

const Prescriptions: React.FC = () => {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const patient = user ? {
    first_name: user.first_name || currentPatient.first_name,
    last_name: user.last_name || currentPatient.last_name,
    age: currentPatient.age,
    sex: currentPatient.sex,
    weight: currentPatient.weight,
    height: currentPatient.height
  } : currentPatient;

  const handleDownload = (prescription: Prescription) => {
    toast.success(`Downloading prescription ${prescription.prescriptionNumber}...`);
    
    // Generate professional prescription HTML
    const htmlContent = generateProfessionalPrescriptionHTML(prescription, patient);
    
    // Create a Blob with HTML content
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    
    // Open in new window for printing/saving as PDF
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // Trigger print dialog after a short delay to ensure content is loaded
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
    
    window.URL.revokeObjectURL(url);
  };

  const generateProfessionalPrescriptionHTML = (prescription: Prescription, patient: any) => {
    const formattedDate = new Date(prescription.date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Medical Prescription - ${prescription.prescriptionNumber}</title>
    <style>
        @page {
            size: A4;
            margin: 15mm;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Times New Roman', Georgia, serif;
            background: #f5f5f5;
            padding: 20px;
        }
        
        .prescription-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border: 3px solid #1e3a5f;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        
        /* Header */
        .header {
            background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%);
            color: white;
            padding: 30px;
            text-align: center;
            position: relative;
        }
        
        .header::before {
            content: '+';
            position: absolute;
            left: 30px;
            top: 50%;
            transform: translateY(-50%);
            font-size: 60px;
            font-weight: bold;
            background: white;
            color: #1e3a5f;
            width: 70px;
            height: 70px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            line-height: 1;
        }
        
        .hospital-name {
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 2px;
            margin-bottom: 5px;
        }
        
        .hospital-tagline {
            font-size: 14px;
            opacity: 0.9;
            font-style: italic;
        }
        
        .prescription-label {
            position: absolute;
            right: 30px;
            top: 50%;
            transform: translateY(-50%);
            background: rgba(255,255,255,0.2);
            padding: 10px 20px;
            border-radius: 5px;
            font-size: 18px;
            font-weight: bold;
            border: 2px solid rgba(255,255,255,0.3);
        }
        
        /* Content */
        .content {
            padding: 30px;
        }
        
        /* Info Grid */
        .info-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 30px;
        }
        
        .info-box {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #2d5a87;
        }
        
        .info-box h3 {
            color: #1e3a5f;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 15px;
            border-bottom: 2px solid #e9ecef;
            padding-bottom: 8px;
        }
        
        .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 14px;
        }
        
        .info-label {
            color: #6c757d;
            font-weight: 600;
        }
        
        .info-value {
            color: #212529;
            font-weight: 500;
        }
        
        /* Prescription Number and Date */
        .prescription-meta {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
            padding: 15px 20px;
            background: #e9ecef;
            border-radius: 8px;
        }
        
        .meta-item {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .meta-label {
            font-weight: 600;
            color: #495057;
            font-size: 13px;
            text-transform: uppercase;
        }
        
        .meta-value {
            font-weight: bold;
            color: #1e3a5f;
            font-size: 16px;
        }
        
        /* Diagnosis */
        .diagnosis-section {
            background: #fff3cd;
            border: 2px solid #ffc107;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 30px;
        }
        
        .diagnosis-header {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 10px;
            color: #856404;
            font-weight: bold;
            font-size: 16px;
        }
        
        .diagnosis-text {
            color: #212529;
            font-size: 16px;
            font-weight: 500;
            padding-left: 30px;
        }
        
        /* Rx Section */
        .rx-section {
            margin-bottom: 30px;
        }
        
        .rx-header {
            display: flex;
            align-items: center;
            gap: 15px;
            margin-bottom: 25px;
            border-bottom: 3px solid #1e3a5f;
            padding-bottom: 15px;
        }
        
        .rx-symbol {
            font-size: 48px;
            font-weight: bold;
            color: #1e3a5f;
            font-family: 'Times New Roman', serif;
        }
        
        .rx-title {
            font-size: 24px;
            font-weight: bold;
            color: #1e3a5f;
            text-transform: uppercase;
            letter-spacing: 2px;
        }
        
        /* Medicines Table */
        .medicines-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }
        
        .medicines-table th {
            background: #1e3a5f;
            color: white;
            padding: 12px 15px;
            text-align: left;
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .medicines-table td {
            padding: 15px;
            border-bottom: 1px solid #dee2e6;
            font-size: 14px;
        }
        
        .medicines-table tr:nth-child(even) {
            background: #f8f9fa;
        }
        
        .medicine-name {
            font-weight: bold;
            color: #1e3a5f;
            font-size: 15px;
        }
        
        .medicine-instructions {
            color: #6c757d;
            font-style: italic;
            font-size: 13px;
            margin-top: 5px;
        }
        
        /* Tests Section */
        .tests-section {
            margin-bottom: 30px;
        }
        
        .section-title {
            color: #1e3a5f;
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .tests-list {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
        }
        
        .test-item {
            background: #e9ecef;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 13px;
            color: #495057;
            border: 1px solid #ced4da;
        }
        
        /* Advice Section */
        .advice-section {
            background: #d4edda;
            border: 2px solid #28a745;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 30px;
        }
        
        .advice-header {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 10px;
            color: #155724;
            font-weight: bold;
            font-size: 16px;
        }
        
        .advice-text {
            color: #155724;
            font-size: 14px;
            line-height: 1.6;
            padding-left: 30px;
        }
        
        /* Follow-up Section */
        .followup-section {
            background: #f8d7da;
            border: 2px solid #dc3545;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 40px;
        }
        
        .followup-header {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 10px;
            color: #721c24;
            font-weight: bold;
            font-size: 16px;
        }
        
        .followup-text {
            color: #721c24;
            font-size: 15px;
            font-weight: 500;
            padding-left: 30px;
        }
        
        /* Footer */
        .footer {
            margin-top: 40px;
            padding-top: 30px;
            border-top: 2px solid #dee2e6;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
        }
        
        .hospital-info {
            text-align: left;
        }
        
        .hospital-info h4 {
            color: #1e3a5f;
            margin-bottom: 5px;
        }
        
        .hospital-info p {
            color: #6c757d;
            font-size: 12px;
            margin: 3px 0;
        }
        
        .signature-section {
            text-align: right;
        }
        
        .signature-line {
            border-top: 2px solid #1e3a5f;
            width: 200px;
            margin-bottom: 10px;
            margin-left: auto;
        }
        
        .signature-label {
            color: #1e3a5f;
            font-weight: bold;
            font-size: 14px;
        }
        
        .doctor-name-footer {
            color: #212529;
            font-size: 16px;
            font-weight: bold;
            margin-top: 5px;
        }
        
        .doctor-title-footer {
            color: #6c757d;
            font-size: 12px;
        }
        
        /* Watermark */
        .watermark {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 120px;
            color: rgba(30, 58, 95, 0.03);
            font-weight: bold;
            pointer-events: none;
            z-index: 0;
            letter-spacing: 10px;
        }
        
        @media print {
            body {
                background: white;
                padding: 0;
            }
            
            .prescription-container {
                border: 2px solid #1e3a5f;
                box-shadow: none;
            }
            
            .no-print {
                display: none;
            }
        }
    </style>
</head>
<body>
    <div class="watermark">Rx</div>
    
    <div class="prescription-container">
        <!-- Header -->
        <div class="header">
            <div class="hospital-name">Hospital MS</div>
            <div class="hospital-tagline">Your Health, Our Priority</div>
            <div class="prescription-label">PRESCRIPTION</div>
        </div>
        
        <!-- Content -->
        <div class="content">
            <!-- Prescription Meta -->
            <div class="prescription-meta">
                <div class="meta-item">
                    <span class="meta-label">Prescription #:</span>
                    <span class="meta-value">${prescription.prescriptionNumber}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">Date:</span>
                    <span class="meta-value">${formattedDate}</span>
                </div>
            </div>
            
            <!-- Info Section -->
            <div class="info-section">
                <!-- Patient Info -->
                <div class="info-box">
                    <h3>Patient Information</h3>
                    <div class="info-row">
                        <span class="info-label">Name:</span>
                        <span class="info-value">${patient.first_name} ${patient.last_name}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Age:</span>
                        <span class="info-value">${patient.age} years</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Sex:</span>
                        <span class="info-value">${patient.sex}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Weight:</span>
                        <span class="info-value">${patient.weight}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Height:</span>
                        <span class="info-value">${patient.height}</span>
                    </div>
                </div>
                
                <!-- Doctor Info -->
                <div class="info-box">
                    <h3>Doctor Information</h3>
                    <div class="info-row">
                        <span class="info-label">Name:</span>
                        <span class="info-value">${prescription.doctorName}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Specialization:</span>
                        <span class="info-value">${prescription.doctorSpecialization}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Department:</span>
                        <span class="info-value">${prescription.doctorDepartment}</span>
                    </div>
                </div>
            </div>
            
            <!-- Diagnosis -->
            <div class="diagnosis-section">
                <div class="diagnosis-header">
                    <span>⚕️</span>
                    <span>DIAGNOSIS</span>
                </div>
                <div class="diagnosis-text">${prescription.diagnosis}</div>
            </div>
            
            <!-- Medicines -->
            <div class="rx-section">
                <div class="rx-header">
                    <span class="rx-symbol">℞</span>
                    <span class="rx-title">Prescribed Medicines</span>
                </div>
                
                <table class="medicines-table">
                    <thead>
                        <tr>
                            <th style="width: 5%;">#</th>
                            <th style="width: 25%;">Medicine Name</th>
                            <th style="width: 15%;">Dosage</th>
                            <th style="width: 20%;">Frequency</th>
                            <th style="width: 15%;">Duration</th>
                            <th style="width: 20%;">Instructions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${prescription.medicines.map((med, idx) => `
                            <tr>
                                <td style="font-weight: bold; color: #1e3a5f;">${idx + 1}</td>
                                <td>
                                    <div class="medicine-name">${med.name}</div>
                                </td>
                                <td>${med.dosage}</td>
                                <td>${med.frequency}</td>
                                <td>${med.duration}</td>
                                <td>
                                    <div class="medicine-instructions">${med.instructions}</div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            
            <!-- Tests -->
            ${prescription.tests.length > 0 ? `
            <div class="tests-section">
                <div class="section-title">
                    <span>🧪</span>
                    <span>Recommended Tests</span>
                </div>
                <div class="tests-list">
                    ${prescription.tests.map(test => `<span class="test-item">${test}</span>`).join('')}
                </div>
            </div>
            ` : ''}
            
            <!-- Advice -->
            <div class="advice-section">
                <div class="advice-header">
                    <span>💡</span>
                    <span>DOCTOR'S ADVICE</span>
                </div>
                <div class="advice-text">${prescription.advice}</div>
            </div>
            
            <!-- Follow-up -->
            <div class="followup-section">
                <div class="followup-header">
                    <span>🕐</span>
                    <span>FOLLOW-UP</span>
                </div>
                <div class="followup-text">${prescription.followUp}</div>
            </div>
            
            <!-- Footer -->
            <div class="footer">
                <div class="hospital-info">
                    <h4>Hospital MS</h4>
                    <p>123 Healthcare Complex, Main Road</p>
                    <p>City - 400001 | Phone: +91 12345 67890</p>
                    <p>Email: info@hospitalms.com</p>
                </div>
                
                <div class="signature-section">
                    <div class="signature-line"></div>
                    <div class="signature-label">Doctor's Signature</div>
                    <div class="doctor-name-footer">${prescription.doctorName}</div>
                    <div class="doctor-title-footer">${prescription.doctorSpecialization}</div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>`;
  };

  const handlePrint = (prescription: Prescription) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = generatePrescriptionHTML(prescription, patient);
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
  };

  const generatePrescriptionHTML = (prescription: Prescription, patient: any) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Prescription - ${prescription.prescriptionNumber}</title>
        <style>
          @page { size: A4; margin: 20mm; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Segoe UI', Arial, sans-serif; 
            background: white;
            color: #333;
            line-height: 1.6;
          }
          .header {
            background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%);
            color: white;
            padding: 30px;
            border-radius: 10px 10px 0 0;
          }
          .header h1 { font-size: 28px; margin-bottom: 5px; }
          .header p { opacity: 0.9; font-size: 14px; }
          .content { padding: 30px; }
          .patient-info {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 25px;
            border-left: 4px solid #2d5a87;
          }
          .patient-info h3 {
            color: #1e3a5f;
            margin-bottom: 10px;
            font-size: 18px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            margin-top: 15px;
          }
          .info-item label {
            font-weight: bold;
            color: #555;
            font-size: 12px;
            text-transform: uppercase;
          }
          .info-item span {
            display: block;
            color: #333;
            font-size: 14px;
          }
          .doctor-info {
            background: #e8f4f8;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 25px;
          }
          .doctor-info h4 {
            color: #1e3a5f;
            margin-bottom: 5px;
          }
          .section {
            margin-bottom: 25px;
          }
          .section h3 {
            color: #1e3a5f;
            border-bottom: 2px solid #2d5a87;
            padding-bottom: 8px;
            margin-bottom: 15px;
            font-size: 16px;
          }
          .diagnosis {
            background: #fff3cd;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #ffc107;
          }
          .medicine-item {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 10px;
            border-left: 3px solid #28a745;
          }
          .medicine-name {
            font-weight: bold;
            color: #1e3a5f;
            font-size: 15px;
            margin-bottom: 5px;
          }
          .medicine-details {
            color: #555;
            font-size: 13px;
            line-height: 1.5;
          }
          .tests-list {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
          }
          .test-item {
            background: #e9ecef;
            padding: 8px 15px;
            border-radius: 20px;
            font-size: 13px;
            color: #495057;
          }
          .advice {
            background: #d4edda;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #28a745;
          }
          .followup {
            background: #f8d7da;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #dc3545;
            font-weight: bold;
            color: #721c24;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #dee2e6;
            text-align: center;
            color: #6c757d;
            font-size: 12px;
          }
          @media print {
            body { background: white; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Hospital MS</h1>
          <p>Your health our priority</p>
        </div>
        
        <div class="content">
          <div class="patient-info">
            <h3>Patient Information</h3>
            <div class="info-grid">
              <div class="info-item">
                <label>Name</label>
                <span>${patient.first_name} ${patient.last_name}</span>
              </div>
              <div class="info-item">
                <label>Age</label>
                <span>${patient.age} years</span>
              </div>
              <div class="info-item">
                <label>Sex</label>
                <span>${patient.sex}</span>
              </div>
              <div class="info-item">
                <label>Weight</label>
                <span>${patient.weight}</span>
              </div>
              <div class="info-item">
                <label>Height</label>
                <span>${patient.height}</span>
              </div>
              <div class="info-item">
                <label>Prescription #</label>
                <span>${prescription.prescriptionNumber}</span>
              </div>
            </div>
          </div>

          <div class="doctor-info">
            <h4>${prescription.doctorName}</h4>
            <p>${prescription.doctorSpecialization} | ${prescription.doctorDepartment}</p>
            <p style="margin-top: 5px; font-size: 12px; color: #666;">Date: ${new Date(prescription.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
          </div>

          <div class="section">
            <h3>Diagnosis</h3>
            <div class="diagnosis">
              ${prescription.diagnosis}
            </div>
          </div>

          <div class="section">
            <h3>Prescribed Medicines</h3>
            ${prescription.medicines.map((med, idx) => `
              <div class="medicine-item">
                <div class="medicine-name">${idx + 1}. ${med.name}</div>
                <div class="medicine-details">
                  <strong>Dosage:</strong> ${med.dosage} |
                  <strong>Frequency:</strong> ${med.frequency} |
                  <strong>Duration:</strong> ${med.duration}<br>
                  <em>${med.instructions}</em>
                </div>
              </div>
            `).join('')}
          </div>

          <div class="section">
            <h3>Recommended Tests</h3>
            <div class="tests-list">
              ${prescription.tests.map(test => `<span class="test-item">${test}</span>`).join('')}
            </div>
          </div>

          <div class="section">
            <h3>Advice</h3>
            <div class="advice">
              ${prescription.advice}
            </div>
          </div>

          <div class="section">
            <h3>Follow-up</h3>
            <div class="followup">
              ${prescription.followUp}
            </div>
          </div>
        </div>

        <div class="footer">
          <p>This prescription is generated by Hospital MS</p>
          <p>For any queries, contact: support@hospitalms.com | +91 12345 67890</p>
        </div>
      </body>
      </html>
    `;
  };

  return (
    <ThemeWrapper>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Back Button */}
        <Link 
          to="/patient-portal"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Dashboard
        </Link>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              My Prescriptions
            </h1>
            <p className={`text-lg mt-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              View and download your medical prescriptions
            </p>
            <p className={`text-base mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {patient.first_name} {patient.last_name} • {patient.age} years • {patient.sex}
            </p>
          </div>
          <div className="flex items-center gap-2 text-gray-700 font-medium bg-white px-4 py-2 rounded-xl border-2 border-gray-200 shadow-lg">
            <FileText className="w-5 h-5 text-blue-600" />
            <span>{patientPrescriptions.length} Prescriptions</span>
          </div>
        </div>

        {/* Prescriptions Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {patientPrescriptions.map((prescription) => (
            <div
              key={prescription.id}
              className={`rounded-xl shadow-lg overflow-hidden transition-all hover:shadow-xl ${
                isDark ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'
              }`}
            >
              {/* Card Header */}
              <div className={`p-5 border-b ${isDark ? 'border-slate-700 bg-slate-700/50' : 'border-gray-200 bg-gray-50'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-lg ${isDark ? 'bg-blue-900/50' : 'bg-blue-100'}`}>
                      <FileText className={`w-6 h-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                    </div>
                    <div>
                      <p className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {prescription.prescriptionNumber}
                      </p>
                      <p className={`text-sm ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                        {prescription.doctorName}
                      </p>
                      <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        {prescription.doctorSpecialization}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDownload(prescription)}
                      className={`p-2.5 rounded-lg transition-colors ${
                        isDark
                          ? 'hover:bg-slate-600 text-gray-400 hover:text-white'
                          : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                      }`}
                      title="Download Prescription"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handlePrint(prescription)}
                      className={`p-2.5 rounded-lg transition-colors ${
                        isDark
                          ? 'hover:bg-slate-600 text-gray-400 hover:text-white'
                          : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                      }`}
                      title="Print Prescription"
                    >
                      <Printer className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Card Content */}
              <div className="p-5">
                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2">
                    <User className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                    <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Patient: {patient.first_name} {patient.last_name} ({patient.age}y, {patient.sex})
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Calendar className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                    <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {new Date(prescription.date).toLocaleDateString('en-IN', { 
                        day: 'numeric', 
                        month: 'long', 
                        year: 'numeric' 
                      })}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Stethoscope className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                    <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {prescription.doctorSpecialization} • {prescription.doctorDepartment}
                    </span>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <div className={`w-4 h-4 mt-0.5 rounded-full ${isDark ? 'bg-blue-500/30' : 'bg-blue-100'} flex items-center justify-center`}>
                      <span className={`text-[10px] font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>Dx</span>
                    </div>
                    <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'} line-clamp-2`}>
                      {prescription.diagnosis}
                    </span>
                  </div>
                </div>
                
                {/* Medicines Preview */}
                <div className={`mt-4 pt-4 border-t ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
                  <p className={`text-xs font-semibold mb-3 uppercase tracking-wide ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Medicines ({prescription.medicines.length})
                  </p>
                  <div className="space-y-2">
                    {prescription.medicines.slice(0, 3).map((med, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700'}`}>
                          {idx + 1}
                        </span>
                        <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          {med.name}
                        </span>
                      </div>
                    ))}
                    {prescription.medicines.length > 3 && (
                      <p className={`text-sm ml-7 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                        +{prescription.medicines.length - 3} more medicines
                      </p>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-5 flex gap-3">
                  <button
                    onClick={() => {
                      setSelectedPrescription(prescription);
                      setShowPreview(true);
                    }}
                    className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition-colors ${
                      isDark
                        ? 'bg-slate-700 text-white hover:bg-slate-600'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => handleDownload(prescription)}
                    className="flex-1 py-2.5 px-4 rounded-lg font-medium text-sm bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Preview Modal */}
        {selectedPrescription && showPreview && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className={`w-full max-w-4xl max-h-[90vh] overflow-auto rounded-2xl shadow-2xl ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
              <div className={`p-5 border-b flex items-center justify-between ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
                <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Prescription Details
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePrint(selectedPrescription)}
                    className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 ${
                      isDark
                        ? 'bg-slate-700 text-white hover:bg-slate-600'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Printer className="w-4 h-4" />
                    Print
                  </button>
                  <button
                    onClick={() => {
                      setSelectedPrescription(null);
                      setShowPreview(false);
                    }}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
                  >
                    <span className="text-2xl">×</span>
                  </button>
                </div>
              </div>
              <div className="p-6">
                <PrescriptionDetailView prescription={selectedPrescription} patient={patient} isDark={isDark} />
              </div>
            </div>
          </div>
        )}
      </div>
    </ThemeWrapper>
  );
};

// Prescription Detail View Component
const PrescriptionDetailView: React.FC<{ 
  prescription: Prescription; 
  patient: any; 
  isDark: boolean;
}> = ({ prescription, patient, isDark }) => {
  return (
    <div className={`rounded-xl overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold">Hospital MS</h3>
            <p className="text-blue-100 text-sm">Your health our priority</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-blue-100">Prescription #</p>
            <p className="text-xl font-bold">{prescription.prescriptionNumber}</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Patient & Doctor Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className={`p-4 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-white'} shadow-sm`}>
            <h4 className={`font-semibold mb-3 flex items-center gap-2 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
              <User className="w-4 h-4 text-blue-500" />
              Patient Information
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Name:</span>
                <span className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{patient.first_name} {patient.last_name}</span>
              </div>
              <div className="flex justify-between">
                <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Age:</span>
                <span className={isDark ? 'text-gray-200' : 'text-gray-800'}>{patient.age} years</span>
              </div>
              <div className="flex justify-between">
                <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Sex:</span>
                <span className={isDark ? 'text-gray-200' : 'text-gray-800'}>{patient.sex}</span>
              </div>
              <div className="flex justify-between">
                <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Weight:</span>
                <span className={isDark ? 'text-gray-200' : 'text-gray-800'}>{patient.weight}</span>
              </div>
              <div className="flex justify-between">
                <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Height:</span>
                <span className={isDark ? 'text-gray-200' : 'text-gray-800'}>{patient.height}</span>
              </div>
            </div>
          </div>

          <div className={`p-4 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-white'} shadow-sm`}>
            <h4 className={`font-semibold mb-3 flex items-center gap-2 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
              <Stethoscope className="w-4 h-4 text-blue-500" />
              Doctor Information
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Name:</span>
                <span className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{prescription.doctorName}</span>
              </div>
              <div className="flex justify-between">
                <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Specialization:</span>
                <span className={isDark ? 'text-gray-200' : 'text-gray-800'}>{prescription.doctorSpecialization}</span>
              </div>
              <div className="flex justify-between">
                <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Department:</span>
                <span className={isDark ? 'text-gray-200' : 'text-gray-800'}>{prescription.doctorDepartment}</span>
              </div>
              <div className="flex justify-between">
                <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Date:</span>
                <span className={isDark ? 'text-gray-200' : 'text-gray-800'}>
                  {new Date(prescription.date).toLocaleDateString('en-IN', { 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Diagnosis */}
        <div className={`p-4 rounded-lg ${isDark ? 'bg-yellow-500/10 border border-yellow-500/30' : 'bg-yellow-50 border border-yellow-200'}`}>
          <h4 className={`font-semibold mb-2 flex items-center gap-2 ${isDark ? 'text-yellow-400' : 'text-yellow-700'}`}>
            Diagnosis
          </h4>
          <p className={isDark ? 'text-gray-200' : 'text-gray-800'}>{prescription.diagnosis}</p>
        </div>

        {/* Medicines */}
        <div>
          <h4 className={`font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
            <span className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">Rx</span>
            Prescribed Medicines
          </h4>
          <div className="space-y-3">
            {prescription.medicines.map((med, idx) => (
              <div 
                key={idx} 
                className={`p-4 rounded-lg border-l-4 border-blue-500 ${isDark ? 'bg-slate-800' : 'bg-white'} shadow-sm`}
              >
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {idx + 1}
                  </span>
                  <div className="flex-1">
                    <p className={`font-semibold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{med.name}</p>
                    <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                      <div>
                        <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Dosage: </span>
                        <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{med.dosage}</span>
                      </div>
                      <div>
                        <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Frequency: </span>
                        <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{med.frequency}</span>
                      </div>
                      <div>
                        <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Duration: </span>
                        <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{med.duration}</span>
                      </div>
                    </div>
                    <p className={`mt-2 text-sm italic ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {med.instructions}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tests */}
        {prescription.tests.length > 0 && (
          <div>
            <h4 className={`font-semibold mb-3 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>Recommended Tests</h4>
            <div className="flex flex-wrap gap-2">
              {prescription.tests.map((test, idx) => (
                <span 
                  key={idx}
                  className={`px-3 py-1.5 rounded-full text-sm ${isDark ? 'bg-slate-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}
                >
                  {test}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Advice */}
        <div className={`p-4 rounded-lg ${isDark ? 'bg-green-500/10 border border-green-500/30' : 'bg-green-50 border border-green-200'}`}>
          <h4 className={`font-semibold mb-2 flex items-center gap-2 ${isDark ? 'text-green-400' : 'text-green-700'}`}>
            Doctor's Advice
          </h4>
          <p className={isDark ? 'text-gray-200' : 'text-gray-800'}>{prescription.advice}</p>
        </div>

        {/* Follow-up */}
        <div className={`p-4 rounded-lg ${isDark ? 'bg-red-500/10 border border-red-500/30' : 'bg-red-50 border border-red-200'}`}>
          <h4 className={`font-semibold mb-2 flex items-center gap-2 ${isDark ? 'text-red-400' : 'text-red-700'}`}>
            <Clock className="w-4 h-4" />
            Follow-up
          </h4>
          <p className={isDark ? 'text-gray-200' : 'text-gray-800'}>{prescription.followUp}</p>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-100 dark:bg-slate-800 p-4 text-center text-sm text-gray-500">
        <p>This prescription is generated by Hospital MS</p>
        <p>For any queries, contact: support@hospitalms.com | +91 12345 67890</p>
      </div>
    </div>
  );
};

export default Prescriptions;
