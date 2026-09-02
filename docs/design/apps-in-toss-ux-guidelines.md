# 앱인토스 UX/UI 반영 기준

확인일: 2026-09-02

공식 문서:

- [비게임 출시 가이드](https://developers-apps-in-toss.toss.im/checklist/app-nongame)
- [UI/UX 가이드](https://developers-apps-in-toss.toss.im/design/consumer-ux-guide)
- [토스 디자인 시스템](https://developers-apps-in-toss.toss.im/design/components)
- [TDS Button](https://tossmini-docs.toss.im/tds-mobile/components/button/)
- [TDS BottomCTA](https://tossmini-docs.toss.im/tds-mobile/components/BottomCTA/check-first/)
- [TDS ListRow](https://tossmini-docs.toss.im/tds-mobile/components/ListRow/list-row-overview/)
- [TDS Tab](https://tossmini-docs.toss.im/tds-mobile/components/tab/)
- [TDS Top](https://tossmini-docs.toss.im/tds-mobile/components/top/)

## 제품에 적용한 항목

### 구조와 탐색

- 앱인토스 호스트가 제공하는 상단 내비게이션과 충돌하지 않도록 제품 내부에 별도의 뒤로가기 버튼을 만들지 않는다.
- 모바일의 네 개 목적지인 홈, 캘린더, 보수, 내 정보를 유지하되, 토스 기본 하단 탭과 혼동하지 않도록 좌우와 하단에 여백을 둔 플로팅 탭바로 구현한다.
- 최초 화면에서 바텀시트, 모달, 알림 권한 요청을 자동으로 띄우지 않는다.
- 사용자가 선택할 수 없는 기능을 CTA로 약속하지 않는다. 일정 추가 기능이 준비되기 전에는 `일정 추가하기` 대신 `캘린더 보기`로 안내한다.

### 문구

- 제품 문구는 해요체를 사용한다.
- 가능한 경우 능동형과 긍정형으로 쓴다.
- CTA는 선택한 뒤 일어날 결과를 직접 설명한다. 예: `복무 현황 보기`, `보수 계산 조건 보기`, `캘린더 보기`.
- 정책 안전상 필요한 부정 표현은 숨기지 않는다. 부분월 보수, 검증되지 않은 규칙, 확인되지 않은 중식비와 교통비는 자동 계산하지 않는 상태를 명확히 유지한다.

### 화면과 상호작용

- 모바일 설계 기준은 390 × 740 논리 해상도로 잡고 360–420px 너비에서 같은 정보 구조를 유지한다.
- `env(safe-area-inset-*)`를 사용해 노치와 홈 인디케이터 영역을 보호한다.
- 모바일 미니앱은 라이트 모드를 기준으로 한다.
- 탭과 CTA의 최소 터치 영역은 44px 이상으로 유지한다.
- 아이콘은 한 위치에 하나만 사용하고 주요 아이콘 크기는 24–32px로 제한한다.
- 버튼은 강한 주요 행동과 약한 보조 행동의 위계를 분리한다.
- 이동 가능한 행은 ListRow처럼 왼쪽 의미 아이콘, 가운데 설명, 오른쪽 화살표 구조로 만들고 눌림 상태를 제공한다.

### 기술·배포

- 앱인토스 미니앱 빌드는 CSR 또는 SSG 구성이 필요하다. 현재 Next.js 웹 배포는 별도로 유지하며, 앱인토스 패키징 단계에서는 정적 출력 가능 여부를 다시 검증한다.
- 통신이 추가되면 HTTPS만 사용한다.
- 앱을 닫았다가 다시 열어도 필요한 데이터가 유지돼야 하므로 현재 local persistence 동작을 보존한다.
- Android 시스템 뒤로가기와 앱인토스 내비게이션 동작은 미니앱 SDK 통합 단계에서 별도로 검증한다.

## 타이포그래피

- 웹 앱은 npm `pretendard@1.3.9` 패키지의 `Pretendard Variable`을 번들에 포함한다.
- 사용 굵기는 400, 500, 600, 700, 800이다.
- 현재 연결된 Figma 실행 환경에는 Pretendard가 없어, 정확한 글꼴이 설치될 때까지 Figma 텍스트 스타일과 화면 생성을 보류한다. 대체 글꼴로 승인 없이 진행하지 않는다.

## 디자인 결과물

- [앱인토스 가이드 반영 콘셉트](./web-dashboard-concept-apps-in-toss.png)
- [초기 웹 대시보드 콘셉트](./web-dashboard-concept.png)
