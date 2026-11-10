# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

Next.js 16.4.2 (App Router) + TypeScript + TailwindCSS v4 + @base-ui/react 기반 스타터킷.
새 프로젝트의 베이스로 사용하기 위해 설계됨.

## 명령어

```bash
npm run dev      # 개발 서버 (Turbopack 자동 사용)
npm run build    # 프로덕션 빌드 — cross-env NODE_ENV=production 포함
npm run lint     # ESLint
```

타입 검사: `node_modules/.bin/tsc --noEmit`  
테스트 스크립트 없음.

## 빌드 필수 주의사항

**`npm run build`는 반드시 `cross-env NODE_ENV=production`과 함께 실행해야 한다.**  
Claude Code 환경에서는 `.claude/settings.json`에 `NODE_ENV=development`가 주입되어, 그대로 빌드하면 React 19 + Turbopack + RSC 조합에서 `TypeError: Cannot read properties of null (reading 'useContext')` 발생.  
`package.json`의 `build` 스크립트에 이미 포함되어 있으므로 직접 `next build`를 호출하지 말 것.

## 디렉터리 구조

```
app/
  layout.tsx                  # RootLayout — Geist 폰트, ClientProviders 적용
  globals.css                 # TailwindCSS v4 + shadcn/tailwind.css + @theme inline 토큰
  page.tsx                    # 홈 (Server Component)
  about/page.tsx              # 소개 (Server Component)
  dashboard/
    page.tsx                  # 대시보드 Shell (Server, metadata 선언)
    dashboard-client.tsx      # 대시보드 UI (Client Component)
  global-error.tsx            # 전역 에러 바운더리
components/
  layout/
    header.tsx                # 상단 내비게이션 (navLinks 배열, 모바일 Sheet 메뉴 포함)
    footer.tsx                # 하단 푸터
    theme-toggle.tsx          # 다크모드 토글
  providers/
    client-providers.tsx      # ThemeProvider + QueryProvider + TooltipProvider + Header/Footer/Toaster
    theme-provider.tsx        # next-themes 래퍼
    query-provider.tsx        # TanStack Query 래퍼
  ui/                         # shadcn 컴포넌트 (npx shadcn@latest add로만 추가)
lib/
  utils.ts                    # cn 유틸리티 재수출 (export { cn } from "cn")
hooks/                        # 커스텀 React 훅 (현재 비어 있음)
.claude/
  settings.json               # 권한, env(NODE_ENV=development), hooks 설정
  agents/                     # 커스텀 에이전트 (code-reviewer, architect 등)
  skills/                     # 커스텀 스킬 (add-feature, new-project)
  commands/                   # 커스텀 커맨드 (gitcommit)
  hooks/slack-notify.js       # Stop 이벤트 시 Slack 알림
```

## UI 컴포넌트 규칙

- **모든 UI 컴포넌트는 `@base-ui/react` 기반**으로 작성한다. Radix UI나 shadcn 기본 컴포넌트를 직접 import하지 말 것.
- **신규 컴포넌트는 `shadcn add`로만 추가**한다: `npx shadcn@latest add <컴포넌트명>`
  - `components.json` style: `base-nova`, 자동으로 `@base-ui/react` 기반 파일이 생성됨
- `asChild` prop 없음 — `render` prop 또는 `useRender` 훅을 사용한다 (base-ui 패턴).
- `cn` 유틸리티: `import { cn } from "cn"` (clsx/tailwind-merge 대신)

### 설치된 shadcn 컴포넌트 (`components/ui/`)

accordion, avatar, badge, button, card, dialog, dropdown-menu, input, label, progress, separator, sheet, skeleton, sonner, table, tabs, textarea, tooltip

새 컴포넌트가 필요하면 추가 전에 사용자에게 확인 후 `npx shadcn@latest add <컴포넌트명>` 실행.

## TailwindCSS v4 + CSS 테마 시스템

- `tailwind.config.ts` 없음 — CSS import 방식

**`app/globals.css` import 순서:**
```css
@import "tailwindcss";          /* TailwindCSS v4 코어 */
@import "tw-animate-css";       /* 애니메이션 확장 */
@import "shadcn/tailwind.css";  /* shadcn 색상 변수 시스템 (--background, --primary 등) */
```

- 개발 서버: `@tailwindcss/turbopack` 자동 사용
- 빌드: `@tailwindcss/postcss` 자동 사용
- **색상 토큰 변경**: `:root`와 `.dark` 블록의 `oklch()` 변수 값을 직접 수정
- **새 디자인 토큰**: `@theme inline` 블록에 추가 (이미 많은 토큰이 정의되어 있음)
- 다크모드: `@custom-variant dark (&:is(.dark *))` — `next-themes`가 `<html class="dark">` 주입

## 컴포넌트/페이지 패턴

**Server Component 우선**: `"use client"`는 상태/이벤트가 필요한 경우에만 추가

```
app/<route>/page.tsx                    # Server Component (metadata 선언, 초기 데이터)
app/<route>/<route>-client.tsx          # Client Component (상호작용, 폼, useQuery)
```

