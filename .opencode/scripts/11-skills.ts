/**
 * ==========================================================
 *  Agent Skills — OpenCode
 * ==========================================================
 *
 * Skills adalah reusable instructions yg bisa di-load on-demand
 * oleh agent via `skill` tool.
 *
 * Cara kerja:
 *   1. Skills didefinisikan di file SKILL.md
 *   2. Pas startup, opencode scan direktori skills
 *   3. Agent liat daftar skill yg available di tool description
 *   4. Agent panggil `skill({ name: "..." })` buat load konten
 *   5. Konten skill masuk ke context agent
 *
 * Sumber: https://opencode.ai/docs/skills/
 *
 * ==========================================================
 *  DAFTAR ISI
 * ==========================================================
 *  1. Membaca / Menggunakan Skill
 *  2. Membuat Skill (SKILL.md)
 *  3. Skill di Main Agent
 *  4. Skill di Subagent
 *  5. Permission & Override per Agent
 *  6. Custom Tools untuk Skill Management
 *  7. Plugin: Skill Auto-Loader
 *  8. Best Practices
 */

import { tool } from "@opencode-ai/plugin"
import type { OpencodeClient } from "@opencode-ai/sdk"

// ===================================================================
//  1. MEMBACA / MENGGUNAKAN SKILL
// ===================================================================
/**
 * Agent membaca skill dengan cara:
 *
 *   skill({ name: "git-release" })
 *
 * Ini native tool yg otomatis tersedia.
 * Agent tinggal panggil kalo butuh instruksi spesifik.
 *
 * Contoh prompt dari user ke AI:
 *   "Bantu aku buat release notes"
 *   → Agent liat skill "git-release" available
 *   → Panggil skill({ name: "git-release" })
 *   → Dapet instruksi lengkap
 *   → Eksekusi sesuai instruksi
 *
 * Cara manual via SDK (list skill yg available):
 *   Dari agent config / system prompt, skill di-listing sebagai:
 *
 *   <available_skills>
 *     <skill>
 *       <name>git-release</name>
 *       <description>Create consistent releases and changelogs</description>
 *     </skill>
 *   </available_skills>
 */

// ===================================================================
//  2. MEMBUAT SKILL (SKILL.md)
// ===================================================================
/**
 * Format file SKILL.md:
 *
 *   ---
 *   name: <nama-skill>
 *   description: <deskripsi 1-1024 karakter>
 *   license: MIT            (optional)
 *   compatibility: opencode (optional)
 *   metadata:               (optional, string-to-string map)
 *     audience: maintainers
 *     workflow: github
 *   ---
 *   <Konten instruksi lengkap>
 *
 * Aturan:
 *   - Nama: lowercase + hyphen, 1-64 char, cocok dg nama folder
 *   - Deskripsi: 1-1024 char
 *   - File: SKILL.md (HURUF BESAR semua)
 *   - Folder: skills/<nama-skill>/
 *
 * Lokasi (dicari otomatis):
 *   .opencode/skills/<name>/SKILL.md        → project
 *   ~/.config/opencode/skills/<name>/SKILL.md → global
 *   .claude/skills/<name>/SKILL.md           → kompatibel Claude
 *   ~/.claude/skills/<name>/SKILL.md
 *   .agents/skills/<name>/SKILL.md           → kompatibel agent
 *   ~/.agents/skills/<name>/SKILL.md
 */

// Contoh skill — git-release
export const skillGitRelease = {
  path: ".opencode/skills/git-release/SKILL.md",
  content: `---
name: git-release
description: Create consistent releases and changelogs with version bumps and GitHub releases
license: MIT
compatibility: opencode
metadata:
  audience: maintainers
  workflow: github
---

## What I do
- Draft release notes from merged PRs
- Propose a version bump (major/minor/patch)
- Provide a copy-pasteable \`gh release create\` command

## When to use me
Use this when you are preparing a tagged release.
Ask clarifying questions if the target versioning scheme is unclear.

## Steps
1. Run \`git log --oneline --no-decorate v{last_tag}..HEAD\` to list changes
2. Categorize into Features, Fixes, Maintenance
3. Propose version bump using semver
4. Generate \`gh release create\` command
`,
}

