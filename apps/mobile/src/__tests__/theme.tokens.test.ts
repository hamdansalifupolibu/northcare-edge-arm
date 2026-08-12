import {
  colors,
  layout,
  motion,
  radii,
  semanticColors,
  spacing,
  theme,
  typography,
} from '../theme';

describe('design tokens', () => {
  it('exports approved brand colours', () => {
    expect(colors.primary).toBe('#0F766E');
    expect(colors.primaryDark).toBe('#115E59');
    expect(colors.primaryDarker).toBe('#064E49');
    expect(colors.accent).toBe('#F59E0B');
    expect(colors.background).toBe('#F7FAF9');
    expect(colors.surface).toBe('#FFFFFF');
    expect(colors.textPrimary).toBe('#17211F');
    expect(colors.textSecondary).toBe('#52615E');
    expect(colors.border).toBe('#DDE7E4');
    expect(colors.danger).toBe('#B42318');
    expect(colors.warning).toBe('#B54708');
    expect(colors.success).toBe('#067647');
    expect(colors.info).toBe('#1570EF');
  });

  it('exposes semantic colour aliases', () => {
    expect(semanticColors.action.primary).toBe(colors.primary);
    expect(semanticColors.status.urgent).toBe(colors.danger);
    expect(semanticColors.text.primary).toBe(colors.textPrimary);
  });

  it('includes Stitch spacing and 48dp touch target', () => {
    expect(spacing.xs).toBe(4);
    expect(spacing.sm).toBe(8);
    expect(spacing.md).toBe(12);
    expect(spacing.base).toBe(16);
    expect(spacing.lg).toBe(24);
    expect(spacing.xl).toBe(32);
    expect(layout.minTouchTarget).toBe(48);
    expect(layout.cardPadding).toBe(20);
  });

  it('includes Stitch radii', () => {
    expect(radii.sm).toBe(8);
    expect(radii.md).toBe(12);
    expect(radii.lg).toBe(16);
    expect(radii.pill).toBe(999);
  });

  it('defines Plus Jakarta Sans typography styles', () => {
    expect(typography.fontFamily.regular).toContain('PlusJakartaSans');
    expect(typography.styles.displayLarge.fontSize).toBe(32);
    expect(typography.styles.bodyLarge.fontSize).toBe(16);
    expect(typography.styles.caption.fontSize).toBe(13);
  });

  it('defines motion constants without requiring an animation library', () => {
    expect(motion.duration.standard).toBe(200);
    expect(motion.duration.fast).toBe(120);
    expect(motion.distance.entrance).toBe(8);
    expect(motion.scale.press).toBe(0.98);
  });

  it('freezes the theme object shape', () => {
    expect(theme.colors.primary).toBe('#0F766E');
    expect(theme.layout.minTouchTarget).toBe(48);
  });
});
