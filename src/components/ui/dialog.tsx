import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

let dialogCounter = 0;

export const Dialog: React.FC<DialogProps> = ({ open, onOpenChange, children }) => {
  const [zIndex] = React.useState(() => {
    if (open) {
      dialogCounter += 10;
      return 50 + dialogCounter;
    }
    return 50;
  });

  React.useEffect(() => {
    if (!open) {
      dialogCounter = Math.max(0, dialogCounter - 10);
    }
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex }}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50"
            onClick={() => onOpenChange?.(false)}
          />
          {children}
        </div>
      )}
    </AnimatePresence>
  );
};

export const DialogContent: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = ''
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      className={`relative w-full max-w-lg rounded-xl bg-white p-6 shadow-xl ${className}`}
      style={{ zIndex: 10 }}
    >
      {children}
    </motion.div>
  );
};

export const DialogHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = ''
}) => {
  return <div className={`mb-4 ${className}`}>{children}</div>;
};

export const DialogTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = ''
}) => {
  return <h2 className={`text-xl font-semibold ${className}`}>{children}</h2>;
};

export const DialogDescription: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = ''
}) => {
  return <p className={`text-sm text-gray-600 ${className}`}>{children}</p>;
};

export const DialogFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = ''
}) => {
  return <div className={`mt-6 flex justify-end gap-3 ${className}`}>{children}</div>;
};
