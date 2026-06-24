#!/bin/bash
# ============================================================
# DEMO DEBAT INTER-AGENT
# Mensimulasikan debat antara dua agent dengan topik
# ============================================================

INBOX_FILE=".opencode/inbox.json"
LOG_FILE=".opencode/inter-agent-demo.log"

echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║   🗣️  DEMO DEBAT INTER-AGENT                             ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# ============================================================
# PREDIKSI ARGUMEN DEBAT (tanpa LLM)
# ============================================================
declare -A DEBATE_TOPICS

DEBATE_TOPICS["monolith-microservices"]='{
  "topic": "Monolith vs Microservices",
  "emoji": "🏛️",
  "pro_agent": "Architect",
  "pro_emoji": "🏗️",
  "con_agent": "Developer",
  "con_emoji": "👨‍💻",
  "judge": "Project Manager",
  "judge_emoji": "👔",
  "rounds": 3,
  "arguments": [
    {
      "pro": "Monolith lebih sederhana. Satu codebase, satu deploy, latency rendah antar modul. Cocok untuk tim kecil dan MVP.",
      "con": "Microservices memberi skalabilitas independen. Tiap service bisa di-scale sesuai kebutuhan, pakai teknologi berbeda."
    },
    {
      "pro": "Monolith lebih mudah di-debug. Stack trace jelas, transaksi database konsisten, tanpa network overhead.",
      "con": "Microservices punya fault isolation. Satu service crash tidak bikin seluruh aplikasi down."
    },
    {
      "pro": "Monolith develop 3x lebih cepat di awal. Microservices butuh infrastruktur messaging, service discovery, API gateway.",
      "con": "Microservices memungkinkan tim paralel. 5 tim bisa kerja di 5 service berbeda tanpa conflict."
    }
  ]
}'

DEBATE_TOPICS["typescript-vs-javascript"]='{
  "topic": "TypeScript vs JavaScript",
  "emoji": "📘",
  "pro_agent": "QA Engineer",
  "pro_emoji": "🧪",
  "con_agent": "Developer",
  "con_emoji": "👨‍💻",
  "judge": "Architect",
  "judge_emoji": "🏗️",
  "rounds": 3,
  "arguments": [
    {
      "pro": "TypeScript mencegah bug type di production. Static typing menangkap error di compile time, bukan runtime.",
      "con": "JavaScript lebih cepat prototyping. Tanpa type declaration, kita bisa iterasi lebih cepat. TypeScript memperlambat development."
    },
    {
      "pro": "TypeScript memberikan dokumentasi hidup. Interface dan type jadi self-documenting code. IDE autocomplete jauh lebih baik.",
      "con": "JavaScript punya ekosistem lebih luas. Banyak library yang type definition-nya tidak lengkap atau ketinggalan."
    },
    {
      "pro": "TypeScript refactor lebih aman. Ganti nama property? TypeScript kasih tahu semua yg perlu diubah. JS? Cari manual.",
      "con": "JavaScript lebih ringan. Tanpa kompilasi, tanpa tsconfig, tanpa type battle. Pakai JSDoc bisa dapat type hint juga."
    }
  ]
}'

DEBATE_TOPICS["sql-vs-nosql"]='{
  "topic": "SQL vs NoSQL",
  "emoji": "🗄️",
  "pro_agent": "Architect",
  "pro_emoji": "🏗️",
  "con_agent": "Developer",
  "con_emoji": "👨‍💻",
  "judge": "Project Manager",
  "judge_emoji": "👔",
  "rounds": 3,
  "arguments": [
    {
      "pro": "SQL punya ACID transaction. Data konsisten, rollback atomic. Tidak ada partial write. Penting untuk financial system.",
      "con": "NoSQL lebih scalable horizontal. Sharding built-in, schema flexible. Cocok untuk data besar dengan struktur berubah."
    },
    {
      "pro": "SQL standard 50+ tahun. JOIN, subquery, aggregasi powerful. Tools reporting dan BI langsung connect.",
      "con": "NoSQL optimised untuk specific use case. Document store untuk JSON, Time-series untuk metrics, Graph untuk relasi kompleks."
    },
    {
      "pro": "SQL schema rigid menjaga data quality. Constraint, foreign key, trigger mencegah data inconsistency.",
      "con": "NoSQL schema-less mempercepat development. Tambah field tanpa migration. Cocok untuk agile dengan requirements berubah."
    }
  ]
}'

