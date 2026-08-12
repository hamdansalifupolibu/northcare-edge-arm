import { classifyAssistantIntent } from '../domain/intents';
import { setupAssistantTest } from './helpers';

describe('assistant safety routing', () => {
  it('classifies boundary intents conservatively', () => {
    expect(
      classifyAssistantIntent({
        normalisedQuestion: 'what condition does this client have',
        privacyFlagged: false,
      }),
    ).toBe('patientSpecificQuestion');
    expect(
      classifyAssistantIntent({
        normalisedQuestion: 'please diagnose this illness',
        privacyFlagged: false,
      }),
    ).toBe('diagnosisRequest');
    expect(
      classifyAssistantIntent({
        normalisedQuestion: 'what treatment protocol should i use',
        privacyFlagged: false,
      }),
    ).toBe('treatmentRequest');
    expect(
      classifyAssistantIntent({
        normalisedQuestion: 'what medicine should i give',
        privacyFlagged: false,
      }),
    ).toBe('medicationRequest');
    expect(
      classifyAssistantIntent({
        normalisedQuestion: 'what dosage in mg should i use',
        privacyFlagged: false,
      }),
    ).toBe('dosageRequest');
    expect(
      classifyAssistantIntent({
        normalisedQuestion: 'this is an emergency and not breathing',
        privacyFlagged: false,
      }),
    ).toBe('emergencyOrUrgentRequest');
  });

  it('routes ask() through fixed boundaries without client context', async () => {
    const { services, manager } = await setupAssistantTest('development');

    const patient = await services.ask({
      question: 'Should I refer this mother?',
    });
    expect(patient.kind).toBe('boundary');
    if (patient.kind === 'boundary') {
      expect(patient.boundary.answerability).toBe('patientSpecificBoundary');
    }

    const diagnosis = await services.ask({ question: 'Please diagnose fever' });
    expect(diagnosis.kind).toBe('boundary');
    if (diagnosis.kind === 'boundary') {
      expect(diagnosis.boundary.answerability).toBe('diagnosisBoundary');
    }

    const medication = await services.ask({ question: 'What medicine should I give?' });
    expect(medication.kind).toBe('boundary');
    if (medication.kind === 'boundary') {
      expect(medication.boundary.answerability).toBe('medicationBoundary');
    }

    const urgent = await services.ask({
      question: 'Emergency — severe bleeding now',
    });
    expect(urgent.kind).toBe('boundary');
    if (urgent.kind === 'boundary') {
      expect(urgent.boundary.answerability).toBe('urgentBoundary');
      expect(urgent.boundary.body).not.toMatch(/\d{3}/);
    }

    const general = await services.ask({
      question: 'What is example care topic A',
    });
    expect(general.kind).toBe('answer');

    await manager.close();
  });

  it('fails closed in production with no pilot packs', async () => {
    const { services, manager } = await setupAssistantTest('production');
    expect(services.getAvailability().mode).toBe('UNAVAILABLE');
    const result = await services.ask({ question: 'What is example care topic A' });
    expect(result.kind).toBe('unavailable');
    await manager.close();
  });
});
