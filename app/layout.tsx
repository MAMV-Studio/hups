import '@fontsource/lilita-one/latin-400.css';
import '@fontsource/nunito/latin-600.css';
import '@fontsource/nunito/latin-700.css';
import '@fontsource/nunito/latin-900.css';
import './globals.css';
import './hups.css';
export const metadata={title:'Hups! — pienet pelit, iso ilo',description:'Yli sata pientä taitopeliä puhelimelle. Haasta itsesi ja kaverisi.',applicationName:'Hups!',manifest:'/manifest.webmanifest',icons:{icon:[{url:'/hups-favicon-32.png',sizes:'32x32',type:'image/png'},{url:'/hups-icon-192.png',sizes:'192x192',type:'image/png'}],apple:[{url:'/hups-apple-touch-icon.png',sizes:'180x180',type:'image/png'}]}};
export const viewport={width:'device-width',initialScale:1,viewportFit:'cover',themeColor:'#141418'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="fi"><body>{children}</body></html>;}
