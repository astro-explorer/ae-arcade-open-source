const {
  Transaction,
  decodeSignedTransaction,
  encodeObj,
  default: algosdk,
} = require("algosdk");
const admin = require("firebase-admin");
const { FieldValue } = require("firebase-admin/firestore");
const functions = require("firebase-functions");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));
const nacl = require("tweetnacl");
const NodeCache = require("node-cache");
const hash = require("hash.js");

const { ASSET_IDS, TRAITS, BONUS_ASSETS, SCORED_GAMES, ALL_GAMES } = require("./constants.json");

const BORK_COOLDOWN = process.env.FUNCTIONS_EMULATOR
  ? 30 * 1000 // 30 seconds when testing locally.
  : 4 * 60 * 60 * 1000; // 4 hours in production.

const ZERKER_COOLDOWN = process.env.FUNCTIONS_EMULATOR
  ? 20 * 1000 // 30 seconds when testing locally.
  : 3 * 60 * 60 * 1000; // 3 hours in production.
const BORK_ASSET_IDS_SET = new Set(ASSET_IDS.BORKS);
const placementAether = [50, 25, 10]

/** Caches stuff that's slow/expensive to fetch. */
const cache = new NodeCache();

// Start Firestore.
admin.initializeApp();
const db = admin.firestore();

const increment = FieldValue.increment;

function getStartOfWeekUTC(date = new Date()) {
  const day = date.getUTCDay(); // Day of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  const diff = date.getUTCDate() - day; // Subtract the day to get back to Sunday
  const startOfWeek = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), diff)
  )
    .toISOString()
    .slice(0, 10); // Create new UTC date
  return startOfWeek;
}

async function getAddressScores(address, weekStart) {
  const addressScores = (
    await db
      .collection("leaderboards")
      .where("weekStart", "==", weekStart)
      .where("address", "==", address)
      .get()
  ).docs.map((doc) => doc.data());

  return addressScores
}

async function getGameLeaderboard(gameId, weekStart, topN) {
  try {
    const leaderboard = (
      await db
        .collection("leaderboards")
        .where("weekStart", "==", weekStart)
        .where("gameId", "==", gameId)
        .orderBy("score", "desc")
        .limit(topN)
        .get()
    ).docs.map((doc) => doc.data());

    return leaderboard;
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return [];
  }
}

async function getLeaderboardsForGames(gameIds, weekStart, topN) {
  const leaderboards = []

  await Promise.all(
    gameIds.map(async (gameId) => {
      var leaderboard = await getGameLeaderboard(gameId, weekStart, topN);
      leaderboards.push(leaderboard)
    })
  )

  return leaderboards.flat();
}

async function addOrUpdateScore(address, assetId, gameId, weekStart, score, replayData) {
  try {
    // Query to check if the user already has a score for the game and week
    const scoresSnapshot =
      await db
        .collection("leaderboards")
        .where("address", "==", address)
        .where("gameId", "==", gameId)
        .where("weekStart", "==", weekStart)
        .get();

    if (!scoresSnapshot.empty) {
      // If a document exists, update the score if the new score is higher
      scoresSnapshot.forEach(async (docSnapshot) => {
        const currentScore = docSnapshot.data().score;
        if (score > currentScore) {
          await db
            .collection("leaderboards")
            .doc(docSnapshot.id)
            .set({ assetId: assetId, score: score, replayData: replayData }, { merge: true });

          console.log(
            `Updated score for user ${address} in ${gameId} for week ${weekStart}.`
          );
        } else {
          console.log(`Existing score is higher or equal. No update needed.`);
        }
      });
    } else {
      // If no document exists, create a new one
      await db
        .collection("leaderboards")
        .add({
          address: address,
          assetId: assetId,
          gameId: gameId,
          weekStart: weekStart,
          score: score,
          timestamp: Date.now(),
          replayData: replayData,
        });
      console.log(
        `Added new score for user ${address} in ${gameId} for week ${weekStart}.`
      );
    }
  } catch (error) {
    console.error("Error adding/updating score:", error);
  }
}

