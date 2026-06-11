import Seo from "@/components/Seo";
import Hero from "@/components/home/Hero";
import FeaturedProperties from "@/components/home/FeaturedProperties";
import NeighborhoodsGrid from "@/components/home/NeighborhoodsGrid";
import LaunchesSection from "@/components/home/LaunchesSection";
import Services from "@/components/home/Services";
import WhyPerola from "@/components/home/WhyPerola";
import AboutSection from "@/components/home/AboutSection";
import Testimonials from "@/components/home/Testimonials";
import BlogSection from "@/components/home/BlogSection";
import FinalCta from "@/components/home/FinalCta";

export default function Index() {
  return (
    <>
      <Seo
        title="Pérola Patriani · Consultoria Imobiliária"
        description="Consultoria imobiliária no litoral paulista. Imóveis de alto padrão, lançamentos exclusivos e atendimento estratégico."
      />
      <Hero />
      <FeaturedProperties />
      <NeighborhoodsGrid />
      <LaunchesSection />
      <Services />
      <WhyPerola />
      <AboutSection />
      {/* <Testimonials /> */}
      <BlogSection />
      <FinalCta />
    </>
  );
}
