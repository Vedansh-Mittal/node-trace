const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying Traceability contract...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  const Traceability = await ethers.getContractFactory("Traceability");
  const traceability = await Traceability.deploy();

  await traceability.waitForDeployment();

  const contractAddress = await traceability.getAddress();
  console.log("Traceability contract deployed to:", contractAddress);

  // Save deployment info
  const fs = require("fs");
  const deploymentInfo = {
    contractAddress: contractAddress,
    deployerAddress: deployer.address,
    network: "ganache",
    timestamp: new Date().toISOString()
  };

  fs.writeFileSync("deployment.json", JSON.stringify(deploymentInfo, null, 2));
  console.log("Deployment info saved to deployment.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });