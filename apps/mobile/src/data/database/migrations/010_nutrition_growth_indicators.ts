import type { Migration } from './types';

/** Nutrition growth z-scores — persist WHO indicator panel on reference results. */
export const migration010NutritionGrowthIndicators: Migration = {
  version: 10,
  name: '010_nutrition_growth_indicators',
  checksum: 'nutrition-growth-indicators-json',
  async up(db) {
    await db.execAsync(`
      ALTER TABLE nutrition_reference_results
        ADD COLUMN growth_indicators_json TEXT;
    `);
  },
};
