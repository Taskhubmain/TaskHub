# Weglot UGC Exclusion Implementation Guide

## Completed

1. ✅ Created `NoTranslate` component
2. ✅ Created `useWeglot` hook
3. ✅ Created `weglot-config.ts`
4. ✅ Created `weglot-ugc.css`
5. ✅ Added CSS import to `main.tsx`

## UGC Fields to Exclude

### Messages (MessagesPage.tsx)
- `message.text` or `message.content` - chat messages
- `message.file_name` - attachment names

### Proposals (ProposalsPage.tsx, Create.tsx)
- `proposal.description` - proposal text
- `proposal.cover_letter` - cover letter
- `proposalOption.name` - option names
- `proposalOption.description` - option descriptions

### Orders (MarketPage.tsx, OrderDetailPage.tsx, OrderCreatePage.tsx, OrderEditPage.tsx)
- `order.title` - order title
- `order.description` - order description
- `order.requirements` - requirements text

### Tasks (MarketPage.tsx, TaskDetailPage.tsx, TaskCreatePage.tsx, TaskEditPage.tsx)
- `task.title` - task title
- `task.description` - task description
- `task.features` - feature list

### Profiles (ProfilePage.tsx, PublicProfile.tsx, ProfileCompletionPage.tsx)
- `profile.name` - user name
- `profile.bio` - user bio
- `profile.about` - about text
- `profile.headline` - headline
- `profile.skills` - skills array
- `profile.specialty` - specialty
- `profile.location` - location

### Reviews (ReviewInChat.tsx, ProfilePage.tsx, PublicProfile.tsx)
- `review.text` or `review.comment` - review text
- `review.response` - review response

### Portfolio (PortfolioAdd.tsx, ProfilePage.tsx)
- `portfolio.title` - project title
- `portfolio.description` - project description

### Deals (MyDealsPage.tsx, DealProgressPanel.tsx)
- `deal.title` - deal title
- `deal.description` - deal description
- `deal.notes` - notes

### Disputes/Reports
- `dispute.description` - dispute description
- `report.reason` - report reason

### Wallet (WalletPage.tsx)
- `transaction.description` - transaction description

## Implementation Pattern

Use one of these approaches:

### 1. Component Wrapper (Recommended for blocks)
```tsx
import { NoTranslate } from '@/components/NoTranslate';

<NoTranslate>
  <p>{message.text}</p>
</NoTranslate>
```

### 2. Inline Attribute (Recommended for inline text)
```tsx
<span data-wg-notranslate>{user.name}</span>
<div className="wg-notranslate">{order.description}</div>
```

### 3. CSS Class (For existing elements)
```tsx
<div className="chat-message wg-notranslate">
  {message.text}
</div>
```

## Quick Reference

### DO translate:
- Static UI labels
- Button text
- Navigation items
- Tooltips
- Error messages (system)
- Form labels
- Placeholder text

### DON'T translate:
- User names
- User messages
- Order/task titles and descriptions
- Proposal text
- Reviews
- Profile bios
- Portfolio descriptions
- Transaction descriptions
- Any text from Supabase database

## Next Steps

Apply `data-wg-notranslate` or `<NoTranslate>` to all UGC fields in:
- MessagesPage.tsx (messages, files)
- ProposalsPage.tsx (proposals, options)
- MarketPage.tsx (orders, tasks)
- OrderDetailPage.tsx (order details)
- TaskDetailPage.tsx (task details)
- ProfilePage.tsx (bio, about, skills)
- PublicProfile.tsx (profile info)
- And all other pages with UGC
