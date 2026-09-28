import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import { useSocket } from '../contexts/SocketContext.js';
import { useAuth } from '../contexts/AuthContext.js';
import type { ChatMessage, Channel } from '../types/index.js';
import { LedgerIcon } from '../components/icons/LedgerIcons.js';
import { LedgerButton, LedgerInput, LedgerModal } from '../components/common/LedgerComponents.js';
import { RubberStamp } from '../components/common/RubberStamp.js';
import { format } from 'date-fns';

export const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  const queryClient = useQueryClient();

  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [isNewChannelModalOpen, setIsNewChannelModalOpen] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelType, setNewChannelType] = useState<'public' | 'department' | 'private'>('public');

  // Attachment state
  const [attachmentData, setAttachmentData] = useState<{
    url: string;
    type: string;
    size: number;
    name: string;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Fetch available channels
  const { data: channels = [], refetch: refetchChannels } = useQuery<Channel[]>({
    queryKey: ['chat', 'channels'],
    queryFn: async () => {
      const res = await api.get('/chat/channels');
      return res.data.data || [];
    },
  });

  // 2. Fetch messages for active channel
  const { data: messagesData, isLoading } = useQuery<{ messages: ChatMessage[]; nextCursor: string | null } | ChatMessage[]>({
    queryKey: ['chat', 'messages', selectedChannelId],
    queryFn: async () => {
      const url = selectedChannelId
        ? `/chat/messages?channelId=${selectedChannelId}&limit=60`
        : '/chat/messages?limit=60';
      const res = await api.get(url);
      return res.data.data;
    },
  });

  // Normalize messages array
  const messages: ChatMessage[] = Array.isArray(messagesData)
    ? messagesData
    : messagesData?.messages || [];

  // Scroll helper
  const scrollToBottom = (smooth = true) => {
    if (typeof messagesEndRef.current?.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({
        behavior: smooth ? 'smooth' : 'auto',
      });
    }
  };

  useEffect(() => {
    scrollToBottom(false);
  }, [messages.length]);

  // Real-time listener for incoming messages
  useEffect(() => {
    if (!socket) return;

    if (selectedChannelId) {
      socket.emit('join_channel', selectedChannelId);
    }

    const handleNewMessage = (newMsg: ChatMessage) => {
      const msgChannel = newMsg.channelId || null;
      const currentChannel = selectedChannelId || null;

      if (msgChannel === currentChannel) {
        queryClient.setQueryData(['chat', 'messages', selectedChannelId], (old: any) => {
          if (!old) return [newMsg];
          if (Array.isArray(old)) {
            if (old.some((m) => m.id === newMsg.id)) return old;
            return [...old, newMsg];
          }
          if (old.messages) {
            if (old.messages.some((m: ChatMessage) => m.id === newMsg.id)) return old;
            return {
              ...old,
              messages: [...old.messages, newMsg],
            };
          }
          return [newMsg];
        });
        setTimeout(() => scrollToBottom(true), 50);
      }
    };

    socket.on('new_message', handleNewMessage);

    return () => {
      if (selectedChannelId) {
        socket.emit('leave_channel', selectedChannelId);
      }
      socket.off('new_message', handleNewMessage);
    };
  }, [socket, selectedChannelId, queryClient]);

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: async (payload: {
      text: string;
      channelId?: string | null;
      parentId?: string | null;
      attachmentUrl?: string | null;
      attachmentType?: string | null;
      attachmentSize?: number | null;
    }) => {
      setErrorMessage(null);
      const res = await api.post('/chat/messages', payload);
      return res.data.data;
    },
    onSuccess: (newMsg) => {
      setInputText('');
      setReplyingTo(null);
      setAttachmentData(null);
      queryClient.setQueryData(['chat', 'messages', selectedChannelId], (old: any) => {
        if (!old) return [newMsg];
        if (Array.isArray(old)) {
          if (old.some((m) => m.id === newMsg.id)) return old;
          return [...old, newMsg];
        }
        if (old.messages) {
          if (old.messages.some((m: ChatMessage) => m.id === newMsg.id)) return old;
          return {
            ...old,
            messages: [...old.messages, newMsg],
          };
        }
        return [newMsg];
      });
      setTimeout(() => scrollToBottom(true), 50);
    },
    onError: (err: any) => {
      setErrorMessage(err.response?.data?.error || 'Failed to send message. Please try again.');
    },
  });

  // Create Channel Mutation
  const createChannelMutation = useMutation({
    mutationFn: async (payload: { name: string; type: string }) => {
      const res = await api.post('/chat/channels', payload);
      return res.data.data;
    },
    onSuccess: (newChannel) => {
      setIsNewChannelModalOpen(false);
      setNewChannelName('');
      refetchChannels();
      setSelectedChannelId(newChannel.id);
    },
    onError: (err: any) => {
      alert(err.response?.data?.error || 'Failed to create channel');
    },
  });

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed && !attachmentData) return;
    if (trimmed.length > 2000) {
      setErrorMessage('Message length cannot exceed 2000 characters');
      return;
    }

    sendMutation.mutate({
      text: trimmed,
      channelId: selectedChannelId,
      parentId: replyingTo?.id,
      attachmentUrl: attachmentData?.url,
      attachmentType: attachmentData?.type,
      attachmentSize: attachmentData?.size,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('Attachment size limit is 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAttachmentData({
        url: reader.result as string,
        type: file.type || 'application/octet-stream',
        size: file.size,
        name: file.name,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const formatMessageTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return format(d, 'hh:mm a');
    } catch {
      return '';
    }
  };

  const activeChannel = channels.find((c) => c.id === selectedChannelId);

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-10.5rem)] border-2 border-neutral-900 dark:border-neutral-100 bg-[#ffffff] dark:bg-[#141414] shadow-solid select-text" dir="ltr">
      {/* 1. CHANNELS SIDEBAR */}
      <aside className="w-full md:w-64 border-b-2 md:border-b-0 md:border-r-2 border-neutral-900 dark:border-neutral-100 bg-[#fafafa] dark:bg-[#111111] flex flex-col shrink-0">
        {/* Sidebar Header */}
        <div className="p-3 border-b-2 border-neutral-900 dark:border-neutral-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-neutral-900 dark:bg-white" />
            <h2 className="font-bold text-xs font-mono uppercase tracking-wider text-neutral-900 dark:text-white">
              CHANNELS
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setIsNewChannelModalOpen(true)}
            title="Create New Channel"
            className="p-1 border border-neutral-900 dark:border-white hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <LedgerIcon name="plus" size={13} />
          </button>
        </div>

        {/* Channels List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {/* General Workspace Channel */}
          <button
            type="button"
            onClick={() => setSelectedChannelId(null)}
            className={`w-full text-left p-2.5 text-xs font-bold transition-all border flex items-center justify-between cursor-pointer ${
              selectedChannelId === null
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-black border-neutral-900 dark:border-white shadow-solid-sm'
                : 'bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 border-neutral-300 dark:border-neutral-700 hover:border-neutral-900'
            }`}
          >
            <div className="flex items-center gap-2 truncate">
              <span className="font-mono text-sm">#</span>
              <span className="truncate">General Workspace</span>
            </div>
            <span className="text-[10px] font-mono px-1 border border-current">ALL</span>
          </button>

          {/* User Channels */}
          {channels.map((chan) => {
            const isSelected = selectedChannelId === chan.id;
            return (
              <button
                key={chan.id}
                type="button"
                onClick={() => setSelectedChannelId(chan.id)}
                className={`w-full text-left p-2.5 text-xs font-bold transition-all border flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-black border-neutral-900 dark:border-white shadow-solid-sm'
                    : 'bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 border-neutral-300 dark:border-neutral-700 hover:border-neutral-900'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="font-mono text-sm">#</span>
                  <span className="truncate">{chan.name}</span>
                </div>
                <span className="text-[9px] font-mono px-1 border border-current uppercase">
                  {chan.type}
                </span>
              </button>
            );
          })}
        </div>

        {/* Real-time Connection Footer */}
        <div className="p-2 border-t-2 border-neutral-900 dark:border-neutral-100 text-[10px] font-mono flex items-center justify-between bg-white dark:bg-neutral-900">
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full border border-neutral-900 dark:border-white ${
                isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-transparent'
              }`}
            />
            <span className="font-bold">{isConnected ? 'Live WebSocket Active' : 'Connecting...'}</span>
          </div>
          <span className="text-neutral-500">WS-256</span>
        </div>
      </aside>

      {/* 2. CHAT FEED & MESSAGES */}
      <section className="flex-1 flex flex-col min-w-0 bg-[#ffffff] dark:bg-[#141414]">
        {/* Chat Room Top Bar */}
        <div className="border-b-2 border-neutral-900 dark:border-neutral-100 px-4 py-2.5 flex items-center justify-between bg-[#fbfbfb] dark:bg-[#161616]">
          <div className="flex items-center gap-3">
            <span className="font-mono font-bold text-lg">#</span>
            <div>
              <div className="font-bold text-sm text-neutral-950 dark:text-white flex items-center gap-2">
                <span>{activeChannel ? activeChannel.name : 'General Workspace'}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 border border-neutral-900 dark:border-white uppercase">
                  {activeChannel ? activeChannel.type : 'All Members'}
                </span>
              </div>
              <p className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400">
                Tiger authenticated internal workplace stream
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 font-mono text-xs">
            <span className="px-2 py-0.5 border border-neutral-900 dark:border-neutral-100">
              {messages.length} messages
            </span>
          </div>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div className="bg-neutral-950 text-white dark:bg-white dark:text-black border-b-2 border-neutral-900 dark:border-white px-4 py-2 text-xs font-mono font-bold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LedgerIcon name="alert-triangle" size={14} />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-white dark:text-black px-1 font-bold hover:underline cursor-pointer"
            >
              [Dismiss]
            </button>
          </div>
        )}

        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 ruled-paper">
          {isLoading ? (
            <div className="flex h-full items-center justify-center text-xs font-mono text-neutral-500">
              Loading chat records...
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center p-6 space-y-2">
              <div className="p-3 border-2 border-neutral-900 dark:border-white inline-block">
                <LedgerIcon name="chat" size={24} />
              </div>
              <div className="font-bold text-sm text-neutral-900 dark:text-white">
                No messages recorded in this channel yet
              </div>
              <p className="text-xs font-mono text-neutral-500 max-w-sm">
                Send the first message to the team. All communications are preserved and encrypted.
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderId === user?.id;

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group`}
                >
                  <div
                    className={`max-w-[90%] md:max-w-[75%] border-2 border-neutral-900 dark:border-neutral-100 p-3 bg-white dark:bg-neutral-900 shadow-solid-sm ${
                      isMe ? 'ml-1' : 'mr-1'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between gap-3 border-b border-dashed border-neutral-300 dark:border-neutral-700 pb-1.5 mb-2 text-xs">
                      <div className="flex items-center gap-2">
                        {msg.sender?.photoUrl ? (
                          <img
                            src={msg.sender.photoUrl}
                            alt={msg.sender.name}
                            className="w-5 h-5 border border-neutral-900 dark:border-white object-cover grayscale"
                          />
                        ) : (
                          <span className="w-5 h-5 border border-neutral-900 dark:border-white flex items-center justify-center font-mono text-[10px] font-bold">
                            {msg.sender?.name?.[0] || 'U'}
                          </span>
                        )}
                        <span className="font-bold text-neutral-950 dark:text-white">
                          {isMe ? 'You' : msg.sender?.name || 'Member'}
                        </span>
                        {msg.sender?.role === 'admin' ? (
                          <span className="text-[9px] font-mono px-1 border border-neutral-900 dark:border-white bg-neutral-900 text-white dark:bg-white dark:text-black">
                            ADMIN
                          </span>
                        ) : (
                          <span className="text-[9px] font-mono px-1 border border-neutral-400 text-neutral-600 dark:text-neutral-400">
                            STAFF
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 font-mono text-[10px] text-neutral-500">
                        <span>{formatMessageTime(msg.createdAt)}</span>
                        <button
                          type="button"
                          onClick={() => setReplyingTo(msg)}
                          title="Reply in thread"
                          className="opacity-0 group-hover:opacity-100 hover:text-neutral-950 dark:hover:text-white font-bold underline transition-opacity cursor-pointer"
                        >
                          [Reply]
                        </button>
                      </div>
                    </div>

                    {/* Quoted Message */}
                    {msg.parent && (
                      <div className="border-l-2 border-neutral-900 dark:border-white pl-2.5 py-1 mb-2 bg-neutral-100 dark:bg-neutral-800 text-xs font-mono text-neutral-600 dark:text-neutral-300">
                        <span className="font-bold block text-[10px] text-neutral-900 dark:text-white">
                          Replying to {msg.parent.sender?.name || 'Member'}:
                        </span>
                        <p className="line-clamp-1 truncate">{msg.parent.text}</p>
                      </div>
                    )}

                    {/* Text */}
                    {msg.text && (
                      <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed text-neutral-900 dark:text-neutral-100">
                        {msg.text}
                      </p>
                    )}

                    {/* Attachment */}
                    {msg.attachmentUrl && (
                      <div className="mt-2.5 pt-2 border-t border-dashed border-neutral-300 dark:border-neutral-700">
                        {msg.attachmentType?.startsWith('image/') ? (
                          <a
                            href={msg.attachmentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block border border-neutral-900 dark:border-white hover:opacity-90"
                          >
                            <img
                              src={msg.attachmentUrl}
                              alt="Attachment"
                              className="max-h-60 max-w-full object-contain grayscale"
                            />
                          </a>
                        ) : (
                          <a
                            href={msg.attachmentUrl}
                            download="attachment"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-2 border border-neutral-900 dark:border-white hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-mono"
                          >
                            <LedgerIcon name="paperclip" size={16} />
                            <div className="flex-1 truncate">
                              <span className="font-bold underline block truncate">Attached Document</span>
                              {msg.attachmentSize && (
                                <span className="text-[10px] text-neutral-500">
                                  {(msg.attachmentSize / 1024).toFixed(1)} KB
                                </span>
                              )}
                            </div>
                            <LedgerIcon name="download" size={14} />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Replying banner */}
        {replyingTo && (
          <div className="border-t-2 border-neutral-900 dark:border-neutral-100 bg-[#f0f0f0] dark:bg-[#1a1a1a] px-4 py-2 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2 truncate">
              <span className="font-bold">Replying to:</span>
              <span className="font-bold text-neutral-900 dark:text-white">
                {replyingTo.sender?.name}
              </span>
              <span className="text-neutral-500 truncate max-w-xs">
                "{replyingTo.text?.slice(0, 45)}..."
              </span>
            </div>
            <button
              type="button"
              onClick={() => setReplyingTo(null)}
              className="font-bold hover:underline cursor-pointer"
            >
              [Cancel Reply]
            </button>
          </div>
        )}

        {/* Selected Attachment Preview Bar */}
        {attachmentData && (
          <div className="border-t-2 border-neutral-900 dark:border-neutral-100 bg-[#f7f7f7] dark:bg-[#181818] px-4 py-2 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2 truncate">
              <LedgerIcon name="paperclip" size={15} />
              <span className="font-bold truncate">{attachmentData.name}</span>
              <span className="text-neutral-500">
                ({(attachmentData.size / 1024).toFixed(1)} KB)
              </span>
            </div>
            <button
              type="button"
              onClick={() => setAttachmentData(null)}
              className="text-neutral-900 dark:text-white font-bold hover:underline cursor-pointer"
            >
              [Remove Attachment]
            </button>
          </div>
        )}

        {/* Chat Input Dock */}
        <form
          onSubmit={handleSend}
          className="border-t-2 border-neutral-900 dark:border-neutral-100 p-3 bg-white dark:bg-neutral-950 flex items-end gap-2.5"
        >
          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*,.pdf,.doc,.docx,.xlsx"
            className="hidden"
          />

          {/* Attachment Paperclip Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Attach file or image (up to 10MB)"
            className="p-2 border-2 border-neutral-900 dark:border-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors btn-mechanical cursor-pointer"
          >
            <LedgerIcon name="paperclip" size={17} />
          </button>

          {/* Text Area */}
          <div className="relative flex-1">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Write a message... (Press Enter to send, Shift+Enter for new line)"
              rows={2}
              maxLength={2000}
              className="w-full resize-none border-2 border-neutral-900 dark:border-white bg-[#fafafa] dark:bg-[#111111] p-2 text-xs sm:text-sm text-neutral-950 dark:text-white outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white rounded-none"
            />
            <div className="absolute right-2 bottom-1.5 text-[9px] font-mono text-neutral-400">
              {inputText.length}/2000
            </div>
          </div>

          {/* Send Button */}
          <LedgerButton
            type="submit"
            disabled={(!inputText.trim() && !attachmentData) || sendMutation.isPending}
            className="h-[46px] px-4 cursor-pointer"
          >
            <LedgerIcon name="arrow-right" size={15} />
            <span className="hidden sm:inline">Send Message</span>
          </LedgerButton>
        </form>
      </section>

      {/* 3. CREATE CHANNEL MODAL */}
      <LedgerModal
        isOpen={isNewChannelModalOpen}
        onClose={() => setIsNewChannelModalOpen(false)}
        title="Create New Team Channel"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!newChannelName.trim()) return;
            createChannelMutation.mutate({
              name: newChannelName.trim(),
              type: newChannelType,
            });
          }}
          className="space-y-4"
        >
          <LedgerInput
            label="Channel Name"
            placeholder="e.g. Sales Team, Automation Projects"
            value={newChannelName}
            onChange={(e) => setNewChannelName(e.target.value)}
            required
          />

          <div className="space-y-1">
            <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200">
              Channel Privacy &amp; Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['public', 'department', 'private'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setNewChannelType(t)}
                  className={`p-2 text-xs font-bold border-2 transition-all cursor-pointer ${
                    newChannelType === t
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-black border-neutral-900 dark:border-white shadow-solid-sm'
                      : 'bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 border-neutral-400 dark:border-neutral-700'
                  }`}
                >
                  {t.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t-2 border-neutral-900 dark:border-white">
            <LedgerButton
              type="button"
              variant="secondary"
              onClick={() => setIsNewChannelModalOpen(false)}
            >
              Cancel
            </LedgerButton>
            <LedgerButton
              type="submit"
              disabled={createChannelMutation.isPending || !newChannelName.trim()}
            >
              {createChannelMutation.isPending ? 'Creating...' : 'Create Channel'}
            </LedgerButton>
          </div>
        </form>
      </LedgerModal>
    </div>
  );
};
