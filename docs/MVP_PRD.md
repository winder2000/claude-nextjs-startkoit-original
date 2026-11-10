# Notion 기반 견적서 관리 & 웹 공유 시스템 — MVP PRD

> 작성일: 2026-11-10  
> 대상 독자: 1인 개발자 (본인)  
> 범위: MVP — 견적서 관리 대시보드 + 클라이언트 웹 공유 + PDF 다운로드

---

## 1. 프로젝트 개요

### 목적

Notion DB를 백엔드로 활용해 견적서를 작성·관리하고, 고유 URL로 클라이언트와 공유하는 1인 운영 시스템.  
별도 PDF 편집기·외부 도구 없이 Notion 데이터 입력 → 웹 공유 → PDF 저장까지 하나의 흐름으로 단순화한다.

### 대상 사용자

| 역할 | 설명 |
|------|------|
| 운영자 (관리자) | 견적서를 발행하는 프리랜서·소규모 사업자. 엑셀로 업체/물품 데이터를 불러오고 웹에서 견적서를 작성 |
| 클라이언트 (수신자) | 운영자가 보낸 URL로 견적서를 확인하고 PDF를 저장하는 고객. 로그인 불필요 |

### 핵심 가치

- **운영자**: Notion + 웹 UI만으로 견적서 작성 완료. 엑셀로 업체/물품 초기 데이터 세팅 가능
- **클라이언트**: 로그인 없이 URL 하나로 견적서 확인 및 PDF 다운로드

---

## 2. 사용자 여정

```
[관리자 여정]

1. 로그인 페이지 → 패스워드 입력
   ↓
2. 관리자 대시보드 (현황 요약, 최근 견적서)
   ↓
   [A] 엑셀 업로드 → 업체/물품 임포트 → Notion DB 저장 → 대시보드로 복귀
   [B] 새 견적서 작성 → 업체 선택 → 물품 추가 → 금액 확인 → 저장
   ↓
3. 견적서 상세 → "URL 복사" 버튼 클릭
   ↓
4. 클라이언트에게 URL 전달

[클라이언트 여정]

1. 공유 URL /invoice/[id] 접속 (로그인 불필요)
   ↓
2. 견적서 웹 페이지 확인
   ↓
3. "PDF 다운로드" 버튼 클릭 → 브라우저 인쇄 다이얼로그 → PDF 저장
```

---

## 3. 기능 요구사항

우선순위 정의:
- **P0** — MVP 출시의 필수 조건. 없으면 서비스 불가
- **P1** — 사용성에 직접 영향. MVP에 포함 권장
- **P2** — Nice-to-have. MVP 이후에 추가

### P0 — 반드시 구현

| ID | 기능명 | 상세 설명 |
|----|--------|-----------|
| F001 | 관리자 인증 | 환경변수 `ADMIN_PASSWORD`와 비교하는 패스워드 로그인. HttpOnly 쿠키 세션. `/admin/*` 미인증 접근 시 `/login` 리디렉션 |
| F002 | 견적서 작성 | 업체 선택 드롭다운 + 물품 행 추가/삭제 + 금액 자동 계산 → Notion invoices + invoice_items DB에 저장 |
| F003 | 견적서 공개 뷰 | `/invoice/[id]` — 로그인 없이 UUID URL로 접근. 인쇄용 A4 레이아웃 렌더링 |
| F004 | PDF 다운로드 | 공개 뷰 페이지에서 `window.print()` + `@media print` CSS로 PDF 저장. 헤더/버튼 숨김 처리 |
| F005 | 견적서 목록 | `/admin/invoices` — 전체 견적서 목록. 상태 필터(Draft/Sent/Accepted/Rejected) |

### P1 — 사용성 향상 (MVP 포함 권장)

| ID | 기능명 | 상세 설명 |
|----|--------|-----------|
| F006 | 대시보드 현황 | 상태별 견적서 카운트 카드, 이번 달 견적 금액 합계, 최근 5건 목록 |
| F007 | 견적서 상세 (관리자) | 견적서 전체 내용 렌더링 + 상태 변경 드롭다운 + 공개 URL 표시 + URL 복사 버튼 |
| F008 | 엑셀 임포트 | `.xlsx` 파일 업로드 → 파싱 미리보기 → 업체/물품 Notion DB 일괄 저장 (upsert) |
| F009 | 로딩/에러 UI | Skeleton 컴포넌트, Notion API 오류 시 에러 메시지, 404 처리 |

### P2 — MVP 이후

