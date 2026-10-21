/**
 * Minimal DOM-backed stand-in for `react-native`, used only by the vitest harness.
 * `react-native` is a peerDependency; tests render these to jsdom so we can assert on
 * text, testIDs, accessibility labels and press handlers.
 */
import * as React from 'react'

type AnyProps = Record<string, any>

function domProps(props: AnyProps): AnyProps {
  const out: AnyProps = {}
  if (props.testID !== undefined) out['data-testid'] = props.testID
  if (props.accessibilityLabel !== undefined) out['aria-label'] = props.accessibilityLabel
  if (props.accessibilityRole !== undefined) out.role = props.accessibilityRole
  if (props.pointerEvents !== undefined) out['data-pointer-events'] = props.pointerEvents
  if (props.onLayout) out['data-has-layout'] = 'true'
  return out
}

export const View = React.forwardRef<HTMLDivElement, AnyProps>(function View(props, ref) {
  return <div ref={ref} {...domProps(props)}>{props.children}</div>
})

export const Text = (props: AnyProps) => <span {...domProps(props)}>{props.children}</span>

export const ScrollView = React.forwardRef<unknown, AnyProps>(function ScrollView(props, ref) {
  React.useImperativeHandle(ref, () => ({ scrollTo: () => {} }))
  return <div {...domProps(props)}>{props.children}</div>
})

export const Pressable = (props: AnyProps) => (
  <button
    type="button"
    {...domProps(props)}
    disabled={props.disabled}
    onClick={() => props.onPress?.()}
  >
    {typeof props.children === 'function' ? props.children({ pressed: false }) : props.children}
  </button>
)

export const TouchableOpacity = Pressable
export const Image = (props: AnyProps) => <img alt="" {...domProps(props)} />
export const Modal = (props: AnyProps) => <div data-modal="true">{props.children}</div>

export const Dimensions = {
  get: (_: string) => ({ width: 390, height: 844, scale: 2, fontScale: 1 }),
}

export const StyleSheet = {
  create: <T extends Record<string, unknown>>(styles: T): T => styles,
  flatten: (style: unknown) => style,
}