// Create and Deploy Your First Cloud Functions
// https://firebase.google.com/docs/functions/write-firebase-functions

exports.describeAlgoAccount = functions.https.onRequest(async (req, res) => {
  // Allow CORs.
  res.set("Access-Control-Allow-Origin", "*");

  // Validate address.
  const address = req.query.address;
  if (!/^[A-Z0-9]{58}$/.test(address)) {
    const errorMessage = "ERROR: Algo address is invalid.";
    console.error(errorMessage);
    res.send({ message: errorMessage });
    return;
  }

  const doc = await db.doc(`algoAccounts/${address}`).get();
  const data = doc.data() || {};

  res.send({
    countNebulas: data.countNebulas,
    countShipwrecks: data.countShipwrecks,
    countVikingLosses: data.countVikingLosses,
    countVikingWins: data.countVikingWins,
    countExplorations: data.countExplorations || 0,
  });
});

exports.getHighscores = functions.https.onRequest(async (req, res) => {
  // Allow CORs.
  res.set("Access-Control-Allow-Origin", "*");
  const gameId = req.query.gameId
  const address = req.query.address
  const weekStart = getStartOfWeekUTC();
  const gameIds = gameId ? [gameId] : SCORED_GAMES.map((game) => game.id)
  const scores = []

  if (address) {
    scores.push(await getAddressScores(address, weekStart));
  } else {
    scores.push(await getLeaderboardsForGames(gameIds, weekStart, 10));
  }

  res.send({
    scores: scores.flat(),
  });
});

