import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { expect , assert } from "chai"
import { ethers , network} from "hardhat"
import { SprkHausCollab , MyToken , AccessMaster} from "../typechain-types"
import exp from "constants"
import { Address } from "cluster"

    describe("SprkHaus Collab,Without Staking", () => {
                                        
        let [owner, creator, creator2, buyer, operator ]: SignerWithAddress[] = new Array(5)
        before(async () => {
            [owner,creator, creator2, buyer, operator] = await ethers.getSigners()
            
        })

        let accessmaster : AccessMaster
        let sprkhaus: SprkHausCollab
        let token : MyToken

        const proposalDetails = [
            "10000000000000000000",
            600,
            1200,
            "1000000000000000000"
        ]

        let Addr;

    
        before(async () => {

            const AccessMasterFactory = await ethers.getContractFactory("AccessMaster")
            accessmaster = await AccessMasterFactory.deploy()

            const TokenFactory = await ethers.getContractFactory("MyToken")
            token = await TokenFactory.deploy()

            Addr = [token.address,accessmaster.address]

            let  SprkHausFactory = await ethers.getContractFactory("SprkHausCollab")
            sprkhaus = await SprkHausFactory.deploy(owner.address , "My Event","EVE",proposalDetails,"www.xyz",Addr)
        })

        describe("Without Staking ",async () =>{
            it("Should return the right info of the token",async () =>{
                expect(await sprkhaus.crowdFundingGoal()).to.equal(proposalDetails[0])
                expect(await sprkhaus.salePrice()).to.equal(proposalDetails[3])
                expect(await sprkhaus.pause()).to.true

            })
            it("Set Time By Proposal Creator and Stake",async() =>{
                /// Testing set Funding End is changing or not
                let prev  = await sprkhaus.fundingActiveTime()
                await sprkhaus.setFundingStartTime(1200)
                expect(await sprkhaus.fundingActiveTime()).to.not.equal(prev)
            
                /// Testing setFunding End time is changing or not
                let prevEnd =  await sprkhaus.fundingEndTime()
                await sprkhaus.setFundingEndTime(2400)

                expect(await sprkhaus.fundingEndTime()).to.not.equal(prevEnd)

                await sprkhaus.setFundingStartTime(0)
                /// start time
                expect(sprkhaus.setFundingStartTime(10)).to.be.revertedWith("SprkHausCollab: Funding has been intiated , action cannot be performed")
                /// end time
                expect(sprkhaus.setFundingEndTime(10)).to.be.revertedWith("SprkHausCollab: Funding has been intiated , action cannot be performed")

                // Stake and mintTicket
                expect(sprkhaus.mintTicket()).to.be.revertedWith("SprkHausCollab__ProposalRejected()");
             
                expect(sprkhaus.mintTicket()).to.be.revertedWith("SprkHausCollab: Proposal is being rejected")

                // expect(await sprkhaus.isProposalRejected()).to.be.true

            })
        })
    })

    describe("SprkHaus Collab ,WithStaking Without Crowfunding Goal Reached", () => {
        let [owner, creator, creator2, buyer, operator ]: SignerWithAddress[] = new Array(5)
        before(async () => {
            [owner, operator, creator, creator2, buyer] = await ethers.getSigners()
            
        })

        let accessmaster : AccessMaster
        let sprkhaus: SprkHausCollab
        let token : MyToken

        const proposalDetails = [
            "10000000000000000000",
            600,
            1200,
            "1000000000000000000"
        ]

        let Addr;

        let mintAmount = "100000000000000000000"
    
        before(async () => {

            const AccessMasterFactory = await ethers.getContractFactory("AccessMaster")
            accessmaster = await AccessMasterFactory.deploy()

            const TokenFactory = await ethers.getContractFactory("MyToken")
            token = await TokenFactory.deploy()

            Addr = [token.address,accessmaster.address]

            let  SprkHausFactory = await ethers.getContractFactory("SprkHausCollab")
            sprkhaus = await SprkHausFactory.deploy(creator.address , "My Event","EVE",proposalDetails,"www.xyz",Addr)
            
        

            await token.mint(mintAmount)
            await token.connect(creator).mint(mintAmount)
            await token.connect(buyer).mint(mintAmount)
        })
        
        it("stake",async() =>{
                let sprkhausCreator = sprkhaus.connect(creator)

                let val = await sprkhaus.crowdFundingGoal()
                val = (val.mul(20)).div(100)
             
                await token.connect(creator).approve(sprkhaus.address,val)

                expect(sprkhaus.stake(val)).to.be.reverted

                await sprkhausCreator.stake(val)
                expect(await sprkhaus.isCreatorStaked()).to.be.true;
        })
        it("mint Ticket",async() =>{
                let sprkhausCreator = sprkhaus.connect(creator)
                let sprkhausBuyer = sprkhaus.connect(buyer)

                await network.provider.send("hardhat_mine", ["0x400"]);

                let val = await sprkhaus.salePrice()
                // for buyer
                await token.connect(buyer).approve(sprkhaus.address,val)
                /// for owner
                await token.approve(sprkhaus.address,val)
                 
                await sprkhausBuyer.mintTicket()
                /// for owner
                await sprkhaus.mintTicket()

                // expect(await sprkhaus.balanceOf(buyer.address)).to.be.equal(1)
                // expect(await sprkhaus.ownerOf(1)).to.be.equal(buyer.address)
        
        })
        it("Intiate Proposal rejection",async() => {
            await network.provider.send("hardhat_mine", ["0x100"]);
            expect(sprkhaus.claimback(1)).to.be.reverted
            expect(sprkhaus.claimback(2)).to.be.revertedWith("SprkHausCollab_ClaimedNotPossible()")
            expect(sprkhaus.mintTicket()).to.be.revertedWith("SprkHausCollabd: Funding time has been passed")

            await sprkhaus.connect(buyer).intiateRejection()

            expect(await sprkhaus.isProposalRejected()).to.be.true
            expect(await sprkhaus.isProposalCleared()).to.be.true

        })  
        it("claimback",async () =>{
            let amount =  await sprkhaus.salePrice()
            let prevBalance =  await token.balanceOf(buyer.address)
            await sprkhaus.connect(buyer).claimback(1)
            let afterBalance = await token.balanceOf(buyer.address)
            let diff = afterBalance.sub(prevBalance)
            /// previous balance of Buyer have the difference with  After balance exactly the Price Per NFT  multiply quantity
            expect(diff).to.be.equal(amount)
            

            ///To check if the FUnding can be intiated by proposal creator even after Proposal rejected
            expect(sprkhaus.connect(creator).intiateProposalFunding()).to.be.reverted
        })
        it("Unstake", async() =>{
            let amount = await sprkhaus.crowdFundingGoal()
            amount = (amount.mul(20)).div(100)
            let prevBalance =  await token.balanceOf(creator.address)
            await sprkhaus.connect(creator).unStake()
            let afterBalance = await token.balanceOf(creator.address)
            let diff = afterBalance.sub(prevBalance)
            /// previous balance of Buyer have the difference with  After balance exactly the Price Per NFT  multiply quantity
            expect(diff).to.be.equal(amount)
            expect(sprkhaus.connect(creator).unStake()).to.be.revertedWith
        })

    })

    describe("SprkHaus Collab ,WithStaking with CrowFunding Goal Reaches", () => {
        let [owner, creator, creator2, buyer, operator ]: SignerWithAddress[] = new Array(5)
        before(async () => {
            [owner, operator, creator, creator2, buyer] = await ethers.getSigners()
            
        })

        let accessmaster : AccessMaster
        let sprkhaus: SprkHausCollab
        let token : MyToken

        const proposalDetails = [
            "10000000000000000000",
            600,
            1200,
            "1000000000000000000"
        ]

        let Addr;

        let mintAmount = "100000000000000000000"
        let withdrawAmount =  "500000000000000000"
    
        before(async () => {

            const AccessMasterFactory = await ethers.getContractFactory("AccessMaster")
            accessmaster = await AccessMasterFactory.deploy()

            const TokenFactory = await ethers.getContractFactory("MyToken")
            token = await TokenFactory.deploy()

            Addr = [token.address,accessmaster.address]

            let  SprkHausFactory = await ethers.getContractFactory("SprkHausCollab")
            sprkhaus = await SprkHausFactory.deploy(creator.address , "My Event","EVE",proposalDetails,"www.xyz",Addr)
            
            /// MINT ERC20 TOkens
            await token.mint(mintAmount)
            await token.connect(creator).mint(mintAmount)
            await token.connect(buyer).mint(mintAmount)

            /// STAKE
            let sprkhausCreator = sprkhaus.connect(creator)
            let val = await sprkhaus.crowdFundingGoal()
            val = (val.mul(20)).div(100)
            await token.connect(creator).approve(sprkhaus.address,val)
            await sprkhausCreator.stake(val)
        })
        it("Funding Goal Reached",async()=>{
            const accounts = await ethers.getSigners()

            await network.provider.send("hardhat_mine", ["0x400"]);
            let val = await sprkhaus.salePrice()
            for (let i = 3; i < 13; i++) {
                await token.connect(accounts[i]).mint(mintAmount)
                await token.connect(accounts[i]).approve(sprkhaus.address,val)
                await sprkhaus.connect(accounts[i]).mintTicket()
            }
            let fundsInReserve = await sprkhaus.fundsInReserve()
            expect(await sprkhaus.crowdFundingGoal()).to.be.equal(fundsInReserve)
            console.log(`total supply ${await sprkhaus.totalSupply()}`)
            await token.connect(buyer).approve(sprkhaus.address,val)
            expect(sprkhaus.mintTicket()).to.be.reverted

            /// Rejection when funding has been reached 
            expect(sprkhaus.intiateRejection()).to.be.reverted;

            expect(await sprkhaus.isProposalRejected()).to.be.false
            expect(await sprkhaus.isProposalCleared()).to.be.false

        })

        it("Intiate Funding",async() =>{
            /// to check onlyProposalCreator()
            expect(sprkhaus.withdrawFunds(creator.address,withdrawAmount)).to.be.reverted
            /// to check onlyWhenNotPaused()
            expect(sprkhaus.connect(creator).withdrawFunds(creator.address,withdrawAmount)).to.be.reverted
            /// Intiate Funding
            await sprkhaus.connect(creator).intiateProposalFunding()
            expect(await sprkhaus.pause()).to.be.false
        })
        it("withdraw funds by creator and submit milestone",async() => {
            let prevBalance =  await token.balanceOf(creator.address)
            await sprkhaus.connect(creator).withdrawFunds(creator.address,withdrawAmount) 
            let afterBalance = await token.balanceOf(creator.address)
            let diff = afterBalance.sub(prevBalance)
            expect(diff).to.be.equal(withdrawAmount)

            expect(await sprkhaus.pause()).to.be.true
            expect(await sprkhaus.numberOfMileStones()).to.be.equal(1)

            /// Milestone Submition
            let milestone = "www.xyz.com"
            await sprkhaus.connect(creator).submitMileStoneInfo(milestone)
            
            let a = await sprkhaus.mileStone(0)
            
            expect(a).to.be.equal(milestone)

        })  
        it("Claimback when Proposal is  rejected and staked is taken",async () => {
            await sprkhaus.validate(true,false)
            expect(await sprkhaus.pause()).to.be.false
            await sprkhaus.validate(false,false)
            expect(await sprkhaus.pause()).to.be.true

            await sprkhaus.validate(false,true)
            expect(await sprkhaus.isProposalRejected()).to.be.true

            let val = await sprkhaus.crowdFundingGoal()
            val = (val.mul(20)).div(100)
            let fundsInReserve = await sprkhaus.fundsInReserve()
            let refundValue =  val.add(fundsInReserve)

            let amount  = await sprkhaus.refundAmount(refundValue)

            let prevBalance =  await token.balanceOf(buyer.address)
            await sprkhaus.connect(buyer).claimback(2)
            let afterBalance = await token.balanceOf(buyer.address)
            let diff = afterBalance.sub(prevBalance)
            expect(diff).to.be.equal(amount)
            ///Once claimed Back cannot be refunded 
            expect(sprkhaus.connect(buyer).claimback(2)).to.be.reverted
        })
        
    })

