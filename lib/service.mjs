export const SERVICE = "https://brain.usebrainchain.com";
export const DECISION_PAGE = "https://usebrainchain.com/decision";
export const PARTNER = "bench";
export const ENDPOINT = `${SERVICE}/x402/grades/for/${PARTNER}`;
export const PARTNER_PRICE = 10_000n;
// The desk's wallet, the first of network.json's desks. An offer that names another payee is refused.
export const PAY_TO = "0x97D558417c3D61f1074422AD843e1Db1E565b952";

// Both lanes pay by EIP-3009: one signature for the exact amount, payee and deadline, and no standing allowance.
export const LANES = {
  robinhood: {
    chain: "Robinhood Chain",
    network: "eip155:4663",
    chainId: 4663,
    token: "USDG",
    asset: "0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168",
    domain: { name: "Global Dollar", version: "1" },
    rpc: "https://rpc.mainnet.chain.robinhood.com",
  },
  base: {
    chain: "Base",
    network: "eip155:8453",
    chainId: 8453,
    token: "USDC",
    asset: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    domain: { name: "USD Coin", version: "2" },
    rpc: "https://mainnet.base.org",
  },
};

export function presetFor(payOn = "robinhood") {
  const lane = LANES[payOn];
  if (!lane) throw new Error(`unknown payment lane ${payOn}; use robinhood or base`);
  return { payOn, endpoint: ENDPOINT, payTo: PAY_TO, priceUnits: PARTNER_PRICE.toString(), ...lane, domain: { ...lane.domain } };
}

export const statusUrl = (grade) => `${SERVICE}/x402/grades/${grade}`;
export const decisionPage = (id) => `${DECISION_PAGE}?id=${id}`;
export const usd = (units) => (Number(units) / 1e6).toFixed(2);
