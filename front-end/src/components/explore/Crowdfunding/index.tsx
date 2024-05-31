"use client";

import { useProposal } from "@/ContextProviders/ProposalProvider";
import { useEffect, useRef, useState } from "react";
import Lottie from "lottie-react";
import notFound from "@/components/Empty/notFound.json";
import Button from "@/components/common/Button";
import { enqueueSnackbar } from "notistack";
import Nav3 from "@/components/common/Nav/nav3";

import React, { FC } from "react";
import { SuiClient, SuiObjectData, getFullnodeUrl } from '@mysten/sui.js/client';
import { SerializedSignature, decodeSuiPrivateKey } from '@mysten/sui.js/cryptography';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import {
  genAddressSeed,
  generateNonce,
  generateRandomness,
  getExtendedEphemeralPublicKey,
  getZkLoginSignature,
  jwtToAddress,
} from '@mysten/zklogin';
import { NetworkName, makeExplorerUrl, requestSuiFromFaucet, shortenSuiAddress } from '@polymedia/suits';
import { Modal, isLocalhost } from '@polymedia/webutils';
import { jwtDecode } from 'jwt-decode';
import { blockvision } from '@/utils/blockvision';

const zk = process.env.NEXT_PUBLIC_URL_ZK_PROVER;
const google = process.env.NEXT_PUBLIC_GOOGLE;
const salt = process.env.NEXT_PUBLIC_URL_SALT_SERVICE;

const NETWORK: NetworkName = 'devnet';
const MAX_EPOCH = 2;
const suiClient = new SuiClient({
  url: getFullnodeUrl(NETWORK),
});

const setupDataKey = 'zklogin-demo.setup';
const accountDataKey = 'zklogin-demo.accounts';

type OpenIdProvider = 'Connect with Google' | 'Twitch' | 'Facebook';

type SetupData = {
  provider: OpenIdProvider;
  maxEpoch: number;
  randomness: string;
  ephemeralPrivateKey: string;
}

type AccountData = {
  provider: OpenIdProvider;
  userAddr: string;
  zkProofs: any;
  ephemeralPrivateKey: string;
  userSalt: string;
  sub: string;
  aud: string;
  maxEpoch: number;
}

