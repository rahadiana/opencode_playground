# Contoh Inter-Agent Communication

Demo inter-agent communication menggunakan opencode agentic tools.

## 📋 Daftar Tools untuk Inter-Agent Communication

| Tool | Fungsi |
|------|--------|
| `agentic_message` | Kirim/terima pesan antar agent roles |
| `agentic_delegate` | Delegasi tugas ke specialist agent |
| `agentic_pipeline` | Chain workflow PM→Architect→Developer→QA |
| `agentic_message inbox` | Cek pesan masuk |
| `agentic_message conversation` | Lihat thread percakapan |

## 📨 Demo 1: Basic Messaging

**Pattern: Agent → Agent via `agentic_message`**

```javascript
// Kirim pesan ke developer
agentic_message({
  action: "send",
  to: "developer",
  type: "result",
  message: "Halo! Tolong buat fitur X"
})

// Cek inbox
agentic_message({ action: "inbox" })

// Lihat thread percakapan
agentic_message({
  action: "conversation",
  taskId: "task-123"
})
```

**Message Types:** `result`, `review_request`, `review_response`, `clarification`, `approval`, `revision`

## 🔄 Demo 2: Delegasi + Review Flow

**Pattern: Delegate → Implement → Request Review → Approve/Revision**

```
PM ──delegate──▶ Developer ──review_request──▶ QA ──review_response──▶ Developer
```

## 🏗️ Demo 3: Pipeline Workflow

**Pattern: PM → Architect → Developer → QA**

```
┌────┐     ┌──────────┐     ┌───────────┐     ┌──┐
│ PM │────▶│ Architect │────▶│ Developer │────▶│QA│
└────┘     └──────────┘     └───────────┘     └──┘
   │            │                │              │
   │ reqs       │ design         │ code         │ review
   ▼            ▼                ▼              ▼
  User Stories  Interfaces     Implementation  Edge Cases
```

### Stage Details:
1. **PM** → Kirim requirements & acceptance criteria
2. **Architect** → Kirim architecture design & interface contracts
3. **Developer** → Klarifikasi, implement, kirim review request
4. **QA** → Review, kasih feedback (approve/revision)

## 💡 Tips

1. Gunakan `taskId` yang sama untuk mengelompokkan pesan dalam satu thread
2. `review_request` + `review_response` untuk workflow review
3. `clarification` untuk tanya jawab antar role
4. Pipeline otomatis menambahkan cross-validation antar stage
