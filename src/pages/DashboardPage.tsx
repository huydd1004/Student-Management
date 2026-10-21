import {
    ClipboardCheck,
    Clock3,
    UserMinus,
    Users,
} from 'lucide-react'
import { QuickActions } from '../components/dashboard/QuickActions'
import { StatCard } from '../components/dashboard/StatCard'

export function DashboardPage() {
    return (
        <main className='p-5 md:p-8'>
            <section className='rounded-3xl border border-pink-100 bg-white p-6 shadow-sm'>
                <p className='text-sm font-semibold text-lotus-600'>
                    BẢNG ĐIỀU KHIỂN
                </p>

                <h2 className='mt-2 text-2xl font-bold text-slate-900'>
                    Chào mừng bạn trở lại
                </h2>

                <p className='mt-2 max-w-2xl leading-7 text-slate-600'>
                    Đây sẽ là nơi hiển thị sĩ số, tình hình điểm danh và các thao tác thường dùng của lớp.
                </p>
            </section>

            <section className='mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4'
                     aria-label='Thống kê lớp học'>
                    
                    <StatCard
                        title='Sĩ số'
                        value={43}
                        description='Tổng số học sinh'
                        icon={Users}
                        tone='pink' />

                    <StatCard
                        title='Có mặt'
                        value={0}
                        description='Học sinh có mặt hôm nay'
                        icon={ClipboardCheck}
                        tone='green' />
                    
                    <StatCard
                        title='Vắng mặt'
                        value={0}
                        description='Học sinh vắng hôm nay'
                        icon={UserMinus}
                        tone='red' />

                    <StatCard
                        title='Chưa điểm danh'
                        value={43}
                        description='Cần hoàn thành điểm danh'
                        icon={Clock3}
                        tone='amber' />
            </section>

            <QuickActions />
        </main>
    )
}