"use client";

import { useProposal } from "@/ContextProviders/ProposalProvider";
import { useEffect, useState } from "react";
import Lottie from "lottie-react";
import notFound from "@/components/Empty/notFound.json";
import Button from "@/components/common/Button";
import { ethers } from "ethers";
import TokenStarterCollab from "@/abi/TokenStarterCollab.json";
import MyTokenABI from "@/abi/MyToken.json";
import { enqueueSnackbar } from "notistack";
import Nav3 from "@/components/common/Nav/nav3";

let erc20ContractAddress = "";
let stakingContractAddress = "";
let provider: ethers.providers.Web3Provider | null = null;
let signer = null;
let erc20Contract: ethers.Contract;
let stakingContract: ethers.Contract; 
const Crowdfunding = () => {
  const [mintingDone, setMintingDone] = useState<boolean>(false);
  const [isMinting, setIsMinting] = useState<boolean>(false);
  const [isStaked, setIsStaked] = useState<boolean>(false);
  const [isStaking, setIsStaking] = useState<boolean>(false);
  const [StakingDone, setStakingDone] = useState<boolean>(false);
  // ------------------------
  const [salePrice, setSalePrice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [crowdFundingGoal, setCrowdFundingGoal] = useState<string | null>(null);
  const [totalFunding, setTotalFunding] = useState<string | null>(null);
  const [connectedNetwork, setConnectedNetwork] = useState<number | null>(null);
  const [isCreatorAlreadyStaked, setIsCreatorAlreadyStaked] = useState(false);

  const { proposal } = useProposal();

  // --------------------------
  useEffect(() => {
    erc20ContractAddress = "0x8563F7BD1fa85cB75EFB8e710D3971dC3e3C5C8b";
    stakingContractAddress = "0x2D47f97caE66f5D1582750790F36F57D29A571EA";

    if (typeof window !== "undefined" && (window as any).ethereum) {
      provider = new ethers.providers.Web3Provider((window as any).ethereum);
      const signer = provider.getSigner();
      console.log("done");
      setIsLoading(false);
      erc20Contract = new ethers.Contract(
        erc20ContractAddress,
        MyTokenABI,
        signer
      );
      stakingContract = new ethers.Contract(
        stakingContractAddress,
        TokenStarterCollab,
        signer
      );
    }
  }, []);

  // --------------------------

  useEffect(() => {
    async function getNetwork() {
      if (provider) {
        const network = await provider.getNetwork();
        setConnectedNetwork(network.chainId);
      }
    }
    getNetwork();
  }, [provider]);

  // ------------
  useEffect(() => {
    async function fetchData() {
      try {
        const price = await stakingContract.salePrice();
        setSalePrice(ethers.utils.formatEther(price));
        console.log(price);
        const goal = await stakingContract.crowdFundingGoal();
        setCrowdFundingGoal(ethers.utils.formatEther(goal));

        const totalSupply = await stakingContract.totalSupply();
        const nftFunding = totalSupply.mul(price);

        let total = nftFunding;

        if (isCreatorAlreadyStaked) {
          const stakedAmount = goal
            .mul(ethers.BigNumber.from("20"))
            .div(ethers.BigNumber.from("100"));
          total = total.add(stakedAmount);
        }

        setTotalFunding(ethers.utils.formatEther(total));
      } catch (error: any) {
        console.error("Error fetching data:", error.message);
      }
      setIsLoading(false);
    }
    fetchData();
  }, [stakingContract, isCreatorAlreadyStaked]);

  // -------------------------

  // ----------------
  // useEffect(() => {
  //   async function checkIsCreatorStaked() {
  //     try {
  //       const staked = await stakingContract.isCreatorStaked();
  //       setIsCreatorAlreadyStaked(staked);
  //     } catch (error: any) {
  //       console.error("Error checking if creator is staked:", error.message);
  //     }
  //   }

  //   if (proposal) {
  //     checkIsCreatorStaked();
  //   }
  // }, [proposal, stakingContract]);
  // ------------
  async function handleStake() {
    try {
      // // const weiSalePrice = ethers.utils.formatEther(salePrice!);
      // const weiSalePrice = ethers.utils.parseEther(salePrice!.toString());

      
      setIsStaking(true);
      // Approve the staking contract
      const approveTx = await erc20Contract.approve(
        stakingContractAddress,
        "2000000000000000000"
      );
      await approveTx.wait();
      // Mint the token
      const mintTx = await stakingContract.stake("2000000000000000000");

      await mintTx.wait();

      // display post minting button options
      setStakingDone(true);
      setIsStaked(true);
      enqueueSnackbar(`Stake is successfully!`, {
        variant: "success",
      });
    } catch (error: any) {
      console.log(error);

      enqueueSnackbar(error, {
        variant: "error",
      });
    }
  }

  async function handleMint() {
    try {
      // const weiSalePrice = ethers.utils.formatEther(salePrice!);
      // const weiSalePrice = ethers.utils.parseEther(salePrice!.toString());

      setIsMinting(true);
      // Approve the staking contract
      const approveTx = await erc20Contract.approve(
        stakingContractAddress,
        "2000000000000000000"
      );
      await approveTx.wait();
      // Mint the token
      const mintTx = await stakingContract.mintTicket();

      await mintTx.wait();

      // display post minting button options
      setMintingDone(true);
      enqueueSnackbar(`Token minted successfully!`, {
        variant: "success",
      });
    } catch (error: any) {
      console.log(error);

      enqueueSnackbar(error, {
        variant: "error",
      });
    }
  }
  // ---------
  if (isLoading) {
    return <p>Loading...</p>;
  }

  // ---------------------
  // ---------------------
  if (!proposal)
    return (
     <div>
      <Nav3/>
       <div className="flex flex-col gap-4 justify-center  items-center mt-20">
        <Lottie animationData={notFound} loop={true} />
        <div className="text-lg">No Crowdfunding Event</div>
      </div>
     </div>
    );
  return (
    <>
    <Nav3 />
      <div className="flex justify-center  mb-6  p-60"
      style={{ background: "#BDE3F0" }}>
        <div className=" text-sm border py-8 px-8 max-w-xl  rounded-md lex flex-col gap-4 shadow border-gray-600 shadow-2xl " style={{background: "#0F4C81"}}>
          <div className="text-xl font-bold text-white">{proposal.title}</div>
          <div className="text-base mt-4 mb-3 text-white">
            <p>{proposal.description}</p>
          </div>

          {/* -------------------  */}
          <div>
            {mintingDone ? (
              <div className="flex gap-3">
                <Button variant="secondary" size="sm"
                style={{background: "white" , color:"black" , borderRadius:"999px"}}>
                  Withdraw Funds
                </Button>
                <Button variant="secondary" size="sm"
                style={{background: "white" , color:"black" , borderRadius:"999px"}}>
                  Dispute
                </Button>
                <Button variant="secondary" size="sm"
                style={{background: "white" , color:"black" , borderRadius:"999px"}}>
                  Claimback
                </Button>
              </div>
            ) : (
              <div className="mt-4">
                {isStaked && (
                  <Button variant="primary" size="md" onClick={handleMint}
                  style={{background: "white" , color:"black" , borderRadius:"999px"}}>
                    {isMinting ? "Minting..." : "Mint NFT"}
                  </Button>
                )}
                {!isStaked && (
                  <Button variant="primary" size="md" onClick={handleStake}
                  style={{background: "white" , color:"black" , borderRadius:"999px"}}>
                    {isStaking ? "Staking..." : "Stake Token"}
                  </Button>
                )}
              </div>
            )}
          </div>
          {/* -------------------  */}
          {/* <Button variant="primary" size="md" onClick={handleMint}>
            {isMinting ? "Minting..." : "  Mint NFT"}
          </Button> */}
          {isStaked && (
            <div className="mt-4">
              <p>Funding Progress:</p>
              <div className="w-full h-4 bg-gray-300 rounded">
                <div
                  style={{ width: `${5}%` }}
                  className="h-full bg-blue-500 rounded"
                ></div>
              </div>
              <p>{2 / 5} ETH</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Crowdfunding;