DEBATE_TOPICS["tdd"]='{
  "topic": "TDD (Test-Driven Development)",
  "emoji": "🧪",
  "pro_agent": "QA Engineer",
  "pro_emoji": "🧪",
  "con_agent": "Developer",
  "con_emoji": "👨‍💻",
  "judge": "Project Manager",
  "judge_emoji": "👔",
  "rounds": 3,
  "arguments": [
    {
      "pro": "TDD menghasilkan code coverage tinggi. Setiap baris kode punya test. Regression terdeteksi langsung.",
      "con": "TDD memperlambat development 30-40%. Kadang kita belum tahu exact API yang mau dibuat, test jadi sering diganti."
    },
    {
      "pro": "TDD memaksa desain yang baik. Kalo susah di-test, berarti desainnya jelek. Test first = better architecture.",
      "con": "TDD bukan satu-satunya cara. Integration test dan manual QA tetap diperlukan. Waktu lebih baik dipakai untuk business logic."
    },
    {
      "pro": "TDD mengurangi debugging time. 80% bug terdeteksi sebelum kode di-run. Developer jadi lebih percaya diri refactor.",
      "con": "TDD approach terlalu idealis. Di startup dengan deadline ketat, writing test after code lebih realistis. Speed matters."
    }
  ]
}'

DEBATE_TOPICS["react-vue"]='{
  "topic": "React vs Vue",
  "emoji": "⚛️",
  "pro_agent": "Developer",
  "pro_emoji": "👨‍💻",
  "con_agent": "Architect",
  "con_emoji": "🏗️",
  "judge": "Project Manager",
  "judge_emoji": "👔",
  "rounds": 3,
  "arguments": [
    {
      "pro": "React punya ekosistem terbesar. Library, tools, job market. Next.js, Remix, React Native dalam satu ekosistem.",
      "con": "Vue lebih simple dan intuitive. Single-file components, template syntax yang mudah dibaca. Learning curve lebih landai."
    },
    {
      "pro": "React dengan JSX lebih fleksibel. Full JavaScript power di template. TypeScript integration sempurna.",
      "con": "Vue punya Reactivity system built-in. ref() dan reactive() tanpa library tambahan. Performance lebih ringan."
    },
    {
      "pro": "React didukung Meta (Facebook). Investasi besar, komunitas kuat, inovasi terus. Stabil untuk jangka panjang.",
      "con": "Vue independen (Evan You), iterasi cepat tanpa corporate agenda. Vue 3 Composition API menyamai React hooks."
    }
  ]
}'

# ============================================================
# FUNGSI HELP
# ============================================================
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
  echo "╔═══════════════════════════════════════════════════════════╗"
  echo "║   🗣️  DEMO DEBAT INTER-AGENT                             ║"
  echo "║   Penggunaan: bash demo-debat.sh [topik]                  ║"
  echo "╚═══════════════════════════════════════════════════════════╝"
  echo ""
  echo "  Topik tersedia:"
  echo "    1. monolith-microservices   🏛️  Monolith vs Microservices"
  echo "    2. typescript-vs-javascript 📘  TypeScript vs JavaScript"
  echo "    3. sql-vs-nosql             🗄️  SQL vs NoSQL"
  echo "    4. tdd                      🧪  TDD vs No TDD"
  echo "    5. react-vue                ⚛️  React vs Vue"
  echo ""
  echo "  Contoh: bash demo-debat.sh monolith-microservices"
  echo ""
  exit 0
fi

# ============================================================
# PILIH TOPIK
# ============================================================
TOPIC_KEY="${1:-monolith-microservices}"

