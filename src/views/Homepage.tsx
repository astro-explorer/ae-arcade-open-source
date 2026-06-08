// @ts-nocheck
import React, { useEffect, useState } from "react";
import {
  getAlgorandAccountContents,
  saveLastExplorer,
} from "../assetIds";
import {
  describeAlgoAccount,
  explore,
  getCooldowns,
  getHighscores,
} from "../functions";
import { model, resetModel } from "../model";
import { toggleSong, playNextSong, isAudioPlaying } from "../music";
import { sleep } from "../sleep";
import { disconnectWallet, shortenAddress } from "../wallets";
import { Training } from "./Training";
import { Challenge } from "./Challenge";
import { ExploreAnimation } from "./ExploreAnimation";
import { Lost } from "./Lost";
import { refresh } from "./refresh";
import { Sorry } from "./Sorry";
import { Vikings } from "./Vikings";
import { AdPrimary } from "./AdPrimary";
import { Footnote } from "./Footnote";
import { SCORED_GAMES } from "../../functions/constants.json";
import { fetchAssetThumbnail } from "../fetchAssetObject";
import { muteOnBackground } from "../music";
// @ts-ignore: Game 6 is in JavaScript
import { startGame6 } from "../game6/main";
import { startSpaceInvadersGame } from "../space-invaders/game";

