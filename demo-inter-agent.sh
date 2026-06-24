#!/bin/bash
# ============================================================
# DEMO INTER-AGENT COMMUNICATION
# Mensimulasikan komunikasi antar agent tanpa agentic tools
# ============================================================

INBOX_FILE=".opencode/inbox.json"
LOG_FILE=".opencode/inter-agent-demo.log"

echo ""
echo "╔═══════════════════════════════════════════════════════╗"
echo "║   🤖  DEMO INTER-AGENT COMMUNICATION                 ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""

# Bersihkan inbox sebelumnya
echo '[]' > "$INBOX_FILE"
echo "" > "$LOG_FILE"

# ============================================================
# Fungsi helper
# ============================================================
send_message() {
  local from="$1" to="$2" type="$3" message="$4" taskId="$5"
  local time=$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")

  # Emoji role
  case "$from" in
    pm)         from_emoji="👔"; from_name="Project Manager" ;;
    architect)  from_emoji="🏗️"; from_name="Architect" ;;
    developer)  from_emoji="👨‍💻"; from_name="Developer" ;;
    qa)         from_emoji="🧪"; from_name="QA Engineer" ;;
    devops)     from_emoji="⚙️"; from_name="DevOps" ;;
  esac
  case "$to" in
    pm)         to_emoji="👔"; to_name="Project Manager" ;;
    architect)  to_emoji="🏗️"; to_name="Architect" ;;
    developer)  to_emoji="👨‍💻"; to_name="Developer" ;;
    qa)         to_emoji="🧪"; to_name="QA Engineer" ;;
    devops)     to_emoji="⚙️"; to_name="DevOps" ;;
  esac

  # Type emoji
  case "$type" in
    result)          type_emoji="✅" ;;
    review_request)  type_emoji="🔍" ;;
    review_response) type_emoji="📝" ;;
    clarification)   type_emoji="❓" ;;
    approval)        type_emoji="👍" ;;
    revision)        type_emoji="🔄" ;;
    *)               type_emoji="📨" ;;
  esac

  # Simpan ke inbox.json
  local entry=$(cat "$INBOX_FILE")
  entry=$(echo "$entry" | python3 -c "
import json, sys
data = json.load(sys.stdin)
data.append({
    'from': '$from',
    'to': '$to',
    'type': '$type',
    'message': '$message',
    'time': '$time',
    'taskId': '$taskId',
    'read': false
})
print(json.dumps(data, indent=2))
" 2>/dev/null || echo '[]')
  echo "$entry" > "$INBOX_FILE"

  # Log ke file
  echo "[$time] $from_emoji $from_name → $to_emoji $to_name [$type]" >> "$LOG_FILE"
  echo "  💬 \"$message\"" >> "$LOG_FILE"
  echo "" >> "$LOG_FILE"

  # Print ke layar
  echo "  $from_emoji $from_name → $to_emoji $to_name"
  echo "  $type_emoji [$type]  🆔 $taskId"
  echo "  💬 \"$message\""
  echo "  ────────────────────────────────────────────"
  echo ""
}

# ============================================================
# DEMO 1: BASIC MESSAGING — Fitur Login Page
# ============================================================
echo "╔═══════════════════════════════════════════════════════╗"
echo "║   📨  DEMO 1: BASIC MESSAGING                        ║"
echo "║   Skenario: Fitur Login Page                         ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""

TASK="login-v2"

echo "  ─── Step 1: PM → Architect (kirim requirements) ───"
send_message "pm" "architect" "result" \
  "Tolong buat desain arsitektur untuk fitur login dengan JWT" "$TASK"

echo "  ─── Step 2: Architect → Developer (desain selesai) ───"
send_message "architect" "developer" "result" \
  "Desain selesai. API: POST /auth/login, POST /auth/refresh. DB: users + refresh_tokens. Component: LoginForm, AuthContext" "$TASK"

echo "  ─── Step 3: Developer → Architect (klarifikasi) ───"
send_message "developer" "architect" "clarification" \
  "Apakah refresh token pakai expiry 7 hari?" "$TASK"

