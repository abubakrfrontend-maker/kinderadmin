import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle } from 'lucide-react';

interface ArchiveReasonModalProps {
  isOpen: boolean;
  employeeName: string;
  onConfirm: (reason: string) => Promise<void>;
  onCancel: () => void;
}

export default function ArchiveReasonModal({ isOpen, employeeName, onConfirm, onCancel }: ArchiveReasonModalProps) {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm(reason.trim());
    } finally {
      setIsSubmitting(false);
      setReason('');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            onClick={onCancel}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-[440px] bg-surface-primary rounded-2xl shadow-2xl border border-border-default z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-text-primary">Xodimni arxivlash</h3>
                  <p className="text-xs text-text-tertiary mt-0.5">Bu xodim arxivga ko'chiriladi</p>
                </div>
              </div>
              <button onClick={onCancel} className="p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-secondary transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-4 space-y-4">
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                <p className="text-sm text-amber-800">
                  <span className="font-semibold">{employeeName}</span> arxivga ko'chiriladi. Keyinchalik arxivdan qaytarish mumkin.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-text-primary">
                  Nega xodim ketmoqda? <span className="text-text-tertiary font-normal">(ixtiyoriy)</span>
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Masalan: O'z xohishi bilan, Shartnoma muddati tugadi, Boshqa joyga o'tdi..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border-default bg-surface-secondary/50 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500/30 transition-all duration-200 resize-none"
                  autoFocus
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center gap-2 px-5 py-4 border-t border-border-subtle bg-surface-secondary/30">
              <button
                onClick={onCancel}
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl border border-border-default text-sm font-medium text-text-secondary hover:bg-surface-secondary transition-colors disabled:opacity-50"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? 'Arxivlanmoqda...' : 'Arxivga ko\'chirish'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
