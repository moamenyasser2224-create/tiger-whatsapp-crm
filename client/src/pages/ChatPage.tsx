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
    <div className="flex flex-col h-[calc(100vh-8.5rem)] rounded-2xl border border-neutral-300 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900 overflow-hidden">
      {/* Chat Room Header */}
      <div className="flex items-center justify-between border-b border-neutral-200 bg-neutral-50/80 px-6 py-4 dark:border-neutral-800 dark:bg-neutral-800/60 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white dark:bg-white dark:text-black shadow-sm">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <span>القناة العامة لفريق العمل</span>
              <span className="rounded-md border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 text-[11px] font-bold text-neutral-800 dark:text-neutral-200">
                Organization-wide
              </span>
            </h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              محادثة داخلية مشفرة ومحمية تجمع كل موظفي وإداريي المنظومة.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-300 dark:border-neutral-700 px-2.5 py-1 font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200">
            <span
              className={`h-2 w-2 rounded-full ${
                isConnected ? 'bg-black dark:bg-white animate-pulse' : 'bg-neutral-400'
              }`}
            />
            <span>{isConnected ? 'بث مباشر متصل' : 'جاري الاتصال...'}</span>
          </span>
        </div>
      </div>

      {/* Error / Rate limit notification */}
      {errorMessage && (
        <div className="bg-neutral-100 border-b border-neutral-900 px-6 py-2 text-xs text-neutral-900 dark:bg-neutral-800 dark:border-white dark:text-white font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-neutral-50/40 dark:bg-neutral-950/20"
      >
        {isLoading ? (
          <div className="flex h-full items-center justify-center text-sm text-neutral-400">
            جاري تحميل الرسائل...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center p-6 text-neutral-400">
            <div className="h-12 w-12 rounded-full border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-700 dark:text-neutral-300 mb-3">
              <Sparkles className="h-6 w-6" />
            </div>
            <p className="font-bold text-neutral-700 dark:text-neutral-300">لا توجد رسائل سابقة بعد</p>
            <p className="text-xs text-neutral-400 mt-1">ابدأ المحادثة وشارك فريقك التحديثات اليومية!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === user?.id;

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} transition-all`}
              >
                <div className={`flex gap-2.5 items-end ${isMe ? 'flex-row-reverse' : 'flex-row'} max-w-[85%] md:max-w-[70%]`}>
                  {msg.sender?.photoUrl ? (
                    <img
                      src={msg.sender.photoUrl}
                      alt={msg.sender.name}
                      className="w-7 h-7 rounded-full object-cover border border-neutral-400 dark:border-neutral-600 grayscale shrink-0 mb-1"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full border border-neutral-400 dark:border-neutral-600 bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 flex items-center justify-center font-bold text-[10px] shrink-0 mb-1">
                      {msg.sender?.name?.[0]?.toUpperCase() || '؟'}
                    </div>
                  )}

                  <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    {/* Sender Name & Role */}
                    <div className="flex items-center gap-1.5 mb-1 px-1 text-xs text-neutral-500 dark:text-neutral-400">
                      <span className="font-bold text-neutral-800 dark:text-neutral-200">
                        {isMe ? 'أنت' : msg.sender?.name || 'عضو الفريق'}
                      </span>
                      {msg.sender?.role === 'admin' && (
                        <span className="rounded border border-neutral-400 bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:border-neutral-600 dark:text-neutral-200 text-[10px] px-1 font-bold">
                          مدير
                        </span>
                      )}
                      <span className="text-[10px] text-neutral-400">
                        {formatMessageTime(msg.createdAt)}
                      </span>
                    </div>

                    {/* Message Bubble */}
                    <div
                      className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-xs break-words ${
                        isMe
                          ? 'bg-black text-white dark:bg-white dark:text-black rounded-br-xs'
                          : 'bg-neutral-100 text-neutral-900 border border-neutral-300 dark:bg-neutral-800 dark:text-neutral-100 dark:border-neutral-700 rounded-bl-xs'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    </div>
                  </div>
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
        className="border-t border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900 flex items-end gap-3"
      >
        <div className="relative flex-1">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="اكتب رسالتك إلى كل أعضاء الفريق... (اضغط Enter للإرسال، Shift+Enter لسطر جديد)"
            rows={1}
            maxLength={1000}
            className="w-full resize-none rounded-xl border border-neutral-300 bg-neutral-50 px-4 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 focus:border-black focus:bg-white focus:outline-none focus:ring-1 focus:ring-black dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:placeholder-neutral-500 dark:focus:border-white dark:focus:ring-white"
            style={{ minHeight: '44px', maxHeight: '120px' }}
          />
          <div className="absolute left-3 bottom-2 text-[10px] text-neutral-400">
            {inputText.length}/1000
          </div>
        </div>

        <button
          type="submit"
          disabled={!inputText.trim() || sendMutation.isPending}
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 border border-neutral-900 dark:border-white transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
        >
          <Send className="h-5 w-5 rotate-180" />
        </button>
      </form>
    </div>
  );
};