echo "  ─── Step 4: Architect → Developer (jawab) ───"
send_message "architect" "developer" "result" \
  "Benar. Access token 15 menit, refresh token 7 hari. Simpan di httpOnly cookie." "$TASK"

echo "  ─── Step 5: Developer → QA (minta review) ───"
send_message "developer" "qa" "review_request" \
  "Implementasi login selesai. Tolong direview ya." "$TASK"

echo "  ─── Step 6: QA → Developer (feedback) ───"
send_message "qa" "developer" "review_response" \
  "Tambahkan validasi email format, rate limiting 5x percobaan, dan csrf token." "$TASK"

echo "  ─── Step 7: Developer → QA (fix sudah) ───"
send_message "developer" "qa" "result" \
  "Sudah ditambahkan validasi, rate limiting, dan csrf." "$TASK"

echo "  ─── Step 8: QA → Developer (approve) ───"
send_message "qa" "developer" "approval" \
  "LGTM! Semua edge case tercover. Approved ✅" "$TASK"

# ============================================================
# DEMO 2: PIPELINE (via plugin)
# ============================================================
echo ""
echo "╔═══════════════════════════════════════════════════════╗"
echo "║   🏗️  DEMO 2: PIPELINE (FEATURE)                     ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""

PIPE_TASK="pipeline-feature-demo"

echo "  📋 Template: PM → Architect → Developer → QA"
echo "  🔧 Fitur: Dark Mode"
echo ""

send_message "pm" "architect" "result" \
  "Buat desain arsitektur untuk fitur: Dark Mode" "$PIPE_TASK"
send_message "architect" "developer" "result" \
  "Desain selesai. Implementasi: ThemeContext + CSS variables + toggle button + persist ke localStorage" "$PIPE_TASK"
send_message "developer" "qa" "review_request" \
  "Implementasi Dark Mode selesai. Mohon direview." "$PIPE_TASK"
send_message "qa" "developer" "approval" \
  "Review selesai. Dark Mode siap di-deploy. 👍" "$PIPE_TASK"

# ============================================================
# DEMO 3: STATUS BOARD
# ============================================================
echo ""
echo "╔═══════════════════════════════════════════════════════╗"
echo "║   📊  DEMO 3: STATUS BOARD                           ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""

# Baca inbox untuk statistik
MSG_COUNT=$(python3 -c "import json; d=json.load(open('$INBOX_FILE')); print(len(d))" 2>/dev/null || echo "0")
TASK_COUNT=$(python3 -c "import json; d=json.load(open('$INBOX_FILE')); tasks=set(m.get('taskId','') for m in d); print(len(tasks))" 2>/dev/null || echo "0")

echo "  👔 Project Manager        📤  2  📥  1  ✅"
echo "  🏗️ Architect              📤  2  📥  1  ✅"
echo "  👨‍💻 Developer             📤  3  📥  3  ✅"
echo "  🧪 QA Engineer            📤  3  📥  2  ✅"
echo "  ⚙️ DevOps                 📤  0  📥  0  ✅"
echo ""
echo "  ──────────────────────────────────────────────────"
echo "  🆔 Total task : $TASK_COUNT"
echo "  💬 Total pesan: $MSG_COUNT"
echo ""

# ============================================================
# RINGKASAN
# ============================================================
echo ""
echo "╔═══════════════════════════════════════════════════════╗"
echo "║   ✅  DEMO SELESAI                                    ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""
echo "  📁 File hasil:"
echo "     • $INBOX_FILE  — semua pesan (JSON)"
echo "     • $LOG_FILE  — log aktivitas"
echo ""
echo "  ▶️  Cara pakai plugin langsung di opencode:"
echo "     inter_agent_inbox status=all"
echo "     inter_agent_conversation taskId=login-v2"
echo "     inter_agent_board"
echo "     inter_agent_pipeline template=feature featureName=\"Login Page\""
echo ""
