# Security Specifications & Data Invariants - Barber Shop AI

This document establishes the official security specifications, invariants, and authorization requirements for Firestore collection access in Barber Shop AI.

## 1. Core Data Invariants & Authorization Rules

### Users (`/users/{userId}`)
*   **Invariants**: A user record must map 1:1 to their Firebase Authentication UID.
*   **Auth**:
    *   Read: Must be signed in.
    *   Create: Must be signed in and `request.auth.uid == userId`.
    *   Update: Must be signed in and `request.auth.uid == userId`. To prevent Privilege Escalation, modifying the user's `role` or promotion to admin is blocked client-side.
    *   Delete: Denied for standard users; only allowed for `platformAdmin`.

### Shops (`/shops/{shopId}`)
*   **Invariants**: The `shopId` maps 1:1 to the owner's Firebase Authentication UID.
*   **Auth**:
    *   Read: Publicly readable for scheduling and exploring.
    *   Create/Update/Delete: Restricted to the authenticated shop owner (`request.auth.uid == shopId`) or `platformAdmin`. Modification of the immutable `id` is forbidden during update.

### Bookings (`/bookings/{bookingId}`)
*   **Invariants**: Bookings must contain valid details for appointments.
*   **Auth**:
    *   Read/List: Signed in users can retrieve/verify bookings to check scheduling availability.
    *   Create: Must be signed in and matching the client ID `request.resource.data.userId == request.auth.uid` or `platformAdmin`.
    *   Update/Delete: Allowed only for the booking owner (`resource.data.userId == request.auth.uid`), the shop owner (`resource.data.shopId == request.auth.uid`), or `platformAdmin`.

### Virtual Mirror Sessions (`/mirror_sessions/{sessionId}`)
*   **Invariants**: Holds sensitive AI analysis results and user photos (PII).
*   **Auth**:
    *   Read/Write: **Strict isolation**. Only the user who owns the session can read or write (`request.auth.uid == sessionId`).

### Blog Posts (`/blogPosts/{postId}`)
*   **Invariants**: Blog content for shops.
*   **Auth**:
    *   Read: Publicly readable for SEO support.
    *   Create: Allowed only for shop owners (`request.resource.data.shopId == request.auth.uid`) or `platformAdmin`.
    *   Update/Delete: Allowed only for the blog author/shop owner or `platformAdmin`.

---

## 2. "Dirty Dozen" Payloads Blocked
The following payloads are explicitly validated and blocked by our Zero-Trust rules:

1.  **Privilege Escalation**: Modifying role to `platformAdmin` inside `/users/{userId}` updates.
2.  **Cross-Tenant Theft**: Trying to read or write `/mirror_sessions/{otherUserId}` where `otherUserId != request.auth.uid`.
3.  **Booking Spoofing**: Creating `/bookings/{bookingId}` with a `userId` different from `request.auth.uid`.
4.  **Booking Hijacking / Tampering**: Editing another user's booking as a standard customer.
5.  **Unauthenticated Write to Shops**: Writing directly to `/shops/{shopId}` without authentication.
6.  **Shop Identity Hijacking**: Attempting to claim ownership of another user's shop document `/shops/{otherShopId}`.
7.  **Unauthenticated Blog Posting**: Posting blog articles to `/blogPosts/{postId}` as an unauthenticated or generic user.
8.  **Direct Read of Security Logs**: Attempting to read `/securityLogs/{logId}` on the client side (Write-only for system audit trail).
9.  **Cross-Shop Blog Deletion**: Shop owner A trying to delete blog posts belonging to Shop owner B.
10. **GDPR Consent Manipulation**: Standard users editing GDPR consent logs once submitted.
11. **Shop ID Mutation**: Altering the `id` field inside a `/shops/{shopId}` document on update.
12. **Unauthorized Support Ticket Access**: Regular users trying to inspect or list other users' support tickets.