| ID | 기능명 |
|----|--------|
| F010 | 견적서 수정/삭제 |
| F011 | 견적서 URL 복사 버튼 (공개 뷰) |
| F012 | 견적서 만료일 경고 표시 |
| F013 | 클라이언트 열람 여부 확인 (조회 카운터) |
| F014 | 이메일 자동 발송 |
| F015 | 클라이언트 디지털 서명 |

---

## 4. 비기능 요구사항

### 성능

- 견적서 공개 뷰 FCP: 2초 이내 (Next.js ISR `revalidate = 60` 활용)
- 엑셀 임포트: 최대 100행 처리 가능
- Notion API Rate Limit 대응: 순차 처리 + 요청 간 350ms 딜레이

### 보안

- `NOTION_API_KEY`, `ADMIN_PASSWORD` 등 모든 민감 정보는 `.env.local`에만 보관
- Notion API는 Server Component / API Route에서만 호출 (클라이언트 노출 금지)
- 관리자 세션: HttpOnly 쿠키, 만료 24시간
- 공개 뷰 URL: Notion 페이지 UUID 활용 (128bit 엔트로피, 추측 불가)
- MVP에는 별도 클라이언트 인증 없음 (UUID 기반 비공개 URL에 의존)

### 접근성

- 공개 뷰: 시맨틱 HTML 테이블 (`<table>/<thead>/<tbody>`) 사용 (스크린리더 호환)
- 색상 대비 WCAG AA 준수 (인쇄 레이아웃 포함)
- 이미지에 `alt` 속성 제공

### 운영

- 환경변수 6개로 설정 완료: `NOTION_API_KEY`, `NOTION_VENDORS_DB_ID`, `NOTION_PRODUCTS_DB_ID`, `NOTION_INVOICES_DB_ID`, `NOTION_INVOICE_ITEMS_DB_ID`, `ADMIN_PASSWORD`
- Vercel 무료 플랜 배포 가능

---

## 5. Notion 데이터베이스 스키마

### 5-1. vendors (업체/발주처)

| 필드명 | Notion 타입 | 설명 | 필수 |
|--------|------------|------|------|
| `name` | `title` | 업체명 (고유 식별자 역할) | O |
| `contact_name` | `rich_text` | 담당자명 | - |
| `phone` | `phone_number` | 연락처 | - |
| `email` | `email` | 이메일 | - |
| `business_number` | `rich_text` | 사업자번호 (000-00-00000) | - |
| `address` | `rich_text` | 주소 | - |
| `created_at` | `created_time` | 등록일 (자동) | - |
| `updated_at` | `last_edited_time` | 수정일 (자동) | - |

### 5-2. products (물품/제품)

| 필드명 | Notion 타입 | 설명 | 필수 |
|--------|------------|------|------|
| `name` | `title` | 물품명 | O |
| `model` | `rich_text` | 규격/모델명 | - |
| `unit` | `select` | 단위 (EA/SET/M/KG/L/BOX/기타) | O |
| `unit_price` | `number` | 기본 단가 (원) | O |
| `category` | `select` | 카테고리 (선택적) | - |
| `created_at` | `created_time` | 등록일 (자동) | - |
| `updated_at` | `last_edited_time` | 수정일 (자동) | - |

### 5-3. invoices (견적서)

| 필드명 | Notion 타입 | 설명 | 필수 |
|--------|------------|------|------|
| `invoice_number` | `title` | 견적서 번호 (예: INV-2026-001) | O |
| `vendor` | `relation` | vendors DB relation (N:1) | O |
| `issue_date` | `date` | 발행일 | O |
| `expiry_date` | `date` | 유효기간 만료일 | O |
| `subtotal` | `number` | 소계 (부가세 전, 서버에서 계산 후 기록) | O |
| `tax_amount` | `number` | 부가세 (subtotal × 0.1) | O |
| `total_amount` | `number` | 합계 (subtotal + tax_amount) | O |
| `status` | `select` | Draft / Sent / Accepted / Rejected | O |
| `memo` | `rich_text` | 비고/메모 | - |
| `created_at` | `created_time` | 생성일 (자동) | - |
| `updated_at` | `last_edited_time` | 수정일 (자동) | - |

> **금액 계산 전략**: Notion Formula는 별도 DB relation 항목 집계 불가. `invoice_items` 저장 완료 후 서버에서 `SUM(amount)`를 계산해 `subtotal/tax_amount/total_amount`에 직접 기록.

### 5-4. invoice_items (견적 항목)

