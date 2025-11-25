# What is WorkEventRouter?

## TL;DR - The Simple Answer

**`WorkEventRouter` is like a URL shortener or forwarding service for your events.** 

When you save an event:
1. ✅ Your actual event data goes into `WorkEvent` (the real data)
2. ✅ A router entry is created in `WorkEventRouter` (the navigation ID)
3. ✅ URLs use the **router ID**, not the event ID directly

**Why?** Because the same routing system works for events, campaigns, trainings, etc. The router is the "front door" that points to the specific data.

---

## The Real-World Analogy

Think of it like **addresses**:

- **WorkEvent** = Your actual house (123 Main St) - contains all your stuff
- **WorkEventRouter** = A mailbox at a post office (PO Box 456) - the public address people use

When someone visits `/mywork/context/clxyz123`, they're using the **router ID** (`clxyz123`), not the event ID directly. The router says "oh, this is an 'event' type, go fetch event ID `evt789`" and returns the full event data.

---

## Architecture: Why This Pattern?

Your app has **multiple context types**:
- Events (`WorkEvent`)
- Campaigns (`WorkContextCampaign`)
- Trainings (`WorkContextTraining`)
- Impact Events (`WorkContextImpactEvent`)
- etc.

Instead of creating separate routing systems for each, you use **one router** that works for all:

```
WorkEventRouter
├── type: "event" → points to WorkEvent
├── type: "campaign" → points to WorkContextCampaign
├── type: "training" → points to WorkContextTraining
└── etc.
```

**Benefits:**
1. ✅ **Unified URLs** - `/mywork/context/[routerId]` works for all types
2. ✅ **Shared relations** - WorkSupport and WorkOutput link to routers, not specific types
3. ✅ **Type safety** - The router tells you what type it is, then you fetch the right data

---

## The Data Flow

### When You Create an Event:

```typescript
// 1. Create the actual event data
const workEvent = await prisma.workEvent.create({
  data: {
    title: "Holiday Open House",
    eventDate: ...,
    // ... all event fields
  }
})

// 2. Create the router entry (this is what gets used in URLs)
const workEventRouter = await prisma.workEventRouter.create({
  data: {
    type: "event",              // ← Tells system this is an event
    eventRefId: workEvent.id,    // ← Points to the real event
    companyId: ...,
    originatorId: ...,
  }
})

// 3. Return router ID for navigation
return { eventId: workEventRouter.id }  // ← Use THIS in URLs!
```

### When Someone Visits `/mywork/context/clxyz123`:

```typescript
// 1. Get the router
const router = await prisma.workEventRouter.findFirst({
  where: { id: "clxyz123" }
})
// router = { type: "event", eventRefId: "evt789", ... }

// 2. Router says "this is an event" → fetch the real event
const event = await prisma.workEvent.findUnique({
  where: { id: router.eventRefId }  // "evt789"
})

// 3. Return enriched data
return {
  ...router,
  typedData: event,  // ← The actual event data
  title: event.title
}
```

---

## Schema Structure

```prisma
model WorkEventRouter {
  id        String      @id @default(cuid())  // ← This is what you use in URLs!
  createdAt DateTime    @default(now())
  type      ContextType // ← "event", "campaign", "training", etc.
  eventRefId String     // ← Points to the actual WorkEvent.id

  companyId    String   // Multi-tenant security
  originatorId String   // Who created it

  outputs  WorkOutput[]   // ← WorkOutputs link here
  supports WorkSupport[]  // ← WorkSupports link here

  @@index([type, eventRefId])
}
```

---

## Important Points

1. **URLs use router IDs, not event IDs**
   - ✅ `/mywork/context/clxyz123` (router ID)
   - ❌ `/mywork/context/evt789` (event ID) - won't work directly

2. **Router ID = What you save**
   - When you create an event, save the `workEventRouter.id`
   - Use that ID in all navigation/links

3. **Router points to real data**
   - Router is just a pointer/address
   - The actual event lives in `WorkEvent` table

4. **This pattern works for ALL context types**
   - Events, campaigns, trainings all use the same router system
   - Makes navigation and relations consistent

---

## Real Example from Your Code

**After saving an event:**
```typescript
// app/api/ingest/event/save/route.ts
return NextResponse.json({
  success: true,
  eventId: result.workEventRouter.id,  // ← Router ID!
  itemCount: result.eventItems.length,
})
```

**Frontend redirects using router ID:**
```typescript
// components/events/EventReviewScreen.tsx
router.push(`/mywork/context/${response.data.eventId}/success`)
//                                     ↑ This is the router ID
```

**Success page fetches using router ID:**
```typescript
// app/mywork/context/[contextId]/success/page.tsx
const result = await getWorkContext(contextId, clientWorkMeId)
//                                  ↑ Router ID from URL
// result.workContext.typedData = the actual WorkEvent
```

---

## Summary

**WorkEventRouter is the navigation/routing layer that:**
- Provides a unified way to reference different context types
- Stores metadata (company, owner) separate from typed data
- Enables relations (WorkSupport, WorkOutput) without coupling to specific types
- Acts as the "public ID" used in URLs and navigation

**When you saved your event, it created:**
1. ✅ The actual event (`WorkEvent`)
2. ✅ The router entry (`WorkEventRouter`) ← **This is what URLs use**
3. ✅ The router ID is what gets saved/returned

So yes, it saved! The router is just the "address" pointing to your real event data. 🎉

