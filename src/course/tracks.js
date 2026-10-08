import { modules, lessonById } from './curriculum';
import { vizUsage } from './vizUsage';
import { VIZ } from './vizNames';
import { PRICES, formatMoney } from './prices';
import { ML_MODULES, CAREER_MODULES, trackHasModule } from './access';

// The course is sold as three tracks. A track is a set of modules plus the Lab
// interactives those modules use. The Starter Kit opens every track.
//
// Prices live in ./prices.js (rupees for India, dollars elsewhere). `quarter` is
// the price for three months of access; `lifetime` is paid once.
export const CURRENCY = { code: 'INR', locale: 'en-IN' };
export const PERIODS = [
  { id: 'monthly', label: '1 Month', unit: 'for 1 month', months: 1 },
  { id: 'quarter', label: '3 Months', unit: 'for 3 months', months: 3 },
  { id: 'lifetime', label: 'Lifetime', unit: 'one-time payment', months: null, best: true },
];

// Which modules each track contains is decided in ./access.js.
const AI_MODULES = modules.map(m => m.id).filter(id => trackHasModule('ai', id));

const DEFS = [
  {
    id: 'ml', name: 'ML & Deep Learning', short: 'ML / DL', icon: '∑', accent: '#7ee0a8',
    blurb: 'How machines learn from data: regression, losses, regularisation, neural networks, backpropagation and the road to Transformers.',
    moduleIds: ML_MODULES, labs: 'ml',
    prices: PRICES.ml.INR, allPrices: PRICES.ml,
    extras: [],
  },
  {
    id: 'ai', name: 'Generative AI Engineering', short: 'AI', icon: '✦', accent: '#b79cff',
    blurb: 'Inside LLMs and the systems around them: Transformers, prompting, RAG, agents, inference, evaluation, safety and infrastructure.',
    moduleIds: AI_MODULES, labs: 'ai',
    prices: PRICES.ai.INR, allPrices: PRICES.ai,
    extras: [],
  },
  {
    id: 'complete', name: 'Complete AI Engineer', short: 'Complete', icon: '◎', accent: '#ffd9a8', featured: true,
    blurb: 'Everything in both tracks, in order, plus AI engineer career preparation: interview questions, system design and a study plan.',
    moduleIds: modules.map(m => m.id), labs: 'all',
    prices: PRICES.complete.INR, allPrices: PRICES.complete,
    extras: ['AI engineer career prep module', 'Certificate of completion'],
  },
];

// An interactive counts as ML/DL when an ML or deep-learning lesson uses it; the rest belong to the AI track.
const moduleOfLesson = id => modules.find(m => m.lessons.some(l => l.id === id));
const mlLessonModules = new Set(['ml-foundations', 'deep-learning']);
export const labTrack = name => (vizUsage[name] || []).some(id => lessonById[id] && mlLessonModules.has(moduleOfLesson(id).id)) ? 'ml' : 'ai';
const allLabs = Object.keys(VIZ);

export const tracks = DEFS.map(t => {
  const mods = modules.filter(m => t.moduleIds.includes(m.id));
  const lessons = mods.flatMap(m => m.lessons);
  const labs = t.labs === 'all' ? allLabs : allLabs.filter(n => labTrack(n) === t.labs);
  return { ...t, modules: mods, lessons, labs };
});
export const trackById = Object.fromEntries(tracks.map(t => [t.id, t]));

// Lessons a learner may open without finishing everything before them: the
// first lesson of each track's first module after the Starter Kit.
export const entryLessonIds = tracks.map(t => t.modules.find(m => m.id !== 'must-know')?.lessons[0].id).filter(Boolean);

export const formatPrice = (amount, currency = 'INR') => formatMoney(amount, currency);
// How much cheaper three months is than paying monthly for three months, as a whole percentage (negative when it costs more).
export const quarterSaving = prices => Math.round((1 - prices.quarter / (prices.monthly * 3)) * 100);

// Lab access. One lab is free for everyone; the rest need a plan whose track
// includes that lab. `plans` is the list of track ids the learner has bought.
export const FREE_LABS = ['temperature'];
export const labUnlocked = (name, plans = []) => FREE_LABS.includes(name) || plans.includes('complete') || plans.includes(labTrack(name));
