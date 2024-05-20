"use client"
import DashboardNav from '@/components/common/Nav/dashboardnav'
import React, { useState } from 'react'

const Page = () => {
  // const [showPayNow, setShowPayNow] = useState(false);

  return (
    <div>
      <DashboardNav />
      <div className='h-[630px]' style={{ background: "#BDE3F0" }}>
        <h1 className='p-6 text-black text-2xl mb-1 font-Raleway'>Crowdfunding-Events</h1>
        <div className='flex mx-8 gap-6 my-4'>
          <div className='h-[400px] w-[350px] p-6 bg-amber-400'>
            <div className='' style={{
              backgroundImage: `url('/crowdfund.png')`, backgroundSize: 'cover',
              height: '260px',
              width: '300px',
            }}>
            </div>
            <h1 className='text-black font-raleway text-2xl font-semibold leading-normal capitalize py-4'>Your Music Collection</h1>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Page;
