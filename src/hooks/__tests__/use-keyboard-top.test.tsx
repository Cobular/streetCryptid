import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { DeviceEventEmitter, Platform, Text } from 'react-native';

import { useKeyboardTop } from '../use-keyboard-top';

/**
 * iOS and Android announce the keyboard with different events, and a screen that listened for the
 * wrong ones would never move on that platform.
 */
function Probe() {
  const top = useKeyboardTop();
  return <Text>{top == null ? 'down' : String(top)}</Text>;
}

const shown = (screenY: number) => ({
  endCoordinates: { screenX: 0, screenY, width: 400, height: 300 },
});

describe('useKeyboardTop', () => {
  const os = Platform.OS;
  let renderer: ReactTestRenderer;
  const reading = () => renderer.root.findByType(Text).props.children;
  const emit = (event: string, payload: unknown = {}) =>
    act(() => {
      DeviceEventEmitter.emit(event, payload);
    });

  afterEach(() => {
    act(() => renderer.unmount());
    Platform.OS = os;
  });

  it('follows the keyboard on iOS before it moves', () => {
    Platform.OS = 'ios';
    act(() => {
      renderer = create(<Probe />);
    });
    expect(reading()).toBe('down');

    emit('keyboardWillShow', shown(544));
    expect(reading()).toBe('544');
    emit('keyboardWillHide');
    expect(reading()).toBe('down');
  });

  it('treats the cross-fade report of a keyboard at the top of the window as none', () => {
    Platform.OS = 'ios';
    act(() => {
      renderer = create(<Probe />);
    });
    emit('keyboardWillShow', shown(0));
    expect(reading()).toBe('down');
  });

  it('follows the keyboard on Android, which only reports it after it has moved', () => {
    Platform.OS = 'android';
    act(() => {
      renderer = create(<Probe />);
    });
    emit('keyboardWillShow', shown(544));
    expect(reading()).toBe('down');

    emit('keyboardDidShow', shown(544));
    expect(reading()).toBe('544');
    // A taller keyboard (emoji, suggestions) is re-announced as another show.
    emit('keyboardDidShow', shown(480));
    expect(reading()).toBe('480');
    emit('keyboardDidHide');
    expect(reading()).toBe('down');
  });
});
