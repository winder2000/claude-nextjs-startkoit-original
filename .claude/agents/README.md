# 서브에이전트 가이드

요구사항 분석 → 설계 → 검증 체인을 구성하는 세 전문 에이전트를 설명합니다.

---

## 체인 구조

```
requirements-analyst ──▶ docs/handoff/01_requirements.md
         ▼
requirements-verifier (Mode A: 요구사항 게이트) ──▶ docs/handoff/03a_verification.md
         ▼ PASS일 때만 진행
architect ──▶ docs/handoff/02_design.md
         ▼
requirements-verifier (Mode B: 추적성 검증) ──▶ docs/handoff/03b_verification.md
```

> **검증 에이전트(`requirements-verifier`)는 체인에서 두 번 호출됩니다.**
> - Mode A: 설계 진입 전 요구사항 품질 게이트
> - Mode B: 설계 완료 후 요구사항↔설계 추적성 검증

---

## 에이전트 상세

### 1. `requirements-analyst` — 요구사항 분석 전문가

| 항목 | 내용 |
|---|---|
| 파일 | `requirements-analyst.md` |
| 모델 | Claude Opus |
| 도구 | Read, Grep, Glob, Write |
| 색상 | Yellow |

**역할:** 사용자 요청·기획 문서·회의록·기존 코드에서 기능(FR)·비기능(NFR) 요구사항을 도출하고 구조화한다.

**언제 사용하나:**
- 새 기능 개발이나 시스템 설계에 착수하기 **전**
- "요구사항 정리/분석/명세화" 요청이 있을 때 (PROACTIVELY 사용)

**출력:** `docs/handoff/01_requirements.md`
- 기능 요구사항 테이블 (ID / 우선순위 MoSCoW / 수용 기준 Given-When-Then / 출처)
- 비기능 요구사항 테이블
- 이슈(모호·충돌·누락), 미확정 사항(최대 10개), 다음 단계 인계

**핵심 원칙:**
- 모든 요구사항에 출처(파일:라인, 문서명, 사용자 발화)를 표기
- 확인된 것은 `[확인]`, 맥락 추론은 `[추정]`으로 구분
- 설계안·기술 선택·코드는 절대 작성하지 않음

---

### 2. `architect` — 시스템 설계 전문가

| 항목 | 내용 |
|---|---|
| 파일 | `architect.md` |
| 모델 | Claude Opus |
| 도구 | Read, Grep, Glob, Write |

**역할:** 검증을 통과한 요구사항 명세를 입력으로 받아, 기존 코드베이스 구조와 기술 스택에 맞는 아키텍처·데이터 모델·API·모듈 설계를 작성한다.

**언제 사용하나:**
- `requirements-verifier` Mode A가 **PASS**를 반환한 직후
- `03a_verification.md`가 FAIL이면 즉시 종료하고 사용자에게 보고

**출력:** `docs/handoff/02_design.md`
- 아키텍처 구성도 (Mermaid)
- ADR 형식 설계 결정, 데이터 모델, API 인터페이스, 모듈·파일 구성
- 추적성 매트릭스 (요구사항 ID ↔ 설계 요소)
- 위험·승인 필요 사항 (DB 변경, 신규 라이브러리 도입 제안)

**핵심 원칙:**
- 모든 설계 요소에 요구사항 ID(FR/NFR)를 반드시 연결
- 기존 디렉터리 구조·기술 스택 먼저 파악 후 확장 방향으로 설계
- 신규 라이브러리는 "도입 제안"으로 분리, 사용자 승인 필요
- 구현 코드 작성 금지 (인터페이스 시그니처·스키마 예시는 허용)

---

### 3. `requirements-verifier` — 독립 검증 전문가

| 항목 | 내용 |
|---|---|
| 파일 | `requirements-verifier.md` |
| 모델 | Claude Opus |
| 도구 | Read, Grep, Glob, Write |

**역할:** 작성자의 결론을 신뢰하지 않고 원본 근거를 직접 재확인해 판정한다. 문서를 수정하지 않으며 발견 사항과 판정만 보고한다.

**모드 자동 판별:**

| 조건 | 모드 | 출력 파일 |
|---|---|---|
| `02_design.md` 없음 | Mode A (요구사항 게이트) | `03a_verification.md` |
| `02_design.md` 있음 | Mode B (추적성 검증) | `03b_verification.md` |

> 호출 지시에 모드를 명시하면 자동 판별보다 우선합니다.

**판정 기준:**

| 판정 | 조건 |
|---|---|
| **PASS** | Critical 0건, Major 0건 |
| **CONDITIONAL** | Critical 0건, Major 1건 이상 (조건 해소 후 진행) |
| **FAIL** | Critical 1건 이상 |

**심각도 분류:**
- **Critical:** 근거 조작·불일치, Must 요구사항 누락/미대응, 보안 결함
- **Major:** 검증 불가능한 요구사항, 충돌 미해소, 부분 대응
- **Minor:** 표현 모호, 형식 위반, 출처 표기 누락(내용은 맞음)

**핵심 원칙:**
- Must 항목 전수 확인, 나머지 최소 30% 이상 확인 후 비율 보고
- 문서 직접 수정 금지 (보고만 함)
- 확인 불가 항목은 "검증 불가"로 분류, 이유 명시