| 필드명 | Notion 타입 | 설명 | 필수 |
|--------|------------|------|------|
| `name` | `title` | 항목 식별자 (예: INV-001-01, 자동 생성) | O |
| `invoice` | `relation` | invoices DB relation (N:1) | O |
| `product` | `relation` | products DB relation (N:1) | O |
| `product_name` | `rich_text` | 물품명 스냅샷 (products 변경 대비 복사본) | O |
| `model` | `rich_text` | 규격 스냅샷 | - |
| `unit` | `select` | 단위 스냅샷 | O |
| `quantity` | `number` | 수량 | O |
| `unit_price` | `number` | 적용 단가 (products.unit_price와 다를 수 있음) | O |
| `amount` | `number` | 금액 (quantity × unit_price, 서버 계산) | O |
| `sort_order` | `number` | 항목 정렬 순서 | O |

> **스냅샷 패턴**: `product_name`, `model`, `unit` 필드를 복사 저장. products DB 수정 후에도 과거 견적서 내용 보존.

### DB 관계 구조

```
vendors  ◄──────────── invoices
  1                        N
                           │
                   1       │
invoice_items ─────────────┘
     N
     │
     ▼
  products (N:1)
```

---

## 6. 화면 구성

### 페이지 목록

| 경로 | 파일 | 설명 | 인증 |
|------|------|------|------|
| `/login` | `app/login/page.tsx` | 관리자 로그인 | 불필요 |
| `/admin` (redirect) | — | `/admin/dashboard`로 리디렉션 | 필요 |
| `/admin/dashboard` | `app/admin/dashboard/page.tsx` | 현황 요약 대시보드 | 필요 |
| `/admin/invoices` | `app/admin/invoices/page.tsx` | 견적서 목록 + 상태 필터 | 필요 |
| `/admin/invoices/new` | `app/admin/invoices/new/page.tsx` | 견적서 작성 폼 | 필요 |
| `/admin/invoices/[id]` | `app/admin/invoices/[id]/page.tsx` | 견적서 상세 (관리자용) | 필요 |
| `/admin/import` | `app/admin/import/page.tsx` | 엑셀 임포트 (업체/물품) | 필요 |
| `/invoice/[id]` | `app/invoice/[id]/page.tsx` | 견적서 공개 뷰 (클라이언트용) | 불필요 |
| `not-found` | `app/not-found.tsx` | 404 처리 | — |

### 주요 컴포넌트

| 컴포넌트 | 경로 | 설명 |
|---------|------|------|
| `InvoiceHeader` | `components/invoice/invoice-header.tsx` | 견적서 상단: 번호, 날짜, 상태 배지 |
| `InvoiceParties` | `components/invoice/invoice-parties.tsx` | 발행자·수신자(업체) 정보 |
| `InvoiceItemsTable` | `components/invoice/invoice-items-table.tsx` | 견적 항목 테이블 |
| `InvoiceSummary` | `components/invoice/invoice-summary.tsx` | 소계/세금/합계 요약 |
| `InvoiceNotes` | `components/invoice/invoice-notes.tsx` | 메모/특이사항 |
| `PdfDownloadButton` | `components/invoice/pdf-download-button.tsx` | PDF 다운로드 버튼 (Client Component) |
| `InvoiceStatusBadge` | `components/invoice/invoice-status-badge.tsx` | 상태 배지 |
| `InvoiceSkeleton` | `components/invoice/invoice-skeleton.tsx` | 로딩 Skeleton UI |
| `InvoiceForm` | `components/invoice/invoice-form.tsx` | 견적서 작성 폼 (Client Component) |
| `ExcelImporter` | `components/admin/excel-importer.tsx` | 엑셀 업로드 + 미리보기 (Client Component) |
| `DashboardStats` | `components/admin/dashboard-stats.tsx` | 현황 카드 (상태별 카운트, 월합계) |

---

## 7. 엑셀 업로드 스펙

### 업체 엑셀 (vendors.xlsx)

| 헤더 | 필드 매핑 | 필수 | 형식 예시 |
|------|----------|------|----------|
| 업체명 | `name` | O | (주)한국물산 |
| 담당자 | `contact_name` | - | 홍길동 |
| 연락처 | `phone` | - | 010-1234-5678 |
| 이메일 | `email` | - | contact@example.com |
| 사업자번호 | `business_number` | - | 123-45-67890 |
| 주소 | `address` | - | 서울시 강남구 |

### 물품 엑셀 (products.xlsx)

| 헤더 | 필드 매핑 | 필수 | 형식 예시 |
|------|----------|------|----------|
| 물품명 | `name` | O | A4 복사용지 |
| 규격 | `model` | - | 80g, 500매 |
| 단위 | `unit` | O | BOX (EA/SET/M/KG/L/BOX 중 하나) |
| 단가 | `unit_price` | O | 25000 (숫자만, 콤마 허용) |
| 카테고리 | `category` | - | 사무용품 |

