import { modules, allLessons } from './curriculum';
import { lessonMinutes } from './lessonMinutes';
import { guide, faqs } from './reference';

// The AI engineer roadmap page, built from the curriculum: modules grouped into
// steps by their stage, with the study time each one takes.
const hours = lessons => Math.max(1, Math.round(lessons.reduce((n, l) => n + (lessonMinutes[l.id] || 25), 0) / 60));

export const roadmapSteps = modules.reduce((steps, m) => {
  const last = steps[steps.length - 1];
  const entry = { id: m.id, number: m.number, title: m.title, intro: m.intro[0], hours: hours(m.lessons), lessons: m.lessons.map(l => ({ id: l.id, num: l.num, title: l.title })) };
  if (last && last.stage === m.stage) last.modules.push(entry); else steps.push({ stage: m.stage, modules: [entry] });
  return steps;
}, []);

export const roadmapTotals = { hours: hours(allLessons), lessons: allLessons.length, modules: modules.length, steps: roadmapSteps.length };
export const roadmapText = {
  title: 'AI Engineer Roadmap: what to learn, and in what order',
  intro: `A step-by-step path from your first machine-learning idea to designing production AI systems: ${roadmapSteps.length} steps, ${modules.length} modules and about ${hours(allLessons)} hours of lessons. Every step links to the lesson that teaches it.`,
  what: [guide.whatIs.lead, ...guide.whatIs.body],
  skills: faqs.find(([q]) => q.startsWith('What skills does an AI engineer need'))?.[1] || '',
  versus: faqs.find(([q]) => q.startsWith('What is the difference between an AI engineer'))?.[1] || '',
  pace: [[1, 'hour a day'], [2, 'hours a day'], [10, 'hours a week']].map(([n, label]) => [label, label.includes('week') ? Math.ceil(hours(allLessons) / n) : Math.ceil(hours(allLessons) / n / 7)]),
};
