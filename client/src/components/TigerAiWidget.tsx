import React, { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api.js';
import { useAuth } from '../contexts/AuthContext.js';
import {
  Sparkles,
  X,
  Send,
  Bot,
  User,
  Copy,
  Check,
  RotateCcw,
  Maximize2,
  Minimize2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  model?: string;
  simulated?: boolean;
}

const QUICK_PROMPTS = [
  {
    title: 'WhatsApp Follow-Up',
    prompt: 'Draft a polite and engaging WhatsApp follow-up message in Arabic and English for a customer who viewed our quote but hasn\'t replied yet.',
  },
  {
    title: 'Objection Handling',
    prompt: 'How should our sales team respond when a customer says "Your price is higher than your competitors"? Give 3 practical approaches.',
  },
  {
    title: 'Attendance & Policy',
    prompt: 'Briefly explain our company attendance rules: What is the grace period for check-in, and how are late arrivals or unexcused absences deducted from monthly salary?',
  },
  {
    title: 'Closing Tactics',
    prompt: 'Give me 3 proven techniques to close an ongoing WhatsApp deal today with urgency and professionalism.',
  },
];

export const TigerAiWidget: React.FC = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [status, setStatus] = useState<{ configured: boolean; model: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Fetch AI status
  useEffect(() => {
    if (user) {
      api.get('/ai/status')
        .then((res) => setStatus(res.data.data))
        .catch(() => setStatus(null));
    }
  }, [user]);

  // Global hotkey (Alt+A) to toggle AI assistant
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      const isInput = activeTag === 'input' || activeTag === 'textarea';

      if (e.altKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === 'Escape' && isOpen && !isInput) {
        setIsOpen(false);
      }
    };

    const handleCustomOpen = (e: any) => {
      setIsOpen(true);
      if (e.detail?.initialPrompt) {
        setInput(e.detail.initialPrompt);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open-tiger-ai', handleCustomOpen);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-tiger-ai', handleCustomOpen);
    };
  }, [isOpen]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isGenerating, isOpen]);

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText || input).trim();
    if (!textToSend || isGenerating) return;

    setErrorMsg(null);
    const newMsg: ChatMessage = {
      role: 'user',
      content: textToSend,
      timestamp: new Date(),
    };

    const updatedHistory = [...messages, newMsg];
    setMessages(updatedHistory);
    setInput('');
    setIsGenerating(true);

    try {
      const payload = updatedHistory.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await api.post('/ai/chat', { messages: payload });
      const replyData = res.data.data;

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: replyData.content,
          timestamp: new Date(),
          model: replyData.model,
          simulated: replyData.simulated,
        },
      ]);
    } catch (err: any) {
      console.error('AI chat failed:', err);
      setErrorMsg(
        err.response?.data?.error ||
          'Failed to get a response from Tiger AI. Please check your network or API key settings.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCopyMessage = (index: number, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleResetChat = () => {
    setMessages([]);
    setErrorMsg(null);
  };

  // Safe formatting helper for assistant messages (Markdown-like)
  const renderFormattedContent = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      // Header ###
      if (line.startsWith('### ')) {
        return (
          <h4 key={idx} className="font-semibold text-sm text-text mt-2 mb-1">
            {line.replace('### ', '')}
          </h4>
        );
      }
      // Header ##
      if (line.startsWith('## ')) {
        return (
          <h3 key={idx} className="font-bold text-sm text-text mt-3 mb-1.5 border-b border-border pb-1">
            {line.replace('## ', '')}
          </h3>
        );
      }
      // Bullet list item
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        const text = line.replace(/^[\s-*]+/, '');
        return (
          <div key={idx} className="flex items-start gap-2 my-1 pl-1">
            <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0 mt-1.5" />
            <span className="text-xs leading-relaxed" dangerouslySetInnerHTML={{ __html: formatInline(text) }} />
          </div>
        );
      }
      // Numbered list item
      const numMatch = line.match(/^(\d+)\.\s+(.*)/);
      if (numMatch) {
        return (
          <div key={idx} className="flex items-start gap-2 my-1 pl-1">
            <span className="text-xs font-semibold text-accent shrink-0">{numMatch[1]}.</span>
            <span className="text-xs leading-relaxed" dangerouslySetInnerHTML={{ __html: formatInline(numMatch[2]) }} />
          </div>
        );
      }
      // Blockquote
      if (line.startsWith('> ')) {
        return (
          <div key={idx} className="border-s-2 border-accent pl-3 py-1 my-1.5 text-xs italic text-muted bg-accent-soft/20 rounded-e">
            {line.replace('> ', '')}
          </div>
        );
      }
      // Empty line
      if (!line.trim()) {
        return <div key={idx} className="h-1.5" />;
      }
      // Standard line
      return (
        <p key={idx} className="text-xs leading-relaxed my-1" dangerouslySetInnerHTML={{ __html: formatInline(line) }} />
      );
    });
  };

  const formatInline = (text: string) => {
    // Replace **bold** with <strong>
    let res = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Replace `code` with <code class="bg-card px-1 py-0.5 rounded font-mono text-[11px] border border-border">
    res = res.replace(/`([^`]+)`/g, '<code class="bg-card px-1 py-0.5 rounded font-mono text-[11px] border border-border">$1</code>');
    return res;
  };

  if (!user) return null;

  return (
    <>
      {/* FLOATING ACTION LAUNCHER (Visible when closed) */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          title="Open Tiger AI Copilot (Alt+A)"
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 rounded-full bg-accent text-white shadow-lg hover:shadow-xl hover:bg-accent-hover transition-all duration-200 group cursor-pointer border border-white/10"
        >
          <div className="relative">
            <Sparkles className="w-5 h-5 text-white animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-accent" />
          </div>
          <span className="text-xs font-semibold tracking-wide">Tiger AI</span>
          <span className="hidden sm:inline bg-black/20 text-white/80 font-mono text-[10px] px-1.5 py-0.5 rounded border border-white/10">
            Alt+A
          </span>
        </button>
      )}

      {/* CHAT WINDOW / DRAWER */}
      {isOpen && (
        <div
          className={`fixed z-50 transition-all duration-200 flex flex-col bg-card border border-border shadow-2xl rounded-2xl overflow-hidden ${
            isExpanded
              ? 'inset-4 sm:inset-10'
              : 'bottom-4 right-4 w-[95vw] sm:w-[460px] h-[640px] max-h-[90vh]'
          }`}
          dir="ltr"
        >
          {/* HEADER */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card select-none">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-accent text-white flex items-center justify-center font-bold shadow-subtle relative">
                <Sparkles className="w-4 h-4 text-white" />
                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-card" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-semibold text-text">Tiger AI</h3>
                  <span className="bg-accent-soft text-accent text-[10px] font-semibold px-2 py-0.5 rounded-full border border-accent/20">
                    Gemini 3.8 Flash
                  </span>
                </div>
                <p className="text-[11px] text-muted -mt-0.5">
                  {status?.configured ? 'Active • Enterprise Model' : 'Simulation Mode'}
                </p>
              </div>
            </div>

            {/* Header controls */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleResetChat}
                title="Clear conversation"
                className="p-1.5 rounded-lg text-muted hover:text-text hover:bg-bg border border-transparent hover:border-border transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? 'Restore size' : 'Expand window'}
                className="hidden sm:inline-flex p-1.5 rounded-lg text-muted hover:text-text hover:bg-bg border border-transparent hover:border-border transition-colors cursor-pointer"
              >
                {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Close (Esc)"
                className="p-1.5 rounded-lg text-muted hover:text-text hover:bg-bg border border-transparent hover:border-border transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* CHAT MESSAGES BODY */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-bg/40 text-text">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col justify-between py-2">
                {/* Welcome Card */}
                <div className="rounded-xl border border-border bg-card p-4 space-y-2 shadow-subtle">
                  <div className="flex items-center gap-2 text-accent font-semibold text-xs">
                    <Sparkles className="w-4 h-4" />
                    <span>Hello, {user?.name || 'Partner'}!</span>
                  </div>
                  <p className="text-xs text-muted leading-relaxed">
                    I am Tiger AI, your workspace copilot powered by <strong>Google Gemini 3.8 Flash</strong>.
                    Ask me to craft WhatsApp messages, resolve customer objections, or explain internal company policies.
                  </p>
                </div>

                {/* Quick Prompts */}
                <div className="space-y-2">
                  <div className="text-[11px] font-semibold text-muted uppercase tracking-wider px-1">
                    Quick Suggestions
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {QUICK_PROMPTS.map((qp, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSendMessage(qp.prompt)}
                        className="text-left p-2.5 rounded-lg border border-border bg-card hover:bg-bg hover:border-accent transition-colors text-xs space-y-0.5 cursor-pointer shadow-subtle group"
                      >
                        <div className="font-medium text-text group-hover:text-accent transition-colors">
                          {qp.title}
                        </div>
                        <div className="text-[11px] text-muted line-clamp-2">
                          {qp.prompt}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <>
                {messages.map((m, idx) => (
                  <div
                    key={idx}
                    className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {m.role === 'assistant' && (
                      <div className="w-7 h-7 rounded-lg bg-accent text-white flex items-center justify-center shrink-0 shadow-subtle mt-0.5">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}

                    <div
                      className={`max-w-[85%] rounded-xl p-3 text-xs shadow-subtle relative group ${
                        m.role === 'user'
                          ? 'bg-accent text-white font-medium rounded-tr-none'
                          : 'bg-card border border-border text-text rounded-tl-none'
                      }`}
                    >
                      {m.role === 'assistant' ? (
                        <>
                          <div className="space-y-1">
                            {renderFormattedContent(m.content)}
                          </div>

                          <div className="flex items-center justify-between pt-2 mt-2 border-t border-border/50 text-[10px] text-muted">
                            <span className="font-mono text-[9px] uppercase tracking-wider text-muted">
                              {m.model || 'Gemini 3.8 Flash'}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyMessage(idx, m.content)}
                              className="inline-flex items-center gap-1 text-[10px] text-muted hover:text-text px-1.5 py-0.5 rounded hover:bg-bg transition-colors cursor-pointer"
                              title="Copy response"
                            >
                              {copiedIndex === idx ? (
                                <>
                                  <Check className="w-3 h-3 text-accent" />
                                  <span className="text-accent font-medium">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
                      )}
                    </div>

                    {m.role === 'user' && (
                      <div className="w-7 h-7 rounded-lg bg-card border border-border text-muted flex items-center justify-center shrink-0 shadow-subtle mt-0.5">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                ))}

                {/* Generating Loading Bubble */}
                {isGenerating && (
                  <div className="flex gap-2.5 justify-start">
                    <div className="w-7 h-7 rounded-lg bg-accent text-white flex items-center justify-center shrink-0 shadow-subtle animate-pulse">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="bg-card border border-border rounded-xl rounded-tl-none p-3 shadow-subtle flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
                      <span className="text-xs text-muted">Tiger AI is thinking...</span>
                    </div>
                  </div>
                )}

                {/* Error Banner */}
                {errorMsg && (
                  <div className="p-3 rounded-lg border border-danger/30 bg-danger-soft text-danger text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div className="flex-1">{errorMsg}</div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* INPUT BAR */}
          <div className="p-3 border-t border-border bg-card">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="space-y-2"
            >
              <div className="relative flex items-end bg-bg border border-border rounded-xl focus-within:border-accent transition-colors shadow-subtle">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask Tiger AI anything (e.g. Draft a WhatsApp reply, explain policy)..."
                  rows={2}
                  className="w-full bg-transparent px-3 py-2 text-xs text-text placeholder:text-muted focus:outline-none resize-none min-h-[44px] max-h-32"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isGenerating}
                  className="m-1.5 p-2 rounded-lg bg-accent text-white hover:bg-accent-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
                  title="Send message (Enter)"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center justify-between text-[10px] text-muted px-1">
                <span>Press <strong>Enter</strong> to send, <strong>Shift+Enter</strong> for newline</span>
                <span>Powered by Google Gemini 3.8 Flash</span>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
