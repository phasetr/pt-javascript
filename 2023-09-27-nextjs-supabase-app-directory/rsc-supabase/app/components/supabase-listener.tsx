"use client";
import { useRouter } from "next/navigation";
import useStore from "@/store";
import { useEffect } from "react";
import supabase from "@/utils/supabase";

export default function SupabaseListener({ accessToken }: { accessToken?: string }) {
  const router = useRouter();
  const {
    updateLoginUser
  } = useStore();
  useEffect(() => {
    const getUserInfo = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        updateLoginUser({ id: data.session?.user.id, email: data.session?.user.email });
      }
    };
    getUserInfo();
    supabase.auth.onAuthStateChange((_, session) => {
      updateLoginUser({ id: session?.user.id, email: session?.user.email });
      // 左辺がクライアントサイドのトークンで、右辺がサーバーサイドのトークン
      if (session?.access_token !== accessToken) {
        router.refresh();
      }
    });
  }, [accessToken]);
  return null;
};
