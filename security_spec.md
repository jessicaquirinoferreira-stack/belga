# Belga Móveis - Security Specification & Threat Model

## 1. Data Invariants
1. **Admin Master Access**: Operations affecting global store state (products update, category update, admin configuration, payment registration, debt renegotiation, audit logs) require `isAdmin()`. Admin status is checked via exists(`/databases/$(database)/documents/admins/$(request.auth.uid)`) or authenticated admin email `jessicaq2204@gmail.com`.
2. **Customer Isolation**: Non-admin customers can only read and write their own customer profile, their own orders, their own installments, and their own chat messages.
3. **Public Product/Catalog Access**: Anyone (unauthenticated or authenticated) can read active products, categories, public banners, and public store settings.
4. **Order and Installment Integrity**: Customers may create an order with their own `customerId` and their own valid user identity. Only admins can register payments, update installment statuses (e.g. mark as `Pago`), or change order statuses beyond creation.
5. **Immutable Identity Keys**: Documents cannot have their `customerId`, `orderId`, or `createdAt` tampered with during updates.
6. **Chat Message Integrity**: A user can only send a chat message under their own `senderId`. Customers can only read and write messages in chats where `customerId == request.auth.uid`.

## 2. The Dirty Dozen Payloads (Rejection Matrix)
1. **Payload 1 (Ghost Privilege Escalation)**: User sends `{ "role": "admin" }` to `/users/{userId}` to self-promote. -> **PERMISSION_DENIED**.
2. **Payload 2 (Shadow Admin Insertion)**: Unauthenticated or non-admin attempts to create a document in `/admins/{adminId}`. -> **PERMISSION_DENIED**.
3. **Payload 3 (PII Snoop Attack)**: Customer A attempts to read `/customers/{customerB_id}` or list all customers. -> **PERMISSION_DENIED**.
4. **Payload 4 (Fake Payment Injection)**: Customer attempts to create a document in `/payments/fake_payment` declaring their parcel as paid. -> **PERMISSION_DENIED**.
5. **Payload 5 (Installment Forgery)**: Customer attempts to update `/installments/{installmentId}` setting `status: 'Pago'` and `paidAmount: 2716.80`. -> **PERMISSION_DENIED**.
6. **Payload 6 (Product Price Tamper)**: Customer or unauthenticated attacker sends an update to `/products/{productId}` setting `price: 1.00`. -> **PERMISSION_DENIED**.
7. **Payload 7 (Denial of Wallet Junk ID)**: Request with document ID of 2,000 characters or containing path traversal characters like `../../admin`. -> **PERMISSION_DENIED**.
8. **Payload 8 (Chat Identity Spoof)**: Customer A sends message with `senderId: "customer_B"` and `customerId: "customer_B"`. -> **PERMISSION_DENIED**.
9. **Payload 9 (Order Tampering Post-Creation)**: Customer tries to modify an existing order's `financedAmount` or `subtotal`. -> **PERMISSION_DENIED**.
10. **Payload 10 (Settings Wipeout)**: Non-admin sends delete or update to `/settings/store_config`. -> **PERMISSION_DENIED**.
11. **Payload 11 (Audit Log Destruction)**: Non-admin or attacker attempts to delete from `/activity_logs/{logId}`. -> **PERMISSION_DENIED**.
12. **Payload 12 (Negative Number Injection)**: Payload containing negative product price or negative installment amount. -> **PERMISSION_DENIED**.
