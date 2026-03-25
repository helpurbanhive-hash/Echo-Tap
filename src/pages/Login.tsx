'use client';
import { useState, ChangeEvent, FormEvent, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
} from 'firebase/auth';
import { auth, googleProvider, db } from '../firebase';
import { doc, setDoc, collection, addDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firebase-utils';
import {
  Ripple,
  AuthTabs,
  TechOrbitDisplay,
} from '../components/ui/modern-animated-sign-in';
import { WebGLShader } from '../components/ui/web-gl-shader';

type FormData = {
  email: string;
  password: string;
};

interface OrbitIcon {
  component: () => ReactNode;
  className: string;
  duration?: number;
  delay?: number;
  radius?: number;
  path?: boolean;
  reverse?: boolean;
}

const iconsArray: OrbitIcon[] = [
  {
    component: () => (
      <img
        width={30}
        height={30}
        src='https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/html5/html5-original.svg'
        alt='HTML5'
      />
    ),
    className: 'size-[30px] border-none bg-transparent',
    duration: 20,
    delay: 20,
    radius: 100,
    path: false,
    reverse: false,
  },
  {
    component: () => (
      <img
        width={30}
        height={30}
        src='https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/css3/css3-original.svg'
        alt='CSS3'
      />
    ),
    className: 'size-[30px] border-none bg-transparent',
    duration: 20,
    delay: 10,
    radius: 100,
    path: false,
    reverse: false,
  },
  {
    component: () => (
      <img
        width={50}
        height={50}
        src='https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/typescript/typescript-original.svg'
        alt='TypeScript'
      />
    ),
    className: 'size-[50px] border-none bg-transparent',
    radius: 210,
    duration: 20,
    path: false,
    reverse: false,
  },
  {
    component: () => (
      <img
        width={50}
        height={50}
        src='https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/javascript/javascript-original.svg'
        alt='JavaScript'
      />
    ),
    className: 'size-[50px] border-none bg-transparent',
    radius: 210,
    duration: 20,
    delay: 20,
    path: false,
    reverse: false,
  },
  {
    component: () => (
      <img
        width={30}
        height={30}
        src='https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/tailwindcss/tailwindcss-original.svg'
        alt='TailwindCSS'
      />
    ),
    className: 'size-[30px] border-none bg-transparent',
    duration: 20,
    delay: 20,
    radius: 150,
    path: false,
    reverse: true,
  },
  {
    component: () => (
      <img
        width={30}
        height={30}
        src='https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nextjs/nextjs-original.svg'
        alt='Nextjs'
      />
    ),
    className: 'size-[30px] border-none bg-transparent',
    duration: 20,
    delay: 10,
    radius: 150,
    path: false,
    reverse: true,
  },
  {
    component: () => (
      <img
        width={50}
        height={50}
        src='https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/react/react-original.svg'
        alt='React'
      />
    ),
    className: 'size-[50px] border-none bg-transparent',
    radius: 270,
    duration: 20,
    path: false,
    reverse: true,
  },
  {
    component: () => (
      <img
        width={50}
        height={50}
        src='https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/figma/figma-original.svg'
        alt='Figma'
      />
    ),
    className: 'size-[50px] border-none bg-transparent',
    radius: 270,
    duration: 20,
    delay: 60,
    path: false,
    reverse: true,
  },
  {
    component: () => (
      <img
        width={50}
        height={50}
        src='https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/git/git-original.svg'
        alt='Git'
      />
    ),
    className: 'size-[50px] border-none bg-transparent',
    radius: 320,
    duration: 20,
    delay: 20,
    path: false,
    reverse: false,
  },
];

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleInputChange = (
    event: ChangeEvent<HTMLInputElement>,
    name: keyof FormData
  ) => {
    const value = event.target.value;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        const user = userCredential.user;

        let businessRef;
        try {
          // 1. Create a default business for the new owner
          businessRef = await addDoc(collection(db, 'businesses'), {
            name: `${formData.email.split('@')[0]}'s Business`,
            ownerId: user.uid,
            customPrompt: "Bas 5 seconds mein batao – service kaisi thi 🙂",
            createdAt: serverTimestamp(),
          });
        } catch (err: any) {
          handleFirestoreError(err, OperationType.CREATE, 'businesses');
        }

        try {
          // 2. Create the user profile document
          await setDoc(doc(db, 'users', user.uid), {
            email: user.email,
            displayName: user.email?.split('@')[0],
            role: 'owner',
            businessId: businessRef.id,
            createdAt: serverTimestamp(),
          });
        } catch (err: any) {
          handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}`);
        }
      } else {
        await signInWithEmailAndPassword(auth, formData.email, formData.password);
      }
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      const user = userCredential.user;

      // Check if user profile already exists
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        let businessRef;
        try {
          // 1. Create a default business for the new owner
          businessRef = await addDoc(collection(db, 'businesses'), {
            name: `${user.displayName || user.email?.split('@')[0]}'s Business`,
            ownerId: user.uid,
            customPrompt: "Bas 5 seconds mein batao – service kaisi thi 🙂",
            createdAt: serverTimestamp(),
          });
        } catch (err: any) {
          handleFirestoreError(err, OperationType.CREATE, 'businesses');
        }

        try {
          // 2. Create the user profile document
          await setDoc(userDocRef, {
            email: user.email,
            displayName: user.displayName || user.email?.split('@')[0],
            role: 'owner',
            businessId: businessRef.id,
            createdAt: serverTimestamp(),
          });
        } catch (err: any) {
          handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}`);
        }
      }

      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const toggleMode = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setIsSignUp(!isSignUp);
    setError(null);
  };

  const formFields = {
    header: isSignUp ? 'Create Account' : 'Welcome back',
    subHeader: isSignUp ? 'Sign up to get started' : 'Sign in to your account',
    fields: [
      {
        label: 'Email',
        required: true,
        type: 'email' as const,
        placeholder: 'Enter your email address',
        onChange: (event: ChangeEvent<HTMLInputElement>) =>
          handleInputChange(event, 'email'),
      },
      {
        label: 'Password',
        required: true,
        type: 'password' as const,
        placeholder: 'Enter your password',
        onChange: (event: ChangeEvent<HTMLInputElement>) =>
          handleInputChange(event, 'password'),
      },
    ],
    submitButton: isSignUp ? 'Sign up' : 'Sign in',
    textVariantButton: isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up",
    errorField: error || undefined,
  };

  return (
    <section className='flex max-lg:justify-center min-h-screen bg-background'>
      {/* Left Side */}
      <span className='flex flex-col justify-center w-1/2 max-lg:hidden relative overflow-hidden bg-black'>
        <WebGLShader />
        <div className="relative z-10">
          <TechOrbitDisplay iconsArray={iconsArray} text="EchoTap" />
        </div>
      </span>

      {/* Right Side */}
      <span className='w-1/2 h-[100dvh] flex flex-col justify-center items-center max-lg:w-full max-lg:px-[10%]'>
        <AuthTabs
          formFields={formFields}
          goTo={toggleMode}
          handleSubmit={handleSubmit}
          onGoogleLogin={handleGoogleLogin}
        />
      </span>
    </section>
  );
}