### 업로드 흐름

1. 클라이언트: `xlsx` 라이브러리로 파싱 → 미리보기 테이블 표시 (최대 10행)
2. 유효성 오류 행 하이라이트 표시
3. "임포트 실행" 버튼 → `POST /api/vendors/bulk` 또는 `POST /api/products/bulk`
4. 서버: `name` 기준 중복 조회 후 upsert (없으면 create, 있으면 update)
5. Rate Limit 대응: 순차 처리 + 350ms 딜레이
6. 결과 반환: `{ created, updated, failed[] }` → 토스트 표시

---

## 8. 기술 아키텍처

### 데이터 흐름

```
[관리자 뷰 — /admin/*]
브라우저 → Next.js Server Component → Notion API (서버 전용)
                                           ↓
                                     4개 DB CRUD

[공개 뷰 — /invoice/[id]]
브라우저 → Next.js Server Component (ISR revalidate=60)
         → Notion API → invoices + invoice_items + vendors 조회
         → 렌더링 완료 → 클라이언트: window.print() → PDF
```

### 주요 파일 구조

```
invoice-web/
├── app/
│   ├── login/
│   │   └── page.tsx                      # 관리자 로그인
│   ├── admin/
│   │   ├── dashboard/page.tsx            # 현황 대시보드
│   │   ├── invoices/
│   │   │   ├── page.tsx                  # 목록 + 필터
│   │   │   ├── new/
│   │   │   │   ├── page.tsx              # 작성 페이지 (Server)
│   │   │   │   └── new-client.tsx        # 작성 폼 (Client)
│   │   │   └── [id]/
│   │   │       ├── page.tsx              # 상세 (Server)
│   │   │       └── detail-client.tsx     # URL 복사 등 (Client)
│   │   └── import/
│   │       ├── page.tsx                  # 임포트 페이지 (Server)
│   │       └── import-client.tsx         # 파일 업로드 UI (Client)
│   ├── invoice/
│   │   └── [id]/
│   │       ├── page.tsx                  # 공개 뷰 (Server, ISR)
│   │       └── invoice-client.tsx        # PDF 버튼 (Client)
│   ├── api/
│   │   ├── auth/route.ts                 # 로그인 Server Action
│   │   ├── vendors/bulk/route.ts         # 업체 일괄 upsert
│   │   └── products/bulk/route.ts        # 물품 일괄 upsert
│   ├── not-found.tsx
│   └── globals.css                       # @media print 스타일 포함
├── components/
│   ├── invoice/                          # 견적서 렌더링 컴포넌트
│   └── admin/                            # 관리자 전용 컴포넌트
├── lib/
│   ├── notion.ts                         # Notion 클라이언트 초기화
│   ├── notion-api.ts                     # 4개 DB CRUD 함수
│   ├── notion-helpers.ts                 # 프로퍼티 추출 헬퍼
│   └── utils.ts                          # cn + 금액 포맷 함수
├── types/
│   └── invoice.ts                        # Vendor, Product, Invoice, InvoiceItem 타입
├── middleware.ts                          # /admin/* 인증 체크
└── .env.local
```

### 환경 변수

```bash
# .env.local
NOTION_API_KEY=secret_xxxx
NOTION_VENDORS_DB_ID=xxxx-xxxx-xxxx
NOTION_PRODUCTS_DB_ID=xxxx-xxxx-xxxx
NOTION_INVOICES_DB_ID=xxxx-xxxx-xxxx
NOTION_INVOICE_ITEMS_DB_ID=xxxx-xxxx-xxxx
ADMIN_PASSWORD=your_secure_password
```

### TypeScript 주요 타입

```typescript
// types/invoice.ts

type NotionBase = { id: string; createdAt: string; updatedAt: string }

export type Vendor = NotionBase & {
  name: string; contactName: string; phone: string
  email: string; businessNumber: string; address: string
}

export type Product = NotionBase & {
  name: string; model: string
  unit: "EA" | "SET" | "M" | "KG" | "L" | "BOX" | "기타"
  unitPrice: number; category: string | null
}

export type InvoiceStatus = "Draft" | "Sent" | "Accepted" | "Rejected"

export type Invoice = NotionBase & {
  invoiceNumber: string; vendorId: string; vendorName: string
  issueDate: string; expiryDate: string
  subtotal: number; taxAmount: number; totalAmount: number
  status: InvoiceStatus; memo: string
}

export type InvoiceDetail = Invoice & { vendor: Vendor; items: InvoiceItem[] }

export type InvoiceItem = NotionBase & {
  invoiceId: string; productId: string
  productName: string; model: string; unit: string
  quantity: number; unitPrice: number; amount: number; sortOrder: number
}
```

