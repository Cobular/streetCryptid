import { useEffect, useState } from 'react';
import { Keyboard, Platform, type KeyboardEvent } from 'react-native';

/**
 * The top edge of the software keyboard in window coordinates, or `null` while it is down.
 *
 * ## Why not `KeyboardAvoidingView`
 * On iOS it moves its content with `LayoutAnimation.configureNext`, and React Native's
 * LayoutAnimation and Reanimated's layout transitions both rewrite the same mount transaction: a
 * view with a `layout` transition inside one is a known glitch (react-native-reanimated#4815).
 * Screens pad themselves from this instead, and their own transitions animate the move.
 *
 * ## Which events
 * The same ones `KeyboardAvoidingView` uses. iOS announces the keyboard before it moves (`Will`)
 * and again when it changes height (emoji, QuickType); Android only after (`Did`), and re-emits
 * `keyboardDidShow` on a height change. An undocked, split or floating iPad keyboard is reported as
 * hidden, which is right: it is not anchored to the edge anything would move away from. With
 * "Prefer Cross-Fade Transitions" on, iOS reports `screenY` as 0 — not a keyboard at the top of the
 * window — so that is treated as nothing to avoid, as `KeyboardAvoidingView` treats it.
 */
export function useKeyboardTop(): number | null {
  const [top, setTop] = useState<number | null>(null);

  useEffect(() => {
    const ios = Platform.OS === 'ios';
    const subscriptions = [
      Keyboard.addListener(ios ? 'keyboardWillShow' : 'keyboardDidShow', (event: KeyboardEvent) =>
        setTop(event.endCoordinates.screenY > 0 ? event.endCoordinates.screenY : null)
      ),
      Keyboard.addListener(ios ? 'keyboardWillHide' : 'keyboardDidHide', () => setTop(null)),
    ];
    return () => subscriptions.forEach((subscription) => subscription.remove());
  }, []);

  return top;
}
