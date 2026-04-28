import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useFeaturedProperties(limit = 8) {
  return useQuery({
    queryKey: ["properties", "featured", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("is_featured", true)
        .eq("status", "ativo")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useProperties() {
  return useQuery({
    queryKey: ["properties", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("status", "ativo")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useProperty(slug: string | undefined) {
  return useQuery({
    queryKey: ["property", slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties").select("*").eq("slug", slug!).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useNeighborhoods() {
  return useQuery({
    queryKey: ["neighborhoods"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("neighborhoods").select("*").order("display_order");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useLaunches() {
  return useQuery({
    queryKey: ["launches"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("launches").select("*").eq("status", "ativo")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useLaunch(slug: string | undefined) {
  return useQuery({
    queryKey: ["launch", slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("launches").select("*").eq("slug", slug!).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useTestimonials() {
  return useQuery({
    queryKey: ["testimonials"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("testimonials").select("*").eq("is_published", true)
        .order("display_order");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function usePosts(limit?: number) {
  return useQuery({
    queryKey: ["posts", limit ?? "all"],
    queryFn: async () => {
      let q = supabase.from("posts").select("*").eq("is_published", true)
        .order("published_at", { ascending: false });
      if (limit) q = q.limit(limit);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function usePost(slug: string | undefined) {
  return useQuery({
    queryKey: ["post", slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts").select("*").eq("slug", slug!).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}
