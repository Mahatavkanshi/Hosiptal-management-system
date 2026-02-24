import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { 
  MessageSquare,
  Send,
  Search,
  Phone,
  Video,
  MoreVertical,
  ArrowLeft,
  User,
  Circle
} from 'lucide-react';
import toast from 'react-hot-toast';

interface ChatRoom {
  id: string;
  name: string;
  type: 'direct' | 'group';
  participants: string[];
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

interface ChatMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  created_at: string;
  is_me: boolean;
}

const demoRooms: ChatRoom[] = [
  { id: '1', name: 'Nursing Station', type: 'group', participants: ['Sarah', 'Mike', 'Emma'], last_message: 'Room 102 needs vitals check', last_message_time: '10:30 AM', unread_count: 3 },
  { id: '2', name: 'Dr. Smith', type: 'direct', participants: ['Dr. Smith'], last_message: 'Please update me on patient status', last_message_time: '9:45 AM', unread_count: 1 },
  { id: '3', name: 'Emergency Team', type: 'group', participants: ['All Staff'], last_message: 'Code blue drill at 2 PM', last_message_time: 'Yesterday', unread_count: 0 },
  { id: '4', name: 'Sarah Johnson', type: 'direct', participants: ['Sarah Johnson'], last_message: 'Can you cover my shift?', last_message_time: 'Yesterday', unread_count: 0 },
];

const demoMessages: ChatMessage[] = [
  { id: '1', sender_id: 'other', sender_name: 'Dr. Smith', content: 'Hi, how is the patient in room 101 doing?', created_at: '9:30 AM', is_me: false },
  { id: '2', sender_id: 'me', sender_name: 'You', content: 'Vitals are stable. BP 120/80, HR 72.', created_at: '9:32 AM', is_me: true },
  { id: '3', sender_id: 'other', sender_name: 'Dr. Smith', content: 'Great, please continue monitoring.', created_at: '9:33 AM', is_me: false },
  { id: '4', sender_id: 'other', sender_name: 'Dr. Smith', content: 'Please update me on patient status', created_at: '9:45 AM', is_me: false },
];

const NurseChat: React.FC = () => {
  const [rooms, setRooms] = useState<ChatRoom[]>(demoRooms);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>(demoMessages);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const message: ChatMessage = {
      id: Date.now().toString(),
      sender_id: 'me',
      sender_name: 'You',
      content: newMessage,
      created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      is_me: true
    };

    setMessages([...messages, message]);
    setNewMessage('');
  };

  const filteredRooms = rooms.filter(room => 
    room.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (selectedRoom) {
    return (
      <div className="h-[calc(100vh-4rem)] flex flex-col bg-white">
        {/* Chat Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center">
            <button 
              onClick={() => setSelectedRoom(null)}
              className="mr-3 p-2 hover:bg-gray-100 rounded-full md:hidden"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-pink-600" />
            </div>
            <div className="ml-3">
              <h3 className="font-semibold text-gray-900">{selectedRoom.name}</h3>
              <p className="text-sm text-green-600 flex items-center">
                <Circle className="h-2 w-2 mr-1 fill-current" />
                Online
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-gray-100 rounded-full">
              <Phone className="h-5 w-5 text-gray-600" />
            </button>
            <Link to={`/nurse/video-call/${selectedRoom.id}`} className="p-2 hover:bg-gray-100 rounded-full">
              <Video className="h-5 w-5 text-gray-600" />
            </Link>
            <button className="p-2 hover:bg-gray-100 rounded-full">
              <MoreVertical className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.is_me ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                  message.is_me
                    ? 'bg-pink-600 text-white rounded-br-none'
                    : 'bg-gray-100 text-gray-900 rounded-bl-none'
                }`}
              >
                <p>{message.content}</p>
                <p className={`text-xs mt-1 ${message.is_me ? 'text-pink-200' : 'text-gray-500'}`}>
                  {message.created_at}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="p-3 bg-pink-600 text-white rounded-full hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <Link 
          to="/nurse-dashboard" 
          className="flex items-center text-gray-600 hover:text-gray-900 mb-3"
        >
          <ArrowLeft className="h-5 w-5 mr-1" />
          Back to Dashboard
        </Link>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
            <p className="text-gray-600">Connect with your team</p>
          </div>
          <Link
            to="/nurse/video-call"
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Video className="h-4 w-4 mr-2" />
            Video Call
          </Link>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
        </div>
      </div>

      {/* Room List */}
      <div className="flex-1 overflow-y-auto">
        {filteredRooms.map((room) => (
          <button
            key={room.id}
            onClick={() => setSelectedRoom(room)}
            className="w-full flex items-center p-4 hover:bg-gray-50 border-b border-gray-100 transition-colors text-left"
          >
            <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="h-6 w-6 text-pink-600" />
            </div>
            <div className="ml-4 flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 truncate">{room.name}</h3>
                <span className="text-xs text-gray-500">{room.last_message_time}</span>
              </div>
              <p className="text-sm text-gray-600 truncate">{room.last_message}</p>
            </div>
            {room.unread_count > 0 && (
              <span className="ml-2 bg-pink-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                {room.unread_count}
              </span>
            )}
          </button>
        ))}
        {filteredRooms.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <MessageSquare className="h-12 w-12 mx-auto mb-2 text-gray-400" />
            <p>No conversations found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NurseChat;
