"use client";

import { Button } from "@/components/ui/button";
import { useBearStore } from "@/store/customStore";

export default function OwnTesting() {
  const { addABear, bears } = useBearStore();

  return (
    <div>
      <h1>{`Hey there bro! The number of bears is ${bears}`}</h1>
      <h1>If you press the button below, you will increase the number</h1>

      <Button onClick={addABear}>PRESS MEEEEEEEE</Button>
    </div>
  );
}
