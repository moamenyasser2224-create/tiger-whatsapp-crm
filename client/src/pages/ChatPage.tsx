import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import { useSocket } from '../contexts/SocketContext.js';
import { useAuth } from '../contexts/AuthContext.js';
import type { ChatMessage } from '../types/index.js';
import {
  MessageSquare,
  Send,
  AlertCircle,
  Users,
  ShieldCheck,
  Clock,
  Sparkles,
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  const queryClient = useQueryClient();
  const [inputText, setInputText] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Fetch initial message history
  const { data: messages = [], isLoading } = useQuery<ChatMessage[]>({
    queryKey: ['chat', 'messages'],
    queryFn: async () => {
      const res = await api.get('/chat/messages?limit=50');
      return res.data.data;
    },
  });

  // Scroll to bottom helper
  const scrollToBottom = (smooth = true) => {
    if (typeof messagesEndRef.current?.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({
        behavior: smooth ? 'smooth' : 'auto',
      });
    }
  };

  // Auto-scroll on initial load and when new messages arrive
  useEffect(() => {
    scrollToBottom(false);
  }, [messages.length]);

  // Real-time Socket.io listener for new messages
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (newMsg: ChatMessage) => {
      queryClient.setQueryData<ChatMessage[]>(['chat', 'messages'], (old = []) => {
        // Prevent duplicate if already in array
        if (old.some((m) => m.id === newMsg.id)) return old;
        return [...old, newMsg];
      });
      setTimeout(() => scrollToBottom(true), 50);
    };

    socket.on('new_message', handleNewMessage);

    return () => {
      socket.off('new_message', handleNewMessage);
    };
  }, [socket, queryClient]);

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: async (text: string) => {
      setErrorMessage(null);
      const res = await api.post('/chat/messages', { text });
      return res.data.data;
    },
    onSuccess: (newMsg) => {
      setInputText('');
      // Optimistically ensure query data has the new message
      queryClient.setQueryData<ChatMessage[]>(['chat', 'messages'], (old = []) => {
        if (old.some((m) => m.id === newMsg.id)) return old;
        return [...old, newMsg];
      });
      setTimeout(() => scrollToBottom(true), 50);
    },
    onError: (err: any) => {
      setErrorMessage(err.response?.data?.error || 'حدث خطأ أثناء إرسال الرسالة.');
    },
  });

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed) return;
    if (trimmed.length > 1000) {
      setErrorMessage('لا يمكن أن تتجاوز الرسالة 1000 حرف');
      return;
    }
    sendMutation.mutate(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatMessageTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return format(d, 'hh:mm a', { locale: ar });
    } catch {
      return '';
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
      {/* Chat Room Header */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50/80 px-6 py-4 dark:border-gray-800 dark:bg-gray-800/60 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-whatsapp text-white shadow-md shadow-whatsapp/20">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span>القناة العامة لفريق العمل</span>
              <span className="rounded-md bg-whatsapp/10 px-2 py-0.5 text-[11px] font-bold text-whatsapp">
                Organization-wide
              </span>
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              محادثة داخلية مشفرة ومحمية تجمع كل موظفي وإداريي المنظومة.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium ${
              isConnected
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            <span>{isConnected ? 'بث مباشر متصل' : 'جاري الاتصال...'}</span>
          </span>
        </div>
      </div>

      {/* Error / Rate limit notification */}
      {errorMessage && (
        <div className="bg-red-50 border-b border-red-200 px-6 py-2 text-xs text-red-700 dark:bg-red-950/40 dark:border-red-900/40 dark:text-red-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-red-500 hover:text-red-700 font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-gray-50/30 dark:bg-gray-950/20"
      >
        {isLoading ? (
          <div className="flex h-full items-center justify-center text-sm text-gray-400">
            جاري تحميل الرسائل...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center p-6 text-gray-400">
            <div className="h-12 w-12 rounded-full bg-whatsapp/10 flex items-center justify-center text-whatsapp mb-3">
              <Sparkles className="h-6 w-6" />
            </div>
            <p className="font-bold text-gray-700 dark:text-gray-300">لا توجد رسائل سابقة بعد</p>
            <p className="text-xs text-gray-400 mt-1">ابدأ المحادثة وشارك فريقك التحديثات اليومية!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === user?.id;

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} transition-all`}
              >
                {/* Sender Name & Role */}
                <div className="flex items-center gap-1.5 mb-1 px-1 text-xs text-gray-500 dark:text-gray-400">
                  <span className="font-bold text-gray-800 dark:text-gray-200">
                    {isMe ? 'أنت' : msg.sender?.name || 'عضو الفريق'}
                  </span>
                  {msg.sender?.role === 'admin' && (
                    <span className="rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-[10px] px-1 font-semibold">
                      مدير
                    </span>
                  )}
                  <span className="text-[10px] text-gray-400">
                    {formatMessageTime(msg.createdAt)}
                  </span>
                </div>

                {/* Message Bubble */}
                <div
                  className={`max-w-[80%] md:max-w-[65%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-xs break-words ${
                    isMe
                      ? 'bg-whatsapp text-white rounded-br-xs'
                      : 'bg-white text-gray-900 border border-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 rounded-bl-xs'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input Bar */}
      <form
        onSubmit={handleSend}
        className="border-t border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900 flex items-end gap-3"
      >
        <div className="relative flex-1">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="اكتب رسالتك إلى كل أعضاء الفريق... (اضغط Enter للإرسال، Shift+Enter لسطر جديد)"
            rows={1}
            maxLength={1000}
            className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-whatsapp focus:bg-white focus:outline-none focus:ring-1 focus:ring-whatsapp dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 dark:focus:bg-gray-900"
            style={{ minHeight: '44px', maxHeight: '120px' }}
          />
          <div className="absolute left-3 bottom-2 text-[10px] text-gray-400">
            {inputText.length}/1000
          </div>
        </div>

        <button
          type="submit"
          disabled={!inputText.trim() || sendMutation.isPending}
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-whatsapp text-white shadow-md shadow-whatsapp/20 transition-all hover:bg-whatsapp-dark active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
        >
          <Send className="h-5 w-5 rotate-180" />
        </button>
      </form>
    </div>
  );
};
