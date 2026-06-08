import React from "react";
import { urlParams } from "../urlParams";
import { Challenge } from "./Challenge";
import { ExploreAnimation } from "./ExploreAnimation";
import { Nebula } from "./Nebula";
import { Shipwreck } from "./Shipwreck";
import { Sorry } from "./Sorry";
import { Vikings } from "./Vikings";

const assetId = +urlParams.get("assetId")! || 0;

const views: { [key: string]: React.ReactElement } = {
  Challenge: <Challenge />,
  ExploreAnimation: <ExploreAnimation />,
  Nebula: <Nebula />,
  Shipwreck: <Shipwreck />,
  Sorry: <Sorry />,
  Vikings: <Vikings assetId={assetId} outcome="fail" />,
};

export function DebugView({ view }: { view: string }) {
  if (views[view]) {
    return views[view];
  }

  const links = Object.keys(views).map((key) => (
    <p key={key}>
      <a href={`?debugView=${key}`}>{key}</a>
    </p>
  ));
  return (
    <div className="debug-views">
      <h1>Debug Views</h1>
      {links}
    </div>
  );
}
