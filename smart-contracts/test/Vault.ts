import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("Vault", function () {
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deploySetup() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount, terminal, thirdParty] =
      await ethers.getSigners();

    const testToken = await ethers.deployContract("TestToken");

    const wallet = ethers.Wallet.createRandom();

    const vaultFactory = await ethers.deployContract("VaultFactory");

    await vaultFactory.deploy(wallet.address);

    const poSTerminal = await ethers.deployContract("PoSTerminal");

    const vaultAddress = await vaultFactory.getVault(owner.address);
    const vault = await ethers.getContractAt("Vault", vaultAddress);

    await testToken.transfer(await vaultAddress, ethers.parseEther("100"));

    await vaultFactory.addTerminal(terminal.address);
    await vaultFactory.addTerminal(poSTerminal.getAddress());

    return {
      testToken,
      vault,
      owner,
      otherAccount,
      wallet,
      terminal,
      poSTerminal,
      thirdParty,
    };
  }

  it("transfers into vault", async function () {
    const { testToken, vault } = await loadFixture(deploySetup);

    expect(await testToken.balanceOf(vault.getAddress())).to.equal(
      ethers.parseEther("100")
    );
  });

  it("should call transfer", async function () {
    const { testToken, vault, otherAccount, wallet, terminal } =
      await loadFixture(deploySetup);
    const amount = ethers.parseEther("1");
    const tokenAddress = await testToken.getAddress();

    const encodedData = (
      await testToken
        .getFunction("transfer")
        .populateTransaction(otherAccount, amount)
    ).data;

    const hashedCalldata = ethers.getBytes(
      ethers.solidityPackedKeccak256(
        ["address", "uint256", "bytes"],
        [tokenAddress, 0, encodedData]
      )
    );

    const signature = await wallet.signMessage(hashedCalldata);

    await vault
      .connect(terminal)
      .call(tokenAddress, encodedData, signature, tokenAddress, amount);

    expect(await testToken.balanceOf(otherAccount)).to.equal(amount);
  });

  it("should transferAndTransfer", async function () {
    const { testToken, vault, wallet, poSTerminal, thirdParty } =
      await loadFixture(deploySetup);
    const amount = ethers.parseEther("1");
    const tokenAddress = await testToken.getAddress();

    const hashedCalldata = ethers.getBytes(
      ethers.solidityPackedKeccak256(
        ["address", "uint256"],
        [tokenAddress, amount]
      )
    );

    const signature = await wallet.signMessage(hashedCalldata);
    console.log("signature", signature);

    const secondCall = (
      await testToken
        .getFunction("transfer")
        .populateTransaction(thirdParty, amount)
    ).data;

    const address = await poSTerminal.owner();

    await poSTerminal.transferAndCall(
      await vault.getAddress(),
      tokenAddress,
      amount,
      signature,
      tokenAddress,
      secondCall
    );

    expect(await testToken.balanceOf(thirdParty)).to.equal(amount);
  });

  it("should make transfer", async function () {
    const { testToken, vault, otherAccount, wallet, terminal } =
      await loadFixture(deploySetup);

    const amount = ethers.parseEther("1");

    const hashedCalldata = ethers.getBytes(
      ethers.solidityPackedKeccak256(
        ["address", "uint256"],
        [await testToken.getAddress(), amount]
      )
    );

    const signature = await wallet.signMessage(hashedCalldata);

    await vault
      .connect(terminal)
      .transfer(testToken.getAddress(), amount, signature);

    expect(await testToken.balanceOf(terminal)).to.equal(amount);
  });
});