exports.saveHighscore = functions
  .runWith({ secrets: ["DISCORD_WEBHOOK_URL"] })
  .https.onRequest(async (req, res) => {
  // Allow CORs.
  res.set("Access-Control-Allow-Origin", "*");

  // Parse and validate POST body. Fallback to query strings, for testing.
  const body = typeof req.body === "string" && JSON.parse(req.body);
  if (!body.address || !body.assetId || !body.token || !(body.score >= 1)) {
    const errorMessage = "ERROR: Inputs missing.";
    console.error(errorMessage);
    res.status(400).send({ message: errorMessage });
    return;
  }

  // Verify session.
  const sessionDocPromise = db.collection("sessions").doc(body.token).get();
  const sessionDoc = await sessionDocPromise;
  const sessionData = sessionDoc.data();
  const tokenIsValid =
    sessionData &&
    body.address === sessionData.algoAddress &&
    Date.now() < sessionData.expirationTimestamp;
  if (!tokenIsValid) {
    const errorMessage = "ERROR: The token is invalid.";
    console.error(errorMessage);
    res.status(403).send({ message: errorMessage });
    return;
  }

  // Verify asset is a Bork
  const assetIsBork = BORK_ASSET_IDS_SET.has(+body.assetId);
  if (!assetIsBork) {
    const errorMessage = "ERROR: This asset is not a bork.";
    console.error(errorMessage);
    res.status(400).send({ message: errorMessage });
    return;
  }

  // Verify valid game
  const game = SCORED_GAMES.find((scoredGame) => {
    return scoredGame.name === body.game;
  });
  if (!game) {
    const errorMessage = "ERROR: The game is invalid.";
    console.error(errorMessage);
    res.status(400).send({ message: errorMessage });
    return;
  }

  const weekStart = body.seed || getStartOfWeekUTC();

  // Notify in Discord
  const address = await checkNFD(body.address);
  const url = process.env.DISCORD_WEBHOOK_URL;
  var myEmbed = {
    title: `New ${game.name} Score`,
    description: `${body.score} achieved by ${address}`,
  };
  var params = {
    username: "AstroExplorer Bot",
    avatar_url:
      "https://cdn.discordapp.com/attachments/998335256425934861/1186707527249961121/AstroexplorerPFPsmol.png?ex=65943a82&is=6581c582&hm=551ea9a952c09fcd5a92037c77cdac829a38ae02526051e32a16ac5b88cf2302&",
    embeds: [myEmbed],
  };

  try {
    fetch(url, {
      method: "POST",
      body: JSON.stringify(params),
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (err) {
    console.log(err);
  }

  // Save to DB.
  const scoreObject = {
    address: body.address,
    assetId: body.assetId,
    gameID: game.id,
    weekStart: weekStart,
    score: +body.score
  };

  await Promise.all([
    // Update leaderboard.
    addOrUpdateScore(
      body.address,
      body.assetId,
      game.id,
      weekStart,
      +body.score,
      body.replayData || "",
    ),

    // Log event.
    db.collection("logs").add({
      event: "highscore",
      ...scoreObject,
      timestamp: new Date(),
      userAgent: req.headers["user-agent"] || null,
      ip: req.ip || null,
    }),
  ]);

  res.send({ success: true });
});

async function getCooldown(assetId) {
  // Validate asset ID.
  if (!BORK_ASSET_IDS_SET.has(assetId)) {
    const errorMessage = "ERROR: Asset ID isn't a Bork.";
    console.error(errorMessage);
    res.send({ message: errorMessage });
    return;
  }

  const assetData = (
    await db.collection("algoAssets").doc(String(assetId)).get()
  ).data();

  return calculateCooldown(assetId, assetData);
}

function calculateCooldown(assetId, data) {
  if(ASSET_IDS.ZERKER.includes(assetId)) {
    return (data?.lastExploreTimestamp?._seconds || 0) * 1000 + ZERKER_COOLDOWN;
  } else {
    return (data?.lastExploreTimestamp?._seconds || 0) * 1000 + BORK_COOLDOWN;
  }
}

exports.getCooldownsAlgo = functions.https.onRequest(async (req, res) => {
  // Allow CORs.
  res.set("Access-Control-Allow-Origin", "*");

  // Request cooldowns.
  const cooldowns = await Promise.all(
    req.query.assetIds
      .split(",")
      .map((assetId) => +assetId)
      .map((assetId) =>
        getCooldown(assetId).then((cooldown) => ({
          assetId,
          cooldown,
        }))
      )
  );

  res.send(cooldowns);
});

exports.getUsageStats = functions.https.onRequest(async (req, res) => {
  const explorationsResponse = await db
    .collection("logs")
    .where("event", "==", "explore")
    .count()
    .get();

  res.send({ explorations: explorationsResponse.data().count });
});

exports.explore = functions.runWith({ secrets: ["ESCROW_ADDRESS", "ESCROW_PASSPHRASE", "NODELY_API_TOKEN"] }).https.onRequest(async (req, res) => {
  // Allow CORs.
  res.set("Access-Control-Allow-Origin", "*");

  // Parse and validate POST body. Fallback to query strings, for testing.
  const body = typeof req.body === "string" && JSON.parse(req.body);
  if (!body.address || !body.assetId || !body.token) {
    const errorMessage = "ERROR: Inputs missing.";
    console.error(errorMessage);
    res.status(400).send({ message: errorMessage });
    return;
  }

  // Fetch data.
  const sessionDocPromise = db.collection("sessions").doc(body.token).get();
  const balancesPromise = getAlgoAssetBalances(body.assetId);

  // Verify session.
  const sessionDoc = await sessionDocPromise;
  const sessionData = sessionDoc.data();
  const tokenIsValid =
    sessionData &&
    body.address === sessionData.algoAddress &&
    Date.now() < sessionData.expirationTimestamp;
  if (!tokenIsValid) {
    const errorMessage = "ERROR: The token is invalid.";
    console.error(errorMessage);
    res.status(403).send({ message: errorMessage });
    return;
  }

  // Verify asset.
  const { balances } = await balancesPromise;
  const assetGrantsAccess =
    // Asset is a Bork.
    BORK_ASSET_IDS_SET.has(+body.assetId) &&
    // Player holds asset.
    balances?.[0]?.address === body.address;
  if (!assetGrantsAccess) {
    const errorMessage = "ERROR: This asset does not grant access.";
    console.error(errorMessage);
    res.status(403).send({ message: errorMessage });
    return;
  }

  // Determine fate.
  const trait = TRAITS[body.assetId];
  let outcome = "";
  let outcomeToken = "";
  let bonusAsset = "";
  const updatedAlgoAsset = {
    lastExploreTimestamp: new Date(),
    countExplorations: increment(1),
  };

  if (trait === "Magellan" || Math.random() > 0.1) {
    // Vikings.
    outcome = "vikings";

    // Roll for bonus ASA
    if (Math.random() < 0.1) {
      bonusAsset =
        BONUS_ASSETS[Math.floor(Math.random() * BONUS_ASSETS.length)];

      // Fetch the current USDC price for the ASA
      // Divide 0.1 by the price to get the amount equivalent to 0.1 USDC
      // Override the bonusAsset.amount with this new amount
      if (bonusAsset.variableAmount) {
        try {
          const url = `https://api.vestigelabs.org/assets/price?asset_ids=${bonusAsset.id}&network_id=0&denominating_asset_id=31566704`;
          const prices = await fetch(url, {
            method: "GET",
          }).then((res) => res.json());
          const price = prices[0];

          const bonusAmount = +(0.1 / price.price).toPrecision(3);
          bonusAsset.amount = bonusAmount;
        } catch (err) {
          // If we get a failure then the amount isn't overridden and we use
          // the pre-defined amount in constants.json
          console.log(err);
        }
      }
    }

    outcomeToken = Buffer.from(
      JSON.stringify({
        gameId: Math.floor(Math.random() * 6),
        outcome: outcome,
        assetId: body.assetId,
        timestamp: Date.now(),
        bonusAsset: bonusAsset,
      })
    ).toString("base64");
  } else {
    // Lost.
    outcome = "lost";
  }

  updatedAlgoAsset.outcome = outcome;
  updatedAlgoAsset.outcomeToken = outcomeToken;

  // Verify/update cooldown.
  const updatedCooldownSuccessfully = await db.runTransaction(async (txn) => {
    // Get asset.
    const assetRef = db.collection("algoAssets").doc(String(+body.assetId));
    const asset = await txn.get(assetRef);

    if (asset.exists) {
      // Handle existing assets.
      const cooldown = calculateCooldown(+body.assetId, asset.data());
      if (cooldown >= Date.now()) {
        return false;
      }
      txn.update(assetRef, updatedAlgoAsset);
      // txn.set(assetRef, updatedAlgoAsset);
    } else {
      // Handle new assets.
      txn.set(assetRef, updatedAlgoAsset);
    }

    return true;
  });
  if (!updatedCooldownSuccessfully) {
    const errorMessage = "ERROR: Bork is cooling down.";
    console.error(errorMessage);
    res.status(400).send({ message: errorMessage });
    return;
  }

  const docRef = db.doc(`algoAccounts/${body.address}`);
  const promisesToExecute = [
    // Create or Update Algo account.
    docRef.get().then((docSnapshot) => {
      const defaults = {
        lastExploreTimestamp: new Date(),
        countExplorations: increment(1),
      };
      if (docSnapshot.exists) {
        docRef.update(defaults)
      } else {
        docRef
          .set({
            ...defaults,
            firstExploreTimestamp: FieldValue.serverTimestamp(),
          })
      }
    }),

    // Log event.
    db.collection("logs").add({
      event: "explore",
      outcome,
      address: body.address,
      assetId: body.assetId,
      timestamp: new Date(),
      userAgent: req.headers["user-agent"] || null,
      ip: req.ip || null,
    }),
  ];

  /* Uncomment to track explores on chain
  if (outcome != "lost") {
    const noteString = `Explored on https://arcade.astroexplorer.co with asset ID: ${body.assetId}`;
    promisesToExecute.push(sendAether(body.address, 0, noteString));
  }
  */

  await Promise.all(promisesToExecute);
  res.send({ outcome, outcomeToken });
});

function hexToDecimal(hex) {
  return parseInt(hex.replace("#", ""), 16);
}

exports.claim = functions.runWith({ secrets: ["ESCROW_ADDRESS", "ESCROW_PASSPHRASE", "NODELY_API_TOKEN", "DISCORD_WEBHOOK_URL"] }).https.onRequest(async (req, res) => {
  // Allow CORs.
  res.set("Access-Control-Allow-Origin", "*");

  // Parse and validate POST body. Fallback to query strings, for testing.
  const body = typeof req.body === "string" && JSON.parse(req.body);
  if (
    !body.address ||
    !body.assetId ||
    !body.token ||
    !body.outcome ||
    !body.outcomeToken ||
    !body.amount
  ) {
    const errorMessage = "ERROR: Inputs missing.";
    console.error(errorMessage);
    res.status(400).send({ message: errorMessage });
    return;
  }

  // Fetch data.
  const sessionDocPromise = db.collection("sessions").doc(body.token).get();
  const balancesPromise = getAlgoAssetBalances(body.assetId);

  // Verify amounts make sense for the outcome.
  const amountsMakeSenseForVikingsOutcome =
    body.outcome === "vikings" && +body.amount >= 1 && +body.amount <= 3;
  if (!amountsMakeSenseForVikingsOutcome) {
    const errorMessage = "ERROR: Amounts don't make sense.";
    console.error(errorMessage);
    res.status(400).send({ message: errorMessage });
    return;
  }

  // Verify session.
  const sessionDoc = await sessionDocPromise;
  const sessionData = sessionDoc.data();
  const tokenIsValid =
    sessionData &&
    body.address === sessionData.algoAddress;
  if (!tokenIsValid) {
    const errorMessage = "ERROR: The token is invalid.";
    console.error(errorMessage);
    res.status(403).send({ message: errorMessage });
    return;
  }

  // Verify asset.
  const { balances } = await balancesPromise;
  const assetGrantsAccess =
    // Asset is a Bork.
    BORK_ASSET_IDS_SET.has(+body.assetId) &&
    // Player holds asset.
    balances?.[0]?.address === body.address;
  if (!assetGrantsAccess) {
    const errorMessage = "ERROR: This asset does not grant access.";
    console.error(errorMessage);
    res.status(403).send({ message: errorMessage });
    return;
  }

  // Verify correct game played
  const { bonusAsset, gameId } = JSON.parse(
    Buffer.from(body.outcomeToken, "base64").toString("utf8"),
  );
  if (gameId != body.gameId) {
    console.warn(body.address + " game mismatch");
  }

  // Verify outcome.
  const updatedOutcomeSuccessfully = await db.runTransaction(async (txn) => {
    // Get asset.
    const assetRef = db.collection("algoAssets").doc(String(+body.assetId));
    const asset = await txn.get(assetRef);
    const { outcome, outcomeToken } = asset.data();

    // Verify outcome and token.
    if (outcome !== body.outcome) {
      return false;
    }
    if (outcomeToken !== body.outcomeToken) {
      return false;
    }

    // Clear outcome and token.
    txn.update(assetRef, { outcome: "", outcomeToken: "" });
    return true;
  });

  if (!updatedOutcomeSuccessfully) {
    const errorMessage = "ERROR: Invalid outcome.";
    console.error(errorMessage);
    res.status(400).send({ message: errorMessage });
    return;
  }

  // Send Aether.
  let amount = +body.amount;
  const trait = TRAITS[body.assetId];
  if (trait === "Junk Collector") {
    amount += 1;
  }

  let amountsWon = `${amount} AETHER`;
  if (bonusAsset) {
    amountsWon += ` and ${bonusAsset.amount} ${bonusAsset.name}`;
  }

  // Get image from Pera API
  const assetThumbCache = new NodeCache();
  const assetThumbnail = await fetchAssetThumbnail(body.assetId);
  async function fetchAssetThumbnail(assetId) {
    const cacheKey = `thumb-${assetId}`;
    const cached = assetThumbCache.get(cacheKey);
    if (cached) return cached;

    try {
      const res = await fetch(`https://mainnet.api.perawallet.app/v1/public/assets/${assetId}`);
      if (!res.ok) throw new Error(`Failed to fetch asset ${assetId}`);
      const json = await res.json();
      const thumbUrl = json.collectible?.thumbnail_url;
      if (thumbUrl) {
        assetThumbCache.set(cacheKey, thumbUrl, 60 * 60); // Cache for 1 hour
      }
      return thumbUrl || null;
    } catch (err) {
      console.error(`Error fetching thumbnail for asset ${assetId}`, err);
      return null;
    }
  }

  const address = await checkNFD(body.address);
  const noteString = `Sending ${amount} Aether at ${Date.now()}`;
  const promiseToSendAether = sendAether(body.address, amount, noteString, bonusAsset);
  const url = process.env.DISCORD_WEBHOOK_URL;
  var myEmbed = {
    title: `New AstroExplorer Win`,
    description: `${amountsWon} won by ${address}`,
    fields: [
      {
        name: "Asset ID",
        value: body.assetId,
        inline: true,
      },
      {
        name: "Game",
        value: ALL_GAMES[gameId].name,
        inline: true,
      },
    ],
    image: {
      url:
        assetThumbnail || "https://astroexplorer.co/assets/images/hotdog.png",
    },
  };
  var params = {
    username: "AstroExplorer Bot",
    avatar_url:
      "https://cdn.discordapp.com/attachments/998335256425934861/1186707527249961121/AstroexplorerPFPsmol.png?ex=65943a82&is=6581c582&hm=551ea9a952c09fcd5a92037c77cdac829a38ae02526051e32a16ac5b88cf2302&",
    embeds: [myEmbed],
  };

  try {
    fetch(url, {
      method: "POST",
      body: JSON.stringify(params),
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (err) {
    console.log(err);
  }

  // Save to DB.
  await Promise.all([
    // Send Aether.
    promiseToSendAether,

    // Log event.
    db.collection("logs").add({
      event: "claim",
      amount: body.amount,
      outcome: body.outcome,
      address: body.address,
      assetId: body.assetId,
      timestamp: new Date(),
      userAgent: req.headers["user-agent"] || null,
      ip: req.ip || null,
    }),
  ]);

  res.send({ success: true });
});

exports.authenticate = functions
  .runWith({ secrets: ["NODELY_API_TOKEN"] })
  .https.onRequest(async (req, res) => {
  // Allow CORs.
  res.set("Access-Control-Allow-Origin", "*");

  // Parse and validate POST body. Fallback to query strings, for testing.
  const body = typeof req.body === "string" && JSON.parse(req.body);
  if (!body.address || !body.firstRound) {
    const errorMessage = "ERROR: Inputs missing.";
    console.error(errorMessage);
    res.send({ message: errorMessage });
    return;
  }

  // Verify signed transaction.
  const txn = await createAuthenticateAlgoTransaction(
    body.address,
    body.firstRound
  );
  if (txn.error) {
    console.error(txn.error);
    res.send({ message: txn.error });
    return;
  }

  // Verify transaction ID.
  const txnId = txn.txID();
  const blob = Buffer.from(body.blob, "base64");
  const signedTransaction = decodeSignedTransaction(blob);
  const signedTransactionId = signedTransaction.txn.txID();
  if (signedTransactionId !== txnId) {
    const errorMessage = "ERROR: Transaction was not recognized.";
    console.error(errorMessage);
    res.send({ message: errorMessage });
    return;
  }

  // Send transaction.
  try {
    const { txId, message } = await submitAlgoTransaction(blob);
    if (!txId) {
      throw `ERROR: Transaction failed... ${message}`;
    }
  } catch (err) {
    const errorMessage = "ERROR: Signature was invalid.";
    console.error(errorMessage, err);
    res.send({ message: errorMessage });
    return;
  }

  // Create token.
  // It expires in 28 days.
  const token = hash
    .sha256()
    .update(`Authenticated ${body.address} with Bork Borks at ${Date.now()}`)
    .digest("hex");
  const expirationTimestamp = Date.now() + 1000 * 60 * 60 * 24 * 28;

  // Save to DB.
  await Promise.all([
    // Add Algo account.
    db.collection("sessions").doc(token).set({
      algoAddress: body.address,
      expirationTimestamp,
      token,
    }),

    // Log event.
    db.collection("logs").add({
      event: "authenticate",
      address: body.address,
      timestamp: new Date(),
      userAgent: req.headers["user-agent"] || null,
      ip: req.ip || null,
    }),
  ]);

  res.send({ token });
});

// 5 0 * * 0 == 5 minutes past midnight UTC on Sunday
exports.scheduledTopGunPrizes = functions
  .runWith({ secrets: ["ESCROW_ADDRESS", "ESCROW_PASSPHRASE", "NODELY_API_TOKEN", "DISCORD_WEBHOOK_URL"] })
  .pubsub.schedule("5 0 * * 0")
  .timeZone("Etc/UTC")
  .onRun(async (context) => {
    const promisesToSendAether = [];
    const discordFields = [];
    const gameIds = SCORED_GAMES.map((game) => game.id);
    var date = new Date();
    date.setDate(date.getDate() - 1);
    const weekStart = getStartOfWeekUTC(date);
    const scores = await getLeaderboardsForGames(gameIds, weekStart, 3);

    for (const game of SCORED_GAMES) {
      const topScores = scores
        .filter((score) => score.gameId === game.id)
      let formattedScores = await formatTopScores(topScores);

      discordFields.push({
        name: game.name,
        value: formattedScores || "no scores",
      });

      topScores.forEach((score, index) => {
        const amount = placementAether[index];
        const noteString = `Placed #${index + 1} in ${
          game.name
        } with score: ${score}`;
        promisesToSendAether.push(
          sendAether(score.address, amount, noteString)
        );
      });
    }

    // Notify Discord
    const url = process.env.DISCORD_WEBHOOK_URL;
    var myEmbed = {
      title: "Top Guns",
      description: "Congrats to this week's Top Guns!",
      fields: discordFields,
    };
    var params = {
      username: "AstroExplorer Bot",
      avatar_url:
        "https://cdn.discordapp.com/attachments/998335256425934861/1186707527249961121/AstroexplorerPFPsmol.png?ex=65943a82&is=6581c582&hm=551ea9a952c09fcd5a92037c77cdac829a38ae02526051e32a16ac5b88cf2302&",
      embeds: [myEmbed],
    };

    try {
      fetch(url, {
        method: "POST",
        body: JSON.stringify(params),
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch (err) {
      console.log(err);
    }

    // send Aether
    await Promise.all(promisesToSendAether);

    return null;
  });

async function createAuthenticateAlgoTransaction(address, firstRound) {
  const params = await getAlgoTransactionParams();

  if (params.firstRound > firstRound + 1000) {
    return { error: "ERROR: First round is too late." };
  }

  const transaction = {
    ...params,
    firstRound: +firstRound,
    lastRound: +firstRound + 1000,
    assetIndex: ASSET_IDS.AETHER,
    type: "axfer",
    amount: 0,
    from: address,
    to: address,
    note: Uint8Array.from(`Authenticate with Bork Borks. ${+firstRound}`, (c) =>
      c.charCodeAt(0)
    ),
  };
  return new Transaction(transaction);
}

async function getAlgoTransactionParams() {
  // Prefer cached params.
  const cacheKey = "algo transaction params";
  const cachedParams = cache.get(cacheKey);
  if (cachedParams) {
    return cachedParams;
  }

  // Request params.
  const rawParams = await fetch(
    "https://mainnet-api.4160.nodely.dev/v2/transactions/params",
    {
      headers: {"X-Algo-api-token": process.env.NODELY_API_TOKEN},
    },
  ).then((res) => res.json());
  const params = {
    fee: 1000,
    flatFee: true,
    genesisHash: rawParams["genesis-hash"],
    genesisID: rawParams["genesis-id"],
    firstRound: rawParams["last-round"],
    lastRound: rawParams["last-round"] + 1000,
  };

  // Save for later.
  cache.set(cacheKey, params, 30 * 60); // 30 minutes

  return params;
}

async function getAlgoAssetBalances(assetId) {
  const response = await fetch(
    `https://mainnet-idx.4160.nodely.dev/v2/assets/${assetId}/balances?currency-greater-than=0&limit=1`,
    {
      headers: {"X-Indexer-api-token": process.env.NODELY_API_TOKEN}
    }
  )
  const text = await response.text();
  console.log('Raw Response Body:', text);
  return JSON.parse(text)
}

async function verifySignedTxn(signedTransaction) {
  const publicKeyBytes = signedTransaction.txn.from.publicKey;
  const signatureBytes = signedTransaction.sig;
  const transactionBytes = encodeObj(
    signedTransaction.txn.get_obj_for_encoding()
  );
  const msgBytes = new Uint8Array(transactionBytes.length + 2);
  msgBytes.set(Buffer.from("TX"));
  msgBytes.set(transactionBytes, 2);
  const verified = nacl.sign.detached.verify(
    msgBytes,
    signatureBytes,
    publicKeyBytes
  );
  return verified;
}

async function sendAether(address, amount, noteString, bonus = null) {
  const note = Uint8Array.from(noteString, (c) => c.charCodeAt(0));
  const params = await getAlgoTransactionParams();
  const txn = new Transaction({
    ...params,
    assetIndex: ASSET_IDS.AETHER,
    type: "axfer",
    amount: amount,
    from: process.env.ESCROW_ADDRESS,
    to: address,
    note,
  });
  const key = algosdk.mnemonicToSecretKey(process.env.ESCROW_PASSPHRASE);

  if (!!bonus) {
    const bonusAmount = Math.round(bonus.amount * Math.pow(10, bonus.decimals));
    // Hardcode the assetIndex and amount for single token payment
    const newTxn = new Transaction({
      ...params,
      assetIndex: bonus.id,
      type: "axfer",
      amount: bonusAmount,
      from: process.env.ESCROW_ADDRESS,
      to: address,
      note,
    });

    const bytes = algosdk.signTransaction(newTxn, key.sk);
    await submitAlgoTransaction(bytes.blob);
  }

  const bytes = algosdk.signTransaction(txn, key.sk);

  return submitAlgoTransaction(bytes.blob);
}

async function submitAlgoTransaction(signedTransactions) {
  const url = "https://mainnet-api.4160.nodely.dev/v2/transactions";
  return fetch(url, {
    method: "POST", // or 'PUT'
    headers: {
      "Content-Type": "application/x-binary",
      "X-Algo-api-token": process.env.NODELY_API_TOKEN
    },
    body: signedTransactions,
  }).then((response) => response.json());
}

async function checkNFD(address) {
  try {
    const response = await fetch(
      `https://api.nf.domains/nfd/address?address=${address}&limit=1&view=full`
    );
    const jsonResponse = await response.json();
    return jsonResponse[0].name;
  } catch (e) {
    return shortenAddress(address);
  }
}

function shortenAddress(address) {
  const divider = "…";
  return (
    encodeURIComponent(address.slice(0, 5)) +
    divider +
    encodeURIComponent(address.slice(-5))
  );
}

async function formatTopScores (topScores) {
  const formattedScores = await Promise.all(
    topScores
      .map(async(score, index) => {
        const address = await checkNFD(score.address);
        return `${placementAether[index]} Aether - ${address}: ${score.score}`;
      })
  )

  return formattedScores.join("\n");
}
