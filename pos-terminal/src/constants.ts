export const chainConfig = {
  klaytn: {
    name: "Klaytn",
    vaultFactory: "0x6e20fb06d22D122092a65aF537b4f9B6dAB27e00",
    posTerminal: "0xF5F744699a657F25C177a2582aEcC1d14b138412",
    rpc: "https://klaytn-baobab.blockpi.network/v1/rpc/public",
    usdc: "0xE6BF59A265E37992E2E3F97335144DD45B5cde46",
    usdt: "0x576cfd493aB3dB2ED06b107be2f1ec172f45f3BE",
    router: "0x53778575032262c677eda0DDa29608CAdbDcD75b",
    blockExplorer: "https://baobab.scope.klaytn.com/tx/",
  },
  klaytnmainnet: {
    name: "Klaytn Mainnet",
    vaultFactory: "0xec61d69964004eaa23ab76c721824650b9276e0a",
    posTerminal: "0x4CA8E42c9483dF5421c1d9b3d5794acDBF18f923",
    rpc: "https://public-en-cypress.klaytn.net",
    usdc: "0x754288077D0fF82AF7a5317C7CB8c444D421d103",
    usdt: "0xceE8FAF64bB97a73bb51E115Aa89C17FfA8dD167",
    router: "0x6C14E2e4bae412137437A8Ec9e57263212d141A0",
    blockExplorer: "https://scope.klaytn.com/tx/",
  },
} as Record<
  "klaytn" | "klaytnmainnet",
  {
    name: string;
    rpc: string;
    usdc: string;
    usdt: string;
    vaultFactory: string;
    router: string;
    posTerminal: string;
    blockExplorer: string;
  }
>;

export type Chains = keyof typeof chainConfig;
