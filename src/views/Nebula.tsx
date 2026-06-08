import React, { useState } from "react";

export function Nebula({ closeFn = () => {} } = {}) {
  const [phase, setPhase] = useState("intro");

  if (phase === "intro") {
    return (
      <div key={1} className="nebula-view zoomIn">
        <p>Oooweee!</p>
        <p>You found a nebula!</p>

        <p>
          <iframe
            className="animation"
            src="/gwd-animations/nebula/index.html"
          ></iframe>
        </p>

        <button
          onClick={() => {
            setPhase("outcome");
          }}
        >
          Harvest
        </button>
      </div>
    );
  }

  return (
    <div key={2} className="nebula-view zoomIn">
      <p>You successfully harvested aether!</p>

      <p>
        <iframe
          className="animation"
          src="/gwd-animations/nebula/index.html"
        ></iframe>
      </p>

      <button
        className="close"
        onClick={() => {
          closeFn();
        }}
      >
        Claim
      </button>
    </div>
  );
}
