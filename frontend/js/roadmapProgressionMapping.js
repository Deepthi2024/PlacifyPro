/**
 * Placify AI — Roadmap Progression Mapping (Single Source of Truth)
 * Requirement 4 & Requirement 5 Specification
 * 
 * Strict progression mapping between:
 * Step 1: Starting level ('New to field', 'Beginner', 'Intermediate', 'Advanced')
 * Step 2: Target goal ('Beginner', 'Intermediate', 'Advanced & Build High Level Projects')
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.PlacifyRoadmapMapping = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {

  const STARTING_LEVELS = [
    'New to field',
    'Beginner',
    'Intermediate',
    'Advanced'
  ];

  const TARGET_GOALS = [
    'Beginner',
    'Intermediate',
    'Advanced & Build High Level Projects'
  ];

  const LEVEL_RANKS = {
    'New to field': 0,
    'Beginner': 1,
    'Intermediate': 2,
    'Advanced': 3
  };

  /**
   * Exact Requirement 4 mapping table
   */
  const PROGRESSION_MAP = {
    'New to field': {
      permittedGoals: ['Beginner', 'Intermediate', 'Advanced & Build High Level Projects'],
      goals: {
        'Beginner': {
          durationMonths: 3,
          phases: ['BEGINNER'],
          phaseLabels: ['Beginner tier'],
          recommendedDuration: '3 months',
          timelineDisplay: 'Beginner → Complete the beginner phase.',
          phaseRanges: [
            { phase: 'BEGINNER', tier: 'BEGINNER', label: 'Beginner tier', startMonth: 1, endMonth: 3 }
          ]
        },
        'Intermediate': {
          durationMonths: 6,
          phases: ['BEGINNER', 'INTERMEDIATE'],
          phaseLabels: ['Beginner tier', 'Intermediate tier'],
          recommendedDuration: '6 months',
          timelineDisplay: 'Beginner → Intermediate.',
          phaseRanges: [
            { phase: 'BEGINNER', tier: 'BEGINNER', label: 'Beginner tier', startMonth: 1, endMonth: 3 },
            { phase: 'INTERMEDIATE', tier: 'INTERMEDIATE', label: 'Intermediate tier', startMonth: 4, endMonth: 6 }
          ]
        },
        'Advanced & Build High Level Projects': {
          durationMonths: 12,
          phases: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'CAPSTONE'],
          phaseLabels: ['Beginner tier', 'Intermediate tier', 'Advanced tier', 'Capstone Synthesis & Project Portfolio'],
          recommendedDuration: '12 months',
          timelineDisplay: 'Beginner → Intermediate → Advanced → Capstone Synthesis & Project Portfolio.',
          phaseRanges: [
            { phase: 'BEGINNER', tier: 'BEGINNER', label: 'Beginner tier', startMonth: 1, endMonth: 3 },
            { phase: 'INTERMEDIATE', tier: 'INTERMEDIATE', label: 'Intermediate tier', startMonth: 4, endMonth: 6 },
            { phase: 'ADVANCED', tier: 'ADVANCED', label: 'Advanced tier', startMonth: 7, endMonth: 9 },
            { phase: 'CAPSTONE', tier: 'CAPSTONE', label: 'Capstone Synthesis & Project Portfolio', startMonth: 10, endMonth: 12 }
          ]
        }
      }
    },
    'Beginner': {
      permittedGoals: ['Intermediate', 'Advanced & Build High Level Projects'],
      goals: {
        'Intermediate': {
          durationMonths: 3,
          phases: ['INTERMEDIATE'],
          phaseLabels: ['Intermediate tier'],
          recommendedDuration: '3 months',
          timelineDisplay: 'Intermediate.',
          phaseRanges: [
            { phase: 'INTERMEDIATE', tier: 'INTERMEDIATE', label: 'Intermediate tier', startMonth: 1, endMonth: 3 }
          ]
        },
        'Advanced & Build High Level Projects': {
          durationMonths: 9,
          phases: ['INTERMEDIATE', 'ADVANCED', 'CAPSTONE'],
          phaseLabels: ['Intermediate tier', 'Advanced tier', 'Capstone Synthesis & Project Portfolio'],
          recommendedDuration: '9 months',
          timelineDisplay: 'Intermediate → Advanced → Capstone Synthesis & Project Portfolio.',
          phaseRanges: [
            { phase: 'INTERMEDIATE', tier: 'INTERMEDIATE', label: 'Intermediate tier', startMonth: 1, endMonth: 3 },
            { phase: 'ADVANCED', tier: 'ADVANCED', label: 'Advanced tier', startMonth: 4, endMonth: 6 },
            { phase: 'CAPSTONE', tier: 'CAPSTONE', label: 'Capstone Synthesis & Project Portfolio', startMonth: 7, endMonth: 9 }
          ]
        }
      }
    },
    'Intermediate': {
      permittedGoals: ['Advanced & Build High Level Projects'],
      goals: {
        'Advanced & Build High Level Projects': {
          durationMonths: 6,
          phases: ['ADVANCED', 'CAPSTONE'],
          phaseLabels: ['Advanced tier', 'Capstone Synthesis & Project Portfolio'],
          recommendedDuration: '6 months',
          timelineDisplay: 'Advanced → Capstone Synthesis & Project Portfolio.',
          phaseRanges: [
            { phase: 'ADVANCED', tier: 'ADVANCED', label: 'Advanced tier', startMonth: 1, endMonth: 3 },
            { phase: 'CAPSTONE', tier: 'CAPSTONE', label: 'Capstone Synthesis & Project Portfolio', startMonth: 4, endMonth: 6 }
          ]
        }
      }
    },
    'Advanced': {
      permittedGoals: ['Advanced & Build High Level Projects'],
      goals: {
        'Advanced & Build High Level Projects': {
          durationMonths: 3,
          phases: ['CAPSTONE'],
          phaseLabels: ['Capstone Synthesis & Project Portfolio'],
          recommendedDuration: '3 months',
          timelineDisplay: 'Capstone Synthesis & Project Portfolio.',
          phaseRanges: [
            { phase: 'CAPSTONE', tier: 'CAPSTONE', label: 'Capstone Synthesis & Project Portfolio', startMonth: 1, endMonth: 3 }
          ]
        }
      }
    }
  };

  function normalizeStartingLevel(raw) {
    if (!raw) return null;
    const clean = String(raw).trim().toLowerCase();
    if (clean === 'new to field' || clean.includes('new to field') || clean === 'new' || clean === 'novice' || clean === 'unassessed') {
      return 'New to field';
    }
    if (clean === 'beginner' || clean.includes('beginner') || clean === 'foundational') {
      return 'Beginner';
    }
    if (clean === 'intermediate' || clean.includes('intermediate') || clean === 'practitioner') {
      return 'Intermediate';
    }
    if (clean === 'advanced' || clean.includes('advanced') || clean === 'experienced') {
      return 'Advanced';
    }
    return null;
  }

  function normalizeTargetGoal(raw) {
    if (!raw) return null;
    const clean = String(raw).trim().toLowerCase();
    if (clean.includes('advanced & build high level projects') || clean.includes('high level') || clean.includes('project') || clean === 'advanced') {
      return 'Advanced & Build High Level Projects';
    }
    if (clean === 'intermediate' || clean.includes('intermediate')) {
      return 'Intermediate';
    }
    if (clean === 'beginner' || clean.includes('beginner')) {
      return 'Beginner';
    }
    return null;
  }

  function getPermittedGoals(startingLevel) {
    const norm = normalizeStartingLevel(startingLevel);
    return (PROGRESSION_MAP[norm] && PROGRESSION_MAP[norm].permittedGoals) || [];
  }

  function isCombinationValid(startingLevel, targetGoal) {
    const normStart = normalizeStartingLevel(startingLevel);
    const normGoal = normalizeTargetGoal(targetGoal);
    if (!normStart || !normGoal) return false;
    const startEntry = PROGRESSION_MAP[normStart];
    if (!startEntry) return false;
    return Boolean(startEntry.goals && startEntry.goals[normGoal]);
  }

  function getProgressionConfig(startingLevel, targetGoal) {
    const normStart = normalizeStartingLevel(startingLevel);
    const normGoal = normalizeTargetGoal(targetGoal);
    if (!normStart || !normGoal) return null;
    const startEntry = PROGRESSION_MAP[normStart];
    if (!startEntry || !startEntry.goals) return null;
    return startEntry.goals[normGoal] || null;
  }

  /**
   * Determine effective starting level from declared level and quiz evaluation.
   * Requirement 3:
   * Quiz-derived starting level must be one of:
   * - New to field
   * - Beginner
   * - Intermediate
   * - Advanced
   * If quiz result is lower than self-declared starting level, use lower quiz-derived level.
   * Do not automatically upgrade effective starting level above what existing assessment rules support.
   */
  function determineEffectiveStartingLevel(declaredStartingLevel, quizEvaluation) {
    const normDeclared = normalizeStartingLevel(declaredStartingLevel);
    if (!quizEvaluation) {
      return normDeclared;
    }

    const scorePct = Number(
      quizEvaluation.scorePct !== undefined
        ? quizEvaluation.scorePct
        : (quizEvaluation.score_pct !== undefined ? quizEvaluation.score_pct : -1)
    );

    let quizDerivedLevel = 'Beginner';
    if (scorePct >= 0) {
      if (scorePct >= 80) {
        quizDerivedLevel = 'Advanced';
      } else if (scorePct >= 50) {
        quizDerivedLevel = 'Intermediate';
      } else if (scorePct >= 25) {
        quizDerivedLevel = 'Beginner';
      } else {
        quizDerivedLevel = 'New to field';
      }
    } else if (quizEvaluation.skill_level || quizEvaluation.skillTier || quizEvaluation.skillLevel) {
      quizDerivedLevel = normalizeStartingLevel(
        quizEvaluation.skill_level || quizEvaluation.skillTier || quizEvaluation.skillLevel
      );
    }

    const declaredRank = LEVEL_RANKS[normDeclared] ?? 1;
    const quizRank = LEVEL_RANKS[quizDerivedLevel] ?? 1;

    // If quiz result is lower than declared starting level, drop to lower quiz-derived level
    if (quizRank < declaredRank) {
      return quizDerivedLevel;
    }

    // Existing evaluation rules support quiz-derived level
    return quizDerivedLevel;
  }

  return {
    STARTING_LEVELS,
    TARGET_GOALS,
    LEVEL_RANKS,
    PROGRESSION_MAP,
    normalizeStartingLevel,
    normalizeTargetGoal,
    getPermittedGoals,
    isCombinationValid,
    getProgressionConfig,
    determineEffectiveStartingLevel
  };
}));
