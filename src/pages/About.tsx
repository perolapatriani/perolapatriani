import Seo from "@/components/Seo";
import AboutSection from "@/components/home/AboutSection";
import WhyPerola from "@/components/home/WhyPerola";
import FinalCta from "@/components/home/FinalCta";

export default function About() {
  return (
    <>
      <Seo title="Sobre Pérola · Consultoria Imobiliária" path="/sobre" />
      <AboutSection />
      <WhyPerola />
      <FinalCta />
    </>
  );
}
