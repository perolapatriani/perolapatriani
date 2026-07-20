import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listProperties from "./tools/list-properties";
import listCrmContacts from "./tools/list-crm-contacts";
import getCrmContact from "./tools/get-crm-contact";
import addCrmNote from "./tools/add-crm-note";

// Build issuer from the project ref (Vite inlines this literal at build time,
// so the module stays import-safe). Never derive it from SUPABASE_URL — on
// Lovable Cloud that's a `.lovable.cloud` proxy and mcp-js rejects it.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "perola-patriani-mcp",
  title: "Pérola Patriani · MCP",
  version: "0.1.0",
  instructions:
    "Ferramentas do site da Pérola Patriani. Use list_properties para consultar imóveis publicados, e as ferramentas de CRM (list_crm_contacts, get_crm_contact, add_crm_note) para gerenciar leads — exigem conta com permissão de admin.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listProperties, listCrmContacts, getCrmContact, addCrmNote],
});
