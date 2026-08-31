# SUPER GONGIK

모바일 우선, 게스트 우선의 사회복무요원 복무 관리 PWA입니다. 복무일·진행률·연가·보수 정보를 보여 주되, 확인되지 않은 정책값을 자동 계산하지 않는 것을 기본 원칙으로 삼습니다.

## Workspace

```text
apps/web             Next.js App Router PWA
packages/domain      날짜·복무 프로필·진행률의 순수 도메인 로직
packages/rules       버전 정책 선택과 설명 가능한 계산 계약
```

```bash
pnpm install
pnpm dev
pnpm check
```

`pnpm check`는 lint, formatting, typecheck, unit test, production build를 순서대로 실행합니다.

## 안전한 계산 원칙

- 날짜는 `Asia/Seoul`의 달력 날짜로 계산합니다.
- 21개월 일반 연가는 15일 + 13일, 총 28일입니다.
- 정책은 이벤트/지급 대상 날짜로 버전을 선택하며, 과거 정책을 최신 값으로 대체하지 않습니다.
- 2026년 중식비 9,000원은 제안값이며 프로필 확인 전에는 확정 보수에 포함하지 않습니다.
- 교통비는 통근비 또는 기관 승인 금액의 맥락이 없으면 계산을 거부합니다.
- 부분월 보수와 이전 복무 경력 인정은 검증된 규칙표가 추가되기 전까지 자동 계산하지 않습니다.

자세한 정책 출처와 미해결 검증 항목은 [docs](docs/) 및 [packages/rules/README.md](packages/rules/README.md)를 확인하세요.
