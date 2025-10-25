import React from "react";
import { Link, useNavigate } from "react-router-dom";
import SearchButton from "./SearchButton";
import NavigationMenu from "./NavigationMenu";
import ChainSelector from "./ChainSelector";

const LeftSidebar = ({ openSearchModal }) => {
  const navigate = useNavigate();

  const handleChainSelect = (chainId) => {
    navigate(`/${chainId}`);
  };

  return (
    <div className="w-64 bg-dex-bg-secondary text-dex-text-primary flex flex-col border-r border-dex-border h-screen sticky top-0 overflow-y-auto">
      <div className="p-4">
        <Link to="/" className="block">
          <div className="flex flex-col">
            <div className="flex items-center space-x-2">
              <span className="text-yellow-500 text-xl font-bold">
                <span className="text-2xl">⚡</span>
              </span>
              <span className="font-bold text-lg tracking-wide">MINOTAURION</span>
            </div>
            <span className="text-xs text-gray-400 ml-7 italic">
              Only the Brave Trade Here
            </span>
          </div>
        </Link>
        <SearchButton openSearchModal={openSearchModal} />
        <NavigationMenu />
        <ChainSelector />
      </div>
    </div>
  );
};

export default LeftSidebar;
