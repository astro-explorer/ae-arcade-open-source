import React, { useState } from "react";

export function Shipwreck({ closeFn = () => {} } = {}) {
  const [phase, setPhase] = useState("intro");

  if (phase === "intro") {
    return (
      <div key={1} className="shipwreck-view zoomIn">
        <p>Holy smokes!</p>
        <p>You found a shipwreck!</p>

        <p>
          <iframe
            className="animation"
            src="/gwd-animations/shipwreck/index.html"
          ></iframe>
        </p>

        <button
          onClick={() => {
            setPhase("outcome");
          }}
        >
          Salvage
        </button>
      </div>
    );
  }

  return (
    <div key={2} className="shipwreck-view zoomIn">
      <p>You salvaged the wreck!</p>
      <p>You gained...</p>

      <p>
        <img
          className="small"
          src="/missions/electronics.png"
          alt="Electronics"
        />
        <img className="small" src="/missions/metal.png" alt="Metal" />
        <img className="small" src="/missions/fuel.png" alt="Fuel" />
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
