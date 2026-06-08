import React from "react";
import { resetModel } from "../model";
import { refresh } from "./refresh";
import { AdPrimary } from "./AdPrimary";
import { Footnote } from "./Footnote";

export function Sorry() {
  return (
    <div className="text-align-center font-size-large padding-20">
      <img className="logo" src="/ae-hero.png" alt="Astro Explorer" />

      {/* <AdPrimary /> */}

      <h1>Web3’s P2E Retro&nbsp;Arcade</h1>

      <h3>🛸 Sorry, you don't have any Astro&nbsp;Explorer assets 🛸</h3>

      <p>Adopt one and start exploring!</p>
      
      <div className="adopt-container">
        <div className="adopt-item">
          <img
            src="/assets/images/adopt-bork.jpg"
            alt="Bork Bork"
            className="adopt-image"
          />
          <p>
            <a
              href="https://www.asalytic.app/collection/bork-borks"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-adopt"
            >
              Adopt a Bork Bork
            </a>
          </p>
        </div>

        <div className="adopt-item">
          <img
            src="/assets/images/adopt-zerker.jpg"
            alt="Zerker"
            className="adopt-image"
          />
          <p>
            <a
              href="https://www.asalytic.app/collection/zerkers"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-adopt"
            >
              Adopt a Zerker
            </a>
          </p>
        </div>
      </div>

      <p>
      👤 <a
          href="#"
          onClick={(e) => {
            e.preventDefault();

            resetModel();
            refresh();
          }}
        >
          Choose another account
        </a> 👤
      </p>

      <Footnote />

    </div>
  );
}
