export type WorkerHealthTip = {
  readonly id: string;
  readonly text: string;
};

/** General wellness reminders — not clinical advice or protocols. */
export const WORKER_HEALTH_TIPS: readonly WorkerHealthTip[] = [
  {
    id: 'ht01',
    text: 'Drink clean water, eat fresh foods, and get enough rest. Small choices lead to a healthier you.',
  },
  {
    id: 'ht02',
    text: 'Wash your hands before and after every client visit — it protects you and the families you serve.',
  },
  {
    id: 'ht03',
    text: 'Take short breaks between visits. A steady pace keeps your care thoughtful and safe.',
  },
  {
    id: 'ht04',
    text: 'Carry water and shade when working in the afternoon heat. Your wellbeing matters too.',
  },
  {
    id: 'ht05',
    text: 'Speak clearly and listen patiently. Trust grows when people feel heard.',
  },
];
