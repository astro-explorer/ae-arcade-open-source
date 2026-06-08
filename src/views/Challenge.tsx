import React, { useEffect, useState } from "react";
import { loadLastExplorer } from "../assetIds";
import { getHighscores, saveHighscore } from "../functions";
import { model } from "../model";
import { getReadableAddress } from "../wallets";
import { fetchAssetThumbnail } from "../fetchAssetObject";

export function Challenge({
  assetIds = [] as number[],
  closeFn = () => {},
  startGameFn = () => {},
  gameId = "" as string,
  title = "" as string,
} = {}) {
  const [highscoresCacheBuster, setHighscoresCacheBuster] = useState(0);
  const [lastScore, setLastScore] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [highscores, setHighscores] = useState([] as any[]);
  const [highscoresLoaded, setHighscoresLoaded] = useState(false);
  const [thumbnails, setThumbnails] = useState<{ [id: number]: string }>({});

  // Pick a Bork.
  const lastExplorer = loadLastExplorer();
  const assetId = assetIds.includes(lastExplorer)
    ? lastExplorer
    : assetIds[(Math.random() * assetIds.length) | 0];

  // Load thumbnail for selected Bork
  const [assetThumbUrl, setAssetThumbUrl] = useState<string | null>(null);
  useEffect(() => {
    fetchAssetThumbnail(assetId).then(setAssetThumbUrl);
  }, [assetId]);

  // Load highscores
  useEffect(() => {
    getHighscores(gameId).then(async ({ scores }) => {
      const thumbnailMap: { [id: number]: string } = {};
      const highscores = await Promise.all(
        scores
          .map(async (highscore: any) => ({
            ...highscore,
            address: await getReadableAddress(highscore.address),
          }))
      );

      await Promise.all(
        highscores.map(async (score: any) => {
          const id = score.assetId;
          if (!thumbnailMap[id]) {
            const thumb = await fetchAssetThumbnail(id);
            thumbnailMap[id] = thumb ?? "/assets/images/hotdog.png";
          }
        })
      );

      setHighscores(highscores);
      setThumbnails(thumbnailMap);
      setHighscoresLoaded(true);
    });
  }, [highscoresCacheBuster]);

  function getStartOfWeekUTC() {
    const date = new Date();
    const day = date.getUTCDay(); // Day of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
    const diff = date.getUTCDate() - day; // Subtract the day to get back to Sunday
    const startOfWeek = new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), diff)
    )
      .toISOString()
      .slice(0, 10); // Create new UTC date
    return startOfWeek;
  }

  function start(startGame: any, replayData?: string) {
    const seed = getStartOfWeekUTC();
    setPlaying(true);
    startGame({
      seed: seed,
      challengeMode: true,
      replayData: replayData,
      onFinishGame: async (
        lives: number,
        score: number,
        saveReplayData: string
      ) => {
        var saveData = "";
        setPlaying(false);
        if (replayData) {
          return;
        }
        if (score > Math.max(...highscores.map((hs) => hs.score))) {
          saveData = saveReplayData;
        }
        setLastScore(score);
        await saveHighscore(
          model.wallet,
          assetId,
          model.token,
          score,
          title,
          seed,
          saveData
        );

        // Refresh high scores after waiting a bit for Firestore to sync.
        setTimeout(() => {
          setHighscoresCacheBuster(Date.now());
        }, 2000);
      },
    });
  }

  if (playing) {
    return null;
  }

  return (
    <div className="challenge-view zoomIn">
      <h2>{title}</h2>

      <div className="inner-wrapper">
        <p
          className="current-score"
          style={{ display: lastScore >= 1 ? "block" : "none" }}
        >
          You scored <strong>{lastScore}</strong> !
        </p>

        <button
          className="back"
          onClick={() => {
            closeFn();
          }}
        >
          Back
        </button>

        <button
          className="start"
          onClick={() => {
            start(startGameFn);
          }}
        >
          Play
        </button>

        <div className="high-scores">
          <p className="top-gun-header">🏆 Top Guns 🏆</p>
          <p className="top-gun-subhead">
            *Resets at midnight UTC every Sunday*
          </p>
          {!highscoresLoaded ? (
            <p>Loading...</p>
          ) : highscores.length === 0 ? (
            <p>No recent scores...</p>
          ) : (
            highscores.map((highscore) => (
              <p className="score" key={highscore.address}>
                <a
                  href={
                    "https://explorer.perawallet.app/asset/" +
                    highscore.assetId
                  }
                  target="_blank"
                >
                  <img
                    src={thumbnails[highscore.assetId] || "/assets/images/hotdog.png"}
                    loading="lazy"
                  />
                </a>
                {highscore.address}: <strong>{highscore.score}</strong>
                {highscore.replayData && (
                  <button
                    className="replay"
                    onClick={() => {
                      start(startGameFn, highscore.replayData);
                    }}
                  >
                    Watch Replay
                  </button>
                )}
              </p>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
