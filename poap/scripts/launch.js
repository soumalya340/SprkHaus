const fs = require("fs");
const { ethers, run, network } = require("hardhat");

const scripts = `scripts/launch.json`;
const data = fs.readFileSync(scripts, "utf8");
const jsonContent = JSON.parse(data);

let contractAddress;
let blockNumber;
let Verified = false;

async function PoapDeploy() {
  const constructorParam = jsonContent.constructorParams;

  const PoapFactory = await hre.ethers.getContractFactory("Poap");
  const Poap = await PoapFactory.deploy(
    constructorParam.param1,
    constructorParam.param2
  );

  await Poap.deployed();
  console.log("Poap Deployed to: ", Poap.address);

  contractAddress = Poap.address;
  blockNumber = Poap.provider._maxInternalBlockNumber;

  /// VERIFY
  if (hre.network.name != "hardhat") {
    await Poap.deployTransaction.wait(6);
    await verify(Poap.address, [
      constructorParam.param1,
      constructorParam.param2,
    ]);
  }
}

async function main() {
  //Poap
  if (jsonContent.contractName == "Poap") {
    await PoapDeploy();
  }
  let chainId;

  if (network.config.chainId != undefined) {
    chainId = network.config.chainId;
  } else {
    chainId = network.config.networkId;
  }

  console.log(`The chainId is ${chainId}`);
  const data = { chainId, contractAddress, Verified, blockNumber };
  const jsonString = JSON.stringify(data);
  // Log the JSON string
  console.log(jsonString);
}

// async function verify(contractAddress, args) {
const verify = async (contractAddress, args) => {
  console.log("Verifying contract...");
  try {
    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: args,
    });
    Verified = true;
  } catch (e) {
    if (e.message.toLowerCase().includes("already verified")) {
      console.log("Already Verified!");
    } else {
      console.log(e);
    }
  }
};

// main
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
