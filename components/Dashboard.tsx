// Backward-compatible entry point. The redesigned dashboard lives in
// DashboardOverview so stale Turbopack modules cannot be reused after HMR.
export { default } from "./DashboardOverview";
export type { DashboardProps } from "./DashboardOverview";
