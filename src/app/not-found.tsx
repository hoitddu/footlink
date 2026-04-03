import Link from "next/link";

import { MobileShell } from "@/components/app/mobile-shell";
import { SectionHeading } from "@/components/app/section-heading";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <MobileShell className="flex min-h-[80vh] flex-col justify-center">
      <section className="surface-card rounded-[2rem] p-6">
        <SectionHeading
          eyebrow="404"
          title="찾으시는 경기를 확인할 수 없어요"
          description="이미 마감되었거나 잘못된 링크일 수 있습니다. 홈 피드에서 다시 골라보세요."
        />
        <div className="mt-5">
          <Button asChild>
            <Link href="/home">홈으로 돌아가기</Link>
          </Button>
        </div>
      </section>
    </MobileShell>
  );
}
