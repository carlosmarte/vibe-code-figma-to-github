import React from 'react';

interface CoverProps {
  children?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Cover: React.FC<CoverProps> = ({ 
  children, 
  className = '', 
  onClick 
}) => {
  return (
    <div className="cover-07" style={{"width":"1600px","height":"900px","backgroundColor":"#ffc564"}}>
      <span className="updated-08" style={{"width":"154px","height":"48px","backgroundColor":"#000000","fontFamily":"Circular Sp UI","fontSize":"16px","fontWeight":450,"lineHeight":"24px","textAlign":"left"}}>
        V.1 | Nov 2022
By Oskar Westerberg
      </span>
      <div className="logos-09" style={{"width":"360.94000244140625px","height":"66.80743408203125px"}}>
        <div className="divider-010" style={{"width":"1.45294189453125px","height":"68px","backgroundColor":"#535353"}} />
        <div className="spotify-design-011" style={{"width":"360.94000244140625px","height":"66.80743408203125px"}}>
          <div className="logo-012" style={{"width":"360.94000244140625px","height":"66.80743408203125px"}}>
            <div className="shape-013" style={{"width":"360.94000244140625px","height":"66.80743408203125px","backgroundColor":"#191414"}} />
          </div>
        </div>
      </div>
      <span className="title-014" style={{"width":"1166.666748046875px","height":"390px","backgroundColor":"#191414","fontFamily":"Circular Sp UI","fontSize":"130px","fontWeight":700,"letterSpacing":"-5px","lineHeight":"130px","textAlign":"left"}}>
        Spotify 
Performance 
Cards 
      </span>
    </div>
  );
};

export default Cover;
