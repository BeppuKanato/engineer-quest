"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Home, Target, User, ArrowLeft, ShareIcon } from "lucide-react";

interface NavBarProps {
  showBackButton?: boolean; // 前のページへ戻るボタンを表示するか
}

export const NavBar: React.FC<NavBarProps> = ({ showBackButton = false }) => {
  const router = useRouter();

  const iconClass = "w-4 h-4 text-blue-500"; // アイコン共通の色

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-md z-50">
      <div className="flex justify-around items-center py-2">
        {showBackButton && (
          <button
            onClick={() => router.back()}
            className="flex flex-col items-center text-sm text-gray-600 hover:text-blue-600"
          >
            <ArrowLeft className={iconClass} />
            戻る
          </button>
        )}
        <Link
          href="/home"
          className="flex flex-col items-center text-sm text-gray-600 hover:text-blue-600"
        >
          <Home className={iconClass} />
          ホーム
        </Link>
        <Link
          href="/problem/mission-select"
          className="flex flex-col items-center text-sm text-gray-600 hover:text-blue-600"
        >
          <Target className={iconClass} />
          ミッション
        </Link>
        <Link
          href="/profile"
          className="flex flex-col items-center text-sm text-gray-600 hover:text-blue-600"
        >
          <User className={iconClass} />
          プロフィール
        </Link>
        <Link
          href="/share/select"
          className="flex flex-col items-center text-sm text-gray-600 hover:text-blue-600"
        >
          <ShareIcon className={iconClass} />
          コード共有
        </Link>
      </div>
    </nav>
  );
};
