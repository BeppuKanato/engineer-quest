"use client";

import { Header } from "./component/initial/Header";
import { Hero } from "./component/initial/Hero";
import { Features } from "./component/initial/Features";
import { GameFeatures } from "./component/initial/GameFeatures";
import { Cta } from "./component/initial/Cta";
import { Footer } from "./component/initial/Footer";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const loginRouter = () => {
    router.push("/auth/login");
  }
  const signupRouter = () => {
    router.push("/auth/signup");
  }
  return (
    <>
      <Header loginRouter={loginRouter}/>
      <Hero signupRouter={signupRouter}/>
      <Features/>
      <GameFeatures />
      <Cta signupRouter={signupRouter}/>
      <Footer />
    </>
  );
}
