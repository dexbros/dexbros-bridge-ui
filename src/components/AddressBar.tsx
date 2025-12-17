import { FiClock, FiUser } from "react-icons/fi";
import { Link } from "react-router-dom";

const AddressBar = () => {
  return (
    <div className="address-bar">
      {/* LEFT: History */}
      <div className="bar-left">
        <FiClock size={18} />
        <Link to="/history">History</Link>
      </div>

      {/* CENTER: Logo + Brand */}
      <div className="bar-center">
        <img
          src="/dexbros-blue_small.png"
          alt="Dexbros"
          className="dexbros-logo"
        />
        <span className="brand-title">
          Dexbros
          <span className="brand-badge">Beta</span>
        </span>
      </div>

      {/* RIGHT: User / Wallet Icon */}
      <div className="bar-right">
        <FiUser size={20} />
      </div>
    </div>
  );
};

export default AddressBar;
