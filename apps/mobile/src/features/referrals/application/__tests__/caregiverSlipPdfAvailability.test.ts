import {
  isCaregiverSlipPdfAvailable,
  resetCaregiverSlipPdfAvailabilityCacheForTests,
} from '../caregiverSlipPdf';

describe('isCaregiverSlipPdfAvailable', () => {
  afterEach(() => {
    resetCaregiverSlipPdfAvailabilityCacheForTests();
  });

  it('returns false when the optional ExpoPrint native module is null', () => {
    const probe = jest.fn(() => null);
    expect(isCaregiverSlipPdfAvailable(probe)).toBe(false);
    expect(probe).toHaveBeenCalledWith('ExpoPrint');
  });

  it('returns true when the optional ExpoPrint native module is present', () => {
    const probe = jest.fn(() => ({ printAsync: jest.fn() }));
    expect(isCaregiverSlipPdfAvailable(probe)).toBe(true);
    expect(probe).toHaveBeenCalledWith('ExpoPrint');
  });

  it('returns false when the optional probe throws', () => {
    const probe = jest.fn(() => {
      throw new Error('Cannot find native module');
    });
    expect(isCaregiverSlipPdfAvailable(probe)).toBe(false);
  });

  it('memoises the first probe result', () => {
    const probe = jest.fn(() => null);
    expect(isCaregiverSlipPdfAvailable(probe)).toBe(false);
    expect(isCaregiverSlipPdfAvailable(probe)).toBe(false);
    expect(probe).toHaveBeenCalledTimes(1);
  });
});
