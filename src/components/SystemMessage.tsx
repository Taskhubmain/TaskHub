import React from 'react';
import { parseSystemMessage } from '../lib/system-messages';

interface SystemMessageProps {
  message: string;
  className?: string;
}

/**
 * Component for rendering system messages with proper no-translate markers
 * Parses [[...]] markers and wraps content in wg-notranslate spans
 */
export function SystemMessage({ message, className = '' }: SystemMessageProps) {
  const segments = parseSystemMessage(message);

  return (
    <div className={className}>
      {segments.map((segment, index) => {
        if (segment.noTranslate) {
          return (
            <span key={index} className="wg-notranslate" data-wg-notranslate data-no-translate>
              {segment.text}
            </span>
          );
        }
        return <React.Fragment key={index}>{segment.text}</React.Fragment>;
      })}
    </div>
  );
}
