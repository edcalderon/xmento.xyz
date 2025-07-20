import hre from "hardhat";
export async function deployMockTokens(owner) {
  // Using fully qualified name to resolve the naming conflict
  const ERC20Mock = await hre.ethers.getContractFactory("contracts/ERC20Mock.sol:ERC20Mock");
  const cUSD = await ERC20Mock.deploy("cUSD Stablecoin", "cUSD");
  const cEUR = await ERC20Mock.deploy("cEUR Stablecoin", "cEUR");
  const cREAL = await ERC20Mock.deploy("cREAL Stablecoin", "cREAL");
  
  return { cUSD, cEUR, cREAL };
}

export async function deployDummyDex() {
  const DummyDex = await hre.ethers.getContractFactory("DummyDex");
  return await DummyDex.deploy();
}

export async function deployYieldOracle(owner) {
  const YieldOracle = await hre.ethers.getContractFactory("YieldOracle");
  const oracle = await YieldOracle.deploy(owner.address);
  
  // Set initial APYs
  const { cUSD, cEUR, cREAL } = await deployMockTokens(owner);
  await oracle.updateAPY(await cUSD.getAddress(), 5);
  await oracle.updateAPY(await cEUR.getAddress(), 5);
  await oracle.updateAPY(await cREAL.getAddress(), 5);
  
  return { oracle };
}

export async function setupVault() {
  const [owner, user] = await hre.ethers.getSigners();
  const { oracle } = await deployYieldOracle(owner);
  const dex = await deployDummyDex();
  const { cUSD, cEUR, cREAL } = await deployMockTokens(owner);
  
  // Deploy the vault implementation (not initialized)
  const Vault = await hre.ethers.getContractFactory("XmentoVault");
  const vault = await Vault.deploy();
  await vault.waitForDeployment();
  
  // Mint and approve tokens
  const amount = hre.ethers.parseEther("1000");
  const userAddress = await user.getAddress();
  
  await cUSD.mint(userAddress, amount);
  await cEUR.mint(userAddress, amount);
  await cREAL.mint(userAddress, amount);
  
  await cUSD.connect(user).approve(await vault.getAddress(), amount);
  await cEUR.connect(user).approve(await vault.getAddress(), amount);
  await cREAL.connect(user).approve(await vault.getAddress(), amount);
  
  return { 
    vault, 
    cUSD, 
    cEUR, 
    cREAL, 
    dex, 
    oracle, 
    owner, 
    user, 
    userAddress 
  };
}