// Contoh skill — code-review
export const skillCodeReview = {
  path: ".opencode/skills/code-review/SKILL.md",
  content: `---
name: code-review
description: Review pull requests for security, performance, and best practices
license: MIT
compatibility: opencode
---

## What I Do
- Analyze code changes for potential issues
- Check for security vulnerabilities
- Evaluate performance implications
- Suggest improvements

## Guidelines
1. Read the diff first, understand the change
2. Check for:
   - SQL injection / XSS / CSRF
   - Memory leaks
   - Error handling
   - Edge cases
3. Provide constructive, actionable feedback
4. Prioritize: Security > Correctness > Performance > Style

## Output Format
\`\`\`
## Files Reviewed
- path/to/file.ts

## Findings
- [HIGH] SQL injection risk in line 42
- [MED] Missing input validation

## Summary
Overall assessment: ...

\`\`\`
`,
}

// Contoh skill — testing
export const skillTesting = {
  path: ".opencode/skills/testing/SKILL.md",
  content: `---
name: testing
description: Write comprehensive tests following project conventions
license: MIT
compatibility: opencode
---

## What I Do
Write unit tests, integration tests, and E2E tests.

## Conventions
- Use existing test framework (vitest, jest, pytest, etc.)
- Follow naming: *.test.ts or *.spec.ts
- One describe block per component/function
- Test edge cases and error states
- Mock external dependencies

## Checklist
- [ ] Happy path works
- [ ] Error handling tested
- [ ] Edge cases covered
- [ ] No test pollution (cleanup in afterEach)
`,
}

// ===================================================================
//  3. SKILL DI MAIN AGENT (Build / Plan)
// ===================================================================
/**
 * Main agent (build/plan) secara default punya akses ke skill tool.
 * Agent bisa load skill kapan aja.
 *
 * Cara agent pake skill:
 *   1. Agent liat <available_skills> di system prompt
 *   2. Kalo butuh, panggil: skill({ name: "code-review" })
 *   3. Konten skill masuk ke context
 *   4. Agent execute sesuai instruksi skill
 *
 * Config: allow skill di main agent (default):
 *   "agent": {
 *     "build": {
 *       "permission": {
 *         "skill": { "*": "allow" }
 *       }
 *     }
 *   }
 *
 * Atau matikan skill buat agent tertentu:
 *   "agent": {
 *     "plan": {
 *       "tools": { "skill": false }
 *     }
 *   }
 */

// ===================================================================
//  4. SKILL DI SUBAGENT
// ===================================================================
/**
 * Subagent juga bisa akses skill — asalkan permissionnya di-set.
 * Skill berguna banget buat subagent karena:
 *   - Subagent punya context lebih kecil
 *   - Skill ngasih instruksi lengkap tanpa perlu konteks tambahan
 *   - Bisa di-share antar subagent
 *
 * Contoh: subagent "code-reviewer" dengan skill "code-review"
 *
 *   .opencode/agents/code-reviewer.md:
 *     ---
 *     description: Review code untuk best practices
 *     mode: subagent
 *     permission:
 *       skill: { "*": "allow" }
 *     ---
 *     Kamu adalah code reviewer. Gunakan skill code-review untuk panduan.
 *
 * Cara subagent panggil skill:
 *   1. Di agent prompt, instruksi: "Gunakan skill code-review"
 *   2. Agent panggil: skill({ name: "code-review" })
 *   3. Dapet instruksi lengkap + checklist
 *
 * Atau bisa juga di agent prompt langsung disuruh:
 *   ---
 *   description: ...
 *   mode: subagent
 *   ---
 *   Kamu adalah [role]. LOAD SKILL: skill({ name: "code-review" })
 *   Setelah load skill, ikuti instruksinya.
 */

