# SUPER GONGIK web UX/UI refresh — Phase 0

## Product constraints

- Keep the guest-first, local-device-first onboarding and storage model.
- Keep the four destinations: Home, Calendar, Compensation, and Profile.
- Preserve verified policy values and the compensation safety gates. Visual changes must not imply that a suggested or unverified value is confirmed.
- Treat the web app as the current primary product. The responsive layout should remain suitable for later packaging as an app/PWA.

## Current-state audit

- The application already has a functional mobile shell, onboarding, service progress, annual leave summary, compensation guardrails, profile editing, and local persistence.
- The current layout caps every screen at 480 px, so desktop web only shows a centered phone-sized column.
- The current token set is small and semantic, but spacing, radii, typography, elevation, and interactive states are encoded as one-off CSS values.
- The current Home page has sound information hierarchy, but the progress ring consumes disproportionate vertical space and the compensation gate is visually too similar to ordinary content.
- Calendar is an empty placeholder. Compensation and Profile are functional but do not yet share a desktop page structure.
- There are no Figma Code Connect files or existing Figma screens/components/variables to reuse.

## Figma discovery

- File: [SUPER GONGIK — Web UX/UI System](https://www.figma.com/design/fji7M7eFZZBJcbs7B3Q2nb)
- Initial state: one empty page, no local variables, styles, components, or frames.
- Product font match: `Noto Sans KR` is available in Regular, Medium, Bold, and Black weights.
- No organization library is available. Material 3 and Simple Design System are available as community references, but the product needs a small custom library so its trust states and Korean content model remain explicit.

## Design direction

Use calm institutional trust with editorial warmth:

- deep navy for hierarchy and navigation;
- teal for confirmed progress and positive interaction;
- pale mint for local-storage and explanatory surfaces;
- warm off-white for the application canvas;
- coral/red only for destructive actions and policy warnings;
- high-contrast `Noto Sans KR` typography with clear numeric emphasis;
- restrained borders and shadows rather than decorative gradients or glass effects.

The initial generated concept is stored at [`web-dashboard-concept.png`](./web-dashboard-concept.png). The Apps in Toss compliant revision is stored at [`web-dashboard-concept-apps-in-toss.png`](./web-dashboard-concept-apps-in-toss.png). They are directional: the implementation will use real Lucide icons and accessible HTML rather than copying generated iconography or text artifacts.

The revision follows the official Apps in Toss non-game launch, UI/UX, and TDS guidance recorded in [`apps-in-toss-ux-guidelines.md`](./apps-in-toss-ux-guidelines.md). The product font decision has changed from Noto Sans KR to Pretendard at the user's request.

## Planned design system scope

### Foundations

- Color: brand, neutral, surface, border, positive, warning, and danger roles.
- Typography: display D-Day, page title, section title, body, label, caption, and numeric value.
- Spacing: 4, 8, 12, 16, 20, 24, 32, 40, and 48 px.
- Radius: 10, 14, 18, 24, and full.
- Elevation: subtle card and navigation shadows only.

### Components

- Button: primary, secondary, quiet, and danger states.
- Form field: date, select, text, and numeric input patterns.
- Status chip: in service, before service, and completed.
- Navigation item: mobile bottom tab and desktop rail variants.
- Surface card: summary, action, trust note, and policy warning variants.
- Progress indicator: compact mobile and expanded desktop compositions.

### Screens

- Guest onboarding: mobile and desktop.
- Home dashboard: mobile and desktop.
- Compensation safety state: mobile and desktop content structure.
- Calendar and Profile will use the same responsive shell and foundation patterns; their full feature expansion is outside this visual refresh.

## Code-to-design mapping

| Code                       | Figma role                | Decision                                                                     |
| -------------------------- | ------------------------- | ---------------------------------------------------------------------------- |
| `ServiceApp` / `Dashboard` | Responsive app shell      | Add desktop navigation rail while retaining mobile bottom tabs.              |
| `Onboarding`               | Guest onboarding template | Keep date-first flow and local-storage message; improve desktop composition. |
| `HomeTab`                  | Home template             | Recompose hero and cards without changing domain-derived values.             |
| `MoneyTab`                 | Compensation template     | Give gated, suggested, and confirmed information distinct semantics.         |
| `ProfileTab`               | Profile template          | Reuse field and trust-note components.                                       |
| CSS custom properties      | Figma variables           | Expand into shared semantic foundations, then mirror in CSS.                 |

## Deployment discovery

- Existing Vercel project: `super-gongik` in the `Club Paradiso` team.
- The project is already linked to `lucanomics/super-gongik` and uses Next.js.
- A production deployment is currently ready at `super-gongik.vercel.app`.
- Several historical feature-branch deployments failed, so the refreshed branch must pass the repository checks locally before preview deployment, followed by build-log and browser verification.

## Phase 0 gap analysis

The domain and trust model are strong enough to preserve. The largest gaps are responsive desktop behavior, reusable visual foundations, consistent state semantics, and end-to-end visual verification. No product-policy redesign is required. Phase 1 should create the Figma foundations and components above; Phase 2 should compose the approved screens; implementation should then mirror those tokens and layouts without altering calculation rules.
