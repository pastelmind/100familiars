/**
 * @file Type definitions for 3rd-party libraries.
 */

declare module "vhtml" {
  function h(name: string, attrs?: Record<string, any>): string;

  // Let's borrow JSX types from Preact
  import { JSX } from "preact";
  namespace JSX {
    export import IntrinsicElements = JSX.IntrinsicElements;
    export type Element = string;
  }
}
