import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

/**
 * Shared keyboard bottom inset for keeping focused fields above the software keyboard.
 * Prefer pairing with ScrollView / composer padding rather than platform-specific KAV only.
 */
export function useKeyboardBottomInset(): number {
  const [bottomInset, setBottomInset] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = Keyboard.addListener(showEvent, (event) => {
      setBottomInset(event.endCoordinates.height);
    });
    const onHide = Keyboard.addListener(hideEvent, () => {
      setBottomInset(0);
    });

    return () => {
      onShow.remove();
      onHide.remove();
    };
  }, []);

  return bottomInset;
}