// ===================================================================
//  5. PERMISSION & OVERRIDE PER AGENT
// ===================================================================
/**
 * Global permission (opencode.json):
 *   "permission": {
 *     "skill": {
 *       "*": "allow",
 *       "internal-*": "deny",
 *       "experimental-*": "ask"
 *     }
 *   }
 *
 * Per-agent override:
 *   "agent": {
 *     "code-reviewer": {
 *       "permission": {
 *         "skill": {
 *           "code-review": "allow",
 *           "internal-*": "deny"
 *         }
 *       }
 *     }
 *   }
 *
 * Nilai permission:
 *   "allow" → skill bisa di-load langsung
 *   "deny"  → skill di-hidden dari agent, gak bisa diakses
 *   "ask"   → minta persetujuan user dulu
 */

// SDK: config update buat set skill permission
export async function setSkillPermission(client: OpencodeClient) {
  await client.config.update({
    body: {
      permission: {
        skill: {
          "*": "allow",
          "internal-*": "deny",
        },
      },
      agent: {
        "code-reviewer": {
          permission: {
            skill: { "code-review": "allow" },
          },
        },
      },
    },
  } as any)
  console.log("Skill permissions updated")
}

// ===================================================================
//  6. CUSTOM TOOLS — Skill Management
// ===================================================================
export const skillTools = {
  tool: {
    // Tool: load skill dan return kontennya
    load_skill: tool({
      description: "Load konten skill tertentu. Gunakan ini untuk mendapatkan instruksi spesifik.",
      args: {
        name: tool.schema.string().describe("Nama skill yg mau di-load"),
      },
      async execute(args: any, ctx: any) {
        const { worktree } = ctx
        const path = `${worktree}/.opencode/skills/${args.name}/SKILL.md`

        // Di real plugin, baca file via client.file.read atau $ cat
        return `Skill "${args.name}" akan di-load dari ${path}`
      },
    }),

    // Tool: list semua skill yg available
    list_skills: tool({
      description: "List semua skill yg tersedia di project ini",
      args: {},
      async execute(_args: any, _ctx: any) {
        return `Available skills:
- git-release: Create consistent releases and changelogs
- code-review: Review pull requests for security, performance, best practices
- testing: Write comprehensive tests following project conventions

Gunakan skill({ name: "..." }) untuk load konten skill.`
      },
    }),

    // Tool: bikin skill baru
    create_skill: tool({
      description: "Buat skill baru. Skill bisa di-load oleh agent lain via skill() tool.",
      args: {
        name: tool.schema
          .string()
          .describe("Nama skill (lowercase + hyphen, 1-64 char). Juga jadi nama folder."),
        description: tool.schema
          .string()
          .describe("Deskripsi skill (1-1024 char). Muncul di tool description agent."),
        instructions: tool.schema
          .string()
          .describe("Konten instruksi lengkap skill. Format markdown."),
      },
      async execute(args: any, ctx: any) {
        const { worktree } = ctx
        const { name, description, instructions } = args

        const frontmatter = `---
name: ${name}
description: ${description}
license: MIT
compatibility: opencode
---
`

        const content = frontmatter + instructions
        const filePath = `${worktree}/.opencode/skills/${name}/SKILL.md`

        // Di real plugin, write file via bash
        return {
          title: `Skill ${name} Created`,
          output: `Skill "${name}" berhasil dibuat di ${filePath}`,
          metadata: { name, filePath },
          attachments: [{
            type: "file" as const,
            mime: "text/markdown",
            url: `file://${filePath}`,
          }],
        }
      },
    }),
  },
}

// ===================================================================
//  7. PLUGIN — Skill Auto-Loader
// ===================================================================
//
//  Plugin yg auto-load skill tertentu berdasarkan konteks user message.
//
//  export const SkillLoaderPlugin: Plugin = async ({ client }) => {
//    return {
//      "chat.message": async (input, output) => {
//        const text = output.parts
//          .filter((p: any) => p.type === "text")
//          .map((p: any) => p.text).join(" ")
//          .toLowerCase()
//
//        // Auto-inject skill instructions based on user request
//        if (text.includes("release") || text.includes("changelog")) {
//          output.parts.push({
//            type: "text",
//            text: `[System: User request terkait release. Load skill git-release: skill({ name: "git-release" })]`,
//            synthetic: true,
//          })
//        }
//
//        if (text.includes("review") || text.includes("audit")) {
//          output.parts.push({
//            type: "text",
//            text: `[System: Load skill code-review buat panduan review]`,
//            synthetic: true,
//          })
//        }
//
//        if (text.includes("test")) {
//          output.parts.push({
//            type: "text",
//            text: `[System: Load skill testing buat panduan testing]`,
//            synthetic: true,
//          })
//        }
//      },
//    }
//  }

