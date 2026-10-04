import { glossary } from './content';
import { authoredSections } from './lessonSections';

// A lesson page is an ordered list of sections; each section is a list of
// typed blocks rendered by LessonBlocks.jsx. Block types:
//   p        { text }                         inline `code` and **bold** supported
//   list     { items: [text], ordered? }
//   callout  { tone: 'note'|'tip'|'warn'|'example', title, text }
//   steps    { items: [{ title, text }] }
//   code     { lang, code, caption? }
//   output   { text, title? }                 terminal / program output
//   table    { head: [..], rows: [[..]] }
//   deeper   { title, blocks: [...] }         collapsible "go deeper" panel
//   check    { question, answer }             quick self-check with reveal
//   figure   { visual, caption? }             interactive diagram
//   terms    { items: [term] }                glossary definitions
//
// Lessons with an entry in lessonSections.js use their authored sections.
// Every other lesson gets the same structure assembled from its fields, so
// adding richer content later only means adding an entry there.

const relatedTerms = l => (l.terms?.length ? l.terms : Object.keys(glossary).filter(term => (l.title + ' ' + l.simple + ' ' + l.technical).toLowerCase().includes(term.toLowerCase())).slice(0, 6)).filter(t => glossary[t]);

function generatedSections(id, l) {
  const sections = [
    { id: 'intuition', title: 'The intuition', blocks: [
      { type: 'p', text: l.intuition },
      { type: 'callout', tone: 'note', title: 'In one sentence', text: l.simple },
    ] },
    { id: 'see-it', title: 'See it work', blocks: [
      { type: 'figure', visual: l.visual, lessonId: id, caption: 'Interact with the diagram. Illustrations are simplified teaching models.' },
    ] },
    { id: 'how-it-works', title: 'How it works', blocks: [
      { type: 'p', text: l.technical },
      ...(l.steps?.length ? [{ type: 'steps', items: l.steps }] : []),
    ] },
    { id: 'in-practice', title: 'In practice', blocks: [
      { type: 'callout', tone: 'example', title: 'In a real system', text: l.example },
      ...(l.exercise ? [{ type: 'callout', tone: 'tip', title: 'Try it', text: l.exercise }] : []),
    ] },
  ];
  if (l.code) sections.push({ id: 'code', title: 'Read the code', blocks: [
    { type: 'p', text: 'Read the comment beside each line, then change one input and predict the output before you run it.' },
    { type: 'code', lang: l.codeLanguage || 'python', code: l.code },
    ...(l.codeNotes ? [{ type: 'callout', tone: 'tip', title: 'Experiment', text: l.codeNotes }] : []),
  ] });
  sections.push({ id: 'pitfall', title: 'Common misconception', blocks: [{ type: 'callout', tone: 'warn', title: 'Watch out', text: l.mistake }] });
  return sections;
}

export function buildLesson(id, l) {
  const sections = [...(authoredSections[id] || generatedSections(id, l))];
  const terms = relatedTerms(l);
  if (terms.length && !sections.some(s => s.id === 'terms')) sections.push({ id: 'terms', title: 'Key terms', blocks: [{ type: 'terms', items: terms }] });
  if (l.question) sections.push({ id: 'check', title: 'Check your understanding', quiz: true, blocks: [] });
  if (l.takeaway?.length) sections.push({ id: 'takeaways', title: 'Key takeaways', summary: true, blocks: [{ type: 'list', items: l.takeaway }] });
  if (l.sources?.length) sections.push({ id: 'reading', title: 'Further reading', blocks: [
    { type: 'p', text: 'Primary sources behind the technical explanation. The examples above are simplified for clarity.' },
    { type: 'links', items: l.sources },
  ] });
  return sections;
}

// Lesson times are stored as strings like '8 min'.
export const minutes = l => parseInt(l.time, 10) || 6;
