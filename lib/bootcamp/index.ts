// Barrel for the bootcamp domain layer.
//
// Everything exported here is PURE — no DB, no fetch, no Next.js APIs — so it
// is unit-testable without a database and safe to import from server components,
// route handlers and client components alike.
//
// Schema: migrations/021_create_bootcamp_spine.sql
// Spec:   docs/bootcamp-prd.md (v2) section S1

export {
  BOOTCAMP_PASS_BAR,
  MAX_ATTEMPTS,
  RESUBMIT_WINDOW_DAYS,
  evaluateGate,
  canResubmit,
  deriveGateStatuses,
  type GateStatus,
  type GateRequirements,
  type GateEvidence,
  type GateCheck,
  type GateEvaluation,
} from "./gates";

export {
  computeStanding,
  standingLabel,

  attendanceWeight,
  presenceStatus,
  weightedAttendancePct,
  seatsRemaining,
  isCohortFull,
  type Standing,
  type StandingInputs,
  type StandingResult,
  type AttendanceStatus,
} from "./standing";
