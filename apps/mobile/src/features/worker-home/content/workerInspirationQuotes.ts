export type InspirationBucket = 'morning' | 'afternoon' | 'evening' | 'night';

export type WorkerInspirationQuote = {
  readonly id: string;
  readonly text: string;
  readonly attribution?: string;
};

/** Non-clinical worker motivation only — not medical advice. */
export const WORKER_INSPIRATION_QUOTES: Record<
  Exclude<InspirationBucket, 'night'>,
  readonly WorkerInspirationQuote[]
> = {
  morning: [
    { id: 'm01', text: 'Every community visit begins with listening.' },
    { id: 'm02', text: 'You bring care closer to home.' },
    { id: 'm03', text: 'Small steps this morning protect families tomorrow.' },
    { id: 'm04', text: 'Start with kindness — it opens every conversation.' },
    { id: 'm05', text: 'Your presence reassures mothers and caregivers.' },
    { id: 'm06', text: 'Prepare well; document what you observe clearly.' },
    { id: 'm07', text: 'A calm start helps you notice what matters.' },
    { id: 'm08', text: 'Trust is built one respectful visit at a time.' },
    { id: 'm09', text: 'Frontline work is community work — you are not alone.' },
    { id: 'm10', text: 'When connectivity is weak, your judgment still counts.' },
    { id: 'm11', text: 'Check your tools and notes before you go out.' },
    { id: 'm12', text: 'Families remember how they were treated, not only what was said.' },
    { id: 'm13', text: 'Lead with patience — mornings set the tone for the day.' },
    { id: 'm14', text: 'Ask when unsure; escalate when protocols require it.' },
    { id: 'm15', text: 'Care begins close to home — and you make that real.' },
    { id: 'm16', text: 'One focused visit can change a whole week for a family.' },
    { id: 'm17', text: 'Protect your energy: steady work beats rushed work.' },
    { id: 'm18', text: 'Community health grows when workers show up consistently.' },
    { id: 'm19', text: 'Note what you see; clarity helps the next worker too.' },
    { id: 'm20', text: 'Today’s shift is a chance to strengthen trust.' },
  ],
  afternoon: [
    { id: 'a01', text: 'Steady work saves lives — take one task at a time.' },
    { id: 'a02', text: 'The afternoon is for finishing well, not rushing.' },
    { id: 'a03', text: 'Pause briefly; a clear mind catches important details.' },
    { id: 'a04', text: 'Teamwork multiplies what one worker can do alone.' },
    { id: 'a04b', text: 'Document before you forget — future you will thank you.' },
    { id: 'a05', text: 'Hydrate and breathe; long days need steady workers.' },
    { id: 'a06', text: 'If a case feels urgent, follow your facility pathway.' },
    { id: 'a07', text: 'Respectful language keeps doors open in the community.' },
    { id: 'a08', text: 'Offline records on this device still serve families when synced.' },
    { id: 'a09', text: 'Check pending reminders and requests before you close out.' },
    { id: 'a10', text: 'Good handovers protect continuity of care.' },
    { id: 'a11', text: 'You do not have to solve everything in one visit.' },
    { id: 'a12', text: 'Accuracy matters more than speed in clinical notes.' },
    { id: 'a13', text: 'Celebrate small wins — immunisation kept, referral made.' },
    { id: 'a14', text: 'When in doubt, confirm with the client in plain language.' },
    { id: 'a15', text: 'Community requests are people asking for help — respond with dignity.' },
    { id: 'a16', text: 'Your notes help the next visit start faster and safer.' },
    { id: 'a17', text: 'Protect client privacy on shared devices — lock when you step away.' },
    { id: 'a18', text: 'Afternoon heat is real; pace yourself in the field.' },
    { id: 'a19', text: 'Refer early when danger signs are present — that is good care.' },
    { id: 'a20', text: 'Finish the task you started before opening a new one.' },
  ],
  evening: [
    { id: 'e01', text: 'Finish well. Rest restores your strength for tomorrow.' },
    { id: 'e02', text: 'Handled does not mean alone — escalate when needed.' },
    { id: 'e03', text: 'Review what is still open; plan the first task for tomorrow.' },
    { id: 'e04', text: 'You carried care through another day — that matters.' },
    { id: 'e05', text: 'Lock the app when your shift ends on this device.' },
    { id: 'e06', text: 'Sync when connectivity returns; the device kept your work safe.' },
    { id: 'e07', text: 'Leave clear notes so night or morning staff can continue.' },
    { id: 'e08', text: 'Rest is part of sustainable frontline work.' },
    { id: 'e09', text: 'Not every problem closes today — honest follow-up is enough.' },
    { id: 'e10', text: 'Thank the families who trusted you with their stories.' },
    { id: 'e11', text: 'Debrief with a colleague if a visit was difficult.' },
    { id: 'e12', text: 'Tomorrow’s community needs you rested and present.' },
    { id: 'e13', text: 'Close loops on reminders you can complete tonight.' },
    { id: 'e14', text: 'Evening is for reflection, not self-criticism.' },
    { id: 'e15', text: 'Your work extends beyond one screen — it lives in the community.' },
    { id: 'e16', text: 'Charge the device; tomorrow may start early.' },
    { id: 'e17', text: 'Privacy after hours: notifications stay generic by design.' },
    { id: 'e18', text: 'Caregivers remember workers who return when promised.' },
    { id: 'e19', text: 'Step away when your shift is done — boundaries protect care quality.' },
    { id: 'e20', text: 'Smarter care. Stronger communities — including you.' },
  ],
};
