
import React from 'react';
import { Message } from '../types';

interface ChatMessageProps {
  message: Message;
}

const BarberPoleIcon: React.FC = () => (
  <div className="w-8 h-8 flex-shrink-0 rounded-full bg-gray-200 flex items-center justify-center mr-3 border-2 border-red-500">
    <span role="img" aria-label="barber pole" className="text-lg">💈</span>
  </div>
);

const UserIcon: React.FC = () => (
  <div className="w-8 h-8 flex-shrink-0 rounded-full bg-red-600 flex items-center justify-center ml-3 border-2 border-red-300">
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
    </svg>
  </div>
);

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const { sender, text } = message;
  const isUser = sender === 'user';

  const messageContainerClasses = isUser ? 'flex justify-end' : 'flex justify-start';
  const messageBubbleClasses = isUser
    ? 'bg-red-600 text-white rounded-lg rounded-br-none'
    : 'bg-gray-200 text-gray-800 rounded-lg rounded-bl-none';

  // Basic markdown-like formatting
  const formattedText = text?.replace(/\[(.*?)\]/g, '**$1**') // Bold style names
    .split('**').map((part, i) => i % 2 === 1 ? <strong key={i} className="font-bold text-red-600">{part}</strong> : part)
    .flatMap(part => typeof part === 'string' ? part.split('\n').map((line, j) => <span key={`${j}`}>{line}<br/></span>) : [part]);


  return (
    <div className={messageContainerClasses}>
      <div className={`flex items-start max-w-xl ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {!isUser && <BarberPoleIcon />}
        <div className={`px-4 py-3 shadow-md w-full ${messageBubbleClasses}`}>
            {text && <p className="text-base whitespace-pre-wrap">{formattedText}</p>}
        </div>
        {isUser && <UserIcon />}
      </div>
    </div>
  );
};

export default ChatMessage;
