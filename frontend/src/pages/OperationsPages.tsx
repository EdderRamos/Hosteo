import { useParams } from 'react-router'
import { RolePage } from '../features/operations/ui'
import { BookingCreate, BookingList, BookingDetail } from '../features/operations/BookingFlow'
import { Calendar } from '../features/operations/Calendar'
import { Overview } from '../features/operations/Overview'
import { PaymentList } from '../features/operations/Payments'

export function GuestPropertyBookingPage() { const { id = '' } = useParams(); return <RolePage role="GUEST">{token => <BookingCreate key={id} token={token} />}</RolePage> }
export function GuestBookingsPage() { return <RolePage role="GUEST">{token => <BookingList token={token} role="GUEST" />}</RolePage> }
export function HostBookingsPage() { return <RolePage role="HOST">{token => <BookingList token={token} role="HOST" />}</RolePage> }
export function AdminBookingsPage() { return <RolePage role="ADMINISTRATOR">{token => <BookingList token={token} role="ADMINISTRATOR" />}</RolePage> }
export function GuestBookingDetailPage() { return <RolePage role="GUEST">{token => <BookingDetail token={token} role="GUEST" />}</RolePage> }
export function HostBookingDetailPage() { return <RolePage role="HOST">{token => <BookingDetail token={token} role="HOST" />}</RolePage> }
export function AdminBookingDetailPage() { return <RolePage role="ADMINISTRATOR">{token => <BookingDetail token={token} role="ADMINISTRATOR" />}</RolePage> }
export function HostCalendarPage() { const { id = '' } = useParams(); return <RolePage role="HOST">{token => <Calendar key={id} token={token} role="HOST" />}</RolePage> }
export function AdminCalendarPage() { const { id = '' } = useParams(); return <RolePage role="ADMINISTRATOR">{token => <Calendar key={id} token={token} role="ADMINISTRATOR" />}</RolePage> }
export function HostOperationsPage() { return <RolePage role="HOST">{token => <Overview token={token} role="HOST" />}</RolePage> }
export function AdminOperationsPage() { return <RolePage role="ADMINISTRATOR">{token => <Overview token={token} role="ADMINISTRATOR" />}</RolePage> }
export function AdminPaymentsPage() { return <RolePage role="ADMINISTRATOR">{token => <PaymentList token={token} />}</RolePage> }
