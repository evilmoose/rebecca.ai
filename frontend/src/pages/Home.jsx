import { useAuth} from '../contexts/AuthContext';
import NormalScrollLayout from '../components/NormalScrollLayout';
import Navbar from '../components/Navbar';
const Home = () => {
  const { currentUser } = useAuth();
  
  return (
    <NormalScrollLayout>
      <Navbar />
      <h1>Home</h1>
    </NormalScrollLayout>
  );
};

export default Home;