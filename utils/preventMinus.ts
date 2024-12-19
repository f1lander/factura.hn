import { KeyboardEvent } from "react";

export default function preventMinus(e: KeyboardEvent<HTMLInputElement>) {
  const invalidKeys: string[] = ["-", "e", "E", "+"];
  if (invalidKeys.includes(e.key)) {
    e.preventDefault();
  }
}
