# Notion 기반 견적서 웹 공유 & PDF 다운로드 시스템 — MVP PRD

> 작성일: 2026-11-10
> 대상 독자: 1인 개발자 (본인)
> 범위: MVP (인증 없음, 조회·PDF 다운로드만)

---

## 1. 프로젝트 개요

### 목적

Notion 데이터베이스에 입력된 견적서를 클라이언트가 별도 계정 없이 웹 URL로 열람하고 PDF로 저장할 수 있게 한다.
Notion 외부 도구나 PDF 편집기를 사용하지 않고, 견적서 발행·공유·저장을 하나의 흐름으로 단순화한다.

### 대상 사용자

| 역할 | 설명 |
|------|------|
| 운영자 (견적 작성자) | Notion에서 견적서를 작성하는 프리랜서·소규모 사업자 |
| 클라이언트 (견적 수신자) | 운영자가 보낸 URL로 견적서를 확인하고 PDF를 저장하는 고객 |

### 핵심 가치

- 운영자: Notion만으로 견적서 작성 완료, 별도 PDF 도구 불필요
- 클라이언트: 로그인 없이 URL 하나로 견적서 확인 및 PDF 다운로드

---

## 2. 기능 요구사항

우선순위 정의:
- **P0** — MVP 출시의 필수 조건. 없으면 서비스 불가
- **P1** — 사용성에 직접 영향. MVP에 포함 권장
- **P2** — Nice-to-have. MVP 이후에 추가

### P0 — 반드시 구현

| ID | 기능 | 상세 설명 |
|----|------|-----------|
| F001 | Notion DB 견적서 조회 | `@notionhq/client`로 특정 페이지 ID의 견적서 데이터를 서버에서 조회 |
| F002 | 견적서 웹 렌더링 | `/invoice/[id]` 경로에서 견적서 내용을 인쇄용 레이아웃으로 렌더링 |
| F003 | 클라이언트 사이드 PDF 다운로드 | 브라우저에서 `window.print()` 또는 `html2canvas + jsPDF`로 PDF 저장 |
| F004 | 존재하지 않는 견적서 처리 | 잘못된 ID 접근 시 404 페이지 또는 안내 메시지 표시 |

### P1 — 사용성 향상

| ID | 기능 | 상세 설명 |
|----|------|-----------|
| F005 | 견적서 목록 페이지 | `/invoices` 경로에서 Notion DB의 Sent 상태 견적서 목록 표시 (내부용) |
| F006 | 견적서 상태 표시 | Draft / Sent / Accepted / Rejected 배지 표시 |
| F007 | 로딩 스켈레톤 | 데이터 패칭 중 Skeleton 컴포넌트로 UX 보호 |
| F008 | 에러 상태 처리 | Notion API 오류 시 사용자 친화적 에러 메시지 표시 |

### P2 — MVP 이후

| ID | 기능 |
|----|------|
| F009 | URL 복사 버튼 (클립보드) |
| F010 | 견적서 만료일 표시 및 경고 |
| F011 | 조회 횟수 집계 (Notion DB에 카운터 필드 추가) |
| F012 | 견적서 미리보기 썸네일 |

---

## 3. 비기능 요구사항

### 성능

- Notion API 응답 캐싱: Next.js Route Cache (`revalidate`) 또는 TanStack Query staleTime 활용
- 첫 콘텐츠 렌더링(FCP): 목표 2초 이내 (Vercel + CDN 가정)
- PDF 생성: 클릭 후 5초 이내 완료

### 보안

- Notion API 키는 `.env.local`에 보관, 클라이언트에 절대 노출 금지
- Server Component에서만 Notion API 호출 (API 키 서버 측 격리)
- 견적서 ID는 Notion 페이지 UUID를 그대로 사용 — 추측이 어렵지만 비밀 URL에 의존한 접근 제어임을 인지할 것
- MVP에는 별도 인증 없음. 필요 시 P2에서 비밀번호 보호 고려

### 접근성

- 인쇄용 레이아웃에 `@media print` CSS 적용 (헤더·버튼 숨김)
- 색상 대비 WCAG AA 준수
- 이미지에 `alt` 속성 제공

### 운영

- 환경 변수 2개로만 설정 완료: `NOTION_API_KEY`, `NOTION_DATABASE_ID`
- Vercel 무료 플랜 배포 가능 (서버리스 함수 사용량 최소화)

---

## 4. Notion 데이터베이스 스키마

### 견적서 데이터베이스 (invoices)

