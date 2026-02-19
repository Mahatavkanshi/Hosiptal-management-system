import { useState, useEffect, useRef } from 'react';
import { X, Video, Mic, MicOff, Camera, CameraOff, Settings, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

interface VideoCallSetupProps {
  isOpen: boolean;
  onClose: () => void;
  onStartCall: () => void;
  peerName: string;
  appointmentType: 'doctor-to-doctor' | 'doctor-to-patient';
}

const VideoCallSetup = ({ isOpen, onClose, onStartCall, peerName, appointmentType }: VideoCallSetupProps) => {
  const [step, setStep] = useState<'permissions' | 'test' | 'settings'>('permissions');
  const [cameraPermission, setCameraPermission] = useState<'pending' | 'granted' | 'denied'>('pending');
  const [micPermission, setMicPermission] = useState<'pending' | 'granted' | 'denied'>('pending');
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [selectedCamera, setSelectedCamera] = useState('');
  const [selectedMicrophone, setSelectedMicrophone] = useState('');
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [microphones, setMicrophones] = useState<MediaDeviceInfo[]>([]);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  useEffect(() => {
    if (isOpen && step === 'permissions') {
      checkPermissions();
    }
  }, [isOpen, step]);

  useEffect(() => {
    if (step === 'test' && cameraPermission === 'granted') {
      startTestVideo();
    }
    return () => {
      if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [step, cameraPermission]);

  useEffect(() => {
    if (step === 'settings') {
      getAvailableDevices();
    }
  }, [step]);

  const checkPermissions = async () => {
    try {
      // Try to access camera and mic to check permissions
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      // If we get here, permissions are granted
      setCameraPermission('granted');
      setMicPermission('granted');
      // Stop the test stream immediately
      stream.getTracks().forEach(track => track.stop());
    } catch (error: any) {
      console.log('Permission check error:', error);
      // Check what type of error
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setCameraPermission('denied');
        setMicPermission('denied');
      } else if (error.name === 'NotFoundError') {
        toast.error('No camera or microphone found. Please check your devices.');
        setCameraPermission('denied');
        setMicPermission('denied');
      } else {
        // Keep as pending for other errors
        setCameraPermission('pending');
        setMicPermission('pending');
      }
    }
  };

  const requestPermissions = async () => {
    setIsLoading(true);
    try {
      // Request both video and audio permissions
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      // Immediately update state
      setCameraPermission('granted');
      setMicPermission('granted');
      
      // Stop the test stream
      stream.getTracks().forEach(track => track.stop());
      
      toast.success('Permissions granted!');
      
      // Small delay to ensure state updates before changing step
      setTimeout(() => {
        setStep('test');
      }, 500);
      
    } catch (error: any) {
      console.error('Permission error:', error);
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        toast.error('Permission denied. Please allow camera and microphone access in your browser settings.');
        setCameraPermission('denied');
        setMicPermission('denied');
      } else if (error.name === 'NotFoundError') {
        toast.error('No camera or microphone found on your device.');
        setCameraPermission('denied');
        setMicPermission('denied');
      } else {
        toast.error('Could not access camera/microphone. Please check your device settings.');
        setCameraPermission('denied');
        setMicPermission('denied');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const startTestVideo = async () => {
    try {
      const constraints: MediaStreamConstraints = {
        video: selectedCamera ? { deviceId: { exact: selectedCamera } } : true,
        audio: selectedMicrophone ? { deviceId: { exact: selectedMicrophone } } : true
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setVideoStream(stream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Setup audio visualization
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
      console.error('Error starting test video:', error);
      toast.error('Could not access camera/microphone');
    }
  };

  const getAvailableDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      const audioDevices = devices.filter(device => device.kind === 'audioinput');
      
      setCameras(videoDevices);
      setMicrophones(audioDevices);
      
      if (videoDevices.length > 0 && !selectedCamera) {
        setSelectedCamera(videoDevices[0].deviceId);
      }
      if (audioDevices.length > 0 && !selectedMicrophone) {
        setSelectedMicrophone(audioDevices[0].deviceId);
      }
    } catch (error) {
      console.error('Error getting devices:', error);
    }
  };

  const toggleCamera = () => {
    if (videoStream) {
      const videoTrack = videoStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isCameraOn;
        setIsCameraOn(!isCameraOn);
      }
    }
  };

  const toggleMicrophone = () => {
    if (videoStream) {
      const audioTrack = videoStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isMicOn;
        setIsMicOn(!isMicOn);
      }
    }
  };

  const handleStartCall = () => {
    // Stop test stream
    if (videoStream) {
      videoStream.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    onStartCall();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gray-900 text-white px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Video className="h-6 w-6 text-primary-400" />
            <div>
              <h2 className="text-lg font-bold">Video Call Setup</h2>
              <p className="text-sm text-gray-400">
                {appointmentType === 'doctor-to-doctor' ? 'Peer Consultation' : 'Patient Consultation'} with {peerName}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex">
          {/* Progress Steps */}
          <div className="w-64 bg-gray-50 border-r border-gray-200 p-6">
            <div className="space-y-6">
              <div className={`flex items-center gap-3 ${step === 'permissions' ? 'text-primary-600' : cameraPermission === 'granted' ? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'permissions' ? 'bg-primary-100' : cameraPermission === 'granted' ? 'bg-green-100' : 'bg-gray-200'}`}>
                  {cameraPermission === 'granted' ? <CheckCircle className="h-5 w-5" /> : <span>1</span>}
                </div>
                <span className="font-medium">Permissions</span>
              </div>

              <div className={`flex items-center gap-3 ${step === 'test' ? 'text-primary-600' : step === 'settings' ? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'test' ? 'bg-primary-100' : step === 'settings' ? 'bg-green-100' : 'bg-gray-200'}`}>
                  {step === 'settings' ? <CheckCircle className="h-5 w-5" /> : <span>2</span>}
                </div>
                <span className="font-medium">Test Video</span>
              </div>

              <div className={`flex items-center gap-3 ${step === 'settings' ? 'text-primary-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'settings' ? 'bg-primary-100' : 'bg-gray-200'}`}>
                  <span>3</span>
                </div>
                <span className="font-medium">Settings</span>
              </div>
            </div>

            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-700">
                <strong>Tip:</strong> Good lighting and a quiet environment will ensure the best video call experience.
              </p>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-8">
            {step === 'permissions' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-900">Allow Camera & Microphone</h3>
                
                <p className="text-gray-600">
                  To start a video consultation, we need access to your camera and microphone. 
                  This allows both parties to see and hear each other during the call.
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4 text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Camera className="h-8 w-8 text-blue-600" />
                    </div>
                    <h4 className="font-medium">Camera</h4>
                    <p className="text-sm text-gray-500 mt-1">For video</p>
                    
                    {cameraPermission === 'granted' ? (
                      <span className="inline-flex items-center gap-1 text-green-600 text-sm mt-2">
                        <CheckCircle className="h-4 w-4" /> Allowed
                      </span>
                    ) : cameraPermission === 'denied' ? (
                      <span className="inline-flex items-center gap-1 text-red-600 text-sm mt-2">
                        <AlertCircle className="h-4 w-4" /> Blocked
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400 mt-2">Waiting...</span>
                    )}
                  </div>

                  <div className="border rounded-lg p-4 text-center">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Mic className="h-8 w-8 text-purple-600" />
                    </div>
                    <h4 className="font-medium">Microphone</h4>
                    <p className="text-sm text-gray-500 mt-1">For audio</p>
                    
                    {micPermission === 'granted' ? (
                      <span className="inline-flex items-center gap-1 text-green-600 text-sm mt-2">
                        <CheckCircle className="h-4 w-4" /> Allowed
                      </span>
                    ) : micPermission === 'denied' ? (
                      <span className="inline-flex items-center gap-1 text-red-600 text-sm mt-2">
                        <AlertCircle className="h-4 w-4" /> Blocked
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400 mt-2">Waiting...</span>
                    )}
                  </div>
                </div>

                {(cameraPermission === 'denied' || micPermission === 'denied') ? (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2 text-red-800 font-medium">
                      <AlertCircle className="h-5 w-5" />
                      <span>Permissions Blocked</span>
                    </div>
                    <p className="text-sm text-red-700">
                      Camera or microphone access was blocked. To enable video calls, please:
                    </p>
                    <ol className="text-sm text-red-700 list-decimal list-inside space-y-1 ml-2">
                      <li>Click the 🔒 icon in your browser's address bar</li>
                      <li>Set Camera to "Allow"</li>
                      <li>Set Microphone to "Allow"</li>
                      <li>Refresh the page and try again</li>
                    </ol>
                    <button
                      onClick={() => window.location.reload()}
                      className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                    >
                      Refresh Page
                    </button>
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                      <strong>Important:</strong> Your browser will show a popup asking for permission. Please click <strong>"Allow"</strong> when prompted.
                    </p>
                  </div>
                )}

                <div className="flex justify-end gap-3">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={requestPermissions}
                    disabled={isLoading || cameraPermission === 'denied'}
                    className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isLoading ? 'Requesting...' : cameraPermission === 'denied' ? 'Permissions Blocked' : 'Allow Access'}
                    {!isLoading && cameraPermission !== 'denied' && <ArrowRight className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            {step === 'test' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-900">Test Your Camera</h3>
                
                <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  
                  {!isCameraOn && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                      <CameraOff className="h-16 w-16 text-gray-600" />
                    </div>
                  )}

                  {/* Audio Level Indicator */}
                  <div className="absolute top-4 right-4 bg-black bg-opacity-50 rounded-full p-2">
                    <div className="flex items-center gap-1">
                      <Mic className="h-4 w-4 text-white" />
                      <div className="w-16 h-2 bg-gray-600 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-500 transition-all duration-100"
                          style={{ width: `${Math.min(audioLevel, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-3">
                    <button
                      onClick={toggleCamera}
                      className={`p-3 rounded-full ${isCameraOn ? 'bg-gray-700 text-white' : 'bg-red-600 text-white'}`}
                    >
                      {isCameraOn ? <Camera className="h-5 w-5" /> : <CameraOff className="h-5 w-5" />}
                    </button>
                    
                    <button
                      onClick={toggleMicrophone}
                      className={`p-3 rounded-full ${isMicOn ? 'bg-gray-700 text-white' : 'bg-red-600 text-white'}`}
                    >
                      {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <p className="text-gray-600">
                  You should see yourself above. If not, check your camera permissions or try a different device in settings.
                </p>

                <div className="flex justify-between">
                  <button
                    onClick={() => setStep('permissions')}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    ← Back
                  </button>
                  
                  <button
                    onClick={() => setStep('settings')}
                    className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 flex items-center gap-2"
                  >
                    Continue to Settings
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {step === 'settings' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Settings className="h-6 w-6" />
                  Device Settings
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Camera</label>
                    <select
                      value={selectedCamera}
                      onChange={(e) => {
                        setSelectedCamera(e.target.value);
                        // Restart video with new camera
                        if (videoStream) {
                          videoStream.getTracks().forEach(track => track.stop());
                        }
                        setTimeout(startTestVideo, 100);
                      }}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    >
                      {cameras.map((camera) => (
                        <option key={camera.deviceId} value={camera.deviceId}>
                          {camera.label || `Camera ${cameras.indexOf(camera) + 1}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Microphone</label>
                    <select
                      value={selectedMicrophone}
                      onChange={(e) => {
                        setSelectedMicrophone(e.target.value);
                        // Restart video with new microphone
                        if (videoStream) {
                          videoStream.getTracks().forEach(track => track.stop());
                        }
                        setTimeout(startTestVideo, 100);
                      }}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    >
                      {microphones.map((mic) => (
                        <option key={mic.deviceId} value={mic.deviceId}>
                          {mic.label || `Microphone ${microphones.indexOf(mic) + 1}`}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Ready to Start</h4>
                  <p className="text-sm text-gray-600">
                    You're all set for your {appointmentType === 'doctor-to-doctor' ? 'peer consultation' : 'patient consultation'} with {peerName}.
                  </p>
                </div>

                <div className="flex justify-between">
                  <button
                    onClick={() => setStep('test')}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    ← Back
                  </button>
                  
                  <button
                    onClick={handleStartCall}
                    className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-bold flex items-center gap-2"
                  >
                    <Video className="h-5 w-5" />
                    Start Video Call
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoCallSetup;
