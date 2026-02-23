import React, { useState, useRef } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import ThemeWrapper from '../../components/theme/ThemeWrapper';
import { useAuth } from '../../context/AuthContext';
import { Download, Printer, FileText, Calendar, User, Clock, Stethoscope, Phone, Mail, MapPin } from 'lucide-react';

interface Prescription {
  id: string;
  patientName: string;
  patientAge: number;
  patientSex: string;
  patientWeight: string;
  patientHeight: string;
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
  doctorDegree: string;
  doctorSpecialty: string;
}

const dummyPrescriptions: Prescription[] = [
  {
    id: 'RX-001',
    patientName: 'John Doe',
    patientAge: 45,
    patientSex: 'Male',
    patientWeight: '78 kg',
    patientHeight: '175 cm',
    date: new Date().toISOString().split('T')[0],
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
    doctorName: 'Dr. Sajal Sai',
    doctorDegree: 'MBBS, MD (General Medicine)',
    doctorSpecialty: 'Consultant General Physician'
  },
  {
    id: 'RX-002',
    patientName: 'Sarah Smith',
    patientAge: 32,
    patientSex: 'Female',
    patientWeight: '58 kg',
    patientHeight: '162 cm',
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
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
    doctorName: 'Dr. Sajal Sai',
    doctorDegree: 'MBBS, MD (General Medicine)',
    doctorSpecialty: 'Consultant General Physician'
  },
  {
    id: 'RX-003',
    patientName: 'Michael Johnson',
    patientAge: 58,
    patientSex: 'Male',
    patientWeight: '82 kg',
    patientHeight: '170 cm',
    date: new Date(Date.now() - 172800000).toISOString().split('T')[0],
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
    doctorName: 'Dr. Sajal Sai',
    doctorDegree: 'MBBS, MD (General Medicine)',
    doctorSpecialty: 'Consultant General Physician'
  },
  {
    id: 'RX-004',
    patientName: 'Emily Williams',
    patientAge: 28,
    patientSex: 'Female',
    patientWeight: '55 kg',
    patientHeight: '165 cm',
    date: new Date(Date.now() - 259200000).toISOString().split('T')[0],
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
    doctorName: 'Dr. Sajal Sai',
    doctorDegree: 'MBBS, MD (General Medicine)',
    doctorSpecialty: 'Consultant General Physician'
  }
];

