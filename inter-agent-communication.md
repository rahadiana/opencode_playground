# Inter-Agent Communication Demo

Demo komunikasi antar agent menggunakan plugin `inter-agent-demo.ts` untuk opencode.

## 📦 Instalasi

Plugin sudah terdaftar di `opencode.json`:

```json
{
  "plugin": [
    "./.opencode/plugins/event-explorer.ts",
    "./.opencode/plugins/inter-agent-demo.ts"
  ]
}
```

## 🤖 Agent Roles

| Role | Emoji | Deskripsi |
|------|-------|-----------|
| `pm` | 👔 | Project Manager — memberi requirements |
| `architect` | 🏗️ | Architect — desain arsitektur |
| `developer` | 👨‍💻 | Developer — implementasi |
| `qa` | 🧪 | QA Engineer — review & testing |
| `devops` | ⚙️ | DevOps — deployment & infrastructure |

## 📨 Message Types

| Type | Emoji | Makna |
|------|-------|-------|
| `result` | ✅ | Hasil kerja / informasi |
| `review_request` | 🔍 | Minta review |
| `review_response` | 📝 | Feedback review |
| `clarification` | ❓ | Minta klarifikasi |
| `approval` | 👍 | Menyetujui |
| `revision` | 🔄 | Minta revisi |

---

## 🔧 Tool Reference

### 1. `inter_agent_demo_help`

Menampilkan bantuan semua tool yang tersedia.

**Parameter:** (none)

**Input:**
```
inter_agent_demo_help
```

**Output:**
```
╔════════════════════════════════════════════════╗
║  🤖  INTER-AGENT COMMUNICATION DEMO           ║
╚════════════════════════════════════════════════╝

📋 Daftar tools:
...
```

---

### 2. `inter_agent_send`

Mengirim pesan dari satu agent ke agent lain.

**Parameter:**

| Parameter | Wajib | Nilai | Deskripsi |
|-----------|-------|-------|-----------|
| `from` | ✅ | `pm`, `architect`, `developer`, `qa`, `devops` | Pengirim |
| `to` | ✅ | `pm`, `architect`, `developer`, `qa`, `devops` | Penerima |
| `type` | ✅ | `result`, `review_request`, `review_response`, `clarification`, `approval`, `revision` | Tipe pesan |
| `message` | ✅ | string | Isi pesan |
| `taskId` | ❌ | string | ID task (auto-generated jika kosong) |

**Input:**
```
inter_agent_send from=pm to=developer type=result \
  message="Buat fitur login page" taskId=auth-1
```

**Output:**
```
╔══════════════════════════════════════════╗
║  📨  PESAN TERKIRIM                       ║
╚══════════════════════════════════════════╝

  👔 Project Manager → 👨‍💻 Developer
  ✅ Type: result
  🆔 Task  : auth-1
  💬 Pesan : "Buat fitur login page"

  📁 Log   : .opencode/inter-agent-demo.log
```

**Input (reply dari developer):**
```
inter_agent_send from=developer to=pm type=clarification \
  message="Apakah pakai OAuth atau JWT biasa?" taskId=auth-1
```

**Output:**
```
╔══════════════════════════════════════════╗
║  📨  PESAN TERKIRIM                       ║
╚══════════════════════════════════════════╝

  👨‍💻 Developer → 👔 Project Manager
  ❓ Type: clarification
  🆔 Task  : auth-1
  💬 Pesan : "Apakah pakai OAuth atau JWT biasa?"

  📁 Log   : .opencode/inter-agent-demo.log
```

---

### 3. `inter_agent_inbox`

Melihat pesan yang masuk ke inbox.

**Parameter:**

| Parameter | Wajib | Nilai | Deskripsi |
|-----------|-------|-------|-----------|
| `role` | ❌ | `pm`, `architect`, `developer`, `qa`, `devops`, `all` | Filter role (default: `all`) |
| `status` | ❌ | `all`, `unread` | Filter status baca (default: `all`) |

**Input — semua pesan:**
```
inter_agent_inbox status=all
```

