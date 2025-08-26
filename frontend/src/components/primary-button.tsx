import React from 'react';

interface PrimaryButtonProps {
  children?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({ 
  children, 
  className = '', 
  onClick 
}) => {
  return (
    <div className="primary-button-123456" style={{"width":"120px","height":"48px","display":"flex","flexDirection":"row","alignItems":"center","justifyContent":"center","paddingTop":"12px","paddingBottom":"12px","paddingLeft":"24px","paddingRight":"24px","backgroundColor":"#3b82f6","borderRadius":"8px","boxShadow":"0px 2px 4px 0px #0000001a"}}>
      <span className="button-text-123457" style={{"backgroundColor":"#ffffff","fontFamily":"Inter","fontSize":"16px","fontWeight":600,"lineHeight":"24px","textAlign":"center"}}>
        Click Me
      </span>
    </div>
  );
};

export default PrimaryButton;
