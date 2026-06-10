# Klaviyo Integration Guide

Complete integration for email marketing, flow automation, and event tracking with Klaviyo.

## 🚀 Quick Start

### 1. Get Your Klaviyo API Key

1. **Log in to Klaviyo** → https://www.klaviyo.com/login
2. Go to **Account** → **Settings** → **API Keys**
3. Click **Create API Key** and select **Full Access**
4. Copy the key (starts with `pk_...`)

### 2. Set Up Environment Variables

Create a `.env` file in your project root (copy from `.env.example`):

```bash
VITE_KLAVIYO_API_KEY=pk_your_api_key_here
VITE_API_BASE_URL=http://localhost:3001
SERVER_PORT=3001
NODE_ENV=development
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Development Server

```bash
npm run dev
```

This will start:
- **Frontend**: http://localhost:5173 (Vite)
- **Backend**: http://localhost:3001 (Express + Klaviyo)

### 5. Test the Integration

The **KlaviyoTester** component is ready to use. Add it to your App.tsx:

```tsx
import KlaviyoTester from './components/KlaviyoTester';

// In your component:
<KlaviyoTester isOpen={true} />
```

---

## 📚 API Reference

### Backend Endpoints

All endpoints are available at `http://localhost:3001/api/klaviyo`

#### **List Management**

**GET** `/lists` - Get all lists
```bash
curl http://localhost:3001/api/klaviyo/lists
```

**POST** `/subscribe` - Subscribe user to list
```bash
curl -X POST http://localhost:3001/api/klaviyo/subscribe \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "listId": "XXXXXX",
    "firstName": "John",
    "lastName": "Doe",
    "properties": {"tag": "vip"}
  }'
```

**POST** `/unsubscribe` - Unsubscribe user from list
```bash
curl -X POST http://localhost:3001/api/klaviyo/unsubscribe \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "listId": "XXXXXX"
  }'
```

#### **Flow Triggers**

**GET** `/flows` - Get all flows
```bash
curl http://localhost:3001/api/klaviyo/flows
```

**POST** `/trigger-flow` - Trigger a flow for a user
```bash
curl -X POST http://localhost:3001/api/klaviyo/trigger-flow \
  -H "Content-Type: application/json" \
  -d '{
    "flowId": "XXXXXX",
    "email": "user@example.com",
    "properties": {
      "product_name": "Premium Plan",
      "discount_code": "SAVE20"
    }
  }'
```

#### **Event Tracking**

**POST** `/track-event` - Track a custom event
```bash
curl -X POST http://localhost:3001/api/klaviyo/track-event \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "eventName": "Purchase",
    "properties": {
      "value": 99.99,
      "currency": "USD",
      "product_id": "123"
    }
  }'
```

#### **Profiles**

**GET** `/profile/:email` - Get profile by email
```bash
curl http://localhost:3001/api/klaviyo/profile/user%40example.com
```

**POST** `/profile` - Update profile
```bash
curl -X POST http://localhost:3001/api/klaviyo/profile \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "properties": {
      "customer_tier": "gold",
      "total_purchases": 5
    }
  }'
```

---

## 🎣 Frontend Hook Usage

Use the `useKlaviyo` hook in your React components:

```tsx
import { useKlaviyo } from '../hooks/useKlaviyo';

function MyComponent() {
  const {
    subscribeToList,
    triggerFlow,
    trackEvent,
    getProfile,
    loading,
    error,
  } = useKlaviyo();

  // Subscribe user
  const handleSubscribe = async () => {
    await subscribeToList('user@example.com', 'list_id', {
      firstName: 'John',
      lastName: 'Doe',
    });
  };

  // Trigger flow
  const handleTriggerFlow = async () => {
    await triggerFlow('flow_id', 'user@example.com', {
      product_name: 'Premium',
    });
  };

  // Track event
  const handleTrackEvent = async () => {
    await trackEvent('user@example.com', 'PurchaseComplete', {
      value: 99.99,
    });
  };

  return (
    <div>
      {error && <p className="text-red-600">{error}</p>}
      <button onClick={handleSubscribe} disabled={loading}>
        Subscribe
      </button>
    </div>
  );
}
```

