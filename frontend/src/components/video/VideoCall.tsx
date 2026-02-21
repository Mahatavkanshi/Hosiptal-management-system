import { useState, useEffect, useRef } from 'react';
import { X, Video, Mic, MicOff, Camera, CameraOff, Phone, PhoneOff, Monitor, Loader2, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import ReportGenerator from '../modals/ReportGenerator';

interface VideoCallProps {
  isOpen: boolean;
  onClose: () => void;
  peerName: string;
  appointmentType: 'doctor-to-doctor' | 'doctor-to-patient';
  roomId: string;
  patientId?: string;
}

const VideoCall = ({ isOpen, onClose, peerName, roomId, patientId }: VideoCallProps) => {
  const [step, setStep] = useState<'setup' | 'calling' | 'connected'>('setup');
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [showReportGenerator, setShowReportGenerator] = useState(false);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Setup local video stream
  const setupLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      // Setup audio visualization
      setupAudioVisualization(stream);
      
      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      toast.error('Could not access camera/microphone');
      return null;
    }
  };

  const setupAudioVisualization = (stream: MediaStream) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;
      
      const analyser = audioContext.createAnalyser();
      analyserRef.current = analyser;
      analyser.fftSize = 256;
      
      const microphone = audioContext.createMediaStreamSource(stream);
      microphone.connect(analyser);
      
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      
      const updateAudioLevel = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setAudioLevel(average);
        requestAnimationFrame(updateAudioLevel);
      };
      
      updateAudioLevel();
    } catch (error) {
      console.error('Error setting up audio visualization:', error);
    }
  };

  // Initialize WebRTC connection (simplified for demo)
  const initializeCall = async () => {
    const stream = await setupLocalStream();
    if (!stream) return;

    // In a real implementation, you would:
    // 1. Create RTCPeerConnection
    // 2. Exchange ICE candidates via signaling server
    // 3. Exchange SDP offers/answers
    // 4. Add tracks to peer connection
    
    // For demo purposes, we'll simulate a connection
    setStep('calling');
    
    // Simulate the other party joining after 2 seconds
    setTimeout(() => {
      setStep('connected');
      toast.success(`${peerName} joined the call`);
      
      // Start call timer
      timerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }, 2000);
  };

  const toggleCamera = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isCameraOn;
        setIsCameraOn(!isCameraOn);
      }
    }
  };

  const toggleMicrophone = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isMicOn;
        setIsMicOn(!isMicOn);
      }
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false
        });
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }
        
        setIsScreenSharing(true);
        
        screenStream.getVideoTracks()[0].onended = () => {
          if (localStream && localVideoRef.current) {
            localVideoRef.current.srcObject = localStream;
          }
          setIsScreenSharing(false);
        };
      } else {
        if (localStream && localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
        }
        setIsScreenSharing(false);
      }
    } catch (error) {
      console.error('Error sharing screen:', error);
      toast.error('Could not share screen');
    }
  };

  const endCall = () => {
    // Stop all tracks
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    
    // Stop timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    // Stop timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    
    onClose();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (isOpen && step === 'setup') {
      initializeCall();
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 text-white px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Video className="h-5 w-5 text-primary-400" />
          <div>
            <p className="font-medium">{peerName}</p>
            <p className="text-xs text-gray-400">
              {step === 'calling' ? 'Calling...' : step === 'connected' ? `Connected (${formatDuration(callDuration)})` : 'Setting up...'}
            </p>
          </div>
        </div>
        
        <button onClick={endCall} className="text-white hover:text-red-400">
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* Video Area */}
      <div className="flex-1 relative bg-gray-800">
        {/* Remote Video (Main) */}
        <div className="absolute inset-0 flex items-center justify-center">
          {step === 'calling' ? (
            <div className="text-center">
              <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Phone className="h-12 w-12 text-gray-400" />
              </div>
              <p className="text-white text-lg">Calling {peerName}...</p>
              <p className="text-gray-400 mt-2">Waiting for them to join</p>
            </div>
          ) : step === 'connected' ? (
            <div className="w-full h-full flex items-center justify-center bg-gray-900">
              <div className="text-center">
                <div className="w-32 h-32 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl font-bold text-white">{peerName.charAt(0)}</span>
                </div>
                <p className="text-white text-2xl font-medium">{peerName}</p>
                <p className="text-gray-400 mt-2">Video call in progress</p>
                <p className="text-primary-400 text-xl mt-4 font-mono">{formatDuration(callDuration)}</p>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <Loader2 className="h-12 w-12 text-primary-400 animate-spin mx-auto mb-4" />
              <p className="text-white">Setting up video call...</p>
            </div>
          )}
        </div>

        {/* Local Video (Picture-in-Picture) */}
        <div className="absolute bottom-24 right-4 w-48 h-36 bg-gray-700 rounded-lg overflow-hidden shadow-lg">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          
          {!isCameraOn && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
              <CameraOff className="h-8 w-8 text-gray-500" />
            </div>
          )}

          {/* Audio Level Indicator */}
          <div className="absolute top-2 right-2 bg-black bg-opacity-50 rounded-full px-2 py-1">
            <div className="flex items-center gap-1">
              <Mic className="h-3 w-3 text-white" />
              <div className="w-8 h-1 bg-gray-600 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 transition-all duration-100"
                  style={{ width: `${Math.min(audioLevel, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-gray-900 px-6 py-4">
        <div className="flex justify-center items-center gap-4">
          <button
            onClick={toggleCamera}
            className={`p-4 rounded-full transition-colors ${
              isCameraOn 
                ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            {isCameraOn ? <Camera className="h-6 w-6" /> : <CameraOff className="h-6 w-6" />}
          </button>
          
          <button
            onClick={toggleMicrophone}
            className={`p-4 rounded-full transition-colors ${
              isMicOn 
                ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            {isMicOn ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
          </button>
          
          <button
            onClick={toggleScreenShare}
            className={`p-4 rounded-full transition-colors ${
              isScreenSharing 
                ? 'bg-primary-600 hover:bg-primary-700 text-white' 
                : 'bg-gray-700 hover:bg-gray-600 text-white'
            }`}
          >
            <Monitor className="h-6 w-6" />
          </button>
          
          <button
            onClick={endCall}
            className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors"
          >
            <PhoneOff className="h-6 w-6" />
          </button>
          
          {/* Generate Report Button - Only show for patient consultations */}
          {patientId && step === 'connected' && (
            <button
              onClick={() => setShowReportGenerator(true)}
              className="p-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-colors ml-4"
              title="Generate Medical Report"
            >
              <FileText className="h-6 w-6" />
            </button>
          )}
        </div>
        
        <p className="text-center text-gray-400 text-sm mt-3">
          Room ID: {roomId}
        </p>
      </div>
      
      {/* Report Generator Modal */}
      {showReportGenerator && patientId && (
        <ReportGenerator
          isOpen={showReportGenerator}
          onClose={() => setShowReportGenerator(false)}
          onSuccess={() => {
            toast.success('Report generated successfully!');
          }}
          patientId={patientId}
          patientName={peerName}
          defaultType="prescription"
        />
      )}
    </div>
  );
};

export default VideoCall;