**Output:**
```
╔══════════════════════════════════════════╗
║  📨  INBOX SEMUA AGENT                    ║
╚══════════════════════════════════════════╝

  🆔 Task: auth-1
    👔 pm ✅ [result] 🆕
      "Buat fitur login page"
      ⏱ 2026-06-24T12:00:00.000Z
    👨‍💻 developer ❓ [clarification] 🆕
      "Apakah pakai OAuth atau JWT biasa?"
      ⏱ 2026-06-24T12:01:00.000Z

📁 .opencode/inbox.json
```

**Input — filter unread untuk developer:**
```
inter_agent_inbox role=developer status=unread
```

**Output:**
```
╔══════════════════════════════════════════╗
║  📨  INBOX DEVELOPER (UNREAD)             ║
╚══════════════════════════════════════════╝

  🆔 Task: auth-1
    👔 pm ✅ [result] 🆕
      "Buat fitur login page"
      ⏱ 2026-06-24T12:00:00.000Z

📁 .opencode/inbox.json
```

**Input — inbox kosong:**
```
inter_agent_inbox role=devops
```

**Output:**
```
📭 Inbox kosong.
```

---

### 4. `inter_agent_conversation`

Melihat thread percakapan berdasarkan taskId.

**Parameter:**

| Parameter | Wajib | Nilai | Deskripsi |
|-----------|-------|-------|-----------|
| `taskId` | ✅ | string | ID task untuk melihat thread |

**Input:**
```
inter_agent_conversation taskId=auth-1
```

**Output:**
```
╔══════════════════════════════════════════╗
║  💬  PERCAKAPAN: auth-1                   ║
╚══════════════════════════════════════════╝

  ────────────────────────────────────────
  [1] 👔 Project Manager → 👨‍💻 Developer
  ✅ RESULT
  💬 "Buat fitur login page"
  ⏱ 2026-06-24T12:00:00.000Z
  ────────────────────────────────────────
  [2] 👨‍💻 Developer → 👔 Project Manager
  ❓ CLARIFICATION
  💬 "Apakah pakai OAuth atau JWT biasa?"
  ⏱ 2026-06-24T12:01:00.000Z
  ────────────────────────────────────────

📁 .opencode/inter-agent-demo.log
```

**Input — taskId tidak ditemukan:**
```
inter_agent_conversation taskId=unknown-123
```

**Output:**
```
📭 Tidak ada percakapan untuk task "unknown-123".
```

---

### 5. `inter_agent_pipeline`

Menjalankan pipeline multi-agent yang mensimulasikan alur kerja dari requirements sampai review.

**Parameter:**

| Parameter | Wajib | Nilai | Deskripsi |
|-----------|-------|-------|-----------|
| `template` | ❌ | `feature`, `bugfix`, `review` | Template pipeline (default: `feature`) |
| `featureName` | ❌ | string | Nama fitur/bug (default: `fitur-demo`) |

**Template pipeline:**

| Template | Alur | Deskripsi |
|----------|------|-----------|
| `feature` | 👔 PM → 🏗️ Architect → 👨‍💻 Developer → 🧪 QA | Full feature development |
| `bugfix` | 👔 PM → 👨‍💻 Developer → 🧪 QA | Quick bugfix |
| `review` | 👨‍💻 Developer → 🧪 QA | Code review only |

**Input — feature pipeline:**
```
inter_agent_pipeline template=feature featureName="Login Page"
```

**Output:**
```
╔════════════════════════════════════════════════════╗
║  🏗️  PIPELINE: FEATURE                              ║
╚════════════════════════════════════════════════════╝

  📋 Template : PM → Architect → Developer → QA (full feature pipeline)
  🆔 Task ID  : pipeline-feature-1719216000000
  🔧 Fitur    : Login Page

  ──────────────────────────────────────────────────
  📊 ALUR PIPELINE:
  ──────────────────────────────────────────────────

  1. 👔 PM
     💬 "Buat desain arsitektur untuk fitur: Login Page"
     📨 → 🏗️ Architect
     ↓

  2. 🏗️ Architect
     💬 "Desain selesai. Implementasi: buat komponen baru + unit test untuk Login Page"
     📨 → 👨‍💻 Developer
     ↓

  3. 👨‍💻 Developer
     🔍 "Implementasi Login Page selesai. Mohon direview."
     📨 → 🧪 QA
     ↓

  4. 🧪 QA
     👍 "Review selesai. Login Page siap di-deploy."
     📨 → 👨‍💻 Developer

  ──────────────────────────────────────────────────

  ✅ Pipeline selesai! Cek pesan dengan:
     inter_agent_inbox role=all
     inter_agent_conversation taskId=pipeline-feature-1719216000000

📁 .opencode/inter-agent-demo.log
```

