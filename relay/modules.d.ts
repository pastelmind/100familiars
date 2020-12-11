/**
 * @file Type definitions for 3rd-party libraries.
 */

declare module "vhtml" {
  function h(name: string, attrs?: Record<string, any>): string;

  // Let's borrow JSX types from Preact
  import { JSX } from "preact";
  export import JSX = JSX;
}
