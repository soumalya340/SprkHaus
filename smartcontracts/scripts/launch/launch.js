const fs = require("fs")
const { ethers, run, network } = require("hardhat")

const scripts = `scripts/launch/launch.json`
const data = fs.readFileSync(scripts, "utf8")
const jsonContent = JSON.parse(data)

let contractAddress
let blockNumber
let Verified = false

async function SprkHausHolderDeploy() {
    const constructorParam = jsonContent.constructorParams

    const SprkHausHolderFactory = await hre.ethers.getContractFactory("SprkHausHolder")
    const SprkHausHolder = await SprkHausHolderFactory.deploy(
        constructorParam.param1,
        constructorParam.param2,
        constructorParam.param3,
        constructorParam.param4,
        constructorParam.param5,
        constructorParam.param6,
        constructorParam.param7
    )

    await SprkHausHolder.deployed()
    console.log("SprkHausHolder Deployed to: ", SprkHausHolder.address)

    contractAddress = SprkHausHolder.address
    blockNumber = SprkHausHolder.provider._maxInternalBlockNumber
    
    /// VERIFY
    if (hre.network.name != "hardhat") {
        await SprkHausHolder.deployTransaction.wait(6)
        await verify(SprkHausHolder.address, [
            constructorParam.param1,
            constructorParam.param2,
            constructorParam.param3,
            constructorParam.param4,
            constructorParam.param5,
            constructorParam.param6,
            constructorParam.param7
        ])
    }
}

async function SprkHausCollabDeploy() {
    const constructorParam = jsonContent.constructorParams
    const SprkHausCollabFactory = await hre.ethers.getContractFactory("SprkHausCollab")
    const SprkHausCollab = await SprkHausCollabFactory.deploy(
        constructorParam.param1,
        constructorParam.param2,
        constructorParam.param3,
        constructorParam.param4,
        constructorParam.param5,
        constructorParam.param6
    )
    await SprkHausCollab.deployed()
    console.log("SprkHausCollab Deployed to:", SprkHausCollab.address)
    contractAddress = SprkHausCollab.address
    blockNumber = SprkHausCollab.provider._maxInternalBlockNumber
    /// VERIFY
    if (hre.network.name != "hardhat") {
        await SprkHausCollab.deployTransaction.wait(6)
        await verify(SprkHausCollab.address, [
            constructorParam.param1,
            constructorParam.param2,
            constructorParam.param3,
            constructorParam.param4,
            constructorParam.param5,
            constructorParam.param6
        ])
    }
}

async function Token() {
    const TokenFactory = await hre.ethers.getContractFactory("MyToken")
    const token = await TokenFactory.deploy()

    await token.deployed()

    console.log("Token Deployed to:", token.address)
    contractAddress = token.address
    blockNumber = token.provider._maxInternalBlockNumber

    /// VERIFY
    if (hre.network.name != "hardhat") {
        await token.deployTransaction.wait(6)
        await verify(token.address, [])
    }
}

async function main() {
    //SprkHausHolder
    if (jsonContent.contractName == "SprkHausHolder") {
        await SprkHausHolderDeploy()
    }
    /// SprkHausCollab CONTRACT
    if (jsonContent.contractName == "SprkHausCollab") {
        await SprkHausCollabDeploy()
    }

    /// ERC20 
    if (jsonContent.contractName == "Token") {
        await Token()
    }

    let chainId

    if (network.config.chainId != undefined) {
        chainId = network.config.chainId
    } else {
        chainId = network.config.networkId
    }

    console.log(`The chainId is ${chainId}`)
    const data = { chainId, contractAddress, Verified, blockNumber }
    const jsonString = JSON.stringify(data)
    // Log the JSON string
    console.log(jsonString)
}

// async function verify(contractAddress, args) {
const verify = async (contractAddress, args) => {
    console.log("Verifying contract...")
    try {
        await run("verify:verify", {
            address: contractAddress,
            constructorArguments: args,
        })
        Verified = true
    } catch (e) {
        if (e.message.toLowerCase().includes("already verified")) {
            console.log("Already Verified!")
        } else {
            console.log(e)
        }
    }
}

// main
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