export function Homepage() {
  const [loaded, setLoaded] = useState(false);
  const [assetIds, setAssetIds] = useState([] as number[]);
  const [selectedAssetId, setSelectedAssetId] = useState(0);
  const [highScores, setHighScores] = useState([]);
  const [cooldownPerAssetId, setCooldownPerAssetId] = useState(
    {} as { [key: number]: number }
  );
  const [coolingAssetIds, setCoolingAssetIds] = useState([] as number[]);
  const [aether, setAether] = useState(0);
  const [stats, setStats] = useState(null as any);
  const [timestamp, setTimestamp] = useState(Date.now());
  const [explorationOutcome, setExplorationOutcome] = useState("");
  const [explorationOutcomeToken, setExplorationOutcomeToken] = useState("");
  const [currentSongInfo, setCurrentSongInfo] = useState("");
  const [isMuted, setIsMuted] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [thumbnails, setThumbnails] = useState<{ [assetId: number]: string }>({});
  const [assetsFetched, setAssetsFetched] = useState(false);

  // Initialize the audio state
  useEffect(() => {
    playNextSong(setCurrentSongInfo, setIsMuted, setIsLoading);
  }, []);

  // Mute audio when tab is not focused
  useEffect(() => {
  const cleanup = muteOnBackground();
    return cleanup;
  }, []);

  // Close the dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const dropdownElement = document.querySelector(".dropdown");
      if (dropdownElement && !dropdownElement.contains(event.target as Node)) {
        setDropdownVisible(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  function toggleDropdown() {
    setDropdownVisible((prevState) => !prevState);
  }

  function refreshAccount() {
    getAlgorandAccountContents(model.wallet).then(
      async ({ aether, borkAssetIds }) => {
        let assetIds = borkAssetIds.sort((a, b) => a - b);
        let coolingAssetIds = [] as number[];
        let cooldownPerAssetId = {} as { [key: number]: number };

        if (assetIds.length >= 1) {
          const cooldowns: any[] = await getCooldowns(assetIds);

          assetIds = cooldowns
            .filter(({ cooldown }) => cooldown < Date.now())
            .map(({ assetId }) => assetId);

          cooldownPerAssetId = cooldowns
            .filter(({ cooldown }) => cooldown >= Date.now())
            .reduce((map, { assetId, cooldown }) => {
              map[assetId] = cooldown;
              return map;
            }, {});

          coolingAssetIds = Object.keys(cooldownPerAssetId)
            .map(Number)
            .sort((a, b) => a - b);
        }

        setAether(aether);
        setAssetIds(assetIds);
        setCoolingAssetIds(coolingAssetIds);
        setCooldownPerAssetId(cooldownPerAssetId);
        setAssetsFetched(true);
      }
    );

    // Fetch highscores...
    getHighscores(null, model.wallet).then((response) => {
      const highScores = SCORED_GAMES.map((game) => {
        const gameScore = response.scores.find((score) => {
          return score.gameId === game.id;
        });
        return {
          gameId: game.id,
          gameName: game.name,
          score: gameScore?.score || 0,
        };
      });
      setHighScores(highScores);
    });
  }


  useEffect(refreshAccount, [model.wallet]);

  // Wait for the thumbnails to load before setting loaded to true
  useEffect(() => {
    async function loadThumbnailsAndSetLoaded() {
      if (!assetsFetched) return;

      const allIds = [...assetIds, ...coolingAssetIds];
      const newThumbs: { [assetId: number]: string } = {};

      await Promise.all(
        allIds.map(async (id) => {
          const url = await fetchAssetThumbnail(id);
          newThumbs[id] = url ?? "/assets/images/hotdog.png";
        })
      )

      setThumbnails((prev) => ({ ...prev, ...newThumbs }));
      setLoaded(true);
    }

    loadThumbnailsAndSetLoaded();
  }, [assetIds, coolingAssetIds, assetsFetched]);

  useEffect(() => {
    describeAlgoAccount(model.wallet).then(setStats);
  }, [model.wallet, timestamp]);

  if (!loaded || !assetsFetched) {
    return (
      <div className="text-align-center font-size-large padding-16">
        <img className="arcade-logo" src="/ae-hero.png" alt="Astro Explorer Logo" />
        < AdPrimary />
        🐶👾 Waiting for your Fleet 👾🐶
        <div className="spinner" />
      </div>
    );
  }

  if (assetIds.length === 0 && coolingAssetIds.length === 0) {
    return <Sorry />;
  }

  function closeFn() {
    setExplorationOutcome("");
    setLoaded(false);

    refreshAccount();
  }

  if (explorationOutcome === "training") {
    return <Training closeFn={closeFn} />;
  }

  if (explorationOutcome === "challenge") {
    const allAssetIds = assetIds.concat(coolingAssetIds);
    return (
      <Challenge
        assetIds={allAssetIds}
        closeFn={closeFn}
        startGameFn={startSpaceInvadersGame}
        gameId="game1"
        title="Space Viking Invasion"
      />
    );
  }

  if (explorationOutcome === "challenge-gravity") {
    const allAssetIds = assetIds.concat(coolingAssetIds);
    return (
      <Challenge
        assetIds={allAssetIds}
        closeFn={closeFn}
        startGameFn={startGame6}
        gameId="game6"
        title="Gravity Gauntlet"
      />
    );
  }

  if (explorationOutcome === "explore") {
    return <ExploreAnimation />;
  }

  if (explorationOutcome === "vikings") {
    return (
      <Vikings
        assetId={selectedAssetId}
        outcome={explorationOutcome}
        outcomeToken={explorationOutcomeToken}
        closeFn={closeFn}
      />
    );
  }

  if (explorationOutcome === "lost") {
    return <Lost closeFn={closeFn} />;
  }

  async function onClickExplore(assetId: number) {
    // Show animation for a bit.
    const sleepPromise = sleep(2000);
    // Send request.
    const responsePromise = explore(
      // @ts-ignore
      localStorage.getItem("address"),
      assetId,
      model.token
    );

    setExplorationOutcome("explore");
    setSelectedAssetId(assetId);

    saveLastExplorer(assetId);

    try {
      const { status, json } = await responsePromise;

      // Wait for animation.
      await sleepPromise;

      // Verify status.
      if (status === 403) {
        alert("Please authenticate again.");
        await disconnectWallet();
        resetModel();
        refresh();
      } else if (status >= 400) {
        throw "ERROR: Status " + status;
      }

      // Note: There might be a better way to do this.
      if (json.outcome === "nebula") {
        setAether(aether + 1);
      }

      // Update view.
      setExplorationOutcome(json.outcome);
      setExplorationOutcomeToken(json.outcomeToken);
      setTimestamp(Date.now());
    } catch (err) {
      // Update cooldowns.
      refreshAccount();
      setExplorationOutcome("");
    }
  }

  const optionsEls = assetIds.map((assetId) => (
    <div
      className="option"
      key={assetId}
      onClick={() => onClickExplore(assetId)}
    >
      <img
        src={thumbnails[assetId]}
        loading="lazy"
        onError={(e) => (e.target.src = "/assets/images/hotdog.png")}
      />
      <div className="button">Explore</div>
    </div>
  ));

  const coolingBorksEls = coolingAssetIds.map((assetId) => {
    const cooldown = cooldownPerAssetId[assetId];
    const secondsRemaining = Math.floor((cooldown - Date.now()) / 1000);
    const hoursRemaining = Math.floor(secondsRemaining / 60 / 60);
    const minutesRemaining = Math.floor((secondsRemaining / 60) % 60);
    const remainingText =
      secondsRemaining < 60
        ? "very soon"
        : `in ${hoursRemaining > 0 ? `${hoursRemaining}h` : ""}${minutesRemaining}m`;

    return (
      <div className="option cooling" key={assetId}>
        <img
          src={thumbnails[assetId] ?? "/assets/images/hotdog.png"}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = "/assets/images/hotdog.png";
          }}
        />
        <div className="button">Ready {remainingText}</div>
      </div>
    );
  });

  let statsEl = <></>;
if (stats) {
  statsEl = (
    <section className="stats-card">
      <h2 id="statsHeading" className="stats-heading">Ship Hull</h2>

      <div className="stats-top">
        <div className="aether-block">
          <img className="aether-image" src="/missions/aether.png" alt="Aether" />
        </div>

        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-label">Your Aether: </span>
            <span className="stat-value">{aether}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Total Explorations: </span>
            <span className="stat-value">{stats.countExplorations}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Playable Assets: </span>
            <span className="stat-value">{assetIds.length}</span>
          </div>
          <div className="stat-item stat-scores">
            <span className="stat-label">Weekly High Scores: </span>
            <ul className="scores-list">
              {highScores.map((highScore) => (
                <li key={highScore.gameId}>
                  <span className="score-game">{highScore.gameName}: </span>
                  <span className="score-value">{highScore.score}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="stats-actions">
        <a
          className="btn-raffle"
          href="https://raffles.astroexplorer.co"
          target="_blank"
          rel="noopener noreferrer nofollow"
        >
          Enter Raffles
        </a>

        <span className="signed-in">
          Signed in as {shortenAddress(model.wallet)}
          <a
            className="btn-logoff"
            href="#"
            onClick={async (e) => {
              e.preventDefault();
              await disconnectWallet();
              resetModel();
              refresh();
            }}
          >
            Log out
          </a>
        </span>
      </div>
    </section>
  );
}

let musicEl = (
  <section className="radio-card" role="region" aria-labelledby="radioHeading">
    <h3 id="radioHeading" className="radio-heading">🎵  Now Playing 🎵 </h3>
    {!isLoading && !isMuted && currentSongInfo && (
      <div className="now-playing">{currentSongInfo}</div>
    )}
    <div className="radio-controls">
      {isLoading ? (
        <div className="radio-status">
          🔃 Loading…
        </div>
      ) : isMuted ? (
        <div className="radio-status">
          🔇 (
          <a
            className="song-toggle"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              toggleSong(setCurrentSongInfo, setIsMuted, setIsLoading);
            }}
          >
            Unmute
          </a>
          )
        </div>
      ) : (
        <div className="radio-status">
          🔊 (
          <a
            className="song-toggle"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              toggleSong(setCurrentSongInfo, setIsMuted, setIsLoading);
            }}
          >
            Mute
          </a>
          ) &nbsp;&nbsp; ⏭️ (
          <a
            className="song-toggle"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              playNextSong(setCurrentSongInfo, setIsMuted, setIsLoading);
            }}
          >
            Skip
          </a>
          )
        </div>
      )}
    </div>
  </section>
);



  function onClickTraining() {
    setExplorationOutcome("training");
  }

  function onClickChallenge() {
    setExplorationOutcome("challenge");
  }

  function onClickChallengeGravity() {
    setExplorationOutcome("challenge-gravity");
  }

  return (
    //@ts-ignore
    <>
      <div className="menu">

        <div className="menu-item">
          <button className="training" onClick={onClickTraining}>
            Train
          </button>
        </div>
        <div className="dropdown">
          <button className="dropdown-toggle" onClick={toggleDropdown}>
            Compete
          </button>
          {dropdownVisible && (
            <div className="dropdown-menu">
              <button onClick={onClickChallenge} className="challenge">
                Space Viking Invasion
              </button>
              <button
                onClick={onClickChallengeGravity}
                className="challenge-gravity"
              >
                Gravity Gauntlet
              </button>
            </div>
          )}
        </div>

      </div>
      <img className="arcade-logo" src="/ae-hero.png" alt="Astro Explorer" />
      < AdPrimary />
      <div className="options">
        <div className="inner-wrapper">
          {optionsEls}
          {coolingBorksEls}
        </div>
      </div>

      {statsEl}
      {musicEl}

      <Footnote />

    </>
  );
}