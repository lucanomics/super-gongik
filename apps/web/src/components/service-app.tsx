"use client";

import {
  CalendarDays,
  CalendarPlus,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  Home,
  LockKeyhole,
  MapPin,
  UserRound,
  WalletCards,
} from "lucide-react";
import { type FormEvent, useState } from "react";

import {
  STANDARD_SERVICE_MONTHS,
  buildServiceProfile,
  calculateExpectedDischargeDate,
  dateOnlyInTimeZone,
  formatKoreanDate,
  updateServiceProfile,
  type DateOnly,
  type ServiceProfile,
} from "@super-gongik/domain";

import { Button } from "@/components/ui/button";
import { useServiceProfile } from "@/hooks/use-service-profile";
import { getDashboardProjection } from "@/lib/dashboard-data";

type AppTab = "home" | "calendar" | "money" | "profile";

const tabCopy: Record<AppTab, { title: string; description: string }> = {
  home: {
    title: "홈",
    description: "오늘의 복무 현황을 확인해요.",
  },
  calendar: {
    title: "캘린더",
    description: "복무 일정 기록 기능을 준비하고 있어요.",
  },
  money: {
    title: "보수",
    description: "확인된 기준과 계산에 필요한 조건을 함께 보여드려요.",
  },
  profile: {
    title: "내 정보",
    description: "이 기기에 저장한 복무 설정을 관리해요.",
  },
};

const currencyFormatter = new Intl.NumberFormat("ko-KR", {
  style: "currency",
  currency: "KRW",
  maximumFractionDigits: 0,
});

function createGuestMetadata() {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  return { id, localProfileId: id, timestamp: now };
}

function formatDday(days: number) {
  return days === 0 ? "D-Day" : `D-${days.toLocaleString("ko-KR")}`;
}

function serviceStateLabel(state: "NOT_STARTED" | "IN_SERVICE" | "COMPLETED") {
  if (state === "NOT_STARTED") {
    return "소집 전";
  }
  if (state === "COMPLETED") {
    return "복무 완료";
  }
  return "복무 중";
}

export function ServiceApp() {
  const { profile, error, save, clear } = useServiceProfile();

  if (!profile) {
    return (
      <Onboarding
        storageError={error}
        onComplete={(input) =>
          save(buildServiceProfile(input, createGuestMetadata()))
        }
      />
    );
  }

  return <Dashboard profile={profile} onSave={save} onClear={clear} />;
}

