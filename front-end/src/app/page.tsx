"use client";
import { ConnectWallet, lightTheme } from "@thirdweb-dev/react";
import { SiWebmoney } from "react-icons/si";
import { FaDiscord, FaXTwitter } from "react-icons/fa6";
import { BsTelegram } from "react-icons/bs";
import Nav from "@/components/common/Nav";


import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';
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
import { useEffect, useRef, useState } from 'react';

const zk = process.env.NEXT_PUBLIC_URL_ZK_PROVER;
const google = process.env.NEXT_PUBLIC_GOOGLE;
const salt = process.env.NEXT_PUBLIC_URL_SALT_SERVICE;



const NETWORK: NetworkName = 'devnet';
const MAX_EPOCH = 2; // keep ephemeral keys active for this many Sui epochs from now (1 epoch ~= 24h)

const suiClient = new SuiClient({
  url: getFullnodeUrl(NETWORK),
});

/* Session storage keys */

const setupDataKey = 'zklogin-demo.setup';
const accountDataKey = 'zklogin-demo.accounts';

/* Types */

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



export default function Home() {

  const accounts = useRef<AccountData[]>(loadAccounts()); // useRef() instead of useState() because of setInterval()
  const [balances, setBalances] = useState<Map<string, number>>(new Map()); // Map<Sui address, SUI balance>
  const [modalContent, setModalContent] = useState<string>('');

  useEffect(() => {
    completeZkLogin();
    fetchBalances(accounts.current);
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

  async function sendTransaction(account: AccountData) {
    setModalContent('🚀 Sending transaction...');

    // Sign the transaction bytes with the ephemeral private key
    const txb = new TransactionBlock();
    txb.setSender(account.userAddr);

    const ephemeralKeyPair = keypairFromSecretKey(account.ephemeralPrivateKey);
    const { bytes, signature: userSignature } = await txb.sign({
      client: suiClient,
      signer: ephemeralKeyPair,
    });

    // Generate an address seed by combining userSalt, sub (subject ID), and aud (audience)
    const addressSeed = genAddressSeed(
      BigInt(account.userSalt),
      'sub',
      account.sub,
      account.aud,
    ).toString();

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

  /* HTML */

  const openIdProviders: OpenIdProvider[] = isLocalhost()
    ? ['Connect with Google']
    : ['Connect with Google'];

  return (

    <>
      <main className="flex" style={{
        backgroundImage: `url('/home.png')`, backgroundSize: 'cover',
        height: '710px',
        width: '1515px',
      }}>
        <div className="justify-center items-center h-[50px] w-[200px] my-10 mx-10">
          {accounts.current.length > 0 ? ( 
            <div className='account'>
              <div>
                <a  style={{ color: "black", borderRadius: '9999px', border: '1.5px solid black' }}
                className="bg-white p-2  hover:bg-sky-500"
                target='_blank' rel='noopener noreferrer' href={makeExplorerUrl(NETWORK, 'address', accounts.current[0].userAddr)}>
                  {shortenSuiAddress(accounts.current[0].userAddr, 6, 6, '0x', '...')}
                </a>
                <button
                style={{ color: "black", borderRadius: '9999px', border: '1.5px solid black' }}
                className='bg-white p-2  hover:bg-sky-500'
                onClick={() => { clearState(); } }
              >
                  LogOut
                </button>
              </div>
            </div>
          ) : (
            // Render the connect buttons if no user address is present
            openIdProviders.map(provider =>
              <button style={{ color: "black", borderRadius: '9999px', border: '1.5px solid black' }}
                className="bg-white p-2  hover:bg-sky-500 {`btn-login ${provider}`}"
                onClick={() => { beginZkLogin(provider); } }
                key={provider}
              >
                {provider}
              </button>
            
            )
          )}
        </div>

        <div className="bg-cyan-100 h-[650px] w-[750px] my-6 absolute bottom-4 right-8 rounded-lg ">
          <Nav />
          <div className="h-[300px] w-[700px] my-20 mt-44 mx-6">
            <div className="flex">
              <div className="border border-black rounded-full p-2">
                <h1 className="text-black font-raleway font-medium text-5xl">
                  Innovate. &nbsp;
                </h1>
              </div>
              <div className="border border-black rounded-full p-2">
                <h1 className="text-black font-raleway font-medium text-5xl">
                  Funds.
                </h1>
              </div>
            </div>
            <div className="flex">
              <div className="border border-black rounded-full p-2">
                <h1 className="text-black font-raleway font-medium text-5xl">
                  Build. &nbsp;
                </h1>
              </div>
              <div className="border border-black rounded-full p-2">
                <h1 className="text-black font-raleway font-medium text-5xl">
                  Collaborate.
                </h1>
              </div>
            </div>

            <h1 className="p-6 text-black font-raleway font-medium text-lg ">Crowdfund Your Next Big Event with Us</h1>

            {/* <button className="mx-6"><ConnectWallet
              theme={lightTheme({
                colors: { primaryButtonBg: "none" },
              })}
              style={{ color: "black", borderRadius: '9999px', border: '1.5px solid black' }}
              className="hover:bg-sky-500"
            /></button> */}
            <div className="justify-center items-center h-[50px] w-[200px] my-10 mx-10">
          {accounts.current.length > 0 ? ( 
            <div className='account'>
              <div>
                <a  style={{ color: "black", borderRadius: '9999px', border: '1.5px solid black' }}
                className="bg-white p-2  hover:bg-sky-500"
                target='_blank' rel='noopener noreferrer' href={makeExplorerUrl(NETWORK, 'address', accounts.current[0].userAddr)}>
                  {shortenSuiAddress(accounts.current[0].userAddr, 6, 6, '0x', '...')}
                </a>
                <button
                style={{ color: "black", borderRadius: '9999px', border: '1.5px solid black' }}
                className='bg-white p-2  hover:bg-sky-500'
                onClick={() => { clearState(); } }
              >
                  LogOut
                </button>
              </div>
            </div>
          ) : (
            openIdProviders.map(provider =>
              <button style={{ color: "black", borderRadius: '9999px', border: '1.5px solid black' }}
                className="bg-white p-2  hover:bg-sky-500 {`btn-login ${provider}`}"
                onClick={() => { beginZkLogin(provider); } }
                key={provider}
              >
                {provider}
              </button>
            
            )
          )}
        </div>

            <div className="my-20 mx-6">
              <h1 className="text-black font-raleway font-medium text-xl">Where Dreams Meet Reality</h1>
            </div>
          </div>
        </div>
      </main>

      <div className="flex p-36">
        <h1 className="text-black font-raleway font-medium text-5xl leading-none">
          We help local Communities to <span className="text-purple-600">Crowdfund</span>  <br />
          and <span className="text-purple-600">Launch</span>  Events Successfully
        </h1>
      </div>

      <div className="flex mx-28">
        <div className="mx-6 rounded-xl" style={{
          backgroundImage: `url('/build.png')`, backgroundSize: 'cover',
          height: '400px',
          width: '400px',
        }}>
          <div className="bg-white h-[40px] w-[200px] m-4 flex-shrink-0 rounded-full bg-white">
            <h1 className="p-2 text-black font-raleway font-semibold text-base">1.Build Your Community</h1>
          </div>
          <h1 className="text-white font-raleway font-semibold text-base p-6 mt-60">Shape a digital community where you and like-mindedindividuals govern together.</h1>
        </div>

        <div className="mx-6 rounded-xl" style={{
          backgroundImage: `url('/plan.png')`, backgroundSize: 'cover',
          height: '400px',
          width: '400px',
        }}>
          <div className="bg-white h-[40px] w-[200px] m-4 flex-shrink-0 rounded-full bg-white">
            <h1 className="p-2 text-black font-raleway font-semibold text-base">2.Plan your Events</h1>
          </div>
          <h1 className="text-white font-raleway font-semibold text-base p-6 mt-60">Easily organize, manage, and spread the word about your gatherings.</h1>
        </div>

        <div className="mx-6 rounded-xl" style={{
          backgroundImage: `url('/earn.png')`, backgroundSize: 'cover',
          height: '400px',
          width: '400px',
        }}>
          <div className="bg-white h-[40px] w-[200px] m-4 flex-shrink-0 rounded-full bg-white">
            <h1 className="p-2 text-black font-raleway font-semibold text-base">3.Earn with Events</h1>
          </div>
          <h1 className="text-white font-raleway font-semibold text-base p-6 mt-60">Enjoy a portion of event earnings by holding relevant NFTs.</h1>
        </div>
      </div>


      <div className="flex mx-48">
        <div className="bg-blue-200 h-[400px] w-[700px] mt-44 ">
          <h1 className="text-black font-raleway font-medium text-4xl mt-28 mx-20">Create Communities, <br />Launch Events Effortlessly</h1>
          {/* <button className="mx-20 mt-8"><ConnectWallet
            theme={lightTheme({
              colors: { primaryButtonBg: "#0F4C81" },
            })}
            style={{ color: "white", borderRadius: '9999px' }}
            className="hover:bg-sky-500"
          /></button> */}
          <div className="justify-center items-center h-[50px] w-[200px] my-10 mx-20">
          {accounts.current.length > 0 ? ( 
            <div className='account'>
              <div>
                <a  style={{ color: "black", borderRadius: '9999px', border: '1.5px solid black' }}
                className="bg-white p-2  hover:bg-sky-500"
                target='_blank' rel='noopener noreferrer' href={makeExplorerUrl(NETWORK, 'address', accounts.current[0].userAddr)}>
                  {shortenSuiAddress(accounts.current[0].userAddr, 6, 6, '0x', '...')}
                </a>
                <button
                style={{ color: "black", borderRadius: '9999px', border: '1.5px solid black' }}
                className='bg-white p-2  hover:bg-sky-500'
                onClick={() => { clearState(); } }
              >
                  LogOut
                </button>
              </div>
            </div>
          ) : (
            openIdProviders.map(provider =>
              <button style={{ color: "black", borderRadius: '9999px', border: '1.5px solid black' }}
                className="bg-white p-2  hover:bg-sky-500 {`btn-login ${provider}`}"
                onClick={() => { beginZkLogin(provider); } }
                key={provider}
              >
                {provider}
              </button>
            
            )
          )}
        </div>
        </div>
        <div className="h-[400px] w-[450px] mt-44" style={{
          backgroundImage: `url('/create.png')`, backgroundSize: 'cover'
        }}>
        </div>
      </div>

      <footer className=" mt-20">
        <div className=" py-4 text-black text-center">
          <p className="text-black font-raleway font-medium text-4xl capitalize">Connect with us</p>
        </div>
        <div className="container mx-auto py-10 px-6">
          <div className="flex justify-center">
            <a href="#" className="text-blue-900 mx-5">
              <FaDiscord size={40} />
            </a>
            <a href="#" className="text-blue-900 mx-5">
              <FaXTwitter size={40} />
            </a>
            <a href="#" className="text-blue-900 mx-2">
              <BsTelegram size={40} />
            </a>
          </div>
        </div>

      </footer>
    </>
  );
}
