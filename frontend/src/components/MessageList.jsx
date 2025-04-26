import React, { useRef, useEffect } from 'react';
import Message from './Message';

const MessageList = ({ messages }) => {
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col space-y-4 overflow-y-auto">
      {messages.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          <p>No messages yet. Start typing to begin.</p>
        </div>
      ) : (
        <>
          {messages.map((message, index) => (
            <Message key={index} {...message} />
          ))}
          <div ref={messagesEndRef} />
        </>
      )}
    </div>
  );
};

export default MessageList; 