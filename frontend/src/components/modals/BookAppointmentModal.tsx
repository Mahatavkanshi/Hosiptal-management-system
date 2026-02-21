import { useState, useEffect, useRef } from 'react';
import { X, Video, User, Users, Calendar, Clock, Stethoscope, IndianRupee, Plus, Trash2, Loader2, Phone, Share2, CreditCard, Brain } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { initiateRazorpayPayment } from '../../utils/razorpay';
import VideoCallSetup from '../video/VideoCallSetup';
import VideoCall from '../video/VideoCall';
import aiService from '../../services/aiService';

interface BookAppointmentModalProps {
  onClose: () => void;
  onSuccess: (appointment?: any) => void;
}

interface Doctor {
  id: string;
  first_name: string;
  last_name: string;
  specialization: string;
  email: string;
  phone: string;
  consultation_fee?: number;
}

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  age: number;
  phone: string;
  disease?: string;
}

interface BillItem {
  id: string;
  description: string;
  amount: number;
}

type AppointmentType = 'doctor-to-doctor' | 'doctor-to-patient';
type Step = 'details' | 'payment' | 'payment-screenshot' | 'setup' | 'video';

// Dummy doctor data - in production, this would come from the logged-in user's profile
const DOCTOR_WHATSAPP_NUMBER = '+91 98765 43210';
const DOCTOR_NAME = 'Dr. Smith';
const DOCTOR_UPID = 'doctor@upi';

