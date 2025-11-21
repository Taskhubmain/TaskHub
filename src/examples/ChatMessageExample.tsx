import { NoTranslate } from '@/components/NoTranslate';

interface Message {
  id: string;
  sender: string;
  text: string;
  timestamp: Date;
}

interface ChatMessageProps {
  message: Message;
  isCurrentUser: boolean;
}

export function ChatMessageExample({ message, isCurrentUser }: ChatMessageProps) {
  return (
    <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <NoTranslate
        className={`max-w-xs px-4 py-2 rounded-lg chat-message ${
          isCurrentUser ? 'bg-[#3F7F6E] text-white' : 'bg-gray-100'
        }`}
      >
        <div className="font-semibold text-sm mb-1">{message.sender}</div>
        <div className="text-sm">{message.text}</div>
        <div className="text-xs opacity-70 mt-1">
          {message.timestamp.toLocaleTimeString()}
        </div>
      </NoTranslate>
    </div>
  );
}

export function ProposalCardExample({ proposal }: { proposal: any }) {
  return (
    <div className="border rounded-lg p-4">
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-semibold">{proposal.title}</h3>
        <span className="text-[#3F7F6E] font-bold">${proposal.price}</span>
      </div>

      <NoTranslate className="proposal-content">
        <p className="text-gray-600 mb-3">{proposal.description}</p>

        <div className="flex flex-wrap gap-2 mb-3">
          {proposal.deliveryOptions?.map((option: any) => (
            <span key={option.id} className="text-sm bg-gray-100 px-2 py-1 rounded">
              {option.name} - ${option.price}
            </span>
          ))}
        </div>
      </NoTranslate>

      <div className="flex justify-between items-center text-sm text-gray-500">
        <span>Срок: {proposal.deadline} дней</span>
        <button className="text-[#3F7F6E] hover:underline">Подробнее</button>
      </div>
    </div>
  );
}

export function OrderCardExample({ order }: { order: any }) {
  return (
    <div className="border rounded-lg p-4 hover:shadow-lg transition">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-lg">{order.title}</h3>
        <span className="text-[#3F7F6E] font-bold">${order.budget}</span>
      </div>

      <NoTranslate className="order-description" data-user-content="true">
        <p className="text-gray-600 mb-3 line-clamp-2">{order.description}</p>

        {order.requirements && (
          <div className="text-sm text-gray-500 mb-3">
            <strong>Требования:</strong> {order.requirements}
          </div>
        )}
      </NoTranslate>

      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span>{order.category}</span>
        <span>•</span>
        <span>{order.proposalsCount} откликов</span>
      </div>
    </div>
  );
}
