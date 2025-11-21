import SidebarNav from '@/components/mywork/SidebarNav'

export default function NTKLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      <SidebarNav />
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}

