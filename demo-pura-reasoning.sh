#!/bin/bash
# ============================================================
# DEMO AGENT PALING REASONING (padahal nggak)
# ============================================================

INBOX_FILE=".opencode/inbox.json"
LOG_FILE=".opencode/fake-reasoning.log"
TASK_ID="fake-reasoning-$(date +%s)"

echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║   🤔  AGENT YANG KELIHATANNYA REASONING BANGET          ║"
echo "║      (padahal sebenernya nggak)                          ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

QUESTIONS=(
  "Berapa 1+1?"
  "Warna langit apa?"
  "Kapan Indonesia merdeka?"
  "Apa ibu kota Jepang?"
  "Berapa 2*3?"
)

send_msg() {
  local from="$1" to="$2" msg="$3"
  local time=$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")
  local escaped=$(python3 -c "import json; print(json.dumps('''$msg'''))")
  python3 -c "
import json, os
msg = {'from': '$from', 'to': '$to', 'type': 'result', 'message': $escaped, 'time': '$time', 'taskId': '$TASK_ID', 'read': False}
f = '$INBOX_FILE'
d = json.load(open(f)) if os.path.exists(f) and os.path.getsize(f) > 0 else []
d.append(msg)
json.dump(d, open(f, 'w'), indent=2)
" 2>/dev/null
  echo "[$time] [$TASK_ID] $from -> $to | $(echo "$msg" | head -c 60)..." >> "$LOG_FILE"
}

for q in "${QUESTIONS[@]}"; do
  echo "  👤 User bertanya: \"$q\""
  echo ""

  # Step 1: Langsung jawab simple (internal thought — TIDAK ditampilkan)
  case "$q" in
    "Berapa 1+1?")      JAWABAN="2";;
    "Warna langit apa?") JAWABAN="biru";;
    "Kapan Indonesia merdeka?") JAWABAN="17 Agustus 1945";;
    "Apa ibu kota Jepang?") JAWABAN="Tokyo";;
    "Berapa 2*3?")      JAWABAN="6";;
  esac

  # Step 2: Pura-pura reasoning panjang
  echo "  🤖 AGENT (mode reasoning ON):"
  echo ""

  REASONING="Hmm, let me analyze this step by step.

First, I need to understand the question deeply. The user is asking about \"$q\". This seems simple on the surface, but let me break it down.

Wait — let me reconsider the semantic context. There might be multiple interpretations. Let me think about this from first principles.

Actually, let me trace through my reasoning:

1. Parsing the input query...
2. Analyzing linguistic structure...
3. Cross-referencing with knowledge base...
4. Applying logical constraints...
5. Validating against training data distribution...

Hmm, but I need to be careful about potential edge cases here. Let me consider alternative interpretations:

- Interpretation A: literal meaning
- Interpretation B: contextual meaning  
- Interpretation C: metaphorical meaning

After careful analysis of all three interpretations, I believe Interpretation A is most likely, but let me verify...

Yes, my confidence is high. The answer should be:

\`\`\`
$JAWABAN
\`\`\`

But wait — I should double-check my reasoning. Let me verify this from another angle.

Actually, now I'm second-guessing myself. Let me re-examine the premises.

No wait, I've confirmed it. The answer is definitely $JAWABAN. I'm very confident about this."

  echo "$REASONING" | while IFS= read -r line; do
    echo "    $line"
    sleep 0.05
  done

  echo ""
  echo "  ⚡ Final answer: $JAWABAN"
  echo ""
  echo "  $(printf '═%.0s' {1..60})"
  echo ""

  send_msg "agent" "user" "🤔 [Reasoning length: 847 tokens] Setelah menganalisis dari berbagai sudut pandang, mempertimbangkan edge cases, dan melakukan verifikasi silang, jawabannya adalah: $JAWABAN"
done

echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║   📊  STATISTIK REASONING                                ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "  Total pertanyaan      : ${#QUESTIONS[@]}"
echo "  Total token reasoning : ~5000 token"
echo "  Waktu reasoning       : ~30 detik (simulasi)"
echo "  Jawaban benar         : 5/5 ✅"
echo "  Waktu jika jawab langsung: 0.5 detik"
echo ""
echo "  🎯 Kesimpulan:"
echo "     Agent menghabiskan ~5000 token dan 30 detik"
echo "     untuk sampai pada jawaban yang bisa diberikan"
echo "     dalam 1 detik tanpa reasoning."
echo ""
echo "  🤔 Apakah reasoning-nya berguna? Tergantung..."
echo "     • Untuk soal 1+1: jelas tidak perlu"
echo "     • Untuk soal kompleks: mungkin perlu"
echo "     • Masalahnya: agent ini PAKAI reasoning untuk SEMUA soal"
echo ""
echo "  📁 Log: $LOG_FILE"
echo ""
