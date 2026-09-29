import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import { StatusBadge } from './common/StatusBadge.js';
import { X, MessageCircle, Send, ExternalLink, CheckCircle2, AlertCircle } from 'lucide-react';

interface WhatsAppDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: {
    id: string;
    name: string;
    phone: string;
  } | null;
  defaultMessage?: string;
  onSent?: () => void;
}

export const WhatsAppDispatchModal: React.FC<WhatsAppDispatchModalProps> = ({
  isOpen,
  onClose,
  customer,
  defaultMessage = '',
  onSent,
}) => {
  const [messageText, setMessageText] = useState(defaultMessage);
  const [isSending, setIsSending] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Check WhatsApp API status
  const { data: statusData } = useQuery({
    queryKey: ['whatsappStatus'],
    queryFn: async () => {
      const res = await api.get('/whatsapp/status');
      return res.data;
    },
    enabled: isOpen,
  });

  React.useEffect(() => {
    setMessageText(defaultMessage);
    setFeedback(null);
  }, [defaultMessage, customer]);

  if (!isOpen || !customer) return null;

  const cleanPhone = customer.phone.replace(/\D/g, '');
  const isCloudConfigured = statusData?.isCloudConfigured ?? false;
  const waMeUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`;

  const handleSendCloudApi = async () => {
    setIsSending(true);
    setFeedback(null);
    try {
      const res = await api.post('/whatsapp/send', {
        customerId: customer.id,
        phone: customer.phone,
        messageText,
        customerName: customer.name,
      });

      if (res.data.mode === 'cloud_api' && res.data.success) {
        setFeedback({
          type: 'success',
          message: `Dispatched via Meta Cloud API (ID: ${res.data.messageId || 'OK'})`,
        });
        if (onSent) onSent();
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        // Fallback happened
        window.open(res.data.url || waMeUrl, '_blank', 'noopener,noreferrer');
        setFeedback({
          type: 'success',
          message: 'Opened in WhatsApp Web / App',
        });
        if (onSent) onSent();
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.error || err.message || 'Failed to dispatch via Cloud API',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleOpenDirect = () => {
    window.open(waMeUrl, '_blank', 'noopener,noreferrer');
    if (onSent) onSent();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card shadow-subtle overflow-hidden text-text flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-4 bg-card">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-accent" />
            <h2 className="text-sm font-semibold text-text">WhatsApp Message Dispatcher</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-muted hover:bg-bg hover:text-text transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-bg/50">
            <div>
              <div className="font-semibold text-sm text-text">{customer.name}</div>
              <div className="text-xs text-muted font-mono">{customer.phone}</div>
            </div>
            <StatusBadge
              label={isCloudConfigured ? 'Cloud API Active' : 'Direct Link Mode'}
              variant={isCloudConfigured ? 'positive' : 'muted'}
            />
          </div>

          {feedback && (
            <div
              className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
                feedback.type === 'success'
                  ? 'border-accent/30 bg-accent-soft text-accent'
                  : 'border-danger/30 bg-danger-soft text-danger'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text">Message Content</label>
            <textarea
              rows={4}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Write WhatsApp message..."
              className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-xs text-text focus:border-accent focus:outline-none resize-none font-sans"
            />
          </div>

          <div className="text-[11px] text-muted space-y-1 bg-card rounded-lg border border-border p-3">
            <p>
              <strong>Meta Cloud API:</strong> Automatically logs message delivery and captures customer replies into your CRM timeline via webhook.
            </p>
            <p>
              <strong>Direct Link:</strong> Opens your native WhatsApp Desktop or Web app with pre-filled message for 1-click manual sending.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-border p-4 bg-card flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleOpenDirect}
            className="rounded-lg border border-border bg-bg px-3 py-2 text-xs font-medium text-text hover:bg-card transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open in WhatsApp Web</span>
          </button>

          <button
            type="button"
            onClick={handleSendCloudApi}
            disabled={isSending}
            className="rounded-lg bg-accent text-white px-4 py-2 text-xs font-medium hover:bg-accent/90 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSending ? 'Sending...' : 'Send via Cloud API'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
