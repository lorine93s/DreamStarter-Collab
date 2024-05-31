"use client"
import Nav3 from '@/components/common/Nav/nav3';
import WormholeConnect from '@wormhole-foundation/wormhole-connect';

const DemoNav = () => {
  return (
    <div>
   <Nav3/>
    {/* <WormholeConnect config={{"env":"devnet"}} /> */}
    <WormholeConnect />

    </div>
  );
}
export default DemoNav;