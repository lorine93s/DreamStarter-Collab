import React, { FC, useState } from "react";

import Link from "next/link";

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
import { useEffect, useRef } from 'react';

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
const Nav2: FC = () => {
  // const router = useRouter();
  const [OpenIdProviders, setOpenIdProviders] = useState<OpenIdProvider[]>(["Connect with Google"]);

  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);
  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };
  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  // const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
  //   const path = event.target.value;
  //   if (path) {
  //     router.push(path);
  //   }
  // };

  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const navLinks = [
    {
      title: "Launch",
      subItems: [
        { title: "Create Proposal", path: "/launch/create-proposal" },
        { title: "Convert Proposal", path: "/launch/convert-proposal" },
      ],
    },
    {
      title: "Explore",
      subItems: [
        { title: "Ongoing Proposals", path: "/explore/ongoing-proposals" },
        {
          title: "Crowdfunding Events",
          path: "/explore/crowdfunding-events",
        },
      ],
    },
   
  ];
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

  // const openIdProviders: OpenIdProvider[] = isLocalhost()
  //   ? ['Connect with Google']
  //   : ['Connect with Google'];
  return (
    <div className="px-6 py-4 shadow-sm flex justify-between items-center ">
    

      <div className="flex gap-4 items-center text-black">
        {navLinks.map((navItem) => (
          <div
            key={navItem.title}
            className="relative  cursor-pointer"
            onMouseEnter={() => setActiveDropdown(navItem.title)}
            onMouseLeave={() => setActiveDropdown(null)}
          >
            {navItem.title}
            {navItem.subItems && (
              <div
                className={`absolute left-0 w-48 py-2 px-2  rounded-md shadow-xl  ${activeDropdown === navItem.title ? "block" : "hidden"
                  }`}
              >
                {navItem.subItems.map((subItem) => (
                  <Link
                    key={subItem.title}
                    href={subItem.path}
                    className="block px-4 py-2 text-sm hover:bg-blue-50 hover:text-blue-500 rounded-md"
                  >
                    {subItem.title}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
        <a href="/community/create-community">Community</a>
        <a href="/dashboard/crowdfunding-events">Dashboard</a>
        {/* <ConnectWallet 
          theme={lightTheme({
            colors: { primaryButtonBg: "black" },
          })}
          style={{ color: "white" ,borderRadius: '9999px' }}
          className="hover:bg-sky-500"
        /> */}
        
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
            OpenIdProviders.map(provider =>
              <button style={{ color: "black", borderRadius: '9999px', border: '1.5px solid black' }}
                className="bg-white p-2  hover:bg-sky-500 {`btn-login ${provider}`}"
                onClick={() => { beginZkLogin(provider); } }
                key={provider}
              >
                {provider}
              </button>
            
            )
          )}
      
        {/* <Box sx={{ flexGrow: 0 }}>
          <Tooltip title="Open settings">
            <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
              <Avatar alt="Remy Sharp" src="" />
            </IconButton>
          </Tooltip>
          <Menu
            sx={{ mt: "45px" }}
            id="menu-appbar"
            anchorEl={anchorElUser}
            anchorOrigin={{
              vertical: "top",
              horizontal: "right",
            }}
            keepMounted
            transformOrigin={{
              vertical: "top",
              horizontal: "right",
            }}
            open={Boolean(anchorElUser)}
            onClose={handleCloseUserMenu}
          >
            <List>
              <a href="/profile"><Button sx={{ color: "grey" }}>Profile</Button></a>
               <br />
              <a href="/dashboard/dashboard"><Button sx={{ color: "grey" }}>Dashboard</Button></a>
              <br />
              <Button sx={{ color: "grey" }}>Settings</Button>
              <br />
              <Button sx={{ color: "rgb(239, 101, 101)" }}>Logout</Button>
            </List>
          </Menu>
        </Box> */}
      </div>
    </div>
  );
};

export default Nav2;