const BookAppointmentModal = ({ onClose, onSuccess }: BookAppointmentModalProps) => {
  const [activeTab, setActiveTab] = useState<AppointmentType>('doctor-to-patient');
  const [step, setStep] = useState<Step>('details');
  const [showVideoSetup, setShowVideoSetup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  
  // Video call state
  const [videoCallUrl, setVideoCallUrl] = useState('');
  
  // Doctor-to-Doctor fields
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [meetingTopic, setMeetingTopic] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingTime, setMeetingTime] = useState('');
  const [requirePayment, setRequirePayment] = useState(false);
  
  // Doctor-to-Patient fields
  const [selectedPatient, setSelectedPatient] = useState('');
  const [patientDisease, setPatientDisease] = useState('');
  const [consultationReason, setConsultationReason] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  
  // Payment state
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemAmount, setNewItemAmount] = useState('');
  const [, setPaymentComplete] = useState(false);
  const [paymentOption, setPaymentOption] = useState<'with-payment' | 'without-payment'>('with-payment');
  
  // AI Analysis state
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);
  
  // Ref to store appointment data temporarily
  const appointmentDataRef = useRef<any>(null);

  // Demo data
  const demoDoctors: Doctor[] = [
    { id: 'demo-doc-1', first_name: 'Sarah', last_name: 'Johnson', specialization: 'Cardiology', email: 'sarah@hospital.com', phone: '555-1001', consultation_fee: 1000 },
    { id: 'demo-doc-2', first_name: 'Michael', last_name: 'Chen', specialization: 'Neurology', email: 'michael@hospital.com', phone: '555-1002', consultation_fee: 1500 },
    { id: 'demo-doc-3', first_name: 'Emily', last_name: 'Davis', specialization: 'Pediatrics', email: 'emily@hospital.com', phone: '555-1003', consultation_fee: 800 },
    { id: 'demo-doc-4', first_name: 'Robert', last_name: 'Wilson', specialization: 'Orthopedics', email: 'robert@hospital.com', phone: '555-1004', consultation_fee: 0 },
  ];

  const demoPatients: Patient[] = [
    { id: 'demo-patient-1', first_name: 'John', last_name: 'Doe', age: 45, phone: '555-0101', disease: 'Hypertension' },
    { id: 'demo-patient-2', first_name: 'Jane', last_name: 'Smith', age: 32, phone: '555-0102', disease: 'Diabetes' },
    { id: 'demo-patient-3', first_name: 'Michael', last_name: 'Brown', age: 28, phone: '555-0103', disease: 'Asthma' },
    { id: 'demo-patient-4', first_name: 'Sarah', last_name: 'Wilson', age: 56, phone: '555-0104', disease: 'Arthritis' },
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setDoctors(demoDoctors);
    setPatients(demoPatients);

    try {
      const doctorsRes = await api.get('/users?role=doctor');
      const realDoctors = doctorsRes.data?.data || [];
      if (realDoctors.length > 0) {
        setDoctors([...realDoctors, ...demoDoctors]);
      }

      const patientsRes = await api.get('/doctor-dashboard/my-patients?limit=50');
      const realPatients = patientsRes.data?.data?.patients || [];
      if (realPatients.length > 0) {
        setPatients([...realPatients, ...demoPatients]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleAIAnalysis = async () => {
    if (!consultationReason.trim()) {
      toast.error('Please enter consultation reason/symptoms first');
      return;
    }

    setAiAnalyzing(true);
    try {
      const response = await aiService.analyzeSymptoms({
        symptoms: consultationReason,
        patient_id: selectedPatient || undefined
      });

      if (response.success && response.data) {
        setAiResult(response.data.ai_response);
        toast.success('AI analysis complete!');
      } else {
        toast.error(response.message || 'AI analysis failed');
      }
    } catch (error: any) {
      console.error('AI Analysis Error:', error);
      if (error.response?.status === 503) {
        toast.error('AI service unavailable, please proceed manually');
      } else {
        toast.error('Failed to analyze symptoms');
      }
    } finally {
      setAiAnalyzing(false);
    }
  };

  const totalAmount = billItems.reduce((sum, item) => sum + item.amount, 0);

  const addBillItem = () => {
    if (!newItemDesc || !newItemAmount) {
      toast.error('Please enter description and amount');
      return;
    }

    const newItem: BillItem = {
      id: Date.now().toString(),
      description: newItemDesc,
      amount: parseFloat(newItemAmount)
    };

    setBillItems([...billItems, newItem]);
    setNewItemDesc('');
    setNewItemAmount('');
  };

  const removeBillItem = (id: string) => {
    setBillItems(billItems.filter(item => item.id !== id));
  };

  const generateVideoCallUrl = () => {
    // Generate a unique room URL using Daily.co
    const roomName = `hospital-consultation-${Date.now()}`;
    return `https://daily.co/${roomName}`;
  };

  const handleDoctorToDoctorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDoctor || !meetingTopic || !meetingDate || !meetingTime) {
      toast.error('Please fill in all required fields');
      return;
    }

    const selectedDoctorObj = doctors.find(d => d.id === selectedDoctor);
    const consultationFee = selectedDoctorObj?.consultation_fee || 0;

    if (consultationFee > 0 && requirePayment) {
      // Show payment step
      setBillItems([{ id: '1', description: 'Consultation Fee', amount: consultationFee }]);
      setStep('payment');
    } else {
      // No payment required, show video setup
      const url = generateVideoCallUrl();
      setVideoCallUrl(url);
      setShowVideoSetup(true);
      
      // Save appointment data for later
      const appointmentData = {
        id: 'apt-doc-' + Date.now(),
        type: 'doctor-to-doctor',
        peer_doctor_id: selectedDoctor,
        peer_doctor_name: `Dr. ${selectedDoctorObj?.first_name} ${selectedDoctorObj?.last_name}`,
        peer_specialization: selectedDoctorObj?.specialization,
        meeting_topic: meetingTopic,
        meeting_date: meetingDate,
        meeting_time: meetingTime,
        video_url: url,
        payment_required: false,
        payment_amount: 0,
        status: 'active'
      };

      // Save to localStorage for demo
      const existingAppointments = JSON.parse(localStorage.getItem('doctor_appointments') || '[]');
      localStorage.setItem('doctor_appointments', JSON.stringify([appointmentData, ...existingAppointments]));
    }
  };

  const handleDoctorToPatientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPatient || !consultationReason || !appointmentDate || !appointmentTime) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Set default bill items for patient consultation
    setBillItems([{ id: '1', description: 'Consultation Fee', amount: 500 }]);
    setStep('payment');
  };

  const handlePaymentOptionSelect = (option: 'with-payment' | 'without-payment') => {
    setPaymentOption(option);
    
    if (option === 'without-payment') {
      // Start video call directly without payment
      startVideoCall();
    } else {
      // Show payment screenshot option
      setStep('payment-screenshot');
    }
  };

  const startVideoCall = async () => {
    setLoading(true);
    
    const selectedPatientObj = patients.find(p => p.id === selectedPatient);
    const videoUrl = generateVideoCallUrl();

    try {
      // Save appointment to database
      const appointmentPayload = {
        patient_id: selectedPatient,
        appointment_date: appointmentDate,
        appointment_time: appointmentTime,
        symptoms: patientDisease,
        notes: consultationReason
      };
      
      const apiResponse = await api.post('/appointments/doctor-book', appointmentPayload);
      
      if (apiResponse.data.success) {
        const savedAppointment = apiResponse.data.data;
        
        // Create appointment data for UI
        const appointmentData = {
          id: savedAppointment.id,
          type: 'video',
          patient_id: selectedPatient,
          patient_first_name: selectedPatientObj?.first_name,
          patient_last_name: selectedPatientObj?.last_name,
          patient_age: selectedPatientObj?.age,
          patient_phone: selectedPatientObj?.phone,
          patient_disease: patientDisease,
          consultation_reason: consultationReason,
          appointment_date: appointmentDate,
          appointment_time: appointmentTime,
          video_url: videoUrl,
          payment_status: paymentOption === 'with-payment' ? 'pending' : 'waived',
          payment_amount: paymentOption === 'with-payment' ? totalAmount : 0,
          status: savedAppointment.status || 'confirmed'
        };

        // Save appointment to localStorage for stats tracking
        const existingAppointments = JSON.parse(localStorage.getItem('doctor_appointments') || '[]');
        localStorage.setItem('doctor_appointments', JSON.stringify([appointmentData, ...existingAppointments]));

        // Save activity
        const paymentActivity = {
          id: 'payment-' + Date.now(),
          type: 'appointment',
          patient_name: `${selectedPatientObj?.first_name} ${selectedPatientObj?.last_name}`,
          description: `Booked video consultation with patient`,
          amount: paymentOption === 'with-payment' ? totalAmount : 0,
          created_at: new Date().toISOString(),
        };
        
        const existingActivities = JSON.parse(localStorage.getItem('payment_activities') || '[]');
        localStorage.setItem('payment_activities', JSON.stringify([paymentActivity, ...existingActivities]));

        setPaymentComplete(true);
        setLoading(false);
        setVideoCallUrl(videoUrl);
        setShowVideoSetup(true);
        
        toast.success(paymentOption === 'with-payment' 
          ? 'Please collect payment before starting the call.'
          : 'Starting video call...');
        
        // Store appointment data for when setup is complete
        appointmentDataRef.current = appointmentData;
      }
    } catch (error) {
      console.error('Error saving appointment:', error);
      setLoading(false);
      toast.error('Failed to save appointment. Please try again.');
    }
  };

  const handlePayment = async () => {
    if (billItems.length === 0) {
      toast.error('Please add at least one bill item');
      return;
    }

    setLoading(true);

    const isDoctorToDoctor = activeTab === 'doctor-to-doctor';
    const selectedDoctorObj = doctors.find(d => d.id === selectedDoctor);
    const selectedPatientObj = patients.find(p => p.id === selectedPatient);

    const videoUrl = generateVideoCallUrl();

    try {
      await initiateRazorpayPayment({
        amount: totalAmount,
        currency: 'INR',
        description: isDoctorToDoctor 
          ? `Doctor Consultation - ${meetingTopic}`
          : `Patient Consultation - ${selectedPatientObj?.first_name} ${selectedPatientObj?.last_name}`,
        receipt: `APT-${Date.now()}`,
        patientName: isDoctorToDoctor 
          ? `Dr. ${selectedDoctorObj?.first_name} ${selectedDoctorObj?.last_name}`
          : `${selectedPatientObj?.first_name} ${selectedPatientObj?.last_name}`,
        patientEmail: '',
        patientPhone: isDoctorToDoctor ? selectedDoctorObj?.phone : selectedPatientObj?.phone || '',
        onSuccess: async (response: any) => {
          console.log('Payment successful:', response);
          
          // For doctor-to-doctor consultations only
          if (isDoctorToDoctor) {
            const appointmentData = {
              id: 'apt-' + Date.now(),
              type: activeTab,
              peer_doctor_id: selectedDoctor,
              peer_doctor_name: `Dr. ${selectedDoctorObj?.first_name} ${selectedDoctorObj?.last_name}`,
              peer_specialization: selectedDoctorObj?.specialization,
              meeting_topic: meetingTopic,
              meeting_date: meetingDate,
              meeting_time: meetingTime,
              video_url: videoUrl,
              payment_status: 'paid',
              payment_amount: totalAmount,
              razorpay_payment_id: response.razorpay_payment_id,
              status: 'active'
            };

            // Save peer consultation payment to payment history
            const receiptNumber = `RCP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            const paymentRecord = {
              receipt_number: receiptNumber,
              patient_name: `Dr. ${selectedDoctorObj?.first_name} ${selectedDoctorObj?.last_name}`,
              amount: totalAmount,
              payment_method: 'online',
              date: new Date().toISOString(),
              status: 'completed',
              type: 'peer_consultation',
              description: `Peer consultation: ${meetingTopic}`
            };
            
            const existingPayments = JSON.parse(localStorage.getItem('payments') || '[]');
            localStorage.setItem('payments', JSON.stringify([paymentRecord, ...existingPayments]));

            // Also save to payment_activities for Recent Activity
            const paymentActivity = {
              id: 'payment-' + Date.now(),
              type: 'payment',
              patient_name: `Dr. ${selectedDoctorObj?.first_name} ${selectedDoctorObj?.last_name}`,
              description: `Peer consultation payment - ${meetingTopic}`,
              amount: totalAmount,
              created_at: new Date().toISOString(),
            };
            
            const existingActivities = JSON.parse(localStorage.getItem('payment_activities') || '[]');
            localStorage.setItem('payment_activities', JSON.stringify([paymentActivity, ...existingActivities]));

            setPaymentComplete(true);
            setLoading(false);
            setVideoCallUrl(videoUrl);
            setShowVideoSetup(true);
            
            toast.success('Payment successful! Please set up your camera and microphone.');
            
            // Save appointment to localStorage for stats tracking
            const existingAppointments = JSON.parse(localStorage.getItem('doctor_appointments') || '[]');
            localStorage.setItem('doctor_appointments', JSON.stringify([appointmentData, ...existingAppointments]));

            // Store appointment data for when setup is complete
            appointmentDataRef.current = appointmentData;
          }
        },
        onFailure: (error: any) => {
          console.error('Payment failed:', error);
          setLoading(false);
          toast.error('Payment failed. Please try again.');
        }
      });
    } catch (error) {
      console.error('Error initiating payment:', error);
      setLoading(false);
      toast.error('Failed to initiate payment');
    }
  };

  const handleShareToWhatsApp = () => {
    const selectedPatientObj = patients.find(p => p.id === selectedPatient);
    const message = `Payment Details for ${selectedPatientObj?.first_name} ${selectedPatientObj?.last_name}

Bill Summary:
${billItems.map(item => `- ${item.description}: ₹${item.amount}`).join('\n')}

Total Amount: ₹${totalAmount}

Please make the payment to:
UPI ID: ${DOCTOR_UPID}
Doctor: ${DOCTOR_NAME}
WhatsApp: ${DOCTOR_WHATSAPP_NUMBER}

After payment, please share the screenshot on this WhatsApp number to start the video consultation.`;

    const whatsappUrl = `https://wa.me/${DOCTOR_WHATSAPP_NUMBER.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleProceedAfterPaymentScreenshot = () => {
    // Save payment to payment history
    const selectedPatientObj = patients.find(p => p.id === selectedPatient);
    const receiptNumber = `RCP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    const paymentRecord = {
      receipt_number: receiptNumber,
      patient_name: `${selectedPatientObj?.first_name} ${selectedPatientObj?.last_name}`,
      amount: totalAmount,
      payment_method: 'online',
      date: new Date().toISOString(),
      status: 'completed',
      type: 'patient_consultation',
      description: 'Video consultation fee'
    };
    
    const existingPayments = JSON.parse(localStorage.getItem('payments') || '[]');
    localStorage.setItem('payments', JSON.stringify([paymentRecord, ...existingPayments]));
    
    // Also save to payment_activities for Recent Activity
    const paymentActivity = {
      id: 'payment-' + Date.now(),
      type: 'payment',
      patient_name: `${selectedPatientObj?.first_name} ${selectedPatientObj?.last_name}`,
      description: `Consultation payment collected - ${receiptNumber}`,
      amount: totalAmount,
      created_at: new Date().toISOString(),
    };
    
    const existingActivities = JSON.parse(localStorage.getItem('payment_activities') || '[]');
    localStorage.setItem('payment_activities', JSON.stringify([paymentActivity, ...existingActivities]));
    
    startVideoCall();
  };

  const today = new Date().toISOString().split('T')[0];

  // Payment Screenshot Step
  if (step === 'payment-screenshot') {
    const selectedPatientObj = patients.find(p => p.id === selectedPatient);
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <CreditCard className="h-5 w-5 mr-2 text-primary-600" />
              Payment Details
            </h2>
            <button onClick={() => setStep('payment')} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Bill Summary */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Bill Summary</h3>
              <div className="space-y-2">
                {billItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-center">
                    <span className="text-gray-700">{item.description}</span>
                    <span className="font-medium">₹{item.amount}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-300 flex justify-between items-center">
                <span className="font-bold text-gray-900">Total Amount:</span>
                <span className="text-2xl font-bold text-primary-600">₹{totalAmount}</span>
              </div>
            </div>

            {/* Patient Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Patient</h4>
              <p className="text-blue-800">
                {selectedPatientObj?.first_name} {selectedPatientObj?.last_name} ({selectedPatientObj?.age} years)
              </p>
            </div>

            {/* Payment Instructions */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-900 mb-2 flex items-center">
                <Phone className="h-4 w-4 mr-2" />
                Payment Instructions
              </h4>
              <p className="text-sm text-yellow-800 mb-3">
                Please ask the patient to make the payment and share the screenshot on WhatsApp.
              </p>
              <div className="bg-white rounded p-3 border border-yellow-300">
                <p className="text-sm font-medium text-gray-900">Doctor UPI ID:</p>
                <p className="text-lg font-bold text-primary-600">{DOCTOR_UPID}</p>
                <p className="text-sm text-gray-600 mt-2">WhatsApp: {DOCTOR_WHATSAPP_NUMBER}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <button
                onClick={handleShareToWhatsApp}
                className="w-full py-3 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium flex items-center justify-center"
              >
                <Share2 className="h-5 w-5 mr-2" />
                Share Payment Details on WhatsApp
              </button>
              
              <button
                onClick={handleProceedAfterPaymentScreenshot}
                disabled={loading}
                className="w-full py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 font-medium flex items-center justify-center disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Video className="h-5 w-5 mr-2" />
                    Start Video Call (Payment Collected)
                  </>
                )}
              </button>
              
              <button
                onClick={() => setStep('payment')}
                className="w-full py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium"
              >
                ← Back to Payment Options
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show video call setup before starting the actual call
  if (showVideoSetup) {
    const peerName = activeTab === 'doctor-to-doctor' 
      ? doctors.find(d => d.id === selectedDoctor)?.first_name + ' ' + doctors.find(d => d.id === selectedDoctor)?.last_name
      : patients.find(p => p.id === selectedPatient)?.first_name + ' ' + patients.find(p => p.id === selectedPatient)?.last_name;
    
    return (
      <VideoCallSetup
        isOpen={showVideoSetup}
        onClose={() => {
          setShowVideoSetup(false);
          // If they close setup, still consider it a success
          const aptData = appointmentDataRef.current;
          if (aptData) {
            onSuccess(aptData);
            appointmentDataRef.current = null;
          }
        }}
        onStartCall={() => {
          setShowVideoSetup(false);
          setStep('video');
          // Video call component will be rendered in the next render cycle
          toast.success('Starting video call...');
        }}
        peerName={peerName || 'Consultation'}
        appointmentType={activeTab}
      />
    );
  }

  if (step === 'video' && videoCallUrl) {
    const peerName = activeTab === 'doctor-to-doctor'
      ? `Dr. ${doctors.find(d => d.id === selectedDoctor)?.first_name} ${doctors.find(d => d.id === selectedDoctor)?.last_name}`
      : `${patients.find(p => p.id === selectedPatient)?.first_name} ${patients.find(p => p.id === selectedPatient)?.last_name}`;
    
    return (
      <VideoCall
        isOpen={true}
        onClose={() => {
          onSuccess(appointmentDataRef.current);
          appointmentDataRef.current = null;
        }}
        peerName={peerName || 'Consultation'}
        appointmentType={activeTab}
        roomId={videoCallUrl.split('/').pop() || 'room-' + Date.now()}
        patientId={activeTab === 'doctor-to-patient' ? selectedPatient : undefined}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <Video className="h-5 w-5 mr-2 text-primary-600" />
            Book Video Consultation
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex">
            <button
              onClick={() => {
                setActiveTab('doctor-to-patient');
                setStep('details');
              }}
              className={`flex-1 py-4 px-1 text-center border-b-2 font-medium text-sm flex items-center justify-center ${
                activeTab === 'doctor-to-patient'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <User className="h-5 w-5 mr-2" />
              Consult Patient
            </button>
            <button
              onClick={() => {
                setActiveTab('doctor-to-doctor');
                setStep('details');
              }}
              className={`flex-1 py-4 px-1 text-center border-b-2 font-medium text-sm flex items-center justify-center ${
                activeTab === 'doctor-to-doctor'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Users className="h-5 w-5 mr-2" />
              Peer Consultation
            </button>
          </nav>
        </div>

        <div className="p-6">
          {step === 'details' ? (
            <>
              {activeTab === 'doctor-to-doctor' ? (
                /* Doctor-to-Doctor Form */
                <form onSubmit={handleDoctorToDoctorSubmit} className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <p className="text-sm text-blue-800">
                      Schedule a video consultation with another doctor. Some doctors may charge a consultation fee.
                    </p>
                  </div>

                  {/* Select Doctor */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <Stethoscope className="h-4 w-4 mr-2 text-gray-400" />
                      Select Doctor *
                    </label>
                    <select
                      value={selectedDoctor}
                      onChange={(e) => {
                        setSelectedDoctor(e.target.value);
                        const doc = doctors.find(d => d.id === e.target.value);
                        if (doc && doc.consultation_fee && doc.consultation_fee > 0) {
                          setRequirePayment(true);
                        } else {
                          setRequirePayment(false);
                        }
                      }}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      required
                    >
                      <option value="">Choose a doctor...</option>
                      {doctors.map((doctor) => (
                        <option key={doctor.id} value={doctor.id}>
                          Dr. {doctor.first_name} {doctor.last_name} - {doctor.specialization} 
                          {doctor.consultation_fee ? `(₹${doctor.consultation_fee})` : '(Free)'}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Meeting Topic */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Meeting Topic/Reason *
                    </label>
                    <input
                      type="text"
                      value={meetingTopic}
                      onChange={(e) => setMeetingTopic(e.target.value)}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      placeholder="e.g., Case discussion, Second opinion required..."
                      required
                    />
                  </div>

                  {/* Date and Time */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                        Date *
                      </label>
                      <input
                        type="date"
                        value={meetingDate}
                        onChange={(e) => setMeetingDate(e.target.value)}
                        min={today}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-gray-400" />
                        Time *
                      </label>
                      <input
                        type="time"
                        value={meetingTime}
                        onChange={(e) => setMeetingTime(e.target.value)}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                        required
                      />
                    </div>
                  </div>

                  {/* Payment Notice */}
                  {selectedDoctor && (() => {
                    const doc = doctors.find(d => d.id === selectedDoctor);
                    return doc && doc.consultation_fee && doc.consultation_fee > 0;
                  })() && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-sm text-yellow-800">
                        This doctor charges ₹{doctors.find(d => d.id === selectedDoctor)?.consultation_fee} for consultation.
                      </p>
                    </div>
                  )}

                  <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 font-medium flex items-center"
                    >
                      <Video className="h-4 w-4 mr-2" />
                      Start Video Call
                    </button>
                  </div>
                </form>
              ) : (
                /* Doctor-to-Patient Form */
                <form onSubmit={handleDoctorToPatientSubmit} className="space-y-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                    <p className="text-sm text-green-800">
                      Schedule a video consultation with your patient. Choose payment option or start without payment.
                    </p>
                  </div>

                  {/* Select Patient */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <User className="h-4 w-4 mr-2 text-gray-400" />
                      Select Patient *
                    </label>
                    <select
                      value={selectedPatient}
                      onChange={(e) => setSelectedPatient(e.target.value)}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      required
                    >
                      <option value="">Choose a patient...</option>
                      {patients.map((patient) => (
                        <option key={patient.id} value={patient.id}>
                          {patient.first_name} {patient.last_name} ({patient.age} years)
                          {patient.disease ? ` - ${patient.disease}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Patient Disease */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Disease/Condition
                    </label>
                    <input
                      type="text"
                      value={patientDisease}
                      onChange={(e) => setPatientDisease(e.target.value)}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      placeholder="e.g., Diabetes, Hypertension..."
                    />
                  </div>

                  {/* Consultation Reason */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Consultation Reason / Symptoms *
                    </label>
                    <textarea
                      value={consultationReason}
                      onChange={(e) => setConsultationReason(e.target.value)}
                      rows={3}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      placeholder="Describe the patient's symptoms and reason for consultation..."
                      required
                    />
                    
                    {/* AI Analysis Button */}
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleAIAnalysis}
                        disabled={aiAnalyzing || !consultationReason.trim()}
                        className="flex items-center px-3 py-1.5 text-sm bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-md hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {aiAnalyzing ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <Brain className="h-4 w-4 mr-1" />
                            Get AI Suggestions
                          </>
                        )}
                      </button>
                      {aiResult && (
                        <button
                          type="button"
                          onClick={() => setShowAIAnalysis(!showAIAnalysis)}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          {showAIAnalysis ? 'Hide' : 'Show'} Results
                        </button>
                      )}
                    </div>
                    
                    {/* AI Results Display */}
                    {showAIAnalysis && aiResult && (
                      <div className="mt-3 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900 flex items-center">
                            <Brain className="h-4 w-4 mr-1 text-purple-600" />
                            AI Preliminary Diagnosis
                          </h4>
                          <button
                            type="button"
                            onClick={() => setShowAIAnalysis(false)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans max-h-48 overflow-y-auto">
                          {aiResult}
                        </pre>
                        <p className="text-xs text-gray-500 mt-2 italic">
                          AI-generated suggestions. Final diagnosis by doctor required.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Date and Time */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                        Appointment Date *
                      </label>
                      <input
                        type="date"
                        value={appointmentDate}
                        onChange={(e) => setAppointmentDate(e.target.value)}
                        min={today}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-gray-400" />
                        Appointment Time *
                      </label>
                      <input
                        type="time"
                        value={appointmentTime}
                        onChange={(e) => setAppointmentTime(e.target.value)}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 font-medium"
                    >
                      Continue →
                    </button>
                  </div>
                </form>
              )}
            </>
          ) : (
            /* Payment Step */
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-900 mb-2">
                  {activeTab === 'doctor-to-doctor' ? 'Pay Consultation Fee' : 'Choose Payment Option'}
                </h3>
                <p className="text-sm text-blue-700">
                  {activeTab === 'doctor-to-doctor' 
                    ? 'Please complete the payment to start the video consultation.'
                    : 'Select how you want to proceed with the video consultation.'}
                </p>
              </div>

              {/* Bill Items - Only show for doctor-to-doctor or when with-payment selected */}
              {(activeTab === 'doctor-to-doctor' || paymentOption === 'with-payment') && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Bill Items</h3>
                  
                  <div className="space-y-2 mb-4">
                    {billItems.map((item) => (
                      <div key={item.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-700">{item.description}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">₹{item.amount}</span>
                          <button
                            onClick={() => removeBillItem(item.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add New Item - Only for doctor-to-doctor */}
                  {activeTab === 'doctor-to-doctor' && (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Item description"
                        value={newItemDesc}
                        onChange={(e) => setNewItemDesc(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                      <input
                        type="number"
                        placeholder="Amount"
                        value={newItemAmount}
                        onChange={(e) => setNewItemAmount(e.target.value)}
                        className="w-24 px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                      <button
                        onClick={addBillItem}
                        className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                    <span className="font-medium text-gray-900">Total Amount:</span>
                    <span className="text-2xl font-bold text-primary-600 flex items-center">
                      <IndianRupee className="h-6 w-6 mr-1" />
                      {totalAmount}
                    </span>
                  </div>
                </div>
              )}

              {/* Payment Options - Only for doctor-to-patient */}
              {activeTab === 'doctor-to-patient' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => handlePaymentOptionSelect('with-payment')}
                    className={`p-6 border-2 rounded-lg text-left transition-all ${
                      paymentOption === 'with-payment'
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-primary-300'
                    }`}
                  >
                    <div className="flex items-center mb-3">
                      <CreditCard className="h-8 w-8 text-primary-600 mr-3" />
                      <div>
                        <h4 className="font-medium text-gray-900">Collect Payment</h4>
                        <p className="text-sm text-gray-500">₹{totalAmount}</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">
                      Patient pays before consultation. Share UPI details via WhatsApp.
                    </p>
                  </button>

                  <button
                    onClick={() => handlePaymentOptionSelect('without-payment')}
                    className={`p-6 border-2 rounded-lg text-left transition-all ${
                      paymentOption === 'without-payment'
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-green-300'
                    }`}
                  >
                    <div className="flex items-center mb-3">
                      <Video className="h-8 w-8 text-green-600 mr-3" />
                      <div>
                        <h4 className="font-medium text-gray-900">Start Without Payment</h4>
                        <p className="text-sm text-gray-500">Free consultation</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">
                      Start video call immediately without collecting payment.
                    </p>
                  </button>
                </div>
              )}

              {/* Doctor-to-Doctor Payment Info */}
              {activeTab === 'doctor-to-doctor' && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Phone className="h-5 w-5 text-primary-600" />
                    <span className="font-medium text-gray-900">Secure Payment via Razorpay</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    You will be redirected to Razorpay to complete payment.
                  </p>
                </div>
              )}

              <div className="flex justify-between pt-4 border-t border-gray-200">
                <button
                  onClick={() => setStep('details')}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  ← Back
                </button>
                
                {activeTab === 'doctor-to-doctor' && (
                  <button
                    onClick={handlePayment}
                    disabled={loading || billItems.length === 0}
                    className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 font-medium flex items-center"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        Pay & Start Call
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookAppointmentModal;
