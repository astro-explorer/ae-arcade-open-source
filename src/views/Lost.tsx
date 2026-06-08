import React from "react";

export function Lost({ closeFn = () => {} } = {}) {
  return (
    <div className="vikings-view zoomIn">
      <h2 className="response-view">Oh no!</h2>
      <p>Your crew member got lost. They'll need time to refuel.</p>

      <button
        className="close"
        onClick={() => {
          closeFn();
        }}
      >
        Close
      </button>
    </div>
  );
}