---

### 4. `notion-api-database-export` — Notion API 연동 전문가

| 항목 | 내용 |
|---|---|
| 파일 | `notion-api-database-export.md` |
| 모델 | Claude Sonnet |
| 도구 | 모든 도구 (`*`) |

**역할:** Notion API를 활용한 데이터베이스 조회·렌더링·내보내기 웹 애플리케이션 개발을 전담한다.

**언제 사용하나:**
- Notion 데이터베이스를 웹사이트/앱에 연동할 때
- Notion 페이지 콘텐츠를 외부 앱에서 렌더링할 때
- Notion 데이터 내보내기·동기화 기능 구현 시

**주요 기능:**
- `@notionhq/client` 기반 데이터베이스 조회 패턴
- 프로퍼티 타입별(title, rich_text, select, number, date 등) 추출 헬퍼
- ISR(증분 정적 재생성) 활용 콘텐츠 캐싱
- cursor 기반 페이지네이션
- Notion 블록 타입별 렌더링 컴포넌트
- TanStack Query 연동 클라이언트 사이드 패칭

**핵심 원칙:**
- Notion API 키는 반드시 서버사이드에서만 사용 (클라이언트 노출 금지)
- 프로젝트 기술 스택(Next.js 16, TailwindCSS v4, `@base-ui/react`) 준수
- 주석은 한국어, 변수명/함수명은 영어(camelCase)

---

## 체인 실행 프롬프트 예시

```
다음 순서로 진행해. 각 단계가 끝나면 결과 요약을 보여줘.

1. requirements-analyst로 docs/meeting/ 회의록과 src/를 분석해
   재고관리 모듈 개선 요구사항 작성

2. requirements-verifier를 Mode A로 실행
   - FAIL/CONDITIONAL이면 조치 요청을 반영해 1단계 재실행(최대 2회)
   - 그래도 안 되면 멈추고 보고

3. PASS면 architect로 설계 작성

4. requirements-verifier를 Mode B로 실행
   - FAIL이면 architect 재실행(최대 2회)

5. 최종적으로 판정 결과, 미확정 사항, 승인 필요 사항
   (DB 변경·신규 라이브러리)을 정리해 보고
```

---

## 산출물 위치

```
docs/handoff/
├── 01_requirements.md     # requirements-analyst 출력
├── 02_design.md           # architect 출력
├── 03a_verification.md    # requirements-verifier Mode A 출력
└── 03b_verification.md    # requirements-verifier Mode B 출력
```

---

## 사용 방법

### 프롬프트 구조

체인 실행 프롬프트는 **1번 항목만 바꾸고 2~5번은 고정**으로 사용합니다.

```
다음 순서로 에이전트 체인을 실행해. 각 단계 완료 후 결과 요약을 보여줘.

1. requirements-analyst 에이전트로
   [분석할 파일/폴더 경로]를 분석해
   [기능명] 요구사항을 docs/handoff/01_requirements.md에 작성해

2. requirements-verifier 에이전트를 Mode A로 실행해
   - CONDITIONAL이면 analyst에게 조치 요청을 반영해 재실행 (최대 2회)
   - FAIL이면 체인을 멈추고 나에게 보고해
   - PASS면 다음 단계로 진행해

3. architect 에이전트로 설계를 작성해
   docs/handoff/02_design.md에 저장해

4. requirements-verifier 에이전트를 Mode B로 실행해
   - FAIL이면 architect에게 조치 요청을 반영해 재실행 (최대 2회)

5. 완료 후 다음을 정리해 보고해:
   - 최종 판정 결과 (A/B 모두)
   - 미확정 사항 목록
   - 사용자 승인이 필요한 항목 (DB 변경, 신규 라이브러리 등)
```

### 1번 항목 작성 방법

매번 바꾸는 부분은 두 줄뿐입니다.

| 항목 | 설명 | 예시 |
|---|---|---|
| `[분석할 파일/폴더 경로]` | 에이전트가 읽을 소스 | `app/, components/, CLAUDE.md` |
| `[기능명]` | 개발할 기능 이름 | `사용자 인증(로그인/회원가입)` |

### 기능별 작성 예시

| 기능 | 1번 항목 |
|---|---|
| 사용자 인증 | `app/, components/, CLAUDE.md`를 분석해 **사용자 인증(로그인/회원가입)** 요구사항을 |
| 게시판/댓글 | `app/, components/`를 분석해 **게시판·댓글 CRUD** 요구사항을 |
| 파일 업로드 | `app/, components/`를 분석해 **이미지·문서 업로드** 요구사항을 |
| 알림 시스템 | `app/, components/`를 분석해 **실시간 알림** 요구사항을 |
| 회의록 기반 | `docs/meeting/sprint3.md, app/`를 분석해 **○○ 기능** 요구사항을 |

### 검증 결과별 대응

| 판정 | 의미 | 대응 |
|---|---|---|
| **PASS** | Critical·Major 0건 | 다음 단계 진행 |
| **CONDITIONAL** | Major 1건 이상 | 조치 후 해당 단계 재실행 (최대 2회) |
| **FAIL** | Critical 1건 이상 | 체인 중단 → 사용자에게 보고 |
