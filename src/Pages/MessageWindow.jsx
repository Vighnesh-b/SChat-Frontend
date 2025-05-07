import { useState, useEffect, useRef, useMemo } from 'react';
import getRandomProfile from '../components/random_img';
import { useWebSocket } from '../context/webSocketContext';
import { useNavigate } from 'react-router-dom';

function MessageWindow({ recipient }) {
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user')) || null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  });
  const userId = user?.id;

  const { isConnected, sendMessage, conversations, fetchMessages } = useWebSocket();

  useEffect(() => {
    if (!user || !user?.id) {
      localStorage.removeItem('user');
      navigate('/Login');
    }
  }, [user, navigate]);

  const currentMessages = useMemo(() => {
    if (!recipient || !userId) return [];
    const messages = conversations[recipient.friendId] || [];
    return [...messages].sort((a, b) => 
      new Date(a.timestamp) - new Date(b.timestamp)
    );
  }, [conversations, recipient, userId]);

  useEffect(() => {
    const loadMessages = async () => {
      if (recipient?.friendId && userId) {
        try {
          await fetchMessages(recipient.friendId);
        } catch (error) {
          console.error('Failed to load messages:', error);
        }
      }
    };
    
    loadMessages();
  }, [recipient, userId, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !isConnected || !recipient || !userId) return;

    try {
      setMessageText('');
      await sendMessage({
        recipientId: recipient.friendId,
        text: messageText,
      });
    } catch (error) {
      console.error('Message send failed:', error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!recipient) {
    return (
      <div className="h-full bg-[#000000] w-full flex items-center justify-center">
        <p className="text-gray-500 text-lg">Select a friend to start chatting</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-full bg-[#000000] w-full flex items-center justify-center">
        <p className="text-gray-500 text-lg">Loading user data...</p>
      </div>
    );
  }

  return (
    <div className="h-full bg-[#000000] w-full flex flex-col">
      <div className="bg-gray-900 w-full p-5">
        <div className="flex items-center gap-4">
          <img
            src={getRandomProfile()}
            alt="User Profile"
            className="w-10 h-10 rounded-full object-cover"
          />
          <p className="text-white font-bold text-lg">{recipient.friendName}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col space-y-2">
        {currentMessages.map((msg) => (
          <div
            key={msg._id}
            className={`max-w-xs p-3 rounded-lg text-white ${
              msg.sender === userId ? 'bg-blue-600 self-end' : 'bg-gray-700 self-start'
            }`}
          >
            {msg.messageText}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-black w-full p-4 flex items-center gap-2">
        <input
          type="text"
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          onKeyDown={handleKeyPress}
          className="flex-1 bg-gray-700 text-white placeholder-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400"
          placeholder={isConnected ? "Type a message" : "Connecting..."}
          disabled={!isConnected}
        />
        <button
          onClick={handleSendMessage}
          disabled={!messageText.trim() || !isConnected}
          className={`px-4 py-2 rounded-full font-semibold transition duration-200 ${
            !messageText.trim() || !isConnected
              ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default MessageWindow;