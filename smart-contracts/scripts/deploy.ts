import { ethers } from "hardhat";

async function main() {
  const [owner] = await ethers.getSigners();
  const wallet = new ethers.Wallet(
    "0xff4f55382dc1dad042411e64cf13eafaa051e78c9f343a3ffab8ce2408b74479"
  );

  // Deploy Vault Factory
  const vaultFactory = await ethers.deployContract("VaultFactory");
  await vaultFactory.waitForDeployment();
  console.log("vaultFactory", await vaultFactory.getAddress());

  // Deploy Vault
  const tx = await vaultFactory.deploy(wallet.address);
  await tx.wait();
  const vaultAddress = await vaultFactory.getVault(await owner.getAddress());
  console.log("vault", vaultAddress);

  // Deploy PoSTerminal
  const poSTerminal = await ethers.deployContract("PoSTerminal");
  await poSTerminal.waitForDeployment();
  console.log("posTerminal", await poSTerminal.getAddress());

  // Add terminal
  await vaultFactory.addTerminal(await poSTerminal.getAddress());
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
