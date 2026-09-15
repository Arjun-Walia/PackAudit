import { ReviewScreen } from '@/components/officer/Screens';
export default async function Page({params}: {params:Promise<{id:string}>}) { const {id}=await params; return <ReviewScreen key={id} id={id}/>; }
