import { AlertTriangle } from 'lucide-react';

interface ModerationAlertProps {
  message: string;
  isVisible: boolean;
}

export function ModerationAlert({ message, isVisible }: ModerationAlertProps) {
  if (!isVisible) return null;

  return (
    <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
      <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <h4 className="text-sm font-semibold text-red-900 mb-1">
          Контент заблокирован
        </h4>
        <p className="text-sm text-red-700">{message}</p>
      </div>
    </div>
  );
}
