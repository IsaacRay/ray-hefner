
"use client"
import Image from "next/image";
import { useRouter } from 'next/navigation';
import styles from "./page.module.css";
import {ColtonDemerit, ColtonStar, FamilyRoomLight, IsaacGarage, KathrynGarage, Logging} from "./buttons";
import Link from 'next/link';


export default function Home() {
  const router = useRouter();
  //check if the page's query string equals "kice"
  if (typeof window !== 'undefined' && window.location.search === "?p=kice") {
    //if it does, redirect to the groceries page
  return (

    <main className={styles.main}>
        <div className={styles.buttons}>
        <p>
        < IsaacGarage />
       </p>
       <p>
        < KathrynGarage />
        </p><p>
        <FamilyRoomLight />
        </p>
        <p><Logging /></p>
<p>
        <Link href="/groceries">
        <button style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer' }}>
          Groceries
        </button>
      </Link>
      </p>
        </div>
    </main>
  );
}else{
  router.push('/pattern');
}
}


