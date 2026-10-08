// Who may open what. The Starter Kit module is free for everyone; every other
// module opens with a plan for a track that contains it. The same rule is used
// by the pages (to show padlocks) and by the server (to decide whether to send
// a lesson). This file has no imports so the server can load it too.
export const FREE_MODULES = ['must-know'];
export const ML_MODULES = ['must-know', 'ml-foundations', 'deep-learning'];
export const CAREER_MODULES = ['interviews'];

export const trackHasModule = (track, moduleId) =>
  track === 'complete' ? true
    : track === 'ml' ? ML_MODULES.includes(moduleId)
    : track === 'ai' ? moduleId === 'must-know' || (!ML_MODULES.includes(moduleId) && !CAREER_MODULES.includes(moduleId))
    : false;

export const isFreeModule = moduleId => FREE_MODULES.includes(moduleId);
export const canOpenModule = (moduleId, plans = []) => isFreeModule(moduleId) || plans.some(p => trackHasModule(p, moduleId));
// The tracks a learner could buy to open this module, cheapest first.
export const tracksWithModule = moduleId => ['ml', 'ai', 'complete'].filter(t => trackHasModule(t, moduleId));