const Prescriptions: React.FC = () => {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const prescriptionRef = useRef<HTMLDivElement>(null);

  const handleDownload = (prescription: Prescription) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const doctorFullName = user?.first_name ? `Dr. ${user.first_name} ${user.last_name || ''}` : prescription.doctorName;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Prescription - ${prescription.patientName}</title>
        <style>
          @page { size: A4; margin: 0; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; }
          .prescription-page {
            width: 210mm;
            min-height: 297mm;
            margin: 0 auto;
            background: white;
            position: relative;
            overflow: hidden;
          }
          .header-curve {
            background: linear-gradient(135deg, #1a3d1a 0%, #2d5a2d 50%, #4a7c4e 100%);
            height: 140px;
            position: relative;
            border-bottom-right-radius: 60px;
          }
          .header-curve::after {
            content: '';
            position: absolute;
            bottom: -40px;
            right: 0;
            width: 100%;
            height: 80px;
            background: linear-gradient(135deg, #f4d03f 0%, #f7dc6f 100%);
            border-radius: 0 0 0 60px;
            z-index: 1;
          }
          .logo-container {
            position: absolute;
            top: 20px;
            left: 30px;
            display: flex;
            align-items: center;
            gap: 15px;
            z-index: 10;
          }
          .logo-icon {
            width: 50px;
            height: 50px;
            background: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 28px;
            color: #2d5a2d;
          }
          .hospital-name {
            color: white;
          }
          .hospital-name h1 {
            font-size: 28px;
            font-weight: bold;
            letter-spacing: 1px;
          }
          .hospital-name p {
            font-size: 12px;
            opacity: 0.9;
            font-style: italic;
          }
          .certification-icons {
            position: absolute;
            top: 20px;
            right: 30px;
            display: flex;
            gap: 15px;
            z-index: 10;
          }
          .cert-icon {
            width: 40px;
            height: 40px;
            background: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: bold;
            color: #2d5a2d;
          }
          .date-field {
            position: absolute;
            top: 80px;
            right: 30px;
            z-index: 10;
            color: #1a3d1a;
            font-weight: 500;
          }
          .main-content {
            display: flex;
            min-height: calc(297mm - 140px);
          }
          .left-sidebar {
            width: 35%;
            background: #f8f9fa;
            padding: 30px 20px;
            border-right: 3px solid #2d5a2d;
          }
          .doctor-info {
            margin-bottom: 30px;
          }
          .doctor-info h3 {
            color: #2d5a2d;
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .doctor-info p {
            color: #666;
            font-size: 12px;
            line-height: 1.6;
          }
          .timing-section {
            margin-bottom: 30px;
          }
          .timing-section h4 {
            color: #2d5a2d;
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 10px;
            border-bottom: 2px solid #f4d03f;
            padding-bottom: 5px;
          }
          .timing-item {
            font-size: 12px;
            color: #555;
            margin-bottom: 8px;
          }
          .timing-item strong {
            color: #2d5a2d;
          }
          .contact-section h4 {
            color: #2d5a2d;
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 10px;
            border-bottom: 2px solid #f4d03f;
            padding-bottom: 5px;
          }
          .contact-item {
            font-size: 11px;
            color: #555;
            margin-bottom: 8px;
            line-height: 1.4;
          }
          .contact-label {
            font-weight: bold;
            color: #2d5a2d;
            display: block;
          }
          .right-content {
            width: 65%;
            padding: 30px;
            position: relative;
          }
          .patient-info {
            margin-bottom: 30px;
          }
          .patient-info-row {
            display: flex;
            gap: 30px;
            margin-bottom: 15px;
            border-bottom: 1px solid #eee;
            padding-bottom: 10px;
          }
          .info-field {
            flex: 1;
          }
          .info-field label {
            font-weight: bold;
            color: #2d5a2d;
            font-size: 13px;
            display: block;
            margin-bottom: 3px;
          }
          .info-field span {
            color: #333;
            font-size: 14px;
          }
          .rx-symbol {
            font-size: 42px;
            color: #2d5a2d;
            font-weight: bold;
            margin: 20px 0;
            border-bottom: 2px solid #f4d03f;
            padding-bottom: 10px;
          }
          .medicines-section {
            margin-bottom: 30px;
          }
          .medicine-item {
            margin-bottom: 20px;
            padding-left: 20px;
            border-left: 3px solid #f4d03f;
          }
          .medicine-name {
            font-weight: bold;
            color: #1a3d1a;
            font-size: 15px;
            margin-bottom: 5px;
          }
          .medicine-details {
            color: #555;
            font-size: 13px;
            line-height: 1.6;
          }
          .diagnosis-box {
            background: #f8f9fa;
            border-left: 4px solid #2d5a2d;
            padding: 15px;
            margin-bottom: 25px;
            border-radius: 0 8px 8px 0;
          }
          .diagnosis-label {
            font-weight: bold;
            color: #2d5a2d;
            font-size: 13px;
            margin-bottom: 5px;
          }
          .diagnosis-text {
            color: #333;
            font-size: 14px;
          }
          .tests-section {
            margin-bottom: 25px;
          }
          .section-title {
            font-weight: bold;
            color: #2d5a2d;
            font-size: 14px;
            margin-bottom: 10px;
            border-bottom: 2px solid #f4d03f;
            padding-bottom: 5px;
          }
          .test-list {
            color: #555;
            font-size: 13px;
            line-height: 1.8;
          }
          .advice-section {
            background: #fff9e6;
            border: 1px solid #f4d03f;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
          }
          .followup-section {
            color: #2d5a2d;
            font-weight: bold;
            font-size: 13px;
            margin-top: 20px;
          }
          .footer-curve {
            background: linear-gradient(135deg, #1a3d1a 0%, #2d5a2d 100%);
            height: 60px;
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            border-top-left-radius: 60px;
          }
          .footer-text {
            position: absolute;
            bottom: 20px;
            right: 30px;
            color: white;
            font-size: 11px;
            z-index: 10;
          }
          .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 120px;
            color: rgba(45, 90, 45, 0.03);
            font-weight: bold;
            pointer-events: none;
            z-index: 0;
          }
          .stethoscope-watermark {
            position: absolute;
            top: 40%;
            left: 60%;
            width: 150px;
            height: 150px;
            opacity: 0.05;
            z-index: 0;
          }
          @media print {
            body { background: white; }
            .prescription-page { margin: 0; width: 100%; }
          }
        </style>
      </head>
      <body>
        <div class="prescription-page">
          <div class="header-curve">
            <div class="logo-container">
              <div class="logo-icon">+</div>
              <div class="hospital-name">
                <h1>Hospital MS</h1>
                <p>Your health our priority</p>
              </div>
            </div>
            <div class="certification-icons">
              <div class="cert-icon">ISO</div>
              <div class="cert-icon">NABH</div>
            </div>
            <div class="date-field">
              Date: ${new Date(prescription.date).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
            </div>
          </div>
          
          <div class="main-content">
            <div class="left-sidebar">
              <div class="doctor-info">
                <h3>${doctorFullName}</h3>
                <p>${prescription.doctorSpecialty}</p>
                <p>${prescription.doctorDegree}</p>
              </div>
              
              <div class="timing-section">
                <h4>Timing</h4>
                <div class="timing-item">
                  <strong>Mon - Fri</strong><br>
                  9:00 am - 1:00 pm<br>
                  4:00 pm - 8:00 pm
                </div>
                <div class="timing-item">
                  <strong>Sat</strong><br>
                  9:00 am - 1:00 pm
                </div>
              </div>
              
              <div class="contact-section">
                <h4>Contact</h4>
                <div class="contact-item">
                  <span class="contact-label">Phone:</span>
                  +91 12345 67890<br>
                  +91 98765 43210
                </div>
                <div class="contact-item">
                  <span class="contact-label">Email:</span>
                  info@hospitalms.com
                </div>
                <div class="contact-item">
                  <span class="contact-label">Address:</span>
                  123 Healthcare Complex,<br>
                  Main Road, City - 400001
                </div>
              </div>
            </div>
            
            <div class="right-content">
              <div class="watermark">Rx</div>
              
              <div class="patient-info">
                <div class="patient-info-row">
                  <div class="info-field">
                    <label>Name:</label>
                    <span>${prescription.patientName}</span>
                  </div>
                  <div class="info-field">
                    <label>Age:</label>
                    <span>${prescription.patientAge} years</span>
                  </div>
                </div>
                <div class="patient-info-row">
                  <div class="info-field">
                    <label>Sex:</label>
                    <span>${prescription.patientSex}</span>
                  </div>
                  <div class="info-field">
                    <label>Weight:</label>
                    <span>${prescription.patientWeight}</span>
                  </div>
                  <div class="info-field">
                    <label>Height:</label>
                    <span>${prescription.patientHeight}</span>
                  </div>
                </div>
              </div>
              
              <div class="diagnosis-box">
                <div class="diagnosis-label">Diagnosis:</div>
                <div class="diagnosis-text">${prescription.diagnosis}</div>
              </div>
              
              <div class="rx-symbol">Rx</div>
              
              <div class="medicines-section">
                ${prescription.medicines.map(med => `
                  <div class="medicine-item">
                    <div class="medicine-name">${med.name}</div>
                    <div class="medicine-details">
                      ${med.dosage} | ${med.frequency}<br>
                      Duration: ${med.duration}<br>
                      <em>${med.instructions}</em>
                    </div>
                  </div>
                `).join('')}
              </div>
              
              <div class="tests-section">
                <div class="section-title">Recommended Tests:</div>
                <div class="test-list">
                  ${prescription.tests.map(test => `• ${test}`).join('<br>')}
                </div>
              </div>
              
              <div class="advice-section">
                <div class="section-title">Advice:</div>
                <div style="color: #555; font-size: 13px;">${prescription.advice}</div>
              </div>
              
              <div class="followup-section">
                Follow-up: ${prescription.followUp}
              </div>
            </div>
          </div>
          
          <div class="footer-curve">
            <div class="footer-text">Not for Medico legal purpose</div>
          </div>
        </div>
        <script>
          window.onload = function() { window.print(); };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handlePrint = (prescription: Prescription) => {
    handleDownload(prescription);
  };

  return (
    <ThemeWrapper>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Prescriptions
          </h1>
          <div className="flex gap-3">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                showPreview
                  ? 'bg-blue-600 text-white'
                  : isDark
                  ? 'bg-slate-700 text-white hover:bg-slate-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FileText className="w-4 h-4" />
              {showPreview ? 'Hide Preview' : 'Preview All'}
            </button>
          </div>
        </div>

        {/* Prescriptions List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {dummyPrescriptions.map((prescription) => (
            <div
              key={prescription.id}
              className={`rounded-xl shadow-md overflow-hidden transition-all hover:shadow-lg ${
                isDark ? 'bg-slate-800/80 border border-slate-700' : 'bg-white border border-gray-200'
              }`}
            >
              <div className={`p-4 border-b ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isDark ? 'bg-blue-900/50' : 'bg-blue-100'}`}>
                      <FileText className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                    </div>
                    <div>
                      <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {prescription.id}
                      </p>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {prescription.patientName}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDownload(prescription)}
                      className={`p-2 rounded-lg transition-colors ${
                        isDark
                          ? 'hover:bg-slate-700 text-gray-400 hover:text-white'
                          : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                      }`}
                      title="Download Prescription"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handlePrint(prescription)}
                      className={`p-2 rounded-lg transition-colors ${
                        isDark
                          ? 'hover:bg-slate-700 text-gray-400 hover:text-white'
                          : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                      }`}
                      title="Print Prescription"
                    >
                      <Printer className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                    <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {prescription.patientAge} years, {prescription.patientSex}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                    <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {new Date(prescription.date).toLocaleDateString('en-IN', { 
                        day: 'numeric', 
                        month: 'short', 
                        year: 'numeric' 
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Stethoscope className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                    <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {prescription.diagnosis.substring(0, 40)}{prescription.diagnosis.length > 40 ? '...' : ''}
                    </span>
                  </div>
                </div>
                
                <div className={`mt-4 pt-4 border-t ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
                  <p className={`text-xs font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Medicines ({prescription.medicines.length})
                  </p>
                  <div className="space-y-1">
                    {prescription.medicines.slice(0, 3).map((med, idx) => (
                      <p key={idx} className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        • {med.name}
                      </p>
                    ))}
                    {prescription.medicines.length > 3 && (
                      <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                        +{prescription.medicines.length - 3} more
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedPrescription(prescription);
                      setShowPreview(true);
                    }}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-colors ${
                      isDark
                        ? 'bg-slate-700 text-white hover:bg-slate-600'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => handleDownload(prescription)}
                    className="flex-1 py-2 px-4 rounded-lg font-medium text-sm bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
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
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className={`w-full max-w-4xl max-h-[90vh] overflow-auto rounded-xl ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
              <div className={`p-4 border-b flex items-center justify-between ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
                <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Prescription Preview
                </h2>
                <button
                  onClick={() => setSelectedPrescription(null)}
                  className={`p-2 rounded-lg ${isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-100'}`}
                >
                  ✕
                </button>
              </div>
              <div className="p-4">
                <PrescriptionPreview prescription={selectedPrescription} user={user} />
              </div>
            </div>
          </div>
        )}
      </div>
    </ThemeWrapper>
  );
};

// Prescription Preview Component
const PrescriptionPreview: React.FC<{ prescription: Prescription; user: any }> = ({ prescription, user }) => {
  const doctorFullName = user?.first_name ? `Dr. ${user.first_name} ${user.last_name || ''}` : prescription.doctorName;
  
  return (
    <div className="bg-white p-8 rounded-lg shadow-lg" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div className="bg-gradient-to-r from-green-900 to-green-700 text-white p-6 rounded-t-lg relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-green-800 text-2xl font-bold">
              +
            </div>
            <div>
              <h1 className="text-2xl font-bold">Hospital MS</h1>
              <p className="text-sm opacity-90 italic">Your health our priority</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-green-100">Date: {new Date(prescription.date).toLocaleDateString('en-IN')}</p>
          </div>
        </div>
        <div className="absolute bottom-0 right-0 w-full h-4 bg-gradient-to-r from-yellow-400 to-yellow-300 rounded-bl-full"></div>
      </div>

      <div className="flex">
        {/* Left Sidebar */}
        <div className="w-1/3 bg-gray-50 p-6 border-r-2 border-green-800">
          <div className="mb-6">
            <h3 className="text-green-800 font-bold text-lg">{doctorFullName}</h3>
            <p className="text-gray-600 text-sm">{prescription.doctorSpecialty}</p>
            <p className="text-gray-500 text-sm">{prescription.doctorDegree}</p>
          </div>

          <div className="mb-6">
            <h4 className="text-green-800 font-bold border-b-2 border-yellow-400 pb-1 mb-3">Timing</h4>
            <div className="text-sm text-gray-600 space-y-2">
              <p><strong className="text-green-800">Mon - Fri</strong><br />9:00 am - 1:00 pm<br />4:00 pm - 8:00 pm</p>
              <p><strong className="text-green-800">Sat</strong><br />9:00 am - 1:00 pm</p>
            </div>
          </div>

          <div>
            <h4 className="text-green-800 font-bold border-b-2 border-yellow-400 pb-1 mb-3">Contact</h4>
            <div className="text-xs text-gray-600 space-y-2">
              <p><strong className="text-green-800 block">Phone:</strong>+91 12345 67890</p>
              <p><strong className="text-green-800 block">Email:</strong>info@hospitalms.com</p>
              <p><strong className="text-green-800 block">Address:</strong>123 Healthcare Complex,<br />Main Road, City - 400001</p>
            </div>
          </div>
        </div>

        {/* Right Content */}
        <div className="w-2/3 p-6">
          {/* Patient Info */}
          <div className="mb-6 space-y-3">
            <div className="flex gap-8 border-b border-gray-200 pb-2">
              <div>
                <span className="text-green-800 font-bold text-sm">Name:</span>
                <span className="ml-2 text-gray-800">{prescription.patientName}</span>
              </div>
              <div>
                <span className="text-green-800 font-bold text-sm">Age:</span>
                <span className="ml-2 text-gray-800">{prescription.patientAge} years</span>
              </div>
            </div>
            <div className="flex gap-8 border-b border-gray-200 pb-2">
              <div>
                <span className="text-green-800 font-bold text-sm">Sex:</span>
                <span className="ml-2 text-gray-800">{prescription.patientSex}</span>
              </div>
              <div>
                <span className="text-green-800 font-bold text-sm">Weight:</span>
                <span className="ml-2 text-gray-800">{prescription.patientWeight}</span>
              </div>
              <div>
                <span className="text-green-800 font-bold text-sm">Height:</span>
                <span className="ml-2 text-gray-800">{prescription.patientHeight}</span>
              </div>
            </div>
          </div>

          {/* Diagnosis */}
          <div className="bg-gray-50 border-l-4 border-green-800 p-4 mb-6 rounded-r-lg">
            <span className="text-green-800 font-bold text-sm block mb-1">Diagnosis:</span>
            <span className="text-gray-800">{prescription.diagnosis}</span>
          </div>

          {/* Rx Symbol */}
          <div className="text-4xl font-bold text-green-800 mb-4 border-b-2 border-yellow-400 pb-2">Rx</div>

          {/* Medicines */}
          <div className="mb-6 space-y-4">
            {prescription.medicines.map((med, idx) => (
              <div key={idx} className="border-l-4 border-yellow-400 pl-4">
                <p className="font-bold text-green-900">{med.name}</p>
                <p className="text-gray-600 text-sm">{med.dosage} | {med.frequency}</p>
                <p className="text-gray-600 text-sm">Duration: {med.duration}</p>
                <p className="text-gray-500 text-sm italic">{med.instructions}</p>
              </div>
            ))}
          </div>

          {/* Tests */}
          <div className="mb-6">
            <h4 className="text-green-800 font-bold border-b-2 border-yellow-400 pb-1 mb-3">Recommended Tests:</h4>
            <div className="text-gray-700">
              {prescription.tests.map((test, idx) => (
                <span key={idx} className="mr-4">• {test}</span>
              ))}
            </div>
          </div>

          {/* Advice */}
          <div className="bg-yellow-50 border border-yellow-400 p-4 rounded-lg mb-4">
            <h4 className="text-green-800 font-bold mb-2">Advice:</h4>
            <p className="text-gray-700">{prescription.advice}</p>
          </div>

          {/* Follow-up */}
          <div className="text-green-800 font-bold">
            Follow-up: {prescription.followUp}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gradient-to-r from-green-900 to-green-700 text-white p-4 rounded-b-lg mt-6">
        <p className="text-right text-sm">Not for Medico legal purpose</p>
      </div>
    </div>
  );
};

export default Prescriptions;
