# Tool API Contracts

All tool endpoints are `POST` with `application/json`. They respond `200` with a Vapi-shaped JSON envelope:

```json
{ "results": [{ "toolCallId": "<id from request>", "result": { ... } }] }
```

Base URL during local dev: `http://localhost:3000`
Base URL in Railway: `https://<railway-domain>`

---

## `POST /api/tools/get-patient-context`

**Purpose:** "Fat" tool. Called once at the start of the call to fetch everything the agent needs: patient identity, active prescription, item-level stock availability, suggested time slots, and copay.

### Request (Vapi tool-call envelope)

```json
{
  "message": {
    "toolCalls": [{
      "id": "vapi-tool-call-id",
      "function": {
        "name": "get_patient_context",
        "arguments": { "phone_e164": "+573001112233" }
      }
    }]
  }
}
```

### Response (success)

```json
{
  "results": [{
    "toolCallId": "vapi-tool-call-id",
    "result": {
      "patient": {
        "id": "uuid",
        "full_name": "Luz Marina Patiño",
        "first_name": "Luz Marina",
        "honorific": "Doña"
      },
      "prescription": {
        "id": "uuid",
        "items": [
          { "name": "Losartán 50mg", "presentation": "Caja x 30 tabletas", "qty": 1, "available": true, "reorder_eta_days": 5 },
          { "name": "Atorvastatina 20mg", "presentation": "Caja x 30 tabletas", "qty": 1, "available": false, "reorder_eta_days": 4 }
        ],
        "all_available": false,
        "available_count": 1,
        "pending_count": 1
      },
      "suggested_slots": [
        "2026-05-24T09:00:00-05:00",
        "2026-05-24T10:30:00-05:00",
        "2026-05-24T14:00:00-05:00"
      ],
      "default_copay_cop": 5800
    }
  }]
}
```

### Response (error — patient not found)

```json
{
  "results": [{
    "toolCallId": "vapi-tool-call-id",
    "result": { "error": "patient_not_found" }
  }]
}
```

---

## `POST /api/tools/verify-cc`

**Purpose:** Validate the last 4 digits of the patient's cédula before revealing clinical info.

### Request

```json
{
  "message": {
    "toolCalls": [{
      "id": "vapi-tool-call-id",
      "function": {
        "name": "verify_cc",
        "arguments": {
          "patient_id": "uuid",
          "last_4_cc": "4729"
        }
      }
    }]
  }
}
```

### Response

```json
{
  "results": [{
    "toolCallId": "vapi-tool-call-id",
    "result": { "valid": true }
  }]
}
```

`valid` is `false` when the digits don't match or the patient isn't found.

---

## `POST /api/tools/schedule-appointment`

**Purpose:** Insert the appointment row. If items are pending due to partial stock, include `delivery_for_pending=true` and a `delivery_date`.

### Request

```json
{
  "message": {
    "toolCalls": [{
      "id": "vapi-tool-call-id",
      "function": {
        "name": "schedule_appointment",
        "arguments": {
          "prescription_id": "uuid",
          "slot_start": "2026-05-24T09:00:00-05:00",
          "copay_cents": 580000,
          "delivery_for_pending": true,
          "delivery_date": "2026-05-28"
        }
      }
    }]
  }
}
```

### Response

```json
{
  "results": [{
    "toolCallId": "vapi-tool-call-id",
    "result": {
      "appointment_id": "uuid",
      "slot_start": "2026-05-24T09:00:00-05:00",
      "slot_end": "2026-05-24T09:15:00-05:00",
      "confirmation_message": "Listo. Su turno es mañana a las 09:00."
    }
  }]
}
```

`slot_end` is always `slot_start + 15 minutes`.

---

## `POST /api/calls/start`

**Internal endpoint called by the dashboard when the operator clicks "Llamar". Not called by Vapi.**

### Request

```json
{ "patient_id": "uuid" }
```

### Response

```json
{ "call_id": "vapi-call-id", "status": "queued" }
```

The backend creates a record in `call_logs` and tells Vapi to dial the patient's `phone_e164`.

---

## `POST /api/vapi/webhook`

**Purpose:** Receive Vapi server events for call lifecycle. Only `end-of-call-report` is processed in the demo scope.

### Event of interest

```json
{
  "message": {
    "type": "end-of-call-report",
    "call": { "id": "vapi-call-id" },
    "endedReason": "customer-ended-call"
  }
}
```

### Response

```json
{ "ok": true }
```

Side effect: updates `call_logs.outcome` and `call_logs.ended_at` for the matching `vapi_call_id`.

---

## Notes for Wilson (Voice stream)

- Configure each function tool in Vapi pointing to the corresponding endpoint above. The function `name` field in the Vapi tool definition must match: `get_patient_context`, `verify_cc`, `schedule_appointment`.
- The Server URL on the assistant should be `https://<railway-domain>/api/vapi/webhook` for lifecycle events.
- Vapi will wrap your function args inside `message.toolCalls[i].function.arguments`. The backend unwraps this automatically.
- During local testing, you can point Vapi to an ngrok tunnel pointing at `http://localhost:3000` until Railway is live.
