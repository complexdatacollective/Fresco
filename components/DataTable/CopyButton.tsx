import React, { useRef, useState } from 'react';

interface CopyButtonProps {
  text: string;
}

const CopyButton: React.FC<CopyButtonProps> = ({ text }) => {
  const copyButtonRef = useRef<HTMLButtonElement>(null);
  const [btnText, setBtnText] = useState('Copy URL');

  const handleCopyClick = () => {
    const copyText = text;
    if (copyText) {
      navigator.clipboard
        .writeText(copyText)
        .then(() => {
          console.log('Copied to clipboard!');
          setBtnText('Copied');
          setTimeout(() => {
            setBtnText('Copy URL');
          }, 1000);
        })
        .catch((error) => {
          console.error('Failed to copy to clipboard:', error);
        });
    }
  };

  return (
    <button
      className="w-full text-left"
      ref={copyButtonRef}
      onClick={handleCopyClick}
    >
      {btnText}
    </button>
  );
};

export default CopyButton;
