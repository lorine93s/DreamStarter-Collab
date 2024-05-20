"use client"
import DashboardNav from '@/components/common/Nav/dashboardnav'
import React, { useState } from 'react'

const page = () => {
const [showPayNow, setShowPayNow] = useState(false);
  return (
    <div>
      <DashboardNav />
      <div className='h-[630px]' style={{ background: "#BDE3F0" }}>
        <h1 className='p-6 text-black text-2xl mb-1 font-Raleway'>Started Events</h1>
        <div className='flex'>
        <button className='inline-flex px-42 py-18 justify-center items-center rounded-full bg-amber-400 p-2 mx-6 px-4 text-black text-black text-center font-raleway text-base font-medium leading-20 capitalize'>Your Events</button>
        {/* <button className='inline-flex px-42 py-18 justify-center items-center rounded-full bg-blue-800 p-2 mx-6 px-4 text-white'>Pay Now</button> */}
        {!showPayNow && (
          <button onClick={() => setShowPayNow(true)} className='inline-flex px-42 py-18 justify-center items-center rounded-full bg-blue-800 p-2 mx-6 px-4 text-white'>Pay Now</button>
        )}
        {showPayNow && (
          <div className='absolute top-0 left-0 w-full h-full flex items-center justify-center'>
            <div className='bg-blue-800 p-8 rounded-lg shadow-md text-white'>
              <h2 className='text-xl font-semibold mb-4'>Choose Payment Method</h2>
              <h2 className='text-white text-center font-raleway text-sm font-light leading-normal capitalize'>Select the convenience of email payments or the <br /> security of Espro to complete your transaction.</h2>
            <a href="/pay"><button className='block mx-auto px-16 py-2 bg-white text-black rounded-full mt-4'>Pay by email</button></a> <br />
              <button className='block mx-auto px-16 py-2 bg-white text-black rounded-full'>Pay by espro</button>
              <button onClick={() => setShowPayNow(false)} className='block mx-auto px-4 py-2 bg-white text-black rounded-lg mt-2'>Close</button>
            </div>
          </div>
        )}
        </div>
        <div className='flex mx-8 gap-6 my-4'>
        

          <div className='h-[400px] w-[350px] p-6 bg-amber-400'>
            <div className='' style={{
            backgroundImage: `url('/startedevents.png')`, backgroundSize: 'cover',
            height: '260px',
            width: '300px',
          }}>
            </div>
            <h1 className='text-black font-raleway text-2xl font-semibold leading-normal capitalize py-4'>NFT Details</h1>
          </div>
        </div>
      </div>
    </div>
  )
}

export default page