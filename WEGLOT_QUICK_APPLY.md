# Quick Apply Guide: Exclude UGC from Weglot Translation

## Setup Complete ✅

1. ✅ `NoTranslate` component created
2. ✅ `weglot-ugc.css` created and imported
3. ✅ CSS classes available: `.wg-notranslate`, `[data-wg-notranslate]`

## Apply to Your Files

### Step 1: Import NoTranslate (if using component approach)
```tsx
import { NoTranslate } from '@/components/NoTranslate';
```

### Step 2: Wrap or Mark UGC

Choose the approach that fits your code:

#### Approach A: data attribute (simplest, inline)
```tsx
// Before:
<div>{message.text}</div>

// After:
<div data-wg-notranslate>{message.text}</div>
```

#### Approach B: className (for existing divs/spans)
```tsx
// Before:
<p className="text-gray-600">{order.description}</p>

// After:
<p className="text-gray-600 wg-notranslate">{order.description}</p>
```

#### Approach C: NoTranslate component (for complex blocks)
```tsx
// Before:
<div className="chat-message">
  <p>{message.sender}: {message.text}</p>
</div>

// After:
<NoTranslate>
  <div className="chat-message">
    <p data-wg-notranslate>{message.sender}</p>: <span data-wg-notranslate>{message.text}</span>
  </div>
</NoTranslate>
```

## Example: MessagesPage.tsx

### Find all instances of message text:
```bash
grep -n "message\.text\|msg\.content" src/pages/MessagesPage.tsx
```

### Apply changes:
```tsx
// Line ~1631: Message bubble
<div data-wg-notranslate>{msg.content || msg.text}</div>

// Line ~1686: Translated message display
<span data-wg-notranslate>
  {translateChat ? (translatedMessages[msg.id] || msg.content || msg.text) : (msg.content || msg.text)}
</span>
```

## Example: ProposalsPage.tsx

```tsx
// Proposal description
<p className="text-gray-600 wg-notranslate">{proposal.description}</p>

// Proposal option
<div data-wg-notranslate>{option.name}</div>
<p data-wg-notranslate>{option.description}</p>
```

## Example: MarketPage.tsx

```tsx
// Order card
<h3 className="font-semibold wg-notranslate">{order.title}</h3>
<p className="text-gray-600 wg-notranslate">{order.description}</p>

// Task card
<h3 className="font-semibold wg-notranslate">{task.title}</h3>
<p className="text-sm wg-notranslate">{task.description}</p>
```

## Example: ProfilePage.tsx

```tsx
// Profile bio
<div className="profile-bio wg-notranslate">{profile.bio}</div>

// Profile name
<h1 className="wg-notranslate">{profile.name}</h1>

// Skills (array)
{profile.skills.map(skill => (
  <span key={skill} className="wg-notranslate">{skill}</span>
))}
```

## Search & Replace Commands

Use these regex patterns to find UGC quickly:

```bash
# Find message text
rg "message\.text|msg\.text|message\.content|msg\.content" src/

# Find order/task titles and descriptions
rg "order\.title|order\.description|task\.title|task\.description" src/

# Find profile fields
rg "profile\.bio|profile\.name|profile\.about|user\.name" src/

# Find proposal text
rg "proposal\.description|proposal\.cover_letter" src/

# Find review text
rg "review\.text|review\.comment" src/
```

## Test Your Changes

1. Check that static UI text is still translated
2. Check that user-generated content is NOT translated
3. Verify Weglot language switcher works
4. Test with different languages

## Complete File List for UGC

Priority files (apply first):
1. `src/pages/MessagesPage.tsx` - chat messages
2. `src/pages/ProposalsPage.tsx` - proposals
3. `src/pages/MarketPage.tsx` - orders and tasks listing
4. `src/pages/OrderDetailPage.tsx` - order details
5. `src/pages/TaskDetailPage.tsx` - task details
6. `src/pages/ProfilePage.tsx` - user profile
7. `src/pages/users/PublicProfile.tsx` - public profile
8. `src/components/ReviewInChat.tsx` - reviews
9. `src/pages/WalletPage.tsx` - transaction descriptions
10. `src/pages/MyDealsPage.tsx` - deal information

## Pattern Summary

```tsx
// User names
<span data-wg-notranslate>{user.name}</span>

// User text content
<div className="wg-notranslate">{content}</div>

// Lists of UGC
{items.map(item => (
  <div key={item.id} data-wg-notranslate>{item.text}</div>
))}

// Mixed content (translate labels, not values)
<div>
  <span>Автор:</span> <span data-wg-notranslate>{author.name}</span>
</div>
```

## Done!

After applying changes, run:
```bash
npm run build
```

All UGC will be excluded from Weglot translation, saving your word limit.
