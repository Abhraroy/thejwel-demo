'use client';

import { useState, useEffect } from 'react';
import AddressForm from './AddressForm';
import { createClient } from '@/lib/supabase-Utils/client';

interface AddressSectionProps {
  userId: string;
}

const AddressIconComponent = ({className}: {className: string}) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
  </svg>
);

const PlusIcon = ({className}: {className: string}) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

export default function AddressSection({addresses, userId}: {addresses: any[], userId: string}) {
  const [showAddressForm, setShowAddressForm] = useState(false);
  const handleAddAddress = () => {
    setShowAddressForm(true);
  };

  const handleCloseForm = () => {
    setShowAddressForm(false);
  };

  const handleSuccess = () => {
    // Form will refresh the page on success
    setShowAddressForm(false);
  };





  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <AddressIconComponent className="w-5 h-5" />
          Saved Addresses
        </h2>
        
     
          { addresses && addresses.length > 0 ? (
            <div className="mt-4 text-sm text-gray-600 flex flex-col items-center gap-2 p-2">
              {addresses && addresses.map((address) => (
                <div key={address.address_id} className="w-full p-3 rounded-md flex flex-col sm:flex-row sm:items-start gap-2 bg-white/60 border border-[#360000]/10">
                  <div className="flex items-start gap-2">
                    <AddressIconComponent className="shrink-0 w-5 h-5 text-[#360000]" />
                    <div className="text-[#360000] leading-relaxed">
                      <div className="font-semibold">
                        {address.street_address}
                        {address.house_no && `, ${address.house_no}`}
                        {address.landmark && `, ${address.landmark}`}
                        {address.address_line1 && `, ${address.address_line1}`}
                      </div>
                      {address.address_line2 && (
                        <div className="text-sm text-[#360000]/90">{address.address_line2}</div>
                      )}
                      <div className="text-sm">
                        {address.city}, {address.state} - {address.postal_code}
                      </div>
                      <div className="text-xs text-[#360000]/80">{address.country}</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3 sm:ml-auto justify-start sm:justify-end w-full sm:w-auto">
                    {address.address_type && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#CAF2FF] text-[#360000] border border-[#360000]/10 whitespace-nowrap">
                        {address.address_type}
                      </span>
                    )}
                    {address.is_default && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#fde68a] text-[#92400e] border border-[#92400e]/20 whitespace-nowrap">
                        Default
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-gray-600">No saved addresses</p>
          )}
          <button 
            onClick={handleAddAddress}
            className="group relative mt-4 w-full px-6 py-3 bg-linear-to-r from-[#360000] to-[#360000]/80 text-white font-medium text-sm rounded-lg 
                       transition-all duration-300 ease-in-out
                       transform hover:scale-105 active:scale-95
                       shadow-md hover:shadow-xl hover:shadow-theme-sage/30
                       flex items-center justify-center gap-2
                       overflow-hidden
                       border border-transparent hover:border-white/20"
          >
            <span className="relative z-10 flex items-center gap-2">
              <PlusIcon className="w-5 h-5 transition-all duration-300 group-hover:rotate-90 group-hover:scale-110" />
              <span className="transition-all duration-300 group-hover:tracking-wide">Add Address</span>
            </span>
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent 
                           opacity-0 group-hover:opacity-100
                           transform -skew-x-12 -translate-x-full group-hover:translate-x-full
                           transition-transform duration-1000 ease-in-out"></span>
          </button>
       
      </div>

      {showAddressForm && (
        <AddressForm
          userId={userId}
          onClose={handleCloseForm}
          onSuccess={handleSuccess}
        />
      )}
    </>
  );
}