if [ -z "${DEBATE_TOPICS[$TOPIC_KEY]}" ]; then
  echo "❌ Topik '$TOPIC_KEY' tidak dikenal. Lihat bash demo-debat.sh --help"
  exit 1
fi

TOPIC_JSON="${DEBATE_TOPICS[$TOPIC_KEY]}"

# Parse JSON dengan python
TOPIC=$(python3 -c "import json; print(json.loads('''$TOPIC_JSON''')['topic'])")
EMOJI=$(python3 -c "import json; print(json.loads('''$TOPIC_JSON''')['emoji'])")
PRO_AGENT=$(python3 -c "import json; print(json.loads('''$TOPIC_JSON''')['pro_agent'])")
PRO_EMOJI=$(python3 -c "import json; print(json.loads('''$TOPIC_JSON''')['pro_emoji'])")
CON_AGENT=$(python3 -c "import json; print(json.loads('''$TOPIC_JSON''')['con_agent'])")
CON_EMOJI=$(python3 -c "import json; print(json.loads('''$TOPIC_JSON''')['con_emoji'])")
JUDGE=$(python3 -c "import json; print(json.loads('''$TOPIC_JSON''')['judge'])")
JUDGE_EMOJI=$(python3 -c "import json; print(json.loads('''$TOPIC_JSON''')['judge_emoji'])")
ROUNDS=$(python3 -c "import json; print(json.loads('''$TOPIC_JSON''')['rounds'])")

# Ambil username dari git config
USERNAME=$(git config user.name 2>/dev/null || echo "User")
DEBATE_ID="debat-$(date +%s)"

# ============================================================
# HEADER DEBAT
# ============================================================
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║   🗣️  DEBAT: $TOPIC"
printf "║   ║
  DEBAT_ID: $DEBATE_ID"
echo ""
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "  $PRO_EMOJI $PRO_AGENT (PRO)  vs  $CON_EMOJI $CON_AGENT (KONTRA)"
echo "  $JUDGE_EMOJI $JUDGE (Moderator)"
echo "  🏆 $ROUNDS ronde debat"
echo ""

# ============================================================
# KIRIM PESAN VIA PLUGIN (tulis langsung ke inbox)
# ============================================================
send_debate_msg() {
  local from="$1" to="$2" type="$3" message="$4"
  local time=$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")

  # Tulis ke inbox
  python3 -c "
import json, os
msg = {'from': '$from', 'to': '$to', 'type': '$type', 'message': '$message', 'time': '$time', 'taskId': '$DEBATE_ID', 'read': False}

inbox_file = '$INBOX_FILE'
if os.path.exists(inbox_file):
    with open(inbox_file) as f:
        try:
            data = json.load(f)
        except:
            data = []
else:
    data = []
data.append(msg)
with open(inbox_file, 'w') as f:
    json.dump(data, f, indent=2)
" 2>/dev/null

  # Tulis ke log
  echo "[$time] [$DEBATE_ID] $from → $to [$type]" >> "$LOG_FILE"
  echo "  💬 $message" >> "$LOG_FILE"
  echo "" >> "$LOG_FILE"
}

