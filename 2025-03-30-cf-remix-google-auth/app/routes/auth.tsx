import { Outlet } from "@remix-run/react";

/**
 * /auth/* URLのレイアウト
 * このファイルは、/auth/page1 や /auth/page2 などのURLに対応するルートのレイアウトとして機能する
 */
export default function AuthLayout() {
  return (
    <div>
      <Outlet />
    </div>
  );
}
