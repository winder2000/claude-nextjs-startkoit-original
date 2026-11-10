import type { Metadata } from "next"
import LoginClient from "./login-client"

export const metadata: Metadata = {
  title: "로그인",
  description: "계정에 로그인하세요",
}

export default function LoginPage() {
  return <LoginClient />
}
