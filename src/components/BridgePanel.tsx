import AddressBar from "./AddressBar";
import NetworkCard from "./NetworkCard";
import TokenSelector from "./TokenSelector";

const BridgePanel = () => {
  return (
    <div className="bridge-panel">
      <AddressBar />
      <NetworkCard />
      <TokenSelector direction="from" />
    </div>
  );
};

export default BridgePanel;