function Onboarding({
  storageError,
  onComplete,
}: {
  storageError: "CORRUPTED_LOCAL_PROFILE" | null;
  onComplete: (input: {
    callUpDate: string;
    expectedDischargeDate: string;
    serviceCategory: string | null;
    workplaceType: null;
    defaultCommuteCost: null;
    defaultMealAllowanceOverride: null;
    timezone: "Asia/Seoul";
  }) => void;
}) {
  const [callUpDate, setCallUpDate] = useState("");
  const [expectedDischargeDate, setExpectedDischargeDate] = useState("");
  const [serviceCategory, setServiceCategory] = useState("");
  const [error, setError] = useState("");

  function updateCallUpDate(value: string) {
    setCallUpDate(value);
    if (!value) {
      return;
    }

    try {
      setExpectedDischargeDate(
        calculateExpectedDischargeDate(value as DateOnly),
      );
    } catch {
      setExpectedDischargeDate("");
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    try {
      onComplete({
        callUpDate,
        expectedDischargeDate,
        serviceCategory: serviceCategory || null,
        workplaceType: null,
        defaultCommuteCost: null,
        defaultMealAllowanceOverride: null,
        timezone: "Asia/Seoul",
      });
    } catch {
      setError("소집일과 소집해제 예정일을 다시 확인해 주세요.");
    }
  }

  return (
    <main className="onboarding-shell">
      <section className="onboarding-panel" aria-labelledby="onboarding-title">
        <p className="wordmark">슈퍼공익 · SUPER GONGIK</p>
        <h1 id="onboarding-title">복무 현황을 한눈에</h1>
        <p className="onboarding-intro">
          회원가입 없이 이 기기에서 바로 시작해요.
        </p>

        {storageError ? (
          <p className="form-error" role="alert">
            기존 기기 기록을 읽지 못했어요. 새 복무 정보를 입력해 주세요.
          </p>
        ) : null}

        <form className="onboarding-form" onSubmit={handleSubmit}>
          <div className="service-date-fields">
            <span className="timeline-line" aria-hidden="true" />
            <label className="form-field service-date-field">
              <span>소집일</span>
              <input
                required
                type="date"
                value={callUpDate}
                onChange={(event) => updateCallUpDate(event.target.value)}
              />
            </label>
            <label className="form-field service-date-field service-date-field--end">
              <span>소집해제 예정일</span>
              <input
                required
                type="date"
                value={expectedDischargeDate}
                onChange={(event) =>
                  setExpectedDischargeDate(event.target.value)
                }
              />
              <small>{STANDARD_SERVICE_MONTHS}개월 기준으로 자동 계산</small>
            </label>
          </div>

          <label className="form-field">
            <span>복무 분야 (선택)</span>
            <select
              value={serviceCategory}
              onChange={(event) => setServiceCategory(event.target.value)}
            >
              <option value="">선택하지 않아도 돼요</option>
              <option value="사회복지">사회복지</option>
              <option value="보건의료">보건의료</option>
              <option value="교육">교육</option>
              <option value="행정">행정</option>
              <option value="기타">기타</option>
            </select>
          </label>

          {error ? (
            <p className="form-error" role="alert">
              {error}
            </p>
          ) : null}

          <Button className="onboarding-submit" type="submit">
            복무 현황 보기
          </Button>
        </form>

        <p className="privacy-note">
          <LockKeyhole aria-hidden="true" size={20} />
          입력한 정보는 이 기기에 먼저 저장됩니다.
        </p>
      </section>
    </main>
  );
}

function Dashboard({
  profile,
  onSave,
  onClear,
}: {
  profile: ServiceProfile;
  onSave: (profile: ServiceProfile) => void;
  onClear: () => void;
}) {
  const [activeTab, setActiveTab] = useState<AppTab>("home");
  const today = dateOnlyInTimeZone(new Date());
  const projection = getDashboardProjection(profile, today);
  const activeCopy = tabCopy[activeTab];

  return (
    <main className="app-shell">
      <aside className="desktop-rail">
        <p className="rail-wordmark">
          SUPER
          <br />
          GONGIK
        </p>
        <span className="status-chip">
          {serviceStateLabel(projection.progress.state)}
        </span>
        <nav aria-label="데스크톱 주요 메뉴" className="desktop-nav">
          <TabButton
            active={activeTab === "home"}
            icon={Home}
            label="홈"
            onClick={() => setActiveTab("home")}
          />
          <TabButton
            active={activeTab === "calendar"}
            icon={CalendarDays}
            label="캘린더"
            onClick={() => setActiveTab("calendar")}
          />
          <TabButton
            active={activeTab === "money"}
            icon={WalletCards}
            label="보수"
            onClick={() => setActiveTab("money")}
          />
          <TabButton
            active={activeTab === "profile"}
            icon={UserRound}
            label="내 정보"
            onClick={() => setActiveTab("profile")}
          />
        </nav>
        <button
          className="rail-profile"
          onClick={() => setActiveTab("profile")}
          type="button"
        >
          <UserRound aria-hidden="true" size={19} />
          <span>
            {profile.serviceCategory ?? "사회복무요원"} · 복무{" "}
            {Math.max(1, Math.ceil(projection.progress.elapsedDays / 30.44))}
            개월 차
          </span>
        </button>
        <p className="rail-privacy">
          <LockKeyhole aria-hidden="true" size={18} />
          정보는 이 기기에만 저장해요.
        </p>
      </aside>

      <div className="app-main">
        <header className="app-header">
          <p className="wordmark mobile-wordmark">SUPER GONGIK</p>
          <div className="page-heading">
            <h1>{activeCopy.title}</h1>
            <p>{activeCopy.description}</p>
          </div>
        </header>

        <section className="tab-content" aria-live="polite">
          {activeTab === "home" ? (
            <HomeTab
              profile={profile}
              projection={projection}
              onSelectTab={setActiveTab}
            />
          ) : null}
          {activeTab === "calendar" ? <CalendarTab /> : null}
          {activeTab === "money" ? <MoneyTab projection={projection} /> : null}
          {activeTab === "profile" ? (
            <ProfileTab
              key={profile.updatedAt}
              profile={profile}
              onSave={onSave}
              onClear={onClear}
            />
          ) : null}
        </section>
      </div>

      <nav aria-label="주요 메뉴" className="tab-bar">
        <TabButton
          active={activeTab === "home"}
          icon={Home}
          label="홈"
          onClick={() => setActiveTab("home")}
        />
        <TabButton
          active={activeTab === "calendar"}
          icon={CalendarDays}
          label="캘린더"
          onClick={() => setActiveTab("calendar")}
        />
        <TabButton
          active={activeTab === "money"}
          icon={WalletCards}
          label="보수"
          onClick={() => setActiveTab("money")}
        />
        <TabButton
          active={activeTab === "profile"}
          icon={UserRound}
          label="내 정보"
          onClick={() => setActiveTab("profile")}
        />
      </nav>
    </main>
  );
}

function HomeTab({
  profile,
  projection,
  onSelectTab,
}: {
  profile: ServiceProfile;
  projection: ReturnType<typeof getDashboardProjection>;
  onSelectTab: (tab: AppTab) => void;
}) {
  const { progress, annualLeaveDays, compensation } = projection;
  const todayLabel = new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
    timeZone: "Asia/Seoul",
  }).format(new Date());

  return (
    <>
      <section className="progress-hero" aria-labelledby="progress-title">
        <div className="progress-copy">
          <p className="eyebrow" id="progress-title">
            소집해제까지
          </p>
          <strong>{formatDday(progress.dDay)}</strong>
          <p>{formatKoreanDate(profile.expectedDischargeDate)} 소집해제</p>
          <span className="progress-percentage">
            {progress.completionPercentage}%
          </span>
        </div>
        <ProgressRing percentage={progress.completionPercentage} />
        <div className="progress-guidance">
          <strong>차근차근, 잘하고 있어요.</strong>
          <p>남은 기간도 건강하고 안전하게 복무를 마쳐요.</p>
        </div>
        <div className="progress-labels">
          <span>{progress.elapsedDays.toLocaleString("ko-KR")}일 복무</span>
          <span>{progress.remainingDays.toLocaleString("ko-KR")}일 남음</span>
        </div>
      </section>

      <section className="summary-grid" aria-label="오늘의 복무 요약">
        <article className="summary-card">
          <CalendarDays aria-hidden="true" size={28} />
          <h2>오늘</h2>
          <strong>{serviceStateLabel(progress.state)}</strong>
          <p>{todayLabel}</p>
        </article>
        <article className="summary-card">
          <ClipboardList aria-hidden="true" size={28} />
          <h2>남은 연가</h2>
          <strong>{annualLeaveDays ?? "—"}일</strong>
          <p>일반 연가 {annualLeaveDays ?? "—"}일 중</p>
        </article>
      </section>

      <button
        className="dashboard-row"
        aria-label="보수 계산 조건 보기"
        onClick={() => onSelectTab("money")}
        type="button"
      >
        <CircleDollarSign aria-hidden="true" size={29} />
        <div>
          <h2>보수 계산 조건 보기</h2>
          <p>{compensation.message}</p>
        </div>
        <ChevronRight aria-hidden="true" className="row-arrow" size={22} />
      </button>

      <button
        className="next-event"
        aria-label="캘린더 보기"
        onClick={() => onSelectTab("calendar")}
        type="button"
      >
        <CalendarPlus aria-hidden="true" size={29} />
        <div>
          <h2>캘린더 보기</h2>
          <p>일정 기록 기능을 준비하고 있어요.</p>
        </div>
        <ChevronRight aria-hidden="true" className="row-arrow" size={22} />
      </button>
    </>
  );
}

