import { Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import WhatsAppFloat from "./WhatsAppFloat";
import PerolaChat from "@/components/PerolaChat";

export default function SiteLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 pt-24">
        <Outlet />
      </main>
      <Footer />
      <WhatsAppFloat />
      <PerolaChat />
    </div>
  );
}