const Crowdfunding = () => {
  const [OpenIdProviders, setOpenIdProviders] = useState<OpenIdProvider[]>(["Connect with Google"]);
  const [nftData, setNftData] = useState<SuiObjectData[]>([]);

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
  const accounts = useRef<AccountData[]>(loadAccounts()); // useRef() instead of useState() because of setInterval()
  const [balances, setBalances] = useState<Map<string, number>>(new Map()); // Map<Sui address, SUI balance>
  const [modalContent, setModalContent] = useState<string>('');

  useEffect(() => {
    completeZkLogin();
    fetchBalances(accounts.current);
    setOpenIdProviders(OpenIdProviders);

    const interval = setInterval(() => fetchBalances(accounts.current), 5_000);
    return () => { clearInterval(interval) };
  }, []);

  async function beginZkLogin(provider: OpenIdProvider) {
    console.log(google)
    console.log(salt)
    console.log(zk)

    setModalContent(`🔑 Logging in with ${provider}...`);

    // Create a nonce
    const { epoch } = await suiClient.getLatestSuiSystemState();
    const maxEpoch = Number(epoch) + MAX_EPOCH; // the ephemeral key will be valid for MAX_EPOCH from now
    const ephemeralKeyPair = new Ed25519Keypair();
    const randomness = generateRandomness();
    const nonce = generateNonce(ephemeralKeyPair.getPublicKey(), maxEpoch, randomness);

    saveSetupData({
      provider,
      maxEpoch,
      randomness: randomness.toString(),
      ephemeralPrivateKey: ephemeralKeyPair.getSecretKey(),
    });

    const urlParamsBase = {
      nonce: nonce,
      redirect_uri: window.location.origin,
      response_type: 'id_token',
      scope: 'openid',
    };
    let loginUrl = ""
    switch (provider) {
      case 'Connect with Google': {
        const urlParams = new URLSearchParams({
          ...urlParamsBase,
          client_id: google!,
        });
        loginUrl = `https://accounts.google.com/o/oauth2/v2/auth?${urlParams.toString()}`;
        break;
      }
    }
    window.location.replace(loginUrl);
  }

  async function completeZkLogin() {
    const urlFragment = window.location.hash.substring(1);
    const urlParams = new URLSearchParams(urlFragment);
    const jwt = urlParams.get('id_token');
    if (!jwt) {
      return;
    }

    // remove the URL fragment
    window.history.replaceState(null, '', window.location.pathname);

    // decode the JWT
    const jwtPayload = jwtDecode(jwt);
    if (!jwtPayload.sub || !jwtPayload.aud) {
      console.warn('[completeZkLogin] missing jwt.sub or jwt.aud');
      return;
    }

    // === Get the salt ===
    // https://docs.sui.io/concepts/cryptography/zklogin#user-salt-management

    const requestOptions =
      process.env.NEXT_PUBLIC_URL_SALT_SERVICE === '/dummy-salt-service.json'
        ? // dev, using a JSON file (same salt all the time)
        {
          method: 'GET',
        }
        : // prod, using an actual salt server
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jwt }),
        };
    ``
    const saltResponse: { salt: string } | null =
      await fetch(salt!, requestOptions)
        .then(res => {
          console.debug('[completeZkLogin] salt service success');
          return res.json();
        })
        .catch((error: unknown) => {
          console.warn('[completeZkLogin] salt service error:', error);
          return null;
        });
    if (!saltResponse) {
      return;
    }

    const userSalt = BigInt(saltResponse.salt);
    const userAddr = jwtToAddress(jwt, userSalt);
    const setupData = loadSetupData();
    if (!setupData) {
      console.warn('[completeZkLogin] missing session storage data');
      return;
    }
    clearSetupData();
    for (const account of accounts.current) {
      if (userAddr === account.userAddr) {
        console.warn(`[completeZkLogin] already logged in with this ${setupData.provider} account`);
        return;
      }
    }

    const ephemeralKeyPair = keypairFromSecretKey(setupData.ephemeralPrivateKey);
    const ephemeralPublicKey = ephemeralKeyPair.getPublicKey();
    const payload = JSON.stringify({
      maxEpoch: setupData.maxEpoch,
      jwtRandomness: setupData.randomness,
      extendedEphemeralPublicKey: getExtendedEphemeralPublicKey(ephemeralPublicKey),
      jwt,
      salt: userSalt.toString(),
      keyClaimName: 'sub',
    }, null, 2);

    console.debug('[completeZkLogin] Requesting ZK proof with:', payload);
    setModalContent('⏳ Requesting ZK proof. This can take a few seconds...');

    const zkProofs = await fetch(zk!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
    })
      .then(res => {
        console.debug('[completeZkLogin] ZK proving service success');
        return res.json();
      })
      .catch((error: unknown) => {
        console.warn('[completeZkLogin] ZK proving service error:', error);
        return null;
      })
      .finally(() => {
        setModalContent('');
      });

    if (!zkProofs) {
      return;
    }

    // === Save data to session storage so sendTransaction() can use it ===
    saveAccount({
      provider: setupData.provider,
      userAddr,
      zkProofs,
      ephemeralPrivateKey: setupData.ephemeralPrivateKey,
      userSalt: userSalt.toString(),
      sub: jwtPayload.sub,
      aud: typeof jwtPayload.aud === 'string' ? jwtPayload.aud : jwtPayload.aud[0],
      maxEpoch: setupData.maxEpoch,
    });
  }
  async function handleStake(account: AccountData) {
    setIsStaking(true);
    setModalContent('🚀 Sending transaction...');
    console.log("[sendTransaction] Starting transaction");


    // Sign the transaction bytes with the ephemeral private key
    const txb = new TransactionBlock();
    const mintCoin = txb.splitCoins(txb.gas, [txb.pure("1000000000")]);
    const packageObjectId =
      "0x19edbae0f4b934a59e2f48b203b2537b3dd2a53164ddb312819ba7e0c04bba3e";
    txb.moveCall({
      target: `${packageObjectId}::mynft::stake`,
      arguments: [
        mintCoin,
        txb.pure("0x8601e94898753968ad5559c70076cd130e3b74267b2c5c97f7f3674907dfe5d7"),
      ],
    });
    txb.setSender(account.userAddr);
    console.log("[sendTransaction] Account address:", account.userAddr);

    const ephemeralKeyPair = keypairFromSecretKey(account.ephemeralPrivateKey);
    const { bytes, signature: userSignature } = await txb.sign({
      client: suiClient,
      signer: ephemeralKeyPair,
    });

    console.log("[sendTransaction] Transaction signed:", {
      bytes,
      userSignature,
    });
    // Generate an address seed by combining userSalt, sub (subject ID), and aud (audience)
    const addressSeed = genAddressSeed(
      BigInt(account.userSalt),
      'sub',
      account.sub,
      account.aud,
    ).toString();

    console.log("[sendTransaction] Address seed generated:", addressSeed);
    // Serialize the zkLogin signature by combining the ZK proof (inputs), the maxEpoch,
    // and the ephemeral signature (userSignature)
    const zkLoginSignature: SerializedSignature = getZkLoginSignature({
      inputs: {
        ...account.zkProofs,
        addressSeed,
      },
      maxEpoch: account.maxEpoch,
      userSignature,
    });
    console.log(
      "[sendTransaction] ZK Login signature created:",
      zkLoginSignature
    );
    // Execute the transaction
    await suiClient.executeTransactionBlock({
      transactionBlock: bytes,
      signature: zkLoginSignature,
      options: {
        showEffects: true,
      },
    })
      .then(result => {
        console.debug('[sendTransaction] executeTransactionBlock response:', result);
        fetchBalances([account]);
      })
      .catch((error: unknown) => {
        console.warn('[sendTransaction] executeTransactionBlock failed:', error);
        return null;
      })
      .finally(() => {
        setModalContent('');
      });
    setStakingDone(true);
    setIsStaked(true);
    enqueueSnackbar(`Stake is successfully!`, {
      variant: "success",
    });
  }
  async function handleMint(account: AccountData) {
    setIsMinting(true);
    setModalContent('🚀 Sending transaction...');
    console.log("[sendTransaction] Starting transaction");


    // Sign the transaction bytes with the ephemeral private key
    const txb = new TransactionBlock();
    const packageObjectId =
      "0x19edbae0f4b934a59e2f48b203b2537b3dd2a53164ddb312819ba7e0c04bba3e";
    txb.moveCall({
      target: `${packageObjectId}::mynft::mint`,
      arguments: [
        txb.pure("mygame"), // Name argument
        txb.pure("bvklb odjfoiv askhjvlk"),
        txb.pure("bvklb odjfoiv askhjvlk"),
      ],
    });
    txb.setSender(account.userAddr);
    console.log("[sendTransaction] Account address:", account.userAddr);

    const ephemeralKeyPair = keypairFromSecretKey(account.ephemeralPrivateKey);
    const { bytes, signature: userSignature } = await txb.sign({
      client: suiClient,
      signer: ephemeralKeyPair,
    });

    console.log("[sendTransaction] Transaction signed:", {
      bytes,
      userSignature,
    });
    // Generate an address seed by combining userSalt, sub (subject ID), and aud (audience)
    const addressSeed = genAddressSeed(
      BigInt(account.userSalt),
      'sub',
      account.sub,
      account.aud,
    ).toString();

    console.log("[sendTransaction] Address seed generated:", addressSeed);
    // Serialize the zkLogin signature by combining the ZK proof (inputs), the maxEpoch,
    // and the ephemeral signature (userSignature)
    const zkLoginSignature: SerializedSignature = getZkLoginSignature({
      inputs: {
        ...account.zkProofs,
        addressSeed,
      },
      maxEpoch: account.maxEpoch,
      userSignature,
    });
    console.log(
      "[sendTransaction] ZK Login signature created:",
      zkLoginSignature
    );
    // Execute the transaction
    await suiClient.executeTransactionBlock({
      transactionBlock: bytes,
      signature: zkLoginSignature,
      options: {
        showEffects: true,
      },
    })
      .then(result => {
        console.debug('[sendTransaction] executeTransactionBlock response:', result);
        fetchBalances([account]);
      })
      .catch((error: unknown) => {
        console.warn('[sendTransaction] executeTransactionBlock failed:', error);
        return null;
      })
      .finally(() => {
        setModalContent('');
      });
    setMintingDone(true);
    enqueueSnackbar(`Token minted successfully!`, {
      variant: "success",
    });
      (async () => {
        const returnValue = await blockvision(account.userAddr);
        const nftDataList = returnValue?.filter(
          (data) =>
            data?.content?.dataType === "moveObject" && data?.content?.type
        );
        setNftData(nftDataList);
        console.log(nftDataList);
      })();
  }

  /**
   * Create a keypair from a base64-encoded secret key
   */
  function keypairFromSecretKey(privateKeyBase64: string): Ed25519Keypair {
    const keyPair = decodeSuiPrivateKey(privateKeyBase64);
    return Ed25519Keypair.fromSecretKey(keyPair.secretKey);
  }

  async function fetchBalances(accounts: AccountData[]) {
    if (accounts.length == 0) {
      return;
    }
    const newBalances = new Map<string, number>();
    for (const account of accounts) {
      const suiBalance = await suiClient.getBalance({
        owner: account.userAddr,
        coinType: '0x2::sui::SUI',
      });
      newBalances.set(
        account.userAddr,
        +suiBalance.totalBalance / 1_000_000_000
      );
    }
    // setBalances(prevBalances =>
    //   new Map([...prevBalances, ...newBalances])
    // );
  }

  /* Session storage */

  function saveSetupData(data: SetupData) {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(setupDataKey, JSON.stringify(data));
    }
  }

  function loadSetupData(): SetupData | null {
    if (typeof sessionStorage === 'undefined') {
      return null;
    }
    const dataRaw = sessionStorage.getItem(setupDataKey);
    if (!dataRaw) {
      return null;
    }
    const data: SetupData = JSON.parse(dataRaw);
    return data;
  }

  function clearSetupData(): void {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(setupDataKey);
    }
  }

  function saveAccount(account: AccountData): void {
    const newAccounts = [account, ...accounts.current];
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(accountDataKey, JSON.stringify(newAccounts));
    }
    accounts.current = newAccounts;
    fetchBalances([account]);
  }

  function loadAccounts(): AccountData[] {
    if (typeof sessionStorage === 'undefined') {
      return [];
    }
    const dataRaw = sessionStorage.getItem(accountDataKey);
    if (!dataRaw) {
      return [];
    }
    const data: AccountData[] = JSON.parse(dataRaw);
    return data;
  }

  function clearState(): void {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.clear();
    }
    accounts.current = [];
    setBalances(new Map());
  }

  // const openIdProviders: OpenIdProvider[] = isLocalhost()
  //   ? ['Connect with Google']
  //   : ['Connect with Google'];
  // --------------------------
  useEffect(() => {
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return <p>Loading...</p>;
  }

  if (!proposal)
    return (
      <div>
        <Nav3 />
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
        <div className=" text-sm border py-8 px-8 max-w-xl  rounded-md lex flex-col gap-4 shadow border-gray-600 shadow-2xl " style={{ background: "#0F4C81" }}>
          <div className="text-xl font-bold text-white">{proposal.title}</div>
          <div className="text-base mt-4 mb-3 text-white">
            <p>{proposal.description}</p>
          </div>

          {/* -------------------  */}
          <div>
            {mintingDone ? (
              <div className="flex gap-3">
                <Button variant="secondary" size="sm"
                  style={{ background: "white", color: "black", borderRadius: "999px" }}>
                  Withdraw Funds
                </Button>
                <Button variant="secondary" size="sm"
                  style={{ background: "white", color: "black", borderRadius: "999px" }}>
                  Dispute
                </Button>
                <Button variant="secondary" size="sm"
                  style={{ background: "white", color: "black", borderRadius: "999px" }}>
                  Claimback
                </Button>
              </div>
            ) : (
              <div className="mt-4">

                {isStaked && accounts.current.map((acct) => (
                  <Button variant="primary" size="md" key={acct.userAddr} onClick={() => handleMint(acct)}
                    style={{ background: "white", color: "black", borderRadius: "999px" }}>
                    {isMinting ? "Minting..." : "Mint NFT"}
                  </Button>

                ))}

                {!isStaked && accounts.current.map((acct) => (
                  <Button variant="primary" size="md" key={acct.userAddr} onClick={() => handleStake(acct)}
                    style={{ background: "white", color: "black", borderRadius: "999px" }}>
                    {isStaking ? "Staking..." : "Stake Token"}
                  </Button>
                ))}
                {/* {accounts.current.map((acct) => {
                                    const balance = balances.get(acct.userAddr);
                                    const explorerLink = makeExplorerUrl(
                                        NETWORK,
                                        "address",
                                        acct.userAddr
                                    );
                                    return (
                                        <div className="account" key={acct.userAddr}>
                                            <div>
                                                <label className={`provider ${acct.provider}`}>
                                                    {acct.provider}
                                                </label>
                                            </div>
                                            <div>
                                                Address:{" "}
                                                <a
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    href={explorerLink}
                                                >
                                                    {shortenSuiAddress(acct.userAddr, 6, 6, "0x", "...")}
                                                </a>
                                            </div>
                                            <div>User ID: {acct.sub}</div>
                                            <div>
                                                Balance:
                                                {typeof balance === "undefined"
                                                    ? "(loading)"
                                                    : `${balance} SUI`}
                                            </div>
                                            <button
                                                className={`btn-send ${!balance ? "disabled" : ""}`}
                                                disabled={!balance}
                                                onClick={() => {
                                                    handleStake(acct);
                                                }}
                                            >
                                                Send transaction
                                            </button>
                                            {balance === undefined && (
                                                <button
                                                    className="btn-faucet"
                                                    onClick={() => {
                                                        requestSuiFromFaucet(NETWORK, acct.userAddr);
                                                        setModalContent(
                                                            "💰 Requesting SUI from faucet. This will take a few seconds..."
                                                        );
                                                        setTimeout(() => {
                                                            setModalContent("");
                                                        }, 3000);
                                                    }}
                                                >
                                                    Use faucet
                                                </button>
                                            )}
                                            <hr />
                                        </div>
                                    );
                                })} */}
              </div>
            )}
          </div>
          {isStaked && (
            <div className="mt-4">
              <p>Funding Progress:</p>
              <div className="w-full h-4 bg-gray-300 rounded">
                <div
                  style={{ width: `${5}%` }}
                  className="h-full bg-blue-500 rounded"
                ></div>
              </div>
              <p>{2 / 5} SUI</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Crowdfunding;