// ===================================================================
//  8. PLUGIN — Inject Skill untuk Subagent
// ===================================================================
//
//  Plugin yg mastiin subagent selalu punya skill yg relevan.
//
//  export const SubagentSkillPlugin: Plugin = async ({ client }) => {
//    return {
//      "chat.message": async (input, output) => {
//        const agent = input.agent ?? "build"
//
//        // Inject skill instructions specific to each subagent
//        const skillsByAgent: Record<string, string[]> = {
//          "code-reviewer": ["code-review"],
//          "testing-agent": ["testing"],
//          "docs-writer": ["documentation"],
//        }
//
//        const relevantSkills = skillsByAgent[agent]
//        if (relevantSkills) {
//          for (const skillName of relevantSkills) {
//            output.parts.push({
//              type: "text",
//              text: `[System: Kamu adalah ${agent}. LOAD SKILL: skill({ name: "${skillName}" })]`,
//              synthetic: true,
//            })
//          }
//        }
//      },
//    }
//  }

// ===================================================================
//  9. BEST PRACTICES
// ===================================================================
/**
 * 1. Skill vs Agent Prompt
 *    - Agent prompt: instructions yg SELALU ada di context
 *    - Skill: instructions yg di-LOAD KALO BUTUH aja
 *    → Pake skill buat instruksi detail yg gak selalu dipake
 *
 * 2. Naming Convention
 *    - git-release         ✅
 *    - code-review         ✅
 *    - My Skill            ❌ (huruf besar)
 *    - test_skill          ❌ (underscore)
 *    - test--skill         ❌ (double hyphen)
 *
 * 3. Description yg Baik
 *    ❌ "Testing stuff"
 *    ✅ "Write comprehensive unit and integration tests following vitest conventions"
 *
 * 4. Organisasi Skill
 *    .opencode/skills/
 *    ├── git-release/
 *    │   └── SKILL.md
 *    ├── code-review/
 *    │   └── SKILL.md
 *    ├── testing/
 *    │   └── SKILL.md
 *    └── documentation/
 *        └── SKILL.md
 *
 * 5. Permission Strategy
 *    - "*": "allow" → semua agent bisa pake semua skill
 *    - "internal-*": "deny" → sembunyiin skill internal
 *    - "experimental-*": "ask" → tanya dulu kalo skill baru
 *    - Per-agent override buat kontrol granular
 *
 * 6. Skill di Subagent
 *    - Subagent punya context terbatas → skill bantu ngasih konteks
 *    - Pastiin permission skill di-set di agent config
 *    - Instruksi agent: "Gunakan skill X" biar agent panggil skill()
 *
 * 7. Testing Skill
 *    - Cek: skill muncul di <available_skills>
 *    - Cek: permission "allow" biar agent bisa load
 *    - Cek: konten skill lengkap dan relevant
 */

// ===================================================================
//  RINGKASAN
// ===================================================================
//
//  ┌──────────────────────────────────────────────────────────────┐
//  │  Konsep           │  Cara                                  │
//  ├──────────────────────────────────────────────────────────────┤
//  │  Baca skill       │  Agent panggil: skill({ name: "..." })  │
//  │  Tulis skill      │  .opencode/skills/<name>/SKILL.md       │
//  │  Skill di main    │  Default allow, panggil skill() kapan   │
//  │                   │  aja                                   │
//  │  Skill di subagent│  Set permission + instruksi agent       │
//  │                   │  buat panggil skill()                   │
//  │  Permission       │  opencode.json → permission.skill       │
//  │  Override agent   │  agent.<name>.permission.skill          │
//  └──────────────────────────────────────────────────────────────┘
//
//  Flow lengkap:
//    User: "Buat release notes"
//    → Agent liat <available_skills> ada "git-release"
//    → Agent panggil: skill({ name: "git-release" })
//    → Dapet instruksi: git log → categorize → version bump → gh release
//    → Eksekusi sesuai skill
