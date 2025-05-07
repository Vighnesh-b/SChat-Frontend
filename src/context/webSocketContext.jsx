import { createContext, useState,useContext, useEffect, useRef, useCallback, useMemo, useReducer } from 'react';
import axios from '../axios';

const WebSocketContext = createContext(null);

const messageReducer = (state, action) => {
  switch (action.type) {
    case 'UPDATE_CONVERSATION':
      return {
        ...state,
        [action.conversationId]: action.messages
      };
    
    case 'PREPEND_MESSAGE':
      return {
        ...state,
        [action.conversationId]: [
          action.message,
          ...(state[action.conversationId] || [])
        ]
      };

    default:
      return state;
  }
};

export const WebSocketProvider = ({ children }) => {
  const [conversations, dispatch] = useReducer(messageReducer, {});
  const [isConnected, setIsConnected] = useState(false);
  const ws = useRef(null);
  const reconnectTimer = useRef(null);
  const user = useRef(JSON.parse(localStorage.getItem('user')));

  const cleanup = useCallback(() => {
    if (ws.current) {
      ws.current.onopen = null;
      ws.current.onclose = null;
      ws.current.onerror = null;
      ws.current.onmessage = null;
      if (ws.current.readyState === WebSocket.OPEN) {
        ws.current.close();
      }
      ws.current = null;
    }
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }
  }, []);

  const registerUser = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN && user.current?.id) {
      ws.current.send(JSON.stringify({
        type: 'register',
        userId: user.current.id
      }));
    }
  }, []);

  const fetchMessages = useCallback(async (otherUserId) => {
    try {
      const res = await axios.post('/getMessages', {
        senderId: user.current.id,
        receiverId: otherUserId
      });
      
      dispatch({
        type: 'UPDATE_CONVERSATION',
        conversationId: otherUserId,
        messages: res.data.messages
      });

    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }, []);

  const handleIncomingMessage = useCallback((message) => {
    const conversationId = message.sender === user.current.id 
      ? message.to 
      : message.sender;

    dispatch({
      type: 'PREPEND_MESSAGE',
      conversationId,
      message: {
        ...message,
        _temp: message._id ? undefined : true
      }
    });
  }, []);

  const connectWebSocket = useCallback(() => {
    cleanup();

    ws.current = new WebSocket('wss://schat-backend-xu2j.onrender.com');

    ws.current.onopen = () => {
      setIsConnected(true);
      registerUser();
    };

    ws.current.onmessage = async (event) => {
      try {
        const message = JSON.parse(event.data);
        
        if (message.type === 'newMessageAlert') {
          handleIncomingMessage(message);
          await fetchMessages(message.from);
        }
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    };

    ws.current.onclose = () => {
      setIsConnected(false);
      const delay = Math.min(5000, 1000 * Math.pow(2, 5));
      reconnectTimer.current = setTimeout(connectWebSocket, delay);
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }, [cleanup, fetchMessages, handleIncomingMessage, registerUser]);

  const sendMessage = useCallback((messageData) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      const tempId = Date.now().toString();
      
      handleIncomingMessage({
        _id: tempId,
        sender: user.current.id,
        to: messageData.recipientId,
        messageText: messageData.text,
        timestamp: new Date().toISOString()
      });

      ws.current.send(JSON.stringify({
        type: 'chat',
        from: user.current.id,
        to: messageData.recipientId,
        messageText: messageData.text,
        tempId
      }));
    }
  }, [handleIncomingMessage]);

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'user') {
        user.current = JSON.parse(e.newValue);
        registerUser();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [registerUser]);

  useEffect(() => {
    connectWebSocket();
    return cleanup;
  }, [connectWebSocket, cleanup]);

  const value = useMemo(() => ({
    isConnected,
    conversations,
    fetchMessages,
    sendMessage
  }), [isConnected, conversations,fetchMessages, sendMessage]);

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};