### PDF 생성 전략

| 방법 | 장점 | 단점 | 결정 |
|------|------|------|------|
| **Option A: `window.print()`** | 추가 패키지 없음, 빠름 | 파일명 지정 불가, 인쇄 다이얼로그 경유 | **MVP 채택** |
| Option B: `html2canvas + jsPDF` | 파일명 자동 지정 가능 | +500KB, 한글 폰트 별도 처리 필요 | MVP 이후 전환 |

---

## 9. MVP 범위

### In Scope ✅

- [x] 관리자 패스워드 인증 (HttpOnly 쿠키)
- [x] 견적서 작성 (업체 선택, 물품 추가, 금액 자동 계산) → Notion 저장
- [x] 견적서 목록 (상태 필터)
- [x] 견적서 상세 + 공개 URL 복사
- [x] 견적서 공개 뷰 (`/invoice/[id]`, 로그인 불필요)
- [x] PDF 다운로드 (`window.print()` + `@media print`)
- [x] 엑셀 → 업체/물품 Notion DB 일괄 임포트
- [x] 관리자 대시보드 현황 카드

### Out of Scope ❌

- [ ] 견적서 수정/삭제 (Notion에서 직접 편집)
- [ ] 이메일 자동 발송
- [ ] 클라이언트 디지털 서명
- [ ] 복수 관리자 계정
- [ ] 서버사이드 PDF 생성 (Puppeteer 등)
- [ ] 다국어 지원
- [ ] 모바일 반응형 최적화 (관리자 뷰)

---

## 10. 개발 순서

| 단계 | 작업 | 파일 |
|------|------|------|
| 1 | Notion 워크스페이스에 4개 DB 생성 + Relation 연결 | Notion 직접 작업 |
| 2 | 환경 변수 설정 | `.env.local` |
| 3 | Notion 클라이언트 + CRUD 함수 | `lib/notion.ts`, `lib/notion-api.ts`, `lib/notion-helpers.ts` |
| 4 | TypeScript 타입 정의 | `types/invoice.ts` |
| 5 | 관리자 인증 (로그인 + middleware) | `app/login/page.tsx`, `middleware.ts` |
| 6 | 견적서 작성 폼 | `app/admin/invoices/new/` |
| 7 | 견적서 공개 뷰 + PDF 다운로드 | `app/invoice/[id]/`, `globals.css` |
| 8 | 견적서 목록 + 상세 (관리자) | `app/admin/invoices/` |
| 9 | 엑셀 임포트 | `app/admin/import/`, `app/api/vendors/bulk/`, `app/api/products/bulk/` |
| 10 | 관리자 대시보드 | `app/admin/dashboard/` |
| 11 | 404 + 에러 처리 | `app/not-found.tsx`, error boundaries |
| 12 | Vercel 배포 + 환경 변수 설정 | — |

---

## 11. 성공 지표 (완료 기준)

### 기능 완료

- [ ] 관리자 로그인/로그아웃 동작 확인
- [ ] `/admin/*` 미인증 접근 시 `/login` 리디렉션
- [ ] 견적서 작성 후 Notion DB에 `invoices` + `invoice_items` 행 생성 확인
- [ ] 작성된 견적서 `/invoice/[id]` 로그인 없이 접근 가능
- [ ] PDF 다운로드 버튼 클릭 시 인쇄 다이얼로그 열림, 헤더/버튼 숨김 확인
- [ ] 업체 엑셀 (5행 이상) 업로드 후 Notion vendors DB에 반영 확인
- [ ] 물품 엑셀 (5행 이상) 업로드 후 Notion products DB에 반영 확인
- [ ] 대시보드 상태별 카운트가 Notion 실제 데이터와 일치
- [ ] 존재하지 않는 `/invoice/[id]` 접근 시 404 페이지 표시

### 품질 완료

- [ ] `tsc --noEmit` 에러 없음
- [ ] `npm run lint` 에러 없음
- [ ] `npm run build` 성공

### 배포 완료

- [ ] Vercel 배포 후 공개 URL로 견적서 접근 가능
- [ ] 클라이언트에게 URL 전달 → 로그인 없이 견적서 확인 및 PDF 저장 가능

---

*이 문서는 MVP 구현의 기준 문서입니다. 범위 변경 시 이 파일을 업데이트하세요.*
