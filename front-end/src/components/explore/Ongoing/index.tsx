"use client";
import { useState } from "react";
import { useProposal } from "@/ContextProviders/ProposalProvider";
import Lottie from "lottie-react";
import notFound from "@/components/Empty/notFound.json";
import Link from "next/link";
import Button from "@/components/common/Button";
import { useAddress } from "@thirdweb-dev/react";
import { enqueueSnackbar } from "notistack";
import Nav3 from "@/components/common/Nav/nav3";

const Ongoing = () => {
  const [selectedValue, setSelectedValue] = useState<any>(null);
  const { proposal, votes, setVotes, votesPercentage, setVotesPercentage } =
    useProposal();
  const address = useAddress();
  const handleSubmit = (e: any) => {
    e.preventDefault();

    // Update the votes count based on the user's vote
    const newVotes = { ...votes };
    if (selectedValue === "like") {
      newVotes.likes += 1;
    } else {
      newVotes.dislikes += 1;
    }
    setVotes(newVotes);

    // Calculate and update the votes percentage
    const totalVotes = newVotes.likes + newVotes.dislikes;
    const percentage = (newVotes.likes / totalVotes) * 100;
    setVotesPercentage(percentage);

    // Display the vote alert
    enqueueSnackbar(`${selectedValue} `, {
      variant: `${selectedValue == "like" ? "success" : "error"}`,
    });
  };

  if (!proposal)
    return (
      <div>
        <Nav3 />
        <div className="flex flex-col gap-4 justify-center items-center mt-20">
          <Lottie animationData={notFound} loop={true} />
          <div className="text-lg">No ongoing proposal</div>
        </div>
      </div>

    );

  return (
    <>
      <Nav3 />
      <div className="flex justify-center p-11"
       style={{ background: "#BDE3F0" }}>
        <div>
          {/* --------------------------------------- proposal card -------------------  */}
          <div className="w-[500px] text-lg  border rounded-md py-10 px-10 max-w-xl flex flex-col gap-5 shadow border-gray-600 shadow-2xl mt-14" style={{background: "#0F4C81"}}>
            <div className="text-white text-2xl mb-1 font-semibold">{proposal.title}</div>
            <div className="text-white ">{proposal.description}</div>
            <div className="text-white">Price Per NFT: {proposal.priceperNFT} SUI </div>
            <div className="text-white">Funding Goal: {proposal.funding_goal} SUI</div>
            <div className="text-white">Valid Till: {proposal.date.$d.toDateString()}</div>
            <div className="text-white">Created by: {address}</div>

            {/* --------------------------------------  */}
            <form onSubmit={handleSubmit}>
              <div className="flex gap-6 justify-center">
                <div>
                  <label>
                    <input
                      type="radio"
                      value="dislike"
                      id="response"
                      checked={selectedValue === "dislike"}
                      onChange={() => setSelectedValue("dislike")}
                      required
                      className="hidden"
                    />
                    <div
                      className={`w-12 h-12 flex justify-center items-center text-lg hover:text-2xl hover:border-blue-500 py-2 border  rounded-sm cursor-pointer ${selectedValue === "dislike" && "border-blue-500 "
                        }`}
                    >
                      👎
                    </div>
                  </label>
                </div>
                <div>
                  <label>
                    <input
                      id="response"
                      type="radio"
                      value="like"
                      checked={selectedValue === "like"}
                      onChange={() => setSelectedValue("like")}
                      required
                      className="hidden"
                    />
                    <div
                      className={`w-12 h-12 flex  text-lg justify-center items-center hover:text-2xl  hover:border-blue-500 py-2 border  rounded-sm cursor-pointer ${selectedValue === "like" && "border-blue-500"
                        }`}
                    >
                      👍
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex justify-center mt-4">
                <Button variant="primary" size="lg" type="submit"
                style={{background: "white" , color:"black" , borderRadius:"999px"}}>
                  Vote
                </Button>
              </div>
            </form>
            {/* --------------------------------------  */}
          </div>

          {/* --------------------------------------- proposal card -------------------  */}
        </div>
      </div>
    </>
  );
};

export default Ongoing;
