import '@fontsource/lilita-one/latin-400.css';
import '@fontsource/nunito/latin-600.css';
import '@fontsource/nunito/latin-700.css';
import '@fontsource/nunito/latin-900.css';
import './globals.css';
import './hups.css';
export const metadata={title:'Hups! — pienet pelit, iso ilo',description:'Lähes sata pientä taitopeliä puhelimelle. Haasta itsesi ja kaverisi.'};
export const viewport={width:'device-width',initialScale:1,viewportFit:'cover',themeColor:'#141418'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="fi"><body>{children}</body></html>;}
