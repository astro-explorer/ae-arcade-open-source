import { ASSET_IDS } from "../functions/constants.json";

const BORK_ASSET_IDS_SET = new Set(ASSET_IDS.BORKS);

/** Saves last explorer. */
export function saveLastExplorer(assetId: number) {
  localStorage.lastExplorerAssetIt = assetId;
}

/** Loads last explorer. */
export function loadLastExplorer() {
  return +localStorage.lastExplorerAssetIt;
}

/** Get Bork asset IDs belonging to a given address. */
export async function getAlgorandAccountContents(address: string) {
  const [{ aether, assetIdsHeld }] = await Promise.all([
    fetchAlgorandAssetsAccountHolds(address),
  ]);

  const uniqueAssetIds = [...new Set(assetIdsHeld)];
  const borkAssetIds = uniqueAssetIds.filter((assetId) =>
    BORK_ASSET_IDS_SET.has(assetId)
  );

  return { aether, borkAssetIds };
}

/** Gets asset IDs an account currently holds. */
async function fetchAlgorandAssetsAccountHolds(address: string) {
  let aether = 0;
  const assetIdsHeld: number[] = [];
  const allAssetIds: number[] = [];

  // Fetch assets, potentially in multiple pages.
  let next = "";
  do {
    // Create URL.
    let url = `https://mainnet-idx.4160.nodely.dev/v2/accounts/${address}/assets?limit=1000`;
    if (next) {
      url += `&next=${next}`;
    }

    // Request assets.
    const { "next-token": nextToken, assets = [] } = await fetch(url).then(
      (res) => res.json()
    );

    // Determine next token.
    next = nextToken || "";
    if (assets.length < 1000) {
      // Avoid pointless next tokens.
      next = "";
    }

    // Store all asset ids in localstorage
    allAssetIds.push(assets.map((asset: any) => asset["asset-id"]))

    // Count Aether balance.
    aether +=
      assets.find((asset: any) => asset["asset-id"] === ASSET_IDS.AETHER)
        ?.amount || 0;

    // Find held asset IDs.
    const assetIdsToPush = assets
      .filter((asset: any) => asset.amount === 1)
      .map((asset: any) => asset["asset-id"]);
    assetIdsHeld.push(...assetIdsToPush);
  } while (next);

  localStorage.allAssetIds = allAssetIds;

  return { aether, assetIdsHeld };
}