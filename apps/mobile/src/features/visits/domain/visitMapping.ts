import type { ClientCategory } from '../../../data/domain/enums/clientCategory';
import type { EncounterType, ScreeningType } from '../../../data/domain/enums/domainEnums';

export function mapCategoryToVisitTypes(category: ClientCategory): {
  readonly encounterType: EncounterType;
  readonly screeningType: ScreeningType;
} {
  switch (category) {
    case 'pregnant':
      return { encounterType: 'antenatalVisit', screeningType: 'antenatal' };
    case 'postnatal':
      return { encounterType: 'postnatalVisit', screeningType: 'postnatal' };
    case 'newborn':
      return { encounterType: 'newbornVisit', screeningType: 'newborn' };
    case 'childUnderFive':
      return { encounterType: 'childVisit', screeningType: 'childUnderFive' };
    default: {
      const _exhaustive: never = category;
      return _exhaustive;
    }
  }
}