| 필드명 | Notion 타입 | 설명 | 필수 |
|--------|------------|------|------|
| `title` | title | 견적서 번호 (예: INV-2026-001) | O |
| `client_name` | rich_text | 클라이언트 회사명 또는 개인명 | O |
| `issue_date` | date | 견적 발행일 | O |
| `expiry_date` | date | 견적 유효기간 만료일 | O |
| `issuer_info` | rich_text | 발행자 이름, 연락처, 사업자번호 등 | O |
| `subtotal` | number | 공급가액 합계 (원) | O |
| `tax` | number | 부가세 (원) | O |
| `total` | number | 최종 합계 금액 (원) | O |
| `notes` | rich_text | 메모, 특이사항, 결제 조건 등 | - |
| `status` | select | Draft / Sent / Accepted / Rejected | O |

### 견적 항목 데이터베이스 (invoice_items)

> 별도 데이터베이스로 관리하거나, 견적서 페이지의 하위 블록(테이블)으로 처리 가능.
> MVP에서는 하위 블록(Notion 페이지 내 테이블)으로 단순화 권장.

| 필드명 | Notion 타입 | 설명 |
|--------|------------|------|
| `item_name` | title | 항목명 (예: 웹 디자인) |
| `quantity` | number | 수량 |
| `unit_price` | number | 단가 (원) |
| `amount` | formula | 수량 × 단가 (자동 계산) |
| `invoice_id` | relation | invoices 데이터베이스와 연결 |

---

## 5. 화면 구성

### 페이지 목록

| 경로 | 컴포넌트 파일 | 설명 |
|------|--------------|------|
| `/invoice/[id]` | `app/invoice/[id]/page.tsx` | 견적서 상세 (공개, 메인 기능) |
| `/invoice/[id]` (client) | `app/invoice/[id]/invoice-client.tsx` | PDF 다운로드 버튼 등 인터랙션 |
| `/invoices` | `app/invoices/page.tsx` | 견적서 목록 (내부 관리용, P1) |
| `/` | `app/page.tsx` | 홈 — `/invoice/[id]`로 안내 또는 빈 랜딩 |
| `not-found` | `app/not-found.tsx` | 404 처리 |

### 주요 컴포넌트 목록

| 컴포넌트 | 경로 | 설명 |
|---------|------|------|
| `InvoiceHeader` | `components/invoice/invoice-header.tsx` | 견적서 상단: 제목, 번호, 날짜, 상태 배지 |
| `InvoiceParties` | `components/invoice/invoice-parties.tsx` | 발행자·수신자 정보 블록 |
| `InvoiceItemsTable` | `components/invoice/invoice-items-table.tsx` | 견적 항목 테이블 |
| `InvoiceSummary` | `components/invoice/invoice-summary.tsx` | 소계 / 세금 / 합계 요약 |
| `InvoiceNotes` | `components/invoice/invoice-notes.tsx` | 메모·특이사항 |
| `PdfDownloadButton` | `components/invoice/pdf-download-button.tsx` | PDF 다운로드 버튼 (클라이언트 컴포넌트) |
| `InvoiceStatusBadge` | `components/invoice/invoice-status-badge.tsx` | 상태 배지 (Draft/Sent/Accepted/Rejected) |
| `InvoiceSkeleton` | `components/invoice/invoice-skeleton.tsx` | 로딩 중 Skeleton UI |

---

## 6. 기술 아키텍처

### 데이터 흐름

```
클라이언트 브라우저
  │  GET /invoice/[id]
  ▼
Next.js App Router (Server Component)
  │  서버에서 Notion API 호출
  │  NOTION_API_KEY (환경 변수, 클라이언트 비노출)
  ▼
Notion API  (api.notion.com)
  │  pages.retrieve(pageId)
  │  blocks.children.list(pageId)
  ▼
Next.js — 데이터를 props로 Client Component에 전달
  │  <InvoiceClientPage data={...} />
  ▼
브라우저 렌더링 완료
  │  "PDF 저장" 버튼 클릭
  ▼
클라이언트 사이드 PDF 생성 (window.print 또는 html2canvas + jsPDF)
  │
  ▼
PDF 파일 로컬 저장
```

### 주요 파일 구조

```
invoice-web/
├── app/
│   ├── invoice/
│   │   └── [id]/
│   │       ├── page.tsx              # Server Component — Notion 데이터 조회 + 메타데이터
│   │       └── invoice-client.tsx    # Client Component — PDF 버튼, 인터랙션
│   ├── invoices/
│   │   └── page.tsx                  # 목록 페이지 (P1)
│   ├── not-found.tsx                 # 전역 404
│   └── globals.css                   # @media print 스타일 포함
├── components/
│   └── invoice/                      # 견적서 전용 컴포넌트
│       ├── invoice-header.tsx
│       ├── invoice-parties.tsx
│       ├── invoice-items-table.tsx
│       ├── invoice-summary.tsx
│       ├── invoice-notes.tsx
│       ├── invoice-status-badge.tsx
│       ├── invoice-skeleton.tsx
│       └── pdf-download-button.tsx
├── lib/
│   ├── notion.ts                     # Notion 클라이언트 초기화 + 쿼리 함수
│   └── utils.ts                      # 기존 cn 유틸 + 금액 포맷 함수 추가
├── types/
│   └── invoice.ts                    # Invoice, InvoiceItem 타입 정의
└── .env.local                        # NOTION_API_KEY, NOTION_DATABASE_ID
```

