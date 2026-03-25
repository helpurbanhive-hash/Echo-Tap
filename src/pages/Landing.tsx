import { WebGLShader } from "../components/ui/web-gl-shader";
import { LiquidButton } from '../components/ui/liquid-glass-button';
import { useNavigate } from "react-router-dom";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-black">
      <WebGLShader /> 
      <div className="relative z-10 border border-[#27272a] p-2 w-full mx-auto max-w-3xl bg-black/40 backdrop-blur-sm rounded-xl">
        <main className="relative border border-[#27272a] py-16 px-8 overflow-hidden rounded-lg">
          <h1 className="mb-6 text-white text-center text-7xl font-extrabold tracking-tighter md:text-[clamp(3rem,8vw,7rem)] leading-none">
            EchoTap <br/>
            <span className="text-blue-500">Feedback Redefined</span>
          </h1>
          <p className="text-white/60 px-6 text-center text-sm md:text-base lg:text-xl max-w-2xl mx-auto mb-10">
            Transform customer voices into actionable insights. Real-time feedback, AI-powered analysis, and seamless loyalty rewards.
          </p>
          <div className="mb-10 flex items-center justify-center gap-2">
            <span className="relative flex h-3 w-3 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
            </span>
            <p className="text-sm text-green-500 font-medium">Empowering 500+ Businesses</p>
          </div>
          
          <div className="flex justify-center"> 
            <LiquidButton 
              className="text-white border border-white/20 rounded-full px-12 py-4 hover:bg-white/10 transition-all" 
              size={'xl'}
              onClick={() => navigate('/login')}
            >
              Get Started
            </LiquidButton> 
          </div> 
        </main>
      </div>
    </div>
  );
}