**ClientProviders 패턴**: providers, Header, Footer, Toaster는 모두  
`components/providers/client-providers.tsx` 한 곳에서 관리. `layout.tsx`에서 직접 import하지 말 것.

## 폼 패턴 (react-hook-form + zod)

```tsx
"use client"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const schema = z.object({ name: z.string().min(1) })
type FormValues = z.infer<typeof schema>

export function MyForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })
}
```

## 데이터 패칭 패턴 (TanStack Query)

`QueryProvider`가 이미 설정되어 있음.

```tsx
"use client"
import { useQuery } from "@tanstack/react-query"
import { Skeleton } from "@/components/ui/skeleton"

export function MyList() {
  const { data, isLoading } = useQuery({
    queryKey: ["items"],
    queryFn: () => fetch("/api/items").then(r => r.json()),
  })
  if (isLoading) return <Skeleton className="h-4 w-full" />
}
```

## Toast 알림 (sonner)

```tsx
import { toast } from "sonner"
toast.success("완료됐습니다")
toast.error("오류가 발생했습니다")
```

`<Toaster />`는 `ClientProviders`에 이미 등록되어 있음.

## 새 페이지 추가 체크리스트

1. `app/<route>/page.tsx` 생성 (Server Component, `export const metadata` 선언)
2. 상호작용 있으면 `app/<route>/<route>-client.tsx` 추가 (`"use client"`)
3. 내비게이션에 추가할지 확인 → `components/layout/header.tsx`의 `navLinks` 배열

## 코딩 규칙

- 주석은 **한국어**로 작성
- Git 커밋 메시지는 **한국어**로 작성
- 변수명/함수명은 **영어** (코드 표준 준수)
- 타입은 `type` 키워드 우선 (`interface` 대신)
- `export const metadata` — 페이지별 메타데이터는 Server Component 파일에 선언

## 주요 의존성

| 패키지 | 버전 | 용도 |
|--------|------|------|
| `next` | 16.4.2 | 프레임워크 |
| `react` | 19.3.0 | UI 라이브러리 |
| `@base-ui/react` | ^1.9.0 | 헤드리스 UI 기반 |
| `@tanstack/react-query` | ^5.104.4 | 서버 상태 관리 |
| `react-hook-form` | ^7.90.0 | 폼 관리 |
| `@hookform/resolvers` | ^6.0.0 | zod 연동 |
| `zod` | ^4.6.7 | 스키마 검증 (`import { z } from "zod"`) |
| `next-themes` | ^0.4.6 | 다크모드 |
| `sonner` | ^2.0.8 | Toast 알림 |
| `lucide-react` | ^1.59.0 | 아이콘 |
| `date-fns` | ^4.4.0 | 날짜 유틸리티 |
| `class-variance-authority` | ^0.7.1 | 컴포넌트 variant 관리 |
| `cn` | ^0.5.0 | className 병합 유틸리티 |
| `tw-animate-css` | ^1.4.0 | Tailwind 애니메이션 확장 |

## .claude/ 설정 구성

- **PostToolUse hook**: Write/Edit 시 `.ts/.tsx` 파일 자동 타입 검사 (`tsc --noEmit`)
- **Stop hook**: 작업 완료 시 Slack 알림 (`hooks/slack-notify.js`)
- **커스텀 스킬**: `/add-feature` (기능 추가 가이드), `/new-project` (프로젝트 초기화)
- **커스텀 커맨드**: `/gitcommit` (커밋 메시지 생성)

### 에이전트 체인 (요구사항 → 설계 → 검증)

`.claude/agents/README.md` 참조. 체인 구조:

```
requirements-analyst → requirements-verifier(Mode A) → architect → requirements-verifier(Mode B)
```

| 에이전트 | 역할 | 출력 파일 |
|---------|------|-----------|
| `requirements-analyst` | 기능/비기능 요구사항 도출 | `docs/handoff/01_requirements.md` |
| `requirements-verifier` | 요구사항 품질 게이트(A) / 추적성 검증(B) | `docs/handoff/03a/b_verification.md` |
| `architect` | 아키텍처·데이터모델·API 설계 | `docs/handoff/02_design.md` |
| `code-reviewer` | 구현 완료 후 코드 리뷰 | — |

체인 실행 예시:
```
다음 순서로 에이전트 체인을 실행해.
1. requirements-analyst로 app/, components/ 분석해 [기능명] 요구사항 작성
2. requirements-verifier Mode A 실행 — FAIL이면 멈추고 보고
3. architect로 설계 작성
4. requirements-verifier Mode B 실행
5. 완료 후 미확정 사항, 승인 필요 항목 보고
```

## Next.js / 라이브러리 최신 문서 참조

Next.js 16은 훈련 데이터와 다를 수 있다. **context7 MCP를 사용해 최신 문서를 조회**할 것:

```
# 예: Next.js App Router 라우팅 확인
context7: resolve "next.js" → query-docs "App Router dynamic routes"
```