# Map long names to short IDs for the plugin
pro_id=$(python3 -c "
import json
m = {'Architect': 'architect', 'Developer': 'developer', 'QA Engineer': 'qa', 'Project Manager': 'pm', 'DevOps': 'devops'}
print(m.get('$PRO_AGENT', 'developer'))
")
con_id=$(python3 -c "
import json
m = {'Architect': 'architect', 'Developer': 'developer', 'QA Engineer': 'qa', 'Project Manager': 'pm', 'DevOps': 'devops'}
print(m.get('$CON_AGENT', 'developer'))
")
judge_id=$(python3 -c "
import json
m = {'Architect': 'architect', 'Developer': 'developer', 'QA Engineer': 'qa', 'Project Manager': 'pm', 'DevOps': 'devops'}
print(m.get('$JUDGE', 'pm'))
")

# ============================================================
# PUTAR DEBAT
# ============================================================

# Moderator buka debat
send_debate_msg "$judge_id" "$pro_id" "result" "🗣️ DEBAT DIMULAI: $TOPIC"
send_debate_msg "$judge_id" "$con_id" "result" "🗣️ Topik: $TOPIC | $PRO_AGENT (PRO) vs $CON_AGENT (KONTRA)"
echo "  ${judge_id}: 🗣️ DEBAT DIMULAI!"
echo "  $(printf '─%.0s' {1..50})"
echo ""

for ((i=1; i<=ROUNDS; i++)); do
  ARG=$(python3 -c "
import json
data = json.loads('''$TOPIC_JSON''')
args = data['arguments'][$((i-1))]
print('PRO:' + args['pro'])
print('CON:' + args['con'])
")
  PRO_ARG=$(echo "$ARG" | grep "^PRO:" | sed 's/^PRO://')
  CON_ARG=$(echo "$ARG" | grep "^CON:" | sed 's/^CON://')

  echo "  ───── Ronde $i ─────"
  echo ""

  # PRO argumen
  echo "  🟢 $PRO_EMOJI $PRO_AGENT (PRO):"
  echo "    \"$PRO_ARG\""
  echo ""
  send_debate_msg "$pro_id" "$judge_id" "result" "[Ronde $i - PRO] $PRO_ARG"

  # CON argumen
  echo "  🔴 $CON_EMOJI $CON_AGENT (KONTRA):"
  echo "    \"$CON_ARG\""
  echo ""
  send_debate_msg "$con_id" "$judge_id" "result" "[Ronde $i - KONTRA] $CON_ARG"

  echo "  $(printf '─%.0s' {1..50})"
  echo ""
done

# ============================================================
# VERDIK
# ============================================================
VERDICT=$(python3 -c "
import json, random
data = json.loads('''$TOPIC_JSON''')
verdicts = [
    'Kedua pihak punya argumen kuat. Keputusan tergantung konteks project dan tim.',
    'PRO menang dalam hal argumen teknis, KONTRA unggul di aspek praktis. Draw.',
    'Tidak ada pemenang absolut. Setiap teknologi punya trade-off masing-masing.',
    'PRO berhasil membuktikan superiority-nya. Argumen lebih terstruktur.',
    'KONTRA memberikan sanggahan yang meyakinkan. Beberapa poin PRO kurang berdasar.',
    'Perdebatan sehat! Keduanya menunjukkan pemahaman mendalam tentang topik ini.'
]
print(random.choice(verdicts))
")

send_debate_msg "$judge_id" "$pro_id" "result" "🏁 DEBAT SELESAI! $ROUNDS ronde telah dimainkan."
send_debate_msg "$judge_id" "$con_id" "result" "🏁 Terima kasih kepada $PRO_AGENT dan $CON_AGENT."
send_debate_msg "$judge_id" "pm" "result" "📋 Verdict: $VERDICT"

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║   🏁  DEBAT SELESAI                                      ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "  📋 Verdict:"
echo "     \"$VERDICT\""
echo ""
echo "  📊 Statistik:"
echo "     🆔 ID    : $DEBATE_ID"
echo "     🏆 Ronde : $ROUNDS ronde"
TOTAL_MSGS=$((ROUNDS * 2 + 4))
echo "     💬 Pesan : $TOTAL_MSGS"
echo "     🟢 PRO   : $PRO_EMOJI $PRO_AGENT"
echo "     🔴 KONTRA: $CON_EMOJI $CON_AGENT"
echo "     ⚖️ Judge : $JUDGE_EMOJI $JUDGE"
echo ""
echo "  ▶️  Cek percakapan lengkap:"
echo "     inter_agent_conversation taskId=$DEBATE_ID"
echo "     inter_agent_inbox role=all"
echo ""
echo "  📁 Log   : $LOG_FILE"
echo "  📁 Inbox : $INBOX_FILE"
echo ""
