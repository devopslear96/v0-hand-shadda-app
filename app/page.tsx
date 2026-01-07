import Link from "next/link"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PlayCircle, BarChart3, Users } from "lucide-react"

export default function HomePage() {
  return (
    <main className="min-h-dvh bg-background p-4 flex flex-col">
      {/* Header */}
      <header className="text-center py-8">
        <h1 className="text-4xl font-bold text-primary mb-2">هاند شِدّة</h1>
        <p className="text-muted-foreground">تتبع نقاط اللعبة</p>
      </header>

      {/* Main Actions */}
      <div className="flex-1 flex flex-col gap-4 max-w-md mx-auto w-full">
        <Link href="/new-game" className="block">
          <Card className="bg-card border-border hover:border-primary transition-colors cursor-pointer">
            <CardHeader className="pb-2">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-2">
                <PlayCircle className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-xl">لعبة جديدة</CardTitle>
              <CardDescription>ابدأ لعبة جديدة مع ٤ لاعبين</CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/statistics" className="block">
          <Card className="bg-card border-border hover:border-primary transition-colors cursor-pointer">
            <CardHeader className="pb-2">
              <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center mb-2">
                <BarChart3 className="w-6 h-6 text-success" />
              </div>
              <CardTitle className="text-xl">الإحصائيات</CardTitle>
              <CardDescription>عرض سجل الألعاب والإحصائيات</CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/players" className="block">
          <Card className="bg-card border-border hover:border-primary transition-colors cursor-pointer">
            <CardHeader className="pb-2">
              <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center mb-2">
                <Users className="w-6 h-6 text-accent" />
              </div>
              <CardTitle className="text-xl">اللاعبون</CardTitle>
              <CardDescription>إدارة قائمة اللاعبين</CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>

      {/* Footer */}
      <footer className="text-center py-4 text-muted-foreground text-sm">٧ جولات • ٤ لاعبين • الأعلى نقاطاً يخسر</footer>
    </main>
  )
}
