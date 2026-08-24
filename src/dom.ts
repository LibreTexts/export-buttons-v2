/**
 * @file Small DOM helpers.
 */

/**
 * `Object.assign` onto a DOM node with the property bag left unchecked.
 *
 * The widget assigns strings to `classList` (valid at runtime via the IDL's
 * `[PutForwards=value]`) and booleans to `ariaHidden`/`ariaExpanded` (coerced by the
 * setter). Both are correct in the browser but rejected by `lib.dom`'s types, so this
 * helper deliberately opts out of checking the bag while preserving `Object.assign`
 * semantics exactly.
 *
 * @param target - The node to assign onto.
 * @param props - The properties to copy onto the node.
 * @returns The same node, for chaining.
 */
export const assignProps = <T extends Node>(target: T, props: Record<string, unknown>): T => (
  Object.assign(target, props)
);
