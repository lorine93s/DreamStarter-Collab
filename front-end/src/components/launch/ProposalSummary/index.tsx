"use client";

import { useState } from "react";
import Button from "@/components/common/Button";
import Modal from "@/components/common/Modal";
import ConvertModal from "../ConvertModal";
import { useProposal } from "@/ContextProviders/ProposalProvider";
import Lottie from "lottie-react";
import notFound from "@/components/Empty/notFound.json";
import Nav3 from "@/components/common/Nav/nav3";

const ProposalSummary = () => {
  const [open, setOpen] = useState<boolean>(false);
  const { proposal } = useProposal();
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
      <div className="flex justify-center p-40"
      style={{ background: "#BDE3F0" }}>
        <div className="text-sm mt-16  py-8 px-8 max-w-lg rounded-md border mb-6 shadow border-gray-600 shadow-2xl" style={{background: "#0F4C81"}}>
          <div className="text-lg font-medium mb-4 text-white">
            {proposal?.title}
          </div>
          <div className="mb-2 text-white">
            {proposal?.description}
          </div>
          <div className="text-white">
            ✅ <strong>55%</strong> of voters love your proposal
          </div>
          <div className="flex justify-center mt-5">
            <Button
              className="flex justify-center"
              variant="primary"
              size="md"
              type="button"
              style={{background: "white" , color:"black" , borderRadius:"999px"}}
              onClick={() => {
                setOpen(true);
              }}
            >
              Launch
            </Button>
          </div>
        </div>
        {/* -----------------  */}
        <Modal
          open={open}
          width={600}
          onCancel={() => setOpen(false)}
          closable={true}
          centered
        >
          <ConvertModal />
        </Modal>
      </div>
    </>
  );
};

export default ProposalSummary;
