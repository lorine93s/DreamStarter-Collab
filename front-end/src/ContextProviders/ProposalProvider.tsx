import {
  createContext,
  useContext,
  Dispatch,
  FC,
  ReactNode,
  useState,
  SetStateAction,
} from "react";

interface ProposalCreationFormMessage {
  description: string;
  title: string;
  priceperNFT: number;
  funding_goal: number;
  proposal_type: string;
  date: { $d: { toDateString: () => string } };
}

interface ProposalContextType {
  proposal: ProposalCreationFormMessage | null;
  setProposal: Dispatch<SetStateAction<ProposalCreationFormMessage | null>>;
  votes: { likes: number; dislikes: number };
  setVotes: Dispatch<React.SetStateAction<{ likes: number; dislikes: number }>>;
  votesPercentage: number;
  setVotesPercentage: React.Dispatch<React.SetStateAction<number>>;
}

const ProposalContext = createContext<ProposalContextType | undefined>(
  undefined
);

export const useProposal = () => {
  const context = useContext(ProposalContext);
  if (!context) {
    throw new Error("useProposal must be used within a ProposalProvider");
  }
  return context;
};

export const ProposalProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [proposal, setProposal] = useState<ProposalCreationFormMessage | null>(
    null
  );
  console.log(proposal);
  const [votes, setVotes] = useState<{ likes: number; dislikes: number }>({
    likes: 0,
    dislikes: 0,
  });
  const [votesPercentage, setVotesPercentage] = useState<number>(0);
  return (
    <ProposalContext.Provider
      value={{
        proposal,
        setProposal,
        votes,
        setVotes,
        votesPercentage,
        setVotesPercentage,
      }}
    >
      {children}
    </ProposalContext.Provider>
  );
};
