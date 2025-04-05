import AuthForm from '../components/AuthForm';
import NormalScrollLayout from '../components/NormalScrollLayout';

const Login = () => {
  return (
    <NormalScrollLayout>
      <div className="max-w-md mx-auto px-4 sm:px-6 py-12">
        <AuthForm type="login" />
      </div>
    </NormalScrollLayout>
  );
};

export default Login;