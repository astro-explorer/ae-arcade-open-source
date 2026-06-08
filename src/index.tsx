import "./polyfill";

import React from "react";
import ReactDOM from "react-dom/client";
// import { playNextSong } from "./music";
import { App } from "./views/App";
import { DebugView } from "./views/DebugView";
import { urlParams } from "./urlParams";

// Allow for debugging.
const debugView = urlParams.get("debugView");
const component = debugView !== null ? <DebugView view={debugView} /> : <App />;

// Render.
const root = ReactDOM.createRoot(document.getElementById("app")!);
root.render(component);

// Music is now started from the Homepage component.
// playNextSong(updateSongInfoCallback);