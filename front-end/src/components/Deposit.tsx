import React, { useState, useEffect } from "react";
import Modal from "./Modal";
import tokens from "../assets/tokens.json";
import { Token } from "../libs/types";


interface DepositProps { }

const Deposit: React.FC<DepositProps> = () => {
  const [isModalOpen, setModalOpen] = useState<boolean>(false);
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [to, setTo] = useState<string>("");
  const [amount, setAmount] = useState<string>("");


  const toggleModal = () => setModalOpen((prev) => !prev);

  const isTokenSelected = !!selectedToken;

  const handleSend = () => {
    if (!isValidEmail(to)) {
      return;
    }

    if (!isValidAmount(amount)) {
      return;
    }

  };


  return (
    <div className="deposit-container">
     

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
      >
        <h5>Send</h5>
        <input
          className="input-field"
          aria-label="Recipient"
          onChange={(e) => setTo(e.target.value)}
          placeholder="example@gmail.com"
          value={to}
          type="email"
        />
        <input
          className="input-field"
          aria-label="Amount"
          onChange={(e) => setAmount(e.target.value.toString())}
          placeholder="Amount"
          value={amount}
          type="number"
          min="0"
          step={1e-18}
        />
        
        <button
          type="submit"
          disabled={
            !to ||
            !amount ||
            !isValidEmail(to) ||
            !isValidAmount(amount) ||
            !isTokenSelected
            // !isConnected
          }
        >
          Send
        </button>
        <button
        className="select-token-btn"
        onClick={toggleModal}
      >
        <span className="arrow-down">
          <img src={selectedToken?.icon} alt={selectedToken?.name} />
          {selectedToken ? selectedToken.name : "Select Token"}
        </span>
      </button>
       
      </form>
    

      <Modal isOpen={isModalOpen} onClose={toggleModal} title="Select Token">
        {(tokens["sepolia"] as Token[]).map((token: Token) => (
          <div key={token.address}>
            <button
              onClick={() => {
                setSelectedToken(token);
                toggleModal();
              }}
            >
              <img src={token.icon} alt={token.name} />
              {token.name}
            </button>
          </div>
        ))}
      </Modal>
    </div>
  );
};

export default Deposit;

// Utility function to validate email using regex
const isValidEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Utility function to validate amount is numeric and greater than 0
const isValidAmount = (amount: string) => {
  const num = Number(amount);
  return !isNaN(num) && num > 0;
};