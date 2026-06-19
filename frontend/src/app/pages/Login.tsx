import { LoginForm } from '../components/auth/LoginForm';

export function Login() {
  return (
    <div className="min-h-screen bg-[#faf7f2] flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">

      <div className="w-full max-w-md">
        <LoginForm />
      </div>

    </div>
  );
}