---

## 🛠️ Service Layer

Use the KlaviyoService directly in your backend:

```typescript
import KlaviyoService from './services/klaviyoService.js';

const klaviyo = new KlaviyoService(process.env.VITE_KLAVIYO_API_KEY);

// Get all lists
const lists = await klaviyo.getLists();

// Subscribe
await klaviyo.subscribeToList('user@example.com', 'list_id', {
  firstName: 'John',
});

// Bulk subscribe
await klaviyo.bulkSubscribe([
  { email: 'user1@example.com', firstName: 'John' },
  { email: 'user2@example.com', firstName: 'Jane' },
], 'list_id');

// Track event
await klaviyo.trackEvent('user@example.com', 'Purchase', {
  value: 99.99,
});

// Bulk track events
await klaviyo.bulkTrackEvents([
  { email: 'user1@example.com', eventName: 'Purchase', properties: { value: 99.99 } },
  { email: 'user2@example.com', eventName: 'Signup', properties: {} },
]);

// Trigger flow
await klaviyo.triggerFlow('flow_id', 'user@example.com', {
  custom_prop: 'value',
});

// Get profile
const profile = await klaviyo.getProfileByEmail('user@example.com');

// Update profile
await klaviyo.updateProfile('user@example.com', {
  customer_tier: 'gold',
});
```

---

## 📋 Common Use Cases

### 1. **Welcome Flow on Signup**

```tsx
const handleSignup = async (email: string) => {
  // Subscribe to welcome list
  await subscribeToList(email, 'welcome_list_id', {
    firstName: 'New User',
  });

  // Trigger welcome flow
  await triggerFlow('welcome_flow_id', email, {
    signup_date: new Date().toISOString(),
  });
};
```

### 2. **Track User Events**

```tsx
const handlePurchase = async (email: string, amount: number) => {
  await trackEvent(email, 'Purchase', {
    value: amount,
    currency: 'USD',
    timestamp: new Date().toISOString(),
  });
};
```

### 3. **Update Customer Profile**

```tsx
const handleProfileUpdate = async (email: string, tier: string) => {
  await updateProfile(email, {
    customer_tier: tier,
    last_updated: new Date().toISOString(),
  });
};
```

### 4. **Segment Users**

```tsx
const handleSegmentation = async (emails: string[], segment: string) => {
  for (const email of emails) {
    await updateProfile(email, {
      segment: segment,
      segment_date: new Date().toISOString(),
    });
  }
};
```

---

## 🔐 Security Best Practices

1. **Never expose API key in frontend** ✅ (handled by backend proxy)
2. **Use environment variables** ✅ (`.env` file)
3. **Validate email addresses** ✅ (add validation in hooks)
4. **Rate limit requests** (add middleware if needed)
5. **Log important events** (implement logging)

---

## 🐛 Troubleshooting

### API Key Not Working
- Verify the key in Klaviyo dashboard
- Ensure key has **Full Access** permissions
- Check `.env` file has correct key

### "Cannot find module 'express'"
```bash
npm install
npm run dev
```

### CORS Errors
- Make sure backend is running on port 3001
- Check `VITE_API_BASE_URL` in `.env`

### Flow Not Triggering
- Verify flow ID exists in Klaviyo
- Ensure flow is in "Active" status
- Check email is subscribed to list

---

## 📖 Klaviyo Documentation

- [API Reference](https://developers.klaviyo.com/en/reference/)
- [Flow Triggers](https://help.klaviyo.com/hc/en-us/articles/115005315288)
- [Event Tracking](https://help.klaviyo.com/hc/en-us/articles/115005076103)
- [Lists Management](https://help.klaviyo.com/hc/en-us/articles/360002532531)

---

## 📝 Next Steps

1. ✅ Set up API key
2. ✅ Test with KlaviyoTester component
3. ✅ Create your flows in Klaviyo dashboard
4. ✅ Integrate `useKlaviyo` hook in your app
5. ✅ Deploy with production API key

Ready to build amazing email campaigns! 🚀
