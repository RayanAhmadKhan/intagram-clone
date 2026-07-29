import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user } = useAuth() || {};

  useEffect(() => {
    // Get user ID from AuthContext user object
    const userId = user?._id || user?.id;

    if (!userId) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    // Pass the userId directly in the socket auth object
    const newSocket = io('http://localhost:5000', {
      withCredentials: true,
      transports: ['websocket'],
      auth: { userId },
      reconnection: true,
      reconnectionAttempts: 5,
    });

    newSocket.on('connect', () => {
      console.log('⚡ Socket connected successfully:', newSocket.id);
    });

    newSocket.on('connect_error', (err) => {
      console.error('⚠️ Socket connection error:', err.message);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);