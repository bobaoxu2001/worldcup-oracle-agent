export {
  predictMatch,
  simulateGroup,
  simulateTournament,
  getChampionProbabilities,
  getChampionOddsFor,
  generateMatchExplanation,
  STAGE_KEYS,
  type TournamentResult,
} from "./engine";
export { ELO_RATINGS, getRating, HOME_ADVANTAGE } from "./ratings";
export {
  computeRatingUpdates,
  getUpdatedRating,
  getResultDelta,
  ratingUpdatesMeta,
  type CompletedResult,
  type RatingUpdates,
} from "./ratingUpdates";
export {
  AVAILABILITY_ADJUSTMENTS,
  SQUAD_STABILITY_CAP,
  VALUE_TO_ELO,
  ROLE_WEIGHTS,
  entryDelta,
  getAvailabilityAdjustments,
  getAvailabilityDelta,
  getEffectiveRating,
  availabilityMeta,
  type AvailabilityAdjustment,
  type PlayerRole,
} from "./availabilityAdjustments";
export {
  TEAM_STYLES,
  NEUTRAL_STYLE,
  TACTICAL_CLASH_WEIGHT,
  TACTICAL_CAP,
  getStyle,
  getTacticalMatchup,
  tacticalMatchupMeta,
  type TacticalStyle,
  type TacticalMatchup,
} from "./tacticalMatchups";
export {
  GROUP_DRAW_BOOST,
  DRAW_CEIL,
  isGroupFixture,
  drawMultiplierFor,
  inflateDraw,
  applyDrawPropensity,
  drawPropensityMeta,
  type DrawAdjusted,
} from "./drawPropensity";
export {
  PRE_MATCH_INTEL,
  INTEL_CAP,
  intelEloImpact,
  getFixtureIntel,
  getIntelDelta,
  getConfirmedIntel,
  getIntelUncertainty,
  preMatchIntelligenceMeta,
  intelTeamName,
  type PreMatchIntel,
  type IntelStatus,
  type IntelType,
} from "./preMatchIntelligence";
export {
  FORM_SENSITIVITY,
  FORM_SHRINK_PRIOR,
  FORM_CAP,
  computeConfederationForm,
  getConfederationDelta,
  confederationFormMeta,
  type ConfederationFormRow,
} from "./confederationForm";
export {
  matchProb,
  sampleMatch,
  expectedScore,
  expectedGoals,
  scorelineGrid,
  mulberry32,
} from "./elo";
