import pf from "../assets/default_user_pf.jpeg";
import pf1 from "../assets/default_user_pf1.jpg";

const getRandomProfile = () => {
  return Math.random() > 0.5 ? pf1 : pf;
};

export default getRandomProfile;
