import React from 'react';
import renderer, { act } from 'react-test-renderer';

import { RiskBadge, RiskIcon, RiskSummaryCard } from '../../../design-system';
import { RISK_COPY } from '../../../design-system/risk/riskLabels';
import { MissingInformationCard } from '../components/MissingInformationCard';
import { PriorityResultHeader } from '../components/PriorityResultHeader';
import { RulePackUnavailableState } from '../components/RulePackUnavailableState';
import { WorkerAcknowledgement } from '../components/WorkerAcknowledgement';
import { riskStrings } from '../i18n/riskStrings';

function renderJson(element: React.ReactElement): string {
  let tree: renderer.ReactTestRenderer;
  act(() => {
    tree = renderer.create(element);
  });
  return JSON.stringify(tree!.toJSON());
}

describe('risk UI states', () => {
  it('renders RED, AMBER, GREEN and UNDETERMINED with non-colour labels', () => {
    for (const level of ['red', 'amber', 'green', 'undetermined'] as const) {
      const card = renderJson(<RiskSummaryCard level={level} />);
      const badge = renderJson(<RiskBadge level={level} />);
      const icon = renderJson(<RiskIcon level={level} />);
      expect(card).toContain(RISK_COPY[level].title);
      expect(badge).toContain(RISK_COPY[level].title);
      expect(icon).toContain(RISK_COPY[level].accessibilityLabel);
    }
  });

  it('renders explanation header, missing information and acknowledgement', () => {
    const header = renderJson(
      <PriorityResultHeader
        priority="amber"
        developmentBanner={riskStrings.developmentBanner}
      />,
    );
    expect(header).toContain(RISK_COPY.amber.title);
    expect(header).toContain(riskStrings.developmentBanner);

    const missing = renderJson(
      <MissingInformationCard
        items={[
          {
            questionKey: 'item_a1',
            sectionId: null,
            reason: 'unknown',
            requiredByRuleIds: ['syn-red-example-condition-a'],
            workerFacingLabel: 'Assessment item item_a1 needs a recorded answer',
            blocking: true,
            sourceReference: null,
          },
        ]}
      />,
    );
    expect(missing).toContain(riskStrings.missingTitle);
    expect(missing).toContain('item_a1');

    const ack = renderJson(
      <WorkerAcknowledgement checked={false} onChange={() => undefined} />,
    );
    expect(ack).toContain(riskStrings.acknowledgeLabel);
    expect(ack).toContain(riskStrings.overrideUnavailable);
  });

  it('renders rule-pack unavailable state without exposing registry internals', () => {
    const json = renderJson(
      <RulePackUnavailableState onReturnToVisit={() => undefined} />,
    );
    expect(json).toContain(riskStrings.unavailableTitle);
    expect(json).toContain(riskStrings.unavailableBody);
    expect(json).not.toContain('synthetic-dev-priority');
    expect(json).not.toContain('APPROVED_FOR_DEVELOPMENT');
  });

  it('labels superseded vs current in history wording helpers', () => {
    expect(riskStrings.currentBadge).toBe('Current');
    expect(riskStrings.supersededBadge).toBe('Superseded');
  });
});
