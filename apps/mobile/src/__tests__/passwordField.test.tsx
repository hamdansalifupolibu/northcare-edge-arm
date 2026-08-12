import React from 'react';
import renderer, { act } from 'react-test-renderer';

import { PasswordField } from '../design-system/forms/PasswordField';
import { en } from '../i18n/en';

describe('PasswordField', () => {
  it('hides password by default and exposes show control', () => {
    let tree: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <PasswordField
          label={en.auth.passwordLabel}
          value="secret-value"
          onChangeText={() => undefined}
          testID="login-password"
        />,
      );
    });
    const json = JSON.stringify(tree!.toJSON());
    expect(json).toContain(en.auth.passwordLabel);
    expect(json).toContain(en.auth.showPasswordShort);
    expect(json).not.toContain(en.auth.hidePasswordShort);

    const toggle = tree!.root.findByProps({ testID: 'login-password-visibility' });
    act(() => {
      toggle.props.onPress();
    });
    const shown = JSON.stringify(tree!.toJSON());
    expect(shown).toContain(en.auth.hidePasswordShort);
  });

  it('resets visibility on unmount cleanup', () => {
    let tree: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <PasswordField
          label={en.auth.passwordLabel}
          value="secret-value"
          onChangeText={() => undefined}
          testID="pwd"
        />,
      );
    });
    const toggle = tree!.root.findByProps({ testID: 'pwd-visibility' });
    act(() => {
      toggle.props.onPress();
    });
    expect(JSON.stringify(tree!.toJSON())).toContain(en.auth.hidePasswordShort);

    act(() => {
      tree!.unmount();
    });
    act(() => {
      tree = renderer.create(
        <PasswordField
          label={en.auth.passwordLabel}
          value="secret-value"
          onChangeText={() => undefined}
          testID="pwd"
        />,
      );
    });
    expect(JSON.stringify(tree!.toJSON())).toContain(en.auth.showPasswordShort);
  });

  it('does not put the password into the visibility control label', () => {
    let tree: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <PasswordField
          label="Temporary password"
          value="TempWorker12Ab"
          onChangeText={() => undefined}
          helperText="Share through an authorised channel."
          testID="admin-temp"
        />,
      );
    });
    const json = JSON.stringify(tree!.toJSON());
    expect(json).toContain('Temporary password');
    expect(json).toContain('Share through an authorised channel.');
    const toggle = tree!.root.findByProps({ testID: 'admin-temp-visibility' });
    expect(toggle.props.accessibilityLabel).toBe(en.auth.showPassword);
    expect(String(toggle.props.accessibilityLabel)).not.toContain('TempWorker12Ab');
  });
});
