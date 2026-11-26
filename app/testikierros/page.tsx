import {cookies} from 'next/headers';
import {redirect} from 'next/navigation';
import {adminValid} from '../../server/play-stats';
import {ReviewRunner} from './review-runner';
export const dynamic='force-dynamic';
export default async function ReviewPage(){
 const jar=await cookies();
 const request=new Request('http://hups.local/testikierros',{headers:{cookie:jar.toString()}});
 if(!adminValid(request))redirect('/tilastot');
 return <ReviewRunner/>;
}
