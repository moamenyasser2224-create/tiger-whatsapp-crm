import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import { useSocket } from '../contexts/SocketContext.js';
import { useAuth } from '../contexts/AuthContext.js';
import type { ChatMessage, Channel } from '../types/index.js';
import { LedgerButton, LedgerInput, LedgerModal } from '../components/common/LedgerComponents.js';
import { format } from 'date-fns';
import {
  Hash,
  Send,
  Paperclip,
  Plus,
  X,
  FileText,
  Download,
  CornerUpLeft,
} from 'lucide-react';

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
      parentId?: string;
      attachmentUrl?: string;
      attachmentType?: string;
      attachmentSize?: number;
    }) => {
      const res = await api.post('/chat/messages', payload);
      return res.data.data;
    },
    onSuccess: (newMsg: ChatMessage) => {
      setInputText('');
      setAttachmentData(null);
      setReplyingTo(null);
      setErrorMessage(null);

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
    <div className="flex flex-col md:flex-row h-[calc(100vh-10rem)] border border-border bg-card rounded-xl shadow-subtle overflow-hidden select-text" dir="ltr">
      {/* 1. CHANNELS SIDEBAR */}
      <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-border bg-card flex flex-col shrink-0">
        {/* Sidebar Header */}
        <div className="p-3.5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Hash className="w-4 h-4 text-accent" />
            <h2 className="font-semibold text-xs uppercase tracking-wider text-text">
              Channels
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setIsNewChannelModalOpen(true)}
            title="Create New Channel"
            className="p-1 rounded-md text-muted hover:text-text hover:bg-bg transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Channels List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {/* Default General Channel */}
          <button
            type="button"
            onClick={() => setSelectedChannelId(null)}
            className={`w-full text-left p-2.5 text-xs transition-colors rounded-lg flex items-center justify-between cursor-pointer ${
              selectedChannelId === null
                ? 'bg-accent-soft text-accent font-semibold border-s-2 border-accent'
                : 'text-muted hover:bg-bg hover:text-text font-normal'
            }`}
          >
            <div className="flex items-center gap-2 truncate">
              <span className="font-mono text-xs">#</span>
              <span className="truncate">General Workspace</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-border text-muted">
              ALL
            </span>
          </button>

          {/* Dynamic channels */}
          {channels.map((ch) => {
            const isCurrent = selectedChannelId === ch.id;
            return (
              <button
                key={ch.id}
                type="button"
                onClick={() => setSelectedChannelId(ch.id)}
                className={`w-full text-left p-2.5 text-xs transition-colors rounded-lg flex items-center justify-between cursor-pointer ${
                  isCurrent
                    ? 'bg-accent-soft text-accent font-semibold border-s-2 border-accent'
                    : 'text-muted hover:bg-bg hover:text-text font-normal'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="font-mono text-xs">#</span>
                  <span className="truncate">{ch.name}</span>
                </div>
                {ch.type !== 'public' && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-border text-muted uppercase">
                    {ch.type}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Connection status at bottom */}
        <div className="p-2.5 border-t border-border text-xs flex items-center justify-between text-muted bg-card">
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-accent' : 'bg-muted'
              }`}
            />
            <span className="font-medium text-text">
              {isConnected ? 'Connected' : 'Connecting...'}
            </span>
          </div>
          <span className="text-[10px] font-mono">TLS-256</span>
        </div>
      </aside>

      {/* 2. CHAT STREAM & INPUT */}
      <section className="flex-1 flex flex-col min-w-0 bg-card">
        {/* Active Channel Header */}
        <div className="border-b border-border px-4 py-3 flex items-center justify-between bg-card">
          <div className="flex items-center gap-3">
            <Hash className="w-5 h-5 text-accent" />
            <div>
              <div className="font-semibold text-sm text-text flex items-center gap-2">
                <span>{activeChannel ? activeChannel.name : 'General Workspace'}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-accent-soft text-accent uppercase font-medium">
                  {activeChannel?.type || 'All Members'}
                </span>
              </div>
              <p className="text-xs text-muted">
                Tiger authenticated internal workplace stream
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-muted">
            <span className="tabular-nums">
              {messages.length} messages
            </span>
          </div>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {isLoading ? (
            <div className="flex h-full items-center justify-center text-xs text-muted">
              Loading chat records...
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col h-full items-center justify-center text-center p-6 space-y-2 text-muted">
              <Hash className="w-8 h-8 text-muted stroke-[1.5]" />
              <p className="text-sm font-semibold text-text">
                Start of conversation
              </p>
              <p className="text-xs max-w-sm">
                This channel is open for work updates, documents, and real-time collaboration.
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
                    className={`max-w-[85%] md:max-w-[70%] rounded-xl p-3.5 shadow-subtle ${
                      isMe
                        ? 'bg-accent text-white rounded-tr-sm ml-auto'
                        : 'bg-bg border border-border text-text rounded-tl-sm mr-auto'
                    }`}
                  >
                    {/* Header */}
                    <div className={`flex items-center justify-between gap-4 pb-1.5 mb-2 text-xs border-b ${
                      isMe ? 'border-white/20 text-white/80' : 'border-border text-muted'
                    }`}>
                      <div className="flex items-center gap-2">
                        {msg.sender?.photoUrl ? (
                          <img
                            src={msg.sender.photoUrl}
                            alt={msg.sender.name}
                            className="w-5 h-5 rounded-full object-cover"
                          />
                        ) : (
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            isMe ? 'bg-white/20 text-white' : 'bg-accent-soft text-accent'
                          }`}>
                            {msg.sender?.name?.[0] || 'U'}
                          </span>
                        )}
                        <span className={`font-semibold ${isMe ? 'text-white' : 'text-text'}`}>
                          {isMe ? 'You' : msg.sender?.name || 'Member'}
                        </span>
                        {msg.sender?.role === 'admin' && (
                          <span className={`text-[9px] px-1 py-0.2 rounded font-semibold ${
                            isMe ? 'bg-white/25 text-white' : 'bg-card border border-border text-muted'
                          }`}>
                            ADMIN
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[10px]">
                        <span className="tabular-nums">{formatMessageTime(msg.createdAt)}</span>
                        <button
                          type="button"
                          onClick={() => setReplyingTo(msg)}
                          title="Reply in thread"
                          className="opacity-0 group-hover:opacity-100 hover:underline transition-opacity cursor-pointer flex items-center gap-0.5"
                        >
                          <CornerUpLeft className="w-3 h-3" />
                          <span>Reply</span>
                        </button>
                      </div>
                    </div>

                    {/* Quoted Message */}
                    {msg.parent && (
                      <div className={`border-l-2 pl-2.5 py-1 mb-2 text-xs rounded-r ${
                        isMe
                          ? 'border-white/50 bg-white/10 text-white/90'
                          : 'border-accent bg-card text-muted'
                      }`}>
                        <span className="font-semibold block text-[10px]">
                          Replying to {msg.parent.sender?.name || 'Member'}:
                        </span>
                        <p className="line-clamp-1 truncate">{msg.parent.text}</p>
                      </div>
                    )}

                    {/* Text */}
                    {msg.text && (
                      <p className={`text-xs sm:text-sm whitespace-pre-wrap leading-relaxed ${
                        isMe ? 'text-white' : 'text-text'
                      }`}>
                        {msg.text}
                      </p>
                    )}

                    {/* Attachment */}
                    {msg.attachmentUrl && (
                      <div className={`mt-2.5 pt-2 border-t ${
                        isMe ? 'border-white/20' : 'border-border'
                      }`}>
                        {msg.attachmentType?.startsWith('image/') ? (
                          <a
                            href={msg.attachmentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block rounded-lg overflow-hidden border border-border/40 hover:opacity-95"
                          >
                            <img
                              src={msg.attachmentUrl}
                              alt="Attachment"
                              className="max-h-60 max-w-full object-contain"
                            />
                          </a>
                        ) : (
                          <a
                            href={msg.attachmentUrl}
                            download="attachment"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-center gap-2 p-2 rounded-lg border text-xs transition-colors ${
                              isMe
                                ? 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                                : 'bg-card border-border text-text hover:bg-bg'
                            }`}
                          >
                            <FileText className="w-4 h-4 shrink-0" />
                            <div className="flex-1 truncate">
                              <span className="font-medium underline block truncate">Attached Document</span>
                              {msg.attachmentSize && (
                                <span className="text-[10px] opacity-75 tabular-nums">
                                  {(msg.attachmentSize / 1024).toFixed(1)} KB
                                </span>
                              )}
                            </div>
                            <Download className="w-3.5 h-3.5" />
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

        {/* Reply indicator banner */}
        {replyingTo && (
          <div className="border-t border-border bg-bg px-4 py-2 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 truncate">
              <CornerUpLeft className="w-3.5 h-3.5 text-accent shrink-0" />
              <span className="text-muted">Replying to <strong className="text-text">{replyingTo.sender?.name}</strong>:</span>
              <span className="text-muted truncate max-w-xs">{replyingTo.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setReplyingTo(null)}
              className="p-1 rounded text-muted hover:text-text"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Attachment preview banner */}
        {attachmentData && (
          <div className="border-t border-border bg-bg px-4 py-2 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Paperclip className="w-3.5 h-3.5 text-accent" />
              <span className="font-medium text-text">{attachmentData.name}</span>
              <span className="text-muted tabular-nums">
                ({(attachmentData.size / 1024).toFixed(1)} KB)
              </span>
            </div>
            <button
              type="button"
              onClick={() => setAttachmentData(null)}
              className="p-1 rounded text-muted hover:text-danger"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Error notification */}
        {errorMessage && (
          <div className="border-t border-danger/40 bg-danger-soft px-4 py-1.5 text-xs text-danger flex items-center justify-between">
            <span>{errorMessage}</span>
            <button onClick={() => setErrorMessage(null)} className="p-0.5">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Input Form Area */}
        <form
          onSubmit={handleSend}
          className="border-t border-border p-3.5 bg-card flex items-end gap-2.5"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*,.pdf,.doc,.docx,.xlsx"
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Attach file (up to 10MB)"
            className="p-2.5 rounded-lg border border-border text-muted hover:text-text hover:bg-bg transition-colors cursor-pointer shrink-0"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          <div className="relative flex-1">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Write a message... (Press Enter to send, Shift+Enter for new line)"
              rows={2}
              maxLength={2000}
              className="w-full resize-none border border-border bg-bg p-2.5 text-xs sm:text-sm text-text placeholder:text-muted rounded-lg outline-none focus:border-accent shadow-subtle transition-colors"
            />
            <div className="absolute right-2 bottom-2 text-[10px] text-muted tabular-nums">
              {inputText.length}/2000
            </div>
          </div>

          <button
            type="submit"
            disabled={!inputText.trim() && !attachmentData}
            className="inline-flex items-center justify-center gap-1.5 font-medium rounded-lg px-4 py-2 text-xs sm:text-sm bg-accent text-white hover:bg-accent-hover shadow-subtle transition-colors disabled:opacity-40 disabled:cursor-not-allowed h-[42px] shrink-0 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Send Message</span>
          </button>
        </form>
      </section>

      {/* New Channel Modal */}
      <LedgerModal
        isOpen={isNewChannelModalOpen}
        onClose={() => setIsNewChannelModalOpen(false)}
        title="Create Internal Channel"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text mb-1">
              Channel Name
            </label>
            <LedgerInput
              placeholder="e.g. finance-operations"
              value={newChannelName}
              onChange={(e) => setNewChannelName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text mb-1">
              Access Type
            </label>
            <select
              value={newChannelType}
              onChange={(e) => setNewChannelType(e.target.value as any)}
              className="w-full bg-card border border-border rounded-lg px-3 py-2 text-xs sm:text-sm text-text outline-none focus:border-accent shadow-subtle"
            >
              <option value="public">Public (All Organization)</option>
              <option value="department">Department Restricted</option>
              <option value="private">Private (Admin &amp; Managers)</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <LedgerButton
              variant="secondary"
              size="sm"
              onClick={() => setIsNewChannelModalOpen(false)}
            >
              Cancel
            </LedgerButton>
            <LedgerButton
              variant="primary"
              size="sm"
              disabled={!newChannelName.trim() || createChannelMutation.isPending}
              onClick={() =>
                createChannelMutation.mutate({
                  name: newChannelName.trim(),
                  type: newChannelType,
                })
              }
            >
              {createChannelMutation.isPending ? 'Creating...' : 'Create Channel'}
            </LedgerButton>
          </div>
        </div>
      </LedgerModal>
    </div>
  );
};
