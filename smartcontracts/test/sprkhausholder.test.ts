import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { expect , assert } from "chai"
import { ethers , network} from "hardhat"
import {SprkHausHolder , MyToken , AccessMaster} from "../typechain-types"
import exp from "constants"
import { Address } from "cluster"
import { Console } from "console"

    describe("SprkHaus Holder,Without Staking", () => {
                                        
        let [owner, creator, creator2, buyer, operator ]: SignerWithAddress[] = new Array(5)
        before(async () => {
            [owner,creator, creator2, buyer, operator] = await ethers.getSigners()
            
        })

        let accessmaster : AccessMaster
        let sprkhaus:SprkHausHolder
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

            let  SprkHausFactory = await ethers.getContractFactory("TokenFestHolder")
            sprkhaus = await SprkHausFactory.deploy(owner.address , "My Event","EVE",proposalDetails,20,"www.xyz",Addr)
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
                expect(sprkhaus.mintTicket(1)).to.be.revertedWith("SprkHausCollab__ProposalRejected()");
             
                expect(sprkhaus.mintTicket(1)).to.be.revertedWith("SprkHausCollab: Proposal is being rejected")

                // expect(await sprkhaus.isProposalRejected()).to.be.true

            })
        })
    })

    describe("SprkHaus Holder ,With Staking Without Crowfunding Goal Reached", () => {
        let [owner, creator, creator2, buyer, operator ]: SignerWithAddress[] = new Array(5)
        before(async () => {
            [owner, operator, creator, creator2, buyer] = await ethers.getSigners()
            
        })
        let accessmaster : AccessMaster
        let sprkhaus:SprkHausHolder
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
            let  SprkHausFactory = await ethers.getContractFactory("TokenFestHolder")
            sprkhaus = await SprkHausFactory.deploy(creator.address , "My Event","EVE",proposalDetails,20,"www.xyz",Addr)

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
                /// Forwarding the time
                await network.provider.send("hardhat_mine", ["0x400"]);
                let val = await sprkhaus.salePrice()
                // for buyer
                await token.connect(buyer).approve(sprkhaus.address,val)
                /// for owner
                await token.approve(sprkhaus.address,val)
                await sprkhausBuyer.mintTicket(1)
                /// for owner
                await sprkhaus.mintTicket(1)
                expect(await sprkhaus.balanceOf(buyer.address)).to.be.equal(1)
                expect(await sprkhaus.ownerOf(1)).to.be.equal(buyer.address)
        
        })
        it("Intiate Proposal rejection",async() => {
            await network.provider.send("hardhat_mine", ["0x100"]);
            expect(sprkhaus.claimback()).to.be.reverted
            expect(sprkhaus.claimback()).to.be.revertedWith("SprkHausCollab_ClaimedNotPossible()")
            expect(sprkhaus.mintTicket(1)).to.be.revertedWith("SprkHausCollab: Funding time has been passed")
            /// If intiate rejection working or not
            await sprkhaus.connect(buyer).intiateRejection()
            expect(await sprkhaus.isProposalRejected()).to.be.true
            expect(await sprkhaus.isProposalCleared()).to.be.true
        })  
        it("claimback",async () =>{
            let amount =  await sprkhaus.salePrice()
            let prevBalance =  await token.balanceOf(buyer.address)
            await sprkhaus.connect(buyer).claimback()
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

    describe("SprkHaus Holder ,With Staking With CrowFunding Goal Reaches", () => {
        let [owner, creator, creator2, buyer, operator ]: SignerWithAddress[] = new Array(5)
        before(async () => {
            [owner,creator, creator2, buyer,operator] = await ethers.getSigners()    
        })
        let accessmaster : AccessMaster
        let sprkhaus:SprkHausHolder
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

            let  SprkHausFactory = await ethers.getContractFactory("TokenFestHolder")
            sprkhaus = await SprkHausFactory.deploy(creator.address , "My Event","EVE",proposalDetails,20,"www.xyz",Addr)
            
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
        it("To check if Funding Goal Reached, Minting cannot be done",async()=>{
            await network.provider.send("hardhat_mine", ["0x400"]);
            let val = await sprkhaus.salePrice()
            val = val.mul(8)
            /// Buyer will mint 8 tokens
            await token.connect(buyer).approve(sprkhaus.address,val)
            await sprkhaus.connect(buyer).mintTicket(8)
            /// Owner will buy 2 more tokens
            await token.approve(sprkhaus.address,val)
            await sprkhaus.mintTicket(2)
            /// To check if the funds collected  is equal to Crowd Fund Goal
            let fundsInReserve = await sprkhaus.fundsInReserve()
            expect(await sprkhaus.crowdFundingGoal()).to.be.equal(fundsInReserve)
            //// To check if they can buy more than  Max Supply 
            expect(sprkhaus.mintTicket(1)).to.be.reverted
            /// Rejection when funding has been reached 
            expect(sprkhaus.intiateRejection()).to.be.reverted;
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
        it("Claimback when Proposal is  rejected and if stake can be withdrawn",async () => {
            /// To check if the unpause is working or not
            await sprkhaus.validate(true,false)
            expect(await sprkhaus.pause()).to.be.false
            /// To check if the pause is working or not
            await sprkhaus.validate(false,false)
            expect(await sprkhaus.pause()).to.be.true
            //// To check if Proposal is rejected is rejected or not
            await sprkhaus.validate(false,true)
            expect(await sprkhaus.isProposalRejected()).to.be.true
            //// TO check if after 1 withdrawal will the users get claimback,and will it work properly
            const numberOfNFTs = await sprkhaus.balanceOf(buyer.address)
            let val = await sprkhaus.stakingAmount()
            let fundsInReserve = await sprkhaus.fundsInReserve()
            let refundValue =  val.add(fundsInReserve)
            let amount  = await sprkhaus.refundAmount(refundValue)
            amount = amount.mul(numberOfNFTs)
            // to check the balance difference of user
            let prevBalance =  await token.balanceOf(buyer.address)
            await sprkhaus.connect(buyer).claimback()
            let afterBalance = await token.balanceOf(buyer.address)
            let diff = afterBalance.sub(prevBalance)
            expect(diff).to.be.equal(amount)
        })
    })
    describe("SprkHaus Holder ,Validation & Yield Submission", () => {
        let [owner, creator, creator2, buyer, buyer2 ]: SignerWithAddress[] = new Array(5)
        before(async () => {
            [owner,creator, creator2, buyer,buyer2] = await ethers.getSigners()    
        })
        let accessmaster : AccessMaster
        let sprkhaus:SprkHausHolder
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
            let  SprkHausFactory = await ethers.getContractFactory("TokenFestHolder")
            sprkhaus = await SprkHausFactory.deploy(creator.address , "My Event","EVE",proposalDetails,20,"www.xyz",Addr)
            /// MINT ERC20 TOkens
            await token.mint(mintAmount)
            await token.connect(creator).mint(mintAmount)
            await token.connect(buyer).mint(mintAmount)
            await token.connect(buyer2).mint(mintAmount)
            /// STAKE
            let sprkhausCreator = sprkhaus.connect(creator)
            let val = await sprkhaus.crowdFundingGoal()
            val = (val.mul(20)).div(100)
            await token.connect(creator).approve(sprkhaus.address,val)
            await sprkhausCreator.stake(val)
        })
        it("Validation",async()=>{
            await network.provider.send("hardhat_mine", ["0x400"]);
            let val = await sprkhaus.salePrice()
            val = val.mul(8)
            /// Buyer will mint 8 tokens
            await token.connect(buyer).approve(sprkhaus.address,val)
            await sprkhaus.connect(buyer).mintTicket(8)
            /// Buyer2 will buy 2 more tokens
            await token.connect(buyer2).approve(sprkhaus.address,val)
            await sprkhaus.connect(buyer2).mintTicket(2)
            /// Intiate Funding
            await sprkhaus.connect(creator).intiateProposalFunding()
            let withdrawAmount = await sprkhaus.stakingAmount();
            /// Withdraw first round
            await sprkhaus.connect(creator).withdrawFunds(creator.address,withdrawAmount)
            for (let i = 0; i < 3; i++) {
                expect(await sprkhaus.validate(true,false)).to.emit(sprkhaus,"Validate").withArgs(true,false,false)
                await sprkhaus.connect(creator).withdrawFunds(creator.address,withdrawAmount)
            }
            expect(await sprkhaus.numberOfMileStones()).to.be.equal(4)
            /// TO check if somehow unpause can the event organisor take more than funds in Reserve
            await sprkhaus.validate(true,false)
            await sprkhaus.connect(creator).withdrawFunds(creator.address,"1000000000000000000")
            await sprkhaus.validate(true,false)
            expect(sprkhaus.connect(creator).withdrawFunds(creator.address,withdrawAmount)).to.be.revertedWith("SprkHausCollab: Process cannot proceed , more than reserve fund")
            await sprkhaus.connect(creator).withdrawFunds(creator.address,"1000000000000000000")
            await sprkhaus.validate(true,false)
            await sprkhaus.unpauseOrPauseByOperator(false)
            expect(sprkhaus.connect(creator).withdrawFunds(creator.address,"1000000000000000000")).to.be.reverted
        })
        it("Claimback && Yield Submission",async() =>{
            expect(sprkhaus.connect(creator).unStake()).to.be.revertedWith("TokenFestHolder: User cannot withdraw funds")
            let value = await sprkhaus.yeildToBeRecieved()

            await token.connect(creator).approve(sprkhaus.address,value)
            
            expect(await sprkhaus.connect(creator).yieldSubmission()).to.emit(sprkhaus,"YieldSubitted").withArgs(true,value)

            //// CLAIMBACK AFTER YIELD IS SUBMITTED
            const numberOfNFTs = await sprkhaus.balanceOf(buyer.address)
            let val = await sprkhaus.totalSupply()
            let refundValue =  value.div(val)
            let amount  = refundValue.mul(numberOfNFTs)
            // to check the balance difference of user
            let prevBalance =  await token.balanceOf(buyer.address)
            await sprkhaus.connect(buyer).claimback()
            let afterBalance = await token.balanceOf(buyer.address)
            let diff = afterBalance.sub(prevBalance)
            expect(diff).to.be.equal(amount)
            /// UNSTAKE
            let amount1  = await sprkhaus.stakingAmount()
            let prevBalance1 =  await token.balanceOf(creator.address)
            await sprkhaus.connect(creator).unStake()
            let afterBalance1 = await token.balanceOf(creator.address)
            let diff1 = afterBalance1.sub(prevBalance1)
            expect(diff1).to.be.equal(amount1)
        })
    })
     describe("SprkHaus Holder ,Yield Submission When Yiled Fund not sufficient", () => {
        let [owner, creator, creator2, buyer, buyer2 ]: SignerWithAddress[] = new Array(5)
        before(async () => {
            [owner,creator, creator2, buyer,buyer2] = await ethers.getSigners()    
        })
        let accessmaster : AccessMaster
        let sprkhaus:SprkHausHolder
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
            let  SprkHausFactory = await ethers.getContractFactory("TokenFestHolder")
            sprkhaus = await SprkHausFactory.deploy(creator.address , "My Event","EVE",proposalDetails,20,"www.xyz",Addr)


            let sprkhausCreator = sprkhaus.connect(creator)
            let val = await sprkhaus.crowdFundingGoal()
            val = (val.mul(20)).div(100)
            /// MINT ERC20 TOkens
            await token.mint(mintAmount)
            await token.connect(creator).mint(val)
            await token.connect(buyer).mint(mintAmount)
            /// STAKE
            await token.connect(creator).approve(sprkhaus.address,val)
            await sprkhausCreator.stake(val)
        })
        it("Claimback if Event Organisor don't have yield fund",async()=>{
             await network.provider.send("hardhat_mine", ["0x400"]);
            let val = await sprkhaus.salePrice()
            val = val.mul(8)
            /// Buyer will mint 8 tokens
            await token.connect(buyer).approve(sprkhaus.address,val)
            await sprkhaus.connect(buyer).mintTicket(8)
            /// Buyer2 will buy 2 more tokens
            await token.approve(sprkhaus.address,val)
            await sprkhaus.mintTicket(2)
      
            await sprkhaus.connect(creator).intiateProposalFunding()
            let withdrawAmount = await sprkhaus.stakingAmount();
            await sprkhaus.connect(creator).withdrawFunds(creator.address,withdrawAmount)
            /// Withdraw first round
            for (let i = 0; i < 4; i++) {
                expect(await sprkhaus.validate(true,false)).to.emit(sprkhaus,"Validate").withArgs(true,false,false)
                await sprkhaus.connect(creator).withdrawFunds(creator.address,withdrawAmount)
            }
            expect(await sprkhaus.numberOfMileStones()).to.be.equal(5)
            expect(await sprkhaus.fundsInReserve()).to.be.equal(0)

            let fundToRecieve = await sprkhaus.yeildToBeRecieved()
            await token.connect(creator).approve(sprkhaus.address,fundToRecieve)
            await sprkhaus.connect(creator).yieldSubmission()


            //// CLAIMBACK AFTER YIELD IS SUBMITTED
            const numberOfNFTs = await sprkhaus.balanceOf(buyer.address)
            let supply = await sprkhaus.totalSupply()
            let refundValue =  fundToRecieve.div(supply)
            let amountToClaim  = refundValue.mul(numberOfNFTs)
            // to check the balance difference of user
            let prevBalance =  await token.balanceOf(buyer.address)
            await sprkhaus.connect(buyer).claimback()
            let afterBalance = await token.balanceOf(buyer.address)
            let diff = afterBalance.sub(prevBalance)
            expect(diff).to.be.equal(amountToClaim)
            
            await sprkhaus.validate(true,false)

            expect(sprkhaus.connect(creator).unStake()).to.be.revertedWith("TokenFestHolder: Not Enough Staking Funds")

        })
       
    })

