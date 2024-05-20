"use client"
import Nav3 from '@/components/common/Nav/nav3'
import React from 'react'

const page = () => {
  return (
    <div>
      <Nav3 />
      <div className="flex flex-col" style={{
        backgroundImage: `url('/communityback.png')`, backgroundSize: 'cover',
        height: '1050px',
        width: '1519px',
      }}>
        <div className='flex h-[480px] w-[790px] mt-8 mx-96 rounded-lg border border-black opacity-80 bg-blue-200 mix-blend-darken backdrop-blur-2 p-8'>
          <div className='opacity-100' style={{
            backgroundImage: `url('/luffy.png')`, backgroundSize: 'cover',
            height: '420px',
            width: '250px',
          }}>
          </div>
          <div className='p-8'>
            <h1 className='text-black font-space-mono text-4xl font-bold leading-72'>Start your own <br />voyage in web 3</h1> <br /> <br /> <br /> <br /> <br />
            <h1 className='text-black font-space-mono text-22 font-bold italic font-normal leading-32'>Explore Dapp with contribution and bounties.</h1> <br /> <br /> <br /> <br /> <br />
            <button className=' text-yellow-400 font-space-mono text-base font-normal leading-6 rounded-lg bg-blue-800 shadow-lg backdrop-blur-sm p-2'>Meet new friends</button> &nbsp;&nbsp;&nbsp;
            <button className=' text-yellow-400 font-space-mono text-base font-normal leading-6 rounded-lg bg-blue-800 shadow-lg backdrop-blur-sm p-2'>Earn rewards</button>&nbsp;&nbsp;&nbsp;
            <button className=' text-yellow-400 font-space-mono text-base font-normal leading-6 rounded-lg bg-blue-800 shadow-lg backdrop-blur-sm p-2'>Collect NFTs</button>
          </div>
        </div>


        <div className='flex mt-24 mx-96 gap-6'>
          <div className='' style={{
            backgroundImage: `url('/luffy2.png')`, backgroundSize: 'cover',
            height: '330px',
            width: '300px',
          }}>
          </div>
          <div className='' style={{
            backgroundImage: `url('/game1.png')`, backgroundSize: 'cover',
            height: '330px',
            width: '300px',
          }}>
          </div>
          <div className='' style={{
            backgroundImage: `url('/game2.png')`, backgroundSize: 'cover',
            height: '330px',
            width: '300px',
          }}>
          </div>

        </div>
      </div>
    </div>
  )
}

export default page