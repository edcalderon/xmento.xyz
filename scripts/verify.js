const { run } = require("hardhat");

/**
 * Helper function to verify contracts on block explorers
 * @param {string} contractAddress The address of the contract to verify
 * @param {Array} constructorArguments The constructor arguments used during deployment
 */
async function verify(contractAddress, constructorArguments) {
  console.log(`Verifying contract at ${contractAddress}...`);
  try {
    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: constructorArguments,
    });
    console.log("Contract verified successfully!");
  } catch (error) {
    if (error.message.toLowerCase().includes("already verified")) {
      console.log("Contract already verified");
    } else {
      console.error("Verification failed:", error);
    }
  }
}

module.exports = { verify };