function ProgressRing({ percentage }: { percentage: number }) {
  const radius = 108;
  const circumference = 2 * Math.PI * radius;
  const offset =
    circumference -
    (Math.min(100, Math.max(0, percentage)) / 100) * circumference;

  return (
    <svg aria-hidden="true" className="progress-ring" viewBox="0 0 260 260">
      <circle
        className="progress-ring__track"
        cx="130"
        cy="130"
        fill="none"
        r={radius}
        strokeWidth="12"
      />
      <circle
        className="progress-ring__value"
        cx="130"
        cy="130"
        fill="none"
        r={radius}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        strokeWidth="12"
      />
      <path
        className="progress-ring__flag"
        d="M130 56v35m0-31h22l-7 10 7 10h-22"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3"
      />
    </svg>
  );
}

function CalendarTab() {
  return (
    <section className="empty-state" aria-label="캘린더 준비 상태">
      <CalendarPlus aria-hidden="true" size={42} />
      <h2>일정을 한곳에서 관리할 수 있게 준비하고 있어요</h2>
      <p>기능이 준비되면 복무 일정과 기록을 이 기기에 저장할 수 있어요.</p>
      <p className="subtle">지금은 홈에서 복무 현황을 확인할 수 있어요.</p>
    </section>
  );
}

function MoneyTab({
  projection,
}: {
  projection: ReturnType<typeof getDashboardProjection>;
}) {
  const { compensation } = projection;

  return (
    <section className="money-page" aria-label="이번 달 예상 보수 기준">
      <div className="money-list">
        <article>
          <span>기본 보수</span>
          <strong>
            {compensation.basePay === null
              ? "기준 확인 중"
              : currencyFormatter.format(compensation.basePay)}
          </strong>
        </article>
        <article>
          <span>중식비</span>
          <strong>
            {compensation.suggestedMealRate === null
              ? "프로필에서 확인하기"
              : `${currencyFormatter.format(compensation.suggestedMealRate)} / 일`}
          </strong>
          <p>2026년 제안값이며 프로필 확인 전에는 합계에 넣지 않습니다.</p>
        </article>
        <article>
          <span>교통비</span>
          <strong>
            {compensation.transportConfigured
              ? "통근비 입력됨"
              : "1일 통근비 입력하기"}
          </strong>
          <p>전국 공통 금액으로 추정하지 않습니다.</p>
        </article>
      </div>

      <aside className="rule-note">
        <h2>계산 기준</h2>
        <p>{compensation.message}</p>
        <dl>
          <div>
            <dt>적용 규칙</dt>
            <dd>
              {compensation.ruleVersion
                ? `2026 보수 규칙 v${compensation.ruleVersion}`
                : "적용 규칙 없음"}
            </dd>
          </div>
          <div>
            <dt>상태</dt>
            <dd>
              {compensation.status === "GATED"
                ? "검증 뒤 제공"
                : "프로필 확인 필요"}
            </dd>
          </div>
        </dl>
      </aside>
    </section>
  );
}

