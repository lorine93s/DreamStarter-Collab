"use client"

import '@/index.css'
import { ReactNode, useEffect, useState } from "react";
import { ToastContainer } from "react-toastify";
import Deposit from "@/components/Deposit";
import Modal from "@/components/Modal";
import "react-toastify/dist/ReactToastify.css";
import { clearCookies } from "@/libs/utils";
import Claim from "@/components/Claim";
import { ConnectWallet } from '@thirdweb-dev/react';
import DashboardNav from '@/components/common/Nav/dashboardnav';

function Pay() {
    useEffect(() => {
        clearCookies();
    });

    return (

        <>
            <DashboardNav />
            <div className="app-container">
                <h2 className="title">Bonsai Pay Demo</h2>
                <p className="subtitle">powered by Bonsai™</p>
                <ConnectWallet />
                <ViewSelection />
                <h6>
                    Only Google accounts are supported.
                </h6>
                <p className="read-the-docs">This is for demo purposes only.</p>
                <p className="read-the-docs">
                    Please read our{" "}
                    <a
                        href="https://github.com/risc0/demos/blob/main/bonsai-pay/README.md"
                        target="_blank"
                        rel="noreferrer"
                    >
                        docs
                    </a>{" "}
                    for more information.
                </p>


            </div>
        </>

    );
}

function ViewSelection() {
    const [showComponent, setShowComponent] = useState<"deposit" | "claim">(
        "claim"
    );
    const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setShowComponent(e.target.value as "deposit" | "claim");
    };
    return (
        <div>
            <div className="radio-container">
                <label>
                    <input
                        className="radio-input"
                        type="radio"
                        value="deposit"
                        checked={showComponent === "deposit"}
                        onChange={handleRadioChange}
                    />
                    Send
                </label>
                <label>
                    <input
                        className="radio-input"
                        type="radio"
                        value="claim"
                        checked={showComponent === "claim"}
                        onChange={handleRadioChange}
                    />
                    Claim
                </label>
            </div>
            <div className="card">
                {showComponent === "deposit" ? <Deposit /> : <Claim />}
            </div>
        </div>
    );
}

export default Pay;

function Footer() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState<{
        title: string;
        content: ReactNode;
    }>({ title: "", content: "" });

    const openModal = (title: string, content: ReactNode) => {
        setModalContent({ title, content });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    return (
        <footer className="footer">
            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={modalContent.title}
            >
                {modalContent.content}
            </Modal>
            <a href="https://www.risczero.com/news/bonsai-pay">About</a>
            <a
                href="https://github.com/risc0/demos/tree/main/bonsai-pay"
                className="footer-link"
            >
                Github
            </a>
            <a href="https://bonsai.xyz" className="footer-link">
                Bonsai
            </a>
            <button
                onClick={() =>
                    openModal(
                        "Terms of Service",
                        <iframe
                            className="tos-content"
                            src="./BonsaiPayTermsofService2023.11.07.html"
                            title="Terms of Service"
                        />
                    )
                }
                className="footer-button"
            >
                Terms of Service
            </button>
            <button
                onClick={() =>
                    openModal(
                        "Privacy Policy",
                        <iframe
                            className="privacy-content"
                            src="./RISCZeroBonsaiWebsitePrivacyPolicy2023.11.07.html"
                            title="Privacy Policy"
                        />
                    )
                }
                className="footer-button"
            >
                Privacy Policy
            </button>
        </footer>
    );
}