**Input — bugfix pipeline:**
```
inter_agent_pipeline template=bugfix featureName="Null pointer di halaman login"
```

**Output:**
```
╔════════════════════════════════════════════════════╗
║  🏗️  PIPELINE: BUGFIX                               ║
╚════════════════════════════════════════════════════╝

  📋 Template : PM → Developer → QA (quick bugfix pipeline)
  🆔 Task ID  : pipeline-bugfix-1719216000000
  🔧 Fitur    : Null pointer di halaman login
  ...
```

**Input — review pipeline:**
```
inter_agent_pipeline template=review featureName="Refactor modul auth"
```

---

### 6. `inter_agent_board`

Menampilkan papan status semua agent dan task yang sedang berjalan.

**Parameter:** (none)

**Input:**
```
inter_agent_board
```

**Output:**
```
╔══════════════════════════════════════════════════════════╗
║  📊  AGENT STATUS BOARD                                  ║
╚══════════════════════════════════════════════════════════╝

  👔 Project Manager        📤  2  📥  0  ✅
  🏗️ Architect              📤  0  📥  1  ✅
  👨‍💻 Developer             📤  1  📥  3  🆕 1 unread
  🧪 QA Engineer            📤  0  📥  0  ✅
  ⚙️ DevOps                 📤  0  📥  0  ✅

  ──────────────────────────────────────────────────
  🆔 Total task: 2
  💬 Total pesan: 7

  ✅ pipeline-feature-1719216000000           4 msgs
  🔄 auth-1                                  3 msgs

📁 .opencode/inter-agent-demo.log
```

---

## 💡 Skenario Lengkap: End-to-End Demo

### Skenario: Fitur Login Page

**Step 1 — PM kirim requirements ke Architect:**
```
inter_agent_send from=pm to=architect type=result \
  message="Buat desain arsitektur untuk fitur login" taskId=login-v2
```

**Step 2 — Architect selesai desain, kirim ke Developer:**
```
inter_agent_send from=architect to=developer type=result \
  message="Desain selesai. API: POST /auth/login, DB: users table, Component: LoginForm" \
  taskId=login-v2
```

**Step 3 — Developer minta klarifikasi:**
```
inter_agent_send from=developer to=architect type=clarification \
  message="Apakah pakai refresh token?" taskId=login-v2
```

**Step 4 — Architect jawab:**
```
inter_agent_send from=architect to=developer type=result \
  message="Iya, pakai refresh token dengan expiry 7 hari" taskId=login-v2
```

**Step 5 — Developer selesai, minta review ke QA:**
```
inter_agent_send from=developer to=qa type=review_request \
  message="Implementasi login selesai. Mohon direview." taskId=login-v2
```

**Step 6 — QA kasih feedback:**
```
inter_agent_send from=qa to=developer type=review_response \
  message="Tambahkan validasi email, batasi percobaan login 5x" taskId=login-v2
```

**Step 7 — Developer fix, kirim ulang:**
```
inter_agent_send from=developer to=qa type=result \
  message="Sudah ditambahkan validasi dan rate limiting" taskId=login-v2
```

**Step 8 — QA approve:**
```
inter_agent_send from=qa to=developer type=approval \
  message="LGTM! Approved ✅" taskId=login-v2
```

**Step 9 — Cek thread percakapan:**
```
inter_agent_conversation taskId=login-v2
```

**Step 10 — Cek status board:**
```
inter_agent_board
```

Atau langsung pakai pipeline:
```
inter_agent_pipeline template=feature featureName="Login Page v2"
```

---

## 📁 File Log

| File | Deskripsi |
|------|-----------|
| `.opencode/inter-agent-demo.log` | Log semua aktivitas plugin |
| `.opencode/inbox.json` | Database pesan (JSON) |