function ProfileTab({
  profile,
  onSave,
  onClear,
}: {
  profile: ServiceProfile;
  onSave: (profile: ServiceProfile) => void;
  onClear: () => void;
}) {
  const [callUpDate, setCallUpDate] = useState<string>(profile.callUpDate);
  const [expectedDischargeDate, setExpectedDischargeDate] = useState<string>(
    profile.expectedDischargeDate,
  );
  const [serviceCategory, setServiceCategory] = useState(
    profile.serviceCategory ?? "",
  );
  const [commuteCost, setCommuteCost] = useState(
    profile.defaultCommuteCost?.toString() ?? "",
  );
  const [message, setMessage] = useState("");

  function handleCallUpDate(value: string) {
    setCallUpDate(value);
    try {
      setExpectedDischargeDate(
        calculateExpectedDischargeDate(value as DateOnly),
      );
    } catch {
      // Keep the existing date until the input becomes a valid civil date.
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      onSave(
        updateServiceProfile(
          profile,
          {
            callUpDate,
            expectedDischargeDate,
            serviceCategory: serviceCategory || null,
            workplaceType: profile.workplaceType,
            defaultCommuteCost: commuteCost === "" ? null : Number(commuteCost),
            defaultMealAllowanceOverride: profile.defaultMealAllowanceOverride,
            timezone: profile.timezone,
          },
          new Date().toISOString(),
        ),
      );
      setMessage("이 기기에 저장했어요.");
    } catch {
      setMessage("입력한 날짜와 통근비를 다시 확인해 주세요.");
    }
  }

  return (
    <section className="profile-page" aria-label="내 복무 정보">
      <form className="profile-form" onSubmit={handleSubmit}>
        <label className="form-field">
          <span>소집일</span>
          <input
            type="date"
            required
            value={callUpDate}
            onChange={(event) => handleCallUpDate(event.target.value)}
          />
        </label>
        <label className="form-field">
          <span>소집해제 예정일</span>
          <input
            type="date"
            required
            value={expectedDischargeDate}
            onChange={(event) => setExpectedDischargeDate(event.target.value)}
          />
        </label>
        <label className="form-field">
          <span>복무 분야</span>
          <input
            value={serviceCategory}
            maxLength={80}
            onChange={(event) => setServiceCategory(event.target.value)}
            placeholder="선택 사항"
          />
        </label>
        <label className="form-field">
          <span>
            <MapPin aria-hidden="true" size={17} />
            1일 통근비 (선택)
          </span>
          <input
            inputMode="numeric"
            min="0"
            type="number"
            value={commuteCost}
            onChange={(event) => setCommuteCost(event.target.value)}
            placeholder="기관 승인 금액 또는 실제 운임"
          />
        </label>
        {message ? (
          <p className="save-message" role="status">
            {message}
          </p>
        ) : null}
        <Button type="submit">변경 사항 저장</Button>
      </form>

      <section className="profile-security">
        <LockKeyhole aria-hidden="true" size={24} />
        <div>
          <h2>로컬 우선 저장</h2>
          <p>클라우드 백업과 동기화는 아직 연결하지 않았어요.</p>
        </div>
      </section>

      <Button
        className="reset-button"
        type="button"
        variant="danger"
        onClick={() => {
          if (window.confirm("이 기기의 복무 프로필을 지울까요?")) {
            onClear();
          }
        }}
      >
        이 기기에서 복무 프로필 지우기
      </Button>
    </section>
  );
}

function TabButton({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: typeof Home;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-current={active ? "page" : undefined}
      className={active ? "tab-button tab-button--active" : "tab-button"}
      onClick={onClick}
      type="button"
    >
      <Icon aria-hidden="true" size={24} />
      <span>{label}</span>
    </button>
  );
}
