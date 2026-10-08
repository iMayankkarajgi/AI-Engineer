import { BRAND, PROGRAM, SITE_URL, CONTACT_EMAIL, SELLER, REFUND_DAYS } from '../brand';

// The text of the Privacy Policy, Terms of Service and Refund Policy. Each page is
// { title, intro, sections: [{ h, p: [paragraphs], items: [bullet points] }] }.
const site = SITE_URL.replace('https://', '');

export const legalPages = {
  privacy: {
    title: 'Privacy Policy',
    intro: `This policy explains what personal information ${BRAND} (${site}) collects, why, and the choices you have. We keep it short and collect only what the course needs.`,
    sections: [
      { h: 'Who we are', p: [`${BRAND} is run by ${SELLER}. For anything in this policy, write to ${CONTACT_EMAIL}.`] },
      { h: 'What we collect', p: ['We collect only the following:'], items: [
        'Account details: your name and email address, and a password if you sign up with email (we never see or store the password itself; it is handled by our authentication provider). If you sign in with Google, Google gives us your name, email address and profile picture.',
        'Learning data: which lessons you have passed, your best quiz scores, your final exam score, the profile text you choose to write, and Python files you save in the Practice editor.',
        'Plan status: which plan you have, its billing period and when it ends. We do not see or store your card or bank details; those go directly to our payment provider.',
        'Technical data: like most websites, our hosting provider records standard request logs such as IP address, browser type and the pages requested, for security and reliability.',
        'Settings in your browser: your theme, the lesson you last opened and, if you are not signed in, your progress. These stay on your device.',
      ] },
      { h: 'How we use it', items: [
        'To create your account and keep you signed in.',
        'To save your progress and scores and show them back to you, including on your certificate.',
        'To give you access to the plan you bought.',
        'To answer your messages and send essential notices about your account.',
        'To keep the site secure and fix problems.',
      ], p: ['We do not sell your personal information, and we do not use it for advertising.'] },
      { h: 'Who we share it with', p: ['We use a small number of service providers who process data for us only to run the site:'], items: [
        'Supabase: stores accounts, progress and saved files, and handles sign-in.',
        'Vercel: hosts the website.',
        'Google: provides "Continue with Google" sign-in and the fonts the site loads.',
        'Dodo Payments: processes payments for paid plans, once checkout is available.',
      ] },
      { h: 'Cookies and local storage', p: ['We do not use advertising or tracking cookies. The site stores a sign-in session and your preferences in your browser using local storage. You can clear them in your browser settings; you will then be signed out and your theme will reset.'] },
      { h: 'How long we keep it', p: ['We keep your account data while your account exists. If you ask us to delete your account, we delete your profile, progress and saved files within 30 days, except where we must keep a record of a payment for tax or legal reasons.'] },
      { h: 'Your rights', p: [`You can ask us to give you a copy of your data, correct it, or delete it, and you can withdraw consent at any time. Email ${CONTACT_EMAIL} from the address on your account and we will respond within 30 days. Depending on where you live, laws such as India's Digital Personal Data Protection Act, 2023 or the GDPR also give you these rights, and you may complain to your local data protection authority.`] },
      { h: 'Security', p: ['Data is sent over encrypted connections and stored with providers that apply industry-standard protections. Each learner can read and change only their own records. No system is perfectly secure, so please use a strong, unique password.'] },
      { h: 'Where data is processed', p: ['Our providers may process data in countries other than where you live, including India, the United States and the European Union.'] },
      { h: 'Children', p: [`${BRAND} is not directed at children under 13, and we do not knowingly collect their data. If you believe a child has given us information, contact us and we will delete it.`] },
      { h: 'Changes', p: ['We may update this policy. The date at the top shows when it last changed. If a change is significant, we will say so on the site.'] },
    ],
  },

  terms: {
    title: 'Terms of Service',
    intro: `These terms are the agreement between you and ${BRAND} (${site}) when you use the site or buy the ${PROGRAM}. Please read them. By creating an account or buying a plan, you agree to them.`,
    sections: [
      { h: 'Who we are', p: [`${BRAND} is run by ${SELLER}. You can reach us at ${CONTACT_EMAIL}.`] },
      { h: 'Your account', items: [
        'You must give accurate details and keep your sign-in secure. You are responsible for what happens under your account.',
        'An account is for one person. Do not share your login or let others use your plan.',
        'You must be at least 13 years old, and if you are under the age of majority where you live, a parent or guardian must agree to these terms for you.',
      ] },
      { h: 'Plans and payment', items: [
        'The course is offered in tracks with one-month, three-month and lifetime plans, each bought with a single payment; nothing renews automatically. Prices are shown on the Pricing page, in Indian rupees for visitors in India and in US dollars elsewhere.',
        'A one-month or three-month plan gives access for the period you paid for. A lifetime plan is a one-time payment for access for as long as we offer the course.',
        'Payments are handled by our payment provider, Dodo Payments. Prices may change, but a change never affects a plan you have already bought. Taxes may be added where the law requires.',
        `Refunds are covered by our Refund Policy at ${site}/refund.`,
      ] },
      { h: 'What you may and may not do', p: ['You may use the course for your own learning. You may not:'], items: [
        'copy, resell, share or republish the lessons, quizzes, code, images or other content;',
        'use scripts or bots to copy the site or load it excessively;',
        'try to break, probe or bypass the site, the sign-in or the plan limits;',
        'use the site to break the law or harm others.',
      ] },
      { h: 'Our content', p: [`The lessons, quizzes, interactive labs, design and software of ${BRAND} belong to us or our licensors and are protected by copyright. We give you a personal, non-transferable licence to use them while you have access. Papers, documentation and news linked from the site belong to their publishers.`] },
      { h: 'Certificates', p: [`A certificate shows that you passed the lessons and the final exam of the ${PROGRAM}. It is awarded by ${BRAND}; it is not a university degree or an accredited qualification.`] },
      { h: 'No guarantees', p: ['The course is educational. We work hard to keep it accurate, but AI changes quickly and we cannot promise it is error-free, that it will suit your goals, or that it will lead to a job or income. The site is provided "as is", and we may change, pause or improve it at any time.'] },
      { h: 'Suspension', p: ['We may suspend or close an account that breaks these terms, for example by sharing access or copying content. If we close your account without a good reason, we will refund the unused part of what you paid.'] },
      { h: 'Limit of liability', p: ['To the extent the law allows, our total liability to you for any claim about the site or the course is limited to the amount you paid us in the 12 months before the claim, and we are not liable for indirect or consequential losses. Nothing in these terms limits rights you have under law that cannot be limited.'] },
      { h: 'Governing law', p: ['These terms are governed by the laws of India. Courts in India have jurisdiction, but this does not take away any consumer rights you have in your own country.'] },
      { h: 'Changes', p: ['We may update these terms. The date at the top shows the latest version. If you keep using the site after a change, you accept the new terms; a change never reduces what you already paid for.'] },
      { h: 'Contact', p: [`Questions about these terms: ${CONTACT_EMAIL}.`] },
    ],
  },

  refund: {
    title: 'Refund Policy',
    intro: `We want you to be happy with the ${PROGRAM}. This policy explains when and how you can get your money back.`,
    sections: [
      { h: `${REFUND_DAYS}-day refund`, p: [`If you are not satisfied with a paid plan, email ${CONTACT_EMAIL} within ${REFUND_DAYS} days of buying it and we will refund the full amount. You do not need to give a reason.`] },
      { h: 'After that', p: [`After ${REFUND_DAYS} days we do not refund monthly, three-month or lifetime plans, because you will have had access to the course. The exceptions are below.`] },
      { h: 'Always refunded', items: [
        'You were charged twice for the same plan.',
        'You were charged but never received access, and we could not fix it.',
        'We close your account without a good reason.',
        'Refunds that the law requires where you live.',
      ] },
      { h: 'One-month and three-month plans', p: ['Each is a single payment for that length of access. Nothing renews automatically and we never charge you again unless you choose to buy another plan. Buying again adds the new time on top of any time you have left.'] },
      { h: 'How to ask', p: [`Email ${CONTACT_EMAIL} from the address on your account, with the date of purchase. We reply within 2 business days. Approved refunds go back to the original payment method through our payment provider and normally arrive in 5 to 10 business days.`] },
    ],
  },
};