### 환경 변수

```bash
# .env.local
NOTION_API_KEY=secret_xxxx            # Notion Integration 토큰
NOTION_DATABASE_ID=xxxx-xxxx-xxxx     # 견적서 데이터베이스 ID
```

### Notion 클라이언트 (`lib/notion.ts`) 주요 함수

| 함수 | 설명 |
|------|------|
| `getInvoice(pageId: string)` | 특정 페이지 ID의 견적서 데이터 조회 |
| `getInvoiceList()` | Sent 상태 견적서 목록 조회 (P1) |
| `formatNotionInvoice(page)` | Notion 응답 → `Invoice` 타입으로 변환 |

### PDF 생성 전략

MVP에서는 두 가지 방법 중 하나 선택:

**Option A — `window.print()` (권장, 의존성 없음)**
- `globals.css`에 `@media print` 블록 추가, 버튼·헤더 숨김
- 장점: 추가 패키지 없음, 브라우저 인쇄 품질 그대로 사용
- 단점: 파일명 지정 불가, 브라우저 인쇄 다이얼로그 경유

**Option B — `html2canvas + jsPDF`**
- 파일명 자동 지정 가능 (`INV-2026-001.pdf`)
- 장점: 버튼 한 번으로 즉시 다운로드
- 단점: 패키지 추가 (약 500KB), 한글 폰트 별도 처리 필요

> **결정**: Option A로 MVP 시작. 필요 시 Option B로 전환.

---

## 7. MVP 범위

### In Scope

- [x] Notion DB에서 견적서 단건 조회 (Server Component)
- [x] `/invoice/[id]` 웹 페이지 렌더링
- [x] 인쇄용 레이아웃 (`@media print` 최적화)
- [x] PDF 다운로드 버튼 (`window.print()`)
- [x] 404 처리 (잘못된 ID 접근)
- [x] 로딩/에러 상태 UI (P1 포함)
- [x] 견적서 목록 페이지 `/invoices` (P1 포함)

### Out of Scope (MVP 이후)

- [ ] 사용자 인증 / 로그인
- [ ] 견적서 생성·편집 (Notion에서 직접 편집)
- [ ] 이메일 발송 자동화
- [ ] 결제 연동
- [ ] 다국어 지원
- [ ] 견적서 조회 통계
- [ ] 비밀번호 보호 URL

---

## 8. 성공 지표 (완료 기준)

MVP가 완료되었다고 판단하는 체크리스트:

### 기능 완료 기준

- [ ] `NOTION_API_KEY`와 `NOTION_DATABASE_ID`만 설정하면 로컬에서 견적서 조회 가능
- [ ] `/invoice/[id]`에서 Notion 견적서 데이터가 정상 렌더링됨
- [ ] 항목 테이블, 합계 섹션, 발행자/수신자 정보가 올바르게 표시됨
- [ ] "PDF 저장" 버튼 클릭 시 인쇄 다이얼로그 또는 PDF 다운로드 동작
- [ ] `@media print`에서 버튼, 내비게이션이 숨겨지고 견적서만 출력됨
- [ ] 잘못된 ID로 접근 시 404 또는 에러 메시지 표시
- [ ] `npm run build` 에러 없이 성공

### 품질 기준

- [ ] TypeScript 컴파일 에러 없음 (`tsc --noEmit`)
- [ ] ESLint 에러 없음 (`npm run lint`)
- [ ] 모바일(375px) / 태블릿(768px) / 데스크톱(1280px) 레이아웃 정상 확인

### 배포 완료 기준

- [ ] Vercel 배포 후 공개 URL로 견적서 접근 가능
- [ ] 클라이언트에게 URL을 보내면 로그인 없이 견적서 확인 가능

---

## 9. 개발 순서 (참고)

> PRD 범위 내에서 의존성 순서에 따른 권장 구현 순서

1. `lib/notion.ts` — Notion 클라이언트 초기화, `getInvoice()` 함수 구현
2. `types/invoice.ts` — `Invoice`, `InvoiceItem` 타입 정의
3. `app/invoice/[id]/page.tsx` — Server Component, 데이터 조회 + 렌더링
4. `components/invoice/` — 각 하위 컴포넌트 순차 구현
5. `components/invoice/pdf-download-button.tsx` — PDF 다운로드 (Client Component)
6. `app/globals.css` — `@media print` 스타일 추가
7. `app/not-found.tsx` — 404 페이지
8. `app/invoices/page.tsx` — 목록 페이지 (P1)
9. Vercel 배포 + 환경 변수 설정

---

*이 문서는 MVP 구현의 기준 문서입니다. 범위 변경 시 이 파일을 업데이트하세요.*
