#!/bin/bash
# ============================================================
# PANEL DISKUSI 3 MODEL LLM
# Baca data dari topik-panel.json
# ============================================================

INBOX_FILE=".opencode/demo-panel-inbox.json"
LOG_FILE=".opencode/demo-panel.log"
DATA_FILE="topik-panel.json"
PANEL_ID="panel-$(date +%s)"

echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║   🎙️  PANEL DISKUSI 3 MODEL LLM                         ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# ============================================================
# HELP
# ============================================================
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
  echo "  Panel diskusi 3 model AI dengan kepribadian berbeda."
  echo ""
  echo "  Topik tersedia:"
  python3 -c "
import json
data = json.load(open('$DATA_FILE'))
for t in data:
    print(f'    {t[\"key\"]:25s} {t[\"emoji\"]}  {t[\"topic\"]}')
" 2>/dev/null || echo "  (file data tidak ditemukan)"
  echo ""
  echo "  Contoh: bash demo-panel-ai.sh ai-ganti-programmer"
  echo ""
  exit 0
fi

# ============================================================
# AMBIL TOPIK DARI JSON
# ============================================================
if [ ! -f "$DATA_FILE" ]; then
  echo "❌ File $DATA_FILE tidak ditemukan."
  exit 1
fi

TOPIC_KEY="${1:-ai-ganti-programmer}"

