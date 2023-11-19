import { Wallet, ethers } from "ethers";
import { vaultFactoryAbi } from "../abi/VaultFactory";
import { vaultAbi } from "../abi/Vault";
import { poSTerminalAbi } from "../abi/PoSTerminal";
import { routerAbi } from "../abi/Router";
import { erc20abi } from "../abi/erc20";
import { Chains, chainConfig } from "../constants";
import { klaySwapRouterAbi } from "../abi/KlaySwapRouter";

const WALLET =
  "0xff4f55382dc1dad042411e64cf13eafaa051e78c9f343a3ffab8ce2408b74479";

export const sendBack = async (chain: Chains) => {
  const chainDetail = chainConfig[chain];
  const provider = new ethers.JsonRpcProvider(chainDetail.rpc);
  const signer = new ethers.Wallet(
    process.env.REACT_APP_POS_CONTRACT_OWNER!,
    provider
  );

  const vaultAddress = await getVaultFactory(signer, chain).getVault(
    await signer.getAddress()
  );

  const amount = await getErc20(chainDetail.usdt, signer).balanceOf(
    chainDetail.posTerminal
  );
  console.log("amount", amount.toString());

  const klaySwapContract = getKlaySwapRouter(chain, signer);

  const params = {
    tokenIn: chainDetail.usdt,
    tokenOut: chainDetail.usdc,
    fee: 500,
    recipient: vaultAddress,
    deadline: new Date().getTime() + 60 * 60 * 24 * 7,
    amountIn: amount,
    amountOutMinimum: 0,
    sqrtPriceLimitX96: 0,
  };

  const call = (
    await klaySwapContract
      .getFunction("exactInputSingle")
      .populateTransaction(params)
  ).data;

  const posTerminalContract = await getPoSTerminal(
    chainDetail.posTerminal,
    signer
  );

  const tx = await posTerminalContract.call(
    await klaySwapContract.getAddress(),
    call
  );

  const receipt = await tx.wait();
  return receipt.hash;
};

export const swap = async (chain: Chains) => {
  const chainDetail = chainConfig[chain];
  const provider = new ethers.JsonRpcProvider(chainDetail.rpc);
  const signer = new ethers.Wallet(
    process.env.REACT_APP_POS_CONTRACT_OWNER!,
    provider
  );

  const amount = await getErc20(chainDetail.usdt, signer).balanceOf(
    signer.address
  );
  console.log("amount", amount.toString());

  const klaySwapContract = getKlaySwapRouter(chain, signer);

  const params = {
    tokenIn: chainDetail.usdt,
    tokenOut: chainDetail.usdc,
    fee: 500,
    recipient: "0xaA14277d7010C5E10559F56C81DE5077ceCF7a6B",
    deadline: new Date().getTime() + 60 * 60 * 24 * 7,
    amountIn: amount,
    amountOutMinimum: 0,
    sqrtPriceLimitX96: 0,
  };

  const tx = await klaySwapContract.exactInputSingle(params);

  const receipt = await tx.wait();
  return receipt.hash;
};

export const sendKlayTransaction = async (
  chain: Chains,
  cardPrivateKey: string
) => {
  const chainDetail = chainConfig[chain];
  const provider = new ethers.JsonRpcProvider(chainDetail.rpc);
  const amount = ethers.parseUnits("10", 6);

  const signer = new ethers.Wallet(
    process.env.REACT_APP_POS_CONTRACT_OWNER!,
    provider
  );

  const hashedTransferCallData = ethers.getBytes(
    ethers.solidityPackedKeccak256(
      ["address", "uint256"],
      [chainDetail.usdc, amount]
    )
  );
  const wallet = new Wallet(cardPrivateKey);
  const signature = wallet.signMessage(hashedTransferCallData);

  const posTerminalContract = await getPoSTerminal(
    chainDetail.posTerminal,
    signer
  );
  const klaySwapContract = getKlaySwapRouter(chain);

  const params = {
    tokenIn: chainDetail.usdc,
    tokenOut: chainDetail.usdt,
    fee: 500,
    recipient: await posTerminalContract.getAddress(),
    deadline: new Date().getTime() + 60 * 60 * 24 * 7,
    amountIn: amount,
    amountOutMinimum: 0,
    sqrtPriceLimitX96: 0,
  };

  const secondCall = (
    await klaySwapContract
      .getFunction("exactInputSingle")
      .populateTransaction(params)
  ).data;

  const vaultAddress = await getVaultFactory(signer, chain).getVault(
    await signer.getAddress()
  );
  console.log("vaultAddress", vaultAddress);

  const tx = await posTerminalContract.transferAndCall(
    vaultAddress,
    chainDetail.usdc,
    amount,
    signature,
    await klaySwapContract.getAddress(),
    secondCall
  );
  const receipt = await tx.wait();
  return receipt.hash;
};

export const getVaultFactory = (
  runner: ethers.ContractRunner,
  chain: Chains
) => {
  const chainDetails = chainConfig[chain];
  return new ethers.Contract(
    chainDetails.vaultFactory,
    vaultFactoryAbi,
    runner
  );
};

export const getVault = (runner: ethers.ContractRunner, address: string) => {
  return new ethers.Contract(address, vaultAbi, runner);
};

export const getPoSTerminal = (
  address: string,
  runner: ethers.ContractRunner
) => {
  return new ethers.Contract(address, poSTerminalAbi, runner);
};

export const getErc20 = (address: string, runner: ethers.ContractRunner) => {
  return new ethers.Contract(address, erc20abi, runner);
};

export const getRouter = (chain: Chains) => {
  const chainDetails = chainConfig[chain];
  return new ethers.Contract(chainDetails.router, routerAbi);
};

export const getKlaySwapRouter = (
  chain: Chains,
  runner?: ethers.ContractRunner
) => {
  const chainDetails = chainConfig[chain];
  return new ethers.Contract(chainDetails.router, klaySwapRouterAbi, runner);
};

export async function approvePoSTerminal(chains: Chains) {
  console.log("start call");
  const chainDetails = chainConfig[chains];

  const provider = new ethers.JsonRpcProvider(chainDetails.rpc);
  const signer = new ethers.Wallet(
    process.env.REACT_APP_POS_CONTRACT_OWNER!,
    provider
  );

  const posTerminalContract = getPoSTerminal(chainDetails.posTerminal, signer);
  // Need to approve btoh usdc and usdt to return
  const token = getErc20(chainDetails.usdc, signer);

  const calldata = (
    await token
      .getFunction("approve")
      .populateTransaction(chainDetails.router, ethers.MaxUint256)
  ).data;

  const txn = await posTerminalContract.call(
    await token.getAddress(),
    calldata
  );
  const receipt = await txn.wait();
  console.log(receipt);
  return receipt.hash;
}

export async function approveKey(chains: Chains) {
  const chainDetails = chainConfig[chains];
  const provider = new ethers.JsonRpcProvider(chainDetails.rpc);
  const signer = new ethers.Wallet(
    process.env.REACT_APP_POS_CONTRACT_OWNER!,
    provider
  );

  const vaultAddress = await getVaultFactory(signer, chains).getVault(
    signer.getAddress()
  );
  console.log(vaultAddress);

  const vaultContract = getVault(signer, vaultAddress);
  const wallet = new Wallet(WALLET);

  const txn = await vaultContract.updateKey(wallet.getAddress());
  const rp = await txn.wait();
  console.log(rp);
  return rp.hash;
}