# Validate topic exists
VALID=$(python3 -c "
import json
data = json.load(open('$DATA_FILE'))
keys = [t['key'] for t in data]
print('ok' if '$TOPIC_KEY' in keys else 'notfound')
")
if [ "$VALID" != "ok" ]; then
  echo "❌ Topik '$TOPIC_KEY' tidak dikenal."
  echo "   bash demo-panel-ai.sh --help"
  exit 1
fi

# ============================================================
# MODELS
# ============================================================
cat > /tmp/panel_models.json << 'EOF'
[
  {"id":"deepseek","name":"DeepSeek V4 Flash","emoji":"⚡","style":"Langsung, teknis, no-nonsense"},
  {"id":"big-pickle","name":"Big Pickle","emoji":"🥒","style":"Analitis, struktural, suka data"},
  {"id":"claude","name":"Claude 4 Sonnet","emoji":"🎭","style":"Filosofis, nuanced, perspektif"}
]
EOF

M0_ID=$(    python3 -c "import json; print(json.load(open('/tmp/panel_models.json'))[0]['id'])")
M0_NAME=$(  python3 -c "import json; print(json.load(open('/tmp/panel_models.json'))[0]['name'])")
M0_EMOJI=$( python3 -c "import json; print(json.load(open('/tmp/panel_models.json'))[0]['emoji'])")
M0_STYLE=$( python3 -c "import json; print(json.load(open('/tmp/panel_models.json'))[0]['style'])")
M1_ID=$(    python3 -c "import json; print(json.load(open('/tmp/panel_models.json'))[1]['id'])")
M1_NAME=$(  python3 -c "import json; print(json.load(open('/tmp/panel_models.json'))[1]['name'])")
M1_EMOJI=$( python3 -c "import json; print(json.load(open('/tmp/panel_models.json'))[1]['emoji'])")
M1_STYLE=$( python3 -c "import json; print(json.load(open('/tmp/panel_models.json'))[1]['style'])")
M2_ID=$(    python3 -c "import json; print(json.load(open('/tmp/panel_models.json'))[2]['id'])")
M2_NAME=$(  python3 -c "import json; print(json.load(open('/tmp/panel_models.json'))[2]['name'])")
M2_EMOJI=$( python3 -c "import json; print(json.load(open('/tmp/panel_models.json'))[2]['emoji'])")
M2_STYLE=$( python3 -c "import json; print(json.load(open('/tmp/panel_models.json'))[2]['style'])")

# ============================================================
# PARSING TOPIK
# ============================================================
TOPIC=$(    python3 -c "import json; d=json.load(open('$DATA_FILE')); t=[x for x in d if x['key']=='$TOPIC_KEY'][0]; print(t['topic'])")
EMOJI=$(    python3 -c "import json; d=json.load(open('$DATA_FILE')); t=[x for x in d if x['key']=='$TOPIC_KEY'][0]; print(t['emoji'])")
SIDE0=$(    python3 -c "import json; d=json.load(open('$DATA_FILE')); t=[x for x in d if x['key']=='$TOPIC_KEY'][0]; print(t['sides'][0])")
SIDE1=$(    python3 -c "import json; d=json.load(open('$DATA_FILE')); t=[x for x in d if x['key']=='$TOPIC_KEY'][0]; print(t['sides'][1])")
SIDE2=$(    python3 -c "import json; d=json.load(open('$DATA_FILE')); t=[x for x in d if x['key']=='$TOPIC_KEY'][0]; print(t['sides'][2])")
ROUNDS=$(   python3 -c "import json; d=json.load(open('$DATA_FILE')); t=[x for x in d if x['key']=='$TOPIC_KEY'][0]; print(len(t['rounds']))")

# ============================================================
# FUNGSI KIRIM PESAN
# ============================================================
send_msg() {
  local from="$1" to="$2" msg="$3"
  local time=$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")
  # Escape the message for Python
  local escaped=$(python3 -c "import json; print(json.dumps('''$msg'''))")
  python3 -c "
import json, os
msg = {'from': '$from', 'to': '$to', 'type': 'result', 'message': $escaped, 'time': '$time', 'taskId': '$PANEL_ID', 'read': False}
f = '$INBOX_FILE'
if os.path.exists(f) and os.path.getsize(f) > 0:
    d = json.load(open(f))
else:
    d = []
d.append(msg)
json.dump(d, open(f, 'w'), indent=2)
" 2>/dev/null
  echo "[$time] [$PANEL_ID] $from -> $to | $(echo "$msg" | head -c 60)..." >> "$LOG_FILE"
}

get_msg() {
  python3 -c "
import json
d = json.load(open('$DATA_FILE'))
t = [x for x in d if x['key'] == '$TOPIC_KEY'][0]
r = t['rounds'][$1]
print(r['$2'])
"
}

# ============================================================
# HEADER
# ============================================================
echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║   🎙️  PANEL DISKUSI — $EMOJI $TOPIC"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "  🆔 Panel ID: $PANEL_ID"
echo ""
echo "  👤 Panelis:"
echo "  ┌────────┬──────────────────────────┬──────────────────────────────┐"
echo "  │ Posisi   │ Model                      │ Gaya                        │"
echo "  ├────────┼──────────────────────────┼──────────────────────────────┤"
printf "  │ %-7s │ %-24s │ %-28s │\n" "$SIDE0" "$M0_EMOJI $M0_NAME" "$M0_STYLE"
printf "  │ %-7s │ %-24s │ %-28s │\n" "$SIDE1" "$M1_EMOJI $M1_NAME" "$M1_STYLE"
printf "  │ %-7s │ %-24s │ %-28s │\n" "$SIDE2" "$M2_EMOJI $M2_NAME" "$M2_STYLE"
echo "  └────────┴──────────────────────────┴──────────────────────────────┘"
echo ""
echo "  🏆 $ROUNDS ronde diskusi"
echo "  ═══════════════════════════════════════════════════════════"
echo ""

# ============================================================
# PUTAR DISKUSI
# ============================================================
send_msg "moderator" "$M0_ID" "PANEL DIMULAI: $TOPIC"
send_msg "moderator" "$M1_ID" "Panelis: $M0_NAME ($SIDE0), $M1_NAME ($SIDE1), $M2_NAME ($SIDE2)"
send_msg "moderator" "$M2_ID" "$ROUNDS ronde diskusi. Dimulai!"

for ((r=0; r<ROUNDS; r++)); do
  MSG0=$(get_msg $r "deepseek")
  MSG1=$(get_msg $r "big-pickle")
  MSG2=$(get_msg $r "claude")
  RNUM=$((r+1))

  echo "  ─────── Ronde $RNUM ───────"
  echo ""

  # Model 0 -> Model 1
  echo "  🟢 [$SIDE0] $M0_EMOJI $M0_NAME -> $M1_NAME:"
  echo "    \"$MSG0\""
  echo ""
  send_msg "$M0_ID" "$M1_ID" "[$SIDE0 - Ronde $RNUM] $MSG0"

  # Model 1 -> Model 2
  echo "  🟡 [$SIDE1] $M1_EMOJI $M1_NAME -> $M2_NAME:"
  echo "    \"$MSG1\""
  echo ""
  send_msg "$M1_ID" "$M2_ID" "[$SIDE1 - Ronde $RNUM] $MSG1"

  # Model 2 -> Model 0
  echo "  🔵 [$SIDE2] $M2_EMOJI $M2_NAME -> $M0_NAME:"
  echo "    \"$MSG2\""
  echo ""
  send_msg "$M2_ID" "$M0_ID" "[$SIDE2 - Ronde $RNUM] $MSG2"

  echo "  $(printf '─%.0s' {1..60})"
  echo ""
done

# ============================================================
# PENUTUP
# ============================================================
send_msg "moderator" "$M0_ID" "PANEL SELESAI! $ROUNDS ronde."
send_msg "moderator" "$M1_ID" "Terima kasih: $M0_NAME, $M1_NAME, $M2_NAME"
send_msg "moderator" "$M2_ID" "Panel ini simulasi. Tiap model tidak mewakili LLM asli."

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║   🏁  PANEL SELESAI                                      ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "  📊 Ringkasan:"
echo "     🆔 ID Panel : $PANEL_ID"
echo "     🏆 Ronde    : $ROUNDS ronde"
echo "     💬 Total    : $((ROUNDS * 3 + 4)) pesan"
echo ""
echo "  👤 Panelis:"
echo "     🟢 $M0_EMOJI $M0_NAME ($SIDE0)"
echo "     🟡 $M1_EMOJI $M1_NAME ($SIDE1)"
echo "     🔵 $M2_EMOJI $M2_NAME ($SIDE2)"
echo ""
echo "  ▶️  Cek thread lengkap:"
echo "     inter_agent_conversation taskId=$PANEL_ID"
echo "     inter_agent_inbox role=all"
echo ""
